(function () {
  'use strict';
  const F = FILM;
  const S3 = (F.stage3d = {});
  S3.FIG = .0196;
  const PARSED = new Map();
  const parse0 = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const parse = c => { let v = PARSED.get(c); if (!v) { if (PARSED.size > 4096) PARSED.clear(); v = parse0(c); PARSED.set(c, v); } return v; };
  const hx = v => '#' + v.map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
  S3.mix = (a, b, k) => { const A = parse(a), B = parse(b); return hx(A.map((v, i) => v + (B[i] - v) * k)); };
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  S3.LIGHT = norm([-.5, .85, .45]);

  S3.camera = o => {
    const [px, py, pz] = o.pos, yaw = o.yaw || 0, pitch = o.pitch || 0, f = o.f, W = o.W, H = o.H;
    const cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, near = o.near ?? .05, sy = Math.sin(yaw), cyw = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const sh = o.shift || null;
    const toCam = p => {
      const dx = p[0] - px, dy = p[1] - py, dz = p[2] - pz;
      const xr = dx * cyw - dz * sy, zf = dx * sy + dz * cyw;
      return [xr, dy * cp - zf * sp, dy * sp + zf * cp];
    };
    const onScreen = c => { const k = f / c[2]; return [cx + c[0] * k - (sh ? sh[0] : 0), cy - c[1] * k - (sh ? sh[1] : 0), c[2], k]; };
    return {
      pos: o.pos, yaw, pitch, f, W, H, cx, cy, near, toCam, onScreen,
      fwd: [sy * cp, sp, cyw * cp],
      proj: p => { const c = toCam(p); return c[2] < near ? null : onScreen(c); },
      depth: p => toCam(p)[2],
      yawOf: facing => -(facing + yaw) + 0,
    };
  };
  S3.clip = (cam, pts) => {
    const C = pts.map(cam.toCam), out = [], n = C.length, z0 = cam.near;
    for (let i = 0; i < n; i++) {
      const a = C[i], b = C[(i + 1) % n], ina = a[2] >= z0, inb = b[2] >= z0;
      if (ina) out.push(a);
      if (ina !== inb) { const u = (z0 - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, z0]); }
    }
    return out.map(cam.onScreen);
  };
  S3.poly = (x, cam, pts) => {
    const s = S3.clip(cam, pts); if (s.length < 3) return false;
    x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); return true;
  };
  S3.facing = (cam, p, n) => (cam.pos[0] - p[0]) * n[0] + (cam.pos[1] - p[1]) * n[1] + (cam.pos[2] - p[2]) * n[2] > 0;
  S3.shade = (col, n, light = S3.LIGHT, o = {}) => {
    const d = Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]), lo = o.lo ?? .42, ink = o.ink || '#1e1a17';
    const b = lo + (1 - lo) * d;
    return b >= 1 ? col : S3.mix(col, ink, (1 - b) * (o.dark ?? .62));
  };
  S3.face = (x, cam, pts, col, n) => {
    if (n && !S3.facing(cam, pts[0], n)) return false;
    if (!S3.poly(x, cam, pts)) return false;
    x.fillStyle = col; x.fill(); return true;
  };
  S3.box = (x, cam, b, o = {}) => {
    const { x0, x1, y0, y1, z0, z1 } = b, col = o.col || '#c9b48c', sh = n => S3.shade(col, n, o.light, o);
    const faces = [
      [[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], o.top],
      [[[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], [0, -1, 0], o.bottom],
      [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], o.north],
      [[[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1], o.south],
      [[[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0], o.west],
      [[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], o.east],
    ];
    for (const [pts, n, c] of faces) { if (o.skip && o.skip.includes(n.join())) continue; S3.face(x, cam, pts, c || sh(n), n); }
  };
  S3.prism = (x, cam, ring, y0, y1, o = {}) => {
    const col = o.col || '#c9b48c', n = ring.length;
    let area = 0; for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const sg = area > 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const nn = [sg * dz / l, 0, -sg * dx / l];
      S3.face(x, cam, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], o.side || S3.shade(col, nn, o.light, o), nn);
    }
    S3.face(x, cam, ring.map(p => [p[0], y1, p[1]]), o.top || S3.shade(col, [0, 1, 0], o.light, o), [0, 1, 0]);
    if (cam.pos[1] < y0) S3.face(x, cam, ring.map(p => [p[0], y0, p[1]]), o.bottom || S3.shade(col, [0, -1, 0], o.light, o), [0, -1, 0]);
  };
  S3.cyl = (x, cam, c, r, y0, y1, o = {}) => {
    const col = o.col || '#3b2a26', N = o.n || 20, pts = [];
    const dx = cam.pos[0] - c[0], dz = cam.pos[2] - c[1], d = Math.hypot(dx, dz) || 1, a0 = Math.atan2(dz, dx);
    const half = Math.acos(Math.min(1, r / d));
    const ring = []; for (let i = 0; i <= N; i++) { const a = a0 - half + 2 * half * i / N; ring.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), a]); }
    for (let i = 0; i < N; i++) {
      const p = ring[i], q = ring[i + 1], am = (p[2] + q[2]) / 2, n = [Math.cos(am), 0, Math.sin(am)];
      if (!S3.poly(x, cam, [[p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]])) continue;
      x.fillStyle = S3.shade(col, n, o.light, o); x.fill();
      if (o.seams !== false) { x.strokeStyle = x.fillStyle; x.lineWidth = 1; x.stroke(); }
    }
    if (o.cap !== false && cam.pos[1] > y1) {
      const top = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; top.push([c[0] + r * Math.cos(a), y1, c[1] + r * Math.sin(a)]); }
      if (S3.poly(x, cam, top)) { x.fillStyle = o.top || S3.shade(col, [0, 1, 0], o.light, o); x.fill(); }
    }
    return pts;
  };
  S3.bar = (x, cam, a, b, r, o = {}) => {
    const col = o.col || '#c9b48c', N = o.n || 10, d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) || 1, u = d.map(v => v / L);
    const ref = Math.abs(u[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    const cr = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const e1 = norm(cr(u, ref)), e2 = cr(u, e1), ring = c => { const R = []; for (let i = 0; i < N; i++) { const t = (i + .5) / N * Math.PI * 2 + (o.phase || 0); R.push([c[0] + r * (Math.cos(t) * e1[0] + Math.sin(t) * e2[0]), c[1] + r * (Math.cos(t) * e1[1] + Math.sin(t) * e2[1]), c[2] + r * (Math.cos(t) * e1[2] + Math.sin(t) * e2[2])]); } return R; };
    const A = ring(a), B = ring(b);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, t = (i + 1) / N * Math.PI * 2 + (o.phase || 0), n = [Math.cos(t) * e1[0] + Math.sin(t) * e2[0], Math.cos(t) * e1[1] + Math.sin(t) * e2[1], Math.cos(t) * e1[2] + Math.sin(t) * e2[2]];
      if (!S3.facing(cam, A[i], n) && !S3.facing(cam, A[j], n)) continue;
      if (S3.poly(x, cam, [A[i], A[j], B[j], B[i]])) { x.fillStyle = S3.shade(col, n, o.light, o); x.fill(); if (o.seams !== false) { x.strokeStyle = x.fillStyle; x.lineWidth = .8; x.stroke(); } }
    }
    for (const [R, n] of [[A, u.map(v => -v)], [B, u]]) if (S3.facing(cam, R[0], n) && S3.poly(x, cam, R)) { x.fillStyle = o.cap || S3.shade(col, n, o.light, o); x.fill(); }
  };
  S3.disc = (x, cam, c, n, r, N = 20) => {
    const ref = Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0], cr = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const e1 = norm(cr(n, ref)), e2 = cr(n, e1), pts = [];
    for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; pts.push([c[0] + r * (Math.cos(t) * e1[0] + Math.sin(t) * e2[0]), c[1] + r * (Math.cos(t) * e1[1] + Math.sin(t) * e2[1]), c[2] + r * (Math.cos(t) * e1[2] + Math.sin(t) * e2[2])]); }
    return S3.poly(x, cam, pts);
  };
  S3.ring = (x, cam, c, r, y0, y1, col) => S3.cyl(x, cam, c, r, y0, y1, { col, cap: false, lo: .55 });
  S3.line = (x, cam, a, b) => {
    const A = cam.toCam(a), B = cam.toCam(b), z0 = cam.near;
    if (A[2] < z0 && B[2] < z0) return false;
    const cut = (p, q) => { const u = (z0 - p[2]) / (q[2] - p[2]); return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, z0]; };
    const a2 = A[2] < z0 ? cut(A, B) : A, b2 = B[2] < z0 ? cut(B, A) : B, sa = cam.onScreen(a2), sb = cam.onScreen(b2);
    x.moveTo(sa[0], sa[1]); x.lineTo(sb[0], sb[1]); return true;
  };
  S3.calm = (keyAt, D, sig = .18) => {
    const Z = [-2, -1.5, -1, -.5, 0, .5, 1, 1.5, 2], Wt = Z.map(z => Math.exp(-z * z / 2)), sw = Wt.reduce((a, b) => a + b, 0);
    return t => {
      const w = Math.min(sig, t / 2.2, (D - t) / 2.2);
      if (!(w > 1e-4)) return keyAt(t);
      const e = [0, 0, 0], g = [0, 0, 0]; let lf = 0;
      for (let i = 0; i < Z.length; i++) { const k = keyAt(t + Z[i] * w), a = Wt[i] / sw; for (let j = 0; j < 3; j++) { e[j] += a * k.e[j]; g[j] += a * k.g[j]; } lf += a * Math.log(k.f); }
      return { e, g, f: Math.exp(lf) };
    };
  };
  S3.figureAt = (cam, p, facing = 0) => {
    const s = cam.proj(p); if (!s) return null;
    return { sx: s[0], sy: s[1], s: s[3] * S3.FIG, depth: s[2], yaw: cam.yawOf(facing) };
  };
  S3.onPlane = (x, cam, o, u, v, fn) => {
    const A = cam.proj(o), B = cam.proj([o[0] + u[0], o[1] + u[1], o[2] + u[2]]), C = cam.proj([o[0] + v[0], o[1] + v[1], o[2] + v[2]]);
    if (!A || !B || !C) return false;
    x.save(); x.transform(B[0] - A[0], B[1] - A[1], C[0] - A[0], C[1] - A[1], A[0], A[1]); fn(x); x.restore(); return true;
  };
  S3.shadow = (x, cam, c, rx, rz, a = .3, y = 0, col = '20,16,12') => {
    const pts = []; for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; pts.push([c[0] + rx * Math.cos(t), y + .002, c[1] + rz * Math.sin(t)]); }
    const P = cam.proj([c[0], y, c[1]]); if (!P) return;
    const s = S3.clip(cam, pts); if (s.length < 3) return;
    let r = 0; for (const q of s) r = Math.max(r, Math.hypot(q[0] - P[0], q[1] - P[1]));
    x.save(); x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.clip();
    const g = x.createRadialGradient(P[0], P[1], 0, P[0], P[1], r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.6, `rgba(${col},${a * .6})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(P[0] - r, P[1] - r, 2 * r, 2 * r); x.restore();
  };
})();
