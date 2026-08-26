export type DoomInput =
  | "forward"
  | "backward"
  | "turnLeft"
  | "turnRight"
  | "strafeLeft"
  | "strafeRight"
  | "fire"
  | "use"
  | "run"
  | "map"
  | "menu"
  | "confirm";

interface DoomWasmExports {
  memory: WebAssembly.Memory;
  initGame(): void;
  tickGame(): void;
  reportKeyDown(key: number): void;
  reportKeyUp(key: number): void;
  KEY_DOWNARROW: WebAssembly.Global | number;
  KEY_ENTER: WebAssembly.Global | number;
  KEY_ESCAPE: WebAssembly.Global | number;
  KEY_FIRE: WebAssembly.Global | number;
  KEY_LEFTARROW: WebAssembly.Global | number;
  KEY_RIGHTARROW: WebAssembly.Global | number;
  KEY_SHIFT: WebAssembly.Global | number;
  KEY_STRAFE_L: WebAssembly.Global | number;
  KEY_STRAFE_R: WebAssembly.Global | number;
  KEY_TAB: WebAssembly.Global | number;
  KEY_UPARROW: WebAssembly.Global | number;
  KEY_USE: WebAssembly.Global | number;
}

export interface DoomRuntime {
  press(input: DoomInput): void;
  release(input: DoomInput): void;
  destroy(): void;
}

interface DoomRuntimeOptions {
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
}

const DOOM_WASM_URL = "/doom/doom.wasm";
const DOOM_TICK_RATE = 35;
const MIN_INPUT_PRESS_MS = 70;

function exportedNumber(value: WebAssembly.Global | number): number {
  return typeof value === "number" ? value : Number(value.value);
}

function decodeMemory(
  memory: WebAssembly.Memory | null,
  pointer: number,
  length: number,
): string {
  if (!memory) return "";
  return new TextDecoder().decode(
    new Uint8Array(memory.buffer, pointer, length),
  );
}

async function instantiateDoom(
  imports: WebAssembly.Imports,
  signal?: AbortSignal,
): Promise<WebAssembly.Instance> {
  const response = await fetch(DOOM_WASM_URL, { signal });
  if (!response.ok) {
    throw new Error(`Doom motoru indirilemedi (${response.status}).`);
  }

  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      return (await WebAssembly.instantiateStreaming(response.clone(), imports))
        .instance;
    } catch {
      // mime yedeği
    }
  }

  return (await WebAssembly.instantiate(await response.arrayBuffer(), imports))
    .instance;
}

