"use strict";
(function (YB) {
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  }

  class Random {
    constructor(seed) {
      this.state = (typeof seed === "string" ? hash(seed) : seed) >>> 0;
    }

    next() {
      this.state = (this.state + 0x6d2b79f5) >>> 0;
      let t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    }

    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    }

    weighted(entries) {
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = this.next() * total;
      for (const [item, weight] of entries) {
        roll -= weight;
        if (roll < 0) return item;
      }
      return entries[entries.length - 1][0];
    }

    shuffle(list) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }
  }

  YB.Random = Random;
  YB.hash = hash;
})(window.YirmibirHani);
