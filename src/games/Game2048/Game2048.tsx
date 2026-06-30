import "./Game2048.scss";
import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";


const SIZE = 4;
const GAP = 2.6;
const CELL = (100 - (SIZE - 1) * GAP) / SIZE;
const cellPos = (i: number) => i * (CELL + GAP);
const SWIPE_MIN = 18;


const TILE_THEME: Record<
  number,
  { bg: string; color: string; shadow: string }
> = {
  2: { bg: "#fdeef4", color: "#c081a0", shadow: "rgba(192,129,160,0.18)" },
  4: { bg: "#fbe0ec", color: "#b8708f", shadow: "rgba(184,112,143,0.2)" },
  8: { bg: "#f9c9e0", color: "#fff", shadow: "rgba(232,140,185,0.35)" },
  16: { bg: "#f4abd2", color: "#fff", shadow: "rgba(232,120,180,0.4)" },
  32: { bg: "#dd9ad8", color: "#fff", shadow: "rgba(200,120,200,0.42)" },
  64: { bg: "#bd97e0", color: "#fff", shadow: "rgba(170,120,224,0.45)" },
  128: { bg: "#9d8fe6", color: "#fff", shadow: "rgba(135,120,224,0.48)" },
  256: { bg: "#85a3ec", color: "#fff", shadow: "rgba(110,150,232,0.5)" },
  512: { bg: "#74bce4", color: "#fff", shadow: "rgba(90,180,224,0.5)" },
  1024: { bg: "#6fd0c2", color: "#fff", shadow: "rgba(90,200,184,0.52)" },
  2048: { bg: "#ffce6e", color: "#fff", shadow: "rgba(255,196,90,0.6)" },
  4096: { bg: "#ffb066", color: "#fff", shadow: "rgba(255,150,80,0.6)" },
  8192: { bg: "#ff8f80", color: "#fff", shadow: "rgba(255,120,110,0.6)" },
};
const themeFor = (v: number) => TILE_THEME[v] || TILE_THEME[8192];
const fontFor = (v: number) =>
  v < 100
    ? "clamp(26px,9vw,42px)"
    : v < 1000
      ? "clamp(22px,7.5vw,36px)"
      : "clamp(17px,5.8vw,28px)";

let TILE_ID = 1;

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  merged?: boolean;
}
type Dir = "up" | "down" | "left" | "right";

function emptyCells(tiles: Tile[]): [number, number][] {
  const occ = new Set(tiles.map((t) => `${t.row}-${t.col}`));
  const out: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (!occ.has(`${r}-${c}`)) out.push([r, c]);
  return out;
}
function spawnTile(tiles: Tile[]): Tile[] {
  const cells = emptyCells(tiles);
  if (!cells.length) return tiles;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  return [
    ...tiles,
    {
      id: TILE_ID++,
      value: Math.random() < 0.9 ? 2 : 4,
      row: r,
      col: c,
      isNew: true,
    },
  ];
}
function initBoard(): Tile[] {
  let t: Tile[] = [];
  t = spawnTile(t);
  t = spawnTile(t);
  return t;
}

interface MoveResult {
  tiles: Tile[];
  moved: boolean;
  scoreGain: number;
  mergedValues: number[];
  mergeCount: number;
}

function move(tiles: Tile[], dir: Dir): MoveResult {
  const grid: (Tile | null)[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null),
  );
  tiles.forEach((t) => {
    grid[t.row][t.col] = { ...t, isNew: false, merged: false };
  });

  let moved = false,
    scoreGain = 0,
    mergeCount = 0;
  const mergedValues: number[] = [];

  const getLine = (i: number): (Tile | null)[] => {
    const line: (Tile | null)[] = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === "left") line.push(grid[i][j]);
      else if (dir === "right") line.push(grid[i][SIZE - 1 - j]);
      else if (dir === "up") line.push(grid[j][i]);
      else line.push(grid[SIZE - 1 - j][i]);
    }
    return line;
  };
  const setLine = (i: number, line: (Tile | null)[]) => {
    for (let j = 0; j < SIZE; j++) {
      let r: number, c: number;
      if (dir === "left") {
        r = i;
        c = j;
      } else if (dir === "right") {
        r = i;
        c = SIZE - 1 - j;
      } else if (dir === "up") {
        r = j;
        c = i;
      } else {
        r = SIZE - 1 - j;
        c = i;
      }
      const tile = line[j];
      if (tile) {
        tile.row = r;
        tile.col = c;
      }
      grid[r][c] = tile;
    }
  };

  for (let i = 0; i < SIZE; i++) {
    const line = getLine(i);
    const filled = line.filter((t): t is Tile => t !== null);
    const merged: (Tile | null)[] = [];
    let k = 0;
    while (k < filled.length) {
      if (k + 1 < filled.length && filled[k].value === filled[k + 1].value) {
        const v = filled[k].value * 2;
        merged.push({ ...filled[k], value: v, merged: true });
        scoreGain += v;
        mergeCount++;
        mergedValues.push(v);
        k += 2;
      } else {
        merged.push({ ...filled[k] });
        k += 1;
      }
    }
    while (merged.length < SIZE) merged.push(null);
    for (let j = 0; j < SIZE; j++) {
      const o = line[j],
        n = merged[j];
      if ((o?.id ?? null) !== (n?.id ?? null)) moved = true;
    }
    setLine(i, merged);
  }

  const result: Tile[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (grid[r][c]) result.push(grid[r][c]!);
  return { tiles: result, moved, scoreGain, mergedValues, mergeCount };
}

