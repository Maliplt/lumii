import "./KelimeZinciri.scss";
import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";


// Sözlük (~45K kelime) ayrı bir chunk olarak lazy yüklenir; oyun shell'i
// hemen render olsun, dev sözlük dosyası oyun chunk'ını şişirmesin diye.
interface Dict {
  allWords: string[];
  wordSet: Set<string>;
  byFirst: Record<string, string[]>;
}
let DICT: Dict | null = null;
let dictPromise: Promise<Dict> | null = null;
function loadDict(): Promise<Dict> {
  if (DICT) return Promise.resolve(DICT);
  if (!dictPromise) {
    dictPromise = import("../libraries/sozluk").then((m) => {
      const byFirst: Record<string, string[]> = {};
      for (const w of m.TURKISH_WORDS) (byFirst[w[0]] ||= []).push(w);
      DICT = {
        allWords: m.TURKISH_WORDS,
        wordSet: m.TURKISH_WORD_SET,
        byFirst,
      };
      return DICT;
    });
  }
  return dictPromise;
}

const normalize = (w: string) => w.toLocaleUpperCase("tr-TR");
const lastLetter = (w: string) => w[w.length - 1];
const firstLetter = (w: string) => w[0];

const wordsStartingWith = (letter: string, used: Set<string>) =>
  (DICT?.byFirst[letter] || []).filter((w) => !used.has(w));
const letterDifficulty = (letter: string, used: Set<string>) => {
  const pool = DICT?.byFirst[letter];
  if (!pool) return 0;
  let n = 0;
  for (const w of pool) if (!used.has(w)) n++;
  return n;
};

const MODES = {
  endless: {
    label: "Sonsuz",
    emoji: "♾️",
    desc: "Tek hata = oyun biter",
    color: "#ff7a59",
  },
  duel: {
    label: "Düello",
    emoji: "⚔️",
    desc: "3 can, AI'yı yen",
    color: "#7c5cff",
  },
  zen: {
    label: "Zen",
    emoji: "🍃",
    desc: "Süre yok, sakin oyna",
    color: "#2bc7a4",
  },
} as const;
type Mode = keyof typeof MODES;

interface LevelDef {
  level: number;
  name: string;
  minXp: number;
  baseTime: number;
  aiSkill: number;
}
const LEVELS: LevelDef[] = [
  { level: 1, name: "Çaylak", minXp: 0, baseTime: 15, aiSkill: 0.1 },
  { level: 2, name: "Hevesli", minXp: 150, baseTime: 14, aiSkill: 0.25 },
  { level: 3, name: "Usta Adayı", minXp: 380, baseTime: 13, aiSkill: 0.4 },
  { level: 4, name: "Kelime Avcısı", minXp: 700, baseTime: 12, aiSkill: 0.55 },
  { level: 5, name: "Zincirci", minXp: 1100, baseTime: 11, aiSkill: 0.7 },
  { level: 6, name: "Söz Ustası", minXp: 1650, baseTime: 10, aiSkill: 0.82 },
  { level: 7, name: "Efsane", minXp: 2350, baseTime: 9, aiSkill: 0.92 },
  { level: 8, name: "Kelime Kralı", minXp: 3200, baseTime: 8, aiSkill: 1.0 },
];

interface Achievement {
  id: string;
  emoji: string;
  label: string;
  desc: string;
}
const ACHIEVEMENTS: Achievement[] = [
  { id: "first", emoji: "⭐", label: "İlk Adım", desc: "İlk kelimeni ekle" },
  { id: "chain10", emoji: "🔗", label: "Zincirci", desc: "10'luk zincir" },
  { id: "chain20", emoji: "💎", label: "Elmas Zincir", desc: "20'lik zincir" },
  {
    id: "speed5",
    emoji: "⚡",
    label: "Şimşek",
    desc: "5 hızlı cevap üst üste",
  },
  { id: "combo8", emoji: "🔥", label: "Alev Aldın", desc: "8× kombo yakala" },
  { id: "win3", emoji: "👑", label: "Şampiyon", desc: "3 düello kazan" },
  { id: "lvl5", emoji: "🚀", label: "Yükseliş", desc: "5. seviye" },
  {
    id: "score800",
    emoji: "🏆",
    label: "Yüksek Skor",
    desc: "Tek turda 800 puan",
  },
];


