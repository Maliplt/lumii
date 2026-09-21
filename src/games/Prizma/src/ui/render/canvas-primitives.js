"use strict";

(() => {
  function resize(canvas, width, height, pixelRatio = devicePixelRatio || 1) {
    const density = Math.min(pixelRatio, 2);
    const scaledWidth = Math.round(width * density);
    const scaledHeight = Math.round(height * density);
    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
    }
    canvas.getContext("2d").setTransform(density, 0, 0, density, 0, 0);
  }

  function roundedRect(
    context,
    x,
    y,
    width,
    height,
    radius,
    fill,
    stroke = null,
    lineWidth = 1,
  ) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    if (fill) {
      context.fillStyle = fill;
      context.fill();
    }
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.stroke();
    }
  }

  function gem(context, x, y, radius, color) {
    context.save();
    context.beginPath();
    context.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    context.strokeStyle = color;
    context.lineWidth = Math.max(1.5, radius * 0.18);
    context.stroke();
    context.beginPath();
    context.arc(x, y, radius * 0.29, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.restore();
  }

  function bolt(context, radius) {
    context.beginPath();
    context.moveTo(radius * 0.15, -radius);
    context.lineTo(-radius * 0.67, radius * 0.2);
    context.lineTo(-radius * 0.05, radius * 0.2);
    context.lineTo(-radius * 0.13, radius);
    context.lineTo(radius * 0.73, -radius * 0.25);
    context.lineTo(radius * 0.1, -radius * 0.25);
    context.closePath();
    context.fill();
  }

  function ports(mask) {
    return [0, 1, 2, 3].filter((direction) => mask & (1 << direction));
  }

  function portPoint(direction, length) {
    return [
      Math.sin((direction * Math.PI) / 2) * length,
      -Math.cos((direction * Math.PI) / 2) * length,
    ];
  }

  function animatedAngle(rotation, at, reducedMotion) {
    const progress = reducedMotion
      ? 1
      : Math.min(1, Math.max(0, (at - rotation.at) / 230));
    const eased = 1 - Math.pow(1 - progress, 3);
    return rotation.from + (rotation.to - rotation.from) * eased;
  }

  window.PrizmaCanvas = Object.freeze({
    resize,
    roundedRect,
    gem,
    bolt,
    ports,
    portPoint,
    animatedAngle,
  });
})();
