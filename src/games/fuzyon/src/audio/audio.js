"use strict";
function createFusionAudio(settings) {
  let context, master;
  function play(kind, depth = 1) {
    if (settings.muted) return;
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        master = context.createGain();
        master.gain.value = 0.16;
        master.connect(context.destination);
      }
      context.resume().catch(() => {});
      const tones =
        kind === "burst"
          ? [196, 294, 392, 587]
          : kind === "merge"
            ? [220 * 2 ** (depth / 4), 440 * 2 ** (depth / 4)]
            : kind === "place"
              ? [160, 240]
              : [330];
      tones.forEach((f, i) => {
        const osc = context.createOscillator(),
          gain = context.createGain(),
          at = context.currentTime + i * 0.055,
          length = kind === "place" ? 0.09 : 0.28;
        osc.type = kind === "place" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(f, at);
        osc.frequency.exponentialRampToValueAtTime(f * 0.85, at + length);
        gain.gain.setValueAtTime(0.001, at);
        gain.gain.exponentialRampToValueAtTime(0.5, at + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, at + length);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + length + 0.01);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      /* Muted/unsupported audio does not affect input. */
    }
  }
  function mute() {
    if (master)
      master.gain.setValueAtTime(
        settings.muted ? 0 : 0.16,
        context.currentTime,
      );
  }
  return { play, mute };
}
