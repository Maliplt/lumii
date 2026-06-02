import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";
import { TURKISH_WORDS, TURKISH_WORD_SET } from "./libraries/sozluk";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@600;700;800;900&display=swap";

/* ─────────── WORD DATA ─────────── */
const normalize = (w: string) => w.toLocaleUpperCase("tr-TR");
const ALL_WORDS = TURKISH_WORDS;
const WORD_SET = TURKISH_WORD_SET;
const lastLetter = (w: string) => w[w.length - 1];
const firstLetter = (w: string) => w[0];

// Performance: pre-index words by their first letter (45k words → instant lookup)
const WORDS_BY_FIRST: Record<string, string[]> = (() => {
  const idx: Record<string, string[]> = {};
  for (const w of ALL_WORDS) {
    const f = w[0];
    (idx[f] ||= []).push(w);
  }
  return idx;
})();

const wordsStartingWith = (letter: string, used: Set<string>) =>
  (WORDS_BY_FIRST[letter] || []).filter((w) => !used.has(w));
const letterDifficulty = (letter: string, used: Set<string>) => {
  const pool = WORDS_BY_FIRST[letter];
  if (!pool) return 0;
  // count unused without allocating a new array
  let n = 0;
  for (const w of pool) if (!used.has(w)) n++;
  return n;
};

/* ─────────── MODES ─────────── */
const MODES = {
  endless: { label: "Sonsuz", emoji: "♾️", desc: "Tek hata = oyun biter", color: "#ff7a59" },
  duel:    { label: "Düello", emoji: "⚔️", desc: "3 can, AI'yı yen", color: "#7c5cff" },
  zen:     { label: "Zen", emoji: "🍃", desc: "Süre yok, sakin oyna", color: "#2bc7a4" },
} as const;
type Mode = keyof typeof MODES;

interface LevelDef { level: number; name: string; minXp: number; baseTime: number; aiSkill: number; }
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

interface Achievement { id: string; emoji: string; label: string; desc: string; }
const ACHIEVEMENTS: Achievement[] = [
  { id: "first", emoji: "⭐", label: "İlk Adım", desc: "İlk kelimeni ekle" },
  { id: "chain10", emoji: "🔗", label: "Zincirci", desc: "10'luk zincir" },
  { id: "chain20", emoji: "💎", label: "Elmas Zincir", desc: "20'lik zincir" },
  { id: "speed5", emoji: "⚡", label: "Şimşek", desc: "5 hızlı cevap üst üste" },
  { id: "combo8", emoji: "🔥", label: "Alev Aldın", desc: "8× kombo yakala" },
  { id: "win3", emoji: "👑", label: "Şampiyon", desc: "3 düello kazan" },
  { id: "lvl5", emoji: "🚀", label: "Yükseliş", desc: "5. seviye" },
  { id: "score800", emoji: "🏆", label: "Yüksek Skor", desc: "Tek turda 800 puan" },
];

