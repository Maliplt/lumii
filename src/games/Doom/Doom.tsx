import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2,
  Play,
} from "lucide-react";
import doomImage from "../../assets/images/doom.svg";
import ActionButton from "../../components/ui/ActionButton";
import OptimizedImage from "../../components/ui/OptimizedImage";
import Spinner from "../../components/ui/Spinner";
import StateView from "../../components/feedback/StateView";
import {
  createDoomRuntime,
  type DoomInput,
  type DoomRuntime,
} from "./doomRuntime";
import "./Doom.scss";

type GamePhase = "idle" | "loading" | "running" | "error";

interface DoomControlButtonProps {
  runtime: DoomRuntime | null;
  input: DoomInput;
  label: string;
  className?: string;
  children: ReactNode;
}

function DoomControlButton({ runtime, input, label, className = "", children }: DoomControlButtonProps) {
  const release = () => runtime?.release(input);
  const press = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // eski tarayıcı yedeği
    }
    runtime?.press(input);
  };

  return (
    <ActionButton
      className={`doom-touch-button${className ? ` ${className}` : ""}`}
      label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </ActionButton>
  );
}

export default function Doom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<DoomRuntime | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [runtime, setRuntime] = useState<DoomRuntime | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      runtimeRef.current?.destroy();
    },
    [],
  );

  const startGame = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    abortRef.current?.abort();
    runtimeRef.current?.destroy();
    const controller = new AbortController();
    abortRef.current = controller;
    runtimeRef.current = null;
    setRuntime(null);
    setErrorMessage("");
    setPhase("loading");

    try {
      const nextRuntime = await createDoomRuntime({ canvas, signal: controller.signal });
      if (controller.signal.aborted) {
        nextRuntime.destroy();
        return;
      }
      runtimeRef.current = nextRuntime;
      setRuntime(nextRuntime);
      setPhase("running");
      requestAnimationFrame(() => canvas.focus());
    } catch (error) {
      if (controller.signal.aborted) return;
      setErrorMessage(error instanceof Error ? error.message : "Doom başlatılamadı.");
      setPhase("error");
    }
  };

  const enterFullscreen = async () => {
    try {
      await stageRef.current?.requestFullscreen();
      canvasRef.current?.focus();
    } catch {
      setErrorMessage("Tam ekran modu bu tarayıcıda açılamadı.");
    }
  };

  const fireWithPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phase !== "running" || event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // eski tarayıcı yedeği
    }
    runtime?.press("fire");
  };

  const stopPointerFire = () => runtime?.release("fire");

  return (
    <section className="doom-game" aria-label="Doom oyunu">
      <div className="doom-toolbar">
        <h1>Doom</h1>
        {phase === "running" && (
          <ActionButton className="doom-toolbar-button" label="Tam ekran" onClick={enterFullscreen}>
            <Maximize2 size={18} />
            <span>Tam Ekran</span>
          </ActionButton>
        )}
      </div>

      <div ref={stageRef} className="doom-stage">
        <canvas
          ref={canvasRef}
          className="doom-canvas"
          tabIndex={0}
          aria-label="Doom oyun ekranı"
          onPointerDown={fireWithPointer}
          onPointerUp={stopPointerFire}
          onPointerCancel={stopPointerFire}
          onLostPointerCapture={stopPointerFire}
          onContextMenu={(event) => event.preventDefault()}
        />

        {phase === "idle" && (
          <div className="doom-launcher">
            <OptimizedImage
              src={doomImage}
              alt="Doom"
              className="doom-launcher__image"
              priority
            />
            <ActionButton className="doom-start-button" label="Doom'u başlat" onClick={startGame}>
              <Play size={20} fill="currentColor" />
              Oyunu Başlat
            </ActionButton>
          </div>
        )}

        {phase === "loading" && (
          <div className="doom-loading">
            <Spinner inline variant="player" />
            <p>Oyun hazırlanıyor…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="doom-error">
            <StateView
              variant="error"
              compact
              role="alert"
              title="Doom başlatılamadı"
              description={errorMessage}
              action={
                <ActionButton className="doom-retry-button" label="Doom'u yeniden dene" onClick={startGame}>
                  Tekrar Dene
                </ActionButton>
              }
            />
          </div>
        )}

        {phase === "running" && (
          <div className="doom-mobile-controls" aria-label="Mobil Doom gamepad kontrolleri">
            <div className="doom-dpad" aria-label="Hareket kontrolleri">
              <DoomControlButton runtime={runtime} input="forward" label="İleri"><ChevronUp /></DoomControlButton>
              <DoomControlButton runtime={runtime} input="turnLeft" label="Sola dön"><ChevronLeft /></DoomControlButton>
              <DoomControlButton runtime={runtime} input="backward" label="Geri"><ChevronDown /></DoomControlButton>
              <DoomControlButton runtime={runtime} input="turnRight" label="Sağa dön"><ChevronRight /></DoomControlButton>
            </div>

            <div className="doom-face-pad" aria-label="Aksiyon kontrolleri">
              <DoomControlButton runtime={runtime} input="map" label="Haritayı aç" className="is-triangle"><span aria-hidden="true">△</span></DoomControlButton>
              <DoomControlButton runtime={runtime} input="fire" label="Ateş et" className="is-square"><span aria-hidden="true">□</span></DoomControlButton>
              <DoomControlButton runtime={runtime} input="run" label="Koş" className="is-circle"><span aria-hidden="true">○</span></DoomControlButton>
              <DoomControlButton runtime={runtime} input="use" label="Kullan veya kapıyı aç" className="is-cross"><span aria-hidden="true">×</span></DoomControlButton>
            </div>

            <div className="doom-system-controls" aria-label="Menü kontrolleri">
              <DoomControlButton runtime={runtime} input="confirm" label="Seç"><span>SELECT</span></DoomControlButton>
              <DoomControlButton runtime={runtime} input="menu" label="Menüyü aç veya kapat"><span>OPTIONS</span></DoomControlButton>
            </div>
          </div>
        )}
      </div>

      <div className="doom-help">
        <p>
          <strong>WASD</strong> hareket · <strong>Sol tık/Ctrl/F</strong> ateş ·{" "}
          <strong>Space</strong> kullan · <strong>Shift</strong> koş · <strong>Enter</strong> seç
        </p>
      </div>
    </section>
  );
}
