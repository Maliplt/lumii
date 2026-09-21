BambooModules.define("environment.js", function(require, module, exports) {
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
var environment_exports = {};
__export(environment_exports, {
  bambooGlow: () => bambooGlow,
  forestBird: () => forestBird,
  forestButterfly: () => forestButterfly,
  headlights: () => headlights,
  nightDecor: () => nightDecor,
  recordMarker: () => recordMarker,
  surface: () => surface,
  updateEnvironment: () => updateEnvironment,
  updateWeatherSign: () => updateWeatherSign,
  weatherSign: () => weatherSign,
  windFront: () => windFront
});
module.exports = __toCommonJS(environment_exports);
var THREE = __toESM(require("three"));
var import_art = require("./art.js");
var import_storm = require("./storm.js");
const surfaces = /* @__PURE__ */ new Map();
const palettes = {
  grass: ["#83ac5a", "#87af5e"],
  road: ["#c5ad82", "#c9b187"],
  water: ["#237f9d", "#2786a1"],
  storm: ["#827e68", "#898570"],
  finish: ["#b5bd73", "#c5c987"]
};
const groundMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.95
});
const waterTime = { value: 0 };
const snowAmount = { value: 0 };
const waterMaterial = groundMaterial.clone();
waterMaterial.roughness = 0.28;
waterMaterial.metalness = 0.12;
const snowMaterial = groundMaterial.clone();
function groundShader(material, kind) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.waterTime = waterTime;
    shader.uniforms.snowAmount = snowAmount;
    shader.vertexShader = "varying vec3 groundPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ngroundPosition = (modelMatrix * vec4(position, 1.0)).xyz;"
    );
    shader.fragmentShader = "varying vec3 groundPosition;\nuniform float waterTime;\nuniform float snowAmount;\n" + shader.fragmentShader;
    const effect = kind === "water" ? `
      float wave = sin(groundPosition.x * 3.2 + groundPosition.z * 5.5 + waterTime * 1.8);
      float crossWave = sin(groundPosition.x * 1.4 - groundPosition.z * 7.0 - waterTime);
      float foam = smoothstep(1.55, 1.95, wave + crossWave);
      diffuseColor.rgb = mix(diffuseColor.rgb * (0.86 + 0.09 * wave), vec3(0.30, 0.78, 0.82), foam * 0.55);
    ` : `
      float snowMask = 0.5 + 0.25 * sin(groundPosition.x * 1.1 + groundPosition.z) + 0.25 * cos(groundPosition.z * 2.3);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.94, 0.88), snowAmount * smoothstep(0.08, 0.75, snowMask));
    `;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      "#include <color_fragment>\n" + effect
    );
  };
  material.customProgramCacheKey = () => "forest-" + kind;
}
groundShader(waterMaterial, "water");
groundShader(snowMaterial, "snow");
function updateEnvironment(time, cover) {
  waterTime.value = time;
  snowAmount.value = cover;
}
const glowBytes = new Uint8Array(64 * 64 * 4);
for (let y = 0; y < 64; y++)
  for (let x = 0; x < 64; x++) {
    const i = (y * 64 + x) * 4, d = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
    glowBytes[i] = glowBytes[i + 1] = glowBytes[i + 2] = 255;
    glowBytes[i + 3] = Math.round(Math.pow(Math.max(0, 1 - d), 2) * 255);
  }
