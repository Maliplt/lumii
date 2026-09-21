"use strict";
function createArrowAudio(settings) {
  let ctx;
  return (kind, chain = 1) => {
    if (settings.muted) return;
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const notes =
        kind === "star"
          ? [
              523.25 * Math.pow(1.25, chain - 1),
              1046.5 * Math.pow(1.25, chain - 1),
            ]
          : kind === "win"
            ? [392, 494, 587, 784]
            : kind === "blocked"
              ? [150, 120]
              : kind === "exit"
                ? [330 + Math.min(chain, 7) * 38, 495 + Math.min(chain, 7) * 38]
                : [440];
      notes.forEach((hz, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          start = ctx.currentTime + i * 0.07;
        o.type = kind === "blocked" ? "triangle" : "sine";
        o.frequency.setValueAtTime(hz, start);
        o.frequency.exponentialRampToValueAtTime(hz * 1.08, start + 0.13);
        g.gain.setValueAtTime(0.001, start);
        g.gain.exponentialRampToValueAtTime(0.075, start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(start);
        o.stop(start + 0.23);
        o.onended = () => {
          o.disconnect();
          g.disconnect();
        };
      });
    } catch {}
  };
}
