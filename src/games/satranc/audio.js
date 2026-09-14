"use strict";
const ChessAudio = (() => {
  let context,
    muted = false;
  function unlock() {
    if (muted) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context ??= new Audio();
      context.resume().catch(() => {});
    } catch {}
  }
  function tone(frequency, start, duration, type = "sine", volume = 0.08) {
    if (!context || muted) return;
    const osc = context.createOscillator(),
      gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
  function play(kind) {
    try {
      unlock();
      if (!context) return;
      const t = context.currentTime;
      if (kind === "select") {
        tone(520, t, 0.07, "sine", 0.025);
        return;
      }
      if (kind === "capture") {
        tone(95, t, 0.22, "triangle", 0.13);
        tone(620, t, 0.045, "triangle", 0.045);
        tone(1240, t + 0.035, 0.11, "sine", 0.035);
        tone(310, t + 0.06, 0.19, "sine", 0.055);
        return;
      }
      if (kind === "move") {
        tone(200, t, 0.12, "triangle", 0.09);
        tone(850, t, 0.035, "sine", 0.025);
        return;
      }
      if (kind === "check") {
        tone(146.83, t, 0.32, "triangle", 0.09);
        tone(587.33, t + 0.04, 0.3, "sine", 0.075);
        tone(880, t + 0.16, 0.38, "sine", 0.06);
        tone(1174.66, t + 0.18, 0.3, "sine", 0.025);
        return;
      }
      if (kind === "wrong") {
        tone(170, t, 0.12, "triangle", 0.03);
        return;
      }
      [392, 494, 587, 784].forEach((n, i) =>
        tone(n, t + i * 0.12, 0.65, "sine", 0.06),
      );
    } catch {}
  }
  return {
    play,
    unlock,
    setMuted(value) {
      muted = value;
    },
  };
})();
