"use strict";
function createGameAudio(storage) {
  const audio = {
    context: null,
    master: null,
    enabled: storage.get("sound") !== "off",
    tone(
      frequency,
      start,
      duration,
      type = "sine",
      end = frequency,
      volume = 0.06,
    ) {
      if (!this.enabled) return;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        if (!this.context) {
          this.context = new Audio();
          this.master = this.context.createGain();
          this.master.connect(this.context.destination);
        }
        if (this.context.state === "suspended")
          this.context.resume().catch(() => {});
        const at = this.context.currentTime + start,
          osc = this.context.createOscillator(),
          gain = this.context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, at);
        osc.frequency.exponentialRampToValueAtTime(end, at + duration);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(
          volume,
          at + Math.min(0.004, duration / 4),
        );
        gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(at);
        osc.stop(at + duration + 0.01);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      } catch {
        /* Ses açılamazsa oyun devam eder. */
      }
    },
    play(kind) {
      if (kind === "click") this.tone(430, 0, 0.018, "sine", 210, 0.12);
      if (kind === "good") {
        this.tone(660, 0, 0.13);
        this.tone(880, 0.075, 0.2);
      }
      if (kind === "error") this.tone(125, 0, 0.12, "triangle", 75, 0.09);
      if (kind === "win")
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone(f, i * 0.09, 0.38),
        );
    },
  };
  return audio;
}