/* ─────────── STYLES ─────────── */
const STYLES = `
@import url('${FONT_URL}');
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

.wcg {
  min-height: 100vh;
  background: linear-gradient(165deg, #4731a8 0%, #6c43c9 38%, #9b4dd4 72%, #c5559b 100%);
  font-family: 'Nunito', sans-serif;
  display: flex; flex-direction: column; align-items: center;
  padding: 0; position: relative; overflow: hidden;
}
.wcg::before {
  content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(circle at 12% 8%, rgba(255,180,90,0.28), transparent 38%),
    radial-gradient(circle at 88% 22%, rgba(80,220,255,0.22), transparent 40%),
    radial-gradient(circle at 50% 110%, rgba(255,120,180,0.3), transparent 50%);
}
.blob { position: fixed; border-radius: 50%; filter: blur(2px); opacity: 0.5; z-index: 0; pointer-events: none; }

.wcg-inner {
  position: relative; z-index: 1; width: 100%; max-width: 440px;
  min-height: 100vh; display: flex; flex-direction: column;
  padding: 18px 16px 28px;
}

/* ── TOP BAR ── */
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 10px; }
.brand { display: flex; flex-direction: column; }
.brand-title { font-family: 'Baloo 2', cursive; font-size: 26px; font-weight: 800; color: #fff; line-height: 0.95; text-shadow: 0 3px 0 rgba(0,0,0,0.15); }
.brand-title span { color: #ffd84d; }
.brand-sub { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-top: 2px; }

.mode-switch {
  display: flex; align-items: center; gap: 7px; padding: 9px 14px; cursor: pointer;
  background: rgba(255,255,255,0.16); border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 50px; backdrop-filter: blur(8px); transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
.mode-switch:active { transform: scale(0.94); }
.mode-switch-emoji { font-size: 17px; }
.mode-switch-label { font-family: 'Baloo 2', cursive; font-size: 13px; font-weight: 700; color: #fff; }
.mode-switch-caret { font-size: 10px; color: rgba(255,255,255,0.7); }

/* ── CO-OP COMING SOON RIBBON ── */
.coop-ribbon {
  position: absolute; top: 18px; left: -42px; z-index: 6;
  transform: rotate(-45deg); transform-origin: center;
  background: linear-gradient(135deg, #2bc7a4, #16a98a);
  color: #fff; font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 11px;
  letter-spacing: 0.5px; padding: 6px 48px; text-align: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.25);
  pointer-events: none; white-space: nowrap;
}
.coop-ribbon::before, .coop-ribbon::after {
  content: ''; position: absolute; top: 100%; border: 5px solid transparent;
  border-top-color: #0e7d65;
}
.coop-ribbon::before { left: 0; }
.coop-ribbon::after { right: 0; }
.coop-ribbon .coop-emoji { font-size: 12px; }
.coop-ribbon .coop-soon { display: block; font-size: 8px; font-weight: 700; opacity: 0.85; letter-spacing: 1px; margin-top: -1px; }

/* ── LEVEL BAR ── */
.lvlbar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.lvl-chip { font-family: 'Baloo 2', cursive; font-size: 12px; font-weight: 800; color: #5a3d00; background: linear-gradient(135deg, #ffe16b, #ffc93c); padding: 5px 11px; border-radius: 50px; white-space: nowrap; box-shadow: 0 3px 0 #e0a920; }
.lvl-track { flex: 1; height: 10px; background: rgba(0,0,0,0.22); border-radius: 6px; overflow: hidden; }
.lvl-fill { height: 100%; background: linear-gradient(90deg, #ffe16b, #ffb13c); border-radius: 6px; transition: width 0.6s cubic-bezier(0.34,1.4,0.64,1); box-shadow: 0 0 10px rgba(255,200,80,0.7); }
.lvl-xp { font-size: 11px; font-weight: 900; color: rgba(255,255,255,0.85); white-space: nowrap; }

/* ── SCORE HERO ── */
.score-hero { position: relative; text-align: center; margin: 6px 0 14px; }
.score-combo {
  position: absolute; top: -6px; left: calc(50% - 96px);
  font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 22px;
  padding: 4px 12px; border-radius: 14px; color: #fff;
  background: linear-gradient(135deg, #ff5e7e, #ff3d6e);
  box-shadow: 0 4px 0 #d0204a, 0 6px 16px rgba(255,60,110,0.5);
  transform: rotate(-8deg); animation: comboPulse 0.5s cubic-bezier(0.34,1.8,0.5,1);
  z-index: 3; white-space: nowrap;
}
@keyframes comboPulse { 0%{transform:rotate(-8deg) scale(0.4);opacity:0} 60%{transform:rotate(-8deg) scale(1.2)} 100%{transform:rotate(-8deg) scale(1);opacity:1} }
.score-combo.bump { animation: comboBump 0.35s cubic-bezier(0.34,1.8,0.5,1); }
@keyframes comboBump { 0%{transform:rotate(-8deg) scale(1)} 45%{transform:rotate(-8deg) scale(1.3)} 100%{transform:rotate(-8deg) scale(1)} }

.score-label { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: rgba(255,255,255,0.6); text-transform: uppercase; }
.score-num { font-family: 'Baloo 2', cursive; font-size: 60px; font-weight: 800; color: #fff; line-height: 1; text-shadow: 0 4px 0 rgba(0,0,0,0.18); transition: transform 0.15s; }
.score-num.kick { animation: scoreKick 0.3s cubic-bezier(0.34,1.7,0.5,1); }
@keyframes scoreKick { 0%{transform:scale(1)} 40%{transform:scale(1.16)} 100%{transform:scale(1)} }
.score-best { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.55); margin-top: 2px; }

.score-pop { position: absolute; top: 12px; right: calc(50% - 100px); font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 24px; color: #6fffb0; text-shadow: 0 2px 6px rgba(0,0,0,0.25); animation: popUp 0.85s ease forwards; pointer-events: none; z-index: 3; }
@keyframes popUp { 0%{opacity:0;transform:translateY(10px) scale(0.6)} 25%{opacity:1;transform:translateY(0) scale(1.05)} 100%{opacity:0;transform:translateY(-30px) scale(1)} }

/* ── LIVES / TIMER STRIP ── */
.midstrip { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 12px; }
.lives { display: flex; gap: 5px; }
.life { font-size: 22px; transition: all 0.3s cubic-bezier(0.34,1.6,0.5,1); }
.life.lost { filter: grayscale(1) brightness(1.4); opacity: 0.35; transform: scale(0.8) rotate(-12deg); }
.zen-tag { font-family: 'Baloo 2', cursive; font-weight: 700; font-size: 14px; color: rgba(255,255,255,0.85); display: flex; align-items: center; gap: 5px; }
.timer-num { font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 18px; color: #fff; min-width: 28px; text-align: right; }
.timer-num.danger { color: #ff8a8a; animation: tick 0.5s ease infinite; }
@keyframes tick { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }

.timer-track { flex: 1; height: 12px; background: rgba(0,0,0,0.22); border-radius: 7px; overflow: hidden; }
.timer-fill { height: 100%; border-radius: 7px; transition: width 0.25s linear, background 0.4s; }

/* ── CHAIN ── */
.chain-card {
  flex: 1; background: rgba(255,255,255,0.94); border-radius: 22px; padding: 16px;
  box-shadow: 0 10px 30px rgba(40,10,60,0.3), inset 0 2px 0 rgba(255,255,255,0.7);
  display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; min-height: 200px; overflow: hidden;
}
.req-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.req-letter-box { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.req-text { font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #b3a3c5; }
.req-letter {
  font-family: 'Baloo 2', cursive; font-size: 44px; font-weight: 800; color: #fff;
  min-width: 72px; height: 72px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 20px; background: linear-gradient(135deg, #8b6cff, #6c43c9);
  box-shadow: 0 6px 0 #4e2da0, 0 8px 20px rgba(124,92,255,0.4);
  line-height: 1; animation: letterGlow 2.2s ease-in-out infinite;
}
@keyframes letterGlow { 0%,100%{box-shadow:0 6px 0 #4e2da0, 0 8px 20px rgba(124,92,255,0.4)} 50%{box-shadow:0 6px 0 #4e2da0, 0 8px 28px rgba(124,92,255,0.75)} }
.req-letter.pop { animation: letterPop 0.4s cubic-bezier(0.34,1.7,0.5,1); }
@keyframes letterPop { 0%{transform:scale(0.6) rotate(-8deg)} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
.diff-pill { font-family: 'Baloo 2', cursive; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 50px; }
.diff-easy { background: #d6f5e3; color: #1f9d63; }
.diff-med { background: #fff0d4; color: #c98a1e; }
.diff-hard { background: #ffe0e0; color: #d84a5a; }

.chain-scroll { flex: 1; display: flex; flex-wrap: wrap; gap: 7px; align-content: flex-start; overflow-y: auto; }
.chain-empty { font-family: 'Baloo 2', cursive; font-size: 16px; color: #c5b8d2; align-self: center; margin: auto; font-weight: 600; }
.cw { display: flex; align-items: center; gap: 5px; }
.tag { font-family: 'Baloo 2', cursive; font-size: 14px; font-weight: 700; padding: 6px 12px; border-radius: 12px; animation: tagPop 0.4s cubic-bezier(0.34,1.6,0.5,1); }
@keyframes tagPop { 0%{transform:scale(0.5) translateY(8px);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1) translateY(0);opacity:1} }
.tag.player { background: linear-gradient(135deg, #c4f0d4, #a8e8be); color: #1f8d53; }
.tag.ai { background: linear-gradient(135deg, #ffd6c4, #ffc0a8); color: #c25a36; }
.tag.new { background: linear-gradient(135deg, #ffe16b, #ffc93c); color: #8a5a00; animation: tagPop 0.4s cubic-bezier(0.34,1.6,0.5,1), tagGlow 1.3s ease 0.4s; }
@keyframes tagGlow { 0%{box-shadow:0 0 0 rgba(255,200,80,0)} 50%{box-shadow:0 0 18px rgba(255,200,80,0.8)} 100%{box-shadow:0 0 0 rgba(255,200,80,0)} }
.arrow { color: #cdbfe0; font-size: 12px; display: flex; align-items: center; gap: 3px; }
.link-l { font-family: 'Baloo 2', cursive; font-size: 11px; font-weight: 700; padding: 1px 6px; background: #eee6f7; color: #8b6fd0; border-radius: 6px; }

.ai-think { display: flex; align-items: center; gap: 9px; padding: 9px 14px; background: #fff0f2; border-radius: 12px; font-family: 'Baloo 2', cursive; font-size: 13px; font-weight: 700; color: #d06678; align-self: flex-start; }
.aidot { width: 7px; height: 7px; border-radius: 50%; background: #e88; animation: db 0.9s ease infinite; }
.aidot:nth-child(2){animation-delay:0.15s} .aidot:nth-child(3){animation-delay:0.3s}
@keyframes db { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-5px);opacity:1} }

/* ── INPUT DOCK ── */
.dock { display: flex; gap: 9px; }
.wc-input {
  flex: 1; font-family: 'Baloo 2', cursive; font-size: 20px; font-weight: 700; letter-spacing: 1px;
  padding: 15px 18px; background: rgba(255,255,255,0.96); border: 3px solid transparent;
  border-radius: 18px; color: #4a2e6a; outline: none;
  box-shadow: 0 6px 0 rgba(0,0,0,0.15); transition: all 0.2s;
}
.wc-input:focus { border-color: #ffd84d; box-shadow: 0 6px 0 rgba(0,0,0,0.15), 0 0 0 4px rgba(255,216,77,0.3); }
.wc-input.shake { animation: shake 0.4s ease; border-color: #ff6b6b; }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
.wc-input::placeholder { color: #b5a5c8; font-size: 14px; }
.send-btn {
  font-family: 'Baloo 2', cursive; font-size: 17px; font-weight: 800; color: #fff;
  padding: 0 24px; border: none; border-radius: 18px; cursor: pointer;
  background: linear-gradient(135deg, #ff8a4c, #ff6b35); box-shadow: 0 6px 0 #d24a18;
  transition: all 0.12s;
}
.send-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #d24a18; }

/* ── ERROR TOAST INLINE ── */
.err { margin-top: 10px; font-size: 13px; font-weight: 800; color: #fff; background: rgba(220,60,80,0.85); padding: 9px 14px; border-radius: 12px; text-align: center; animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

/* ── START SCREEN ── */
.start-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; text-align: center; }
.start-hero-emoji { font-size: 64px; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-12px) rotate(4deg)} }
.start-hero-title { font-family: 'Baloo 2', cursive; font-size: 38px; font-weight: 800; color: #fff; line-height: 1; text-shadow: 0 4px 0 rgba(0,0,0,0.2); }
.start-hero-title span { color: #ffd84d; }
.start-hero-mode { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; background: rgba(255,255,255,0.16); border: 1.5px solid rgba(255,255,255,0.3); border-radius: 50px; font-family: 'Baloo 2', cursive; font-weight: 700; font-size: 15px; color: #fff; }
.start-hero-desc { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.7); max-width: 240px; }
.big-start {
  font-family: 'Baloo 2', cursive; font-size: 26px; font-weight: 800; color: #5a3d00;
  padding: 18px 64px; border: none; border-radius: 50px; cursor: pointer;
  background: linear-gradient(135deg, #ffe16b, #ffc93c); box-shadow: 0 8px 0 #e0a920, 0 12px 28px rgba(0,0,0,0.25);
  transition: all 0.14s; animation: breathe 2.2s ease-in-out infinite;
}
@keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
.big-start:active { transform: translateY(6px) scale(1); box-shadow: 0 2px 0 #e0a920, 0 4px 12px rgba(0,0,0,0.2); }

/* ── COUNTDOWN ── */
.countdown-overlay { position: fixed; inset: 0; z-index: 150; display: flex; align-items: center; justify-content: center; background: rgba(40,15,70,0.6); backdrop-filter: blur(6px); }
.count-num { font-family: 'Baloo 2', cursive; font-size: 160px; font-weight: 800; color: #fff; text-shadow: 0 8px 0 rgba(0,0,0,0.2); animation: countPop 1s cubic-bezier(0.34,1.6,0.5,1); }
.count-num.go { color: #6fffb0; font-size: 110px; }
@keyframes countPop { 0%{transform:scale(0.2);opacity:0} 25%{transform:scale(1.25);opacity:1} 70%{transform:scale(1)} 100%{transform:scale(0.7);opacity:0} }

/* ── MODE SHEET ── */
.sheet-overlay { position: fixed; inset: 0; z-index: 160; display: flex; align-items: flex-end; justify-content: center; background: rgba(30,10,50,0.55); backdrop-filter: blur(4px); animation: fadeIn 0.25s ease; }
.sheet { width: 100%; max-width: 440px; background: #fff; border-radius: 28px 28px 0 0; padding: 22px 18px 30px; animation: sheetUp 0.35s cubic-bezier(0.34,1.4,0.64,1); }
@keyframes sheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
.sheet-handle { width: 44px; height: 5px; background: #e0d4ee; border-radius: 3px; margin: 0 auto 16px; }
.sheet-title { font-family: 'Baloo 2', cursive; font-size: 22px; font-weight: 800; color: #4a2e6a; text-align: center; margin-bottom: 16px; }
.mode-opt { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 18px; cursor: pointer; margin-bottom: 10px; border: 2.5px solid #efe7f7; transition: all 0.18s; }
.mode-opt:active { transform: scale(0.98); }
.mode-opt.active { border-color: var(--mc); background: var(--mcl); }
.mode-opt-emoji { font-size: 34px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 16px; background: var(--mcl); }
.mode-opt-info { flex: 1; }
.mode-opt-name { font-family: 'Baloo 2', cursive; font-size: 18px; font-weight: 800; color: #4a2e6a; }
.mode-opt-desc { font-size: 12.5px; font-weight: 700; color: #9a8aa8; }
.mode-opt-check { font-size: 20px; color: var(--mc); }

/* ── GAME OVER ── */
.go-overlay { position: fixed; inset: 0; z-index: 170; display: flex; align-items: center; justify-content: center; background: rgba(30,10,50,0.7); backdrop-filter: blur(6px); padding: 18px; animation: fadeIn 0.4s ease; }
.go-card { width: 100%; max-width: 380px; background: #fff; border-radius: 28px; padding: 30px 26px; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: goPop 0.45s cubic-bezier(0.34,1.5,0.64,1); }
@keyframes goPop { 0%{transform:scale(0.8) translateY(20px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
.go-emoji { font-size: 60px; display: block; margin-bottom: 8px; animation: goBounce 0.6s cubic-bezier(0.34,1.7,0.5,1); }
@keyframes goBounce { 0%{transform:scale(0) rotate(-20deg)} 60%{transform:scale(1.2) rotate(8deg)} 100%{transform:scale(1) rotate(0)} }
.go-title { font-family: 'Baloo 2', cursive; font-size: 32px; font-weight: 800; margin-bottom: 4px; }
.go-title.win { color: #2bc77a; } .go-title.lose { color: #ff6b6b; }
.go-reason { font-size: 14px; font-weight: 800; color: #fff; background: #ff6b6b; display: inline-block; padding: 6px 16px; border-radius: 50px; margin-bottom: 18px; }
.go-reason.win { background: #2bc77a; }
.go-newbadges { margin-bottom: 16px; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.go-newbadge { font-size: 13px; font-weight: 800; color: #8a5a00; background: linear-gradient(135deg, #ffe16b, #ffc93c); border-radius: 50px; padding: 7px 14px; animation: badgeIn 0.5s cubic-bezier(0.34,1.7,0.5,1); }
@keyframes badgeIn { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
.go-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.go-stat { padding: 14px 10px; background: #f6f1fb; border-radius: 16px; }
.go-stat-val { font-family: 'Baloo 2', cursive; font-size: 28px; font-weight: 800; color: #7c5cff; line-height: 1; }
.go-stat-lab { font-size: 10px; font-weight: 900; letter-spacing: 1px; color: #a89bbe; text-transform: uppercase; margin-top: 5px; }
.go-xp { font-family: 'Baloo 2', cursive; font-size: 30px; font-weight: 800; color: #ffb13c; }
.go-xp-lab { font-size: 11px; font-weight: 800; color: #c5b8d2; margin-bottom: 22px; }
.go-btns { display: flex; gap: 10px; }
.go-btn { flex: 1; font-family: 'Baloo 2', cursive; font-size: 16px; font-weight: 800; padding: 15px 0; border: none; border-radius: 16px; cursor: pointer; transition: all 0.12s; }
.go-btn.primary { color: #fff; background: linear-gradient(135deg, #ff8a4c, #ff6b35); box-shadow: 0 5px 0 #d24a18; }
.go-btn.primary:active { transform: translateY(3px); box-shadow: 0 2px 0 #d24a18; }
.go-btn.ghost { color: #7c5cff; background: #f0ebfa; }
.go-btn.ghost:active { transform: scale(0.97); }

/* ── ACHIEVEMENTS MINI (in start) ── */
.ach-row { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.ach { font-size: 20px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: rgba(255,255,255,0.14); border: 1.5px solid rgba(255,255,255,0.22); position: relative; }
.ach.on { background: rgba(255,225,107,0.25); border-color: rgba(255,225,107,0.6); }
.ach.off { filter: grayscale(1); opacity: 0.4; }
.ach:active::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-weight: 800; background: #2a1840; color: #fff; padding: 5px 9px; border-radius: 8px; z-index: 5; }
`;

