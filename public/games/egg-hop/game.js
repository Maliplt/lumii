// Kamera dünyadan bağımsız hareket eder
const Game = (() => {
  const stage = document.querySelector("#stage");
  const canvas = document.querySelector("#game"),
    ctx = canvas.getContext("2d");
  const images = {};
  const names = [
    "wall",
    "cloud",
    "bush-1",
    "bush-2",
    "bush-3",
    "bush-4",
    "basket-back",
    "basket-front",
    "spark",
    "shell",
    "digits",
    ...["cream", "mint", "rose", "sky", "lavender", "gold"].map(
      (x) => "egg-" + x,
    ),
  ];
  const ready = Promise.all(
    names.map(
      (name) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = () => reject(new Error(name));
          images[name] = image;
          image.src = `assets/${name}.png?v=2`;
        }),
    ),
  );
  let mode = "menu",
    skin = "cream",
    last = 0,
    score = 0,
    lives = 3,
    practice = false;
  let basket,
    target,
    egg,
    nextTarget,
    particles = [];
  let camera = 0,
    cameraGoal = 0,
    scrolling = false;
  let onLand = () => {},
    onEnd = () => {};

  let width = 240;
  let height = 440;

  function laneWidth() {
    return Math.min(100, width / 2 - 64);
  }

  function placeBasket(item) {
    if (item) item.x = width / 2 + item.lane * laneWidth();
  }

  function resize() {
    const screenWidth = stage.clientWidth;
    const screenHeight = stage.clientHeight;
    if (!screenWidth || !screenHeight) return;

    const scale = Math.min(screenWidth / 240, screenHeight / 440);
    const oldWidth = width;
    const oldHeight = height;
    const oldLaneWidth = laneWidth();

    width = Math.round(screenWidth / scale);
    height = Math.round(screenHeight / scale);
    canvas.width = width;
    canvas.height = height;

    // Sepetler her ekranda aynı hat üzerinde kalır
    for (const item of [basket, target, nextTarget]) {
      placeBasket(item);
    }

    const ratio = laneWidth() / oldLaneWidth;
    for (const item of [egg, ...particles]) {
      if (item) item.x = width / 2 + (item.x - oldWidth / 2) * ratio;
    }
    if (egg && !egg.flying) egg.x = basket.x;

    if (mode !== "menu") {
      camera -= height - oldHeight;
      cameraGoal -= height - oldHeight;
    }
  }

  function resetEgg() {
    egg = {
      x: basket.x,
      y: basket.y - 4,
      vy: 0,
      angle: 0,
      spin: 0,
      flying: false,
    };
  }

  function makeTarget(base, level) {
    const moving = !practice && level % 3 !== 1;
    const phase = Math.random() * Math.PI * 2;

    const item = {
      lane: practice ? 0 : Math.sin(phase),
      y: base.y - 106,
      moving,
      phase,
      speed: 0.85 + Math.min(level, 30) * 0.025,
    };

    placeBasket(item);
    return item;
  }

  function moveBasket(item, dt) {
    if (!item?.moving) return;

    item.phase += item.speed * dt;
    item.lane = Math.sin(item.phase);
    placeBasket(item);
  }

  function start(options = {}) {
    score = 0;
    lives = 3;
    camera = 440 - height;
    cameraGoal = camera;
    scrolling = false;
    practice = !!options.practice;
    basket = { x: width / 2, y: 372, lane: 0, moving: false };
    target = makeTarget(basket, 0);
    nextTarget = makeTarget(target, 1);
    particles = [];
    resetEgg();
    mode = "play";
    updateHUD();
  }

  function updateHUD() {
    document.querySelector("#score").textContent = score;
  }

  function jump() {
    if (mode !== "play" || egg.flying) return;
    egg.flying = true;
    egg.vy = -500;
    egg.spin = (Math.random() < 0.5 ? -1 : 1) * 11;
  }

  function burst(x, y, type) {
    for (let i = 0; i < 8; i++)
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 70,
        life: 0.65,
        type,
      });
  }

  function update(dt) {
    if (mode !== "play") return;

    moveBasket(basket, dt);
    moveBasket(target, dt);
    moveBasket(nextTarget, dt);

    if (!egg.flying) egg.x = basket.x;

    if (scrolling) {
      camera += (cameraGoal - camera) * (1 - Math.exp(-5 * dt));
      if (Math.abs(cameraGoal - camera) < 0.4) {
        camera = cameraGoal;
        scrolling = false;
      }
    }
    if (egg.flying) {
      const previous = egg.y;
      egg.vy += 1000 * dt;
      egg.y += egg.vy * dt;
      egg.angle += egg.spin * dt;
      const rim = target.y + 8;
      if (
        egg.vy > 0 &&
        previous + 12 <= rim &&
        egg.y + 12 >= rim &&
        Math.abs(egg.x - target.x) < 23
      ) {
        score++;
        // Sepetin hareket bilgisi korunur
        basket = target;
        burst(basket.x, basket.y, "spark");
        resetEgg();
        target = nextTarget;
        nextTarget = makeTarget(target, score + 1);
        cameraGoal = basket.y - (height - 68);
        scrolling = true;
        updateHUD();
        onLand(score, practice);
      } else if (egg.y - camera > height + 22) {
        burst(basket.x, basket.y, "shell");
        if (!practice) lives--;
        resetEgg();
        if (lives === 0) {
          mode = "over";
          onEnd(score);
        }
      }
    }
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function sprite(name, x, y, w, h) {
    const image = images[name];
    if (image?.complete && image.naturalWidth)
      ctx.drawImage(
        image,
        Math.round(x),
        Math.round(y),
        w || image.width,
        h || image.height,
      );
  }

  function drawBasket(b, part) {
    if (b) sprite("basket-" + part, b.x - 32, b.y - camera - 12);
  }

  function drawScore() {
    const text = String(score).padStart(2, "0");
    for (let i = 0; i < text.length; i++)
      ctx.drawImage(
        images.digits,
        Number(text[i]) * 6,
        0,
        6,
        9,
        12 + i * 18,
        12,
        18,
        27,
      );
    for (let i = 0; i < lives; i++)
      sprite("egg-" + skin, 12 + i * 10, 43, 9, 11);
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, images, width, height, camera);
    if (mode !== "menu" && basket) {
      drawBasket(nextTarget, "back");
      drawBasket(nextTarget, "front");
      drawBasket(target, "back");
      drawBasket(target, "front");
      drawBasket(basket, "back");
      // Yumurta iki sepet katmanı arasında durur
      if (!egg.flying) {
        sprite("egg-" + skin, egg.x - 12, egg.y - camera - 14);
        drawBasket(basket, "front");
      } else {
        drawBasket(basket, "front");
        ctx.save();
        ctx.translate(Math.round(egg.x), Math.round(egg.y - camera));
        ctx.rotate(egg.angle);
        sprite("egg-" + skin, -12, -14);
        ctx.restore();
      }
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / 0.65);
        sprite(p.type, p.x - 4, p.y - camera - 4, 8, 8);
      }
      ctx.globalAlpha = 1;
      drawScore();
    }
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  ready
    .then(() => requestAnimationFrame(frame))
    .catch((error) => {
      document.querySelector("#menu").textContent = "Asset: " + error.message;
    });

  new ResizeObserver(resize).observe(stage);
  resize();

  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    jump();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.code === "Space" &&
      !event.repeat &&
      !["BUTTON", "SELECT", "INPUT", "A"].includes(
        document.activeElement.tagName,
      )
    ) {
      event.preventDefault();
      jump();
    }
  });
  return {
    ready,
    start,
    jump,
    setSkin(value) {
      skin = value;
    },
    pause() {
      if (mode === "play") mode = "paused";
    },
    resume() {
      if (mode === "paused") mode = "play";
    },
    menu() {
      mode = "menu";
      camera = 0;
    },
    getMode: () => mode,
    setCallbacks(land, end) {
      onLand = land;
      onEnd = end;
    },
  };
})();
