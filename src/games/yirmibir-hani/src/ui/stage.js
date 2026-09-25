"use strict";
// the page is drawn at a low "art" resolution and scaled up by a whole number of device pixels, so every pixel on screen is the same size
(function (YB) {
  const { canvas, context } = YB.Pixels;

  class Stage {
    constructor(display) {
      this.display = display;
      this.ctx = display.getContext("2d");
      this.buffer = canvas(1, 1);
      this.bctx = context(this.buffer);
      this.mode = "page";
      this.listeners = new Set();
      window.addEventListener("resize", () => this.resize());
      window.visualViewport?.addEventListener("resize", () => this.resize());
    }

    onResize(listener) {
      this.listeners.add(listener);
    }

    // "page" follows the interface pixel size; "table" fits the game table's room
    setMode(mode, room = null) {
      const key = JSON.stringify(room);
      if (mode === this.mode && key === this.roomKey) return;
      this.mode = mode;
      this.room = room;
      this.roomKey = key;
      this.resize();
    }

    // the page pixel grows with the window and always lands on whole device pixels
    uiPixel(width, height, dpr) {
      const target = Math.min(Math.max(Math.min(width / 125, height / 190), 2), 6);
      return Math.max(1, Math.floor(target * dpr)) / dpr;
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      const ui = this.uiPixel(cssW, cssH, dpr);
      let scale;
      if (this.mode === "table") {
        const room = this.room || YB.Table.room();
        const portrait = Math.floor(Math.min(bw / room.portrait[0], bh / room.portrait[1]));
        const landscape = Math.floor(Math.min(bw / room.landscape[0], bh / room.landscape[1]));
        scale = Math.max(1, portrait, landscape);
        scale = Math.min(scale, Math.max(1, Math.round(5 * dpr)));
      } else {
        scale = Math.max(1, Math.round(ui * dpr));
      }
      this.scale = scale;
      this.dpr = dpr;
      this.width = Math.ceil(bw / scale);
      this.height = Math.ceil(bh / scale);
      this.display.width = bw;
      this.display.height = bh;
      this.ctx.imageSmoothingEnabled = false;
      this.buffer.width = this.width;
      this.buffer.height = this.height;
      this.bctx.imageSmoothingEnabled = false;
      document.documentElement.style.setProperty("--px", `${ui}px`);
      document.documentElement.style.setProperty("--art", `${scale / dpr}px`);
      this.listeners.forEach((listener) => listener(this.width, this.height));
    }

    toArt(clientX, clientY) {
      return { x: (clientX * this.dpr) / this.scale, y: (clientY * this.dpr) / this.scale };
    }

    toCss(x, y) {
      return { x: (x * this.scale) / this.dpr, y: (y * this.scale) / this.dpr };
    }

    render(draw) {
      draw(this.bctx, this.width, this.height);
      this.ctx.drawImage(this.buffer, 0, 0, this.width * this.scale, this.height * this.scale);
    }
  }

  // the dithered curtain that falls between screens
  class Wipe {
    constructor(display) {
      this.display = display;
      this.ctx = display.getContext("2d");
      this.amount = 0;
    }

    draw(stage) {
      const w = Math.ceil(stage.width / 2);
      const h = Math.ceil(stage.height / 2);
      if (this.display.width !== stage.display.width || this.display.height !== stage.display.height) {
        this.display.width = stage.display.width;
        this.display.height = stage.display.height;
      }
      this.ctx.clearRect(0, 0, this.display.width, this.display.height);
      if (this.amount <= 0) return;
      if (!this.cell || this.cell.width !== w || this.cell.height !== h) {
        this.cell = canvas(w, h);
        this.cellCtx = context(this.cell);
      }
      const c = this.cellCtx;
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#231726";
      for (let y = 0; y < h; y++) {
        const edge = this.amount * 1.6 - (1 - y / h) * 0.6;
        for (let x = 0; x < w; x++) if (YB.Pixels.dither(x, y, edge)) c.fillRect(x, y, 1, 1);
      }
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(this.cell, 0, 0, w * 2 * stage.scale, h * 2 * stage.scale);
    }
  }

  YB.Stage = Stage;
  YB.Wipe = Wipe;
})(window.YirmibirHani);
