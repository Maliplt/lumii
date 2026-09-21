"use strict";

const RotaSound = Object.freeze({
  create(isMuted, stepIndex) {
    return {
      ctx: null,
      play(kind) {
        if (isMuted()) return;
        try {
          this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
          if (this.ctx.state === "suspended") this.ctx.resume();
          const c = this.ctx;
          const note = (frequency, delay, duration, type = "sine", volume = 0.055) => {
            const oscillator = c.createOscillator();
            const gain = c.createGain();
            const at = c.currentTime + delay;
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, at);
            gain.gain.setValueAtTime(0.001, at);
            gain.gain.exponentialRampToValueAtTime(volume, at + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
            oscillator.connect(gain);
            gain.connect(c.destination);
            oscillator.onended = () => {
              oscillator.disconnect();
              gain.disconnect();
            };
            oscillator.start(at);
            oscillator.stop(at + duration + 0.02);
          };
          if (kind === "step") note([330, 370, 415, 494, 554][stepIndex() % 5], 0, 0.08);
          if (kind === "back") note(240, 0, 0.06, "triangle");
          if (kind === "error") note(100, 0, 0.09, "triangle", 0.04);
          if (kind === "checkpoint") {
            note(554, 0, 0.12);
            note(740, 0.06, 0.16);
          }
          if (kind === "win") {
            [330, 415, 494, 660].forEach((frequency, index) =>
              note(frequency, index * 0.09, 0.24, "triangle", 0.04),
            );
          }
        } catch {}
      },
    };
  },
});
