BambooModules.define("art.js", function(require, module, exports) {
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // Modül dışa aktarımı
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var art_exports = {};
__export(art_exports, {
  ball: () => ball,
  bamboo: () => bamboo,
  box: () => box,
  collectible: () => collectible,
  contactShadow: () => contactShadow,
  cylinder: () => cylinder,
  floatingTyre: () => floatingTyre,
  flowers: () => flowers,
  linkedLogs: () => linkedLogs,
  logModel: () => logModel,
  material: () => material,
  mushroom: () => mushroom,
  panda: () => panda,
  tornado: () => tornado,
  tree: () => tree,
  vehicle: () => vehicle
});
module.exports = __toCommonJS(art_exports);
var THREE = __toESM(require("three"));
var import_RoundedBoxGeometry = require("three/addons/geometries/RoundedBoxGeometry.js");
var import_costumes = require("./costumes.js");
const mats = /* @__PURE__ */ new Map(), geos = /* @__PURE__ */ new Map();
function material(color) {
  if (!mats.has(color))
    mats.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 })
    );
  return mats.get(color);
}
function geometry(key, fn) {
  if (!geos.has(key)) geos.set(key, fn());
  return geos.get(key);
}
function box(parent, color, x, y, z, w, h, d, round = 0) {
  const geo = round ? geometry(
    `r${w},${h},${d},${round}`,
    () => new import_RoundedBoxGeometry.RoundedBoxGeometry(w, h, d, 2, round)
  ) : geometry("unit-box", () => new THREE.BoxGeometry(1, 1, 1));
  const mesh = new THREE.Mesh(geo, material(color));
  if (!round) mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function ball(parent, color, x, y, z, r, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(
    geometry("ico", () => new THREE.IcosahedronGeometry(1, 1)),
    material(color)
  );
  m.position.set(x, y, z);
  m.scale.set(r * scale[0], r * scale[1], r * scale[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cylinder(parent, color, x, y, z, rt, rb, height, sides = 8) {
  const ratio = rt / rb;
  const m = new THREE.Mesh(
    geometry(
      `c${ratio},${sides}`,
      () => new THREE.CylinderGeometry(ratio, 1, 1, sides)
    ),
    material(color)
  );
  m.scale.set(rb, height, rb);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function panda(outfit = "scarf") {
  const costume = (0, import_costumes.costumeById)(outfit), ears = [], arms = [], feet = [];
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  box(body, "#202d2a", 0, 0.48, 0, 0.64, 0.57, 0.52, 0.13);
  box(body, "#fff8e9", 0, 0.64, 0.04, 0.68, 0.61, 0.56, 0.17);
  box(body, "#24312c", 0, 0.8, 0, 0.73, 0.19, 0.56, 0.06);
  const head = new THREE.Group();
  head.position.set(0, 1.13, 0.03);
  body.add(head);
  box(head, "#fffbed", 0, 0, 0, 0.79, 0.67, 0.65, 0.16);
  for (const side of [-1, 1]) {
    ears.push(
      ball(head, "#23312c", side * 0.32, 0.3, -0.02, 0.19, [1, 1, 0.67])
    );
    const patch = box(
      head,
      "#263530",
      side * 0.205,
      0.015,
      0.31,
      0.22,
      0.26,
      0.055,
      0.07
    );
    patch.rotation.z = side * -0.24;
    ball(head, "#fffdf6", side * 0.197, 0.055, 0.348, 0.047, [1, 1, 0.35]);
    ball(head, "#14241f", side * 0.192, 0.052, 0.364, 0.026, [1, 1, 0.5]);
    ball(head, "#efae91", side * 0.233, -0.115, 0.326, 0.048, [1, 0.42, 0.04]);
    const arm = box(
      body,
      "#22312b",
      side * 0.33,
      0.55,
      0.025,
      0.2,
      0.38,
      0.3,
      0.08
    );
    arm.rotation.z = side * 0.15;
    arms.push(arm);
    feet.push(
      box(body, "#22312b", side * 0.21, 0.18, 0.09, 0.25, 0.28, 0.38, 0.07)
    );
  }
  box(head, "#273830", 0, -0.065, 0.359, 0.105, 0.077, 0.065, 0.025);
  box(head, "#38453b", 0, -0.134, 0.337, 0.04, 0.05, 0.03, 0.015);
  const accessory = new THREE.Group();
  head.add(accessory);
  accessory.position.y = -1.13;
  if (costume.type === "scarf") {
    box(accessory, costume.color, 0, 0.885, 0, 0.78, 0.135, 0.63, 0.035);
    box(
      accessory,
      costume.color,
      0.24,
      0.7,
      0.335,
      0.16,
      0.36,
      0.08,
      0.025
    ).rotation.z = -0.2;
    box(accessory, "#ffd07b", 0.27, 0.555, 0.38, 0.17, 0.05, 0.02);
  }
  if (["hat", "rain", "cap", "beanie", "helmet", "chef"].includes(costume.type)) {
    ears.forEach((ear) => ear.visible = false);
    const c = costume.color;
    if (["hat", "rain", "cap"].includes(costume.type))
      cylinder(accessory, c, 0, 1.51, 0.03, 0.57, 0.57, 0.09, 12);
    if (costume.type === "hat") {
      cylinder(accessory, c, 0, 1.66, 0.03, 0.34, 0.43, 0.27, 12);
      cylinder(accessory, "#537347", 0, 1.55, 0.03, 0.44, 0.44, 0.075, 12);
    } else if (costume.type === "rain")
      cylinder(accessory, c, 0, 1.65, 0.03, 0.25, 0.48, 0.28, 12);
    else if (costume.type === "cap") {
      box(accessory, c, 0, 1.62, 0.03, 0.86, 0.25, 0.69, 0.09);
      box(accessory, "#3d655d", 0, 1.53, 0.4, 0.6, 0.06, 0.31, 0.025);
    } else if (costume.type === "beanie") {
      ball(accessory, c, 0, 1.6, 0.03, 0.5, [1, 0.6, 0.79]);
      box(accessory, c, 0, 1.48, 0.03, 0.84, 0.16, 0.68, 0.06);
      ball(accessory, "#f2e4c2", 0, 1.95, 0.03, 0.12);
    } else if (costume.type === "helmet") {
      ball(accessory, c, 0, 1.62, 0.03, 0.51, [1, 0.7, 0.8]);
      box(accessory, "#b8aa75", 0, 1.48, 0.03, 0.88, 0.09, 0.72, 0.03);
      ball(accessory, "#ffe6a2", 0, 1.68, 0.46, 0.11, [1, 1, 0.5]);
    } else {
      cylinder(accessory, c, 0, 1.65, 0.03, 0.4, 0.43, 0.34, 12);
      for (const x of [-0.23, 0, 0.23])
        ball(accessory, c, x, 1.91, 0.03, 0.24, [1, 0.8, 1]);
    }
  }
  if (costume.type === "flower") {
    const flower = new THREE.Group();
    flower.position.set(0.29, 1.59, 0.44);
    flower.rotation.x = 0.05;
    accessory.add(flower);
    for (let i = 0; i < 6; i++)
      ball(
        flower,
        costume.color,
        Math.cos(i * Math.PI / 3) * 0.13,
        Math.sin(i * Math.PI / 3) * 0.13,
        0,
        0.09,
        [1, 1, 0.4]
      );
    ball(flower, "#efb841", 0, 0, 0.045, 0.09, [1, 1, 0.5]);
  }
  if (costume.type === "goggles") {
    for (const side of [-1, 1]) {
      box(
        accessory,
        costume.color,
        side * 0.2,
        1.15,
        0.42,
        0.32,
        0.24,
        0.12,
        0.055
      );
      box(
        accessory,
        "#b8e0d2",
        side * 0.2,
        1.15,
        0.493,
        0.22,
        0.15,
        0.03,
        0.03
      );
    }
    box(accessory, costume.color, 0, 1.15, 0.44, 0.12, 0.08, 0.08);
    if (outfit === "diver")
      box(accessory, costume.color, 0.47, 1.32, 0.34, 0.08, 0.59, 0.08, 0.02);
  }
  if (costume.type === "pack") {
    box(body, costume.color, 0, 0.65, -0.45, 0.61, 0.61, 0.27, 0.08);
    box(body, "#dac69b", 0, 0.69, -0.595, 0.43, 0.12, 0.035, 0.01);
    if (outfit === "botanist")
      for (const x of [-0.18, 0.18])
        ball(body, "#759946", x, 1.08, -0.44, 0.17, [0.6, 1.4, 0.6]);
  }
  if (costume.type === "crown") {
    cylinder(accessory, costume.color, 0, 1.56, 0.03, 0.3, 0.3, 0.12, 10);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      box(
        accessory,
        costume.color,
        Math.cos(a) * 0.27,
        1.69,
        0.03 + Math.sin(a) * 0.27,
        0.085,
        0.24,
        0.085
      );
    }
  }
  if (costume.skin) {
    const colors = costume.skin === "brown" ? ["#d6bc8d", "#78543a"] : costume.skin === "polar" ? ["#fff5dd", "#e1dbc5"] : costume.skin === "red" ? ["#bd633a", "#41362b"] : costume.skin === "grizzly" ? ["#93653f", "#68452e"] : ["#37362d", "#272b26"];
    const pale = /* @__PURE__ */ new Set(["fff8e9", "fffbed"]), dark = /* @__PURE__ */ new Set(["202d2a", "24312c", "23312c", "263530", "22312b"]);
    body.traverse((m) => {
      if (!m.material?.color) return;
      const hex = m.material.color.getHexString();
      if (pale.has(hex)) m.material = material(colors[0]);
      else if (dark.has(hex)) m.material = material(colors[1]);
    });
    if (["polar", "grizzly", "sun"].includes(costume.skin)) {
      head.children.filter(
        (m) => m.material && m.geometry?.type === "RoundedBoxGeometry" && m.position.z > 0.3 && Math.abs(m.position.x) > 0.1
      ).forEach((m) => m.visible = false);
      ball(
        head,
        costume.skin === "sun" ? "#dcbf82" : colors[0],
        0,
        -0.13,
        0.35,
        0.23,
        [1, 0.68, 1.05]
      );
      ball(head, "#26312b", 0, -0.06, 0.52, 0.075, [1, 0.7, 0.6]);
      for (const side of [-1, 1])
        ball(head, "#18251f", side * 0.2, 0.045, 0.335, 0.046, [1, 1, 0.6]);
      ears.forEach((e) => e.scale.multiplyScalar(0.7));
      if (costume.skin === "polar") head.scale.set(1.03, 0.92, 1.13);
      if (costume.skin === "grizzly") body.scale.set(1.12, 1, 1.1);
      if (costume.skin === "sun")
        box(body, "#edc57e", 0, 0.76, 0.327, 0.34, 0.17, 0.025, 0.06);
    }
    if (costume.skin === "red") {
      for (const side of [-1, 1]) {
        const ear = ears[side === -1 ? 0 : 1];
        ear.scale.set(0.18, 0.25, 0.12);
        ball(head, "#fff1ca", side * 0.29, -0.16, 0.33, 0.16, [1.2, 0.7, 0.3]);
      }
      const tail = new THREE.Group();
      body.add(tail);
      tail.position.set(0.12, 0.36, -0.32);
      tail.rotation.x = -0.5;
      for (let i = 0; i < 5; i++)
        ball(
          tail,
          i % 2 ? "#ecd8ac" : "#b35b32",
          0,
          0.06 + i * 0.065,
          -i * 0.17,
          0.15,
          [1, 1, 1.2]
        );
    }
  }
  if (costume.type === "headphones") {
    for (const side of [-1, 1]) {
      box(head, "#334d47", side * 0.43, 0.05, 0, 0.14, 0.39, 0.36, 0.055);
      box(head, costume.color, side * 0.51, 0.05, 0, 0.035, 0.26, 0.24, 0.03);
    }
    box(head, "#334d47", 0, 0.38, -0.04, 0.91, 0.09, 0.15, 0.025);
  }
  if (costume.type === "wings")
    for (const side of [-1, 1]) {
      const wing = ball(
        body,
        costume.color,
        side * 0.54,
        0.9,
        -0.28,
        0.47,
        [0.65, 1.2, 0.16]
      );
      wing.rotation.z = side * -0.5;
    }
  if (costume.type === "armor") {
    box(body, "#748979", 0, 0.61, 0.34, 0.68, 0.45, 0.09, 0.035);
    for (const s of [-1, 1])
      box(body, "#adbd9c", s * 0.39, 0.79, 0, 0.3, 0.21, 0.4, 0.04);
    box(head, "#a4b695", 0, 0.29, 0.16, 0.85, 0.13, 0.69, 0.025);
  }
  if (costume.type === "wizard") {
    ears.forEach((e) => e.visible = false);
    cylinder(accessory, costume.color, 0, 1.6, 0, 0.05, 0.48, 0.8, 8);
    cylinder(accessory, "#cfbd75", 0, 1.4, 0, 0.58, 0.58, 0.08, 12);
    box(body, costume.color, 0, 0.61, -0.34, 0.73, 0.75, 0.08);
    ball(accessory, "#e7d595", 0.15, 1.62, 0.27, 0.085);
  }
  if (costume.type === "rain")
    box(body, costume.color, 0, 0.59, -0.33, 0.79, 0.76, 0.11, 0.025);
  if (costume.type === "chef")
    box(body, "#fff5e3", 0, 0.55, 0.32, 0.56, 0.5, 0.06, 0.025);
  if (costume.type === "crown")
    box(body, "#bd5c43", 0, 0.65, -0.36, 0.76, 0.83, 0.09);
  for (const part of body.children) part.position.y -= 0.04;
  root.userData = { body, head, arms, feet, ears, costume: costume.id };
  return root;
}
function tree(parent, x, z, rng, small = false) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  parent.add(root);
  const h = (small ? 1.1 : 1.8) + rng() * 0.85;
  cylinder(root, "#8c6b44", 0, h * 0.34, 0, 0.12, 0.19, h * 0.68, 6);
  const palette = ["#488253", "#57945b", "#6c9e56", "#39785a", "#88ad60"];
  const color = palette[Math.floor(rng() * palette.length)];
  const kind = Math.floor(rng() * 4);
  if (kind === 0) {
    for (let i = 0; i < 3; i++)
      cylinder(
        root,
        color,
        0,
        h * (0.58 + i * 0.23),
        0,
        0.02,
        h * (0.43 - i * 0.08),
        h * 0.62,
        7
      );
  } else if (kind === 1) {
    ball(root, color, 0, h * 0.93, 0, h * 0.43, [0.64, 1.4, 0.64]);
    for (let i = 0; i < 3; i++)
      box(root, "#dfd8b5", 0, h * (0.2 + i * 0.15), 0.16, 0.21, 0.055, 0.04);
  } else if (kind === 2) {
    const branch = box(root, "#8c6b44", 0.23, h * 0.57, 0, 0.55, 0.13, 0.13);
    branch.rotation.z = 0.5;
    ball(root, color, -0.28, h * 0.86, 0, h * 0.39, [1.1, 0.72, 1]);
    ball(root, color, 0.4, h * 0.76, 0, h * 0.28, [1, 0.8, 1]);
  } else ball(root, color, 0, h * 0.84, 0, h * 0.48, [1.15, 0.83, 0.9]);
  return root;
}
function bamboo(parent, x, z, rng) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  parent.add(root);
  for (let i = 0; i < 3; i++) {
    const h = 1.4 + rng() * 1.2, xx = (i - 1) * 0.24;
    cylinder(
      root,
      i % 2 ? "#80ac4e" : "#639448",
      xx,
      h / 2,
      0,
      0.052,
      0.07,
      h,
      5
    );
    for (let k = 0.35; k < h; k += 0.45) {
      cylinder(root, "#b3c77c", xx, k, 0, 0.075, 0.075, 0.035, 5);
      if (k > 0.8) {
        const leaf = ball(
          root,
          "#507f44",
          xx + (i % 2 ? -0.22 : 0.22),
          k + 0.1,
          0,
          0.24,
          [1, 0.22, 0.45]
        );
        leaf.rotation.z = i % 2 ? -0.4 : 0.4;
      }
    }
  }
  return root;
}
function flowers(parent, x, z, rng) {
  const palette = ["#f7c255", "#fcf2ce", "#ee8b71", "#dcecc1"];
  const color = palette[Math.floor(rng() * palette.length)];
  for (let i = 0; i < 2 + Math.floor(rng() * 3); i++) {
    const xx = x + (rng() - 0.5) * 0.5, zz = z + (rng() - 0.5) * 0.45, h = 0.17 + rng() * 0.17;
    box(parent, "#557c39", xx, h / 2, zz, 0.035, h, 0.035);
    if (rng() > 0.45) {
      for (let j = 0; j < 5; j++)
        ball(
          parent,
          color,
          xx + Math.cos(j * 1.257) * 0.065,
          h,
          zz + Math.sin(j * 1.257) * 0.065,
          0.05,
          [1, 0.6, 1]
        );
      ball(parent, "#e7b958", xx, h + 0.02, zz, 0.04);
    } else ball(parent, color, xx, h, zz, 0.085, [0.7, 1.1, 0.7]);
  }
}
function mushroom(parent, x, z) {
  cylinder(parent, "#f6e5bd", x, 0.13, z, 0.035, 0.05, 0.25, 6);
  const cap = ball(parent, "#db7649", x, 0.26, z, 0.16, [1, 0.55, 1]);
  ball(parent, "#fff0cd", x + 0.06, 0.32, z + 0.025, 0.035);
  return cap;
}
function vehicle(variant, direction) {
  const root = new THREE.Group(), colors = ["#d8714d", "#5c9d9d", "#e6bd59", "#698cb1", "#ded3ab"];
  const color = colors[Math.min(4, Math.floor(variant * 5))];
  box(root, color, 0, 0.39, 0, 1.45, 0.42, 0.72, 0.08);
  box(root, color, -0.13, 0.75, 0, 0.7, 0.47, 0.66, 0.08);
  box(root, "#bde0d5", 0.035, 0.79, 0.337, 0.32, 0.27, 0.018, 0.025);
  box(root, "#bde0d5", 0.035, 0.79, -0.337, 0.32, 0.27, 0.018, 0.025);
  box(root, "#c2e3d6", 0.237, 0.79, 0, 0.015, 0.27, 0.57, 0.02);
  box(root, "#5e7960", -0.44, 0.79, 0, 0.08, 0.48, 0.7, 0.02);
  box(root, "#e9dfb8", 0.74, 0.39, 0, 0.06, 0.12, 0.65, 0.02);
  for (const side of [-1, 1]) {
    for (const pos of [-0.48, 0.48]) {
      const w = cylinder(
        root,
        "#2e4037",
        pos,
        0.25,
        side * 0.38,
        0.205,
        0.205,
        0.12,
        10
      );
      w.rotation.x = Math.PI / 2;
      const hub = cylinder(
        root,
        "#a5b4a0",
        pos,
        0.25,
        side * 0.452,
        0.085,
        0.085,
        0.012,
        8
      );
      hub.rotation.x = Math.PI / 2;
    }
    box(root, "#fff0b9", 0.778, 0.51, side * 0.235, 0.025, 0.11, 0.13, 0.02);
  }
  if (variant < 0.3) {
    box(root, "#567f4d", -0.48, 1.15, 0, 0.5, 0.32, 0.55, 0.025);
    box(root, "#d6bc78", -0.48, 1.32, 0, 0.52, 0.035, 0.57);
  } else if (variant > 0.65) {
    box(root, color, -0.67, 0.58, 0, 0.65, 0.4, 0.69, 0.045);
    box(root, "#847555", -0.67, 0.81, 0, 0.6, 0.05, 0.65);
  } else box(root, "#7f6949", -0.48, 1.065, 0, 0.45, 0.1, 0.55, 0.025);
  root.rotation.y = direction < 0 ? Math.PI : 0;
  box(root, color, 0.43, 0.62, 0, 0.7, 0.17, 0.65, 0.04);
  if (variant < 0.2) {
    box(root, "#e5cf94", -0.46, 0.88, 0, 0.85, 0.5, 0.69, 0.035);
    root.scale.x = 1.22;
  } else if (variant < 0.4) {
    box(root, color, -0.22, 0.9, 0, 1.12, 0.42, 0.65, 0.07);
    for (const z of [-0.34, 0.34])
      box(root, "#bde0d5", -0.32, 0.96, z, 0.69, 0.22, 0.025);
  } else if (variant < 0.6) {
    root.scale.set(1.05, 0.78, 1);
    box(root, "#f4e2ad", 0.13, 0.82, 0, 0.12, 0.025, 0.68);
  } else if (variant > 0.8) {
    box(root, "#a2814b", -0.6, 0.96, 0, 0.45, 0.4, 0.61);
    box(root, "#567844", -0.6, 1.17, 0, 0.49, 0.06, 0.66);
  }
  root.userData.length = variant < 0.2 ? 1.75 : variant > 0.65 ? 1.65 : 1.35;
  return root;
}
function logModel(length) {
  const root = new THREE.Group();
  const body = cylinder(root, "#a47b4d", 0, 0.095, 0, 0.26, 0.28, length, 10);
  body.rotation.z = Math.PI / 2;
  for (const sign of [-1, 1]) {
    const end = cylinder(
      root,
      "#e2bc7f",
      sign * (length / 2 + 5e-3),
      0.095,
      0,
      0.23,
      0.23,
      0.018,
      10
    );
    end.rotation.z = Math.PI / 2;
    const ring = cylinder(
      root,
      "#ad844f",
      sign * (length / 2 + 0.018),
      0.095,
      0,
      0.135,
      0.135,
      0.02,
      10
    );
    ring.rotation.z = Math.PI / 2;
  }
  for (let i = 0; i < 3; i++)
    box(
      root,
      "#896741",
      (i - 1) * length * 0.24,
      0.33,
      0,
      length * 0.16,
      0.018,
      0.045
    );
  ball(root, "#819b4f", -0.3, 0.335, -0.08, 0.22, [1, 0.18, 0.5]);
  return root;
}
function collectible(variant = 0) {
  const root = new THREE.Group();
  const stems = variant % 3 === 0 ? [-1, 0, 1] : variant % 3 === 1 ? [-0.5, 0.5] : [0];
  for (const i of stems) {
    const stem = box(root, "#b3ef78", i * 0.12, 0, 0, 0.1, 0.51, 0.1, 0.025);
    stem.rotation.z = i * -0.12;
    box(root, "#e3ffc0", i * 0.12, 0.02, 0.059, 0.105, 0.035, 0.015);
  }
  const leaf = box(root, "#87ca56", 0.2, 0.19, 0, 0.26, 0.075, 0.1, 0.025);
  leaf.rotation.z = 0.5;
  root.scale.setScalar(1.35);
  root.traverse((m) => {
    if (m.material?.color && ["b3ef78", "e3ffc0"].includes(m.material.color.getHexString())) {
      m.material = material("#c1ff73");
      m.material.emissive.set("#6aaf31");
      m.material.emissiveIntensity = 0.28;
    }
  });
  return root;
}
function contactShadow(parent, x, z, radius = 0.38) {
  const mesh = new THREE.Mesh(
    geometry("shadow-disc", () => new THREE.CircleGeometry(1, 32)),
    new THREE.MeshBasicMaterial({
      color: "#233e2d",
      transparent: true,
      opacity: 0.23,
      depthWrite: false
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.016, z);
  mesh.scale.set(radius, radius * 0.8, 1);
  parent.add(mesh);
  return mesh;
}
function linkedLogs(blocks) {
  const root = new THREE.Group();
  for (let i = 0; i < blocks; i++) {
    const segment = logModel(1.12);
    segment.position.x = (i - (blocks - 1) / 2) * 1.3;
    root.add(segment);
    if (i < blocks - 1)
      for (const z of [-0.15, 0.15]) {
        const link = new THREE.Mesh(
          geometry("chain", () => new THREE.TorusGeometry(0.09, 0.023, 5, 9)),
          material("#7c8070")
        );
        link.rotation.x = Math.PI / 2;
        link.position.set(segment.position.x + 0.65, 0.15, z);
        root.add(link);
      }
  }
  return root;
}
function floatingTyre() {
  const root = new THREE.Group();
  const tyre = new THREE.Mesh(
    geometry("tyre", () => new THREE.TorusGeometry(0.38, 0.16, 8, 16)),
    material("#354940")
  );
  tyre.rotation.x = Math.PI / 2;
  tyre.position.y = 0.11;
  tyre.castShadow = true;
  root.add(tyre);
  cylinder(root, "#a6b281", 0, 0.1, 0, 0.25, 0.25, 0.09, 12);
  return root;
}
function tornado() {
  const root = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const radius = 0.2 + i * 0.12;
    const ring = new THREE.Mesh(
      geometry(
        `wind-${i}`,
        () => new THREE.TorusGeometry(radius, 0.07 + i * 0.012, 5, 15)
      ),
      material(i % 2 ? "#99aba2" : "#b3c0b2")
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2 + i * 0.28;
    root.add(ring);
  }
  for (let i = 0; i < 6; i++)
    ball(
      root,
      "#758d80",
      Math.cos(i) * 0.6,
      2.8,
      Math.sin(i) * 0.4,
      0.55,
      [1.2, 0.45, 1]
    );
  return root;
}

});
