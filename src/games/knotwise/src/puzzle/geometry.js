"use strict";
// plane geometry for strings and beads
(function (K) {
  const EPS = 1e-9;

  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function onSegment(p, a, b) {
    return Math.min(a.x, b.x) - EPS <= p.x && p.x <= Math.max(a.x, b.x) + EPS && Math.min(a.y, b.y) - EPS <= p.y && p.y <= Math.max(a.y, b.y) + EPS;
  }

  // true when segments ab and cd touch or cross
  function segmentsMeet(a, b, c, d) {
    const d1 = cross(c, d, a);
    const d2 = cross(c, d, b);
    const d3 = cross(a, b, c);
    const d4 = cross(a, b, d);
    if (((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))) return true;
    if (Math.abs(d1) <= EPS && onSegment(a, c, d)) return true;
    if (Math.abs(d2) <= EPS && onSegment(b, c, d)) return true;
    if (Math.abs(d3) <= EPS && onSegment(c, a, b)) return true;
    if (Math.abs(d4) <= EPS && onSegment(d, a, b)) return true;
    return false;
  }

  function meetPoint(a, b, c, d) {
    const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (Math.abs(den) < EPS) return { x: (a.x + b.x + c.x + d.x) / 4, y: (a.y + b.y + c.y + d.y) / 4 };
    const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den;
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  }

  function pointSegment(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    const t = len < EPS ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  function inPolygon(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  function area(poly) {
    let sum = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) sum += poly[j].x * poly[i].y - poly[i].x * poly[j].y;
    return Math.abs(sum) / 2;
  }

  function perimeter(poly) {
    let sum = 0;
    for (let i = 0; i < poly.length; i++) sum += dist(poly[i], poly[(i + 1) % poly.length]);
    return sum;
  }

  function edgeDistance(p, poly) {
    let best = Infinity;
    for (let i = 0; i < poly.length; i++) best = Math.min(best, pointSegment(p, poly[i], poly[(i + 1) % poly.length]));
    return best;
  }

  // `count` points spaced evenly along the outline, starting at `offset` (0..1)
  function resample(poly, count, offset = 0) {
    const total = perimeter(poly);
    const out = [];
    let seg = 0;
    let walked = 0;
    for (let k = 0; k < count; k++) {
      const target = (((k + offset) / count) % 1) * total;
      if (target < walked) {
        seg = 0;
        walked = 0;
      }
      for (;;) {
        const a = poly[seg % poly.length];
        const b = poly[(seg + 1) % poly.length];
        const len = dist(a, b);
        if (walked + len >= target || seg > poly.length * 2) {
          const t = len < EPS ? 0 : (target - walked) / len;
          out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
          break;
        }
        walked += len;
        seg++;
      }
    }
    return out;
  }

  // Bowyer–Watson triangulation; returns index triples
  function delaunay(points) {
    const pts = points.map((p) => ({ x: p.x, y: p.y }));
    const n = pts.length;
    pts.push({ x: -100, y: -100 }, { x: 100, y: -100 }, { x: 0, y: 100 });
    const circum = (t) => {
      const [a, b, c] = t.map((i) => pts[i]);
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      const a2 = a.x * a.x + a.y * a.y;
      const b2 = b.x * b.x + b.y * b.y;
      const c2 = c.x * c.x + c.y * c.y;
      const x = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
      const y = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
      return { x, y, r: (x - a.x) ** 2 + (y - a.y) ** 2 };
    };
    let tris = [[n, n + 1, n + 2]].map((t) => ({ t, c: circum(t) }));
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const bad = [];
      const keep = [];
      for (const tri of tris) ((p.x - tri.c.x) ** 2 + (p.y - tri.c.y) ** 2 < tri.c.r ? bad : keep).push(tri);
      const edges = new Map();
      for (const { t } of bad) {
        for (const [u, v] of [
          [t[0], t[1]],
          [t[1], t[2]],
          [t[2], t[0]],
        ]) {
          const key = u < v ? `${u},${v}` : `${v},${u}`;
          edges.set(key, edges.has(key) ? null : [u, v]);
        }
      }
      tris = keep;
      for (const edge of edges.values()) if (edge) tris.push({ t: [edge[0], edge[1], i], c: circum([edge[0], edge[1], i]) });
    }
    return tris.map(({ t }) => t).filter((t) => t.every((i) => i < n));
  }

  // smallest inner angle of a triangle, in degrees
  function minAngle(a, b, c) {
    const ang = (p, q, r) => {
      const v1 = { x: q.x - p.x, y: q.y - p.y };
      const v2 = { x: r.x - p.x, y: r.y - p.y };
      const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1);
      return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    };
    return Math.min(ang(a, b, c), ang(b, c, a), ang(c, a, b));
  }

  // size of a bead for a puzzle with `n` of them, in board units
  const beadRadius = (n) => Math.max(0.047, Math.min(0.085, 0.1 - n * 0.0018));

  // everything wrong with a layout
  function judge(puzzle, pos) {
    const { edges } = puzzle;
    const r = beadRadius(pos.length);
    const crossings = [];
    const touches = [];
    const stretched = [];
    const bad = new Set();
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      for (let j = i + 1; j < edges.length; j++) {
        const f = edges[j];
        if ((e.color || 0) !== (f.color || 0)) continue;
        if (e.a === f.a || e.a === f.b || e.b === f.a || e.b === f.b) continue;
        if (segmentsMeet(pos[e.a], pos[e.b], pos[f.a], pos[f.b])) {
          crossings.push({ i, j, ...meetPoint(pos[e.a], pos[e.b], pos[f.a], pos[f.b]) });
          bad.add(i).add(j);
        }
      }
      for (let k = 0; k < pos.length; k++) {
        if (k === e.a || k === e.b) continue;
        if (pointSegment(pos[k], pos[e.a], pos[e.b]) < r * 0.85) {
          touches.push({ node: k, edge: i });
          bad.add(i);
        }
      }
      if (e.max && dist(pos[e.a], pos[e.b]) > e.max) {
        stretched.push(i);
        bad.add(i);
      }
    }
    const stacked = [];
    for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) if (dist(pos[a], pos[b]) < r * 1.7) stacked.push([a, b]);
    return { crossings, touches, stretched, stacked, bad, total: crossings.length + touches.length + stretched.length + stacked.length };
  }

  K.Geo = { cross, dist, segmentsMeet, meetPoint, pointSegment, inPolygon, area, perimeter, edgeDistance, resample, delaunay, minAngle, beadRadius, judge };
})(window.Knotwise);
