"use strict";
function createSortAudio(settings) {
  let context, noise;
  function tone(
    frequency,
    at,
    duration,
    volume,
    type = "sine",
    end = frequency,
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    gain.gain.setValueAtTime(0.001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  function liquid(at, duration) {
    if (!noise) {
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = noise.getChannelData(0);
      let seed = 9127;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 16807) % 2147483647;
        samples[i] = (seed / 2147483647) * 2 - 1;
      }
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = noise;
    source.loop = true;
    filter.type = "bandpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(650, at);
    filter.frequency.linearRampToValueAtTime(1450, at + duration);
    gain.gain.setValueAtTime(0.001, at);
    gain.gain.linearRampToValueAtTime(0.07, at + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(at);
    source.stop(at + duration + 0.02);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  return (kind, count = 1) => {
    if (settings.muted) return;
    try {
      context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === "suspended") context.resume();
      const now = context.currentTime;
      if (kind === "pour") {
        const duration = 0.28 + count * 0.095;
        liquid(now + 0.22, duration);
        for (let i = 0; i < count + 2; i++)
          tone(
            260 + i * 47,
            now + 0.24 + i * 0.09,
            0.12,
            0.032,
            "sine",
            530 + i * 37,
          );
      } else if (kind === "select") {
        tone(820, now, 0.075, 0.05, "sine", 470);
        tone(190, now, 0.05, 0.025, "triangle", 120);
      } else if (kind === "blocked") {
        tone(145, now, 0.14, 0.04, "triangle", 100);
      } else if (kind === "complete") {
        [660, 990, 1320].forEach((f, i) =>
          tone(f, now + i * 0.055, 0.38, 0.035 / (1 + i * 0.3)),
        );
      } else if (kind === "win") {
        [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => {
          tone(f, now + i * 0.13, 0.65, 0.045);
          tone(f * 2, now + i * 0.13, 0.32, 0.013);
        });
      }
    } catch {}
  };
}
