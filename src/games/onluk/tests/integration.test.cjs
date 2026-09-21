const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
test("entry point and manifest agree; every script parses and every local asset exists", () => {
  const manifest = JSON.parse(read("game.json")),
    html = read("index.html");
  assert.deepEqual(
    [...html.matchAll(/<script defer src="([^"]+)"/g)].map((m) => m[1]),
    manifest.scripts,
  );
  assert.deepEqual(
    [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(
      (m) => m[1],
    ),
    manifest.styles,
  );
  for (const file of manifest.scripts)
    new vm.Script(read(file), { filename: file });
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const file of ["src/ui/controller.js", "src/ui/journey-view.js"])
    for (const match of read(file).matchAll(/\$\("([^"]+)"\)/g))
      assert.ok(ids.includes(match[1]), `${file}: ${match[1]}`);
  const postcss = require("../../tools/node_modules/postcss");
  for (const file of manifest.styles) {
    const css = read(file);
    postcss.parse(css, { from: file });
    for (const match of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g))
      assert.ok(
        fs.existsSync(path.resolve(root, path.dirname(file), match[1])),
        match[1],
      );
  }
});
test("progress, stars, settings, and new rules survive a save round-trip", () => {
  let saved = null;
  const storage = {
    getItem: () => saved,
    setItem: (_, value) => (saved = value),
  };
  function boot() {
    const c = vm.createContext({ structuredClone, GameSave: { storage } });
    for (const file of [
      "src/core/journey.js",
      "src/core/generator.js",
      "src/core/engine.js",
      "src/services/storage.js",
    ])
      vm.runInContext(read(file), c);
    return c;
  }
  let context = boot();
  vm.runInContext(
    "TenStorage.data.session=TenEngine.create(12,43);TenStorage.data.stars[8]=3;TenStorage.data.level=43;TenStorage.data.settings.muted=true;TenStorage.save()",
    context,
  );
  context = boot();
  assert.equal(
    vm.runInContext("TenStorage.data.session.rules.gravity", context),
    "up",
  );
  assert.equal(vm.runInContext("TenStorage.data.stars[8]", context), 3);
  assert.equal(
    vm.runInContext("TenStorage.data.settings.muted", context),
    true,
  );
  saved = "{broken";
  context = boot();
  assert.equal(vm.runInContext("TenStorage.data.level", context), 1);
});
