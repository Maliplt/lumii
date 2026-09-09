BambooModules.define("world.js", function(require, module, exports) {
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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var world_exports = {};
__export(world_exports, {
  CELL: () => CELL,
  ForestWorld: () => ForestWorld
});
module.exports = __toCommonJS(world_exports);
var THREE = __toESM(require("three"));
var import_art = require("./art.js");
var import_core = require("./core.js");
var import_storm = require("./storm.js");
var import_config = require("./config.js");
var import_platforms = require("./platforms.js");
var import_environment = require("./environment.js");
var import_traffic = require("./traffic.js");
var import_shop_preview = require("./shop-preview.js");
var import_atmosphere = require("./atmosphere.js");
var import_render_budget = require("./render-budget.js");
var import_static_batches = require("./static-batches.js");
const CELL = 1.3;
class ForestWorld {
  constructor(canvas, save) {
    this.save = save;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#dce7cc");
    this.scene.fog = new THREE.Fog("#dce7cc", 65, 115);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.localClippingEnabled = true;
    this.budget = new import_render_budget.RenderBudget(this.renderer, save);
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 120);
    this.ambient = new THREE.HemisphereLight("#fff8e7", "#6e8964", 1.9);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight("#fff1d6", 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -19,
      right: 19,
      top: 22,
      bottom: -20,
      near: 1,
      far: 60
    });
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -1e-4;
    this.scene.add(this.sun, this.sun.target);
    this.moon = (0, import_art.ball)(this.scene, "#f5eaca", 0, 12, -20, 0.8);
    this.moon.material = new THREE.MeshBasicMaterial({ color: "#fff0c7" });
    this.moon.castShadow = false;
    this.moon.receiveShadow = false;
    this.terrain = new THREE.Group();
    this.scene.add(this.terrain);
    this.lanes = /* @__PURE__ */ new Map();
    this.particles = [];
    this.focus = new THREE.Vector3();
    this.atmosphere = new import_atmosphere.Atmosphere(this.scene);
    this.time = 0;
    this.menu = true;
    this.panda = (0, import_art.panda)(save.equipped);
    this.scene.add(this.panda);
    this.shadow = (0, import_art.contactShadow)(this.scene, 0, 0, 0.43);
    this.previews = /* @__PURE__ */ new Map();
    this.resize();
    this.showMenu();
  }
  quality() {
    this.budget.apply();
    this.renderer.shadowMap.enabled = this.save.quality === "high";
    this.sun.castShadow = this.save.quality === "high";
    this.scene.traverse((o) => {
      if (o.material) o.material.needsUpdate = true;
    });
    this.renderer.setSize(innerWidth, innerHeight, false);
  }
  resize() {
    this.quality();
    const aspect = innerWidth / innerHeight;
    const size = this.menu ? innerWidth < 700 ? 15.5 : 17 : Math.max(17, 14.2 / aspect);
    Object.assign(this.camera, {
      left: -size * aspect / 2,
      right: size * aspect / 2,
      top: size / 2,
      bottom: -size / 2
    });
    this.camera.updateProjectionMatrix();
  }
  dress() {
    const previous = this.panda;
    this.scene.remove(this.panda);
    this.panda = (0, import_art.panda)(this.save.equipped);
    this.panda.position.copy(previous.position);
    this.panda.rotation.copy(previous.rotation);
    this.panda.scale.copy(previous.scale);
    this.scene.add(this.panda);
  }
  reset(seed, tutorial) {
    this.seed = seed;
    this.tutorial = tutorial;
    this.plannedNight = !tutorial && (0, import_core.random)(seed + 97)() < 0.5;
    this.night = !this.menu && this.plannedNight;
    this.moon.visible = this.night;
    document.body.dataset.night = String(this.night);
    this.scene.background.set(this.night ? "#233c50" : "#dce7cc");
    this.scene.fog.color.copy(this.scene.background);
    this.ambient.color.set(this.night ? "#b0d4ef" : "#fff8e7");
    this.ambient.intensity = this.night ? 1.35 : 1.9;
    this.sun.color.set(this.night ? "#adcbff" : "#fff1d6");
    for (const lane of this.lanes.values()) this.disposeLane(lane);
    this.terrain.clear();
    this.lanes.clear();
    this.clearParticles();
    this.atmosphere.reset();
    this.time = 0;
    for (let i = -22; i < 30; i++) this.addLane(i);
    this.panda.position.set(0, 0, 0);
    this.panda.rotation.set(0, 0, 0);
    this.panda.scale.setScalar(1);
    this.panda.userData.body.position.y = 0;
    this.panda.visible = true;
  }
  showMenu() {
    this.menu = true;
    this.runRecord = 0;
    this.resize();
    this.preparedSeed = Math.floor(Math.random() * 2147483647);
    this.reset(
      this.save.tutorial ? this.preparedSeed : 7721,
      !this.save.tutorial
    );
    this.panda.position.set(1.3, 0, 0);
    this.panda.rotation.y = -0.32;
    this.panda.scale.setScalar(1.85);
    this.focus.set(
      innerWidth < 700 ? 1.8 : -4.4,
      0,
      innerWidth < 700 ? 0.5 : -2
    );
  }
  play(seed, tutorial, record = 0, recordLabel = "EN İYİ") {
    const reuse = this.menu && this.seed === seed && this.tutorial === tutorial;
    this.runRecord = record;
    this.recordLabel = recordLabel;
    this.introSky = this.scene.background.clone();
    this.introAmbient = this.ambient.color.clone();
    this.introSun = this.sun.color.clone();
    this.introFocus = this.focus.clone();
    this.introSize = this.camera.top * 2;
    this.introTime = 0;
    this.menu = false;
    this.resize();
    if (!reuse) this.reset(seed, tutorial);
    else {
      this.night = this.plannedNight;
      this.moon.visible = this.night;
      document.body.dataset.night = String(this.night);
      this.terrain.traverse((mesh) => {
        if (mesh.userData.nightOnly) mesh.visible = this.night;
      });
      const recordLane = this.lanes.get(record);
      if (record > 0 && recordLane && !recordLane.recordMarker)
        recordLane.recordMarker = (0, import_environment.recordMarker)(
          recordLane.root,
          record,
          recordLabel
        );
    }
    this.focus.copy(this.introFocus);
    this.shake = 0.7;
  }
  addLane(index) {
    const spec = (0, import_core.laneSpec)(index, this.seed, this.tutorial);
    const root = new THREE.Group();
    root.position.z = -index * CELL;
    this.terrain.add(root);
    const rng = (0, import_core.random)(this.seed + index * 331 + 8124);
    const lane = {
      ...spec,
      root,
      movers: [],
      coins: [],
      storm: null,
      foam: [],
      birds: [],
      butterflies: []
    };
    root.add((0, import_environment.surface)(spec.type, index));
    if (spec.type === "grass" && index > 2 && index % 11 === 0)
      lane.butterflies.push(
        (0, import_environment.forestButterfly)(root, (rng() > 0.5 ? 1 : -1) * 3.7, rng)
      );
    if (spec.type === "water") {
      const hasTyres = spec.rest;
      const lengths = spec.blockPattern;
      for (let i = 0; i < (hasTyres ? 0 : 4); i++) {
        const length = lengths[i], mesh = (0, import_art.linkedLogs)(length);
        root.add(mesh);
        lane.movers.push({
          mesh,
          x: 0,
          length,
          blocks: length,
          origin: i * 8 + (this.tutorial ? 0 : spec.offset),
          speed: this.tutorial ? 0 : spec.speed,
          cruise: this.tutorial ? 0 : spec.speed * (i % 2 === 0 ? 1 : 2.6),
          height: 0.35
        });
      }
      if (hasTyres)
        for (const x of [-3, 0, 3]) {
          const mesh = (0, import_art.floatingTyre)();
          mesh.position.x = x * CELL;
          root.add(mesh);
          lane.movers.unshift({
            mesh,
            x,
            length: 0.95,
            blocks: 1,
            origin: x,
            speed: 0,
            fixed: true,
            height: 0.25
          });
        }
    }
    if (spec.type === "road") {
      for (let i = 0; i < 4; i++) {
        const variant = ((Math.floor(spec.variant * 5) + i) % 5 + 0.3) / 5, mesh = (0, import_art.vehicle)(
          variant,
          this.tutorial ? Math.sign(spec.speed) * 1.15 : spec.speed
        );
        const speed = this.tutorial ? Math.sign(spec.speed) * 1.15 : spec.speed;
        root.add(mesh);
        if (this.plannedNight) (0, import_environment.headlights)(mesh);
        lane.movers.push({
          mesh,
          x: 0,
          length: mesh.userData.length,
          origin: i * 8 + spec.offset,
          speed
        });
      }
    }
    if (spec.type === "storm") {
      for (let j = 0; j < 8; j++) {
        const scar = (0, import_art.box)(
          root,
          "#a8a28a",
          (j - 4) * 1.5,
          0.012,
          (rng() - 0.5) * 0.8,
          0.55,
          7e-3,
          0.06
        );
        scar.rotation.y = -0.4;
        scar.castShadow = false;
      }
      lane.storm = (0, import_environment.windFront)(rng, index);
      lane.storm.visible = false;
      root.add(lane.storm);
      lane.offset = -spec.start;
      if (index === spec.start || index === spec.start + spec.length - 1) {
        const edge = index === spec.start ? CELL * 0.495 : -CELL * 0.495;
        for (let x = -5; x <= 5; x++) {
          const marker = (0, import_art.box)(
            root,
            x % 2 ? "#d8c98d" : "#414d43",
            x * CELL,
            0.022,
            edge,
            CELL,
            0.015,
            0.095
          );
          marker.castShadow = false;
        }
      }
      if (index === spec.start) {
        lane.sign = (0, import_environment.weatherSign)(root);
      }
    }
    if (spec.type === "water")
      for (let j = 0; j < 11; j++) {
        const foam = (0, import_art.box)(
          root,
          "#78c7d5",
          (j - 5) * 1.7,
          0.016,
          (rng() - 0.5) * 0.9,
          0.35 + rng() * 0.6,
          8e-3,
          0.025
        );
        foam.castShadow = false;
        lane.foam.push({ mesh: foam, x: foam.position.x, phase: rng() * 6 });
      }
    if (spec.type === "finish") {
      for (const x of [-2, 2]) (0, import_art.box)(root, "#67492e", x, 1.6, 0, 0.2, 3.2, 0.2);
      (0, import_art.box)(root, "#e8cb74", 0, 3, 0, 4.3, 0.5, 0.2);
      for (let x = -4; x <= 4; x++)
        (0, import_art.box)(
          root,
          x % 2 ? "#f6ebce" : "#365746",
          x * 0.45,
          3,
          0.12,
          0.4,
          0.38,
          0.03
        );
    }
    for (const side of [-1, 1]) {
      if (spec.type === "grass" || spec.type === "finish") {
        (0, import_art.box)(root, "#50675c", side * 7.25, 0.36, 0, 0.09, 0.72, 0.09);
        (0, import_art.box)(root, "#677b6d", side * 7.25, 0.46, 0, 0.065, 0.07, CELL);
      }
    }
    lane.fireflies = this.plannedNight ? (0, import_environment.nightDecor)(root, index, rng, spec.type, spec.start) : [];
    if (spec.type === "grass") {
      if (index > 1 && index % 5 === 0)
        for (let i = 0; i < 2; i++)
          lane.birds.push(
            (0, import_environment.forestBird)(root, (rng() - 0.5) * 8, (rng() - 0.5) * 0.7, rng)
          );
      for (const x of spec.obstacles) (0, import_art.tree)(root, x * CELL, 0, rng, true);
      if (index >= 0)
        for (let i = 0; i < 4; i++)
          (0, import_art.flowers)(root, (rng() - 0.5) * 10, (rng() - 0.5) * 0.85, rng);
      for (const side of [-1, 1]) {
        if (index % 2 === 0) {
          (0, import_art.tree)(root, side * (8.2 + rng() * 2), rng() * 0.3, rng);
          if (rng() > 0.35) (0, import_art.bamboo)(root, side * (7.5 + rng() * 0.5), -0.1, rng);
        }
        if (index % 3 === 0) {
          (0, import_art.ball)(
            root,
            "#9aab83",
            side * (7.6 + rng()),
            0.19,
            0.3,
            0.36,
            [1.3, 0.7, 1]
          );
          (0, import_art.mushroom)(root, side * 7.65, -0.25);
        }
      }
    }
    if (spec.hasCoin) {
      const positions = [spec.coinX];
      if (!this.tutorial && index % 6 === 0)
        positions.push(spec.coinX > 0 ? -2 : 2);
      for (const x of new Set(positions)) {
        if (spec.obstacles.includes(x)) continue;
        const mesh = (0, import_art.collectible)(index + x);
        mesh.position.set(x * CELL, 0.65, 0);
        root.add(mesh);
        lane.coins.push({
          mesh,
          x,
          collected: false,
          shadow: (0, import_art.contactShadow)(root, x * CELL, 0, 0.25),
          glow: (0, import_environment.bambooGlow)(root, x * CELL)
        });
        if (spec.type === "water") {
          const coin = lane.coins.at(-1);
          coin.platform = lane.movers[positions.indexOf(x) % lane.movers.length];
          coin.slot = Math.floor((coin.platform.blocks - 1) / 2);
        }
      }
    }
    for (const mover of lane.movers) {
      if (!mover.fixed) mover.x = (0, import_core.wrap)(mover.origin, -16, 16);
      mover.mesh.position.x = mover.x * CELL;
    }
    for (const coin of lane.coins)
      if (coin.platform) {
        coin.x = (0, import_platforms.slotPosition)(coin.platform, coin.slot);
        coin.mesh.position.x = coin.x * CELL;
        coin.shadow.position.x = coin.x * CELL;
      }
    if (!this.tutorial && index === this.runRecord && index > 0)
      lane.recordMarker = (0, import_environment.recordMarker)(root, this.runRecord, this.recordLabel);
    root.traverse((mesh) => {
      if (mesh.userData.nightOnly) mesh.visible = this.night;
    });
    this.lanes.set(index, lane);
    (0, import_static_batches.batchScenery)(lane);
    return lane;
  }
  ensure(row) {
    for (let i = row - 22; i <= row + 29; i++)
      if (!this.lanes.has(i)) this.addLane(i);
    for (const [i, lane] of this.lanes)
      if (i < row - 23) {
        this.disposeLane(lane);
        this.terrain.remove(lane.root);
        this.lanes.delete(i);
      }
  }
  disposeLane(lane) {
    lane.root.traverse((mesh) => {
      if (mesh.isInstancedMesh) mesh.dispose();
      if (mesh.userData.ownedGeometry) mesh.geometry.dispose();
      if (mesh.userData.ownedMaterial) mesh.material.dispose();
    });
    for (const coin of lane.coins) coin.shadow.material.dispose();
    if (lane.storm) lane.storm.userData.materials.forEach((m) => m.dispose());
    if (lane.sign) {
      lane.sign.board.material.dispose();
      lane.sign.ownedMaterials.forEach((m) => m.dispose());
      lane.sign.ownedGeometries.forEach((g) => g.dispose());
    }
    if (lane.recordMarker) {
      lane.recordMarker.material.map.dispose();
      lane.recordMarker.material.dispose();
      lane.recordMarker.geometry.dispose();
    }
  }
  clearParticles() {
    for (const particle of this.particles) this.scene.remove(particle.mesh);
    this.particles = [];
  }
  burst(x, z, color, count = 12) {
    if (this.save.reduced) count = 3;
    for (let i = 0; i < count; i++) {
      const mesh = (0, import_art.box)(this.scene, color, x, 0.25, z, 0.09, 0.09, 0.09);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * (count > 30 ? 9 : 4),
          1 + Math.random() * (count > 30 ? 5 : 2),
          (Math.random() - 0.5) * (count > 30 ? 9 : 4)
        ),
        life: 0.6 + Math.random() * 0.4
      });
    }
  }
  wardrobeScenes() {
    this.shopPreview || (this.shopPreview = new import_shop_preview.ShopPreview(this.previews));
    this.shopPreview.draw();
  }
  update(dt, game) {
    if (document.body.dataset.modal === "wardrobe") {
      this.wardrobeScenes();
      return;
    }
    const running = this.menu || game.state === "playing" || game.state === "dying";
    if (running) this.time += dt;
    if (running)
      for (const lane of this.lanes.values()) {
        for (const butterfly of lane.butterflies) {
          const near = !this.menu && Math.abs(lane.index - game.row) < 2 && Math.abs(butterfly.x - game.x * CELL) < 2.5;
          butterfly.lift += ((near ? 1.3 : 0.15) - butterfly.lift) * Math.min(1, dt * 2);
          butterfly.root.position.set(
            butterfly.x + Math.sin(this.time * 1.4 + butterfly.phase) * 0.45,
            0.35 + butterfly.lift + Math.sin(this.time * 2) * 0.08,
            Math.cos(this.time + butterfly.phase) * 0.35
          );
          butterfly.wings.forEach(
            (wing, i) => wing.rotation.z = Math.sin(
              this.time * (this.save.reduced ? 5 : 18) + butterfly.phase
            ) * (i ? 1 : -1) * 0.7
          );
        }
        for (const bird of lane.birds) {
          if (!bird.triggered && !this.menu && Math.abs(lane.index - game.row) < 3 && Math.abs(bird.origin.x - game.x * CELL) < 3.5)
            bird.triggered = true;
          if (bird.triggered) {
            bird.flight += dt;
            bird.root.position.set(
              bird.origin.x + bird.flight * bird.direction * 3,
              0.12 + bird.flight * 2,
              bird.origin.z - bird.flight * 2
            );
            bird.wings.forEach(
              (wing, i) => wing.rotation.z = Math.sin(bird.flight * 32) * (i ? 1 : -1)
            );
            if (bird.flight > 3) bird.root.visible = false;
          }
        }
        for (const foam of lane.foam) {
          foam.mesh.position.x = foam.x + Math.sin(this.time * 0.6 + foam.phase) * 0.3;
          foam.mesh.scale.z = 0.018 + Math.sin(this.time + foam.phase) * 7e-3;
        }
        for (const fly of lane.fireflies) {
          fly.mesh.position.y = fly.y + Math.sin(this.time + fly.phase) * 0.12;
          fly.mesh.position.x = fly.x + Math.sin(this.time * 0.5 + fly.phase) * 0.2;
          fly.mesh.scale.setScalar(
            0.6 + Math.sin(this.time * 2 + fly.phase) * 0.4
          );
        }
        (0, import_traffic.advanceTraffic)(lane, dt);
        for (const mover of lane.movers) {
          if (lane.type === "road")
            mover.mesh.rotation.y = mover.speed < 0 ? Math.PI : 0;
          mover.mesh.position.x = mover.x * CELL;
        }
        for (const coin of lane.coins)
          if (!coin.collected) {
            if (coin.platform) {
              coin.x = (0, import_platforms.slotPosition)(coin.platform, coin.slot);
              coin.mesh.position.x = coin.x * CELL;
              coin.shadow.position.x = coin.x * CELL;
              coin.shadow.position.y = coin.platform.height + 0.01;
            }
            coin.glow.position.set(
              coin.x * CELL,
              (coin.platform?.height || 0) + 0.028,
              0
            );
            coin.glow.scale.setScalar(0.95 + Math.sin(this.time * 4) * 0.12);
            coin.mesh.rotation.y = this.time * 1.3;
            coin.mesh.position.y = 0.85 + (coin.platform?.height || 0) + Math.sin(this.time * 2.5 + lane.index) * 0.07;
          }
        if (lane.storm) {
          const phase = (0, import_config.stormPhase)(this.time, lane.offset);
          lane.storm.visible = phase.active && (this.menu || lane.announced);
          lane.storm.position.x = (0, import_storm.stormCenter)(phase.progress) * CELL;
          lane.storm.children.forEach((debris, i) => {
            debris.visible = this.save.quality === "high" || i < 12 || i % 2 === 0;
            const p = debris.userData.phase;
            if (debris.userData.spin) {
              debris.rotation.x = debris.userData.tree ? 0 : this.time * debris.userData.spinSpeed + p;
              debris.rotation.z = this.time * debris.userData.spinSpeed * 0.8 + p;
              debris.rotation.y = debris.userData.tree ? Math.sin(this.time * 3) * 0.08 : this.time * 5;
            }
            debris.position.y = debris.userData.baseY + Math.sin(this.time * 19 + p) * 0.16;
            if (debris.userData.streak)
              debris.scale.x = debris.userData.length * (0.8 + Math.sin(this.time * 27 + p) * 0.2);
          });
          lane.stormX = lane.storm.position.x / CELL;
          lane.stormActive = phase.active && !!lane.announced;
          lane.stormHalf = import_storm.STORM.halfLength;
          if (lane.sign)
            (0, import_environment.updateWeatherSign)(lane.sign, phase, lane.announced, this.time, dt);
          if (lane.stormActive) lane.hasPassed = true;
        }
      }
    if (this.menu)
      this.panda.userData.head.rotation.z = this.save.reduced ? 0 : Math.sin(this.time * 0.75) * 0.03;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!running && !["dying", "dead"].includes(game.state)) continue;
      p.life -= dt;
      p.velocity.y -= dt * 5;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += dt * 3;
      p.mesh.scale.setScalar(0.13 * Math.max(0, p.life) * 1.7);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
    const target = this.menu ? new THREE.Vector3(
      innerWidth < 700 ? 1.8 : -4.4,
      0,
      innerWidth < 700 ? 0.5 : -2
    ) : new THREE.Vector3(
      game.x * CELL * 0.45,
      0,
      -(game.cameraRow ?? game.furthest) * CELL - 3
    );
    if (game.state === "intro") {
      this.introTime += dt;
      const u = Math.min(1, this.introTime / import_config.CONFIG.introDuration), ease = 1 - Math.pow(1 - u, 3);
      this.focus.lerpVectors(this.introFocus, target, ease);
      this.panda.rotation.y = -0.32 + (Math.PI + 0.32) * Math.min(1, u * 2);
      this.panda.position.set(
        1.3 * (1 - ease),
        Math.sin(u * Math.PI) * 1.15,
        -game.row * CELL - Math.sin(u * Math.PI) * 0.8
      );
      this.panda.scale.set(
        1.85 - 0.85 * ease,
        1.85 - 0.85 * ease + Math.sin(u * Math.PI) * 0.12,
        1.85 - 0.85 * ease
      );
      this.panda.userData.arms.forEach(
        (a, i) => a.rotation.x = Math.sin(u * Math.PI) * (i ? -0.7 : 0.7)
      );
      if (this.introSky) {
        this.scene.background.copy(this.introSky).lerp(new THREE.Color(this.night ? "#233c50" : "#dce7cc"), ease);
        this.scene.fog.color.copy(this.scene.background);
        this.ambient.intensity = 1.9 + (this.night ? -0.55 : 0) * ease;
      }
      if (this.introAmbient)
        this.ambient.color.copy(this.introAmbient).lerp(new THREE.Color(this.night ? "#b0d4ef" : "#fff8e7"), ease);
      if (this.introSun)
        this.sun.color.copy(this.introSun).lerp(new THREE.Color(this.night ? "#adcbff" : "#fff1d6"), ease);
      const aspect = innerWidth / innerHeight, size = (this.introSize || 17) * (1 - ease) + Math.max(17, 14.2 / aspect) * ease;
      Object.assign(this.camera, {
        left: -size * aspect / 2,
        right: size * aspect / 2,
        top: size / 2,
        bottom: -size / 2
      });
      this.camera.updateProjectionMatrix();
    } else if (running) this.focus.lerp(target, 1 - Math.exp(-dt * 5));
    this.camera.position.copy(this.focus).add(new THREE.Vector3(!this.menu && innerWidth < 700 ? 3.5 : 9, 14, 15));
    this.camera.lookAt(this.focus);
    if (this.shake > 0 && !this.save.reduced) {
      this.shake = Math.max(0, this.shake - dt * 3);
      this.camera.position.x += Math.sin(performance.now() * 0.12) * this.shake * 0.14;
      this.camera.position.y += Math.cos(performance.now() * 0.17) * this.shake * 0.1;
    }
    const sx = Math.round(this.focus.x * 32) / 32, sz = Math.round(this.focus.z * 32) / 32;
    this.sun.position.set(sx - 8, 17, sz + 8);
    this.sun.target.position.set(sx, 0, sz);
    this.moon.position.set(this.focus.x - 8, 10, this.focus.z - 14);
    const stormNearby = !this.menu && [...this.lanes.values()].some(
      (l) => l.stormActive && l.announced && Math.abs(l.index - game.row) <= 3
    );
    this.sun.intensity += ((this.night ? 0.8 : stormNearby ? 1.1 : 2.2) - this.sun.intensity) * Math.min(1, dt * 3);
    this.shadow.position.x = this.panda.position.x;
    this.shadow.position.z = this.panda.position.z;
    this.shadow.position.y = game.attachment?.platform.height + 0.015 || 0.016;
    this.shadow.scale.setScalar(this.menu ? 0.75 : 0.43);
    this.shadow.visible = game.state !== "dead";
    this.atmosphere.update(
      dt,
      game,
      this.focus,
      this.time,
      this.save.reduced,
      this.save.quality
    );
    (0, import_environment.updateEnvironment)(this.time, this.atmosphere.snowCover);
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, innerWidth, innerHeight);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setScissorTest(true);
    this.wardrobeScenes();
    this.renderer.setScissorTest(false);
  }
}

});
