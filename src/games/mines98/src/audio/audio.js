"use strict";
// small square-wave sounds, like the ones old desktop speakers made
(function (M) {
  let ctx = null;
  let bus = null;
  let enabled = true;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    bus = ctx.createGain();
    bus.gain.value = 0.18;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4200;
    bus.connect(filter).connect(ctx.destination);
    return true;
  }

  function beep(freq, { when = 0, dur = 0.05, type = "square", to = freq, gain = 1 } = {}) {
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.setValueAtTime(gain, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, gain = 0.8) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(bus);
    src.start();
  }

  const SOUNDS = {
    click() {
      beep(1200, { dur: 0.012, gain: 0.5 });
    },
    open({ cells = 1 } = {}) {
      beep(cells > 6 ? 660 : 880, { dur: 0.03, gain: 0.6 });
      if (cells > 6) beep(990, { when: 0.035, dur: 0.03, gain: 0.5 });
    },
    flag() {
      beep(520, { dur: 0.03, gain: 0.6 });
      beep(780, { when: 0.03, dur: 0.03, gain: 0.6 });
    },
    unflag() {
      beep(780, { dur: 0.03, gain: 0.5 });
      beep(520, { when: 0.03, dur: 0.03, gain: 0.5 });
    },
    tick() {
      beep(1800, { dur: 0.008, gain: 0.25 });
    },
    boom() {
      noise(0.5, 1);
      beep(140, { dur: 0.4, type: "sawtooth", to: 40, gain: 0.8 });
    },
    win() {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => beep(f, { when: i * 0.08, dur: 0.07, gain: 0.6 }));
    },
    chime() {
      [880, 1175].forEach((f, i) => beep(f, { when: i * 0.09, dur: 0.12, type: "triangle", gain: 0.8 }));
    },
    error() {
      beep(220, { dur: 0.12, gain: 0.6 });
    },
  };

  M.Audio = {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
    },

    play(name, options) {
      if (!enabled || !ctx || ctx.state !== "running") return;
      SOUNDS[name]?.(options);
    },

    setEnabled(on) {
      enabled = on;
    },
  };
})(window.Mines98);
