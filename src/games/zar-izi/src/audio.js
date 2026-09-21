(function (root) {
  let ctx;
  root.ZarAudio = {
    play(kind, enabled) {
      if (!enabled) return;
      try {
        ctx ||= new (root.AudioContext || root.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const notes = {
          pick: [420],
          place: [330, 495],
          remove: [280],
          hint: [520, 650],
          win: [392, 494, 587, 784],
        }[kind] || [330];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator(),
            g = ctx.createGain(),
            at = ctx.currentTime + i * 0.085;
          o.type = "sine";
          o.frequency.value = f;
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(0.035, at + 0.009);
          g.gain.exponentialRampToValueAtTime(0.001, at + 0.19);
          o.connect(g).connect(ctx.destination);
          o.start(at);
          o.stop(at + 0.2);
        });
      } catch {
        /* Audio never blocks a move. */
      }
    },
  };
})(window);