function canMove(tiles: Tile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  const g: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  tiles.forEach((t) => {
    g[t.row][t.col] = t.value;
  });
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && g[r][c] === g[r][c + 1]) return true;
      if (r + 1 < SIZE && g[r][c] === g[r + 1][c]) return true;
    }
  return false;
}

interface Ripple {
  id: number;
  dir: Dir;
}
interface SparkleFx {
  id: number;
  x: number;
  y: number;
  emoji: string;
  sx: number;
  sy: number;
}
interface FloatPts {
  id: number;
  x: number;
  y: number;
  text: string;
}

const COMBO_TIERS = [
  { min: 0, label: "", color: "#bcafd8" },
  { min: 2, label: "Güzel!", color: "#7ec47e" },
  { min: 4, label: "Süper!", color: "#5ab0e0" },
  { min: 6, label: "Harika!", color: "#a98ee6" },
  { min: 9, label: "Muhteşem!", color: "#e88cc0" },
  { min: 13, label: "İnanılmaz!", color: "#dca636" },
];
const comboTier = (n: number) =>
  COMBO_TIERS.reduce((b, t) => (n >= t.min ? t : b), COMBO_TIERS[0]);

export default function Game2048() {
  const [tiles, setTiles] = useState<Tile[]>(() => initBoard());
  const [history, setHistory] = useState<{ tiles: Tile[]; score: number }[]>(
    [],
  );
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem("game2048_best_score");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [scorePop, setScorePop] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("game2048_best_score", best.toString());
  }, [best]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [keepGoing, setKeepGoing] = useState(false);
  const [bump, setBump] = useState<Dir | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [sparkles, setSparkles] = useState<SparkleFx[]>([]);
  const [floatPts, setFloatPts] = useState<FloatPts[]>([]);
  const [combo, setCombo] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [reachedMax, setReachedMax] = useState(2);

  const lockRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tier = comboTier(combo);

  const restart = useCallback(() => {
    TILE_ID = 1;
    setTiles(initBoard());
    setHistory([]);
    setScore(0);
    setStatus("playing");
    setKeepGoing(false);
    setScorePop(null);
    setCombo(0);
    setReachedMax(2);
  }, []);

  const undo = useCallback(() => {
    if (!history.length || lockRef.current) return;
    const last = history[history.length - 1];
    setTiles(last.tiles);
    setScore(last.score);
    setHistory((h) => h.slice(0, -1));
    setStatus("playing");
    setCombo(0);
  }, [history]);

  const triggerEffects = useCallback(
    (dir: Dir, mergedValues: number[], mergeCount: number) => {
      setBump(dir);
      setTimeout(() => setBump(null), 400);
      const rid = Date.now();
      setRipples((p) => [...p, { id: rid, dir }]);
      setTimeout(() => setRipples((p) => p.filter((r) => r.id !== rid)), 520);

      if (mergeCount >= 1) {
        const maxMerge = Math.max(...mergedValues);
        const big = maxMerge >= 64 || mergeCount >= 2;
        if (big) {
          const emojis = ["✨", "⭐", "💫", "🌟", "💜"];
          const count = Math.min(8, 3 + mergeCount + (maxMerge >= 256 ? 3 : 0));
          const fx: SparkleFx[] = [];
          for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
            const d = 50 + Math.random() * 55;
            fx.push({
              id: Date.now() + i,
              x: 50,
              y: 50,
              sx: Math.cos(a) * d,
              sy: Math.sin(a) * d,
              emoji: emojis[Math.floor(Math.random() * emojis.length)],
            });
          }
          setSparkles(fx);
          setTimeout(() => setSparkles([]), 720);
        }
      }
    },
    [],
  );

  const doMove = useCallback(
    (dir: Dir) => {
      if (lockRef.current || status === "lost") return;
      if (status === "won" && !keepGoing) return;

      const result = move(tiles, dir);
      if (!result.moved) return;

      lockRef.current = true;
      setHistory((h) => [...h.slice(-9), { tiles, score }]);

      triggerEffects(dir, result.mergedValues, result.mergeCount);

      let newCombo = combo;
      if (result.mergeCount > 0) {
        newCombo = combo + result.mergeCount;
        setCombo(newCombo);
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setCombo(0), 3500);
      }

      const comboBonus =
        newCombo >= 4 ? Math.round(result.scoreGain * (newCombo / 10)) : 0;
      const totalGain = result.scoreGain + comboBonus;

      setTiles(result.tiles);

      if (totalGain > 0) {
        setScore((s) => {
          const ns = s + totalGain;
          setBest((b) => Math.max(b, ns));
          return ns;
        });
        setScorePop(totalGain);
        setTimeout(() => setScorePop(null), 800);

        result.tiles
          .filter((t) => t.merged)
          .forEach((t, i) => {
            const fid = Date.now() + i;
            const x = cellPos(t.col) + CELL / 2;
            const y = cellPos(t.row) + CELL / 2;
            setFloatPts((p) => [...p, { id: fid, x, y, text: `+${t.value}` }]);
            setTimeout(
              () => setFloatPts((p) => p.filter((f) => f.id !== fid)),
              850,
            );
          });
      }

      const maxVal = Math.max(...result.tiles.map((t) => t.value));
      if (maxVal > reachedMax && maxVal >= 128) {
        setReachedMax(maxVal);
        setMilestone(`${maxVal} karosu! 🎊`);
        setTimeout(() => setMilestone(null), 2200);
      } else if (maxVal > reachedMax) {
        setReachedMax(maxVal);
      }

      setTimeout(() => {
        setTiles((prev) => {
          const next = spawnTile(prev);
          if (!canMove(next))
            setStatus((st) => (st === "won" && keepGoing ? st : "lost"));
          return next;
        });
        lockRef.current = false;
      }, 125);

      if (!keepGoing && result.tiles.some((t) => t.value >= 2048))
        setStatus("won");
    },
    [tiles, status, keepGoing, triggerEffects, combo, score, reachedMax],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        undo();
        return;
      }
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doMove, undo]);

  // dokunma
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    swipedRef.current = false;
  };
  // kaydir
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || swipedRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    swipedRef.current = true;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };
  const onTouchEnd = () => {
    touchStart.current = null;
  };

  const rippleStyle = (dir: Dir): React.CSSProperties => {
    const b: React.CSSProperties = { width: "46%", height: "46%" };
    if (dir === "left") return { ...b, left: "-12%", top: "27%" };
    if (dir === "right") return { ...b, right: "-12%", top: "27%" };
    if (dir === "up") return { ...b, top: "-12%", left: "27%" };
    return { ...b, bottom: "-12%", left: "27%" };
  };

  const comboPct = Math.min(100, (combo / 13) * 100);

  return (
    <>
      {milestone && <div className="milestone">🎉 {milestone}</div>}

      <div className="g2-app">
        <div
          className="g2-orb"
          style={{
            top: "-8%",
            left: "3%",
            width: 340,
            height: 340,
            background: "#f7c4dc",
          }}
        />
        <div
          className="g2-orb"
          style={{
            bottom: "-12%",
            right: "-3%",
            width: 380,
            height: 380,
            background: "#c4d2f7",
          }}
        />
        <div
          className="g2-orb"
          style={{
            top: "42%",
            left: "62%",
            width: 240,
            height: 240,
            background: "#dcc4f7",
          }}
        />

        <div className="g2-content">
          <div className="g2-header">
            <div>
              <div className="g2-title">2048</div>
              <div className="g2-subtitle">Aynı sayıları birleştir</div>
            </div>
            <div className="g2-scores">
              <div className="score-box">
                <div className="score-label">Puan</div>
                <div className="score-value">
                  {score.toLocaleString("tr-TR")}
                </div>
                {scorePop != null && (
                  <div className="score-pop">+{scorePop}</div>
                )}
              </div>
              <div className="score-box best">
                <div className="score-label">En İyi</div>
                <div className="score-value">
                  {best.toLocaleString("tr-TR")}
                </div>
              </div>
            </div>
          </div>

          <div className="combo-strip">
            <div className="combo-label" style={{ color: tier.color }}>
              {combo >= 2 ? `${tier.label} ×${combo}` : "Kombo"}
            </div>
            <div className="combo-track">
              <div
                className="combo-fill"
                style={{ width: `${comboPct}%`, background: tier.color }}
              />
            </div>
          </div>

          <div className="g2-controls">
            <button
              className="g2-btn ghost"
              onClick={undo}
              disabled={!history.length}
            >
              ↶ Geri Al
            </button>
            <button className="g2-btn primary" onClick={restart}>
              ⟳ Yeni Oyun
            </button>
          </div>

          <div
            className={`board-shell${bump ? ` bump-${bump}` : ""}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            <div className="grid-bg">
              {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                const r = Math.floor(i / SIZE),
                  c = i % SIZE;
                return (
                  <div
                    key={i}
                    className="grid-cell"
                    style={{
                      left: `${cellPos(c)}%`,
                      top: `${cellPos(r)}%`,
                      width: `${CELL}%`,
                      height: `${CELL}%`,
                    }}
                  />
                );
              })}
            </div>

            <div className="tiles-layer">
              {ripples.map((r) => (
                <div key={r.id} className="ripple" style={rippleStyle(r.dir)} />
              ))}

              {tiles.map((t) => {
                const th = themeFor(t.value);
                let cls = "tile";
                if (t.isNew) cls += " spawn";
                if (t.merged) cls += " merged";
                return (
                  <div
                    key={t.id}
                    className={cls}
                    style={{
                      left: `${cellPos(t.col)}%`,
                      top: `${cellPos(t.row)}%`,
                      width: `${CELL}%`,
                      height: `${CELL}%`,
                      transition:
                        "left 0.13s cubic-bezier(0.34,1.1,0.5,1), top 0.13s cubic-bezier(0.34,1.1,0.5,1)",
                      zIndex: t.merged ? 10 : Math.min(t.value, 9),
                    }}
                  >
                    <div
                      className="tile-inner"
                      style={{
                        background: th.bg,
                        color: th.color,
                        fontSize: fontFor(t.value),
                        boxShadow: `0 3px 10px ${th.shadow}, inset 0 2px 4px rgba(255,255,255,0.4)`,
                      }}
                    >
                      {t.value}
                    </div>
                  </div>
                );
              })}

              {sparkles.map((s) => (
                <span
                  key={s.id}
                  className="sparkle"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    fontSize: 17,
                    ["--sx" as string]: `${s.sx}px`,
                    ["--sy" as string]: `${s.sy}px`,
                  }}
                >
                  {s.emoji}
                </span>
              ))}

              {floatPts.map((f) => (
                <span
                  key={f.id}
                  className="float-pts"
                  style={{ left: `${f.x}%`, top: `${f.y}%` }}
                >
                  {f.text}
                </span>
              ))}
            </div>

            {status === "won" && !keepGoing && (
              <div className="g2-overlay win">
                <div className="overlay-emoji">🎉</div>
                <div className="overlay-title">2048!</div>
                <div className="overlay-sub">
                  Başardın! Daha büyük karolar için devam et.
                </div>
                <div className="overlay-btns">
                  <button
                    className="overlay-btn primary"
                    onClick={() => setKeepGoing(true)}
                  >
                    Devam Et
                  </button>
                  <button className="overlay-btn ghost" onClick={restart}>
                    Yeni Oyun
                  </button>
                </div>
              </div>
            )}

            {status === "lost" && (
              <div className="g2-overlay lose">
                <div className="overlay-emoji">🍃</div>
                <div className="overlay-title">Oyun Bitti</div>
                <div className="overlay-sub">
                  Hamle kalmadı, {score.toLocaleString("tr-TR")} puan topladın!
                </div>
                <div className="overlay-btns">
                  <button className="overlay-btn primary" onClick={restart}>
                    Tekrar Oyna
                  </button>
                  {history.length > 0 && (
                    <button className="overlay-btn ghost" onClick={undo}>
                      ↶ Geri Al
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="g2-hint">
            <span className="key-cap">↑</span>
            <span className="key-cap">↓</span>
            <span className="key-cap">←</span>
            <span className="key-cap">→</span> /{" "}
            <span className="key-cap">WASD</span> ile oyna ·{" "}
            <span className="key-cap">Z</span> geri al · mobilde kaydır
          </div>
        </div>
      </div>
    </>
  );
}