type Owner = "player" | "ai";
interface ChainItem { word: string; owner: Owner; }
type Screen = "start" | "countdown" | "playing" | "ai_thinking" | "gameover";

export default function WordChainApp() {
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem("kelimezinciri_xp");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem("kelimezinciri_best");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [winStreak, setWinStreak] = useState(0);
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
    localStorage.setItem("kelimezinciri_achievements", JSON.stringify(Array.from(achievements)));
  }, [achievements]);
  const [mode, setMode] = useState<Mode>("endless");
  const [sheetOpen, setSheetOpen] = useState(false);

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
  const [fastStreak, setFastStreak] = useState(0);
  const [didWin, setDidWin] = useState(false);
  const [loseReason, setLoseReason] = useState("");
  const [newWordIdx, setNewWordIdx] = useState<number | null>(null);
  const [bestChain, setBestChain] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnStartRef = useRef<number>(Date.now());
  const chainRef = useRef<ChainItem[]>([]);
  const scoreRef = useRef(0);
  useEffect(() => { chainRef.current = chain; }, [chain]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const levelData = LEVELS.reduce<LevelDef>((b, l) => (l.minXp <= xp ? l : b), LEVELS[0]);
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

  /* ── COUNTDOWN then start ── */
  const beginCountdown = useCallback(() => {
    setScreen("countdown");
    setCountNum(3);
    let n = 3;
    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        setCountNum(0); // "GO"
        setTimeout(() => actuallyStart(), 600);
      } else {
        setCountNum(n);
      }
    }, 850);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, levelData]);

  const actuallyStart = useCallback(() => {
    const startWord = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
    setChain([{ word: startWord, owner: "ai" }]);
    setUsedWords(new Set([startWord]));
    setInput("");
    setError("");
    setScore(0);
    setScorePop(null);
    setLives(mode === "duel" ? 3 : mode === "endless" ? 1 : 99);
    setCombo(0);
    setFastStreak(0);
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

  const endGame = useCallback((won: boolean, reason: string) => {
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
      setWinStreak((s) => { const ns = s + 1; if (ns >= 3) unlock("win3"); return ns; });
    } else if (!won && mode === "duel") {
      setWinStreak(0);
    }
    if (fs >= 800) unlock("score800");
    if (levelData.level >= 5) unlock("lvl5");
    setDidWin(won);
    setLoseReason(reason);
    setScreen("gameover");
  }, [mode, levelData, unlock]);

  /* ── TIMER ── */
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, chain, mode]);

  const loseLife = useCallback((reason: string) => {
    setCombo(0);
    setFastStreak(0);
    setLives((prev) => {
      const rem = prev - 1;
      if (rem <= 0) { endGame(false, reason); return 0; }
      setError(`${reason} -1 can 💔`);
      setTimeout(() => setError(""), 1500);
      setTimeLeft(levelData.baseTime);
      turnStartRef.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 60);
      return rem;
    });
  }, [levelData, endGame]);

  /* ── SMART AI ── */
  const aiChoose = useCallback((letter: string, used: Set<string>): string | null => {
    const cands = wordsStartingWith(letter, used);
    if (!cands.length) return null;
    // Fast path for random play (low levels) — skip expensive ranking entirely
    if (Math.random() >= levelData.aiSkill) {
      return cands[Math.floor(Math.random() * cands.length)];
    }
    // Defensive ranking: prefer words whose ending letter leaves the player few options.
    // Cache difficulty by ending letter so we don't recompute for every candidate.
    const diffCache: Record<string, number> = {};
    const diffOf = (w: string) => {
      const e = lastLetter(w);
      if (diffCache[e] === undefined) diffCache[e] = letterDifficulty(e, used);
      return diffCache[e];
    };
    const ranked = cands.slice().sort((a, b) => diffOf(a) - diffOf(b));
    const topN = Math.max(1, Math.ceil(ranked.length * 0.25));
    return ranked[Math.floor(Math.random() * topN)];
  }, [levelData]);

  const fail = (msg: string) => {
    setError(msg);
    setInput("");
    if (inputRef.current) { inputRef.current.classList.remove("shake"); void inputRef.current.offsetWidth; inputRef.current.classList.add("shake"); }
    setTimeout(() => setError(""), 1800);
  };

  const submitWord = useCallback(() => {
    if (screen !== "playing") return;
    const word = normalize(input).trim().replace(/[^A-ZÇĞİıÖŞÜ]/gi, "");
    if (!word) return;

    const reqLetter = lastLetter(chain[chain.length - 1].word);
    if (word.length < 2) return fail("En az 2 harf!");
    if (firstLetter(word) !== reqLetter) return fail(`"${reqLetter}" ile başlamalı!`);
    if (usedWords.has(word)) return fail("Bu kelime kullanıldı!");
    if (!WORD_SET.has(word)) return fail("Sözlükte yok, başka dene!");

    const elapsed = (Date.now() - turnStartRef.current) / 1000;
    const isFast = mode !== "zen" && elapsed < 4;
    setFastStreak((fs) => { const nf = isFast ? fs + 1 : 0; if (nf >= 5) unlock("speed5"); return nf; });

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
    setTimeout(() => { setScorePop(null); setScoreKick(false); }, 850);
    setNewWordIdx(newChain.length - 1);
    setBestChain((b) => Math.max(b, newChain.length));

    const pWords = newChain.filter((w) => w.owner === "player").length;
    if (pWords >= 1) unlock("first");
    if (newChain.length >= 10) unlock("chain10");
    if (newChain.length >= 20) unlock("chain20");

    setScreen("ai_thinking");
    const aiLetter = lastLetter(word);
    window.setTimeout(() => {
      const aiWord = aiChoose(aiLetter, newUsed);
      if (!aiWord) {
        if (mode === "duel") { endGame(true, "AI takıldı!"); return; }
        // endless/zen: AI stuck → bonus + reseed, keep going
        const bonus = newScore + 50;
        setScore(bonus);
        setScorePop("+50 BONUS");
        setTimeout(() => setScorePop(null), 850);
        const pool = ALL_WORDS.filter((w) => !newUsed.has(w));
        if (!pool.length) { endGame(true, "Tüm kelimeler bitti!"); return; }
        const seed = pool[Math.floor(Math.random() * pool.length)];
        const seedChain: ChainItem[] = [...newChain, { word: seed, owner: "ai" }];
        setChain(seedChain);
        setUsedWords(new Set([...newUsed, seed]));
        setNewWordIdx(seedChain.length - 1);
        setTimeLeft(levelData.baseTime);
        turnStartRef.current = Date.now();
        setScreen("playing");
        setTimeout(() => inputRef.current?.focus(), 60);
        return;
      }
      const aiChain: ChainItem[] = [...newChain, { word: aiWord, owner: "ai" }];
      setChain(aiChain);
      setUsedWords(new Set([...newUsed, aiWord]));
      setNewWordIdx(aiChain.length - 1);
      setBestChain((b) => Math.max(b, aiChain.length));
      setTimeLeft(levelData.baseTime);
      turnStartRef.current = Date.now();
      setScreen("playing");
      setTimeout(() => inputRef.current?.focus(), 60);
    }, 480 + Math.random() * 460);
  }, [screen, input, chain, usedWords, score, combo, mode, levelData, aiChoose, endGame, unlock]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") submitWord(); };

  const lastW = chain.length ? chain[chain.length - 1].word : "";
  const reqLetter = lastW ? lastLetter(lastW) : "";
  const reqDiff = reqLetter ? letterDifficulty(reqLetter, usedWords) : 0;
  const diffInfo = reqDiff >= 8 ? { cls: "diff-easy", txt: "Kolay 😎" }
    : reqDiff >= 3 ? { cls: "diff-med", txt: "Orta 🤔" }
    : { cls: "diff-hard", txt: "Zor! 😰" };
  const timerPct = mode === "zen" ? 100 : Math.round((timeLeft / levelData.baseTime) * 100);
  const timerColor = timerPct > 50 ? "#2bc77a" : timerPct > 25 ? "#ffb13c" : "#ff6b6b";
  const playerWords = chain.filter((w) => w.owner === "player").length;
  const inGame = screen === "playing" || screen === "ai_thinking";

  return (
    <>
      <style>{STYLES}</style>
      <div className="wcg">
        <div className="coop-ribbon">
          <span className="coop-emoji">👥</span> Co-op
          <span className="coop-soon">YAKINDA</span>
        </div>
        <div className="blob" style={{ top: "8%", left: "-6%", width: 120, height: 120, background: "#ffb84d" }} />
        <div className="blob" style={{ top: "30%", right: "-8%", width: 150, height: 150, background: "#4dd0ff" }} />
        <div className="blob" style={{ bottom: "12%", left: "-4%", width: 130, height: 130, background: "#ff5e9e" }} />

        <div className="wcg-inner">
          {/* TOP BAR */}
          <div className="topbar">
            <div className="brand">
              <div className="brand-title">Kelime<br /><span>Zinciri</span></div>
            </div>
            <div className="mode-switch" onClick={() => setSheetOpen(true)}>
              <span className="mode-switch-emoji">{MODES[mode].emoji}</span>
              <span className="mode-switch-label">{MODES[mode].label}</span>
              <span className="mode-switch-caret">▼</span>
            </div>
          </div>

          {/* LEVEL BAR */}
          <div className="lvlbar">
            <div className="lvl-chip">Sv {levelData.level} · {levelData.name}</div>
            <div className="lvl-track"><div className="lvl-fill" style={{ width: `${xpPct}%` }} /></div>
            <div className="lvl-xp">{xp} XP</div>
          </div>

          {/* SCORE HERO */}
          <div className="score-hero">
            {combo >= 2 && (
              <div className={`score-combo${comboBump ? " bump" : ""}`}>×{Math.min(combo, 12)}</div>
            )}
            {scorePop && <div className="score-pop">{scorePop}</div>}
            <div className="score-label">Puan</div>
            <div className={`score-num${scoreKick ? " kick" : ""}`}>{score.toLocaleString("tr-TR")}</div>
            <div className="score-best">🏆 En İyi: {best.toLocaleString("tr-TR")}</div>
          </div>

          {inGame && (
            <>
              {/* LIVES / TIMER */}
              <div className="midstrip">
                {mode === "zen" ? (
                  <div className="zen-tag">🍃 Zen Modu</div>
                ) : (
                  <div className="lives">
                    {Array.from({ length: mode === "duel" ? 3 : 1 }).map((_, i) => (
                      <span key={i} className={`life${i >= lives ? " lost" : ""}`}>❤️</span>
                    ))}
                  </div>
                )}
                {mode !== "zen" ? (
                  <>
                    <div className="timer-track"><div className="timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} /></div>
                    <div className={`timer-num${timeLeft <= 4 ? " danger" : ""}`}>{timeLeft}</div>
                  </>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
              </div>

              {/* CHAIN CARD */}
              <div className="chain-card">
                <div className="req-row">
                  <div className="req-letter-box">
                    <span className="req-text">Başla</span>
                    <span key={reqLetter} className="req-letter pop">{reqLetter}</span>
                  </div>
                  <span className={`diff-pill ${diffInfo.cls}`}>{diffInfo.txt}</span>
                </div>

                <div className="chain-scroll">
                  {chain.length === 0 ? (
                    <span className="chain-empty">Zincir burada görünecek…</span>
                  ) : (
                    chain.slice(-12).map((item, i, arr) => {
                      const realIdx = chain.length - arr.length + i;
                      return (
                        <div key={realIdx} className="cw">
                          {i > 0 && (
                            <span className="arrow"><span className="link-l">{lastLetter(arr[i - 1].word)}</span>→</span>
                          )}
                          <span className={`tag ${realIdx === newWordIdx ? "new" : item.owner}`}>{item.word}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {screen === "ai_thinking" && (
                  <div className="ai-think">
                    <span className="aidot" /><span className="aidot" /><span className="aidot" />
                    Rakip düşünüyor…
                  </div>
                )}
              </div>

              {/* INPUT DOCK */}
              <div className="dock">
                <input
                  ref={inputRef}
                  className="wc-input"
                  lang="tr"
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setInput(normalize(e.target.value)); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder={`${reqLetter} ile başla…`}
                  disabled={screen !== "playing"}
                  maxLength={20}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <button className="send-btn" onClick={submitWord}>EKLE</button>
              </div>
              {error && <div className="err">⚠ {error}</div>}
            </>
          )}

          {/* START SCREEN */}
          {screen === "start" && (
            <div className="start-screen">
              <div className="start-hero-emoji">🔗</div>
              <div className="start-hero-title">Hazır <span>mısın?</span></div>
              <div className="start-hero-mode">{MODES[mode].emoji} {MODES[mode].label}</div>
              <div className="start-hero-desc">{MODES[mode].desc}</div>
              <button className="big-start" onClick={beginCountdown}>BAŞLA</button>
              <div className="ach-row">
                {ACHIEVEMENTS.map((a) => (
                  <div key={a.id} className={`ach ${achievements.has(a.id) ? "on" : "off"}`} data-tip={a.label}>{a.emoji}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COUNTDOWN */}
        {screen === "countdown" && (
          <div className="countdown-overlay">
            <div key={countNum} className={`count-num${countNum === 0 ? " go" : ""}`}>
              {countNum === 0 ? "BAŞLA!" : countNum}
            </div>
          </div>
        )}

        {/* MODE SHEET */}
        {sheetOpen && (
          <div className="sheet-overlay" onClick={() => setSheetOpen(false)}>
            <div className="sheet" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-title">🎮 Oyun Modu</div>
              {(Object.keys(MODES) as Mode[]).map((m) => {
                const cfg = MODES[m];
                return (
                  <div
                    key={m}
                    className={`mode-opt${mode === m ? " active" : ""}`}
                    style={{ ["--mc" as string]: cfg.color, ["--mcl" as string]: cfg.color + "22" }}
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

        {/* GAME OVER */}
        {screen === "gameover" && (
          <div className="go-overlay">
            <div className="go-card">
              <span className="go-emoji">{didWin ? "🎉" : "💥"}</span>
              <div className={`go-title ${didWin ? "win" : "lose"}`}>{didWin ? "Kazandın!" : "Oyun Bitti"}</div>
              <div className={`go-reason ${didWin ? "win" : ""}`}>{loseReason || (didWin ? "Harikasın!" : "Tekrar dene!")}</div>

              {newAchievements.length > 0 && (
                <div className="go-newbadges">
                  {newAchievements.map((id) => {
                    const a = ACHIEVEMENTS.find((x) => x.id === id)!;
                    return <span key={id} className="go-newbadge">{a.emoji} {a.label}</span>;
                  })}
                </div>
              )}

              <div className="go-stats">
                <div className="go-stat"><div className="go-stat-val">{score.toLocaleString("tr-TR")}</div><div className="go-stat-lab">Puan</div></div>
                <div className="go-stat"><div className="go-stat-val">{playerWords}</div><div className="go-stat-lab">Kelimen</div></div>
                <div className="go-stat"><div className="go-stat-val">{bestChain}</div><div className="go-stat-lab">En Uzun Zincir</div></div>
                <div className="go-stat"><div className="go-stat-val">{MODES[mode].emoji}</div><div className="go-stat-lab">{MODES[mode].label}</div></div>
              </div>

              <div className="go-xp">+{didWin ? Math.round(score * 0.5 + playerWords * 12 + 60) : Math.round(score * 0.4 + playerWords * 7)} XP</div>
              <div className="go-xp-lab">deneyim kazandın</div>

              <div className="go-btns">
                <button className="go-btn ghost" onClick={() => setScreen("start")}>Menü</button>
                <button className="go-btn primary" onClick={beginCountdown}>Tekrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
