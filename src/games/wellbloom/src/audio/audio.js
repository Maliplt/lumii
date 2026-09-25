import { AudioEngine } from './engine.js';
import { MusicPlayer } from './music.js';
import { SOUNDS } from './sounds.js';

const engine = new AudioEngine();
const music = new MusicPlayer(engine);

// the only audio entry point the rest of the game uses
export const audio = {
  unlock() {
    engine.unlock();
  },

  play(name, argument) {
    if (!engine.ready || engine.volumes.sfx <= 0) return;
    SOUNDS[name]?.(engine, argument);
  },

  music(songId) {
    music.play(songId);
  },

  setVolumes({ music: musicVolume, sfx }) {
    engine.setVolume('music', musicVolume);
    engine.setVolume('sfx', sfx);
  },
};
