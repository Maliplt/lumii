"use strict";
// sound made on the spot
(function (B) {
  let ctx = null;
  let sfxBus = null;
  let musicBus = null;
  let noise = null;
  let volumes = { music: 0.5, sfx: 0.8 };
  let wantMusic = false;
  let timer = null;

  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const hz = (semi) => 261.63 * 2 ** (semi / 12);
  const degree = (d) => MAJOR[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 3.5;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    apply();
    return true;
  }

  function apply() {
    if (!ctx) return;
    sfxBus.gain.value = volumes.sfx * 0.85;
    musicBus.gain.value = volumes.music * 0.3;
  }

  function tone(freq, { when = 0, dur = 0.15, gain = 0.2, type = "sine", to = freq, attack = 0.005, bus = sfxBus } = {}) {
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // a marimba-like note: a sine with a quick bright overtone
  function mallet(freq, { when = 0, gain = 0.2, dur = 0.5, bus = sfxBus } = {}) {
    tone(freq, { when, dur, gain, type: "sine", bus });
    tone(freq * 4, { when, dur: dur * 0.18, gain: gain * 0.35, type: "sine", bus });
    tone(freq * 2, { when, dur: dur * 0.4, gain: gain * 0.2, type: "triangle", bus });
  }

  function hiss({ when = 0, dur = 0.08, gain = 0.2, type = "bandpass", from = 2000, to = from, q = 1 } = {}) {
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
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }

  const SOUNDS = {
    tap() {
      tone(900, { dur: 0.05, gain: 0.08, type: "triangle", to: 700 });
      hiss({ dur: 0.03, gain: 0.08, from: 3000 });
    },
    open() {
      tone(500, { dur: 0.18, gain: 0.08, type: "sine", to: 900 });
    },
    locked() {
      tone(220, { dur: 0.14, gain: 0.18, type: "triangle", to: 150 });
    },
    pick() {
      tone(520, { dur: 0.1, gain: 0.16, type: "sine", to: 980 });
    },
    tick() {
      tone(1400, { dur: 0.025, gain: 0.04, type: "triangle" });
    },
    miss() {
      tone(420, { dur: 0.16, gain: 0.12, type: "sine", to: 260 });
    },
    place({ size = 4 } = {}) {
      const p = 1.25 - Math.min(size, 9) * 0.05;
      tone(180 * p, { dur: 0.12, gain: 0.3, type: "triangle", to: 110 * p });
      hiss({ dur: 0.05, gain: 0.16, from: 1800 * p, q: 1.2 });
      tone(760 * p, { dur: 0.05, gain: 0.08, type: "square", when: 0.005 });
    },
    clear({ lines = 1, combo = 1 } = {}) {
      const root = Math.min(10, combo - 1) + 7;
      [0, 2, 4, 7].slice(0, 2 + Math.min(2, lines)).forEach((d, i) => mallet(hz(degree(root + d)), { when: i * 0.06, gain: 0.22 }));
      hiss({ dur: 0.35, gain: 0.07, type: "highpass", from: 4000, to: 9000, q: 0.5 });
      if (lines >= 2) [0, 4, 7, 11].forEach((d, i) => tone(hz(degree(root + d + 7)), { when: 0.25 + i * 0.05, dur: 0.25, gain: 0.07, type: "triangle" }));
    },
    comboLost() {
      tone(330, { dur: 0.2, gain: 0.08, type: "sine", to: 220 });
    },
    crate() {
      hiss({ dur: 0.12, gain: 0.3, from: 900, to: 300, q: 0.8 });
      tone(140, { dur: 0.1, gain: 0.25, type: "triangle", to: 80 });
    },
    crack() {
      hiss({ dur: 0.15, gain: 0.22, type: "highpass", from: 5000, to: 2500, q: 2 });
      tone(2200, { dur: 0.08, gain: 0.08, type: "sine", to: 1600 });
    },
    gem() {
      mallet(hz(degree(14 + Math.floor(Math.random() * 3))), { gain: 0.14, dur: 0.35 });
      tone(hz(degree(21)), { dur: 0.2, gain: 0.05, when: 0.04 });
    },
    perfect() {
      [0, 2, 4, 7, 9, 11, 14].forEach((d, i) => mallet(hz(degree(7 + d)), { when: i * 0.07, gain: 0.2 }));
    },
    deal() {
      [0, 1, 2].forEach((i) => tone(hz(degree(9 + i * 2)), { when: i * 0.07, dur: 0.08, gain: 0.07, type: "triangle" }));
    },
    smash() {
      hiss({ dur: 0.2, gain: 0.35, from: 1200, to: 200, q: 0.7 });
      tone(90, { dur: 0.2, gain: 0.35, type: "sine", to: 40 });
    },
    booster() {
      tone(600, { dur: 0.25, gain: 0.12, type: "sine", to: 1200 });
      hiss({ dur: 0.25, gain: 0.06, type: "highpass", from: 3000, to: 7000 });
    },
    win() {
      [0, 4, 7, 11, 14].forEach((d, i) => mallet(hz(degree(d)), { when: i * 0.1, gain: 0.24, dur: 0.7 }));
      [0, 2, 4].forEach((d) => mallet(hz(degree(d + 7)), { when: 0.6, gain: 0.16, dur: 1.2 }));
    },
    lose() {
      [7, 5, 3, 0].forEach((d, i) => mallet(hz(degree(d)), { when: i * 0.14, gain: 0.18, dur: 0.6 }));
    },
    perk() {
      [0, 4, 7, 12].forEach((d, i) => mallet(hz(degree(11 + d)), { when: i * 0.04, gain: 0.13, dur: 0.4 }));
      hiss({ dur: 0.3, gain: 0.05, type: "highpass", from: 4000, to: 9000 });
    },
    count() {
      tone(hz(degree(14 + Math.floor(Math.random() * 2))), { dur: 0.03, gain: 0.03, type: "triangle" });
    },
    star({ index = 0 } = {}) {
      mallet(hz(degree(9 + index * 2)), { gain: 0.22, dur: 0.5 });
      tone(hz(degree(16 + index * 2)), { dur: 0.3, gain: 0.06, when: 0.05 });
    },
  };

  // I – V – vi – IV, eight steps a bar
  const CHORDS = [
    [0, 2, 4],
    [4, 6, 8],
    [5, 7, 9],
    [3, 5, 7],
  ];
  const TUNE = [4, null, 2, 4, 7, null, 6, 4, 2, null, 4, null, 5, 4, 2, null, 0, null, 2, 4, 5, null, 4, 2, 3, null, 2, null, 0, null, null, null];
  let step = 0;
  let nextAt = 0;

  function schedule() {
    if (!ctx || !wantMusic) return;
    const beat = 60 / 112 / 2;
    while (nextAt < ctx.currentTime + 0.35) {
      const when = nextAt - ctx.currentTime;
      const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
      const inBar = step % 8;
      if (inBar === 0 || inBar === 4) tone(hz(degree(chord[0]) - 24), { when, dur: 0.28, gain: 0.3, type: "triangle", bus: musicBus });
      if (inBar % 2 === 1) mallet(hz(degree(chord[(inBar >> 1) % 3])), { when, gain: 0.07, dur: 0.25, bus: musicBus });
      const note = TUNE[step % TUNE.length];
      if (note !== null) mallet(hz(degree(note + 7)), { when, gain: 0.11, dur: 0.35, bus: musicBus });
      if (inBar % 2 === 0) {
        const t = ctx.currentTime + when;
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = "highpass";
        f.frequency.value = 7000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        src.connect(f).connect(g).connect(musicBus);
        src.start(t, Math.random() * 0.5, 0.08);
      }
      step++;
      nextAt += beat;
    }
  }

  B.Audio = {
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
      if (wantMusic && !timer) {
        nextAt = ctx.currentTime + 0.2;
        timer = setInterval(schedule, 100);
      } else if (!wantMusic && timer) {
        clearInterval(timer);
        timer = null;
      }
    },

    setVolumes(music, sfx) {
      volumes = { music, sfx };
      apply();
      if (ctx) this.music(music > 0);
    },
  };
})(window.Blockhaven);
