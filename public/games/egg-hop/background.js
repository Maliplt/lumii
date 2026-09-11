// Aynı çizimler dünya boyunca tekrar kullanılır
function drawBackground(ctx, images, width, height, camera) {
  ctx.fillStyle = "#a8d2cb";
  ctx.fillRect(0, 0, width, height);

  function draw(name, x, y, flip = false, rotation = 0, scale = 1) {
    const image = images[name];
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rotation);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  }

  // Uzak bulutlar daha yavaş kayar
  const cloudScale = width > height ? 2 : 1;
  const cloudSpacing = 220 * cloudScale;
  const cloudCamera = camera * 0.15;
  const firstCloud = Math.floor(cloudCamera / 140) - 1;
  const lastCloud = Math.ceil((cloudCamera + height) / 140) + 1;

  for (let row = firstCloud; row <= lastCloud; row++) {
    for (let column = 0; column < Math.ceil(width / cloudSpacing); column++) {
      const variation = (((row + column) % 3) + 3) % 3;
      const x = column * cloudSpacing + (65 + variation * 34) * cloudScale;
      const y = row * 140 + column * 31 - cloudCamera;
      draw("cloud", x, y, variation === 1, 0, cloudScale);
    }
  }

  // İki duvar aynı çizimin yansımasıdır
  const firstWall = Math.floor(camera / 96);
  const lastWall = Math.ceil((camera + height) / 96);

  for (let row = firstWall; row <= lastWall; row++) {
    const y = row * 96 - camera + 48;
    draw("wall", 16, y);
    draw("wall", width - 16, y, true);
  }

  // Çalıların dünya konumları değişmez
  const firstBush = Math.floor(camera / 112) - 1;
  const lastBush = Math.ceil((camera + height) / 112);

  for (let row = firstBush; row <= lastBush; row++) {
    for (let side = 0; side < 2; side++) {
      const variation = (((row * 3 + side) % 4) + 4) % 4;
      const x = side === 0 ? 26 : width - 26;
      const y = row * 112 + side * 53 - camera;
      const rotation = [0, Math.PI / 2, 0, -Math.PI / 2][variation];
      draw("bush-" + (variation + 1), x, y, side === 1, rotation);
    }
  }
}