type Owner = "player" | "ai";
interface ChainItem {
  word: string;
  owner: Owner;
}
type Screen = "start" | "countdown" | "playing" | "ai_thinking" | "gameover";

export default function KelimeZinciriApp() {
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem("kelimezinciri_xp");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem("kelimezinciri_best");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [winStreak, setWinStreak] = useState(() => {
    const saved = localStorage.getItem("kelimezinciri_winstreak");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [achievements, setAchievements] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("kelimezinciri_achievements");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem("kelimezinciri_xp", xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("kelimezinciri_best", best.toString());
  }, [best]);

  useEffect(() => {
    localStorage.setItem("kelimezinciri_winstreak", winStreak.toString());
  }, [winStreak]);

  useEffect(() => {
    localStorage.setItem(
      "kelimezinciri_achievements",
      JSON.stringify(Array.from(achievements)),
    );
  }, [achievements]);
  const [mode, setMode] = useState<Mode>("endless");
  const [sheetOpen, setSheetOpen] = useState(false);

  // sözlük lazy yüklemesi
  const [dictReady, setDictReady] = useState(() => !!DICT);
  useEffect(() => {
    if (DICT) return;
    let alive = true;
    loadDict().then(() => {
      if (alive) setDictReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const [screen, setScreen] = useState<Screen>("start");
  const [countNum, setCountNum] = useState(3);
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [scorePop, setScorePop] = useState<string | null>(null);
  const [scoreKick, setScoreKick] = useState(false);
  const [lives, setLives] = useState(1);
  const [combo, setCombo] = useState(0);
  const [comboBump, setComboBump] = useState(false);
  const [didWin, setDidWin] = useState(false);
  const [loseReason, setLoseReason] = useState("");
  const [newWordIdx, setNewWordIdx] = useState<number | null>(null);
  const [bestChain, setBestChain] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const fastStreakRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnStartRef = useRef<number>(0);
  const chainRef = useRef<ChainItem[]>([]);
  const scoreRef = useRef(0);
  useEffect(() => {
    chainRef.current = chain;
  }, [chain]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const levelData = LEVELS.reduce<LevelDef>(
    (b, l) => (l.minXp <= xp ? l : b),
    LEVELS[0],
  );
  const nextLevel = LEVELS[levelData.level] ?? null;
  const xpInLevel = xp - levelData.minXp;
  const xpNeeded = nextLevel ? nextLevel.minXp - levelData.minXp : 999;
  const xpPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  const unlock = useCallback((id: string) => {
    setAchievements((prev) => {
      if (prev.has(id)) return prev;
      setNewAchievements((n) => (n.includes(id) ? n : [...n, id]));
      return new Set([...prev, id]);
    });
  }, []);

  const actuallyStart = useCallback(() => {
    const allWords = DICT!.allWords;
    const startWord = allWords[Math.floor(Math.random() * allWords.length)];
    setChain([{ word: startWord, owner: "ai" }]);
    setUsedWords(new Set([startWord]));
    setInput("");
    setError("");
    setScore(0);
    setScorePop(null);
    setLives(mode === "duel" ? 3 : mode === "endless" ? 1 : 99);
    setCombo(0);
    fastStreakRef.current = 0;
    setDidWin(false);
    setLoseReason("");
    setNewWordIdx(0);
    setBestChain(1);
    setNewAchievements([]);
    setTimeLeft(levelData.baseTime);
    setScreen("playing");
    turnStartRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [mode, levelData]);

  const beginCountdown = useCallback(() => {
    setScreen("countdown");
    setCountNum(3);
    let n = 3;
    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        setCountNum(0);
        setTimeout(() => actuallyStart(), 600);
      } else {
        setCountNum(n);
      }
    }, 850);
  }, [actuallyStart]);

  const endGame = useCallback(
    (won: boolean, reason: string) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const fc = chainRef.current;
      const fs = scoreRef.current;
      const pWords = fc.filter((w) => w.owner === "player").length;
      const earned = won
        ? Math.round(fs * 0.5 + pWords * 12 + 60)
        : Math.round(fs * 0.4 + pWords * 7);
      setXp((p) => p + earned);
      setBest((b) => Math.max(b, fs));
      if (won && mode === "duel") {
        setWinStreak((s) => {
          const ns = s + 1;
          if (ns >= 3) unlock("win3");
          return ns;
        });
      } else if (!won && mode === "duel") {
        setWinStreak(0);
      }
      if (fs >= 800) unlock("score800");
      if (levelData.level >= 5) unlock("lvl5");
      setDidWin(won);
      setLoseReason(reason);
      setScreen("gameover");
    },
    [mode, levelData, unlock],
  );

  const loseLife = useCallback(
    (reason: string) => {
      setCombo(0);
      fastStreakRef.current = 0;
      setLives((prev) => {
        const rem = prev - 1;
        if (rem <= 0) {
          endGame(false, reason);
          return 0;
        }
        setError(`${reason} -1 can 💔`);
        setTimeout(() => setError(""), 1500);
        setTimeLeft(levelData.baseTime);
        turnStartRef.current = Date.now();
        setTimeout(() => inputRef.current?.focus(), 60);
        return rem;
      });
    },
    [levelData, endGame],
  );

  useEffect(() => {
    if (screen !== "playing" || mode === "zen") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          loseLife("Süre doldu!");
          return levelData.baseTime;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, chain, mode, levelData.baseTime, loseLife]);

  const aiChoose = useCallback(
    (letter: string, used: Set<string>): string | null => {
      const cands = wordsStartingWith(letter, used);
      if (!cands.length) return null;
      if (Math.random() >= levelData.aiSkill) {
        return cands[Math.floor(Math.random() * cands.length)];
      }
      const diffCache: Record<string, number> = {};
      const diffOf = (w: string) => {
        const e = lastLetter(w);
        if (diffCache[e] === undefined)
          diffCache[e] = letterDifficulty(e, used);
        return diffCache[e];
      };
      const ranked = cands.slice().sort((a, b) => diffOf(a) - diffOf(b));
      const topN = Math.max(1, Math.ceil(ranked.length * 0.25));
      return ranked[Math.floor(Math.random() * topN)];
    },
    [levelData],
  );

  const fail = (msg: string) => {
    setError(msg);
    setInput("");
    if (inputRef.current) {
      inputRef.current.classList.remove("shake");
      void inputRef.current.offsetWidth;
      inputRef.current.classList.add("shake");
    }
    setTimeout(() => setError(""), 1800);
  };

  const submitWord = useCallback(() => {
    if (screen !== "playing") return;
    const word = normalize(input)
      .trim()
      .replace(/[^A-ZÇĞİıÖŞÜ]/gi, "");
    if (!word) return;

    const reqLetter = lastLetter(chain[chain.length - 1].word);
    if (word.length < 2) return fail("En az 2 harf!");
    if (firstLetter(word) !== reqLetter)
      return fail(`"${reqLetter}" ile başlamalı!`);
    if (usedWords.has(word)) return fail("Bu kelime kullanıldı!");
    if (!DICT!.wordSet.has(word)) return fail("Sözlükte yok, başka dene!");

    const elapsed = (Date.now() - turnStartRef.current) / 1000;
    const isFast = mode !== "zen" && elapsed < 4;
    const nf = isFast ? fastStreakRef.current + 1 : 0;
    fastStreakRef.current = nf;
    if (nf >= 5) unlock("speed5");

    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setComboBump(true);
    setTimeout(() => setComboBump(false), 350);
    if (nextCombo >= 8) unlock("combo8");

    const mult = 1 + Math.min(nextCombo - 1, 11) * 0.15;
    const pts = Math.round((10 + word.length * 2 + (isFast ? 12 : 0)) * mult);

    if (timerRef.current) clearInterval(timerRef.current);

    const newChain: ChainItem[] = [...chain, { word, owner: "player" }];
    const newUsed = new Set([...usedWords, word]);
    const newScore = score + pts;

    setChain(newChain);
    setUsedWords(newUsed);
    setInput("");
    setError("");
    setScore(newScore);
    setScorePop(`+${pts}`);
    setScoreKick(true);
    setTimeout(() => {
      setScorePop(null);
      setScoreKick(false);
    }, 850);
    setNewWordIdx(newChain.length - 1);
    setBestChain((b) => Math.max(b, newChain.length));

    const pWords = newChain.filter((w) => w.owner === "player").length;
    if (pWords >= 1) unlock("first");
    if (newChain.length >= 10) unlock("chain10");
    if (newChain.length >= 20) unlock("chain20");

    setScreen("ai_thinking");
    const aiLetter = lastLetter(word);
    window.setTimeout(
      () => {
        const aiWord = aiChoose(aiLetter, newUsed);
        if (!aiWord) {
          if (mode === "duel") {
            endGame(true, "AI takıldı!");
            return;
          }
          const bonus = newScore + 50;
          setScore(bonus);
          setScorePop("+50 BONUS");
          setTimeout(() => setScorePop(null), 850);
          const pool = DICT!.allWords.filter((w) => !newUsed.has(w));
          if (!pool.length) {
            endGame(true, "Tüm kelimeler bitti!");
            return;
          }
          const seed = pool[Math.floor(Math.random() * pool.length)];
          const seedChain: ChainItem[] = [
            ...newChain,
            { word: seed, owner: "ai" },
          ];
          setChain(seedChain);
          setUsedWords(new Set([...newUsed, seed]));
          setNewWordIdx(seedChain.length - 1);
          setTimeLeft(levelData.baseTime);
          turnStartRef.current = Date.now();
          setScreen("playing");
          setTimeout(() => inputRef.current?.focus(), 60);
          return;
        }
        const aiChain: ChainItem[] = [
          ...newChain,
          { word: aiWord, owner: "ai" },
        ];
        setChain(aiChain);
        setUsedWords(new Set([...newUsed, aiWord]));
        setNewWordIdx(aiChain.length - 1);
        setBestChain((b) => Math.max(b, aiChain.length));
        setTimeLeft(levelData.baseTime);
        turnStartRef.current = Date.now();
        setScreen("playing");
        setTimeout(() => inputRef.current?.focus(), 60);
      },
      480 + Math.random() * 460,
    );
  }, [
    screen,
    input,
    chain,
    usedWords,
    score,
    combo,
    mode,
    levelData,
    aiChoose,
    endGame,
    unlock,
  ]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitWord();
  };

  const lastW = chain.length ? chain[chain.length - 1].word : "";
  const reqLetter = lastW ? lastLetter(lastW) : "";
  const reqDiff = reqLetter ? letterDifficulty(reqLetter, usedWords) : 0;
  const diffInfo =
    reqDiff >= 8
      ? { cls: "diff-easy", txt: "Kolay 😎" }
      : reqDiff >= 3
        ? { cls: "diff-med", txt: "Orta 🤔" }
        : { cls: "diff-hard", txt: "Zor! 😰" };
  const timerPct =
    mode === "zen" ? 100 : Math.round((timeLeft / levelData.baseTime) * 100);
  const timerColor =
    timerPct > 50 ? "#2bc77a" : timerPct > 25 ? "#ffb13c" : "#ff6b6b";
  const playerWords = chain.filter((w) => w.owner === "player").length;
  const inGame = screen === "playing" || screen === "ai_thinking";

  return (
    <>
      <div className="wcg">
        <div className="coop-ribbon">
          <span className="coop-emoji">👥</span> Co-op
          <span className="coop-soon">YAKINDA</span>
        </div>
        <div
          className="blob"
          style={{
            top: "8%",
            left: "-6%",
            width: 120,
            height: 120,
            background: "#ffb84d",
          }}
        />
        <div
          className="blob"
          style={{
            top: "30%",
            right: "-8%",
            width: 150,
            height: 150,
            background: "#4dd0ff",
          }}
        />
        <div
          className="blob"
          style={{
            bottom: "12%",
            left: "-4%",
            width: 130,
            height: 130,
            background: "#ff5e9e",
          }}
        />

        <div className="wcg-inner">
          <div className="topbar">
            <div className="brand">
              <div className="brand-title">
                Kelime
                <br />
                <span>Zinciri</span>
              </div>
            </div>
            <div className="mode-switch" onClick={() => setSheetOpen(true)}>
              <span className="mode-switch-emoji">{MODES[mode].emoji}</span>
              <span className="mode-switch-label">{MODES[mode].label}</span>
              <span className="mode-switch-caret">▼</span>
            </div>
          </div>

          <div className="lvlbar">
            <div className="lvl-chip">
              Sv {levelData.level} · {levelData.name}
            </div>
            <div className="lvl-track">
              <div className="lvl-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="lvl-xp">{xp} XP</div>
          </div>

          <div className="score-hero">
            {combo >= 2 && (
              <div className={`score-combo${comboBump ? " bump" : ""}`}>
                ×{Math.min(combo, 12)}
              </div>
            )}
            {scorePop && <div className="score-pop">{scorePop}</div>}
            <div className="score-label">Puan</div>
            <div className={`score-num${scoreKick ? " kick" : ""}`}>
              {score.toLocaleString("tr-TR")}
            </div>
            <div className="score-best">
              🏆 En İyi: {best.toLocaleString("tr-TR")}
            </div>
          </div>

          {inGame && (
            <>
              <div className="midstrip">
                {mode === "zen" ? (
                  <div className="zen-tag">🍃 Zen Modu</div>
                ) : (
                  <div className="lives">
                    {Array.from({ length: mode === "duel" ? 3 : 1 }).map(
                      (_, i) => (
                        <span
                          key={i}
                          className={`life${i >= lives ? " lost" : ""}`}
                        >
                          ❤️
                        </span>
                      ),
                    )}
                  </div>
                )}
                {mode !== "zen" ? (
                  <>
                    <div className="timer-track">
                      <div
                        className="timer-fill"
                        style={{
                          width: `${timerPct}%`,
                          background: timerColor,
                        }}
                      />
                    </div>
                    <div
                      className={`timer-num${timeLeft <= 4 ? " danger" : ""}`}
                    >
                      {timeLeft}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
              </div>

              <div className="chain-card">
                <div className="req-row">
                  <div className="req-letter-box">
                    <span className="req-text">Başla</span>
                    <span key={reqLetter} className="req-letter pop">
                      {reqLetter}
                    </span>
                  </div>
                  <span className={`diff-pill ${diffInfo.cls}`}>
                    {diffInfo.txt}
                  </span>
                </div>

                <div className="chain-scroll">
                  {chain.length === 0 ? (
                    <span className="chain-empty">
                      Zincir burada görünecek…
                    </span>
                  ) : (
                    chain.slice(-12).map((item, i, arr) => {
                      const realIdx = chain.length - arr.length + i;
                      return (
                        <div key={realIdx} className="cw">
                          {i > 0 && (
                            <span className="arrow">
                              <span className="link-l">
                                {lastLetter(arr[i - 1].word)}
                              </span>
                              →
                            </span>
                          )}
                          <span
                            className={`tag ${realIdx === newWordIdx ? "new" : item.owner}`}
                          >
                            {item.word}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {screen === "ai_thinking" && (
                  <div className="ai-think">
                    <span className="aidot" />
                    <span className="aidot" />
                    <span className="aidot" />
                    Rakip düşünüyor…
                  </div>
                )}
              </div>

              <div className="dock">
                <input
                  ref={inputRef}
                  className="wc-input"
                  lang="tr"
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setInput(normalize(e.target.value));
                    setError("");
                  }}
                  onKeyDown={handleKey}
                  placeholder={`${reqLetter} ile başla…`}
                  disabled={screen !== "playing"}
                  maxLength={20}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <button className="send-btn" onClick={submitWord}>
                  EKLE
                </button>
              </div>
              {error && <div className="err">⚠ {error}</div>}
            </>
          )}

          {screen === "start" && (
            <div className="start-screen">
              <div className="start-hero-emoji">🔗</div>
              <div className="start-hero-title">
                Hazır <span>mısın?</span>
              </div>
              <div className="start-hero-mode">
                {MODES[mode].emoji} {MODES[mode].label}
              </div>
              <div className="start-hero-desc">{MODES[mode].desc}</div>
              {mode === "duel" && winStreak > 0 && (
                <div className="wc-win-streak">
                  🔥 {winStreak} Galibiyet Serisi!
                </div>
              )}
              <button
                className="big-start"
                onClick={beginCountdown}
                disabled={!dictReady}
                style={dictReady ? undefined : { opacity: 0.7 }}
              >
                {dictReady ? "BAŞLA" : "Yükleniyor…"}
              </button>
              <div className="ach-row">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.id}
                    className={`ach ${achievements.has(a.id) ? "on" : "off"}`}
                    data-tip={a.label}
                  >
                    {a.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {screen === "countdown" && (
          <div className="countdown-overlay">
            <div
              key={countNum}
              className={`count-num${countNum === 0 ? " go" : ""}`}
            >
              {countNum === 0 ? "BAŞLA!" : countNum}
            </div>
          </div>
        )}

        {sheetOpen && (
          <div className="sheet-overlay" onClick={() => setSheetOpen(false)}>
            <div
              className="sheet"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">🎮 Oyun Modu</div>
              {(Object.keys(MODES) as Mode[]).map((m) => {
                const cfg = MODES[m];
                return (
                  <div
                    key={m}
                    className={`mode-opt${mode === m ? " active" : ""}`}
                    style={{
                      ["--mc" as string]: cfg.color,
                      ["--mcl" as string]: cfg.color + "22",
                    }}
                    onClick={() => {
                      setMode(m);
                      setSheetOpen(false);
                      if (inGame || screen === "gameover") setScreen("start");
                    }}
                  >
                    <div className="mode-opt-emoji">{cfg.emoji}</div>
                    <div className="mode-opt-info">
                      <div className="mode-opt-name">{cfg.label}</div>
                      <div className="mode-opt-desc">{cfg.desc}</div>
                    </div>
                    {mode === m && <div className="mode-opt-check">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {screen === "gameover" && (
          <div className="go-overlay">
            <div className="go-card">
              <span className="go-emoji">{didWin ? "🎉" : "💥"}</span>
              <div className={`go-title ${didWin ? "win" : "lose"}`}>
                {didWin ? "Kazandın!" : "Oyun Bitti"}
              </div>
              <div className={`go-reason ${didWin ? "win" : ""}`}>
                {loseReason || (didWin ? "Harikasın!" : "Tekrar dene!")}
              </div>

              {newAchievements.length > 0 && (
                <div className="go-newbadges">
                  {newAchievements.map((id) => {
                    const a = ACHIEVEMENTS.find((x) => x.id === id)!;
                    return (
                      <span key={id} className="go-newbadge">
                        {a.emoji} {a.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="go-stats">
                <div className="go-stat">
                  <div className="go-stat-val">
                    {score.toLocaleString("tr-TR")}
                  </div>
                  <div className="go-stat-lab">Puan</div>
                </div>
                <div className="go-stat">
                  <div className="go-stat-val">{playerWords}</div>
                  <div className="go-stat-lab">Kelimen</div>
                </div>
                <div className="go-stat">
                  <div className="go-stat-val">{bestChain}</div>
                  <div className="go-stat-lab">En Uzun Zincir</div>
                </div>
                <div className="go-stat">
                  <div className="go-stat-val">{MODES[mode].emoji}</div>
                  <div className="go-stat-lab">{MODES[mode].label}</div>
                </div>
              </div>

              <div className="go-xp">
                +
                {didWin
                  ? Math.round(score * 0.5 + playerWords * 12 + 60)
                  : Math.round(score * 0.4 + playerWords * 7)}{" "}
                XP
              </div>
              <div className="go-xp-lab">deneyim kazandın</div>

              <div className="go-btns">
                <button
                  className="go-btn ghost"
                  onClick={() => setScreen("start")}
                >
                  Menü
                </button>
                <button className="go-btn primary" onClick={beginCountdown}>
                  Tekrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
