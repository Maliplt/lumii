"use strict";
function createDotAudio(settings) {
  let context = null;
  let master = null,
    echo = null;
  function initialize() {
    if (context) return;
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain();
    master.gain.value = 0.65;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    master.connect(compressor);
    compressor.connect(context.destination);
    echo = context.createDelay(0.5);
    echo.delayTime.value = 0.16;
    const wet = context.createGain();
    wet.gain.value = 0.16;
    echo.connect(wet);
    wet.connect(master);
  }
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
    gain.connect(master);
    gain.connect(echo);
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
      initialize();
      context.resume().catch(() => {});
      if (kind === "tap") tone(310, 0, 0.018, "sine", 0.07);
      if (kind === "step") {
        const note = [
          392, 440, 523.25, 587.33, 659.25, 784, 880, 1046.5, 1174.66, 1318.5,
        ][Math.max(0, index - 1) % 10];
        tone(note, 0, 0.22, "sine", 0.065);
        tone(note * 2, 0, 0.085, "sine", 0.014);
      }
      if (kind === "error") tone(110, 0, 0.08, "triangle", 0.035);
      if (kind === "back") tone(220, 0, 0.055, "sine", 0.04);
      if (kind === "pair") {
        [523.25, 659.25, 784].forEach((note, i) =>
          tone(note, i * 0.045, 0.26, "sine", 0.05),
        );
        tone(130.81, 0, 0.2, "triangle", 0.04);
      }
      if (kind === "bonus") {
        [523.25, 659.25, 784, 1046.5].forEach((note, i) =>
          tone(note, i * 0.045, 0.35, "sine", 0.05),
        );
        tone(130.81, 0, 0.28, "triangle", 0.05);
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
