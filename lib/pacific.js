(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, GL = F.globe, { clamp, lerp, smooth, TAU } = F;
  const PC = (F.pacific = {});
  const D = Math.PI / 180, dot = GL.dot, add = GL.add, scl = GL.scl;
  const len = a => Math.hypot(a[0], a[1], a[2]), unit = a => scl(a, 1 / (len(a) || 1));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  PC.hash = hash;

  PC.frameAt = (lon, lat, rot, s) => { const f = GL.frame(lon, lat, rot); return { O: GL.at(lon, lat, rot, 1), e: f.east, u: f.up, n: f.north, s }; };
  PC.toGlobe = (L, p) => [L.O[0] + L.s * (p[0] * L.e[0] + p[1] * L.u[0] - p[2] * L.n[0]), L.O[1] + L.s * (p[0] * L.e[1] + p[1] * L.u[1] - p[2] * L.n[1]), L.O[2] + L.s * (p[0] * L.e[2] + p[1] * L.u[2] - p[2] * L.n[2])];
  PC.toLocal = (L, g) => { const d = [g[0] - L.O[0], g[1] - L.O[1], g[2] - L.O[2]]; return [dot(d, L.e) / L.s, dot(d, L.u) / L.s, -dot(d, L.n) / L.s]; };
  PC.local = (cam, lon, lat, rot, s) => {
    const L = PC.frameAt(lon, lat, rot, s), toCam = p => cam.toCam(PC.toGlobe(L, p)), near = cam.near / s;
    return {
      pos: PC.toLocal(L, cam.pos), f: cam.f, W: cam.W, H: cam.H, cx: cam.cx, cy: cam.cy, near: cam.near, frame: L,
      toCam, onScreen: cam.onScreen,
      proj: p => { const c = toCam(p); if (c[2] < cam.near) return null; const o = cam.onScreen(c); o[3] *= s; return o; },
      depth: p => toCam(p)[2], yaw: cam.yaw, yawOf: cam.yawOf, nearLocal: near,
    };
  };

  PC.globeCam = (k, W, H) => {
    const e = k.e, g = k.g, f = k.f, alt = len(e) - 1, near = Math.min(.002, Math.max(1e-9, .2 * alt));
    const fw = unit([g[0] - e[0], g[1] - e[1], g[2] - e[2]]), rad = unit(g), north = unit(add([0, 1, 0], scl(rad, -rad[1])));
    const kN = ss(.93, .99, Math.abs(dot(rad, fw))), hint = unit(add(scl(rad, 1 - kN), scl(north, kN)));
    let right = cross(hint, fw); if (len(right) < 1e-9) right = cross(north, fw); right = unit(right);
    const up = cross(fw, right), cx = W / 2, cy = H / 2;
    const toCam = p => { const d = [p[0] - e[0], p[1] - e[1], p[2] - e[2]]; return [dot(d, right), dot(d, up), dot(d, fw)]; };
    const onScreen = c => { const kk = f / c[2]; return [cx + c[0] * kk, cy - c[1] * kk, c[2], kk]; };
    return { pos: e, f, W, H, cx, cy, near, toCam, onScreen, fwd: fw, right, up, yaw: Math.atan2(fw[0], fw[2]), pitch: Math.asin(clamp(fw[1], -1, 1)),
      proj: p => { const c = toCam(p); return c[2] < near ? null : onScreen(c); }, depth: p => toCam(p)[2], yawOf: facing => -(facing + Math.atan2(fw[0], fw[2])) };
  };

  PC.band = (x, cam, P, o = {}) => {
    const n0 = P.length; if (n0 < 2) return;
    const u = clamp(o.u ?? 1), N = o.closed ? n0 : n0 - 1, m = u * N; if (m <= 0) return;
    const pts = [], idx = Math.floor(m), fr = m - idx;
    for (let i = 0; i <= idx; i++) pts.push(P[i % n0]);
    if (fr > 1e-4 && idx < N) { const a = P[idx % n0], b = P[(idx + 1) % n0]; pts.push([lerp(a[0], b[0], fr), lerp(a[1], b[1], fr), lerp(a[2], b[2], fr)]); }
    const Q = pts.map(p => (o.seen && !o.seen(p)) ? null : cam.proj(p));
    const wd = q => Math.min(o.wMax ?? Infinity, Math.max(o.wMin ?? 1.2, o.px != null ? o.px : (o.w || .02) * q[3]));
    const runs = []; let cur = null;
    for (let i = 0; i < Q.length; i++) { if (Q[i]) { if (!cur) runs.push(cur = []); cur.push(i); } else cur = null; }
    x.save(); x.globalAlpha *= o.a ?? 1; x.lineCap = 'round'; x.lineJoin = 'round';
    const pass = (run, col, extra) => {
      x.strokeStyle = col;
      for (let c = 0; c < run.length - 1;) {
        const w0 = wd(Q[run[c]]); let e = c + 1; while (e < run.length - 1 && Math.abs(wd(Q[run[e + 1]]) - w0) < .06 * w0) e++;
        x.lineWidth = 2 * wd(Q[run[(c + e) >> 1]]) + extra; x.beginPath();
        for (let j = c; j <= e; j++) { const q = Q[run[j]]; j > c ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }
        x.stroke(); c = e;
      }
    };
    if (o.glow) for (const run of runs) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha *= o.glow; pass(run, o.glowCol || 'rgba(190,205,255,.35)', 10); x.globalAlpha *= .6; pass(run, o.glowCol || 'rgba(190,205,255,.35)', 22); x.restore(); }
    if (o.dark !== false) for (const run of runs) pass(run, o.dark || 'rgba(14,16,30,.85)', 2.6);
    for (const run of runs) pass(run, o.col || '#e4eaf6', 0);
    const hk = o.head ?? 0, hq = Q[Q.length - 1];
    if (hk > .01 && hq && u < 1) {
      const r = Math.max(6, 3.2 * wd(hq)), g = x.createRadialGradient(hq[0], hq[1], 0, hq[0], hq[1], r);
      g.addColorStop(0, `rgba(255,255,255,${.95 * hk})`); g.addColorStop(.4, `rgba(220,230,255,${.4 * hk})`); g.addColorStop(1, 'rgba(220,230,255,0)');
      x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(hq[0] - r, hq[1] - r, 2 * r, 2 * r);
    }
    x.restore();
  };

  PC.circle = (lon, lat, rho, rot, r = 1.002, n = 96, a0 = 0) => {
    const f = GL.frame(lon, lat, rot), cr = Math.cos(rho * D), sr = Math.sin(rho * D), out = [];
    for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU, v = add(scl(f.up, cr), scl(add(scl(f.north, Math.cos(a)), scl(f.east, Math.sin(a))), sr)); out.push(scl(v, r)); }
    return out;
  };
  PC.seenAt = cam => p => { const r2 = dot(p, p); return dot(p, cam.pos) > r2 * .999; };

  const NIGHT = { air: [120, 140, 255], sea0: '#090a22', sea1: '#06061a', sea2: '#030410', land: '#131126', rim: 'rgba(170,190,255,.3)' };
  const DAY = { air: [150, 190, 240], sea0: '#2c4466', sea1: '#1b2c48', sea2: '#101c32', land: '#b9ab8c', rim: 'rgba(200,225,255,.35)' };
  PC.PAL = { NIGHT, DAY };
  const mixc = (a, b, k) => S3.mix(a, b, k);
  const fixed = p => (p.k = 1, p);
  const clipHalf = (P, inside, cut) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(fixed(cut(a, b))); } return out; };
  const clipRect = (P, x0, y0, x1, y1) => {
    const cx = X => (a, b) => [X, a[1] + (b[1] - a[1]) * (X - a[0]) / (b[0] - a[0])], cy = Y => (a, b) => [a[0] + (b[0] - a[0]) * (Y - a[1]) / (b[1] - a[1]), Y];
    P = clipHalf(P, p => p[0] >= x0, cx(x0)); if (P.length < 3) return P; P = clipHalf(P, p => p[0] <= x1, cx(x1)); if (P.length < 3) return P;
    P = clipHalf(P, p => p[1] >= y0, cy(y0)); if (P.length < 3) return P; return clipHalf(P, p => p[1] <= y1, cy(y1));
  };
  const area2 = r => { let s = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); };
  const onLines = (P, lines) => {
    const ons = lines.map(([c0, c1]) => { const ex = c1[0] - c0[0], ey = c1[1] - c0[1], l2 = ex * ex + ey * ey, on = p => Math.abs(ex * (p[1] - c0[1]) - ey * (p[0] - c0[0])) < 1e-9 * Math.sqrt(l2), par = p => ((p[0] - c0[0]) * ex + (p[1] - c0[1]) * ey) / l2; return { on, par, pts: P.filter(on) }; });
    for (const Ln of ons) for (const p of Ln.pts) fixed(p);
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length]; out.push(a);
      for (const Ln of ons) {
        if (Ln.pts.length < 3 || !Ln.on(a) || !Ln.on(b)) continue;
        const ua = Ln.par(a), ub = Ln.par(b), lo = Math.min(ua, ub), hi = Math.max(ua, ub), sg = Math.sign(ub - ua);
        Ln.pts.filter(p => { const u = Ln.par(p); return u > lo + 1e-12 && u < hi - 1e-12; }).sort((p, q) => sg * (Ln.par(p) - Ln.par(q))).forEach(p => out.push(p)); break;
      }
    }
    return out;
  };
  const sides = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]];
  const edgesOf = C => C.map((c, i) => [c, C[(i + 1) % C.length]]);
  PC.tiles = (rings, step = 10) => {
    const out = [];
    for (const r of rings) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 - x0 <= step && y1 - y0 <= step) { out.push(r); continue; }
      for (let X = Math.floor(x0 / step) * step; X < x1; X += step) for (let Y = Math.floor(y0 / step) * step; Y < y1; Y += step) { const c = clipRect(r, X, Y, X + step, Y + step); if (c.length >= 3 && area2(c) > 1e-6) out.push(onLines(c, sides(X, Y, X + step, Y + step))); }
    }
    return out;
  };
  const TOL = [0, .004, .01, .025, .06, .15];
  const simplify = (R, tol) => {
    const n = R.length, keep = new Uint8Array(n), t2 = tol * tol;
    const dp = (i0, i1) => {
      const a = R[i0 % n], b = R[i1 % n], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; let mx = t2, mi = -1;
      for (let i = i0 + 1; i < i1; i++) { const p = R[i % n], u = L2 > 1e-18 ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2) : 0, ex = a[0] + u * dx - p[0], ey = a[1] + u * dy - p[1], d2 = ex * ex + ey * ey; if (d2 > mx) { mx = d2; mi = i; } }
      if (mi >= 0) { keep[mi % n] = 1; dp(i0, mi); dp(mi, i1); }
    };
    let A = []; for (let i = 0; i < n; i++) if (R[i].k) A.push(i);
    if (A.length < 2) { let far = 0, fd = -1; const o = A.length ? A[0] : 0; for (let i = 0; i < n; i++) { const d = (R[i][0] - R[o][0]) ** 2 + (R[i][1] - R[o][1]) ** 2; if (d > fd) { fd = d; far = i; } } A = [...new Set([o, far])].sort((p, q) => p - q); }
    for (const i of A) keep[i] = 1;
    for (let j = 0; j < A.length; j++) dp(A[j], j + 1 < A.length ? A[j + 1] : A[0] + n);
    const out = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(R[i]);
    return out.length >= 3 ? out : R;
  };
  const lodOf = (L, cam, c, px = .5) => {
    const alt = len(cam.pos) - 1, dmin = Math.max(alt, Math.hypot(c[0] - cam.pos[0], c[1] - cam.pos[1], c[2] - cam.pos[2]) - L.a), pxDeg = cam.f / dmin * D;
    let i = TOL.length - 1; while (i > 0 && TOL[i] * pxDeg > px) i--;
    return L.lods[i] || (L.lods[i] = simplify(L.r, TOL[i]));
  };
  const side = (a, b) => (a[0] === b[0] && a[0] % 10 === 0) || (a[1] === b[1] && a[1] % 10 === 0);
  PC.coastPath = (x, cam, rings, rot, r = 1) => {
    const seen = PC.seenAt(cam);
    for (const ring of rings) { let pen = false; for (let i = 0; i <= ring.length; i++) { const pt = ring[i % ring.length]; if (i && side(ring[i - 1], pt)) pen = false; const q = GL.at(pt[0], pt[1], rot, r), p = seen(q) && cam.proj(q); if (!p) { pen = false; continue; } pen ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); pen = true; } }
  };
  let CAPS = null;
  const capsOf = src => src.map(r => {
    let c = [0, 0, 0]; for (const [lo, la] of r) c = add(c, GL.at(lo, la, 0)); c = unit(c);
    let a = 0; for (const [lo, la] of r) a = Math.max(a, Math.acos(clamp(dot(c, GL.at(lo, la, 0)), -1, 1)));
    return { r, ll: [Math.atan2(c[0], -c[2]) / D, Math.asin(clamp(c[1], -1, 1)) / D], a, lods: [r] };
  });
  const unwrap = R => { const out = [R[0].slice()]; for (let i = 1; i < R.length; i++) { let x = R[i][0]; const px = out[i - 1][0]; while (x - px > 180) x -= 360; while (x - px < -180) x += 360; out.push([x, R[i][1]]); } return Math.abs(out[out.length - 1][0] - out[0][0]) > 180 ? R : out; };
  PC.unwrap = unwrap;
  const landRings = () => CAPS || (CAPS = capsOf(PC.tiles((F.pacificData ? F.pacificData.LAND : F.world.LAND).map(unwrap))));
  const seenCaps = (caps, cam, rot, px) => {
    const d = len(cam.pos), hz = Math.acos(Math.min(1, 1 / d)), up = scl(cam.pos, 1 / d), out = [];
    for (const L of caps) { const c = GL.at(L.ll[0], L.ll[1], rot); if (Math.acos(clamp(dot(c, up), -1, 1)) < hz + L.a + .02) out.push(lodOf(L, cam, c, px)); }
    return out;
  };
  PC.landSeen = (cam, rot) => seenCaps(landRings(), cam, rot);
  PC.coastSeen = (cam, rot) => seenCaps(landRings(), cam, rot);
  PC.globe = (x, cam, o) => {
    const rot = o.rot, k = clamp(o.night ?? 0), dc = GL.disc(cam); if (!dc) return null;
    const [cx, cy, R] = dc, air = DAY.air.map((v, i) => Math.round(lerp(v, NIGHT.air[i], k)));
    const ga = x.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.16); ga.addColorStop(0, `rgba(${air},${lerp(.32, .2, k)})`); ga.addColorStop(1, `rgba(${air},0)`);
    x.fillStyle = ga; x.beginPath(); x.arc(cx, cy, R * 1.17, 0, TAU); x.fill();
    const dw = (o.dawn || 0) * (1 - ss(.12, .45, len(cam.pos) - 1)); if (dw > .01) { const bw = 300 * cam.W / 1920, gw = x.createRadialGradient(cx, cy, R - 2, cx, cy, R + bw); gw.addColorStop(0, `rgba(250,176,112,${.5 * dw})`); gw.addColorStop(.18, `rgba(222,124,104,${.3 * dw})`); gw.addColorStop(.5, `rgba(126,70,118,${.12 * dw})`); gw.addColorStop(1, 'rgba(40,24,70,0)'); x.fillStyle = gw; x.beginPath(); x.arc(cx, cy, R + bw, 0, TAU); x.fill(); }
    const s = GL.rim(cam); x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
    const gs = x.createRadialGradient(cx - .35 * R, cy - .4 * R, R * .1, cx, cy, R * 1.02);
    gs.addColorStop(0, mixc(DAY.sea0, NIGHT.sea0, k)); gs.addColorStop(.7, mixc(DAY.sea1, NIGHT.sea1, k)); gs.addColorStop(1, mixc(DAY.sea2, NIGHT.sea2, k));
    x.fillStyle = gs; x.fill();
    x.save(); x.clip();
    x.beginPath(); for (const r of PC.landSeen(cam, rot)) GL.ringPath(x, cam, r, rot); if (o.land) for (const r of o.land) GL.ringPath(x, cam, r, rot, 1.0004);
    x.fillStyle = o.landCol || mixc(mixc(DAY.land, NIGHT.land, k), '#26244c', .6 * (o.dawn || 0) * k); x.fill();
    const ce = (o.coast ?? 1) * k; if (ce > .01) { const w0 = Math.max(.8, 1.4 * Math.min(1, R / 700)), lw = Math.min(1, w0); x.beginPath(); PC.coastPath(x, cam, PC.coastSeen(cam, rot), rot); x.strokeStyle = `rgba(255,201,120,${Math.min(1, (.32 + .3 * (o.dawn || 0)) * ce * w0 / lw)})`; x.lineWidth = lw; x.stroke(); }
    if (o.inside) o.inside(x);
    const gd = x.createRadialGradient(cx - .3 * R, cy - .35 * R, R * .35, cx, cy, R * 1.01); gd.addColorStop(0, 'rgba(8,12,26,0)'); gd.addColorStop(.75, `rgba(8,12,26,${lerp(.18, .3, k)})`); gd.addColorStop(1, `rgba(8,12,26,${lerp(.55, .7, k)})`);
    x.fillStyle = gd; x.fillRect(cx - R - 2, cy - R - 2, 2 * R + 4, 2 * R + 4);
    x.restore();
    x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.strokeStyle = mixc('#c8e1ff', '#aabeff', k); x.globalAlpha = lerp(.35, .3, k); x.lineWidth = 1.5; x.stroke(); x.globalAlpha = 1;
    return dc;
  };

  const STARS = Array.from({ length: 260 }, (_, i) => { const u = hash(i, 11) * 2 - 1, a = hash(i, 12) * TAU, r = Math.sqrt(1 - u * u); return [r * Math.cos(a) * 60, u * 60, r * Math.sin(a) * 60, hash(i, 13)]; });
  PC.stars = (x, cam, a = 1) => {
    if (a <= .01) return;
    for (const [sx, sy, sz, b] of STARS) { const p = cam.proj([cam.pos[0] + sx, cam.pos[1] + sy, cam.pos[2] + sz]); if (!p) continue; x.fillStyle = `rgba(230,236,255,${(.15 + .4 * b) * a})`; x.fillRect(p[0], p[1], b > .9 ? 2 : 1.2, b > .9 ? 2 : 1.2); }
  };

  const CSH = new Map();
  const cloud2 = (sz, sd) => {
    const key = sz + ':' + sd; let s = CSH.get(key); if (s) return s;
    const lobes = 9 + Math.floor(hash(sd, 7) * 5), base = [];
    for (let i = 0; i < lobes; i++) { const a = (i + .3 * (hash(sd, 20 + i) - .5)) / lobes * TAU, rr = sz * (.78 + .3 * hash(sd, 40 + i)); base.push([rr * Math.cos(a) * 1.55, rr * Math.sin(a) * .85]); }
    s = [];
    for (let i = 0; i < lobes; i++) {
      const p = base[i], q = base[(i + 1) % lobes], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, rr = Math.hypot(q[0] - p[0], q[1] - p[1]) / 2, a0 = Math.atan2(p[1] - my, p[0] - mx);
      for (let k = 0; k < 7; k++) { const a = a0 + k / 7 * Math.PI; s.push([mx + rr * Math.cos(a), my + rr * Math.sin(a)]); }
    }
    CSH.set(key, s); return s;
  };
  PC.cloudShape = (c, rot) => {
    const [lon, lat, h, sz, sd] = c, f = GL.frame(lon, lat, rot), r = 1 + h;
    return cloud2(sz * D, sd).map(([u, v]) => scl(unit(add(f.up, add(scl(f.east, u), scl(f.north, v)))), r));
  };
  PC.clouds = (x, cam, list, o = {}) => {
    const alt = len(cam.pos) - 1;
    const items = list.map(c => ({ c, d: cam.depth(GL.at(c[0], c[1], o.rot, 1 + c[2])) })).filter(e => e.d > cam.near).sort((a, b) => b.d - a.d);
    const whole = [], part = [], A = o.a ?? 1;
    for (const { c } of items) { const al = A * ss(1.0, 2.1, (alt - c[2]) / (c[3] * D)); if (al <= .01) continue; (al >= A - .001 ? whole : part).push([c, al]); }
    x.fillStyle = o.col || '#2b2e6c';
    if (whole.length) { x.beginPath(); let any = false; for (const [c] of whole) { const s = S3.clip(cam, PC.cloudShape(c, o.rot)); if (s.length < 3) continue; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); any = true; } if (any) { x.globalAlpha = A; x.fill('nonzero'); x.globalAlpha = 1; } }
    for (const [c, al] of part) { if (!S3.poly(x, cam, PC.cloudShape(c, o.rot))) continue; x.globalAlpha = al; x.fill(); x.globalAlpha = 1; }
  };

  PC.ringBand = (x, cam, rg, rot) => {
    if (!rg || (rg.a ?? 1) <= .01) return;
    const P = PC.circle(rg.c[0], rg.c[1], rg.rho, rot, PC.lift(cam, .0006), 160), fl = rg.flash || 0, sr = Math.sin(rg.rho * D);
    PC.band(x, cam, P, { closed: true, u: rg.u ?? 1, w: .016 * sr * (rg.wk ?? 1), wMin: 1.6, wMax: (rg.wMax ?? 8) * cam.W / 1920 * (rg.wk ?? 1), a: rg.a ?? 1, seen: PC.seenAt(cam), col: rg.col || S3.mix('#dde4f2', '#ffffff', fl), glow: .55 + .6 * fl, dark: rg.dark });
  };
  PC.world = (ctx, L, cam, st, t) => {
    const W = cam.W, H = cam.H, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2], rot = st.rot, sv = F.SHIFT || { x: 0, y: 0 };
    L.background(ctx);
    L.sheet(ctx, ID, 1, RC, x => { PC.stars(x, cam, st.stars ?? 1); PC.globe(x, cam, { rot, night: st.night, land: st.land, dawn: st.dawn, inside: st.inside ? xx => st.inside(xx, cam) : null }); }, { rim: false, shadow: false, fibre: .25 });
    if (st.clouds) L.sheet(ctx, ID, 1, RC, x => PC.clouds(x, cam, st.clouds, { rot, col: S3.mix('#ece4d2', '#6d6aa8', st.night ?? 1), a: st.cloudA ?? .92 }), { rimColor: '#ffd9a0', rimAlpha: .6, glow: .12, glowColor: '#ffc978', glowBlur: 8, fibre: .3 });
    if (st.over) st.over(ctx, cam);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sv.x, -sv.y);
    if (st.ring && (st.ring.open ?? 0) > .001) PC.ringDash(ctx, cam, st.ring, rot, st.ring.open); else PC.ringBand(ctx, cam, st.ring, rot);
    PC.glintAt(ctx, cam, st.glint, rot);
    if (st.lights) st.lights(ctx, cam);
    ctx.restore();
  };
  PC.lift = (cam, max) => 1 + Math.min(max, .002 * Math.max(0, len(cam.pos) - 1));
  PC.glintAt = (ctx, cam, gl, rot) => {
    if (!gl || !(gl.a > .01)) return;
    const q = GL.at(gl.c[0], gl.c[1], rot, PC.lift(cam, .001)); if (!GL.seen(cam, q)) return;
    const p = cam.proj(q); if (p) PC.glow(ctx, p[0], p[1], 14 * (cam.W / 1920), '#e8eeff', .7 * gl.a);
  };
  const SPR = new Map();
  PC.glow = (ctx, X, Y, r, col, a, sy = 1) => {
    if (!(a > .003) || !(r > .5)) return;
    let c = SPR.get(col);
    if (!c) { const [cv, x] = F.canvas(128, 128), n = parseInt(col.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255, gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${R},${G},${B},1)`); gr.addColorStop(.3, `rgba(${R},${G},${B},.5)`); gr.addColorStop(.65, `rgba(${R},${G},${B},.14)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); SPR.set(col, c = cv); }
    const base = ctx.globalAlpha; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a) * base; ctx.drawImage(c, X - r, Y - r * sy, 2 * r, 2 * r * sy); ctx.restore();
  };
  const RV = { glow: PC.glow };

  const PD = () => F.pacificData;
  PC.PLACES = {
    TOKYO: [139.69, 35.69], CLOCK: [138.25, 36.15], HITOKAPPU: [147.65, 44.85], HONOLULU: [-157.86, 21.31],
    TARGETS: [[-157.952, 21.364], [-157.957, 21.369], [-157.948, 21.360], [-157.962, 21.366], [-157.940, 21.352], [-157.940, 21.320], [-158.040, 21.480], [-157.770, 21.447], [-158.050, 21.330], [-157.715, 21.360]],
  };
  PC.path = (wp, step = .2) => {
    const U = [wp[0].slice()]; for (let i = 1; i < wp.length; i++) { let x = wp[i][0]; while (x - U[i - 1][0] > 180) x -= 360; while (x - U[i - 1][0] < -180) x += 360; U.push([x, wp[i][1]]); }
    const ll = [U[0]], s = [0];
    for (let i = 0; i < U.length - 1; i++) { const a = U[i], b = U[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 1; k <= n; k++) { const q = [lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)], p = ll[ll.length - 1]; s.push(s[s.length - 1] + Math.hypot((q[0] - p[0]) * Math.cos(q[1] * D), q[1] - p[1])); ll.push(q); } }
    return { ll, s, L: s[s.length - 1] };
  };
  PC.pathAt = (P, d) => {
    d = clamp(d, 0, P.L); let lo = 0, hi = P.s.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; P.s[m] <= d ? (lo = m) : (hi = m); }
    const u = (d - P.s[lo]) / ((P.s[hi] - P.s[lo]) || 1), a = P.ll[lo], b = P.ll[hi];
    return { ll: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], hd: Math.atan2((b[0] - a[0]) * Math.cos(a[1] * D), b[1] - a[1]) };
  };
  PC.pathPts = (P, rot, r, d0, d1) => {
    const out = [], a = PC.pathAt(P, d0); out.push(GL.at(a.ll[0], a.ll[1], rot, r));
    for (let i = 0; i < P.s.length; i++) if (P.s[i] > d0 && P.s[i] < d1) out.push(GL.at(P.ll[i][0], P.ll[i][1], rot, r));
    const b = PC.pathAt(P, d1); out.push(GL.at(b.ll[0], b.ll[1], rot, r)); return out;
  };
  PC.symK = (cam, p, size, minPx) => { const q = cam.proj(p); if (!q) return 1; return Math.max(1, minPx / (size * q[3])); };

  const HELD = {
    MANCHUKUO: [[115.6, 40.5], [116.2, 42.4], [118.4, 44.6], [116.0, 46.4], [115.4, 47.9], [117.7, 49.7], [120.5, 53.8], [136, 54], [136, 39], [124.4, 39.4], [121.2, 38.4], [119.8, 39.9], [117.6, 40.2]],
    NORTH: [[110.0, 41.6], [111.6, 40.6], [112.6, 38.2], [112.0, 36.0], [113.7, 35.0], [114.7, 33.6], [115.2, 32.5], [113.6, 31.3], [111.3, 30.7], [112.6, 29.6], [114.2, 29.0], [116.1, 28.7], [118.6, 29.6], [120.2, 29.8], [122.6, 29.9], [123, 40], [119.8, 39.9], [117.6, 40.2], [115.6, 40.5], [114.1, 41.6], [112.0, 42.1]],
    CANTON: [[112.4, 23.6], [114.6, 23.6], [114.6, 21.9], [112.6, 21.6], [111.9, 22.4]],
    HAINAN: [[107.5, 20.4], [111.8, 20.4], [111.8, 17.6], [107.5, 17.6]],
    KARAFUTO: [[140, 45.6], [146.5, 45.6], [146.5, 50], [140, 50]],
  };
  PC.HELD = HELD;
  const sArea = P => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
  const clipConvex = (P, C) => {
    const sg = Math.sign(sArea(C));
    for (let i = 0; i < C.length && P.length >= 3; i++) {
      const c0 = C[i], c1 = C[(i + 1) % C.length], ex = c1[0] - c0[0], ey = c1[1] - c0[1], side = p => sg * (ex * (p[1] - c0[1]) - ey * (p[0] - c0[0]));
      P = clipHalf(P, p => side(p) >= 0, (a, b) => { const sa = side(a), u = sa / (sa - side(b)); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; });
    }
    return P;
  };
  const triangles = P => {
    const sg = Math.sign(sArea(P)), idx = P.map((_, i) => i), out = [], cr = (a, b, c) => sg * ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
    for (let guard = 0; idx.length > 3 && guard < 1000; guard++) for (let i = 0; i < idx.length; i++) {
      const a = P[idx[(i + idx.length - 1) % idx.length]], b = P[idx[i]], c = P[idx[(i + 1) % idx.length]];
      if (cr(a, b, c) <= 0 || idx.some(j => { const p = P[j]; return p !== a && p !== b && p !== c && cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0; })) continue;
      out.push([a, b, c]); idx.splice(i, 1); break;
    }
    out.push(idx.map(j => P[j])); return out;
  };
  let ET = null;
  const tiled = () => ET || (ET = (() => {
    const E = PD().EMPIRE, o = {}; for (const k of Object.keys(E)) o[k] = PC.tiles(E[k]);
    const keep = c => c.length >= 3 && area2(c) > 1e-6;
    o.HELD = [];
    for (const k of ['MANCHUKUO', 'NORTH', 'CANTON', 'HAINAN']) for (const tri of triangles(HELD[k])) for (const ring of o.CHINA) { const c = clipConvex(ring, tri); if (keep(c)) o.HELD.push(onLines(c, edgesOf(tri))); }
    for (const ring of o.SAKHALIN) { const c = clipConvex(ring, HELD.KARAFUTO); if (keep(c)) o.HELD.push(onLines(c, edgesOf(HELD.KARAFUTO))); }
    for (const k of Object.keys(o)) o[k] = capsOf(o[k]);
    for (const k of Object.keys(E)) o['C_' + k] = capsOf(E[k]);
    return o;
  })());
  PC.empireTiles = tiled;
  const layer = (x, cam, rot, r, keys, px) => {
    const T = tiled(); x.beginPath(); for (const k of keys) for (const ring of seenCaps(T[k], cam, rot, px)) GL.ringPath(x, cam, ring, rot, r); x.fill();
  };
  const HOME = { own: ['JAPAN'], fills: [['JAPAN']] }, COLONIES = { own: ['KOREA', 'TAIWAN', 'INDOCHINA'], fills: [['KOREA', 'TAIWAN', 'INDOCHINA'], ['HELD']] };
  PC.empire = (x, cam, rot, o) => {
    const rise = clamp(o.rise ?? 1); if (rise <= .002) return;
    const hH = (o.hHome ?? .009) * rise, hC = (o.hHeld ?? .0045) * rise, N = 4, k = o.night ?? 0, lit = o.lit ?? 0;
    const wall = mixc('#262a38', '#0c0b1c', k), top = mixc(mixc('#3b4152', '#56607a', lit), mixc('#1e1d3e', '#2c2a5c', lit), k);
    x.save(); x.globalAlpha *= Math.min(1, rise * 3);
    for (const [parts, h] of [[COLONIES, hC], [HOME, hH]]) {
      for (let i = 0; i <= N; i++) { x.fillStyle = i < N ? S3.mix(wall, top, .25 * i / N) : top; for (const keys of parts.fills) layer(x, cam, rot, 1 + h * i / N, keys, i < N ? 1.2 : .5); }
      x.beginPath(); const r = 1 + h, T = tiled(); for (const kk of parts.own) PC.coastPath(x, cam, seenCaps(T['C_' + kk], cam, rot), rot, r);
      x.strokeStyle = k > .5 ? `rgba(255,201,120,${1.1 * .5 * (1 - .5 * (1 - lit))})` : `rgba(246,236,214,${Math.min(1, 1.1 * (.35 + .4 * lit))})`; x.lineWidth = 1; x.stroke();
    }
    x.restore();
  };

  PC.ringDash = (x, cam, rg, rot, open) => {
    const P = PC.circle(rg.c[0], rg.c[1], rg.rho, rot, 1.0008, 192), K = 24, n = P.length / K, keep = 1 - .62 * clamp(open), sr = Math.sin(rg.rho * D);
    for (let j = 0; j < K; j++) { const seg = []; for (let i = 0; i <= Math.round(n * keep); i++) seg.push(P[(Math.round(j * n) + i) % P.length]); PC.band(x, cam, seg, { w: .016 * sr, wMin: 1.6, a: rg.a ?? 1, seen: PC.seenAt(cam), col: rg.col || '#dde4f2', glow: .4, dark: rg.dark }); }
  };

  const LANEP = new Map();
  PC.lane = (x, cam, rot, key, t, o = {}) => {
    let P = LANEP.get(key); if (!P) LANEP.set(key, P = PC.path(PD().LANES[key], .25));
    const seen = PC.seenAt(cam), a = o.a ?? 1, stop = clamp(o.stop ?? 0), dk = o.dark ?? 0; if (a <= .01) return;
    const line = (d0, d1, al) => { const pts = PC.pathPts(P, rot, 1.0007, d0, d1); x.save(); x.globalAlpha *= al; x.strokeStyle = o.lineCol || 'rgba(242,163,58,.55)'; x.lineWidth = 1.6; x.setLineDash([7, 6]); x.beginPath(); let pen = false; for (const p of pts) { const q = seen(p) && cam.proj(p); if (!q) { pen = false; continue; } pen ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); pen = true; } x.stroke(); x.restore(); };
    const sA = o.stopAt ?? P.L;
    line(0, sA, a * (1 - .7 * dk)); line(sA, P.L, a * (1 - .85 * stop));
    const v = o.v ?? 4, gap = o.gap ?? 2.4, n = Math.ceil(P.L / gap) + 1, tS = o.tStop ?? Infinity;
    for (let i = 0; i < n; i++) {
      const d0 = (i * gap + v * Math.min(t, tS)) % P.L; let d = d0;
      if (t > tS) { const run = v * (t - tS); if (d0 < sA) d = Math.min(d0 + run, sA - .35 - .55 * Math.floor((sA - d0) / gap)); else { d = d0 + run; if (d >= P.L) continue; } }
      const pa = PC.pathAt(P, d), p = GL.at(pa.ll[0], pa.ll[1], rot, 1.001); if (!seen(p)) continue; const q = cam.proj(p); if (!q) continue;
      const r = Math.max(2.2, Math.min(7, .0025 * q[3])) * (cam.W / 1920);
      x.globalAlpha = a * (d < sA ? 1 - .5 * dk : 1); x.fillStyle = '#1b1208'; x.beginPath(); x.arc(q[0], q[1], r + 1.2, 0, TAU); x.fill(); x.fillStyle = o.dropCol || '#f2a33a'; x.beginPath(); x.arc(q[0], q[1], r, 0, TAU); x.fill(); x.globalAlpha = 1;
    }
    return P;
  };

  PC.oilClock = (x, lc, o) => {
    const BR = o.night ? '#3e3020' : '#8a6a42', BRD = o.night ? '#251c12' : '#54402a', ink = '#05040e', light = unit([.2, .55, 1]);
    const op = { col: BR, light, lo: .32, ink, dark: .7 }, POT = .62, TIP = [1.02, .55, -.55], BAS = [1.02, -.55], BAS_R = .4;
    const legs = [90, 210, 330].map(a => [.42 * Math.cos(a * D), .42 * Math.sin(a * D)]).sort((a, b) => lc.depth([b[0], .3, b[1]]) - lc.depth([a[0], .3, a[1]]));
    for (const g of legs) S3.cyl(x, lc, g, .06, 0, .44, { ...op, col: BRD });
    const basinFar = lc.depth([BAS[0], .2, BAS[1]]) > lc.depth([0, .9, 0]);
    const basin = () => {
      const ring = (r, y, n = 32) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [BAS[0] + r * Math.cos(a), y, BAS[1] + r * Math.sin(a)]; });
      if (S3.poly(x, lc, ring(BAS_R, .3))) { x.fillStyle = '#140e08'; x.fill(); }
      const lv = .08 + .18 * clamp(o.basin ?? 0); if (S3.poly(x, lc, ring(BAS_R - .03, lv))) { x.fillStyle = '#07050a'; x.fill(); x.strokeStyle = 'rgba(242,163,58,.35)'; x.lineWidth = 1; x.stroke(); }
      S3.cyl(x, lc, BAS, BAS_R, 0, .3, { ...op, cap: false, n: 24 });
      if (S3.poly(x, lc, ring(BAS_R, .3))) { x.strokeStyle = o.night ? '#6a5236' : '#b08a58'; x.lineWidth = 1.2; x.stroke(); }
    };
    if (basinFar) basin();
    S3.cyl(x, lc, [0, 0], POT, .4, 1.6, { ...op, n: 36 });
    const ac = Math.atan2(lc.pos[2], lc.pos[0]), wp = (a, y) => [POT * 1.004 * Math.cos(a), y, POT * 1.004 * Math.sin(a)], W0 = .55, W1 = 1.45, lv = W0 + (W1 - W0) * clamp(o.level ?? 1);
    if (S3.poly(x, lc, [wp(ac - .13, W0), wp(ac + .13, W0), wp(ac + .13, W1), wp(ac - .13, W1)])) { x.fillStyle = o.night ? '#1a140c' : '#2a2016'; x.fill(); }
    if (lv > W0 + .005 && S3.poly(x, lc, [wp(ac - .11, W0 + .02), wp(ac + .11, W0 + .02), wp(ac + .11, lv), wp(ac - .11, lv)])) { x.fillStyle = '#050407'; x.fill(); }
    x.strokeStyle = '#f2a33a'; x.lineWidth = 1.6; x.beginPath(); S3.line(x, lc, wp(ac - .11, lv), wp(ac + .11, lv)); x.stroke();
    for (const y of [.46, 1.52]) S3.ring(x, lc, [0, 0], POT + .015, y, y + .04, BRD);
    S3.cyl(x, lc, [0, 0], POT + .03, 1.6, 1.68, { ...op, col: BRD });
    for (const dx of [-.26, .26]) S3.box(x, lc, { x0: dx - .03, x1: dx + .03, y0: 1.68, y1: 2.42, z0: -.03, z1: .03 }, { ...op, col: BRD });
    S3.box(x, lc, { x0: -.3, x1: .3, y0: 2.42, y1: 2.5, z0: -.035, z1: .035 }, { ...op, col: BRD });
    const top = o.rod ?? 2.9;
    S3.box(x, lc, { x0: -.025, x1: .025, y0: 1.5, y1: top, z0: -.025, z1: .025 }, { ...op, col: o.night ? '#3a2c1c' : '#6a5236' });
    S3.bar(x, lc, [.5, .6, -.25], TIP, .035, { ...op, lo: .3 });
    if (!basinFar) basin();
    return { tip: TIP, basin: [BAS[0], .08 + .18 * clamp(o.basin ?? 0), BAS[1]] };
  };
  PC.oilDrops = (ctx, lc, drops, t) => {
    const TIP = [1.02, .55, -.55], HANG = .16, FALL = Math.sqrt(2 * (.55 - .2) / 9.8) * 1.6;
    for (const d of drops) {
      const a = t - d; if (a < 0 || a >= HANG + FALL) continue;
      const u = Math.max(0, a - HANG) / FALL, kk = Math.min(1, a / HANG), p = [TIP[0], TIP[1] - .015 - .02 * kk - .35 * u * u, TIP[2]], q = lc.proj(p); if (!q) continue;
      const r = Math.max(2, (.018 + .01 * kk) * q[3]);
      ctx.fillStyle = '#0a0705'; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * 1.25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(242,163,58,.85)'; ctx.beginPath(); ctx.arc(q[0] - .35 * r, q[1] - .4 * r, .3 * r, 0, TAU); ctx.fill();
    }
  };

  PC.cupOn = (x, lc, o) => {
    const M = o.m ?? .07, e = Math.atan2(lc.pos[1] - .7 * M * 7, Math.hypot(lc.pos[0], lc.pos[2]));
    const c = lc.toCam([0, 0, 0]), cx = lc.toCam([1, 0, 0]), cz = lc.toCam([0, 0, 1]);
    const ax = cx[0] - c[0], az = cz[0] - c[0], l = Math.hypot(ax, az) || 1, R = [ax / l, 0, az / l];
    x.save(); x.globalAlpha *= o.a ?? 1;
    S3.onPlane(x, lc, [0, 0, 0], [R[0] * M, 0, R[2] * M], [0, -M, 0], xx => F.qin.cup(xx, { s: 1, elev: Math.max(.08, e), fill: o.fill ?? .75, liquid: o.liquid || '#d8dee8', k: o.k ?? .8, beads: [] }));
    x.restore();
    return { mouth: [0, 7.2 * M, 0] };
  };

  PC.ship = (x, lc, o) => {
    const L = o.len ?? 1, B = L * (o.carrier ? .13 : .11), col = o.col || '#2a2c3a', op = { col, light: unit([.35, .8, -.45]), lo: .45, ink: '#05050c', dark: .6 };
    const hull = [[-.5 * L, -.4 * B], [.36 * L, -.42 * B], [.5 * L, 0], [.36 * L, .42 * B], [-.5 * L, .4 * B]];
    S3.prism(x, lc, hull, 0, .085 * L, op);
    if (o.carrier) {
      S3.box(x, lc, { x0: -.52 * L, x1: .5 * L, y0: .085 * L, y1: .105 * L, z0: -.6 * B, z1: .62 * B }, { ...op, col: S3.mix(col, '#000000', .15) });
      S3.box(x, lc, { x0: -.02 * L, x1: .14 * L, y0: .105 * L, y1: .2 * L, z0: .42 * B, z1: .6 * B }, op);
    } else {
      S3.box(x, lc, { x0: -.22 * L, x1: .2 * L, y0: .06 * L, y1: .1 * L, z0: -.25 * B, z1: .25 * B }, op);
      S3.box(x, lc, { x0: -.04 * L, x1: .08 * L, y0: .1 * L, y1: .17 * L, z0: -.12 * B, z1: .12 * B }, op);
    }
  };
  PC.wake = (x, lc, o) => {
    const L = o.len ?? 1, a = o.a ?? 1; if (a <= .01) return;
    x.save(); x.globalAlpha *= a; x.strokeStyle = o.col || 'rgba(230,236,255,.55)'; x.lineWidth = Math.max(1, o.px ?? 1.4); x.lineCap = 'round';
    for (const s of [-1, 1]) { x.beginPath(); S3.line(x, lc, [-.45 * L, .002, s * .05 * L], [-2.6 * L, .002, s * .55 * L]); x.stroke(); }
    x.globalAlpha *= .6; x.beginPath(); S3.line(x, lc, [-.5 * L, .002, 0], [-2.2 * L, .002, 0]); x.stroke();
    x.restore();
  };

  PC.smoke = (x, lc, t, o) => {
    const H = o.h ?? 1, a = o.a ?? 1, seed = o.seed || 0, grow = clamp(o.grow ?? 1); if (a <= .01 || grow <= .01) return;
    const N = 14;
    for (let i = N - 1; i >= 0; i--) {
      const u = i / (N - 1), y = H * u * grow, drift = .25 * H * u * u + .02 * H * Math.sin(t * .7 + i + seed), r = H * (.07 + .2 * u) * (.85 + .15 * Math.sin(t * 1.3 + i * 1.7 + seed));
      const q = lc.proj([drift, y, .1 * H * u]); if (!q) continue; const rp = r * q[3];
      x.globalAlpha = a * (1 - .45 * u) * Math.min(1, grow * 2); x.fillStyle = o.col || '#120d16';
      x.beginPath(); x.ellipse(q[0], q[1], rp * 1.15, rp * .9, 0, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
  };
})();
