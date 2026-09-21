const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
class Surface {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  emit(type, event = {}) {
    for (const cb of this.listeners.get(type) || [])
      cb({
        pointerId: 1,
        isPrimary: true,
        button: 0,
        preventDefault() {},
        ...event,
      });
  }
}
function fixture() {
  const board = new Surface(),
    window = new Surface(),
    document = new Surface();
  let capture = null,
    chain = [],
    commits = 0,
    allowed = true;
  board.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 300,
    bottom: 120,
  });
  board.children = Array.from({ length: 10 }, (_, id) => ({
    disabled: false,
    hidden: false,
    dataset: { id: String(id) },
    getBoundingClientRect: () => ({
      left: (id % 5) * 60,
      top: Math.floor(id / 5) * 60,
      right: (id % 5) * 60 + 54,
      bottom: Math.floor(id / 5) * 60 + 54,
    }),
  }));
  board.setPointerCapture = (id) => (capture = id);
  board.hasPointerCapture = (id) => capture === id;
  board.releasePointerCapture = (id) => {
    if (capture === id) {
      capture = null;
      board.emit("lostpointercapture", { pointerId: id });
    }
  };
  const context = vm.createContext({ window, document, structuredClone });
  for (const file of [
    "core/journey",
    "core/generator",
    "core/engine",
    "core/selection",
    "ui/input",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "../src", file + ".js"), "utf8"),
      context,
    );
  const selection = vm.runInContext("TenSelection", context),
    values = [2, 3, 5, 4, 1, 4, 1, 2, 3, 6];
  const visit = (id) => {
    chain = selection.extend(chain, id, values);
  };
  vm.runInContext(
    "createBoardInput",
    context,
  )({
    board,
    enabled: () => allowed,
    begin(id) {
      chain = [];
      visit(id);
    },
    visit,
    finish() {
      if (chain.reduce((a, id) => a + values[id], 0) === 10) commits++;
      chain = [];
    },
    cancel() {
      chain = [];
    },
    tap: visit,
  });
  return {
    board,
    window,
    document,
    get chain() {
      return [...chain];
    },
    get commits() {
      return commits;
    },
    get capture() {
      return capture;
    },
    disable() {
      allowed = false;
    },
  };
}
test("fast swipe samples intervening tiles and commits once on release", () => {
  const f = fixture();
  f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
  f.board.emit("pointermove", { clientX: 145, clientY: 25 });
  assert.deepEqual(f.chain, [0, 1, 2]);
  f.board.emit("pointerup", { clientX: 145, clientY: 25 });
  assert.equal(f.commits, 1);
  assert.deepEqual(f.chain, []);
  assert.equal(f.capture, null);
  f.board.emit("click", { detail: 1 });
  assert.equal(f.commits, 1);
});
test("incomplete release clears the path and the next gesture starts elsewhere", () => {
  const f = fixture();
  f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
  f.board.emit("pointerup", { clientX: 85, clientY: 25 });
  assert.deepEqual(f.chain, []);
  f.board.emit("pointerdown", { clientX: 205, clientY: 25 });
  assert.deepEqual(f.chain, [3]);
});
test("backtracking removes the tail without toggling the current tile off", () => {
  const f = fixture();
  f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
  f.board.emit("pointermove", { clientX: 145, clientY: 25 });
  f.board.emit("pointermove", { clientX: 85, clientY: 25 });
  assert.deepEqual(f.chain, [0, 1]);
  f.board.emit("pointermove", { clientX: 85, clientY: 25 });
  assert.deepEqual(f.chain, [0, 1]);
});
for (const event of ["pointercancel", "lostpointercapture"])
  test(`${event} always removes the live path`, () => {
    const f = fixture();
    f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
    f.board.emit(event);
    assert.deepEqual(f.chain, []);
    assert.equal(f.capture, null);
  });
test("release outside the board, blur and a second finger cannot leave stale selection", () => {
  const f = fixture();
  f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
  f.board.emit("pointerdown", {
    clientX: 205,
    clientY: 25,
    pointerId: 2,
    isPrimary: false,
  });
  assert.deepEqual(f.chain, [0]);
  f.board.emit("pointerup", { clientX: -40, clientY: -40 });
  assert.deepEqual(f.chain, []);
  f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
  f.window.emit("blur");
  assert.deepEqual(f.chain, []);
});
test("a disabled game cancels the gesture before any more selection", () => {
  const f = fixture();
  f.board.emit("pointerdown", { clientX: 25, clientY: 25 });
  f.disable();
  f.board.emit("pointermove", { clientX: 145, clientY: 25 });
  assert.deepEqual(f.chain, []);
  assert.equal(f.capture, null);
});
