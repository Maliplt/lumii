"use strict";
// builds a puzzle from a picture
(function (K) {
  const G = K.Geo;

  // adds up to `count` points inside the outline
  function scatter(rng, poly, taken, count, spacing, floor) {
    const pts = [];
    for (let gap = spacing; gap >= floor && pts.length < count; gap *= 0.88) {
      for (let tries = 0; pts.length < count && tries < 500; tries++) {
        const p = { x: (rng.next() * 2 - 1) * 0.66, y: (rng.next() * 2 - 1) * 0.66 };
        if (!G.inPolygon(p, poly)) continue;
        if (G.edgeDistance(p, poly) < gap * 0.55) continue;
        if (taken.some((q) => G.dist(p, q) < gap) || pts.some((q) => G.dist(p, q) < gap)) continue;
        pts.push(p);
      }
    }
    return pts;
  }

  function connected(n, edges, skip = -1) {
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e, i) => {
      if (i === skip) return;
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    });
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) for (const next of adj[stack.pop()]) if (!seen.has(next)) seen.add(next) && stack.push(next);
    return seen.size === n;
  }

  // beads and strings laid out as the picture
  function sketch(rng, poly, n) {
    const r = G.beadRadius(n);
    const gap = r * 2.5;
    const offset = rng.next();
    // thin pictures cannot take many beads inside, so the outline gets more
    let home = null;
    let outer = 0;
    for (let rim = Math.max(3, Math.round(n * (n <= 7 ? 0.75 : 0.5))); rim <= n && !home; rim++) {
      const pts = [];
      for (const p of G.resample(poly, rim, offset)) if (pts.every((q) => G.dist(p, q) > gap)) pts.push(p);
      if (pts.length < 3 || pts.length < rim - 2) break;
      const kept = pts.length;
      pts.push(...scatter(rng, poly, pts, n - kept, Math.max(gap, Math.sqrt(G.area(poly) / n) * 1.05), gap));
      if (pts.length === n) {
        home = pts;
        outer = kept;
      }
    }
    if (!home) return null;

    const tris = G.delaunay(home).filter((t) => {
      const [a, b, c] = t.map((i) => home[i]);
      const mid = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
      return G.inPolygon(mid, poly) && G.minAngle(a, b, c) > 7;
    });
    const seen = new Map();
    for (const [a, b, c] of tris) {
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        const key = u < v ? `${u},${v}` : `${v},${u}`;
        if (!seen.has(key)) seen.set(key, { a: Math.min(u, v), b: Math.max(u, v), rim: false });
      }
    }
    for (let i = 0; i < outer; i++) {
      const u = i;
      const v = (i + 1) % outer;
      const key = u < v ? `${u},${v}` : `${v},${u}`;
      if (seen.has(key)) seen.get(key).rim = true;
    }
    const edges = [...seen.values()].filter((e) => {
      for (let k = 0; k < home.length; k++) if (k !== e.a && k !== e.b && G.pointSegment(home[k], home[e.a], home[e.b]) < r * 1.3) return false;
      return true;
    });
    if (edges.length < n - 1 || !connected(home.length, edges)) return null;
    return { home, edges };
  }

  // drops inner strings until `keep` of them are left
  function thin(rng, n, edges, keep) {
    const target = Math.max(n, Math.round(edges.length * keep));
    const deg = new Array(n).fill(0);
    for (const e of edges) {
      deg[e.a]++;
      deg[e.b]++;
    }
    const order = rng.shuffle(edges.map((_, i) => i)).sort((i, j) => Number(edges[i].rim) - Number(edges[j].rim));
    const list = edges.slice();
    for (const index of order) {
      if (list.length <= target) break;
      const e = edges[index];
      const at = list.indexOf(e);
      if (deg[e.a] <= 2 || deg[e.b] <= 2) continue;
      if (!connected(n, list, at)) continue;
      list.splice(at, 1);
      deg[e.a]--;
      deg[e.b]--;
    }
    return list;
  }

  // splits strings into `count` colours as neighbouring patches
  function paint(rng, n, edges, count) {
    if (count <= 1) return;
    const adj = Array.from({ length: n }, () => []);
    for (const e of edges) {
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
    const owner = new Array(n).fill(-1);
    const queue = [];
    rng.shuffle([...Array(n).keys()])
      .slice(0, count)
      .forEach((seed, c) => {
        owner[seed] = c;
        queue.push(seed);
      });
    while (queue.length) {
      const at = queue.splice(Math.floor(rng.next() * Math.min(queue.length, 3)), 1)[0];
      for (const next of adj[at]) {
        if (owner[next] === -1) {
          owner[next] = owner[at];
          queue.push(next);
        }
      }
    }
    for (const e of edges) e.color = owner[e.a] === owner[e.b] ? owner[e.a] : rng.chance(0.5) ? owner[e.a] : owner[e.b];
    const used = new Set(edges.map((e) => e.color));
    if (used.size < count) edges.forEach((e, i) => (e.color = i % count));
  }

  // a shuffled ring of beads; pinned beads stay home
  function ring(rng, home, pins) {
    const free = home.map((_, i) => i).filter((i) => !pins.has(i));
    const order = rng.shuffle(free.slice());
    const turn = rng.next() * Math.PI * 2;
    const start = home.map((p) => ({ x: p.x, y: p.y }));
    order.forEach((node, k) => {
      const a = turn + (k / order.length) * Math.PI * 2;
      start[node] = { x: Math.cos(a) * 0.78, y: Math.sin(a) * 0.78 };
    });
    return start;
  }

  // the picture spread a little wider
  function scramble(rng, home, pins, amount) {
    const spread = home.map((p) => ({ x: p.x * 1.15, y: p.y * 1.15 }));
    const free = home.map((_, i) => i).filter((i) => !pins.has(i));
    const count = Math.min(free.length, Math.max(2, Math.round(free.length * amount)));
    const moving = rng.shuffle(free.slice()).slice(0, count);
    const spots = moving.map((i) => spread[i]);
    // rotate the spots by a random offset so every chosen bead really moves
    const turn = 1 + Math.floor(rng.next() * (count - 1));
    const start = home.map((p, i) => (pins.has(i) ? { ...p } : { ...spread[i] }));
    moving.forEach((node, k) => {
      const spot = spots[(k + turn) % count];
      start[node] = { x: spot.x + (rng.next() - 0.5) * 0.06, y: spot.y + (rng.next() - 0.5) * 0.06 };
    });
    for (const p of start) {
      p.x = Math.max(-0.88, Math.min(0.88, p.x));
      p.y = Math.max(-0.88, Math.min(0.88, p.y));
    }
    return start;
  }

  // spec: { seed
  function build(spec) {
    const motif = typeof spec.motif === "string" ? K.Motifs.byId(spec.motif) : spec.motif;
    for (let attempt = 0; attempt < 80; attempt++) {
      const rng = new K.Random(`${spec.seed}#${attempt}`);
      const poly = K.Motifs.outline(motif, attempt < 40 ? 0.72 : 0.78);
      const base = sketch(rng, poly, spec.nodes);
      if (!base) continue;
      const { home } = base;
      const n = home.length;
      const edges = thin(rng, n, base.edges, spec.keep ?? 0.75).map((e) => ({ a: e.a, b: e.b, rim: e.rim, color: 0 }));
      paint(rng, n, edges, spec.colors || 1);

      if (spec.bands) {
        const lengths = edges.map((e) => G.dist(home[e.a], home[e.b]));
        const order = rng.shuffle(edges.map((_, i) => i)).sort((i, j) => lengths[i] - lengths[j]);
        const pick = order.slice(0, Math.max(1, Math.round(edges.length * spec.bands)));
        const touched = new Set();
        for (const i of pick) {
          const e = edges[i];
          if (touched.has(e.a) && touched.has(e.b)) continue;
          touched.add(e.a).add(e.b);
          e.max = lengths[i] * 1.55 + 0.05;
        }
      }

      const pins = new Set();
      if (spec.pins) {
        const want = Math.max(1, Math.round(n * spec.pins));
        const candidates = rng.shuffle([...Array(n).keys()]);
        for (const c of candidates) {
          if (pins.size >= want) break;
          if ([...pins].every((p) => G.dist(home[p], home[c]) > 0.34)) pins.add(c);
        }
      }

      const puzzle = { motif: motif.id, color: motif.color, outline: poly, edges, nodes: [] };
      if (G.judge(puzzle, home).total) continue;

      let start = null;
      let best = -1;
      const need = spec.minTangle ?? Math.max(1, Math.floor(n / 3));
      for (let t = 0; t < 40; t++) {
        const candidate = spec.layout === "ring" ? ring(rng, home, pins) : scramble(rng, home, pins, Math.min(1, (spec.shuffle ?? 1) + t * 0.03));
        const tangle = G.judge(puzzle, candidate).total;
        if (tangle >= need && (spec.maxTangle == null || tangle <= spec.maxTangle)) {
          start = candidate;
          break;
        }
        if (tangle > best && (spec.maxTangle == null || tangle <= spec.maxTangle)) {
          best = tangle;
          start = tangle > 0 ? candidate : start;
        }
      }
      if (!start) continue;
      puzzle.nodes = home.map((p, i) => ({ home: p, start: start[i], pin: pins.has(i) }));
      return puzzle;
    }
    // a picture too slim for this many beads hands over to a roomier one
    if (motif.id !== "shield") return build({ ...spec, motif: "shield" });
    throw new Error(`No puzzle for ${spec.seed}`);
  }

  K.Generator = { build };
})(window.Knotwise);