export async function createDoomRuntime({
  canvas,
  signal,
}: DoomRuntimeOptions): Promise<DoomRuntime> {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Doom görüntüsü için Canvas 2D kullanılamıyor.");

  let memory: WebAssembly.Memory | null = null;
  let frameImage: ImageData | null = null;

  const imports: WebAssembly.Imports = {
    loading: {
      onGameInit(width: number, height: number) {
        canvas.width = width;
        canvas.height = height;
        frameImage = context.createImageData(width, height);
      },
      wadSizes() {},
      readWads() {},
    },
    ui: {
      drawFrame(frameBufferPtr: number) {
        if (!memory || !frameImage) return;
        const source = new Uint8Array(
          memory.buffer,
          frameBufferPtr,
          canvas.width * canvas.height * 4,
        );
        const target = frameImage.data;
        for (let index = 0; index < target.length; index += 4) {
          target[index] = source[index + 2];
          target[index + 1] = source[index + 1];
          target[index + 2] = source[index];
          target[index + 3] = 255;
        }
        context.putImageData(frameImage, 0, 0);
      },
    },
    runtimeControl: {
      timeInMilliseconds: () => BigInt(Math.trunc(performance.now())),
    },
    console: {
      onInfoMessage() {},
      onErrorMessage(pointer: number, length: number) {
        const message = decodeMemory(memory, pointer, length).trim();
        if (message) console.error(`[Doom] ${message}`);
      },
    },
    gameSaving: {
      sizeOfSaveGame: () => 0,
      readSaveGame: () => 0,
      writeSaveGame: () => 0,
    },
  };

  const instance = await instantiateDoom(imports, signal);
  if (signal?.aborted) throw new DOMException("Doom yüklemesi iptal edildi.", "AbortError");

  const doom = instance.exports as unknown as DoomWasmExports;
  memory = doom.memory;

  const inputKeys: Record<DoomInput, number> = {
    forward: exportedNumber(doom.KEY_UPARROW),
    backward: exportedNumber(doom.KEY_DOWNARROW),
    turnLeft: exportedNumber(doom.KEY_LEFTARROW),
    turnRight: exportedNumber(doom.KEY_RIGHTARROW),
    strafeLeft: exportedNumber(doom.KEY_STRAFE_L),
    strafeRight: exportedNumber(doom.KEY_STRAFE_R),
    fire: exportedNumber(doom.KEY_FIRE),
    use: exportedNumber(doom.KEY_USE),
    run: exportedNumber(doom.KEY_SHIFT),
    map: exportedNumber(doom.KEY_TAB),
    menu: exportedNumber(doom.KEY_ESCAPE),
    confirm: exportedNumber(doom.KEY_ENTER),
  };

  const browserKeys = new Map<string, number>([
    ["w", inputKeys.forward],
    ["s", inputKeys.backward],
    ["a", inputKeys.turnLeft],
    ["d", inputKeys.turnRight],
    ["q", inputKeys.strafeLeft],
    ["e", inputKeys.strafeRight],
    ["ArrowUp", inputKeys.forward],
    ["ArrowDown", inputKeys.backward],
    ["ArrowLeft", inputKeys.turnLeft],
    ["ArrowRight", inputKeys.turnRight],
    ["Control", inputKeys.fire],
    ["f", inputKeys.fire],
    [" ", inputKeys.use],
    ["Shift", inputKeys.run],
    ["Tab", inputKeys.map],
    ["Escape", inputKeys.menu],
    ["Enter", inputKeys.confirm],
  ]);
  const pressed = new Set<number>();
  const pressedAt = new Map<number, number>();
  const releaseTimers = new Map<number, number>();

  const releaseKeyNow = (key: number) => {
    const pendingRelease = releaseTimers.get(key);
    if (pendingRelease != null) window.clearTimeout(pendingRelease);
    releaseTimers.delete(key);
    pressedAt.delete(key);
    if (!pressed.delete(key)) return;
    doom.reportKeyUp(key);
  };

  const pressKey = (key: number) => {
    const pendingRelease = releaseTimers.get(key);
    if (pendingRelease != null) {
      window.clearTimeout(pendingRelease);
      releaseTimers.delete(key);
    }
    pressedAt.set(key, performance.now());
    if (pressed.has(key)) return;
    pressed.add(key);
    doom.reportKeyDown(key);
  };
  const releaseKey = (key: number) => {
    if (!pressed.has(key) || releaseTimers.has(key)) return;
    const elapsed = performance.now() - (pressedAt.get(key) ?? 0);
    const remaining = MIN_INPUT_PRESS_MS - elapsed;
    if (remaining <= 0) {
      releaseKeyNow(key);
      return;
    }
    const pendingRelease = window.setTimeout(
      () => releaseKeyNow(key),
      remaining,
    );
    releaseTimers.set(key, pendingRelease);
  };
  const releaseAll = () => {
    for (const pendingRelease of releaseTimers.values()) {
      window.clearTimeout(pendingRelease);
    }
    releaseTimers.clear();
    pressedAt.clear();
    for (const key of pressed) doom.reportKeyUp(key);
    pressed.clear();
  };
  const keyboardKey = (event: KeyboardEvent) => {
    const normalized = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const mapped = browserKeys.get(normalized);
    if (mapped != null) return mapped;
    if (normalized.length === 1) return normalized.charCodeAt(0);
    return null;
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const key = keyboardKey(event);
    if (key == null) return;
    event.preventDefault();
    event.stopPropagation();
    pressKey(key);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    const key = keyboardKey(event);
    if (key == null) return;
    event.preventDefault();
    event.stopPropagation();
    releaseKey(key);
  };

  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("blur", releaseAll);

  doom.initGame();
  let destroyed = false;
  const timer = window.setInterval(() => {
    if (!destroyed && !document.hidden) doom.tickGame();
  }, 1000 / DOOM_TICK_RATE);

  return {
    press: (input) => pressKey(inputKeys[input]),
    release: (input) => releaseKey(inputKeys[input]),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.clearInterval(timer);
      releaseAll();
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("blur", releaseAll);
    },
  };
}
