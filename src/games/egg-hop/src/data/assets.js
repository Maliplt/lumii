"use strict";

const EggAssets = (() => {
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
      (skin) => "egg-" + skin,
    ),
  ];

  function load() {
    const images = {};
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
    return { images, ready };
  }

  return Object.freeze({ names: Object.freeze(names), load });
})();
