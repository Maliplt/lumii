"use strict";
const SudokuAudio = (() => {
  let context;
  function play(kind, enabled) {
    if (!enabled) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === "suspended") context.resume();
      const melody = {
        tap: [440],
        place: [523, 784],
        error: [180, 150],
        win: [523, 659, 784, 1047],
        note: [880],
        erase: [330],
        unit: [659, 880, 1047],
      }[kind] || [440];
      melody.forEach((frequency, i) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain();
        const start = context.currentTime + i * 0.075;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.065, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.19);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      });
    } catch {}
  }
  return { play };
})();