const glowTexture = new THREE.DataTexture(glowBytes, 64, 64);
glowTexture.needsUpdate = true;
glowTexture.magFilter = THREE.LinearFilter;
const glowMaterial = new THREE.MeshBasicMaterial({
  color: "#ffdc8a",
  transparent: true,
  opacity: 0.65,
  map: glowTexture,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const poolGeometry = new THREE.CircleGeometry(2.5, 24);
const fireflyMaterial = new THREE.MeshBasicMaterial({ color: "#e7ffac" });
const fireflyGeometry = new THREE.IcosahedronGeometry(0.035, 0);
const headlightGlow = glowMaterial.clone();
headlightGlow.opacity = 0.34;
const beamGeometry = new THREE.PlaneGeometry(4, 2);
const bambooGlowGeometry = new THREE.PlaneGeometry(1.1, 1.1);
function surface(type, index) {
  const parity = Math.abs(index % 2), key = type + parity;
  if (!surfaces.has(key)) {
    const positions = [], colors = [];
    for (let x = -50; x < 50; x++) {
      const a = x * 1.3 - 0.65, b = a + 1.3, c = new THREE.Color(palettes[type][Math.abs((x + parity) % 2)]);
      positions.push(
        a,
        0,
        0.65,
        b,
        0,
        0.65,
        b,
        0,
        -0.65,
        a,
        0,
        0.65,
        b,
        0,
        -0.65,
        a,
        0,
        -0.65
      );
      for (let v = 0; v < 6; v++) colors.push(c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    surfaces.set(key, geo);
  }
  const mesh = new THREE.Mesh(
    surfaces.get(key),
    type === "water" ? waterMaterial : ["grass", "finish"].includes(type) ? snowMaterial : groundMaterial
  );
  mesh.receiveShadow = true;
  return mesh;
}
function nightDecor(root, index, rng, type, start, length = 1) {
  if (type === "water" && index === start) {
    for (const side of [-1, 1]) {
      const x = side * 7.25;
      const bankStart = 1.3, bankEnd = -length * 1.3;
      for (const z of [bankStart, bankEnd])
        (0, import_art.box)(root, "#50675c", x, 1.35, z, 0.1, 2.7, 0.1);
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 2.65, bankStart),
        new THREE.Vector3(x, 2.25, (bankStart + bankEnd) / 2),
        new THREE.Vector3(x, 2.65, bankEnd)
      ]);
      const rope = new THREE.Mesh(
        new THREE.TubeGeometry(path, 16, 0.025, 4, false),
        new THREE.MeshBasicMaterial({ color: "#47554b" })
      );
      rope.userData.ownedGeometry = true;
      rope.userData.ownedMaterial = true;
      rope.userData.fenceLights = true;
      root.add(rope);
      const count = length * 2 + 2;
      for (let i = 1; i < count; i++) {
        const point = path.getPoint(i / count);
        const lamp = (0, import_art.ball)(
          root,
          "#ffe1a3",
          point.x,
          point.y - 0.09,
          point.z,
          0.085
        );
        lamp.material = fireflyMaterial;
        lamp.castShadow = false;
      }
    }
  }
  if (type !== "water" && index % 4 === 0)
    for (const side of [-1, 1]) {
      (0, import_art.box)(root, "#3d524c", side * 7.6, 1.6, 0, 0.11, 3.2, 0.11);
      const lamp = (0, import_art.box)(root, "#ffde91", side * 7.6, 3.1, 0, 0.32, 0.36, 0.32);
      lamp.material = fireflyMaterial;
      const pool = new THREE.Mesh(poolGeometry, glowMaterial);
      pool.userData.nightOnly = true;
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(side * 6.8, 0.02, 0);
      root.add(pool);
    }
  const flies = [];
  if (index % 2 === 0)
    for (let i = 0; i < 3; i++) {
      const fly = new THREE.Mesh(fireflyGeometry, fireflyMaterial);
      fly.userData.nightOnly = true;
      fly.position.set((rng() - 0.5) * 10, 0.4 + rng() * 1.3, rng() - 0.5);
      root.add(fly);
      flies.push({
        mesh: fly,
        x: fly.position.x,
        y: fly.position.y,
        phase: rng() * 6
      });
    }
  return flies;
}
function headlights(vehicle) {
  for (const z of [-0.24, 0.24]) {
    const lamp = (0, import_art.box)(vehicle, "#fff0b9", 0.8, 0.51, z, 0.04, 0.12, 0.15);
    lamp.material = fireflyMaterial;
    const beam = new THREE.Mesh(beamGeometry, headlightGlow);
    beam.userData.nightOnly = true;
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(2, 0.025, z);
    vehicle.add(beam);
  }
}
function windFront(rng, row) {
  const root = new THREE.Group();
  const clips = [
    new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      (row + 0.5 - import_storm.STORM.rowInset) * 1.3
    ),
    new THREE.Plane(
      new THREE.Vector3(0, 0, -1),
      -(row - 0.5 + import_storm.STORM.rowInset) * 1.3
    )
  ];
  const materials = /* @__PURE__ */ new Map();
  const pieces = [];
  const kinds = [
    "tree",
    "tree",
    "tree",
    "tyre",
    "tyre",
    "tyre",
    "tyre",
    "log",
    "log",
    "log",
    "log",
    "log"
  ];
  for (let i = kinds.length - 1; i > 0; i--) {
    const other = Math.floor(rng() * (i + 1));
    [kinds[i], kinds[other]] = [kinds[other], kinds[i]];
  }
  for (let j = 0; j < 54; j++) {
    let debris;
    if (j < 12) {
      const isTree = kinds[j] === "tree";
      const isTyre = kinds[j] === "tyre";
      if (isTree) {
        debris = new THREE.Group();
        const sapling = (0, import_art.tree)(debris, 0, 0, rng, true);
        sapling.position.y = -0.75;
        sapling.scale.setScalar(0.62);
        (0, import_art.box)(debris, "#58452e", 0, -0.75, 0, 0.45, 0.13, 0.25).rotation.z = 0.3;
        debris.userData.tree = true;
      } else
        debris = isTyre ? (0, import_art.floatingTyre)() : (0, import_art.logModel)([0.8, 1.1, 1.5][Math.floor(rng() * 3)]);
      root.add(debris);
      if (!isTree && !isTyre)
        (0, import_art.box)(debris, "#65513b", 0.1, 0.25, 0, 0.09, 0.6, 0.1).rotation.z = 0.7;
      if (!isTree && !isTyre && rng() < 0.55) {
        (0, import_art.box)(debris, "#789552", 0.3, 0.38, 0, 0.35, 0.12, 0.3).rotation.z = 0.5;
        (0, import_art.box)(debris, "#9ab76d", -0.25, 0.27, 0, 0.28, 0.09, 0.22).rotation.z = -0.6;
      }
      debris.scale.setScalar(
        (isTree ? 0.9 : isTyre ? 0.85 : 0.7) * (0.85 + rng() * 0.3)
      );
      debris.userData.spin = true;
      debris.userData.kind = kinds[j];
      debris.userData.spinSpeed = (rng() < 0.5 ? -1 : 1) * (6 + rng() * 8);
      const bounds = new THREE.Box3().setFromObject(debris);
      debris.userData.radius = new THREE.Vector3(
        Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)),
        Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y)),
        Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z))
      ).length();
      pieces.push(debris);
    } else {
      debris = (0, import_art.box)(
        root,
        j % 3 ? "#d5e7d5" : "#80978b",
        0,
        0,
        0,
        2.5 + rng() * 4.5,
        0.018 + rng() * 0.025,
        0.023
      );
      debris.userData.streak = true;
    }
    debris.position.set(
      (j < 12 ? (j + 0.5) / 12 - 0.5 : rng() - 0.5) * (import_storm.STORM.halfLength * 2 * 1.3 - 1.8),
      0.6 + rng() * 1.4,
      (rng() - 0.5) * (j < 12 ? 0.65 : 0.9)
    );
    debris.userData.baseY = debris.position.y;
    debris.userData.length = debris.scale.x;
    debris.userData.phase = rng() * Math.PI * 2;
    debris.rotation.z = debris.userData.spin ? rng() * 6 : -0.05;
    debris.traverse((mesh) => {
      if (!mesh.isMesh) return;
      if (!materials.has(mesh.material)) {
        const mat = mesh.material.clone();
        mat.clippingPlanes = clips;
        materials.set(mesh.material, mat);
      }
      mesh.material = materials.get(mesh.material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
  }
  const span = import_storm.STORM.halfLength * 2 * 1.3 - 1.8;
  const diameterSum = pieces.reduce(
    (sum, piece) => sum + piece.userData.radius * 2,
    0
  );
  const fit = Math.min(1, (span - pieces.length * 0.35) / diameterSum);
  const weights = Array.from(
    { length: pieces.length + 1 },
    () => 0.1 + rng() ** 2 * 3
  );
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const free = span - diameterSum * fit - (pieces.length - 1) * 0.35;
  let cursor = -span / 2 + free * weights[0] / weightSum;
  pieces.forEach((piece, i) => {
    piece.scale.multiplyScalar(fit);
    const radius = piece.userData.radius *= fit;
    piece.position.x = cursor + radius;
    piece.userData.baseY = radius + 0.25 + rng() * 1.2;
    piece.position.y = piece.userData.baseY;
    cursor += radius * 2 + 0.35 + free * weights[i + 1] / weightSum;
  });
  root.userData.materials = [...materials.values()];
  return root;
}
const signSunColor = new THREE.Color("#254d4c");
const signStormColor = new THREE.Color("#bd413b");
function signInk(root, color) {
  const mat = new THREE.MeshBasicMaterial({ color });
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    mesh.material = mat;
    mesh.castShadow = false;
  });
  return mat;
}
function weatherSign(parent) {
  const root = new THREE.Group();
  parent.add(root);
  root.position.set(0, 0, 1.6);
  for (const x of [-1.13, 1.13])
    (0, import_art.box)(root, "#60422d", x, 1.12, 0, 0.18, 2.24, 0.18);
  (0, import_art.box)(root, "#513b2a", 0, 2.42, 0, 2.95, 1.56, 0.24, 0.06);
  const board = (0, import_art.box)(root, "#254d4c", 0, 2.42, 0.15, 2.65, 1.28, 0.08, 0.04);
  board.material = new THREE.MeshBasicMaterial({ color: "#254d4c" });
  for (const x of [-1.3, 1.3])
    for (const y of [1.84, 3]) (0, import_art.ball)(root, "#d7bd7b", x, y, 0.23, 0.05);
  const sun = new THREE.Group(), cloud = new THREE.Group();
  root.add(sun, cloud);
  sun.position.set(0, 2.42, 0.25);
  cloud.position.copy(sun.position);
  (0, import_art.ball)(sun, "#ffdf74", 0, 0, 0, 0.27, [1, 1, 0.4]);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const ray = (0, import_art.box)(
      sun,
      "#ffdf74",
      Math.cos(a) * 0.43,
      Math.sin(a) * 0.43,
      0,
      0.16,
      0.065,
      0.04
    );
    ray.rotation.z = a;
  }
  const sunMat = signInk(sun, "#ffe389");
  const shape = new THREE.Shape();
  shape.moveTo(-0.6, 0.02);
  shape.bezierCurveTo(-0.9, 0.04, -0.82, 0.47, -0.5, 0.42);
  shape.bezierCurveTo(-0.44, 0.8, 0.16, 0.79, 0.27, 0.43);
  shape.bezierCurveTo(0.66, 0.6, 0.85, 0.07, 0.5, 0.02);
  shape.lineTo(-0.6, 0.02);
  const silhouette = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: "#e7f3e7" })
  );
  silhouette.scale.setScalar(0.82);
  silhouette.position.y = -0.15;
  cloud.add(silhouette);
  const boltShape = new THREE.Shape();
  [
    [0.02, 0.25],
    [-0.28, -0.1],
    [-0.06, -0.1],
    [-0.2, -0.5],
    [0.35, -0.02],
    [0.08, -0.02]
  ].forEach(
    ([x, y], i) => i ? boltShape.lineTo(x, y) : boltShape.moveTo(x, y)
  );
  boltShape.closePath();
  const bolt = new THREE.Mesh(
    new THREE.ShapeGeometry(boltShape),
    new THREE.MeshBasicMaterial({ color: "#ffe17c" })
  );
  bolt.position.z = 0.08;
  cloud.add(bolt);
  const alertMarks = new THREE.Group();
  for (const x of [-1.02, 1.02]) {
    (0, import_art.box)(alertMarks, "#fff0b9", x, 2.51, 0.28, 0.09, 0.35, 0.025);
    (0, import_art.ball)(alertMarks, "#fff0b9", x, 2.23, 0.28, 0.055);
  }
  root.add(alertMarks);
  const alertMat = signInk(alertMarks, "#fff0b9");
  alertMarks.visible = false;
  cloud.scale.setScalar(1e-3);
  return {
    root,
    board,
    sun,
    cloud,
    alertMarks,
    blend: 0,
    ownedMaterials: [sunMat, alertMat, silhouette.material, bolt.material],
    ownedGeometries: [silhouette.geometry, bolt.geometry]
  };
}
function updateWeatherSign(sign, phase, announced, time, dt) {
  const alert = announced && (phase.warning || phase.active);
  sign.blend += ((alert ? 1 : 0) - sign.blend) * Math.min(1, dt * 12);
  const b = sign.blend;
  sign.sun.scale.setScalar(Math.max(1e-3, 1 - b));
  sign.sun.rotation.z = b * 1.9 + time * 0.12;
  sign.cloud.scale.setScalar(
    Math.max(1e-3, b * (1 + Math.sin(time * 13) * 0.045))
  );
  sign.cloud.rotation.z = (1 - b) * -0.45;
  sign.alertMarks.visible = b > 0.65;
  sign.alertMarks.scale.y = 1 + Math.sin(time * 15) * 0.025 * b;
  sign.board.material.color.copy(signSunColor).lerp(signStormColor, b);
  sign.root.rotation.z = Math.sin(time * 30) * 0.019 * b;
}
function forestButterfly(parent, x, rng) {
  const root = new THREE.Group();
  root.position.set(x, 0.35, 0);
  parent.add(root);
  (0, import_art.box)(root, "#495344", 0, 0, 0, 0.035, 0.035, 0.18);
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Group();
    root.add(wing);
    (0, import_art.ball)(wing, "#e9b963", side * 0.12, 0, 0, 0.14, [1, 0.1, 1.15]);
    (0, import_art.ball)(wing, "#f0db98", side * 0.18, 0.01, -0.03, 0.045, [1, 0.15, 1]);
    wing.traverse((mesh) => {
      if (mesh.isMesh) mesh.castShadow = false;
    });
    return wing;
  });
  return { root, wings, x, phase: rng() * 6.28, lift: 0 };
}
function forestBird(parent, x, z, rng) {
  const root = new THREE.Group();
  parent.add(root);
  root.position.set(x, 0.1, z);
  (0, import_art.ball)(
    root,
    rng() > 0.5 ? "#cf9650" : "#527f8c",
    0,
    0.12,
    0,
    0.13,
    [1, 1, 1.4]
  );
  (0, import_art.ball)(root, "#e6c77e", 0, 0.17, 0.16, 0.075, [0.7, 0.4, 1]);
  const wings = [-1, 1].map(
    (s) => (0, import_art.box)(root, "#3b615b", s * 0.15, 0.13, 0, 0.22, 0.035, 0.16, 0.02)
  );
  return {
    root,
    wings,
    origin: root.position.clone(),
    flight: 0,
    triggered: false,
    direction: rng() > 0.5 ? 1 : -1
  };
}
function recordMarker(parent, score, label) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  canvas.width *= 2;
  canvas.height *= 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  ctx.fillStyle = "#2b6858";
  ctx.fillRect(0, 0, 1024, 128);
  ctx.strokeStyle = "#c4e8a1";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 1016, 120);
  ctx.fillStyle = "#fff3bd";
  ctx.font = '900 78px "Barlow Condensed", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${label.toUpperCase()}  ${score}`, 512, 67);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 0.85),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.023, 0.08);
  parent.add(mesh);
  return mesh;
}
function bambooGlow(parent, x) {
  const mesh = new THREE.Mesh(bambooGlowGeometry, glowMaterial);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.025, 0);
  parent.add(mesh);
  return mesh;
}

});
