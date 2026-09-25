"use strict";
// all sound is made on the spot
(function (K) {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let musicBus = null;
  let volumes = { music: 0.5, sfx: 0.8 };
  let wantMusic = false;
  let musicTimer = null;
  const plucks = new Map();
  let noise = null;

  const PENTA = [0, 2, 4, 7, 9];
  const freq = (semi) => 293.66 * 2 ** (semi / 12);
  const scale = (step) => PENTA[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5);

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    const length = ctx.sampleRate;
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    applyVolumes();
    return true;
  }

  function applyVolumes() {
    if (!ctx) return;
    sfxBus.gain.value = volumes.sfx * 0.9;
    musicBus.gain.value = volumes.music * 0.32;
  }

  // a plucked string, rendered once per pitch and brightness
  function pluckBuffer(hz, bright = 0.5, seconds = 1.6) {
    const key = `${hz.toFixed(1)}:${bright}:${seconds}`;
    if (plucks.has(key)) return plucks.get(key);
    const rate = ctx.sampleRate;
    const n = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(1, n, rate);
    const out = buffer.getChannelData(0);
    const period = Math.max(2, Math.round(rate / hz));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin((i / period) * Math.PI));
    const damp = 0.994 + bright * 0.004;
    let idx = 0;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const cur = ring[idx];
      const next = ring[(idx + 1) % period];
      const v = (cur * (0.5 + bright * 0.2) + next * (0.5 - bright * 0.2)) * damp;
      ring[idx] = v;
      out[i] = cur * 0.7 + prev * 0.3;
      prev = cur;
      idx = (idx + 1) % period;
    }
    plucks.set(key, buffer);
    return buffer;
  }

  function pluck(hz, { when = 0, gain = 0.5, bright = 0.5, bus = sfxBus, pan = 0, seconds = 1.6 } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = pluckBuffer(hz, bright, seconds);
    const g = ctx.createGain();
    g.gain.value = gain;
    let node = src.connect(g);
    if (ctx.createStereoPanner && pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node = node.connect(p);
    }
    node.connect(bus);
    src.start(ctx.currentTime + when);
  }

  function noiseBurst({ when = 0, dur = 0.08, gain = 0.3, type = "bandpass", from = 2000, to = from, q = 1 } = {}) {
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }

  function tone(hz, { when = 0, dur = 0.12, gain = 0.25, type = "sine", to = hz } = {}) {
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(hz, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // a bead tapping down on paper
  function click(pitch = 1, gain = 0.35) {
    tone(520 * pitch, { dur: 0.05, gain: gain * 0.7, type: "triangle", to: 300 * pitch });
    noiseBurst({ dur: 0.035, gain: gain * 0.6, from: 3200 * pitch, q: 2 });
  }

  const SOUNDS = {
    tap() {
      noiseBurst({ dur: 0.05, gain: 0.18, from: 1800, to: 900, q: 0.8 });
      tone(660, { dur: 0.04, gain: 0.06, type: "triangle" });
    },
    open() {
      noiseBurst({ dur: 0.22, gain: 0.12, type: "bandpass", from: 600, to: 3200, q: 0.7 });
    },
    locked() {
      tone(160, { dur: 0.14, gain: 0.25, type: "triangle", to: 110 });
      noiseBurst({ dur: 0.05, gain: 0.12, from: 500, q: 1 });
    },
    pick() {
      tone(420, { dur: 0.09, gain: 0.22, type: "sine", to: 760 });
      noiseBurst({ dur: 0.03, gain: 0.08, from: 2600, q: 1.5 });
    },
    drop() {
      click(0.9, 0.4);
    },
    // a tangle comes loose; `step` climbs the scale as the page clears
    untie({ step = 0 } = {}) {
      pluck(freq(scale(step) + 12), { gain: 0.42, bright: 0.7, pan: (Math.random() - 0.5) * 0.4 });
    },
    tangle() {
      pluck(freq(-8), { gain: 0.3, bright: 0.1, seconds: 0.6 });
      pluck(freq(-7), { gain: 0.2, bright: 0.1, seconds: 0.6, when: 0.02 });
    },
    undo() {
      pluck(freq(7), { gain: 0.25, bright: 0.3 });
      pluck(freq(0), { gain: 0.25, bright: 0.3, when: 0.07 });
    },
    hint() {
      noiseBurst({ dur: 0.35, gain: 0.14, type: "bandpass", from: 1500, to: 7000, q: 3 });
      pluck(freq(14), { gain: 0.3, bright: 0.8, when: 0.3 });
    },
    pin() {
      click(1.6, 0.35);
      tone(1500, { dur: 0.08, gain: 0.06, type: "triangle", when: 0.02 });
    },
    win() {
      [0, 1, 2, 3, 4, 5, 6, 7, 9].forEach((s, i) => pluck(freq(scale(s)), { when: i * 0.075, gain: 0.34, bright: 0.65, pan: -0.5 + i / 8 }));
      [0, 4, 7, 12].forEach((s) => pluck(freq(s - 12), { when: 0.75, gain: 0.22, bright: 0.4, seconds: 2.4 }));
    },
    star({ index = 0 } = {}) {
      pluck(freq(scale(5 + index * 2)), { gain: 0.36, bright: 0.8 });
      tone(freq(scale(5 + index * 2) + 12), { dur: 0.3, gain: 0.05 });
    },
    reveal() {
      noiseBurst({ dur: 0.9, gain: 0.08, type: "highpass", from: 3000, to: 8000, q: 0.5 });
    },
  };

  // chords for the tune: D, B minor, G, A, each for one bar of eight steps
  const CHORDS = [
    [0, 4, 7],
    [-3, 0, 4],
    [-7, -3, 0],
    [-5, -1, 2],
  ];
  const MELODY = [7, null, 9, null, 12, 9, null, 7, 4, null, 7, null, 9, null, null, null, 2, null, 4, 7, null, 4, 2, null, 4, null, 2, null, 0, null, null, null];

  let step = 0;
  let nextAt = 0;
  function schedule() {
    if (!ctx || !wantMusic) return;
    const beat = 60 / 76 / 2;
    while (nextAt < ctx.currentTime + 0.4) {
      const bar = Math.floor(step / 8) % CHORDS.length;
      const inBar = step % 8;
      const when = nextAt - ctx.currentTime;
      const chord = CHORDS[bar];
      if (inBar === 0) pluck(freq(chord[0] - 24), { when, gain: 0.5, bright: 0.2, bus: musicBus, seconds: 2.2 });
      if (inBar % 2 === 1) pluck(freq(chord[(inBar >> 1) % 3] - 12), { when, gain: 0.18, bright: 0.35, bus: musicBus, pan: 0.3 });
      const note = MELODY[step % MELODY.length];
      if (note !== null) pluck(freq(note), { when, gain: 0.3, bright: 0.55, bus: musicBus, pan: -0.2, seconds: 1.8 });
      step++;
      nextAt += beat;
    }
  }

  K.Audio = {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
    },

    play(name, options) {
      if (!ctx || volumes.sfx <= 0 || ctx.state !== "running") return;
      SOUNDS[name]?.(options);
    },

    music(on) {
      wantMusic = on && volumes.music > 0;
      if (!ctx) return;
      if (wantMusic && !musicTimer) {
        nextAt = ctx.currentTime + 0.2;
        musicTimer = setInterval(schedule, 120);
      } else if (!wantMusic && musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },

    setVolumes(music, sfx) {
      volumes = { music, sfx };
      applyVolumes();
      if (ctx) this.music(music > 0);
    },
  };
})(window.Knotwise);
