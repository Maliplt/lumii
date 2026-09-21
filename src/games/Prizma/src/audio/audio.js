"use strict";
function createGameAudio(read) {
  const audio = {
    ctx: null,
    muted: read("mute.v2") === true,
    unlock() {
      if (this.muted) return;
      try {
        this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
        this.ctx.resume().catch(() => {});
      } catch {}
    },
    tone(f, d, delay = 0, type = "sine", volume = 0.055, end = f) {
      if (this.muted || !this.ctx) return;
      const at = this.ctx.currentTime + delay,
        o = this.ctx.createOscillator(),
        g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, at);
      o.frequency.exponentialRampToValueAtTime(Math.max(25, end), at + d);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(volume, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, at + d);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(at);
      o.stop(at + d + 0.015);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    },
    play(kind, size = 1) {
      this.unlock();
      if (kind === "tap") {
        this.tone(260, 0.024, 0, "triangle", 0.07, 110);
        this.tone(900, 0.016, 0.008, "sine", 0.02);
      }
      if (kind === "light") {
        const f = 392 * Math.pow(2, Math.min(size, 6) / 12);
        this.tone(f, 0.17);
        this.tone(f * 1.5, 0.22, 0.055, "sine", 0.045);
      }
      if (kind === "dim") this.tone(115, 0.07, 0, "triangle", 0.022, 72);
      if (kind === "open") {
        this.tone(330, 0.08);
        this.tone(440, 0.11, 0.05);
      }
      if (kind === "win")
        [392, 493.88, 587.33, 783.99, 987.77].forEach((f, i) =>
          this.tone(f, 0.55, i * 0.085, "sine", 0.055),
        );
    },
  };
  return audio;
}
