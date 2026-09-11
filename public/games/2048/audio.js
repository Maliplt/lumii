"use strict";
function createAudio2048(data) {
  // Ses yalnızca kullanıcı etkileşiminden sonra başlatılır.
  let context = null;
  function sound(kind, level = 1) {
    if (data.muted) return;
    try {
      context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === "suspended") context.resume();
      const at = context.currentTime;
      const notes =
        kind === "win"
          ? [392, 494, 587, 784]
          : kind === "merge"
            ? [220 + Math.min(level, 8) * 35, 330 + Math.min(level, 8) * 45]
            : kind === "over"
              ? [220, 165]
              : [290];
      notes.forEach((frequency, i) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          start = at + i * 0.075,
          duration = kind === "tap" ? 0.025 : 0.16;
        oscillator.type = kind === "tap" ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.065, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.01);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
    } catch {}
  }

  return {
    play: sound,
    mute() {
      if (context) context.suspend();
    },
  };
}
