"use strict";
function createDotAudio(settings) {
  let context = null;
  function tone(frequency, delay, duration, type = "sine", volume = 0.055) {
    if (!context || settings.muted) return;
    const at = context.currentTime + delay,
      osc = context.createOscillator(),
      gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(at);
    osc.stop(at + duration + 0.01);
  }
  function play(kind, index = 0) {
    if (settings.muted) return;
    try {
      context ??= new (window.AudioContext || window.webkitAudioContext)();
      context.resume().catch(() => {});
      if (kind === "tap") tone(520, 0, 0.035, "sine", 0.025);
      if (kind === "place") {
        tone(392, 0, 0.075, "triangle", 0.045);
        tone(784, 0.015, 0.095, "sine", 0.016);
      }
      if (kind === "stars") {
        [523.25, 659.25, 783.99].slice(0, index).forEach((f, i) => {
          tone(f, 0.12 + i * 0.22, 0.3, "triangle", 0.045);
          tone(f * 2, 0.14 + i * 0.22, 0.22, "sine", 0.016);
        });
      }
      if (kind === "step")
        tone([262, 294, 330, 392, 440][index % 5], 0, 0.045, "sine", 0.025);
      if (kind === "error") {
        tone(196, 0, 0.1, "triangle", 0.03);
        tone(164.8, 0.075, 0.12, "sine", 0.025);
      }
      if (kind === "back") {
        tone(440, 0, 0.065, "sine", 0.035);
        tone(294, 0.045, 0.09, "sine", 0.025);
      }
      if (kind === "pair") {
        tone(523.25, 0, 0.15, "triangle", 0.04);
        tone(659.25, 0.06, 0.18, "sine", 0.035);
        tone(783.99, 0.12, 0.22, "sine", 0.03);
      }
      if (kind === "bonus") {
        tone(880, 0, 0.1);
        tone(1175, 0.04, 0.2);
      }
      if (kind === "win")
        [330, 415, 494, 660, 830].forEach((f, i) =>
          tone(f, i * 0.085, 0.3, "triangle", 0.04),
        );
    } catch {}
  }
  function mute() {
    if (settings.muted) context?.suspend().catch(() => {});
    else play("tap");
  }
  return { play, mute };
}
