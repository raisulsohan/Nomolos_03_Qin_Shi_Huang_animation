(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, { clamp, lerp, smooth, TAU } = F;
  const AR = (F.army = {});
  const PI = Math.PI, ss = (a, b, t) => smooth((t - a) / (b - a));
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const mix = S3.mix;
  AR.hash = hash;

  const FLOOR = -5.0, PE = 4.0, PN = 42.0, PWEST = -150;
  const SLOPE = .36, WSLOPE = .4;
  const WALL_H = 1.5, WALL_X = [PWEST + 2, -6.4];
  const WALLS = Array.from({ length: 8 }, (_, k) => [4.8 * k + 3.2, 4.8 * k + 4.8]);
  const WELL = { x: -1.4, r: .5, y0: -3.15 };
  const POSTS = [[-2.15, .25], [-.65, .25]], ROLLER = .95;
  const MOUND = { x: -1500, z: 150, h: 52, rb: 175, rt: 44 };
  Object.assign(AR, { FLOOR, PE, PN, WELL, MOUND, SLOPE });
  AR.cam = (e, g, f, W, H, o = {}) => { const d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]]; return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, W, H, near: o.near ?? .03 }); };

  const SOL = [];
  [-1.4, -2.75, -4.1].forEach((X, r) => { for (let j = 0; j < 26; j++) SOL.push({ x: X, z: .55 + 1.6 * j, v: (r * 7 + j * 3) % 8, s: .97 + .07 * hash(r, j) }); });
  for (let k = 0; k < 9; k++) for (const dz of [.8, 2.4]) for (let i = 0; ; i++) { const X = -7.6 - 1.25 * i; if (X < PWEST + 3) break; SOL.push({ x: X + .12 * (hash(k * 2 + dz, i) - .5), z: 4.8 * k + dz, v: (k * 5 + i * 3 + (dz > 1 ? 4 : 0)) % 8, s: .96 + .08 * hash(k + dz, i + 7) }); }
  SOL.forEach((s, i) => { s.i = i; });
  AR.SOL = SOL;
  const FOUND = [SOL[0], SOL[26]];
  AR.FOUND = FOUND;

  const zFront = (st, X) => st.zf + SLOPE * X;
  const xWest = (st, Z) => st.xw - WSLOPE * Z;
  const inEarth = (st, X, Z) => Math.max(Z - Math.max(0, zFront(st, X)), xWest(st, Z) - X);
  AR.inEarth = inEarth;

  function onFrame(s, cam) {
    const W = cam.W, H = cam.H, edges = [[0, -W, 1], [0, 2 * W, -1], [1, -H, 1], [1, 2 * H, -1]];
    let P = s;
    for (const [k, lim, sg] of edges) {
      const out = [], n = P.length; if (n < 3) return [];
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n], ia = sg * (a[k] - lim) >= 0, ib = sg * (b[k] - lim) >= 0;
        if (ia) out.push(a);
        if (ia !== ib) { const u = (lim - a[k]) / (b[k] - a[k]); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
      }
      P = out;
    }
    return P;
  }
  const path = (x, s) => { x.beginPath(); if (s.length < 3) return false; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
  const polyF = (x, cam, pts) => path(x, onFrame(S3.clip(cam, pts), cam));
  AR.polyF = polyF; AR.onFrame = onFrame;
  function cut2(P, ax, az, c) {
    const out = [], n = P.length, f = p => ax * p[0] + az * p[1] - c;
    for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], fa = f(a), fb = f(b); if (fa <= 0) out.push(a); if ((fa <= 0) !== (fb <= 0)) { const u = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); } }
    return out;
  }
  function clipConvex(P, C) {
    if (C.length < 3) return [];
    let A = 0; for (let i = 0; i < C.length; i++) { const a = C[i], b = C[(i + 1) % C.length]; A += a[0] * b[1] - b[0] * a[1]; }
    const sg = A < 0 ? -1 : 1;
    for (let i = 0; i < C.length && P.length > 2; i++) {
      const a = C[i], b = C[(i + 1) % C.length], nx = -(b[1] - a[1]) * sg, ny = (b[0] - a[0]) * sg;
      P = cut2(P, -nx, -ny, -(nx * a[0] + ny * a[1]));
    }
    return P.length > 2 ? P : [];
  }
  function cut3(P, n, c) {
    const out = [], m = P.length, f = p => n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - c;
    for (let i = 0; i < m; i++) { const a = P[i], b = P[(i + 1) % m], fa = f(a), fb = f(b); if (fa <= 0) out.push(a); if ((fa <= 0) !== (fb <= 0)) { const u = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]); } }
    return out;
  }
  function openRing(st) {
    let P = [[PWEST, 0], [PE, 0], [PE, PN], [PWEST, PN]];
    P = cut2(P, -SLOPE, 1, st.zf);
    P = cut2(P, -1, -WSLOPE, -st.xw);
    return P;
  }
  AR.openRing = openRing;

  const C = (n, d) => k => k <= 0 ? n : k >= 1 ? d : mix(n, d, k);
  const COL = {
    skyTop: C('#070728', '#7fa6bf'), skyMid: C('#1c1a4c', '#a9c3cf'), skyLow: C('#5e3c68', '#dfe3d6'),
    ground: C('#0e0c26', '#cbb685'), groundFar: C('#1a1640', '#bfc2a6'), furrow: C('#2a2552', '#a88f62'),
    hill1: C('#141236', '#8fa0a4'), hill2: C('#100e2c', '#7a8b8d'), hill3: C('#0c0b24', '#677677'),
    mound: C('#0d0b24', '#8b8a62'), moundLit: C('#2a2350', '#b3a874'), tree: C('#07061a', '#5b6b45'), trunk: C('#06051a', '#4e3b2a'),
    earth0: C('#2c2354', '#8d6f4a'), earthA: C('#1d1842', '#c7a26c'), earthB: C('#15123a', '#b8925f'), earthC: C('#221c4c', '#d0ae7a'), earthD: C('#100e2a', '#a98458'),
    pitFloor: C('#14112e', '#c7ab7a'), wallTop: C('#1c1840', '#cdb07c'), wallSide: C('#120f2c', '#a98a5c'),
    ink: C('#0b0a1d', '#26211c'),
  };
  AR.COL = COL;

  const horizonY = cam => { const far = 1e5, p = cam.proj([cam.pos[0] + far * Math.sin(cam.yaw), cam.pos[1], cam.pos[2] + far * Math.cos(cam.yaw)]); return p ? p[1] : cam.H / 2; };
  AR.horizonY = horizonY;
  function sky(x, cam, st) {
    const W = cam.W, H = cam.H, d = st.day, hy = horizonY(cam), dawn = st.dawn ?? 1, dk = st.dusk || 0;
    const night = d < 1 ? (1 - d) : 0;
    const top = mix(COL.skyTop(d), '#03020c', night * (1 - dawn) * .9 + dk * .35), mid = mix(COL.skyMid(d), '#05041a', night * (1 - dawn) * .85 + dk * .3), low = mix(COL.skyLow(d), '#0a0820', night * (1 - dawn) * .8);
    const g = x.createLinearGradient(0, hy - H * 1.2, 0, hy + 4); g.addColorStop(0, top); g.addColorStop(.62, mid); g.addColorStop(1, low);
    x.fillStyle = g; x.fillRect(-W, -2 * H, 3 * W, 5 * H);
    let dz = (st.glowAz ?? Math.atan2(1e4, 2e3)) - cam.yaw; while (dz > Math.PI) dz -= 2 * Math.PI; while (dz < -Math.PI) dz += 2 * Math.PI;
    const warm = night * dawn * smooth((2.1 - Math.abs(dz)) / .8);
    if (warm > .01) {
      const ex = W / 2 + cam.f * Math.tan(clamp(dz, -1.25, 1.25));
      const r = H * 1.4, gg = x.createRadialGradient(ex, hy, 0, ex, hy, r);
      gg.addColorStop(0, `rgba(255,178,110,${.6 * warm})`); gg.addColorStop(.3, `rgba(220,120,90,${.3 * warm})`); gg.addColorStop(1, 'rgba(80,40,90,0)');
      x.save(); x.translate(ex, hy); x.scale(2.2, .55); x.translate(-ex, -hy); x.fillStyle = gg; x.fillRect(ex - r, hy - r, 2 * r, 2 * r); x.restore();
    }
    if (night * dawn > .01) { const b = x.createLinearGradient(0, hy - H * .16, 0, hy); b.addColorStop(0, 'rgba(210,120,150,0)'); b.addColorStop(1, `rgba(210,130,150,${.28 * night * dawn})`); x.fillStyle = b; x.fillRect(-W, hy - H * .16, 3 * W, H * .16 + 2); }
    if (dk > .01) { const b = x.createLinearGradient(0, hy - H * .3, 0, hy); b.addColorStop(0, 'rgba(240,160,110,0)'); b.addColorStop(1, `rgba(240,150,100,${.35 * dk})`); x.fillStyle = b; x.fillRect(-W, hy - H * .3, 3 * W, H * .3 + 2); }
  }
  const RO = [-40, 20], DEG = PI / 180;
  const oct = (u, s) => .55 * F.noise1(u, s) + .3 * F.noise1(u * 2.3, s + 1) + .15 * F.noise1(u * 5.1, s + 2);
  const RIDGES = [
    { R: 4200, col: 'hill3', haze: .5, h: b => 720 * smooth((-92 - b) / 14) * smooth((b + 215) / 25) * (.62 + .38 * oct(b * .09, 3)) },
    { R: 2500, col: 'hill2', haze: .3, h: b => 230 * smooth((-95 - b) / 10) * smooth((b + 200) / 20) * (.5 + .5 * oct(b * .15, 8)) },
    { R: 9000, col: 'hill2', haze: .6, h: b => 110 * smooth((b + 70) / 25) * smooth((70 - b) / 25) * (.45 + .55 * oct(b * .07, 12)) },
  ];
  function ridges(x, cam, st) {
    const d = st.day, k = 1 - .25 * (st.dusk || 0), half = Math.atan(cam.W / 2 / cam.f) + .25, yaw = cam.yaw;
    for (const R of RIDGES) {
      const s = [];
      for (let i = 0; i <= 160; i++) {
        const a = yaw - half + 2 * half * i / 160, X = RO[0] + R.R * Math.sin(a), Z = RO[1] + R.R * Math.cos(a), h = R.h(a / DEG > 180 ? a / DEG - 360 : a / DEG < -180 ? a / DEG + 360 : a / DEG);
        const q = cam.proj([X, Math.max(0, h), Z]); if (q) s.push(q);
      }
      if (s.length < 2) continue;
      x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]));
      x.lineTo(s[s.length - 1][0], cam.H * 3); x.lineTo(s[0][0], cam.H * 3); x.closePath();
      x.fillStyle = mix(COL[R.col](d), COL.skyLow(d), R.haze * k); x.fill();
    }
  }
  const MR = h => MOUND.rb - (MOUND.rb - MOUND.rt) * Math.pow(h / MOUND.h, .85);
  const SQ = (r, n = 40) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a), k = Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(s), 4), -.25); o.push([r * k * c, r * k * s]); } return o; };
  const MOUNDPTS = (() => { const P = []; for (let i = 0; i <= 8; i++) { const h = MOUND.h * i / 8; for (const [a, b] of SQ(MR(h), 32)) P.push([MOUND.x + a, h, MOUND.z + b]); } return P; })();
  const MTREES = Array.from({ length: 70 }, (_, i) => { const h = MOUND.h * (.15 + .85 * Math.sqrt(hash(i, 31))), a = hash(i, 32) * TAU, r = MR(h) * (.97 + .03 * hash(i, 33)); return [MOUND.x + r * Math.cos(a), h, MOUND.z + r * Math.sin(a), 4 + 4 * hash(i, 34)]; });
  function hull2(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  AR.hull2 = hull2;
  function mound(x, cam, st) {
    const d = st.day, s = []; for (const p of MOUNDPTS) { const q = cam.proj(p); if (q) s.push(q); }
    if (s.length < 3) return;
    const hl = hull2(s); path(x, hl);
    const top = cam.proj([MOUND.x, MOUND.h, MOUND.z]), foot = cam.proj([MOUND.x, 0, MOUND.z]); if (!top || !foot) return;
    const g = x.createLinearGradient(0, top[1], 0, foot[1]); g.addColorStop(0, COL.moundLit(d)); g.addColorStop(1, mix(COL.mound(d), COL.groundFar(d), .3));
    x.fillStyle = mix(COL.mound(d), COL.skyLow(d), .25); x.fill(); x.save(); x.clip(); x.globalAlpha = .9; x.fillStyle = g; x.fillRect(-cam.W, top[1] - 2, 3 * cam.W, foot[1] - top[1] + 4); x.restore();
    const sun = (st.sunTop || 0); if (sun > .01) {
      x.save(); path(x, hl); x.clip();
      const yS = lerp(top[1] - 2, foot[1], .55 * sun), gs = x.createLinearGradient(0, top[1] - 2, 0, yS + 6); gs.addColorStop(0, `rgba(255,190,110,${.75 * sun})`); gs.addColorStop(1, 'rgba(255,190,110,0)');
      x.fillStyle = gs; x.fillRect(-cam.W, top[1] - 4, 3 * cam.W, yS - top[1] + 12); x.restore();
    }
    x.fillStyle = mix(COL.tree(d), COL.mound(d), .3);
    for (const [X, Y, Z, r] of MTREES) { const nx = X - MOUND.x, nz = Z - MOUND.z; if ((cam.pos[0] - X) * nx + (cam.pos[2] - Z) * nz <= 0) continue; const q = cam.proj([X, Y, Z]); if (!q) continue; const rr = Math.max(.6, r * q[3]); x.beginPath(); x.ellipse(q[0], q[1] - rr * .6, rr, rr * .8, 0, 0, TAU); x.fill(); }
  }
  const FARTREES = Array.from({ length: 160 }, (_, i) => { const a = hash(i, 41) * TAU, R = 160 + 1100 * Math.pow(hash(i, 42), .7); return [-200 + R * Math.cos(a), 180 + R * Math.sin(a) * .8, 2.6 + 2.2 * hash(i, 43)]; }).filter(([X, Z]) => !(X > -60 && X < 60 && Z > -60 && Z < 90) && Math.hypot(X - MOUND.x, Z - MOUND.z) > MOUND.rb + 30);
  const HOUSES = Array.from({ length: 26 }, (_, i) => { const v = i < 13 ? [620, 260] : [-520, -420]; return [v[0] + 70 * (hash(i, 51) - .5), v[1] + 50 * (hash(i, 52) - .5), 7 + 5 * hash(i, 53), 4 + 3 * hash(i, 54)]; });
  function farLand(x, cam, st) {
    const d = st.day;
    if (cam.pos[1] > 0) {
      const R = 6000, P = [[cam.pos[0] - R, 0, cam.pos[2] - R], [cam.pos[0] + R, 0, cam.pos[2] - R], [cam.pos[0] + R, 0, cam.pos[2] + R], [cam.pos[0] - R, 0, cam.pos[2] + R]];
      if (polyF(x, cam, P)) { const hy = horizonY(cam), g = x.createLinearGradient(0, hy, 0, hy + cam.H * .5); g.addColorStop(0, mix(COL.groundFar(d), COL.skyLow(d), .45)); g.addColorStop(1, COL.groundFar(d)); x.fillStyle = g; x.fill(); }
    }
    const items = [];
    for (const [X, Z, r] of FARTREES) items.push([X, Z, 0, r]);
    for (const [X, Z, w, h] of HOUSES) items.push([X, Z, 1, w, h]);
    const tc = mix(COL.tree(d), COL.skyLow(d), .3), hc = mix(COL.trunk(d), COL.skyLow(d), .35);
    for (const it of items) {
      const q = cam.proj([it[0], 0, it[1]]); if (!q || q[2] < 40 || q[0] < -200 || q[0] > cam.W + 200) continue;
      const k = q[3];
      if (it[2] === 0) { const r = it[3] * k; if (r < .4) continue; x.fillStyle = tc; x.beginPath(); x.ellipse(q[0], q[1] - r * 1.1, r, r * .85, 0, 0, TAU); x.fill(); x.fillRect(q[0] - r * .1, q[1] - r * .4, r * .2, r * .4); }
      else { const w = it[3] * k, h = it[4] * k; if (w < .6) continue; x.fillStyle = hc; x.fillRect(q[0] - w / 2, q[1] - h * .6, w, h * .6); x.beginPath(); x.moveTo(q[0] - w * .6, q[1] - h * .55); x.lineTo(q[0], q[1] - h); x.lineTo(q[0] + w * .6, q[1] - h * .55); x.closePath(); x.fill(); }
    }
  }

  function groundNear(x, cam, st, near, zEdge) {
    if (cam.pos[1] <= 0) return;
    const d = st.day, R = 6000, zc = st.zc ?? 0, cx = cam.pos[0], cz = cam.pos[2];
    const ze = zEdge ?? zc, P = near ? [[cx - R, 0, cz - R], [cx + R, 0, cz - R], [cx + R, 0, ze], [cx - R, 0, ze]] : [[cx - R, 0, zc], [cx + R, 0, zc], [cx + R, 0, cz + R], [cx - R, 0, cz + R]];
    x.save();
    if (!polyF(x, cam, P)) { x.restore(); return; }
    const O = openRing(st); if (!near && O.length > 2) { const s = onFrame(S3.clip(cam, O.map(([X, Z]) => [X, 0, Z])), cam); if (s.length > 2) { s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); } }
    const hy = horizonY(cam), g = x.createLinearGradient(0, hy, 0, cam.H * 1.2); g.addColorStop(0, mix(COL.groundFar(d), COL.skyLow(d), .3)); g.addColorStop(.25, COL.groundFar(d)); g.addColorStop(1, COL.ground(d));
    x.fillStyle = g; x.fill('evenodd'); x.clip('evenodd');
    const ga = x.globalAlpha, z0 = near ? ze - 60 : zc, z1 = near ? ze : 90, NB = 26, fc = COL.furrow(d);
    x.fillStyle = fc; x.globalAlpha = .26 * ga; x.beginPath();
    for (let Z = z0 + .6; Z < z1; Z += 1.1) {
      if (Math.abs(Z - cam.pos[2]) > NB) continue;
      const s = onFrame(S3.clip(cam, [[-120, 0, Z - .2], [120, 0, Z - .2], [120, 0, Math.min(z1, Z + .2)], [-120, 0, Math.min(z1, Z + .2)]]), cam);
      if (s.length > 2) { s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
    }
    x.fill();
    x.strokeStyle = fc; x.globalAlpha = .45 * ga; x.lineWidth = Math.max(1, cam.f / 1500); x.beginPath();
    for (let Z = z0 + .6; Z < z1; Z += 1.1) { if (Math.abs(Z - cam.pos[2]) <= NB) continue; S3.line(x, cam, [-120, 0, Z], [120, 0, Z]); }
    x.stroke(); x.globalAlpha = ga;
    x.restore();
  }
  const TREES = [[-14, 47.5, 1.3], [-22, 52, 1.1], [9, 12, 1.2], [15, 6, 1.4], [-32, 46, 1.2], [22, 25, 1.3], [-6, 49, 1.1], [6, 56, 1.3], [-40, 55, 1.4], [30, 48, 1.2], [-55, 62, 1.3], [48, 70, 1.2], [14, -30, 1.3], [6.2, -10.5, 1.35]];
  function tree(x, cam, X, Z, r, st) {
    const q = cam.proj([X, 0, Z]); if (!q || q[2] < .5) return;
    const k = q[3], d = st.day, h = 2.6 * r;
    x.fillStyle = COL.trunk(d); x.beginPath(); x.moveTo(q[0] - .09 * k, q[1]); x.lineTo(q[0] - .05 * k, q[1] - h * .55 * k); x.lineTo(q[0] + .05 * k, q[1] - h * .55 * k); x.lineTo(q[0] + .09 * k, q[1]); x.closePath(); x.fill();
    x.fillStyle = COL.tree(d);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + hash(X, i), rr = (.55 + .2 * hash(Z, i)) * r * k; x.beginPath(); x.ellipse(q[0] + Math.cos(a) * .55 * r * k, q[1] - (h * .72 + Math.sin(a) * .35 * r) * k, rr, rr * .85, 0, 0, TAU); x.fill(); }
  }
  const FARMERS = [{ p: [-2.45, .95], face: .15, head: .3 }, { p: [-.25, 1.2], face: PI - .1, head: .26 }];
  const WALK = { from: [-17, 3.3], to: [-4.2, 3.3], start: -.4 };
  let WPERF = null;
  const walker = () => WPERF || (WPERF = Mo.perform([{ do: 'walk', dist: (WALK.to[0] - WALK.from[0]) / S3.FIG, gait: 'walk', style: { step: 34, arms: .32 } }, { do: 'wait', for: 60 }], { x: 0, z: 0, yaw: 0, t0: WALK.start }));
  AR.walkerFalls = () => { const f = walker(), wk = f.parts.find(q => q.do === 'walk'); return wk ? wk.fn.falls.map(fl => fl.t) : []; };
  function farmerPal(L) { const ink = L.name === 'lightbox' ? '#0b0a1d' : '#2a241f'; return { ink, coat: ink, trouser: ink, skin: ink, hair: ink, shoe: ink, headColor: ink }; }
  function figure(x, cam, at, facing, pose, L) {
    const fa = S3.figureAt(cam, at, facing); if (!fa) return;
    const c = farmerPal(L), P = { ...L.P, ink: c.ink };
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s);
    Mo.draw(x, P, { ...pose, yaw: fa.yaw + (pose.yawOff || 0) }, { coat: c.coat, trouser: c.trouser, skin: c.skin, hair: c.hair, shoe: c.shoe, head: 'cap', headColor: c.ink, kind: 'man', hands: 'none', shadow: 0, tilt: clamp((cam.pos[1] - at[1] - .9) / Math.max(1, Math.hypot(cam.pos[0] - at[0], cam.pos[2] - at[2])), -.3, .5) });
    x.restore();
  }
  function windlass(x, cam, st) {
    const d = st.day, o = { col: COL.trunk(d), lo: .35, ink: COL.ink(d) };
    for (const [X, Z] of POSTS) S3.box(x, cam, { x0: X - .05, x1: X + .05, y0: 0, y1: ROLLER + .1, z0: Z - .05, z1: Z + .05 }, o);
    S3.bar(x, cam, [POSTS[0][0] - .08, ROLLER, POSTS[0][1]], [POSTS[1][0] + .08, ROLLER, POSTS[1][1]], .07, { ...o, col: mix(COL.trunk(d), COL.ground(d), .25) });
    S3.bar(x, cam, [POSTS[1][0] + .08, ROLLER, POSTS[1][1]], [POSTS[1][0] + .2, ROLLER - .25, POSTS[1][1]], .02, o);
    x.strokeStyle = mix(COL.trunk(d), COL.ink(d), .3); x.lineWidth = Math.max(1, .012 * cam.f / Math.max(.3, cam.depth([WELL.x, ROLLER, .25]))); x.beginPath(); S3.line(x, cam, [WELL.x, ROLLER - .07, .25], [WELL.x + .02, WELL.y0 + .35, .25]); x.stroke();
  }
  function heap(x, cam, st) {
    const d = st.day, c = [-3.6, 1.7], P = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, h = .55 * Math.sin(PI / 2 * u), r = 1.1 * Math.pow(Math.cos(PI / 2 * u), .7) + .04; for (let j = 0; j < 16; j++) { const a = j / 16 * TAU; P.push([c[0] + r * Math.cos(a) * (1 + .1 * hash(j, 61)), h, c[1] + r * Math.sin(a) * .8]); } }
    const s = []; for (const p of P) { const q = cam.proj(p); if (q) s.push(q); } if (s.length < 3) return;
    path(x, hull2(s)); const top = cam.proj([c[0], .55, c[1]]), foot = cam.proj([c[0], 0, c[1]]);
    if (top && foot) { const g = x.createLinearGradient(0, top[1], 0, foot[1]); g.addColorStop(0, mix(COL.earthC(d), '#ffffff', .1 * d)); g.addColorStop(1, COL.earthB(d)); x.fillStyle = g; } else x.fillStyle = COL.earthB(d);
    x.fill();
    S3.bar(x, cam, [c[0] + .25, .3, c[1] - .1], [c[0] + .45, 1.25, c[1] - .05], .018, { col: COL.trunk(d), lo: .4, ink: COL.ink(d) });
    S3.box(x, cam, { x0: c[0] + .12, x1: c[0] + .38, y0: .1, y1: .38, z0: c[1] - .13, z1: c[1] - .1 }, { col: mix('#6f6a62', COL.ink(d), 1 - d), lo: .4, ink: COL.ink(d) });
  }
  function fieldThings(x, cam, st, L) {
    const items = [];
    const wellK = 1 - ss(.2, 1.4, st.zf);
    for (const [X, Z, r] of TREES) if (Z >= 0) items.push([cam.depth([X, 1, Z]), () => tree(x, cam, X, Z, r, st)]);
    if (wellK > 0) {
      items.push([cam.depth([-1.4, .5, .3]), () => windlass(x, cam, st)]);
      items.push([cam.depth([-3.6, .3, 1.7]), () => heap(x, cam, st)]);
      FARMERS.forEach(fm => items.push([cam.depth([fm.p[0], .9, fm.p[1]]), () => figure(x, cam, [fm.p[0], 0, fm.p[1]], fm.face, { ...Mo.stand(0), lean: .05, head: fm.head + .02 * Math.sin((st.farm || 0) * 1.3 + fm.p[0]), arms: [[.05, .12], [.08, .16]] }, L)]));
      const f = walker(), tp = Mo.pose(st.farm || 0), p = f(tp), at = f.at(tp), wx = WALK.from[0] + at.x * S3.FIG;
      items.push([cam.depth([wx, .9, WALK.from[1]]), () => figure(x, cam, [wx, 0, WALK.from[1]], 0, { ...p, hip: [p.hip[0] - at.x, p.hip[1]], feet: p.feet.map(ft => ({ ...ft, at: [ft.at[0] - at.x, ft.at[1]], ax: ft.ax != null ? ft.ax - at.x : ft.ax })), root: [0, 0] }, L)]);
    }
    items.sort((a, b) => b[0] - a[0]);
    for (const [, fn] of items) fn();
  }

  const VARS = [
    { mou: 1, knot: 1, arm: 1 }, { mou: 1, knot: .85, arm: 1 }, { mou: 0, knot: 1.1, arm: 0 }, { mou: 1, knot: .9, arm: 1 },
    { mou: 0, knot: 1, arm: 1 }, { mou: 1, knot: 1.15, arm: 0 }, { mou: 1, knot: .95, arm: 0 }, { mou: 0, knot: .9, arm: 1 },
  ];
  const CLAY = { coat: '#9a8670', trouser: '#85725e', skin: '#a7937c', hair: '#6c5a48', shoe: '#5f4f40', armour: '#6c5b4a', armourEdge: '#4f4236', rivet: '#c2b199', belt: '#5a4a3b' };
  const CLAYN = { coat: '#141230', trouser: '#100f28', skin: '#16142f', hair: '#0c0b1f', shoe: '#0a0a1a', armour: '#0e0d24', armourEdge: '#08081a', rivet: '#2a2650', belt: '#0b0a1d' };
  AR.CLAY = CLAY;
  const ARMOUR = [['U', -15.5, -5, 6.2, 9.9], ['U', -12, -8.8, 9.6, 11], ['U', -6, -9.2, 10.1, 11.1], ['L', -11, -9.3, 10, 11.3], ['L', -5, -9.9, 10.3, 11.6], ['L', 2, -10.8, 10.6, 12], ['L', 6.5, -11, 10.9, 12.2]];
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  function armour(x, pj, col) {
    const yaw = pj.yaw, cy = Math.cos(yaw), sy = Math.sin(yaw), U = v => add(pj.waist, rot(v, pj.a2)), L1 = v => add(pj.hip, rot(v, pj.a1));
    const secs = ARMOUR.map(([fr, y, back, front, b]) => { const f = fr === 'U' ? U : L1; return [f([back, y]), f([front, y]), b]; });
    const E = secs.map(([B, Fr, b]) => { const C = [(B[0] + Fr[0]) / 2, (B[1] + Fr[1]) / 2], A = [(Fr[0] - B[0]) / 2, (Fr[1] - B[1]) / 2], ph = Math.atan2(-b * sy, A[0] * cy); const at = p => [C[0] * cy + A[0] * cy * Math.cos(p) - b * sy * Math.sin(p), C[1] + A[1] * Math.cos(p)]; return { C, A, b, e: [at(ph), at(ph + PI)] }; });
    x.fillStyle = col.armour; x.beginPath();
    for (let i = 1; i < E.length; i++) { const q = hull2([...E[i - 1].e, ...E[i].e]); if (q.length < 3) continue; q.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); }
    x.fill();
    x.strokeStyle = col.armourEdge; x.lineWidth = .55; x.fillStyle = col.rivet;
    for (let i = 1; i < E.length - 1; i++) {
      const { C, A, b } = E[i], pts = [];
      for (let k = 0; k < 32; k++) { const p = k / 32 * TAU, X = C[0] * cy + A[0] * cy * Math.cos(p) - b * sy * Math.sin(p), Y = C[1] + A[1] * Math.cos(p), dep = A[0] * Math.cos(p) * sy + b * Math.sin(p) * cy; pts.push([X, Y, dep]); }
      x.beginPath(); for (let k = 0; k < 32; k++) { const a = pts[k], c = pts[(k + 1) % 32]; if (a[2] < 0 || c[2] < 0) continue; x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); } x.stroke();
      for (let k = 0; k < 32; k += 2) { const [X, Y, dep] = pts[k]; if (dep < .8) continue; x.beginPath(); x.arc(X, Y - 1.4, .55, 0, TAU); x.fill(); }
    }
  }
  function topknot(x, pj, col, part, kn = 1) {
    const H = pj.headP, yaw = pj.yaw, sy = Math.sin(yaw), cy = Math.cos(yaw);
    const s = 3.4, f = -2.4, dep = f * sy + s * cy;
    if ((part === 'far') !== (dep < 0)) return;
    const X = H[0] + f * cy - s * sy, Y = H[1] - 7.6;
    x.fillStyle = col.hair; x.beginPath(); x.ellipse(X, Y, 3.1 * kn, 2.7 * kn, -.3, 0, TAU); x.fill();
    x.strokeStyle = col.belt; x.lineWidth = .8; x.beginPath(); x.moveTo(X - 2.2, Y + 1.5); x.lineTo(X + 1.8, Y - 1.8); x.stroke();
  }
  const POSE = (() => { const p = Mo.stand(0); return { ...p, lean: .01, head: .03, feet: [Mo.foot(-.7), Mo.foot(.7)], arms: [[.04, .1], [.12, 1.15]], hands: [{ pose: 'fist', k: .6 }, { pose: 'fist', k: .9 }] }; })();
  AR.POSE = POSE;
  function soldier(x, v, yaw, P, dark, tilt = .12) {
    const V = VARS[v], col = dark ? CLAYN : CLAY;
    const pose = { ...POSE, yaw };
    let pjH = null;
    Mo.draw(x, { ...P, ink: dark ? '#08081a' : '#3a3026' }, pose, {
      coat: col.coat, trouser: col.trouser, skin: col.skin, hair: col.hair, shoe: col.shoe, head: 'bare', headColor: col.hair, kind: 'man',
      moustache: V.mou ? col.hair : null, beard: null, headTurn: true, shadow: 0, tilt,
      behind: (xx, pj) => { pjH = pj; },
      prop: (xx, pj) => {
        const H = [pj.head[0] * Math.cos(yaw), pj.head[1]]; pj.headP = H;
        if (V.arm) armour(xx, pj, col); else { xx.fillStyle = col.belt; xx.fillRect(pj.hip[0] * Math.cos(yaw) - 11, pj.hip[1] - 2.5, 22, 2.4); }
        topknot(xx, pj, col, 'near', V.knot);
      },
    });
  }
  AR.soldierDraw = soldier;
  const SPR = new Map(), YB = 32, YMAX = 1.6, PB = 8, GUT = 3;
  const SIZES = [1.15, 2.7];
  function page(si, dark, blk, P) {
    const sc = SIZES[si], w = Math.ceil(84 * sc), h = Math.ceil(118 * sc), cw = w + 2 * GUT, ch = h + 2 * GUT;
    const [cv, x] = F.canvas(cw * PB, ch * VARS.length);
    for (let v = 0; v < VARS.length; v++) for (let j = 0; j < PB && blk * PB + j < YB; j++) {
      const yb = blk * PB + j, sx = j * cw + GUT, sy = v * ch + GUT;
      x.save(); x.beginPath(); x.rect(sx, sy, w, h); x.clip();
      x.translate(sx + w / 2, sy + h - 8 * sc); x.scale(sc, sc);
      soldier(x, v, yb / (YB - 1) * YMAX, P, dark);
      x.restore();
      SPR.set(`${v}|${yb}|${si}|${dark ? 1 : 0}`, { cv, sx, sy, w, h, ox: w / 2, oy: h - 8 * sc, sc });
    }
  }
  function sprite(v, yb, si, dark, P) {
    const key = `${v}|${yb}|${si}|${dark ? 1 : 0}`;
    if (!SPR.has(key)) page(si, dark, yb / PB | 0, P);
    return SPR.get(key);
  }
  const stamp = (x, sp, X, Y, k) => x.drawImage(sp.cv, sp.sx, sp.sy, sp.w, sp.h, X - sp.ox * k, Y - sp.oy * k, sp.w * k, sp.h * k);
  AR.sprite = sprite; AR.stamp = stamp;

  const HEADS = [
    { nose: [11.4, 3.2], mou: 'curl', beard: false, brow: 1 },
    { nose: [11.0, 3.6], mou: 'straight', beard: true, brow: .7 },
  ];
  AR.HEADS = HEADS;
  function clayHead(x, n, col, rim) {
    const H = HEADS[n];
    x.fillStyle = mix(col.hair, col.skin, .3); x.beginPath(); x.ellipse(-3.2, -12.2, 3.8, 3.2, -.35, 0, TAU); x.fill();
    const P = [[-1, -12.2], [3.6, -10.6], [6.6, -7.4], [8.0, -4.8], [8.7 + .3 * H.brow, -3.1], [8.0, -2.0], [8.4, -1.1], [H.nose[0], H.nose[1]], [9.6, 4.3], [9.3, 4.9], [9.7, 5.9], [8.8, 6.5], [9.5, 7.1], [8.5, 8.1], [9.1, 10.0], [7.4, 11.6], [4.6, 12.0], [3.6, 12.4], [3.4, 16.5], [-4.2, 16.5], [-5.2, 9.0], [-8.8, 3.6], [-9.6, -1.4], [-8.2, -7.6], [-5.2, -11.0]];
    x.fillStyle = col.skin; x.beginPath(); P.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
    x.fillStyle = mix(col.hair, col.skin, .45); x.beginPath(); x.moveTo(5.6, -8.6); x.quadraticCurveTo(2.6, -6.6, 2.3, -3.2); x.quadraticCurveTo(1.6, 0, 1.4, 2.6); x.lineTo(-1.2, 3.4); x.lineTo(-5.4, 8.6); x.lineTo(-8.8, 3.6); x.lineTo(-9.6, -1.4); x.lineTo(-8.2, -7.6); x.lineTo(-5.2, -11.0); x.lineTo(-1, -12.2); x.lineTo(3.6, -10.6); x.closePath(); x.fill();
    x.strokeStyle = col.shade; x.lineWidth = .32;
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(1.6 - i * 1.6, 2.4 + i * .9); x.quadraticCurveTo(-1.5 - i * 1.2, -4 - i * .3, -3.2 + i * .1, -10.4); x.stroke(); }
    x.fillStyle = col.skin; x.beginPath(); x.ellipse(-.6, 1.2, 2.1, 3.3, .15, 0, TAU); x.fill();
    x.strokeStyle = col.shade; x.lineWidth = .45; x.beginPath(); x.ellipse(-.4, 1.2, 1.1, 2.1, .15, -1.2, 2.4); x.stroke();
    x.strokeStyle = col.line; x.lineWidth = .55; x.beginPath(); x.moveTo(5.4, -1.5); x.quadraticCurveTo(6.6, -2.3, 7.5, -1.3); x.quadraticCurveTo(6.6, -.8, 5.4, -1.5); x.stroke();
    x.beginPath(); x.moveTo(5.0, -3.0); x.quadraticCurveTo(6.6, -3.9, 8.2, -3.0); x.stroke();
    x.lineWidth = .35; x.beginPath(); x.moveTo(8.6, 3.6); x.quadraticCurveTo(7.6, 4.4, 8.4, 4.9); x.stroke();
    x.beginPath(); x.moveTo(4.4, 1.4); x.quadraticCurveTo(6.6, 3.6, 6.4, 6.6); x.stroke();
    x.fillStyle = col.hair;
    if (H.mou === 'curl') { x.beginPath(); x.moveTo(9.4, 4.7); x.quadraticCurveTo(8.0, 5.5, 6.3, 4.9); x.quadraticCurveTo(5.4, 4.3, 5.6, 3.1); x.quadraticCurveTo(6.4, 4.4, 7.8, 4.5); x.closePath(); x.fill(); }
    else { x.beginPath(); x.moveTo(9.4, 4.7); x.quadraticCurveTo(8.0, 5.7, 6.0, 6.0); x.lineTo(6.2, 5.2); x.quadraticCurveTo(7.8, 4.8, 9.0, 4.4); x.closePath(); x.fill(); }
    x.strokeStyle = col.line; x.lineWidth = .45; x.beginPath(); x.moveTo(9.4, 6.5); x.lineTo(7.8, 6.6); x.stroke();
    if (H.beard) { x.beginPath(); x.moveTo(9.2, 7.6); x.quadraticCurveTo(9.6, 9.6, 8.6, 11.8); x.quadraticCurveTo(7.4, 12.6, 6.8, 11.4); x.quadraticCurveTo(7.6, 9.4, 8.0, 7.9); x.closePath(); x.fill(); }
    x.strokeStyle = col.line; x.lineWidth = .7; x.beginPath(); x.moveTo(-5.4, -10.2); x.lineTo(-1.6, -13.4); x.stroke();
    x.fillStyle = col.armour; x.beginPath(); x.moveTo(-6.4, 14.2); x.quadraticCurveTo(0, 12.6, 5.6, 14.0); x.lineTo(6.6, 18.4); x.lineTo(-7.4, 18.4); x.closePath(); x.fill();
    if (rim > .01) {
      x.strokeStyle = `rgba(255,236,196,${.85 * rim})`; x.lineWidth = .7; x.lineJoin = 'round'; x.beginPath();
      [[-1, -12.2], [3.6, -10.6], [6.6, -7.4], [8.0, -4.8], [8.7 + .3 * H.brow, -3.1], [8.0, -2.0], [8.4, -1.1], [H.nose[0], H.nose[1]]].forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
      x.stroke(); x.beginPath(); x.moveTo(9.7, 5.9); x.lineTo(9.5, 7.1); x.moveTo(8.5, 8.1); x.lineTo(9.1, 10.0); x.stroke();
    }
  }
  AR.clayHead = clayHead;

  const STRATA = [[0, 'earth0'], [-.35, 'earthA'], [-1.1, 'earthB'], [-1.8, 'earthC'], [-2.6, 'earthA'], [-3.3, 'earthD'], [-4.1, 'earthC'], [-5.0, 'earthB'], [-6.4, 'earthD'], [-8.5, 'earthA'], [-12, 'earthD']];
  function strataFace(x, cam, quad, st, shade = 0) {
    const d = st.day;
    x.save(); if (!polyF(x, cam, quad)) { x.restore(); return false; } x.clip();
    const [a, b] = [quad[0], quad[1]], yTop = Math.max(a[1], b[1]), yBot = Math.min(quad[2][1], quad[3][1]);
    for (let i = 0; i < STRATA.length; i++) {
      const y0 = Math.min(yTop, STRATA[i][0]), y1 = i + 1 < STRATA.length ? STRATA[i + 1][0] : -60; if (y0 <= yBot - .01 && i) continue; if (y1 >= yTop) continue;
      const P = [], n = 24, wv = (u, k) => k ? .09 * F.noise1(u * 9 + k * 3.1, 40 + k) : 0;
      for (let j = 0; j <= n; j++) { const u = j / n; P.push([lerp(a[0], b[0], u), y0 + wv(u * Math.hypot(b[0] - a[0], b[2] - a[2]) / 8, i), lerp(a[2], b[2], u)]); }
      for (let j = n; j >= 0; j--) { const u = j / n; P.push([lerp(a[0], b[0], u), Math.max(yBot - 1, y1 + wv(u * Math.hypot(b[0] - a[0], b[2] - a[2]) / 8, i + 1)), lerp(a[2], b[2], u)]); }
      if (polyF(x, cam, P)) { x.fillStyle = shade ? mix(COL[STRATA[i][1]](d), COL.ink(d), shade) : COL[STRATA[i][1]](d); x.fill(); }
    }
    x.restore();
    return true;
  }
  AR.strataFace = strataFace;
  function wallPieces(st) {
    const out = [];
    for (let k = 0; k < WALLS.length; k++) {
      const [z0, z1] = WALLS[k];
      for (let X1 = WALL_X[1]; X1 > WALL_X[0]; X1 -= 2.5) {
        const X0 = Math.max(WALL_X[0], X1 - 2.5);
        if (inEarth(st, X1, z0) > 0) continue;
        out.push({ X0, X1, z0, z1, c: [(X0 + X1) / 2, FLOOR + WALL_H / 2, (z0 + z1) / 2] });
      }
    }
    return out;
  }
  function wallPiece(x, cam, w, st) {
    const d = st.day, y0 = FLOOR, y1 = FLOOR + WALL_H, { X0, X1, z0, z1 } = w;
    const faces = [
      [[[X0, y1, z0], [X1, y1, z0], [X1, y1, z1], [X0, y1, z1]], [0, 1, 0], COL.wallTop(d)],
      [[[X0, y0, z0], [X1, y0, z0], [X1, y1, z0], [X0, y1, z0]], [0, 0, -1], COL.wallSide(d)],
      [[[X1, y0, z1], [X0, y0, z1], [X0, y1, z1], [X1, y1, z1]], [0, 0, 1], mix(COL.wallSide(d), COL.ink(d), .15)],
      [[[X1, y0, z0], [X1, y0, z1], [X1, y1, z1], [X1, y1, z0]], [1, 0, 0], mix(COL.wallSide(d), COL.wallTop(d), .35)],
      [[[X0, y0, z1], [X0, y0, z0], [X0, y1, z0], [X0, y1, z1]], [-1, 0, 0], mix(COL.wallSide(d), COL.ink(d), .1)],
    ];
    for (const [P0, n, col] of faces) {
      if (!S3.facing(cam, P0[0], n)) continue;
      let P = cut3(P0, [-SLOPE, 0, 1], st.zf); P = cut3(P, [-1, 0, -WSLOPE], -st.xw); if (P.length < 3) continue;
      if (polyF(x, cam, P)) { x.fillStyle = col; x.fill(); x.strokeStyle = col; x.lineWidth = 1; x.stroke(); }
    }
  }
  let CULL = null;
  function soldierAt(x, cam, s, P, dark, a = 1) {
    const fa = S3.figureAt(cam, [s.x, FLOOR, s.z], 0); if (!fa) return null;
    const hpx = 92 * fa.s * s.s; if (hpx < 3 || fa.sx < -200 || fa.sx > cam.W + 200 || fa.sy < -50 || fa.sy - hpx > cam.H + 50) return fa;
    if (CULL && (fa.sx + hpx < CULL[0] || fa.sx - hpx > CULL[2] || fa.sy + .2 * hpx < CULL[1] || fa.sy - 1.4 * hpx > CULL[3])) return fa;
    let yaw = fa.yaw; while (yaw > PI) yaw -= TAU; while (yaw < -PI) yaw += TAU;
    const ya = clamp(Math.abs(yaw), 0, YMAX), yb = Math.round(ya / YMAX * (YB - 1));
    x.save(); x.globalAlpha *= a;
    if (hpx > 280 || Math.abs(yaw) > YMAX + .2) {
      x.translate(fa.sx, fa.sy); x.scale(fa.s * s.s, fa.s * s.s); soldier(x, s.v, yaw, P, dark, clamp((cam.pos[1] - FLOOR - .9) / Math.max(1, Math.hypot(cam.pos[0] - s.x, cam.pos[2] - s.z)), -.2, .5));
    } else {
      const sp = sprite(s.v, yb, hpx > 110 ? 1 : 0, dark, P);
      stamp(x, sp, fa.sx, fa.sy, fa.s * s.s / sp.sc);
    }
    x.restore();
    return fa;
  }
  AR.soldierAt = soldierAt;
  function foundHead(x, cam, s, n, st, P) {
    const fa = S3.figureAt(cam, [s.x, FLOOR, s.z], 0); if (!fa) return;
    const J = Mo.joints({ ...POSE, yaw: fa.yaw }), H = [J.head[0] * Math.cos(fa.yaw), J.head[1]], k = fa.s * s.s;
    if (92 * k < 160) return;
    const col = { ...CLAY, shade: '#6e5d4c', line: '#4a3c30', armour: CLAY.armour };
    x.save(); x.translate(fa.sx + H[0] * k, fa.sy + (H[1] - 1.2) * k); x.scale(k * .62, k * .62);
    clayHead(x, n, col, (st.found || [0, 0])[n]);
    x.restore();
  }
  function pit(x, cam, st, L) {
    const d = st.day, O = openRing(st), dark = L.name === 'lightbox', P = L.P;
    if (O.length < 3) return;
    if (polyF(x, cam, O.map(([X, Z]) => [X, FLOOR, Z]))) { x.fillStyle = COL.pitFloor(d); x.fill(); }
    const faces = [], zc = st.zc ?? 0;
    for (let i = 0; i < O.length; i++) {
      const a = O[i], b = O[(i + 1) % O.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < .01) continue;
      const on = (f, c) => Math.abs(f(a) - c) < 1e-6 && Math.abs(f(b) - c) < 1e-6;
      if (on(p => p[1], 0) && zc > -.001 && (st.cut ?? 0) > .001 && cam.pos[2] < 0) continue;
      const kind = on(p => p[1] - SLOPE * p[0], st.zf) ? 'front' : on(p => p[0] + WSLOPE * p[1], st.xw) ? 'west' : 'wall';
      faces.push({ q: [[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], FLOOR, b[1]], [a[0], FLOOR, a[1]]], n: [-dz / L, 0, dx / L], kind });
    }
    for (const f of faces) if (S3.facing(cam, f.q[0], f.n)) { strataFace(x, cam, f.q, st, .12); f.seen = true; }
    for (const s of SOL) {
      const e = inEarth(st, s.x, s.z); if (e <= 0 || e > .7) continue;
      const wave = s.x >= (st.wave ?? 1e9) ? 1 : 0; if (!wave && !s.found) continue;
      const face = (s.z - Math.max(0, zFront(st, s.x))) >= (xWest(st, s.z) - s.x) ? faces.find(f => f.kind === 'front') : faces.find(f => f.kind === 'west');
      if (!face || !face.seen) continue;
      x.save(); if (polyF(x, cam, face.q)) { x.clip(); soldierAt(x, cam, s, P, dark, (1 - e / .7) * .85); } x.restore();
    }
    const items = [];
    for (const w of wallPieces(st)) items.push([cam.depth(w.c), 0, w]);
    for (const s of SOL) { if (inEarth(st, s.x, s.z) > 0) continue; items.push([cam.depth([s.x, FLOOR + .9, s.z]), 1, s]); }
    items.sort((a, b) => b[0] - a[0]);
    for (const [dep, kind, it] of items) {
      if (dep < .1) continue;
      if (kind === 0) wallPiece(x, cam, it, st);
      else {
        const e = -inEarth(st, it.x, it.z), a = clamp(.85 + e / .5 * .15);
        soldierAt(x, cam, it, P, dark, a);
        const n = FOUND.indexOf(it); if (n >= 0) foundHead(x, cam, it, n, st, P);
      }
    }
  }
  AR.pit = pit;

  const SCR = new Map();
  function fadeDown(x, box, y0, y1, fn) {
    const W = x.canvas.width, H = x.canvas.height, key = W + 'x' + H; if (!SCR.has(key)) SCR.set(key, F.canvas(W, H));
    const [cv, c] = SCR.get(key), bx = Math.max(0, Math.floor(box[0])), by = Math.max(0, Math.floor(box[1])), bw = Math.min(W, Math.ceil(box[2])) - bx, bh = Math.min(H, Math.ceil(box[3])) - by;
    if (bw <= 0 || bh <= 0) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.clearRect(bx, by, bw, bh);
    c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); fn(c); c.restore();
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'destination-in'; c.fillStyle = g; c.fillRect(bx, by, bw, bh); c.globalCompositeOperation = 'source-over';
    const m = x.getTransform(); x.save(); x.setTransform(1, 0, 0, 1, m.e, m.f); x.drawImage(cv, bx, by, bw, bh, bx, by, bw, bh); x.restore();
  }

  function shaftPath(st) { return [[WELL.x - WELL.r, 0, 0], [WELL.x + WELL.r, 0, 0], [WELL.x + WELL.r, WELL.y0, 0], [WELL.x - WELL.r, WELL.y0, 0]]; }
  function shaftInside(x, cam, st) {
    const d = st.day, N = 18, Rr = WELL.r;
    for (let i = 0; i < N; i++) {
      const a0 = i / N * PI, a1 = (i + 1) / N * PI, p = (a, y) => [WELL.x + Rr * Math.cos(a), y, Rr * Math.sin(a)];
      if (!polyF(x, cam, [p(a0, 0), p(a1, 0), p(a1, WELL.y0), p(a0, WELL.y0)])) continue;
      const top = cam.proj(p((a0 + a1) / 2, 0)), bot = cam.proj(p((a0 + a1) / 2, WELL.y0)), side = .25 + .75 * Math.sin((a0 + a1) / 2);
      if (top && bot) { const g = x.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, mix(COL.earthC(d), '#fff2d6', .35 * d * side)); g.addColorStop(.55, COL.earthB(d)); g.addColorStop(1, mix(COL.earthD(d), COL.ink(d), .35)); x.fillStyle = g; } else x.fillStyle = COL.earthB(d);
      x.fill(); x.strokeStyle = x.fillStyle; x.lineWidth = 1; x.stroke();
    }
    const fl = []; for (let i = 0; i <= N; i++) { const a = i / N * PI; fl.push([WELL.x + Rr * Math.cos(a), WELL.y0, Rr * Math.sin(a)]); }
    if (polyF(x, cam, fl)) { x.fillStyle = mix(COL.earthD(d), COL.ink(d), .2); x.fill(); }
    x.strokeStyle = mix(COL.trunk(d), COL.ink(d), .2); x.lineWidth = Math.max(1, .012 * cam.f / Math.max(.3, cam.depth([WELL.x, -1.5, .25]))); x.beginPath(); S3.line(x, cam, [WELL.x, 0, .25], [WELL.x + .02, WELL.y0 + .32, .25]); x.stroke();
    S3.cyl(x, cam, [WELL.x + .02, .25], .17, WELL.y0, WELL.y0 + .26, { col: mix('#8a6a3e', COL.ink(d), 1 - d), lo: .35, ink: COL.ink(d), n: 12 });
  }
  function face(x, cam, st, L) {
    const zc = st.zc ?? 0, atPit = zc > -.001;
    if (cam.pos[2] >= zc - .003) return;
    const d = st.day, xo = st.zf > 0 ? Math.max(xWest(st, 0), -st.zf / SLOPE) : null, wellK = 1 - ss(.2, 1.4, st.zf);
    const holes = [];
    if (atPit && wellK > 0 && (xo == null || WELL.x + WELL.r < xo)) holes.push(shaftPath(st));
    if (atPit && xo != null && xo < PE) holes.push([[xo, 0, 0], [PE, 0, 0], [PE, FLOOR, 0], [xo, FLOOR, 0]]);
    x.save(); x.beginPath(); let any = false;
    for (const h of holes) { const s = onFrame(S3.clip(cam, h), cam); if (s.length < 3) continue; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); any = true; }
    if (any) { x.clip(); if (wellK > 0 && (xo == null || WELL.x + WELL.r < xo)) shaftInside(x, cam, st); }
    x.restore();
    x.save();
    const ring = pts => { const s = onFrame(S3.clip(cam, pts), cam); if (s.length < 3) return false; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
    x.beginPath(); if (!ring([[-400, 0, zc], [400, 0, zc], [400, -40, zc], [-400, -40, zc]])) { x.restore(); return; }
    for (const h of holes) ring(h);
    x.clip('evenodd');
    strataFace(x, cam, [[-400, 0, zc], [400, 0, zc], [400, -40, zc], [-400, -40, zc]], st);
    for (let i = 0; i < 90; i++) {
      const X = -40 + 70 * hash(i, 71), Y = -.3 - 9 * hash(i, 72), r = .03 + .12 * hash(i, 73) * hash(i, 74), q = cam.proj([X, Y, zc]); if (!q || q[0] < -60 || q[0] > cam.W + 60 || q[1] < -60 || q[1] > cam.H + 60) continue;
      x.fillStyle = mix(COL.earthD(d), COL.ink(d), .25 + .2 * hash(i, 75)); x.beginPath(); x.ellipse(q[0], q[1], r * q[3], r * q[3] * .6, hash(i, 76) * 3, 0, TAU); x.fill();
    }
    x.strokeStyle = mix(COL.trunk(d), COL.earth0(d), .4); x.lineWidth = Math.max(1, cam.f / 1400); x.beginPath();
    for (let i = 0; i < 26; i++) { const X = -30 + 50 * hash(i, 81); let p = [X, -.02, zc]; for (let j = 0; j < 4; j++) { const q = [p[0] + .25 * (hash(i, 82 + j) - .5), p[1] - .14 - .1 * hash(i, 86 + j), zc]; S3.line(x, cam, p, q); p = q; } }
    x.stroke();
    const P = L.P, dark = L.name === 'lightbox';
    if (atPit) for (const s of SOL) {
      if (s.z > .9) continue;
      const free = inEarth(st, s.x, s.z) <= 0; if (free) continue;
      const n = FOUND.indexOf(s), k = n >= 0 ? (st.found || [0, 0])[n] : (s.x >= (st.wave ?? 1e9) ? 1 : 0);
      if (k <= .01) continue;
      const fa = S3.figureAt(cam, [s.x, FLOOR, s.z], 0); if (!fa) continue;
      const hs = fa.s * s.s, top = fa.sy - 100 * hs;
      fadeDown(x, [fa.sx - 50 * hs, top, fa.sx + 50 * hs, fa.sy + 4 * hs], fa.sy - 66 * hs, fa.sy - 36 * hs, c => soldierAt(c, cam, s, P, dark, k * (n >= 0 ? 1 : .6)));
      if (n >= 0) foundHead(x, cam, s, n, st, P);
    }
    x.restore();
  }

  const SPRG = new Map();
  function glowSprite(col) {
    let c = SPRG.get(col); if (c) return c;
    const [cv, x] = F.canvas(128, 128), n = parseInt(col.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.3, `rgba(${r},${g},${b},.5)`); gr.addColorStop(.65, `rgba(${r},${g},${b},.14)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); SPRG.set(col, cv); return cv;
  }
  const glow = (ctx, X, Y, r, col, a, sy = 1) => { if (!(a > .003) || !(r > .5)) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(glowSprite(col), X - r, Y - r * sy, 2 * r, 2 * r * sy); ctx.restore(); };
  AR.glow = glow;
  AR.CROWN = () => [FOUND[0].x + .03, FLOOR + 1.84 * FOUND[0].s, 0];
  function lights(ctx, cam, st) {
    const sh = F.SHIFT || { x: 0, y: 0 }, W = cam.W;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    const gk = st.glint || 0;
    if (gk > .01 && cam.pos[2] < 0) {
      const q = cam.proj(AR.CROWN()); if (q) {
        glow(ctx, q[0], q[1], Math.min(W * .2, 160 + 60 * gk), '#ffcf7a', .5 * gk); glow(ctx, q[0], q[1], 26, '#fff4dc', .9 * gk);
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,236,190,${.55 * gk})`; ctx.lineCap = 'round';
        for (const [dx, dy, L] of [[1, 0, 90], [-1, 0, 90], [0, 1, 60], [0, -1, 60]]) { const g = ctx.createLinearGradient(q[0], q[1], q[0] + dx * L * gk, q[1] + dy * L * gk); g.addColorStop(0, `rgba(255,236,190,${.7 * gk})`); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + dx * L * gk, q[1] + dy * L * gk); ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    const sk = st.strike || 0;
    if (sk > .01) { const q = cam.proj(AR.CROWN()); if (q) { glow(ctx, q[0], q[1], Math.min(W * .12, 90), '#fff1d6', .7 * sk); } }
    (st.found || []).forEach((k, n) => { if (k <= .01) return; const s = FOUND[n], q = cam.proj([s.x + .06, FLOOR + 1.68 * s.s, 0]); if (q) glow(ctx, q[0], q[1], Math.min(W * .25, .45 * q[3]), '#ffd9a0', .22 * k * (st.day > .5 ? .7 : 1)); });
    if (st.run != null) for (const s of SOL) { if (s.z > 1 || Math.abs(s.x - st.run) > 4) continue; if (inEarth(st, s.x, s.z) > 0) continue; const q = cam.proj([s.x + .08, FLOOR + 1.66 * s.s, s.z]); if (!q) continue; const k = Math.exp(-Math.pow((s.x - st.run) / 1.4, 2)); glow(ctx, q[0], q[1], Math.min(W * .1, .35 * q[3]), '#ffe2b0', .5 * k); }
    const sv = st.silver || 0;
    if (sv > .01) {
      const c = cam.proj([MOUND.x, -24, MOUND.z]), hy = horizonY(cam);
      if (c) {
        const s = []; for (const p of MOUNDPTS) { const q = cam.proj(p); if (q) s.push(q); }
        const r = Math.min(W * .4, 210 * c[3]);
        ctx.save(); ctx.beginPath();
        if (s.length > 2) hull2(s).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
        ctx.closePath(); ctx.clip();
        glow(ctx, c[0], c[1], r * 1.2, '#9fb0dc', .42 * sv, .55); glow(ctx, c[0], c[1], r * .55, '#dfe6ff', .24 * sv, .45);
        const nk = .45 + .55 * (st.night || 0), fl = st.flow || 0;
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const rgt = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
        for (let i = 0; i < 5; i++) {
          const h = 4 + 4.2 * i + 1.2 * Math.sin(i * 2.3), half = (MR(h) - 16) * .92, pts = [], dir = i % 2 ? 1 : -1;
          for (let k = 0; k <= 40; k++) { const u = k / 40, s = -half + 2 * half * u, q = cam.proj([MOUND.x + rgt[0] * s, h + 1.8 * Math.sin(u * 6 + i * 1.9) + .7 * Math.sin(u * 15 + i), MOUND.z + rgt[2] * s]); if (q) pts.push([q[0], q[1], u, q[3]]); }
          if (pts.length < 2) continue;
          const lw = Math.max(1, .9 * pts[0][3]), p0 = pts[0], p1 = pts[pts.length - 1], al = sv * nk;
          const gw = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]), gs = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
          for (let k = 0; k <= 16; k++) {
            const u = k / 16, e = Math.min(1, u / .18, (1 - u) / .18), wave = .3 + .7 * Math.pow(.5 + .5 * Math.sin((u * 3 - dir * fl * .7 + i * .37) * Math.PI * 2), 2);
            gs.addColorStop(u, `rgba(170,188,240,${.16 * al * e})`); gw.addColorStop(u, `rgba(238,243,255,${.52 * al * e * wave})`);
          }
          ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
          ctx.lineCap = 'butt'; ctx.strokeStyle = gs; ctx.lineWidth = lw * 2.6; ctx.stroke();
          ctx.strokeStyle = gw; ctx.lineWidth = lw; ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(c[0] - 1.6 * r, hy, 3.2 * r, Math.max(2, .35 * r)); ctx.clip();
        glow(ctx, c[0], hy, r * 1.1, '#9fb0dc', .16 * sv, .12); ctx.restore();
      }
    }
    ctx.restore();
  }

  AR.frame = (ctx, L, cam, st, o = {}) => {
    const W = cam.W, H = cam.H, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2], dark = L.name === 'lightbox';
    L.background(ctx);
    L.sheet(ctx, ID, 1, RC, x => { sky(x, cam, st); ridges(x, cam, st); mound(x, cam, st); farLand(x, cam, st); }, { rim: false, shadow: false, fibre: dark ? .25 : .5 });
    const zc = st.zc ?? 0, cutK = st.cut ?? 0, below = cam.pos[1] < 0;
    const covered = !below && st.zr != null && st.zr >= zc - 1e-3;
    let gap = null;
    if (!below && st.zr != null && !covered && cam.pos[2] < zc) {
      const X0 = cam.pos[0] - 6000, X1 = cam.pos[0] + 6000, g = onFrame(S3.clip(cam, [[X0, 0, st.zr - .3], [X1, 0, st.zr - .3], [X1, 0, zc + .05], [X0, 0, zc + .05]]), cam);
      gap = g.length > 2 ? g : [];
    }
    L.sheet(ctx, ID, 1, RC, x => {
      groundNear(x, cam, st, false);
      if (covered) groundNear(x, cam, st, true, zc + .02);
      if (below) fieldThings(x, cam, st, L);
      const R = [], O = openRing(st), above = cam.pos[1] > 0;
      if (O.length > 2 && above) { const s = onFrame(S3.clip(cam, O.map(([X, Z]) => [X, 0, Z])), cam); if (s.length > 2) R.push(s); }
      const xo = st.zf > 0 ? Math.max(xWest(st, 0), -st.zf / SLOPE) : null;
      if (xo != null && xo < PE && cam.pos[2] < 0 && zc > -.001 && cutK > .01 && !covered) {
        const yt = R.length ? .05 : 0;
        let s = onFrame(S3.clip(cam, [[xo, yt, 0], [PE, yt, 0], [PE, FLOOR, 0], [xo, FLOOR, 0]]), cam); if (gap) s = clipConvex(s, gap); if (s.length > 2) R.push(s);
      }
      R.forEach((s, i) => {
        x.save(); x.beginPath(); s.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.clip();
        CULL = i ? [Math.min(...s.map(q => q[0])), Math.min(...s.map(q => q[1])), Math.max(...s.map(q => q[0])), Math.max(...s.map(q => q[1]))] : null;
        pit(x, cam, st, L); CULL = null;
        x.restore();
      });
      if (!below) fieldThings(x, cam, st, L);
    }, { rimAlpha: dark ? .5 : .4, glow: .1, glowColor: '#ffc27a', glowBlur: 10, fibre: dark ? .3 : .6, paperShadow: [3, 4, 4, .28], shadow: dark || below });
    const faceOn = (cutK > .001 || below) && cam.pos[2] < zc && !covered;
    if (faceOn && !gap) L.sheet(ctx, ID, 1, RC, x => face(x, cam, st, L), { rimColor: dark ? '#ffc978' : null, rimAlpha: dark ? .45 : .35, glow: .12, glowColor: '#ffae4a', glowBlur: 12, fibre: dark ? .35 : .7, paperShadow: [4, 6, 6, .3] });
    if (cutK < .999 && cam.pos[1] > 0) L.sheet(ctx, ID, 1, RC, x => { x.globalAlpha = 1 - cutK; groundNear(x, cam, st, true); for (const [X, Z, r] of TREES) if (Z < 0) tree(x, cam, X, Z, r, st); }, { rim: false, shadow: false, fibre: dark ? .25 : .5 });
    if (st.zr != null && cam.pos[1] > 0 && st.zr > cam.pos[2] - 50 && !covered) L.sheet(ctx, ID, 1, RC, x => {
      if (faceOn && gap && gap.length > 2) { x.save(); x.beginPath(); gap.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.clip(); face(x, cam, st, L); x.restore(); }
      groundNear(x, cam, st, true, Math.min(st.zr, zc));
    }, { rim: false, shadow: false, fibre: dark ? .25 : .5 });
    if (o.near) L.sheet(ctx, ID, 1, RC, x => o.near(x, cam), { shadow: false, rimAlpha: .3, blur: o.nearBlur ?? 6, fibre: .2 });
    lights(ctx, cam, st);
  };
})();
