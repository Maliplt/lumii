BambooModules.define("static-batches.js", function(require, module, exports) {
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
var static_batches_exports = {};
__export(static_batches_exports, {
  batchScenery: () => batchScenery
});
module.exports = __toCommonJS(static_batches_exports);
var THREE = __toESM(require("three"));
function batchScenery(lane) {
  const moving = /* @__PURE__ */ new Set([
    lane.storm,
    lane.sign?.root,
    ...lane.movers.map((item) => item.mesh),
    ...lane.coins.flatMap((item) => [item.mesh, item.shadow, item.glow]),
    ...lane.birds.map((item) => item.root),
    ...lane.butterflies.map((item) => item.root),
    ...lane.foam.map((item) => item.mesh),
    ...lane.fireflies.map((item) => item.mesh)
  ]);
  const groups = /* @__PURE__ */ new Map();
  lane.root.updateMatrixWorld(true);
  const inverse = lane.root.matrixWorld.clone().invert();
  lane.root.traverse((mesh) => {
    if (!mesh.isMesh || mesh.isInstancedMesh || mesh.material.transparent || mesh.userData.nightOnly || mesh.userData.ownedGeometry || mesh.userData.ownedMaterial)
      return;
    for (let node = mesh; node && node !== lane.root; node = node.parent)
      if (moving.has(node)) return;
    const key = [
      mesh.geometry.uuid,
      mesh.material.uuid,
      mesh.castShadow,
      mesh.receiveShadow
    ].join(":");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mesh);
  });
  for (const meshes of groups.values()) {
    if (meshes.length < 3) continue;
    const first = meshes[0];
    const batch = new THREE.InstancedMesh(
      first.geometry,
      first.material,
      meshes.length
    );
    batch.castShadow = first.castShadow;
    batch.receiveShadow = first.receiveShadow;
    meshes.forEach((mesh, i) => {
      batch.setMatrixAt(
        i,
        new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld)
      );
      mesh.removeFromParent();
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    lane.root.add(batch);
  }
}

});
