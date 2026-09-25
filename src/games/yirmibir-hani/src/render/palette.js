"use strict";
(function (YB) {
  // sprite rows name colours by letter; '.' is transparent
  const PALETTE = {
    k: "#231726",
    K: "#3f2b40",
    w: "#ffffff",
    s: "#fff3da",
    S: "#efd3a6",
    q: "#c9a877",
    g: "#a89aa6",
    G: "#6b5d6e",
    r: "#e8424f",
    R: "#a3263a",
    x: "#ff8a8f",
    o: "#f7872a",
    O: "#c0561c",
    y: "#ffd84a",
    Y: "#e9a126",
    z: "#fff39e",
    l: "#6cc24a",
    L: "#3c8a43",
    d: "#255a3e",
    b: "#4a9be8",
    B: "#2c5fa8",
    c: "#a8e2ff",
    v: "#a45fd6",
    V: "#643a95",
    p: "#ff9fc0",
    P: "#cf5d8a",
    t: "#e0a86a",
    T: "#a8683f",
    n: "#744029",
    N: "#4a2821",
    h: "#ffd1a8",
    H: "#e0986a",
    m: "#d3dce8",
    M: "#8e9cb4",
    a: "#ffc24a",
    A: "#e0871f",
  };

  // each inn on the road has its own wall, trim and light
  const THEMES = {
    village: { wall: ["#b9774a", "#a3653d", "#8e5534"], trim: "#5e3322", floor: ["#7a4a30", "#6a3e28"], table: ["#c98e5a", "#ad7447", "#8a5634"], cloth: "#e8424f", glow: "#ffb45c", bunting: ["r", "y", "b", "l"], window: "day" },
    harbor: { wall: ["#6f8fb5", "#5e7ca0", "#4d6989"], trim: "#2f3f5c", floor: ["#6a5040", "#5a4235"], table: ["#b8895e", "#9c7049", "#7a5436"], cloth: "#4a9be8", glow: "#ffd28a", bunting: ["b", "s", "b", "r"], window: "sea" },
    pass: { wall: ["#8a7a78", "#77686a", "#62555a"], trim: "#3a2e33", floor: ["#5e4a44", "#4f3d39"], table: ["#a8683f", "#8a5634", "#6b3f28"], cloth: "#a3263a", glow: "#ff8a4a", bunting: ["r", "o", "r", "y"], window: "peaks" },
    abbey: { wall: ["#9c8fa8", "#877a95", "#716580"], trim: "#3d3050", floor: ["#5a4a5e", "#4b3d50"], table: ["#b08a6a", "#957054", "#76553f"], cloth: "#a45fd6", glow: "#ffe0a0", bunting: ["v", "y", "v", "s"], window: "stars" },
    court: { wall: ["#b8504a", "#a0433f", "#883734"], trim: "#4a1f2a", floor: ["#6b3d3a", "#5a3230"], table: ["#d8a860", "#bb8b48", "#946a33"], cloth: "#ffd84a", glow: "#ffe38a", bunting: ["y", "r", "y", "b"], window: "castle" },
  };

  YB.PALETTE = PALETTE;
  YB.THEMES = THEMES;
})(window.YirmibirHani);
