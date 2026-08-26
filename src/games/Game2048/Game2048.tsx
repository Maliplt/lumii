import "./Game2048.scss";
import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";


const SIZE = 4;
const SWIPE_MIN = 18;

const tileThemeValue = (value: number) => Math.min(value, 8192);

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
  slot: number;
  emoji: string;
}
interface FloatPts {
  id: number;
  row: number;
  col: number;
  text: string;
}

const COMBO_TIERS = [
  { min: 0, label: "" },
  { min: 2, label: "Güzel!" },
  { min: 4, label: "Süper!" },
  { min: 6, label: "Harika!" },
  { min: 9, label: "Muhteşem!" },
  { min: 13, label: "İnanılmaz!" },
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
            fx.push({
              id: Date.now() + i,
              slot: i,
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
            setFloatPts((p) => [
              ...p,
              { id: fid, row: t.row, col: t.col, text: `+${t.value}` },
            ]);
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

  const comboPct = Math.min(100, (combo / 13) * 100);
  const tierIndex = COMBO_TIERS.indexOf(tier);

  return (
    <>
      {milestone && <div className="milestone">🎉 {milestone}</div>}

      <div className="g2-app">
        <div className="g2-orb g2-orb--pink" />
        <div className="g2-orb g2-orb--blue" />
        <div className="g2-orb g2-orb--purple" />

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
            <div className={`combo-label combo-tier-${tierIndex}`}>
              {combo >= 2 ? `${tier.label} ×${combo}` : "Kombo"}
            </div>
            <div className="combo-track">
              <div
                className={`combo-fill combo-tier-${tierIndex} progress-${Math.round(comboPct)}`}
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
                    className={`grid-cell grid-row-${r} grid-col-${c}`}
                  />
                );
              })}
            </div>

            <div className="tiles-layer">
              {ripples.map((r) => (
                <div key={r.id} className={`ripple ripple--${r.dir}`} />
              ))}

              {tiles.map((t) => {
                let cls = "tile";
                if (t.isNew) cls += " spawn";
                if (t.merged) cls += " merged";
                cls += ` grid-row-${t.row} grid-col-${t.col}`;
                cls += ` tile-z-${t.merged ? 10 : Math.min(t.value, 9)}`;
                return (
                  <div
                    key={t.id}
                    className={cls}
                  >
                    <div
                      className={`tile-inner tile-value-${tileThemeValue(t.value)}`}
                    >
                      {t.value}
                    </div>
                  </div>
                );
              })}

              {sparkles.map((s) => (
                <span
                  key={s.id}
                  className={`sparkle sparkle--${s.slot}`}
                >
                  {s.emoji}
                </span>
              ))}

              {floatPts.map((f) => (
                <span
                  key={f.id}
                  className={`float-pts float-row-${f.row} float-col-${f.col}`}
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
