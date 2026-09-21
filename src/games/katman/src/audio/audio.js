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
      if (kind === "tap") tone(310, 0, 0.018, "sine", 0.07);
      if (kind === "step")
        tone([262, 294, 330, 392, 440][index % 5], 0, 0.045, "sine", 0.025);
      if (kind === "error") tone(110, 0, 0.08, "triangle", 0.035);
      if (kind === "back") tone(220, 0, 0.055, "sine", 0.04);
      if (kind === "pair") {
        tone(440 + index * 35, 0, 0.13, "triangle");
        tone(660 + index * 35, 0.07, 0.22);
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
