"use strict";
// cartoon sounds, all synthesised
(function (V) {
  const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);
  // c major pentatonic from C4 upwards, as MIDI numbers
  const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88];

  // a two-bar loop: bass notes and a melody, sixteen steps per bar
  const BASS = [48, null, null, 55, 48, null, 55, null, 45, null, null, 52, 45, null, 52, null, 41, null, null, 48, 41, null, 48, null, 43, null, null, 50, 43, null, 47, null];
  const TUNE = [72, null, 76, null, 79, 76, null, 72, 74, null, 72, null, 69, null, null, null, 69, null, 72, null, 74, 72, null, 69, 67, null, 69, null, 72, null, null, null];

  class Engine {
    constructor() {
      this.ctx = null;
      this.volumes = { music: 0.5, sfx: 0.8 };
      this.musicOn = false;
      this.last = {};
    }

    get ready() {
      return this.ctx && this.ctx.state === "running";
    }

    unlock() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain();
        this.music = this.ctx.createGain();
        this.sfx.connect(this.master);
        this.music.connect(this.master);
        this.setVolumes(this.volumes.music, this.volumes.sfx);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      if (this.wantMusic && !this.musicOn) this.startMusic();
    }

    setVolumes(music, sfx) {
      this.volumes = { music, sfx };
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.music.gain.setTargetAtTime(music * 0.35, now, 0.2);
      this.sfx.gain.setTargetAtTime(sfx * 0.9, now, 0.05);
    }

    env(g, t, peak, attack, release) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    }

    // a tone that slides from one pitch to another
    tone({ from, to = from, at = 0, length = 0.15, volume = 0.2, type = "sine", bus = this.sfx, attack = 0.005 }) {
      const c = this.ctx;
      const t = c.currentTime + at;
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + length);
      const g = c.createGain();
      this.env(g, t, volume, attack, length);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + attack + length + 0.05);
    }

    noise({ at = 0, length = 0.2, volume = 0.1, freq = 3000, q = 1, type = "bandpass", sweep = null }) {
      const c = this.ctx;
      const t = c.currentTime + at;
      const n = Math.round(c.sampleRate * length);
      const buffer = c.createBuffer(1, n, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = type;
      filter.frequency.setValueAtTime(freq, t);
      if (sweep) filter.frequency.exponentialRampToValueAtTime(sweep, t + length);
      filter.Q.value = q;
      const g = c.createGain();
      this.env(g, t, volume, 0.01, length);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.sfx);
      src.start(t);
    }

    // a small meow: a buzzy voice sliding up and down through two formants
    meow({ at = 0, pitch = 1, volume = 0.16 } = {}) {
      const c = this.ctx;
      const t = c.currentTime + at;
      const osc = c.createOscillator();
      osc.type = "sawtooth";
      const f = 520 * pitch;
      osc.frequency.setValueAtTime(f * 0.8, t);
      osc.frequency.linearRampToValueAtTime(f * 1.35, t + 0.12);
      osc.frequency.linearRampToValueAtTime(f * 0.9, t + 0.34);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(volume, t + 0.05);
      g.gain.setValueAtTime(volume, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      const a = c.createBiquadFilter();
      a.type = "bandpass";
      a.Q.value = 6;
      a.frequency.setValueAtTime(900, t);
      a.frequency.linearRampToValueAtTime(1500, t + 0.14);
      a.frequency.linearRampToValueAtTime(800, t + 0.36);
      const b = c.createBiquadFilter();
      b.type = "bandpass";
      b.Q.value = 8;
      b.frequency.value = 2600;
      const mix = c.createGain();
      mix.gain.value = 0.6;
      osc.connect(g);
      g.connect(a);
      g.connect(b);
      a.connect(this.sfx);
      b.connect(mix);
      mix.connect(this.sfx);
      osc.start(t);
      osc.stop(t + 0.42);
    }

    // a marimba-ish note: a sine with a quick knock on top
    mallet(midi, { at = 0, volume = 0.18, bus = this.sfx, length = 0.5 } = {}) {
      const f = NOTE(midi);
      this.tone({ from: f, at, length, volume, bus, attack: 0.003 });
      this.tone({ from: f * 4, at, length: 0.05, volume: volume * 0.35, bus, attack: 0.002 });
    }

    // music

    startMusic() {
      this.wantMusic = true;
      if (!this.ready || this.musicOn) return;
      this.musicOn = true;
      this.step = 0;
      this.next = this.ctx.currentTime + 0.1;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.schedule(), 100);
    }

    stopMusic() {
      this.wantMusic = false;
      this.musicOn = false;
      clearInterval(this.timer);
    }

    schedule() {
      if (!this.ready) return;
      const beat = 60 / 112 / 4;
      while (this.next < this.ctx.currentTime + 0.3) {
        const at = this.next - this.ctx.currentTime;
        const i = this.step % BASS.length;
        if (BASS[i] !== null) this.tone({ from: NOTE(BASS[i]), at, length: 0.22, volume: 0.22, type: "triangle", bus: this.music });
        if (TUNE[i] !== null && this.step % 64 >= 32) this.mallet(TUNE[i], { at, volume: 0.1, bus: this.music, length: 0.35 });
        if (i % 4 === 2) this.tone({ from: 5200, at, length: 0.03, volume: 0.03, type: "square", bus: this.music });
        this.step++;
        this.next += beat;
      }
    }
  }

  const engine = new Engine();

  const SOUNDS = {
    tap(a) {
      a.tone({ from: 660, to: 880, length: 0.06, volume: 0.1 });
    },
    pick(a) {
      a.tone({ from: 500, to: 760, length: 0.07, volume: 0.1, type: "triangle" });
    },
    stretch(a, rect) {
      const now = a.ctx.currentTime;
      if (now - (a.last.stretch || 0) < 0.03) return;
      a.last.stretch = now;
      const area = rect ? rect.w * rect.h : 2;
      a.tone({ from: 300 + Math.min(16, area) * 45, length: 0.04, volume: 0.06, type: "square" });
    },
    place(a, { area = 4 } = {}) {
      a.tone({ from: 180, to: 420, length: 0.16, volume: 0.25, type: "sine" });
      a.tone({ from: 420, to: 260, at: 0.08, length: 0.14, volume: 0.12 });
      a.noise({ length: 0.08, volume: 0.06, freq: 900, q: 0.8, type: "lowpass" });
      a.meow({ at: 0.12, pitch: 1.35 - Math.min(10, area) * 0.05, volume: 0.13 });
    },
    wrong(a) {
      a.noise({ length: 0.35, volume: 0.14, freq: 5000, q: 0.6, type: "highpass" });
      a.tone({ from: 140, to: 110, length: 0.3, volume: 0.14, type: "sawtooth" });
    },
    remove(a) {
      a.tone({ from: 900, to: 180, length: 0.12, volume: 0.18 });
      a.noise({ length: 0.12, volume: 0.07, freq: 1800, q: 1 });
    },
    undo(a) {
      a.noise({ length: 0.18, volume: 0.07, freq: 3000, sweep: 600, q: 2 });
      a.tone({ from: 700, to: 400, length: 0.1, volume: 0.08, type: "triangle" });
    },
    hint(a) {
      [72, 76, 79, 84].forEach((n, i) => a.mallet(n, { at: i * 0.07, volume: 0.14 }));
    },
    win(a) {
      [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => a.mallet(n, { at: i * 0.1, volume: 0.18 }));
      a.meow({ at: 0.75, pitch: 1.2, volume: 0.14 });
      a.meow({ at: 0.95, pitch: 0.9, volume: 0.14 });
      a.meow({ at: 1.1, pitch: 1.5, volume: 0.12 });
    },
    star(a, i = 0) {
      a.mallet(SCALE[6 + i * 2], { volume: 0.2 });
      a.tone({ from: NOTE(SCALE[6 + i * 2]) * 2, at: 0.05, length: 0.2, volume: 0.06, type: "triangle" });
    },
    open(a) {
      a.tone({ from: 400, to: 800, length: 0.12, volume: 0.12, type: "triangle" });
    },
    locked(a) {
      a.tone({ from: 220, to: 150, length: 0.14, volume: 0.18, type: "square" });
    },
    meow(a) {
      a.meow({ pitch: 0.8 + Math.random() * 0.6 });
    },
  };

  V.Audio = {
    unlock: () => engine.unlock(),
    play(name, arg) {
      if (!engine.ready || engine.volumes.sfx <= 0) return;
      SOUNDS[name]?.(engine, arg);
    },
    music(on) {
      if (on) engine.startMusic();
      else engine.stopMusic();
    },
    setVolumes: (music, sfx) => engine.setVolumes(music, sfx),
  };
})(window.Purrfit);
