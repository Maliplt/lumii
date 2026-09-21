BambooModules.define("audio.js", function(require, module, exports) {
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var audio_exports = {};
__export(audio_exports, {
  ForestAudio: () => ForestAudio
});
module.exports = __toCommonJS(audio_exports);
class ForestAudio {
  constructor() {
    this.enabled = true;
    this.context = null;
    this.timer = 0;
  }
  unlock() {
    try {
      this.context || (this.context = new (window.AudioContext || window.webkitAudioContext)());
      if (this.context.state === "suspended")
        this.context.resume().catch(() => {
        });
    } catch {
    }
  }
  tone(freq, duration = 0.1, type = "sine", volume = 0.06, slide = 0) {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    const ctx = this.context, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        slide,
        ctx.currentTime + duration
      );
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + duration);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + duration + 0.02);
  }
  hop() {
    this.tone(260, 0.085, "sine", 0.035, 430);
  }
  gust(duration) {
    if (!this.enabled || this.context?.state !== "running") return;
    const ctx = this.context;
    if (!this.windBuffer) {
      this.windBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const samples = this.windBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.random() * 2 - 1;
    }
    const wind = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), now = ctx.currentTime;
    wind.buffer = this.windBuffer;
    wind.loop = true;
    filter.type = "bandpass";
    filter.Q.value = 0.6;
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.linearRampToValueAtTime(1300, now + duration * 0.4);
    filter.frequency.linearRampToValueAtTime(340, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.13, now + duration * 0.35);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    wind.connect(filter).connect(gain).connect(ctx.destination);
    wind.start();
    wind.stop(now + duration);
  }
  coin() {
    this.tone(880, 0.14, "sine", 0.06, 1320);
    setTimeout(() => this.tone(1760, 0.2, "sine", 0.04), 85);
  }
  bump() {
    this.tone(140, 0.09, "triangle", 0.04, 95);
  }
  death() {
    this.tone(330, 0.35, "triangle", 0.07, 75);
  }
  success() {
    [523, 659, 784, 1047].forEach(
      (f, i) => setTimeout(() => this.tone(f, 0.24, "sine", 0.06), i * 95)
    );
  }
  tick(dt) {
    this.timer += dt;
    if (this.timer > 9) {
      this.timer = 0;
      this.tone(1800, 0.13, "sine", 0.014, 2400);
      setTimeout(() => this.tone(2200, 0.16, "sine", 9e-3, 1600), 170);
    }
  }
}

});
