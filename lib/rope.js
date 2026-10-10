(function () {
  'use strict';
  const F = FILM, { clamp } = F;
  const R = (F.rope = {});

  R.run = o => {
    const rate = o.rate ?? 30, dt = o.dt ?? 1 / 240, iters = o.iters ?? 8, g = o.g ?? 1300, air = o.air ?? .001, bendK = o.bend ?? 1.5;
    const ropes = o.ropes.map(rp => {
      const p = rp.pts.map(q => [q[0], q[1]]), seg = [];
      for (let i = 1; i < p.length; i++) seg.push(Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
      return { p, prev: p.map(q => [q[0], q[1]]), r: rp.r ?? 4, seg, pins: rp.pins || [] };
    });
    const t0 = o.t0, steps = Math.round((o.t1 - t0) / dt), perFrame = Math.max(1, Math.round(1 / (rate * dt))), gdt = g * dt * dt;
    const frames = [];
    const snap = t => frames.push({ t, ropes: ropes.map(rp => rp.p.map(q => [q[0], q[1]])) });
    const pushOut = (q, c, r) => {
      const ax = c.a[0], ay = c.a[1], dx = c.b[0] - ax, dy = c.b[1] - ay, L2 = dx * dx + dy * dy || 1e-9;
      const u = clamp(((q[0] - ax) * dx + (q[1] - ay) * dy) / L2), cx = ax + dx * u, cy = ay + dy * u;
      let nx = q[0] - cx, ny = q[1] - cy, d = Math.hypot(nx, ny); const min = r + c.r;
      if (d >= min) return null;
      if (d < 1e-6) { nx = -dy; ny = dx; d = Math.hypot(nx, ny) || 1; }
      nx /= d; ny /= d; q[0] = cx + nx * min; q[1] = cy + ny * min;
      return [nx, ny];
    };
    const drag = (q, prev, vx, vy, fr, hold) => {
      const dx = q[0] - prev[0] - vx, dy = q[1] - prev[1] - vy, k = hold ? 0 : 1 - fr;
      prev[0] = q[0] - vx - dx * k; prev[1] = q[1] - vy - dy * k;
    };
    for (let s = 0; s <= steps; s++) {
      const t = t0 + s * dt;
      if (s % perFrame === 0) snap(t);
      if (s === steps) break;
      const W = o.world(t), caps = W.capsules || [], planes = W.planes || [];
      for (const rp of ropes) for (let i = 0; i < rp.p.length; i++) {
        const q = rp.p[i], pv = rp.prev[i], nx = q[0] + (q[0] - pv[0]) * (1 - air), ny = q[1] + (q[1] - pv[1]) * (1 - air) + gdt;
        pv[0] = q[0]; pv[1] = q[1]; q[0] = nx; q[1] = ny;
      }
      const pinned = ropes.map(rp => rp.pins.map(pn => [pn.i, pn.at(t + dt)]).filter(e => e[1]));
      const holdPins = () => ropes.forEach((rp, k) => { for (const [i, at] of pinned[k]) { rp.p[i][0] = at[0]; rp.p[i][1] = at[1]; } });
      holdPins();
      for (let it = 0; it < iters; it++) {
        for (const rp of ropes) {
          const p = rp.p, n = p.length;
          for (let i = 1; i < n; i++) {
            const a = p[i - 1], b = p[i], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-9, e = (d - rp.seg[i - 1]) / d * .5;
            a[0] += dx * e; a[1] += dy * e; b[0] -= dx * e; b[1] -= dy * e;
          }
          for (let i = 2; i < n; i++) {
            const a = p[i - 2], b = p[i], min = bendK * (rp.seg[i - 2] + rp.seg[i - 1]) * .5, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-9;
            if (d < min) { const e = (d - min) / d * .5; a[0] += dx * e; a[1] += dy * e; b[0] -= dx * e; b[1] -= dy * e; }
          }
          for (let i = 0; i < n; i++) {
            const q = p[i], pv = rp.prev[i];
            for (const c of caps) {
              if (!pushOut(q, c, rp.r)) continue;
              let vx = 0, vy = 0; if (c.move) { const m = c.move(q); vx = m[0] - q[0]; vy = m[1] - q[1]; }
              drag(q, pv, vx, vy, c.fr ?? .3, !!c.hold);
            }
            for (const pl of planes) {
              if (pl.x0 != null && q[0] < pl.x0) continue; if (pl.x1 != null && q[0] > pl.x1) continue;
              if (q[1] > pl.y - rp.r && q[1] < pl.y + (pl.depth ?? rp.r * 2)) { q[1] = pl.y - rp.r; pv[1] = q[1]; pv[0] = q[0] - (q[0] - pv[0]) * (1 - (pl.fr ?? .4)); }
            }
          }
        }
        holdPins();
        for (let A = 0; A < ropes.length; A++) for (let B = o.self === false ? A + 1 : A; B < ropes.length; B++) {
          const pa = ropes[A].p, pb = ropes[B].p, min = ropes[A].r + ropes[B].r, same = A === B;
          for (let i = 0; i < pa.length; i++) for (let j = same ? i + 3 : 0; j < pb.length; j++) {
            const a = pa[i], b = pb[j], dx = b[0] - a[0], dy = b[1] - a[1];
            if (Math.abs(dx) >= min || Math.abs(dy) >= min) continue;
            const d = Math.hypot(dx, dy) || 1e-9; if (d >= min) continue;
            const e = (d - min) / d * .5; a[0] += dx * e; a[1] += dy * e; b[0] -= dx * e; b[1] -= dy * e;
            const qa = ropes[A].prev[i], qb = ropes[B].prev[j], mvx = ((a[0] - qa[0]) + (b[0] - qb[0])) * .5, mvy = ((a[1] - qa[1]) + (b[1] - qb[1])) * .5;
            qa[0] = a[0] - (mvx + (a[0] - qa[0] - mvx) * .5); qa[1] = a[1] - (mvy + (a[1] - qa[1] - mvy) * .5);
            qb[0] = b[0] - (mvx + (b[0] - qb[0] - mvx) * .5); qb[1] = b[1] - (mvy + (b[1] - qb[1] - mvy) * .5);
          }
        }
        holdPins();
      }
    }
    const index = t => clamp(Math.round((t - t0) * rate), 0, frames.length - 1);
    return { frames, rate, t0, index, at: t => frames[index(t)].ropes };
  };

  R.smooth = (pts, n = 40) => {
    const m = pts.length, out = [];
    const P = i => pts[clamp(i, 0, m - 1)];
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) * (m - 1), i = Math.min(m - 2, Math.floor(u)), f = u - i, p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), f2 = f * f, f3 = f2 * f;
      out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * f + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * f2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * f3)));
    }
    return out;
  };
})();
