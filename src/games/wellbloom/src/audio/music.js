import { noteFrequency } from './engine.js';
import { SONGS } from './songs.js';

const LOOKAHEAD = 0.25;

function parseTrack({ wave, volume, notes }) {
  const tokens = notes.split(/\s+/).filter((token) => token && token !== '|');
  const byStep = new Map();
  let last = null;
  tokens.forEach((token, step) => {
    if (token === '-') {
      if (last && last.step + last.length === step) last.length++;
      return;
    }
    last = null;
    if (token === '.') return;
    last = token === 'x' ? { step, length: 1, hit: true } : { step, length: 1, freq: noteFrequency(token) };
    byStep.set(step, last);
  });
  return { wave, volume, byStep, steps: tokens.length };
}

export function compileSong(song) {
  const tracks = song.tracks.map(parseTrack);
  return {
    tracks,
    steps: Math.max(...tracks.map((track) => track.steps)),
    stepDuration: 60 / song.bpm / 2,
  };
}

// schedules looping songs slightly ahead of time on the audio clock
export class MusicPlayer {
  constructor(engine) {
    this.engine = engine;
    this.songId = null;
    this.song = null;
    this.timer = null;
    this.compiled = new Map();
  }

  play(songId) {
    if (this.songId === songId) return;
    if (!this.compiled.has(songId)) this.compiled.set(songId, compileSong(SONGS[songId]));
    this.songId = songId;
    this.song = this.compiled.get(songId);
    this.step = 0;
    this.nextTime = null;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.songId = null;
    this.song = null;
  }

  tick() {
    const { engine } = this;
    if (!engine.ready || !this.song || engine.volumes.music <= 0) {
      this.nextTime = null;
      return;
    }
    if (this.nextTime === null || this.nextTime < engine.now) this.nextTime = engine.now + 0.1;
    while (this.nextTime < engine.now + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % this.song.steps;
      this.nextTime += this.song.stepDuration;
    }
  }

  playStep(step, at) {
    const { stepDuration } = this.song;
    for (const track of this.song.tracks) {
      const event = track.byStep.get(step);
      if (!event) continue;
      if (event.hit) {
        this.engine.noise({ duration: 0.04, volume: track.volume, filter: 7000, kind: 'highpass', at, bus: 'music' });
      } else {
        this.engine.tone({
          freq: event.freq,
          type: track.wave,
          duration: event.length * stepDuration * 0.92,
          volume: track.volume,
          attack: 0.012,
          at,
          bus: 'music',
        });
      }
    }
  }
}
