// small synthesiser on top of Web Audio
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buses = {};
    this.volumes = { music: 0.5, sfx: 0.8 };
    this.noiseBuffer = null;
  }

  // must run inside a user gesture the first time (browser autoplay rules)
  unlock() {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      this.ctx = new Context();
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 6;
      limiter.connect(this.ctx.destination);
      for (const name of ['music', 'sfx']) {
        const gain = this.ctx.createGain();
        gain.gain.value = this.volumes[name];
        gain.connect(limiter);
        this.buses[name] = gain;
      }
      this.noiseBuffer = this.makeNoise();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  get ready() {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  setVolume(bus, value) {
    this.volumes[bus] = value;
    const gain = this.buses[bus]?.gain;
    if (gain) gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
  }

  makeNoise() {
    const length = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // one enveloped oscillator note
  tone({ freq, to = null, type = 'square', duration = 0.1, volume = 0.1, attack = 0.004, at = null, delay = 0, bus = 'sfx' }) {
    if (!this.ctx) return;
    const start = at ?? this.ctx.currentTime + delay;
    const end = start + duration;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(this.buses[bus]);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  noise({ duration = 0.1, volume = 0.1, filter = 2000, q = 1, kind = 'bandpass', at = null, delay = 0, bus = 'sfx' }) {
    if (!this.ctx) return;
    const start = at ?? this.ctx.currentTime + delay;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const shaper = this.ctx.createBiquadFilter();
    shaper.type = kind;
    shaper.frequency.value = filter;
    shaper.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(shaper).connect(gain).connect(this.buses[bus]);
    source.start(start, Math.random() * 0.5);
    source.stop(start + duration + 0.02);
  }
}

// frequency of a note name such as "C5", "F#4" or "Bb3"
export function noteFrequency(name) {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`Bad note "${name}"`);
  const [, letter, accidental, octave] = match;
  const semitone = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (semitone + (Number(octave) - 4) * 12) / 12);
}
