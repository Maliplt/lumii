import { noteFrequency } from './engine.js';

// c major pentatonic from C5 upward: every step sounds good after the last
const RISING = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7'].map(noteFrequency);

const vary = (value, amount = 0.03) => value * (1 + (Math.random() - 0.5) * 2 * amount);

// sound effects by name
export const SOUNDS = {
  tap(a) {
    a.tone({ freq: vary(420), to: vary(620), type: 'square', duration: 0.05, volume: 0.06 });
    a.noise({ duration: 0.03, volume: 0.05, filter: 3500, q: 2 });
  },

  refuse(a) {
    a.tone({ freq: 150, to: 105, type: 'triangle', duration: 0.14, volume: 0.2 });
    a.noise({ duration: 0.05, volume: 0.05, filter: 400 });
  },

  // water reaching a tile; pitch climbs with distance from the spring
  fill(a, step = 0) {
    const freq = RISING[Math.min(step, RISING.length - 1)];
    a.tone({ freq, type: 'triangle', duration: 0.14, volume: 0.07 });
    a.tone({ freq: freq * 2, type: 'sine', duration: 0.08, volume: 0.025 });
  },

  bloom(a) {
    a.tone({ freq: noteFrequency('E6'), type: 'sine', duration: 0.12, volume: 0.07 });
    a.tone({ freq: noteFrequency('B6'), type: 'sine', duration: 0.18, volume: 0.05, delay: 0.06 });
    a.noise({ duration: 0.12, volume: 0.03, filter: 8000, q: 1, kind: 'highpass', delay: 0.02 });
  },

  win(a) {
    ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((note, i) =>
      a.tone({ freq: noteFrequency(note), type: 'square', duration: 0.14, volume: 0.06, delay: i * 0.075 }),
    );
    ['C5', 'E5', 'G5', 'C6'].forEach((note) =>
      a.tone({ freq: noteFrequency(note), type: 'triangle', duration: 0.7, volume: 0.07, attack: 0.02, delay: 0.4 }),
    );
  },

  star(a, index = 0) {
    const freq = noteFrequency(['G5', 'B5', 'D6'][index] ?? 'D6');
    a.tone({ freq, type: 'square', duration: 0.12, volume: 0.07 });
    a.tone({ freq: freq * 1.5, type: 'sine', duration: 0.25, volume: 0.05, delay: 0.05 });
  },

  hint(a) {
    a.tone({ freq: 600, to: 1500, type: 'sine', duration: 0.28, volume: 0.08 });
    [0.1, 0.17, 0.24].forEach((delay, i) =>
      a.tone({ freq: noteFrequency(['E6', 'G6', 'C7'][i]), type: 'triangle', duration: 0.1, volume: 0.04, delay }),
    );
  },

  undo(a) {
    a.tone({ freq: 620, to: 400, type: 'square', duration: 0.07, volume: 0.05 });
  },

  button(a) {
    a.tone({ freq: 880, type: 'square', duration: 0.035, volume: 0.04 });
  },

  swish(a) {
    a.noise({ duration: 0.22, volume: 0.06, filter: 1200, q: 0.7, kind: 'bandpass' });
  },

  dewdrop(a) {
    a.tone({ freq: 1320, to: 1760, type: 'sine', duration: 0.08, volume: 0.06 });
    a.tone({ freq: 2090, type: 'sine', duration: 0.1, volume: 0.04, delay: 0.07 });
  },

  unlock(a) {
    ['G4', 'C5', 'E5', 'G5', 'C6'].forEach((note, i) =>
      a.tone({ freq: noteFrequency(note), type: 'square', duration: i === 4 ? 0.5 : 0.1, volume: 0.06, delay: i * 0.09 }),
    );
  },

  discover(a) {
    ['E5', 'G5', 'B5', 'E6'].forEach((note, i) =>
      a.tone({ freq: noteFrequency(note), type: 'triangle', duration: 0.18, volume: 0.07, delay: i * 0.08 }),
    );
  },
};
