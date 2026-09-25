"use strict";
// tavern music and sound effects, synthesised with Web Audio
(function (YB) {
  const NOTE = (name) => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return 440 * Math.pow(2, (base + (Number(m[3]) - 4) * 12) / 12);
  };

  // a jig in G, 6/8
  const JIG = [
    ["G4", 2], ["B4", 1], ["D5", 2], ["B4", 1], ["C5", 2], ["E5", 1], ["D5", 2], ["B4", 1], ["A4", 2], ["B4", 1], ["C5", 2], ["A4", 1], ["B4", 3], ["G4", 3],
    ["G4", 2], ["B4", 1], ["D5", 2], ["G5", 1], ["F#5", 2], ["E5", 1], ["D5", 2], ["B4", 1], ["C5", 2], ["A4", 1], ["F#4", 2], ["A4", 1], ["G4", 6],
    ["D5", 2], ["E5", 1], ["F#5", 2], ["G5", 1], ["A5", 2], ["G5", 1], ["F#5", 2], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 2], ["B4", 1], ["A4", 3], ["D5", 3],
    ["G5", 2], ["F#5", 1], ["E5", 2], ["D5", 1], ["C5", 2], ["B4", 1], ["A4", 2], ["G4", 1], ["F#4", 2], ["A4", 1], ["D5", 2], ["F#4", 1], ["G4", 6],
  ];
  const CHORDS = [
    ["G2", "G3", "B3", "D4"], ["C3", "C4", "E4", "G4"], ["D3", "D4", "F#4", "A4"], ["G2", "G3", "B3", "D4"],
    ["G2", "G3", "B3", "D4"], ["D3", "D4", "F#4", "A4"], ["D3", "C4", "D4", "F#4"], ["G2", "G3", "B3", "D4"],
    ["D3", "D4", "F#4", "A4"], ["D3", "D4", "F#4", "A4"], ["G2", "G3", "B3", "D4"], ["D3", "D4", "F#4", "A4"],
    ["E3", "E4", "G4", "B4"], ["C3", "C4", "E4", "G4"], ["D3", "D4", "F#4", "A4"], ["G2", "G3", "B3", "D4"],
  ];
  const SONGS = {
    tavern: { step: 0.19, drums: 0.5, shift: 0 },
    table: { step: 0.15, drums: 1, shift: 2 },
  };

  const transpose = (name, steps) => (steps ? NOTE(name) * Math.pow(2, steps / 12) : NOTE(name));

  class Engine {
    constructor() {
      this.ctx = null;
      this.volumes = { music: 0.5, sfx: 0.8 };
      this.plucks = new Map();
      this.song = null;
      this.pace = 1;
    }

    unlock() {
      if (!this.ctx) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        const ctx = (this.ctx = new Context());
        const master = ctx.createDynamicsCompressor();
        master.threshold.value = -14;
        master.ratio.value = 3;
        master.connect(ctx.destination);

        this.room = ctx.createGain();
        this.room.gain.value = 0.18;
        const a = ctx.createDelay(0.5);
        const b = ctx.createDelay(0.5);
        a.delayTime.value = 0.067;
        b.delayTime.value = 0.109;
        const damp = ctx.createBiquadFilter();
        damp.type = "lowpass";
        damp.frequency.value = 2400;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.38;
        this.room.connect(a).connect(b).connect(damp).connect(feedback).connect(a);
        damp.connect(master);

        this.sfx = ctx.createGain();
        this.sfx.gain.value = this.volumes.sfx;
        this.sfx.connect(master);
        this.sfx.connect(this.room);
        this.music = ctx.createGain();
        this.music.gain.value = this.volumes.music * 0.8;
        this.music.connect(master);
        this.music.connect(this.room);

        this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        this.next = 0;
        this.index = 0;
        this.eighth = 0;
        setInterval(() => this.schedule(), 100);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    }

    get ready() {
      return this.ctx?.state === "running";
    }

    setVolumes(music, sfx) {
      this.volumes = { music, sfx };
      if (!this.ctx) return;
      this.music.gain.setTargetAtTime(music * 0.8, this.ctx.currentTime, 0.2);
      this.sfx.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.1);
    }

    pluckBuffer(freq, damping) {
      const key = `${Math.round(freq * 10)}/${damping}`;
      if (this.plucks.has(key)) return this.plucks.get(key);
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * (damping === "muted" ? 0.6 : 2));
      const buffer = this.ctx.createBuffer(1, length, rate);
      const out = buffer.getChannelData(0);
      const period = Math.max(2, Math.round(rate / freq));
      const line = new Float32Array(period);
      let last = 0;
      for (let i = 0; i < period; i++) {
        last += (Math.random() * 2 - 1 - last) * 0.7;
        line[i] = last;
      }
      const decay = damping === "muted" ? 0.97 : 0.995 - Math.min(0.004, freq / 400000);
      let at = 0;
      for (let n = 0; n < length; n++) {
        const current = line[at];
        const next = line[(at + 1) % period];
        line[at] = (current + next) * 0.5 * decay;
        out[n] = current;
        at = (at + 1) % period;
      }
      this.plucks.set(key, buffer);
      return buffer;
    }

    pluck(note, { at = null, delay = 0, volume = 0.3, bus = "sfx", damping = "open", pan = 0, shift = 0 } = {}) {
      if (!this.ctx) return;
      const start = at ?? this.ctx.currentTime + delay;
      const freq = typeof note === "number" ? note : transpose(note, shift);
      const source = this.ctx.createBufferSource();
      source.buffer = this.pluckBuffer(freq, damping);
      const tone = this.ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 4200;
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      source.connect(tone).connect(gain);
      const out = bus === "music" ? this.music : this.sfx;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner).connect(out);
      } else gain.connect(out);
      source.start(start);
    }

    tone({ freq, to = null, type = "sine", duration = 0.2, volume = 0.1, attack = 0.005, delay = 0, at = null, bus = "sfx" }) {
      if (!this.ctx) return;
      const start = at ?? this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(bus === "music" ? this.music : this.sfx);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    }

    hiss({ duration = 0.15, volume = 0.1, filter = 2000, to = null, q = 1, kind = "bandpass", delay = 0, at = null, bus = "sfx" }) {
      if (!this.ctx) return;
      const start = at ?? this.ctx.currentTime + delay;
      const source = this.ctx.createBufferSource();
      source.buffer = this.noise;
      const shape = this.ctx.createBiquadFilter();
      shape.type = kind;
      shape.Q.value = q;
      shape.frequency.setValueAtTime(filter, start);
      if (to) shape.frequency.exponentialRampToValueAtTime(to, start + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.01, duration / 4));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(shape).connect(gain).connect(bus === "music" ? this.music : this.sfx);
      source.start(start, Math.random());
      source.stop(start + duration + 0.05);
    }

    bell(freq, delay = 0, volume = 0.05) {
      [1, 2.76, 5.4].forEach((ratio, i) => this.tone({ freq: freq * ratio, duration: 1.2 / (i + 1), volume: volume / (i + 1), delay }));
    }

    drum(at, volume) {
      this.tone({ freq: 110, to: 48, duration: 0.18, volume, at, bus: "music" });
      this.hiss({ duration: 0.04, volume: volume * 0.25, filter: 700, kind: "lowpass", at, bus: "music" });
    }

    jingle(at, volume) {
      this.hiss({ duration: 0.07, volume, filter: 7500, kind: "highpass", q: 0.8, at, bus: "music" });
    }

    play(song) {
      if (this.song === song) return;
      this.song = song;
      this.index = 0;
      this.eighth = 0;
      this.next = 0;
    }

    schedule() {
      if (!this.ready || !this.song || this.volumes.music <= 0) return;
      const now = this.ctx.currentTime;
      if (this.next < now) this.next = now + 0.1;
      while (this.next < now + 0.5) this.stepJig(this.next);
    }

    stepJig(at) {
      const song = SONGS[this.song];
      const step = song.step / this.pace;
      const [note, length] = JIG[this.index % JIG.length];
      for (let i = 0; i < length; i++) {
        const e = this.eighth + i;
        const t = at + i * step;
        const beat = e % 6;
        const chord = CHORDS[Math.floor(e / 6) % CHORDS.length];
        if (beat === 0 || beat === 3) {
          this.pluck(chord[0], { at: t, volume: beat === 0 ? 0.2 : 0.13, bus: "music", pan: -0.3, shift: song.shift });
          chord.slice(1).forEach((n, k) => this.pluck(n, { at: t + 0.012 * (k + 1), volume: 0.05, bus: "music", pan: -0.1, damping: "muted", shift: song.shift }));
          this.drum(t, (beat === 0 ? 0.26 : 0.14) * song.drums);
        } else if (song.drums > 0.6 || beat % 2 === 0) {
          this.jingle(t, (beat === 2 || beat === 5 ? 0.035 : 0.02) * song.drums);
        }
      }
      this.pluck(note, { at, volume: 0.15, bus: "music", pan: 0.25, shift: song.shift });
      this.eighth += length;
      this.index++;
      this.next = at + length * step;
    }
  }

  const engine = new Engine();
  let lastCoin = 0;

  const SOUNDS = {
    button(a) {
      a.tone({ freq: 520, to: 420, duration: 0.05, volume: 0.09, type: "square" });
    },
    deal(a) {
      a.hiss({ duration: 0.09, volume: 0.06, filter: 2400, to: 5200, q: 1.2 });
    },
    place(a, lane = 0) {
      a.tone({ freq: 150 + lane * 12, to: 70, duration: 0.1, volume: 0.24 });
      a.hiss({ duration: 0.05, volume: 0.1, filter: 1400, kind: "lowpass" });
      a.pluck(["G3", "B3", "D4", "G4"][lane] || "G3", { volume: 0.08, damping: "muted" });
    },
    hold(a) {
      a.hiss({ duration: 0.16, volume: 0.07, filter: 900, to: 400, q: 0.8 });
      a.tone({ freq: 220, to: 180, duration: 0.08, volume: 0.08 });
    },
    clear(a, { kind = "twentyOne", combo = 1 } = {}) {
      const root = Math.min(5, combo - 1) * 2;
      const notes = kind === "blackjack" ? ["G4", "B4", "D5", "G5", "B5", "D6"] : ["G4", "B4", "D5", "G5"];
      notes.forEach((n, i) => a.pluck(n, { delay: i * 0.05, volume: 0.22, shift: root }));
      for (let i = 0; i < 6; i++) a.tone({ freq: 2200 + Math.random() * 1600, duration: 0.12, volume: 0.03, delay: 0.1 + i * 0.045, type: "triangle" });
      a.hiss({ duration: 0.3, volume: 0.05, filter: 8000, kind: "highpass", delay: 0.05 });
      if (kind === "joker") for (let i = 0; i < 8; i++) a.bell(1800 + (i % 4) * 300, i * 0.05, 0.02);
      if (kind === "blackjack") a.bell(NOTE("G5"), 0.3, 0.05);
      if (kind === "five") a.pluck("D6", { delay: 0.25, volume: 0.15, shift: root });
    },
    bust(a) {
      a.hiss({ duration: 0.35, volume: 0.22, filter: 3000, to: 300, q: 0.9 });
      a.tone({ freq: 90, to: 40, duration: 0.3, volume: 0.35 });
      a.pluck("D4", { delay: 0.12, volume: 0.18 });
      a.pluck("C#4", { delay: 0.26, volume: 0.16 });
      a.pluck("C4", { delay: 0.4, volume: 0.14 });
    },
    coin(a) {
      const now = a.ctx.currentTime;
      if (now - lastCoin < 0.04) return;
      lastCoin = now;
      a.tone({ freq: 1900 + Math.random() * 500, duration: 0.08, volume: 0.035, type: "square" });
    },
    tick(a) {
      a.tone({ freq: 1400, duration: 0.03, volume: 0.05, type: "square" });
    },
    timeUp(a) {
      a.bell(NOTE("D5"), 0, 0.08);
      a.bell(NOTE("A4"), 0.25, 0.07);
    },
    star(a, i = 0) {
      a.pluck(["D5", "G5", "B5"][i] || "D6", { volume: 0.25 });
      a.tone({ freq: [1200, 1600, 2000][i] || 2400, duration: 0.25, volume: 0.04, delay: 0.03, type: "triangle" });
    },
    win(a) {
      ["G4", "B4", "D5", "G5", "D5", "G5", "B5"].forEach((n, i) => a.pluck(n, { delay: i * 0.09, volume: 0.22 }));
      a.bell(NOTE("G5"), 0.6, 0.05);
    },
    lose(a) {
      ["D5", "C5", "A4", "F#4", "G4"].forEach((n, i) => a.pluck(n, { delay: i * 0.14, volume: 0.18 }));
    },
    unlock(a) {
      ["D5", "G5", "B5", "D6"].forEach((n, i) => a.pluck(n, { delay: i * 0.1, volume: 0.2 }));
      a.bell(NOTE("B5"), 0.4, 0.05);
    },
    swish(a) {
      a.hiss({ duration: 0.22, volume: 0.07, filter: 800, to: 3000, q: 0.7 });
    },
    // a patron pulls up a stool and knocks on the table
    patron(a, lane = 0) {
      a.tone({ freq: 190, to: 120, duration: 0.06, volume: 0.16 });
      a.tone({ freq: 210, to: 130, duration: 0.06, volume: 0.13, delay: 0.11 });
      a.pluck(["B4", "D5", "E5", "G5"][lane] || "D5", { delay: 0.2, volume: 0.07 });
    },
    tip(a) {
      ["B5", "D6", "G6"].forEach((n, i) => a.pluck(n, { delay: 0.05 + i * 0.07, volume: 0.13 }));
      for (let i = 0; i < 5; i++) a.tone({ freq: 2300 + i * 180, duration: 0.07, volume: 0.03, delay: 0.08 + i * 0.05, type: "square" });
    },
    leave(a, angry = false) {
      if (angry) {
        a.tone({ freq: 160, to: 90, duration: 0.18, volume: 0.14, type: "square" });
        a.hiss({ duration: 0.2, volume: 0.06, filter: 1200, to: 500, delay: 0.05 });
      } else {
        a.pluck("A4", { volume: 0.1, damping: "muted" });
        a.pluck("F#4", { delay: 0.12, volume: 0.09, damping: "muted" });
      }
    },
    trick(a) {
      ["G5", "D6", "G6"].forEach((n, i) => a.bell(NOTE(n), i * 0.06, 0.05));
      a.hiss({ duration: 0.3, volume: 0.05, filter: 6000, kind: "highpass" });
    },
    sweep(a) {
      for (let i = 0; i < 3; i++) a.hiss({ duration: 0.12, volume: 0.09, filter: 1500 + i * 700, to: 4000, q: 0.8, delay: i * 0.09 });
    },
    buy(a) {
      for (let i = 0; i < 4; i++) a.tone({ freq: 1700 + i * 260, duration: 0.07, volume: 0.04, delay: i * 0.05, type: "square" });
      a.pluck("G5", { delay: 0.2, volume: 0.16 });
    },
  };

  YB.Audio = {
    unlock: () => engine.unlock(),
    play(name, argument) {
      if (!engine.ready || engine.volumes.sfx <= 0) return;
      SOUNDS[name]?.(engine, argument);
    },
    music: (song) => engine.play(song),
    pace: (value) => (engine.pace = value),
    setVolumes: (music, sfx) => engine.setVolumes(music, sfx),
  };
})(window.YirmibirHani);
