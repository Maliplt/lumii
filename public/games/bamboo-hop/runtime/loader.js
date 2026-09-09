(function () {
  "use strict";
  const factories = new Map();
  const cache = new Map();
  function requireModule(name) {
    if (name === "three") return BambooVendor.three;
    if (name === "three/addons/geometries/RoundedBoxGeometry.js")
      return { RoundedBoxGeometry: BambooVendor.RoundedBoxGeometry };
    const id = name.replace(/^\.\//, "");
    if (cache.has(id)) return cache.get(id).exports;
    if (!factories.has(id)) throw Error("Modül bulunamadı " + id);
    const module = { exports: {} };
    cache.set(id, module);
    factories.get(id)(requireModule, module, module.exports);
    return module.exports;
  }
  window.BambooModules = Object.freeze({
    define(id, factory) { factories.set(id, factory); },
    start() { requireModule("main.js"); }
  });
})();
