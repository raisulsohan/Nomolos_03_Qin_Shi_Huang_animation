(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, QM = F.qinmap, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-20'), DUR = C.duration;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const SEQS = ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14', 'seq-15', 'seq-16', 'seq-17', 'seq-18', 'seq-19'];
  const T0 = () => SEQS.reduce((s, id) => s + F.getScene(id).duration, 0);

  const T_FROM = 2.48, T_INSIDE = 2.82;
  const T_COURT = 3.68, T_DRINK = 5.29, T_ETER = 5.81, T_STAR = 7.11, T_CINN = 8.18;
  const T_MERC = 9.15, T_SULF = 9.76;
  const T_BLOOD = 10.99, T_CRYS = 11.61, T_HEAT = 12.87, T_SWEAT = 13.54, T_BEADS = 14.19, T_SILV = 15.14;
  const T_ALCH = 16.59, T_MIND = 17.23, T_LIFE = 18.8, T_ITSELF = 19.11;
  const T_METAL = 20.12, T_FLOWS = 20.78, T_WATER = 21.44;
  const T_RUST = 22.89, T_ROT = 23.9, T_DIES = 24.93;
  const T_LOGIC = 25.98, T_BEAUT = 26.56, T_CLEAN = 27.21;
  const T_CONS = 27.94, T_INC1 = 28.59, T_BECOME = 30.01;
  const T_INC2 = 30.39;

  const WALL_T = .3, ZB = 5.0, XW = 3.6, YC = 3.4;
  const WIN = { x0: -.8, x1: .8, y0: .95, y1: 2.25 };
  const NIGHT = '#0c0a1e';
  const FURN = [{ c: [-2.06, 4.42], r: .42, h: .66 }, { c: [1.88, 4.44], r: .4, h: .62 }];
  const BENCH = { x0: -1.6, x1: 1.4, y: .82, z0: 4.12, zm: 4.6, z1: 4.98, y2: .92 };
  const BRAZ = { c: [-1.32, 4.38], r: .088, y0: BENCH.y, y1: BENCH.y + .186 };
  const DISH = { c: [-1.32, 4.38], y: 1.04, r: .13, d: .026 };
  const XTAL = [DISH.c[0], DISH.y, DISH.c[1]];
  const TR = { x0: -1.15, x1: .885, y0: 1.02, y1: .985, z: 4.38, w: .028, d: .024 };
  const T_SPILL = 20.12 + .45, T_POUR = 25.8 - .2;
  const headX = t => TR.x0 + (TR.x1 - TR.x0) * clamp((t - T_SPILL) / (T_POUR - T_SPILL));
  const trY = X => lerp(TR.y0, TR.y1, (X - TR.x0) / (TR.x1 - TR.x0));
  const atX = tt => TR.x0 + (TR.x1 - TR.x0) * (tt - T_SPILL) / (T_POUR - T_SPILL);
  const ITEMS = { knife: { x: atX(T_RUST - .3) }, wood: { x: atX(T_ROT - .3) }, flower: { x: atX(T_DIES - .3) } };
  const ZI = 4.8;
  const CUPP = [1.0, BENCH.y, 4.38];
  const CHART = { x: 1.0, y0: 1.18, y1: 2.08, w: .6 };
  const flick = (t, k = 0) => 1 + .07 * Math.sin(t * 13.1 + k) + .045 * Math.sin(t * 21.7 + 1.3 + k);
  const heat = t => ss(T_HEAT - .1, T_HEAT + .9, t);
  const LPTS = t => [[FURN[0].c[0] + .3, .45, FURN[0].c[1] + .2, 1.0 * flick(t)], [FURN[1].c[0] - .3, .45, FURN[1].c[1] + .2, .9 * flick(t, 2)], [BRAZ.c[0], BRAZ.y1 + .02, BRAZ.c[1], .35 + .65 * heat(t)]];
  const LIGHT = (p, t) => {
    let best = null, bv = -1;
    for (const L of LPTS(t)) { const d = Math.hypot(L[0] - p[0], L[1] - p[1], L[2] - p[2]), v = L[3] / (d * d + .2); if (v > bv) { bv = v; best = [L[0] - p[0], L[1] - p[1], L[2] - p[2]]; } }
    const l = Math.hypot(...best); return [best[0] / l, best[1] / l, best[2] / l];
  };
  const quad = (x, cam, pts, col) => { if (S3.poly(x, cam, pts)) { x.fillStyle = col; x.fill(); return true; } return false; };
  const path = (x, cam, pts) => { const s = S3.clip(cam, pts); if (s.length < 3) return false; x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
  const ringPts = (cx, cz, r, y, n = 40) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]); } return o; };
  function lit(x, cam, p, R, stops) {
    const c = cam.proj(p); if (!c) { x.fillStyle = stops[stops.length - 1][1]; x.fill(); return; }
    const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.max(4, R * c[3]));
    for (const [k, col] of stops) g.addColorStop(k, col);
    x.fillStyle = g; x.fill();
  }

  const F0 = M45 ? 1800 : 2225;
  const az = (a, r, y, c = XTAL) => [c[0] + r * Math.sin(a * D2R), y, c[2] - r * Math.cos(a * D2R)];
  let SPL = null;
  function keys() {
    const X = XTAL, CUP = CUPP;
    return [
      [-1.2, [.1, 1.3, -17.5], [0, 2.1, 0], 1],
      [0, [.08, 1.34, -14.2], [0, 2.05, 0], 1],
      [1.4, [.03, 1.48, -7.2], [0, 1.72, 0], 1],
      [2.6, [0, 1.58, -2.1], [0, 1.52, 2], 1],
      [3.35, [0, 1.56, .2], [-.1, 1.36, 4.6], 1],
      [T_DRINK + .3, [-.45, 1.62, 1.55], [-.2, 1.02, 4.6], 1],
      [T_CINN - .1, [...az(-40, .82, 1.36)], [X[0] - .02, X[1] + .07, X[2]], 1],
      [T_MERC + .2, [...az(-28, .68, 1.31)], [X[0], X[1] + .06, X[2]], 1],
      [T_SULF + .9, [...az(-8, .56, 1.27)], [X[0], X[1] + .05, X[2]], 1],
      [T_HEAT + .2, [...az(8, .47, 1.22)], [X[0], X[1] + .04, X[2]], 1],
      [T_SILV + .4, [...az(26, .4, 1.2)], [X[0], X[1] + .045, X[2]], 1],
      [T_LIFE - .2, [...az(42, .34, 1.28)], [POOL.c[0], DISH.y + .01, POOL.c[2]], 1],
      [T_SPILL + .3, [headX(T_SPILL + .3) - .08, 1.5, 3.72], [headX(T_SPILL + .3) - .03, 1.0, 4.52], 1],
      ...[T_RUST, T_ROT, T_DIES].map(tt => [tt, [headX(tt) - .27, 1.56, 3.66], [headX(tt) - .27, .96, 4.58], 1]),
      [T_POUR + .15, [CUP[0] - .14, 1.5, 3.55], [CUP[0] - .05, 1.0, 4.55], 1],
      [T_LOGIC + .75, [CUP[0], 1.5, 2.15], [CUP[0], 1.37, ZB], 1],
      [T_CONS, [CUP[0], 1.51, 1.95], [CUP[0], 1.37, ZB], 1],
      [DUR, [CUP[0], 1.53, 1.62], [CUP[0], 1.37, ZB], 1],
      [DUR + 1.8, [CUP[0], 1.54, 1.42], [CUP[0], 1.37, ZB], 1],
    ];
  }
  function spl() {
    if (SPL) return SPL;
    const K = keys();
    if (M45) K.forEach(k => { if (k[0] < 3.3) return; const d = [k[1][0] - k[2][0], k[1][1] - k[2][1], k[1][2] - k[2][2]], l = Math.hypot(...d); k[1] = k[1].map((v, i) => v + d[i] / l * Math.min(.35, .3 * l)); });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: F0 * Math.exp(S.f(t)), W, H, near: .02 });
  }

  const ZO = -WALL_T;
  function courtyard(x, cam, t) {
    if (!path(x, cam, [[-9, 0, ZO], [9, 0, ZO], [9, 0, -16], [-9, 0, -16]])) return;
    lit(x, cam, [0, 0, ZO - .9], 3.2, [[0, '#4a2c22'], [.35, '#241a2c'], [1, '#0c0b1c']]);
    x.strokeStyle = 'rgba(4,3,10,.55)'; x.lineWidth = 1.2; x.beginPath();
    for (let X = -9; X <= 9; X += .6) S3.line(x, cam, [X, 0, ZO], [X, 0, -16]);
    for (let Z = ZO - .6; Z > -16; Z -= .6) S3.line(x, cam, [-9, 0, Z], [9, 0, Z]);
    x.stroke();
    const q = [[WIN.x0 - .05, 0, ZO - .05], [WIN.x1 + .05, 0, ZO - .05], [WIN.x1 + .55, 0, ZO - 2.4], [WIN.x0 - .55, 0, ZO - 2.4]];
    if (path(x, cam, q)) { const a = cam.proj([0, 0, ZO - .1]), b = cam.proj([0, 0, ZO - 2.4]); if (a && b) { const g = x.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, `rgba(255,170,90,${.34 * flick(t)})`); g.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = g; x.fill(); } }
  }
  function facade(x, cam, t) {
    const RED = '#5a1c1e', z = ZO;
    const parts = [[-9, 0, 9, WIN.y0], [-9, WIN.y1, 9, 3.05], [-9, WIN.y0, WIN.x0, WIN.y1], [WIN.x1, WIN.y0, 9, WIN.y1]];
    for (const [a, b, c, d] of parts) if (path(x, cam, [[a, b, z], [c, b, z], [c, d, z], [a, d, z]])) lit(x, cam, [0, (WIN.y0 + WIN.y1) / 2, z], 4.2, [[0, '#8a3a2a'], [.3, '#5e2224'], [.7, '#2e1222'], [1, '#14091a']]);
    const post = { col: '#2a1612', light: [0, .3, -1], lo: .5, ink: NIGHT };
    for (const X of [-3.2, -1.55, 1.55, 3.2]) S3.box(x, cam, { x0: X - .12, x1: X + .12, y0: 0, y1: 3.05, z0: z - .1, z1: z }, post);
    S3.box(x, cam, { x0: -9, x1: 9, y0: 2.82, y1: 3.05, z0: z - .12, z1: z }, post);
    S3.box(x, cam, { x0: -9, x1: 9, y0: 0, y1: .22, z0: z - .14, z1: z }, { ...post, col: '#3a2a26' });
    const { x0, x1, y0, y1 } = WIN, inner = '#b0603a';
    quad(x, cam, [[x0, y0, z], [x1, y0, z], [x1, y0, 0], [x0, y0, 0]], S3.mix(inner, '#ffd090', .25));
    quad(x, cam, [[x0, y1, z], [x1, y1, z], [x1, y1, 0], [x0, y1, 0]], S3.mix(inner, NIGHT, .55));
    if (cam.pos[0] > x0) quad(x, cam, [[x0, y0, z], [x0, y1, z], [x0, y1, 0], [x0, y0, 0]], inner);
    if (cam.pos[0] < x1) quad(x, cam, [[x1, y0, z], [x1, y1, z], [x1, y1, 0], [x1, y0, 0]], inner);
    const fr = { col: '#3a2216', light: [0, .4, -1], lo: .45, ink: NIGHT };
    S3.box(x, cam, { x0: x0 - .1, x1: x1 + .1, y0: y0 - .1, y1: y0, z0: z - .06, z1: z }, fr);
    S3.box(x, cam, { x0: x0 - .1, x1: x1 + .1, y0: y1, y1: y1 + .1, z0: z - .06, z1: z }, fr);
    S3.box(x, cam, { x0: x0 - .1, x1: x0, y0, y1, z0: z - .06, z1: z }, fr);
    S3.box(x, cam, { x0: x1, x1: x1 + .1, y0, y1, z0: z - .06, z1: z }, fr);
    for (const sg of [-1, 1]) {
      const xa = sg < 0 ? x0 - .1 : x1 + .1, xb = xa + sg * .78, zz = z - .07, P = [[xa, y0, zz], [xb, y0, zz], [xb, y1, zz], [xa, y1, zz]];
      quad(x, cam, P, '#3e2418');
      x.strokeStyle = '#1e100c'; x.lineWidth = Math.max(1, cam.f / 1600); x.beginPath();
      for (let i = 1; i < 4; i++) S3.line(x, cam, [lerp(xa, xb, i / 4), y0, zz - .005], [lerp(xa, xb, i / 4), y1, zz - .005]);
      for (let i = 1; i < 6; i++) S3.line(x, cam, [xa, lerp(y0, y1, i / 6), zz - .005], [xb, lerp(y0, y1, i / 6), zz - .005]);
      x.stroke();
    }
  }
  function eaves(x, cam, t) {
    const ze = ZO - 1.25, y = 3.05;
    quad(x, cam, [[-9, y, ZO], [9, y, ZO], [9, y + .32, ze], [-9, y + .32, ze]], '#180e16');
    x.strokeStyle = 'rgba(70,40,30,.6)'; x.lineWidth = Math.max(1, cam.f / 1800); x.beginPath();
    for (let X = -9; X <= 9; X += .32) S3.line(x, cam, [X, y, ZO], [X, y + .32, ze]);
    x.stroke();
    quad(x, cam, [[-9, y + .32, ze], [9, y + .32, ze], [9, y + .5, ze], [-9, y + .5, ze]], '#2a1a14');
    quad(x, cam, [[-9, y + .5, ze], [9, y + .5, ze], [9, 5.6, 1.6], [-9, 5.6, 1.6]], '#3a2c1c');
    for (let X = -8.85; X <= 9; X += .3) {
      const p = cam.proj([X, y + .41, ze - .01]); if (!p) continue;
      const r = .085 * p[3], a = .25 + .75 * Math.exp(-Math.pow(X / 2.4, 2));
      x.fillStyle = S3.mix('#3a2a12', '#d8a848', a); x.beginPath(); x.arc(p[0], p[1], r, 0, TAU); x.fill();
      x.strokeStyle = S3.mix('#2a1a0a', '#8a6420', a); x.lineWidth = Math.max(1, r * .18); x.beginPath(); x.arc(p[0], p[1], r * .55, 0, TAU); x.stroke();
    }
  }

  function shell(x, cam, t) {
    const warm = [[0, '#8a5a36'], [.28, '#5a3434'], [.65, '#22182e'], [1, '#0e0c20']];
    if (path(x, cam, [[-XW, 0, ZB], [XW, 0, ZB], [XW, YC, ZB], [-XW, YC, ZB]])) {
      lit(x, cam, [BRAZ.c[0], 1.1, ZB], 2.4 + .6 * heat(t), warm);
      x.save(); x.globalCompositeOperation = 'lighter';
      for (const L of LPTS(t).slice(0, 2)) { if (!path(x, cam, [[-XW, 0, ZB], [XW, 0, ZB], [XW, YC, ZB], [-XW, YC, ZB]])) break; lit(x, cam, [L[0], .6, ZB], 2.2, [[0, `rgba(150,70,30,${.32 * L[3]})`], [1, 'rgba(150,70,30,0)']]); }
      x.restore();
    }
    for (const sg of [-1, 1]) {
      const X = sg * XW, L = FURN[sg < 0 ? 0 : 1];
      if (path(x, cam, [[X, 0, 0], [X, 0, ZB], [X, YC, ZB], [X, YC, 0]])) lit(x, cam, [X, .7, L.c[1]], 2.6, [[0, '#7a4430'], [.35, '#3e2430'], [1, '#0e0c20']]);
    }
    if (path(x, cam, [[-XW, 0, 0], [XW, 0, 0], [XW, 0, ZB], [-XW, 0, ZB]])) lit(x, cam, [0, 0, 3.4], 3.6, [[0, '#3e2a24'], [.5, '#1e1626'], [1, '#0b0a1a']]);
    x.strokeStyle = 'rgba(6,5,14,.5)'; x.lineWidth = 1.1; x.beginPath();
    for (let X = -XW; X <= XW; X += .3) S3.line(x, cam, [X, 0, 0], [X, 0, ZB]);
    x.stroke();
    quad(x, cam, [[-XW, YC, 0], [XW, YC, 0], [XW, YC, ZB], [-XW, YC, ZB]], '#0d0a1c');
    const bm = { col: '#2a1a16', light: [0, -1, 0], lo: .5, ink: NIGHT };
    for (const Z of [1.2, 2.5, 3.8]) S3.box(x, cam, { x0: -XW, x1: XW, y0: YC - .26, y1: YC, z0: Z - .12, z1: Z + .12 }, bm);
  }

  const CENSER = [-1.75, -4.6], LANTERN = [1.95, -3.1];
  function censer(x, cam, t) {
    const [cx, cz] = CENSER, o = { col: '#4a3a24', light: [.1, .5, .85], lo: .25, ink: NIGHT };
    for (const a of [90, 210, 330]) { const lx = cx + .26 * Math.cos(a * D2R), lz = cz + .26 * Math.sin(a * D2R); S3.bar(x, cam, [lx, 0, lz], [lx * .7 + cx * .3, .42, lz * .7 + cz * .3], .035, o); }
    S3.cyl(x, cam, [cx, cz], .34, .38, .78, { ...o, lo: .2 });
    S3.cyl(x, cam, [cx, cz], .37, .78, .84, { ...o, col: '#5a4628' });
    for (const sg of [-1, 1]) S3.bar(x, cam, [cx + sg * .25, .84, cz], [cx + sg * .25, 1.02, cz], .03, o);
    S3.bar(x, cam, [cx - .25, 1.02, cz], [cx + .25, 1.02, cz], .03, o);
  }
  function lantern(x, cam, t) {
    const [lx, lz] = LANTERN, o = { col: '#2a1a14', light: [0, .2, -1], lo: .4, ink: NIGHT };
    S3.box(x, cam, { x0: lx - .25, x1: lx + .25, y0: 0, y1: .14, z0: lz - .25, z1: lz + .25 }, { ...o, col: '#2e2630' });
    S3.bar(x, cam, [lx, .14, lz], [lx, 1.62, lz], .045, o);
    S3.box(x, cam, { x0: lx - .2, x1: lx + .2, y0: 1.62, y1: 2.02, z0: lz - .2, z1: lz + .2 }, { ...o, col: '#c87a38', light: [0, 0, -1], lo: .75 });
    S3.box(x, cam, { x0: lx - .26, x1: lx + .26, y0: 2.02, y1: 2.1, z0: lz - .26, z1: lz + .26 }, o);
    x.strokeStyle = '#1e120c'; x.lineWidth = Math.max(1, cam.f / 1500); x.beginPath();
    for (const dx of [-.07, .07]) S3.line(x, cam, [lx + dx, 1.62, lz - .201], [lx + dx, 2.02, lz - .201]);
    x.stroke();
  }
  const SPARKS = (() => { const R = F.rng(4411), o = []; for (let i = 0; i < 46; i++) o.push({ t0: R() * 3.2, x: (R() - .5) * .5, dx: (R() - .3) * .5, v: .9 + .7 * R(), life: 1.2 + 1.2 * R() }); return o; })();
  function smokeSparks(ctx, cam, t) {
    const V = [-1.4, 5.1, 1.2], sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    for (let i = 0; i < 7; i++) {
      const a = ((t * .22 + i / 7) % 1), p = cam.proj([V[0] + .9 * a + .2 * Math.sin(i * 2.1 + t * .5), V[1] + 3.2 * a, V[2] - .4 * a]); if (!p) continue;
      const r = (.35 + 1.2 * a) * p[3], al = .16 * Math.sin(PI * a);
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(120,100,130,${al})`); g.addColorStop(1, 'rgba(120,100,130,0)');
      ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const s of SPARKS) {
      const u = ((t - s.t0) % s.life + s.life) % s.life / s.life, p = cam.proj([V[0] + s.x + s.dx * u + .08 * Math.sin(9 * u + s.t0), V[1] + s.v * 2.2 * u, V[2]]); if (!p) continue;
      const r = Math.max(1.2, .018 * p[3]), al = (1 - u) * .9;
      ctx.fillStyle = `rgba(255,${150 + 80 * (1 - u) | 0},70,${al})`; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
    }
    const q = cam.proj([LANTERN[0], 1.82, LANTERN[1]]); if (q) PR.glow(ctx, q[0], q[1], .9 * q[3], '#ffb060', .3, 'flat');
    ctx.restore();
  }

  function furnace(x, cam, t, i) {
    const Fu = FURN[i], [cx, cz] = Fu.c, o = { col: '#7a4a34', light: LIGHT([cx + (i ? -.6 : .6), .5, cz], t), lo: .2, ink: NIGHT };
    S3.cyl(x, cam, [cx, cz], Fu.r, 0, Fu.h, { ...o, cap: false });
    S3.cyl(x, cam, [cx, cz], Fu.r + .04, Fu.h, Fu.h + .08, { ...o, col: '#5e3424' });
    const a0 = i ? PI * .8 : PI * .2, arc = [];
    for (let k = 0; k <= 10; k++) { const a = a0 - .38 + .76 * k / 10; arc.push([cx + (Fu.r + .002) * Math.cos(a), .06, cz + (Fu.r + .002) * Math.sin(a)]); }
    for (let k = 10; k >= 0; k--) { const a = a0 - .38 + .76 * k / 10, s = Math.sin(PI * k / 10); arc.push([cx + (Fu.r + .002) * Math.cos(a), .2 + .14 * s, cz + (Fu.r + .002) * Math.sin(a)]); }
    const vis = (cam.pos[0] - cx) * Math.cos(a0) + (cam.pos[2] - cz) * Math.sin(a0) > 0;
    if (vis && path(x, cam, arc)) {
      const fl = flick(t, i * 3), m = cam.proj([cx + Fu.r * Math.cos(a0), .17, cz + Fu.r * Math.sin(a0)]);
      x.fillStyle = '#2a0e06'; x.fill();
      if (m) { const r = .24 * m[3], g = x.createRadialGradient(m[0], m[1] + r * .3, 0, m[0], m[1] + r * .3, r); g.addColorStop(0, `rgba(255,236,160,${Math.min(1, fl)})`); g.addColorStop(.45, `rgba(250,140,46,${.9 * Math.min(1, fl)})`); g.addColorStop(1, 'rgba(160,40,14,.6)'); x.save(); path(x, cam, arc); x.clip(); x.fillStyle = g; x.fillRect(m[0] - r, m[1] - r, 2 * r, 2 * r); x.restore(); }
    }
    if (i === 0) {
      S3.cyl(x, cam, [cx, cz], .19, Fu.h + .08, Fu.h + .3, { col: '#4a3a26', light: o.light, lo: .2, ink: NIGHT });
      if (path(x, cam, ringPts(cx, cz, .19, Fu.h + .3))) { x.fillStyle = '#1a120e'; x.fill(); }
    } else {
      const b = { col: '#5a4428', light: o.light, lo: .2, ink: NIGHT };
      S3.cyl(x, cam, [cx, cz], .22, Fu.h + .08, Fu.h + .3, b);
      S3.cyl(x, cam, [cx, cz], .13, Fu.h + .3, Fu.h + .42, b);
      S3.cyl(x, cam, [cx, cz], .17, Fu.h + .42, Fu.h + .6, b);
      S3.bar(x, cam, [cx + .05, Fu.h + .56, cz], [cx + .5, Fu.h + .36, cz - .08], .025, b);
      S3.bar(x, cam, [cx + .5, Fu.h + .36, cz - .08], [cx + .62, .32, cz - .1], .025, b);
      S3.cyl(x, cam, [cx + .64, cz - .1], .13, 0, .32, { ...b, col: '#4e3424' });
    }
  }
  function furnaceGlow(ctx, cam, t) {
    const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    LPTS(t).slice(0, 2).forEach((L, i) => {
      const Fu = FURN[i], a0 = i ? PI * .8 : PI * .2, p = cam.proj([Fu.c[0] + Fu.r * Math.cos(a0), .2, Fu.c[1] + Fu.r * Math.sin(a0)]);
      if (p) PR.glow(ctx, p[0], p[1], 1.0 * p[3], '#ff9a48', .26 * L[3], 'flat');
      for (let k = 0; k < 4; k++) {
        const a = ((t * .3 + k / 4 + i * .13) % 1), q = cam.proj([Fu.c[0] + .1 * Math.sin(k + t), Fu.h + .7 + 1.4 * a, Fu.c[1]]); if (!q) continue;
        const r = (.12 + .35 * a) * q[3], al = .1 * Math.sin(PI * a);
        const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, `rgba(150,120,140,${al})`); g.addColorStop(1, 'rgba(150,120,140,0)'); ctx.fillStyle = g; ctx.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r);
      }
    });
    ctx.restore();
  }
  const SHELF = [{ x0: -3.45, x1: -2.85, ys: [1.0, 1.6, 2.2] }, { x0: 2.7, x1: 3.45, ys: [1.0, 1.6, 2.2] }, { x0: -1.6, x1: -.2, ys: [1.75, 2.35] }];
  const GOURDS = (() => { const R = F.rng(9133), o = []; for (const S of SHELF) for (const y of S.ys) for (let X = S.x0 + .14; X < S.x1 - .08; X += .19 + .07 * R()) o.push([X, y, ZB - .16, .8 + .5 * R(), R() < .5]); return o; })();
  function shelves(x, cam, t) {
    const o = { col: '#3e2a1e', light: LIGHT([0, 1.5, ZB - .2], t), lo: .25, ink: NIGHT };
    for (const S of SHELF) {
      for (const y of S.ys) S3.box(x, cam, { x0: S.x0, x1: S.x1, y0: y - .04, y1: y, z0: ZB - .34, z1: ZB }, o);
      for (const X of [S.x0 + .03, S.x1 - .03]) S3.box(x, cam, { x0: X - .03, x1: X + .03, y0: 0, y1: S.ys[2] + .3, z0: ZB - .34, z1: ZB - .28 }, o);
    }
    for (const [X, y, Z, s, jar] of GOURDS) {
      if (jar) { S3.cyl(x, cam, [X, Z], .06 * s, y, y + .14 * s, { ...o, col: '#5a3a2a' }); S3.cyl(x, cam, [X, Z], .035 * s, y + .14 * s, y + .18 * s, { ...o, col: '#4a2e22' }); continue; }
      S3.onPlane(x, cam, [X, y, Z], [.013 * s, 0, 0], [0, -.013 * s, 0], xx => Q.gourd(xx, 1, .85));
    }
  }
  const HANG = [[-.95, 2.15, 1.25], [-1.3, 2.35, 2.5], [.55, 2.25, 1.25], [1.15, 2.4, 2.5], [-2.2, 2.3, 2.5], [2.0, 2.2, 1.25]];
  function hanging(x, cam, t) {
    x.strokeStyle = '#120c10'; x.lineWidth = Math.max(1, cam.f / 1500); x.beginPath();
    for (const [X, y, Z] of HANG) S3.line(x, cam, [X, YC - .26, Z], [X, y + .2, Z]);
    x.stroke();
    HANG.forEach(([X, y, Z], i) => {
      if (i % 2) { S3.onPlane(x, cam, [X, y + .22, Z], [.016, 0, 0], [0, -.016, 0], xx => Q.gourd(xx, 1, .9)); return; }
      const p = cam.proj([X, y + .2, Z]); if (!p) return; const k = p[3];
      x.fillStyle = '#1a1612'; x.beginPath(); x.moveTo(p[0] - .02 * k, p[1]); x.lineTo(p[0] + .02 * k, p[1]); x.lineTo(p[0] + .07 * k, p[1] + .34 * k); x.lineTo(p[0] - .07 * k, p[1] + .34 * k); x.closePath(); x.fill();
      x.strokeStyle = '#2a2418'; x.lineWidth = Math.max(1, .006 * k); x.beginPath(); for (let j = -3; j <= 3; j++) { x.moveTo(p[0] + j * .004 * k, p[1] + .04 * k); x.lineTo(p[0] + j * .022 * k, p[1] + .36 * k); } x.stroke();
    });
  }

  const WOOD = '#4a3020', WOOD_D = '#2e1c14', BRZ = '#6a5230', BRZ_D = '#3e2e1a';
  function bench(x, cam, t) {
    const B = BENCH, o = { col: WOOD, light: LIGHT([-.3, 1, 4.4], t), lo: .25, ink: NIGHT };
    for (const X of [B.x0 + .08, B.x1 - .08]) for (const Z of [B.z0 + .08, B.zm - .08]) S3.box(x, cam, { x0: X - .04, x1: X + .04, y0: 0, y1: B.y - .06, z0: Z - .04, z1: Z + .04 }, { ...o, col: WOOD_D });
    S3.box(x, cam, { x0: B.x0, x1: B.x1, y0: 0, y1: B.y2, z0: B.zm, z1: B.z1 }, { ...o, col: WOOD_D });
    S3.box(x, cam, { x0: B.x0, x1: B.x1, y0: B.y - .06, y1: B.y, z0: B.z0, z1: B.zm }, o);
    S3.box(x, cam, { x0: B.x0, x1: B.x1, y0: B.y2 - .03, y1: B.y2, z0: B.zm - .01, z1: B.z1 }, { ...o, col: '#563a26' });
  }
  function brazier(x, cam, t) {
    const [cx, cz] = BRAZ.c, h = heat(t), lt = [.2, .9, -.3], o = { col: BRZ, light: LIGHT([cx, BRAZ.y1, cz - .2], t), lo: .22, ink: NIGHT };
    S3.cyl(x, cam, [cx, cz], BRAZ.r, BRAZ.y0, BRAZ.y1, { ...o, cap: false });
    S3.cyl(x, cam, [cx, cz], BRAZ.r + .012, BRAZ.y1 - .012, BRAZ.y1, { ...o, col: BRZ_D, cap: false });
    const DEEP = .075, hb0 = lerp(.3, .95, h) * (.9 + .1 * Math.sin(t * 5));
    if (path(x, cam, ringPts(cx, cz, BRAZ.r - .004, BRAZ.y1 - .002))) {
      const m = cam.proj([cx, BRAZ.y1 - .03, cz + BRAZ.r * .6]);
      x.fillStyle = '#120806'; x.fill();
      if (m) { x.save(); x.clip(); const g = x.createRadialGradient(m[0], m[1], 0, m[0], m[1], BRAZ.r * 1.6 * m[3]); g.addColorStop(0, `rgba(230,96,30,${.8 * hb0})`); g.addColorStop(1, `rgba(90,20,10,${.6 * hb0})`); x.fillStyle = g; x.fillRect(m[0] - 2 * BRAZ.r * m[3], m[1] - 2 * BRAZ.r * m[3], 4 * BRAZ.r * m[3], 4 * BRAZ.r * m[3]); x.restore(); }
    }
    x.save(); if (path(x, cam, ringPts(cx, cz, BRAZ.r - .004, BRAZ.y1 - .002))) x.clip();
    if (path(x, cam, ringPts(cx, cz, BRAZ.r - .006, BRAZ.y1 - DEEP))) {
      const c = cam.proj([cx, BRAZ.y1 - DEEP, cz]), R = c ? BRAZ.r * c[3] : 50;
      x.fillStyle = '#1a0806'; x.fill();
      if (c) {
        x.save(); x.clip();
        const gl = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], R * 1.1), hb = lerp(.3, .95, h) * (.9 + .1 * Math.sin(t * 5));
        gl.addColorStop(0, `rgba(240,${90 + 50 * h | 0},30,${.75 * hb})`); gl.addColorStop(.6, `rgba(150,34,12,${.7 * hb})`); gl.addColorStop(1, 'rgba(40,10,8,.95)');
        x.fillStyle = gl; x.fillRect(c[0] - R * 1.2, c[1] - R * 1.2, R * 2.4, R * 2.4);
        for (const [dx, dz, r, k] of COALS) {
          const pts = []; for (let j = 0; j < 7; j++) { const a = (j + .6 * F.hash(j, k * 53 | 0)) / 7 * TAU + k * 3, rr = r * (.55 + .7 * F.hash(j, k * 97 | 0)); pts.push([cx + dx * .8 + rr * Math.cos(a), BRAZ.y1 - DEEP + .002 + .004 * Math.sin(a + k), cz + dz * .8 + rr * Math.sin(a)]); }
          if (!path(x, cam, pts)) continue;
          const fl = .6 + .4 * Math.sin(t * (2 + k * 3) + k * 9);
          x.fillStyle = S3.mix('#120a08', '#3a2622', .5 * (1 - h) + .2 * k); x.fill();
          x.strokeStyle = `rgba(255,${110 + 90 * h | 0},40,${(.15 + .5 * h) * fl})`; x.lineWidth = Math.max(1, .0018 * c[3]); x.stroke();
        }
        x.restore();
      }
      void R;
    }
    x.restore();
    for (const a of [30, 150, 270]) {
      const ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
      S3.bar(x, cam, [cx + (BRAZ.r + .01) * ca, BRAZ.y1 - .01, cz + (BRAZ.r + .01) * sa], [cx + (DISH.r - .02) * ca, DISH.y - .012, cz + (DISH.r - .02) * sa], .007, { ...o, col: BRZ_D, n: 6 });
    }
  }
  const COALS = (() => { const R = F.rng(311), o = []; for (let i = 0; i < 34; i++) { const r = Math.sqrt(R()) * .085, a = R() * TAU; o.push([r * Math.cos(a), r * Math.sin(a), .007 + .007 * R(), R()]); } return o; })();
  function dishOutside(x, cam, t) {
    const [cx, cz] = DISH.c, o = { col: BRZ, light: LIGHT([cx, DISH.y, cz - .2], t), lo: .25, ink: NIGHT };
    S3.cyl(x, cam, [cx, cz], DISH.r * .7, DISH.y - .016, DISH.y, { ...o, col: BRZ_D, cap: false });
    S3.cyl(x, cam, [cx, cz], DISH.r, DISH.y, DISH.y + DISH.d, { ...o, cap: false });
    channel(x, cam, t, SPA, SPB, .015, .012, .012, o, spoutK(t));
  }
  const SPA = [DISH.c[0] + DISH.r - .012, DISH.y + .004, DISH.c[1]], SPB = [TR.x0 + .05, TR.y0 - TR.d + .012, TR.z];
  const spoutK = t => ss(T_SPILL - .12, T_SPILL + .04, t) * (1 - ss(T_DRY - .1, T_DRY + .15, t));
  function channel(x, cam, t, A, B, wa, wb, hh, o, k) {
    const P = (s, side, up) => { const w2 = lerp(wa, wb, s) * side; return [lerp(A[0], B[0], s), lerp(A[1], B[1], s) + up, lerp(A[2], B[2], s) + w2]; };
    quad(x, cam, [P(0, 1, 0), P(1, 1, 0), P(1, 1, hh), P(0, 1, hh)], S3.shade(BRZ, [0, 0, -1], o.light, o));
    quad(x, cam, [P(0, -1, 0), P(1, -1, 0), P(1, 1, 0), P(0, 1, 0)], '#241a10');
    if (k > 0) {
      const Q2 = (s, side) => { const p = P(s, side * .62, .002); return p; };
      if (path(x, cam, [Q2(0, -1), Q2(k, -1), Q2(k, 1), Q2(0, 1)])) { x.fillStyle = '#a4acb8'; x.fill(); }
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = Math.max(1, .0025 * cam.f / Math.max(.2, cam.depth(A))); x.beginPath(); S3.line(x, cam, P(0, .25, .003), P(k, .25, .003)); x.stroke();
    }
    quad(x, cam, [P(0, -1, -.004), P(1, -1, -.004), P(1, -1, hh), P(0, -1, hh)], S3.shade(BRZ, [0, .2, -1], o.light, o));
    x.strokeStyle = '#a8864e'; x.lineWidth = Math.max(1, cam.f / 1600); x.beginPath(); S3.line(x, cam, P(0, -1, hh), P(1, -1, hh)); S3.line(x, cam, P(0, 1, hh), P(1, 1, hh)); x.stroke();
  }
  function dishRim(x, cam, near) {
    const [cx, cz] = DISH.c, a0 = Math.atan2(cam.pos[2] - cz, cam.pos[0] - cx), pts = [];
    for (let i = 0; i <= 24; i++) { const a = a0 + (near ? -PI / 2 : PI / 2) + PI * i / 24; pts.push([cx + DISH.r * Math.cos(a), DISH.y + DISH.d, cz + DISH.r * Math.sin(a)]); }
    x.strokeStyle = '#b08850'; x.lineWidth = Math.max(1, .004 * cam.f / Math.max(.1, cam.depth([cx, DISH.y, cz]))); x.lineCap = 'round'; x.beginPath();
    for (let i = 0; i < pts.length - 1; i++) S3.line(x, cam, pts[i], pts[i + 1]);
    x.stroke(); x.lineCap = 'butt';
  }
  function troughBack(x, cam, t) {
    const o = { col: BRZ, light: LIGHT([0, 1, 4.2], t), lo: .25, ink: NIGHT }, { x0, x1, z, w: hw, d } = TR;
    for (let X = x0 + .15; X < x1; X += .5) S3.box(x, cam, { x0: X - .03, x1: X + .03, y0: BENCH.y, y1: trY(X) - d, z0: z - .03, z1: z + .03 }, { ...o, col: WOOD_D });
    quad(x, cam, [[x0, TR.y0 - d, z + hw], [x1, TR.y1 - d, z + hw], [x1, TR.y1 + .004, z + hw], [x0, TR.y0 + .004, z + hw]], S3.shade(BRZ, [0, 0, -1], o.light, o));
    quad(x, cam, [[x0, TR.y0 - d, z - hw], [x1, TR.y1 - d, z - hw], [x1, TR.y1 - d, z + hw], [x0, TR.y0 - d, z + hw]], '#241a10');
    quad(x, cam, [[x0, TR.y0 - d, z - hw], [x0, TR.y0 - d, z + hw], [x0, TR.y0 + .004, z + hw], [x0, TR.y0 + .004, z - hw]], S3.shade(BRZ, [1, 0, 0], o.light, o));
  }
  function troughFront(x, cam, t) {
    const o = { col: BRZ, light: LIGHT([0, 1, 4.2], t), lo: .25, ink: NIGHT }, { x0, x1, z, w: hw, d } = TR;
    quad(x, cam, [[x0, TR.y0 - d - .006, z - hw - .005], [x1, TR.y1 - d - .006, z - hw - .005], [x1, TR.y1 + .004, z - hw - .005], [x0, TR.y0 + .004, z - hw - .005]], S3.shade(BRZ, [0, .15, -1], o.light, o));
    x.strokeStyle = '#9a7a46'; x.lineWidth = Math.max(1, cam.f / 1500); x.beginPath(); S3.line(x, cam, [x0, TR.y0 + .004, z - hw - .005], [x1, TR.y1 + .004, z - hw - .005]); x.stroke();
  }
  const EPA = () => [TR.x1 - .01, TR.y1 - TR.d, TR.z], EPB = () => [CUPP[0], TR.y1 - TR.d - .02, CUPP[2]];
  const pourK = t => tailX(t) < TR.x1 - .005 ? ss(T_POUR, T_POUR + .15, t) : 0;
  function endSpout(x, cam, t) {
    const o = { col: BRZ, light: LIGHT([CUPP[0], 1, 4.2], t), lo: .25, ink: NIGHT };
    channel(x, cam, t, EPA(), EPB(), TR.w, .009, .016, o, pourK(t));
  }
  function cupPour(x, cam, t) {
    const on = pourK(t) >= .99, fill = cupFill(t); if (!on && fill <= 0) return;
    const u = [Math.cos(cam.yaw) * CUP_M, 0, -Math.sin(cam.yaw) * CUP_M], v = [0, -CUP_M, 0];
    const C2 = (X, Y) => cam.proj([CUPP[0] + u[0] * X + v[0] * Y, CUPP[1] + v[1] * Y, CUPP[2] + u[2] * X + v[2] * Y]);
    const e = Math.atan2(cam.pos[1] - (CUPP[1] + .05), Math.hypot(cam.pos[0] - CUPP[0], cam.pos[2] - CUPP[2])), se = Math.max(.1, Math.sin(Math.max(.12, e))), ce = Math.cos(Math.max(.12, e));
    const R = 6.2, rimY = -(2 + .3 + 4.6) * ce, f2 = Math.max(.02, fill), lr = R * .93 * Math.sqrt(f2), ly = rimY + (1 - f2) * 4.4 * ce;
    const rim = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, p = C2(R * .97 * Math.cos(a), rimY + R * .97 * se * Math.sin(a)); if (!p) return; rim.push(p); }
    const top = C2(0, rimY); if (!top) return;
    x.save(); x.beginPath(); x.rect(-W, -H, 3 * W, H + top[1]); rim.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.clip('nonzero');
    const tip = EPB(), Lp = C2(0, ly);
    if (on && Lp) ribbon(x, cam, [tip[0], tip[1] - .004, tip[2]], [CUPP[0], CUPP[1] - ly * CUP_M, CUPP[2]], .003, SILV);
    x.restore();
    if (!on || !Lp) return;
    x.save(); x.beginPath(); rim.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.clip();
    for (let k = 0; k < 3; k++) {
      const a = ((t * 1.6 + k / 3) % 1), rr = (.6 + lr * .9 * a), pts = [];
      for (let i = 0; i < 28; i++) { const th = i / 28 * TAU, p = C2(rr * Math.cos(th), ly + rr * se * Math.sin(th)); if (p) pts.push(p); }
      if (pts.length < 3) continue;
      x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
      x.strokeStyle = `rgba(255,255,255,${.6 * (1 - a)})`; x.lineWidth = 1.5; x.stroke();
    }
    x.restore();
  }
  const CUP_M = .016;
  function cupFill(t) { return .68 * ss(T_POUR + .05, T_LOGIC + .9, t); }
  function cup(x, cam, t) {
    const p = CUPP, e = Math.atan2(cam.pos[1] - (p[1] + .05), Math.hypot(cam.pos[0] - p[0], cam.pos[2] - p[2]));
    const u = [Math.cos(cam.yaw) * CUP_M, 0, -Math.sin(cam.yaw) * CUP_M];
    S3.onPlane(x, cam, p, u, [0, -CUP_M, 0], xx => Q.cup(xx, { s: 1, elev: Math.max(.12, e), fill: cupFill(t), liquid: '#b8bec8', k: .15, beads: [] }));
  }
  const BODY = (() => {
    const o = [[0, .93], [.05, .915], [.062, .87], [.05, .83], [.03, .815], [.11, .79], [.15, .74], [.17, .6], [.19, .46], [.165, .455], [.14, .58], [.12, .66],
      [.115, .5], [.12, .4], [.095, .07], [.05, .07], [.035, .36], [0, .43]];
    return o.concat(o.slice(1, -1).reverse().map(([u, v]) => [-u, v]));
  })();
  const PTS = [[0, .74], [-.06, .62], [.06, .56], [0, .47], [.07, .3], [-.07, .2]];
  const chartAt = (u, v) => [CHART.x + u * CHART.w, CHART.y0 + v * (CHART.y1 - CHART.y0), ZB - .012];
  function chart(x, cam, t, silverK = 0) {
    const Hh = CHART.y1 - CHART.y0, lt = LIGHT([CHART.x, 1.6, ZB - .3], t);
    S3.onPlane(x, cam, [CHART.x - CHART.w / 2, CHART.y1, ZB - .01], [CHART.w, 0, 0], [0, -Hh, 0], xx => {
      xx.fillStyle = '#a88a62'; xx.fillRect(0, 0, 1, 1);
      xx.save(); xx.translate(.5, 1); xx.scale(1 / CHART.w * CHART.w, -1 / Hh * Hh);
      xx.restore();
    });
    S3.onPlane(x, cam, chartAt(0, 0), [CHART.w, 0, 0], [0, Hh, 0], xx => {
      const body = () => { xx.beginPath(); BODY.forEach(([u, v], i) => i ? xx.lineTo(u, v) : xx.moveTo(u, v)); xx.closePath(); };
      xx.lineJoin = 'round';
      body(); xx.fillStyle = 'rgba(40,26,20,.16)'; xx.fill();
      xx.fillStyle = 'rgba(40,26,20,.16)'; xx.beginPath(); xx.ellipse(0, .875, .055, .062, 0, 0, TAU); xx.fill();
      if (silverK > 0) silverBody(xx, body, silverK, t);
      xx.strokeStyle = '#2a1c16'; xx.lineWidth = .006; body(); xx.stroke(); xx.beginPath(); xx.ellipse(0, .875, .055, .062, 0, 0, TAU); xx.stroke();
      xx.strokeStyle = 'rgba(52,70,96,.85)'; xx.lineWidth = .004;
      for (const dx of [-.05, 0, .05]) { xx.beginPath(); xx.moveTo(dx * .5, .8); xx.quadraticCurveTo(dx * 1.4, .5, dx * 1.5, .1); xx.stroke(); }
      xx.fillStyle = '#9a2a20'; for (const [u, v] of PTS) { xx.beginPath(); xx.arc(u, v, .011, 0, TAU); xx.fill(); }
      xx.fillStyle = 'rgba(40,26,20,.7)'; for (let i = 0; i < 12; i++) xx.fillRect(-.42 + (i % 2) * .74, .9 - Math.floor(i / 2) * .055, .1, .012);
    });
    const rod = { col: WOOD_D, light: lt, lo: .3, ink: NIGHT };
    for (const y of [CHART.y1 + .02, CHART.y0 - .02]) S3.bar(x, cam, [CHART.x - CHART.w / 2 - .05, y, ZB - .03], [CHART.x + CHART.w / 2 + .05, y, ZB - .03], .022, rod);
    x.strokeStyle = '#120c10'; x.lineWidth = Math.max(1, cam.f / 1600); x.beginPath(); S3.line(x, cam, [CHART.x - .2, CHART.y1 + .03, ZB - .03], [CHART.x, CHART.y1 + .22, ZB - .01]); S3.line(x, cam, [CHART.x + .2, CHART.y1 + .03, ZB - .03], [CHART.x, CHART.y1 + .22, ZB - .01]); x.stroke();
  }

  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const XSPEC = [[-.008, 0, 8, 180, .031, .073, .039, .2], [.022, .004, 40, 0, .018, .052, .026, .5], [-.034, .024, 26, 120, .016, .039, .021, .1], [-.016, -.03, 30, 260, .014, .034, .018, .7]];
  const XTALS = XSPEC.map(([dx, dz, lean, dir, r, L, hc, rot]) => {
    const b = [XTAL[0] + dx, XTAL[1] + .008, XTAL[2] + dz], a = nrm([Math.sin(lean * D2R) * Math.cos(dir * D2R), Math.cos(lean * D2R), Math.sin(lean * D2R) * Math.sin(dir * D2R)]);
    const e1 = nrm(cross(a, Math.abs(a[1]) < .95 ? [0, 1, 0] : [1, 0, 0])), e2 = cross(a, e1);
    const ring = (o) => Array.from({ length: 6 }, (_, i) => { const th = rot + i / 6 * TAU; return add3(o, add3(add3([0, 0, 0], e1, r * Math.cos(th)), e2, r * Math.sin(th))); });
    const B = ring(b), T = B.map(p => add3(p, a, L)), P = add3(b, a, L + hc), faces = [];
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6, th = rot + (i + .5) / 6 * TAU, n = nrm(add3(add3([0, 0, 0], e1, Math.cos(th)), e2, Math.sin(th))); faces.push({ pts: [B[i], B[j], T[j], T[i]], n, side: i }); }
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6, n = nrm(cross([T[j][0] - T[i][0], T[j][1] - T[i][1], T[j][2] - T[i][2]], [P[0] - T[i][0], P[1] - T[i][1], P[2] - T[i][2]])); faces.push({ pts: [T[i], T[j], P], n: dot(n, a) < 0 ? n.map(v => -v) : n, cap: true }); }
    return { b, a, B, T, P, faces, r, L };
  });
  const ROCK = (() => { const R = F.rng(77), o = []; for (let i = 0; i < 9; i++) { const th = i / 9 * TAU, r = .046 + .012 * R(); o.push([XTAL[0] - .008 + r * Math.cos(th), XTAL[2] + r * Math.sin(th) * .85, .012 + .012 * R()]); } return o; })();
  const XRED = '#8a0e18', XHOT = '#ff3018';
  function crystalFaceCol(fc, cam, t, ht) {
    const L = LIGHT(fc.pts[0], t), V = nrm([cam.pos[0] - fc.pts[0][0], cam.pos[1] - fc.pts[0][1], cam.pos[2] - fc.pts[0][2]]), hv = nrm(add3(L, V));
    const d = Math.max(0, dot(fc.n, L)), sp = Math.pow(Math.max(0, dot(fc.n, hv)), 38);
    let col = S3.mix('#24040a', XRED, .25 + .75 * Math.min(1, d * 1.1));
    col = S3.mix(col, '#c41824', .28 * d * (1 + .8 * Math.exp(-Math.pow((t - T_BLOOD - .35) / .5, 2))));
    if (ht > 0) col = S3.mix(col, XHOT, ht);
    return S3.mix(col, '#ffb8b0', Math.min(.7, sp * 1.1));
  }
  function crystal(x, cam, t) {
    const top = ROCK.map(([X, Z, h]) => [X, XTAL[1] + h, Z]), lt = LIGHT(XTAL, t);
    for (let i = 0; i < ROCK.length; i++) { const j = (i + 1) % ROCK.length, a = ROCK[i], b = ROCK[j], n = nrm([b[1] - a[1], 0, -(b[0] - a[0])]).map(v => -v);
      S3.face(x, cam, [[a[0], XTAL[1], a[1]], [b[0], XTAL[1], b[1]], top[j], top[i]], S3.shade('#4a4046', n, lt, { lo: .25, ink: NIGHT }), n); }
    if (S3.poly(x, cam, top)) { x.fillStyle = S3.shade('#4a4046', [0, 1, 0], lt, { lo: .3, ink: NIGHT }); x.fill(); }
    const H0 = heat(t);
    XTALS.map((c, i) => ({ c, i, d: cam.depth(add3(c.b, c.a, c.L * .5)) })).sort((p, q) => q.d - p.d).forEach(({ c, i }) => {
      const fs = c.faces.filter(fc => S3.facing(cam, fc.pts[0], fc.n)).sort((p, q) => cam.depth(p.pts[0]) - cam.depth(q.pts[0])).reverse();
      for (const fc of fs) {
        const yy = (fc.pts.reduce((s, p) => s + p[1], 0) / fc.pts.length - XTAL[1]) / .12, ht = H0 * .32 * clamp(1 - yy * 2.2) * (.8 + .2 * Math.sin(t * 7 + i));
        if (!S3.poly(x, cam, fc.pts)) continue;
        x.fillStyle = crystalFaceCol(fc, cam, t, ht); x.fill();
        x.strokeStyle = 'rgba(255,120,110,.28)'; x.lineWidth = 1; x.stroke();
      }
      beadsOn(x, cam, t, i);
    });
  }

  const POOL = { c: [XTAL[0] + .066, XTAL[1] + .0012, XTAL[2] + .006] };
  const BEADS = (() => {
    const R = F.rng(5150), o = [];
    for (let k = 0; k < 52; k++) {
      const ci = R() < .72 ? 0 : 1, side = Math.floor(R() * 6), tb = T_SWEAT + (k < 6 ? k * .06 : Math.pow(R(), .8) * (T_FLOWS + 1.5 - T_SWEAT));
      o.push({ ci, side, u: .2 + .6 * R(), v0: .35 + .55 * R(), tb, grow: .35 + .25 * R(), hold: .15 + .5 * R(), slide: .35 + .3 * R(), r: .0028 + .0032 * R(), roll: .45 + .2 * R(), ang: (R() - .5) * .9 });
    }
    return o.sort((a, b) => a.tb - b.tb);
  })();
  const beadPos = (b, t) => {
    const c = XTALS[b.ci], fc = c.faces[b.side], a = t - b.tb; if (a < 0) return null;
    const g = Math.min(1, a / b.grow), r = b.r * (g < 1 ? Math.sqrt(g) : 1), a2 = a - b.grow - b.hold;
    const s = a2 <= 0 ? 0 : Math.min(1, a2 / b.slide), v = b.v0 * (1 - s * s);
    if (s < 1) { const [B0, B1, T1, T0] = fc.pts, lo = [lerp(B0[0], B1[0], b.u), lerp(B0[1], B1[1], b.u), lerp(B0[2], B1[2], b.u)], hi = [lerp(T0[0], T1[0], b.u), lerp(T0[1], T1[1], b.u), lerp(T0[2], T1[2], b.u)];
      return { p: add3([lerp(lo[0], hi[0], v), lerp(lo[1], hi[1], v), lerp(lo[2], hi[2], v)], fc.n, r * .7), r, on: b.ci, n: fc.n }; }
    const a3 = a2 - b.slide, k = a3 / b.roll; if (k >= 1) return null;
    const [B0, B1] = fc.pts, st = [lerp(B0[0], B1[0], b.u) + fc.n[0] * .006, XTAL[1] + r, lerp(B0[2], B1[2], b.u) + fc.n[2] * .006], e = POOL.c;
    const kk = easeIO(k), side = Math.sin(PI * kk) * .012 * b.ang;
    return { p: [lerp(st[0], e[0], kk) - side * (e[2] - st[2]) * 20, XTAL[1] + r, lerp(st[2], e[2], kk) + side * (e[0] - st[0]) * 20], r: r * (1 - .5 * kk * kk), floor: true };
  };
  function bead(x, p, r, cam, t) {
    const q = cam.proj(p); if (!q) return;
    const R = Math.max(1, r * q[3]);
    const g = x.createRadialGradient(q[0] - R * .35, q[1] - R * .4, 0, q[0], q[1], R * 1.05);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.3, '#dfe4ec'); g.addColorStop(.75, '#7d8592'); g.addColorStop(1, '#3c414c');
    x.fillStyle = g; x.beginPath(); x.arc(q[0], q[1], R, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,150,70,.55)'; x.beginPath(); x.ellipse(q[0] + R * .38, q[1] + R * .42, R * .32, R * .2, -.6, 0, TAU); x.fill();
  }
  function beadsOn(x, cam, t, ci) {
    for (const b of BEADS) { if (b.ci !== ci || t < b.tb) continue; const s = beadPos(b, t); if (!s || s.floor) continue; if (!S3.facing(cam, s.p, s.n)) continue; bead(x, s.p, s.r, cam, t); }
  }
  const BEATS = (() => { const o = []; for (let k = 0; k < 6; k++) { const t0 = T_LIFE - .42 + k * .84; o.push(t0, t0 + .24); } return o; })();
  const TIP = () => { const c = XTALS[1]; return [c.P[0], c.P[1] - .004, c.P[2]]; };
  const DROP_FALL = Math.sqrt(2 * (TIP()[1] - POOL.c[1]) / 9.8);
  const spillK = t => ss(T_SPILL - .5, T_SPILL, t);
  const poolR = t => .012 + .03 * ss(T_SWEAT + .7, T_METAL, t);
  function poolPts(t, y = POOL.c[1], k = 1) {
    const r = poolR(t) * k, sp = spillK(t), c = POOL.c, o = [];
    let wob = 0; for (const b of BEATS) { const a = t - b; if (a > 0 && a < .9) wob += .05 * Math.exp(-a * 5) * (b === BEATS[0] || BEATS.indexOf(b) % 2 === 0 ? 1 : .6); }
    for (let i = 0; i < 44; i++) {
      const a = i / 44 * TAU, ca = Math.cos(a), w = 1 + .025 * Math.sin(5 * a + t * 2.6) + wob * Math.sin(3 * a + t * 20);
      const reach = sp * Math.pow(Math.max(0, ca), 6) * (DISH.r + .012 - (c[0] - DISH.c[0]) - r);
      o.push([c[0] + (r * w + reach) * ca, y, c[2] + r * w * Math.sin(a) * .92]);
    }
    return o;
  }
  function pool(x, cam, t) {
    if (t < T_SWEAT + .3) return;
    if (!path(x, cam, poolPts(t))) return;
    const c = cam.proj(POOL.c); if (!c) return;
    const R = Math.max(6, poolR(t) * c[3] * 1.3), g = x.createRadialGradient(c[0] - R * .25, c[1] - R * .2, 0, c[0], c[1], R * 1.2);
    g.addColorStop(0, '#d8dee6'); g.addColorStop(.08, '#a8b0bc'); g.addColorStop(.5, '#6c7482'); g.addColorStop(1, '#3e434e');
    x.fillStyle = g; x.fill();
    x.save(); x.clip();
    x.fillStyle = 'rgba(255,150,70,.22)'; x.beginPath(); x.ellipse(c[0] + R * .3, c[1] + R * .12, R * .22, R * .1, 0, 0, TAU); x.fill();
    for (const b of BEATS) {
      const a = t - b; if (a < 0 || a > .9) continue;
      const u = a / .9, tip = TIP(), rr = .004 + poolR(t) * 1.1 * u, pts = [];
      for (let i = 0; i < 32; i++) { const th = i / 32 * TAU; pts.push([tip[0] + rr * Math.cos(th), POOL.c[1] + .0004, tip[2] + rr * Math.sin(th) * .92]); }
      if (!path(x, cam, pts)) continue;
      x.strokeStyle = `rgba(255,255,255,${.7 * (1 - u)})`; x.lineWidth = Math.max(1, .0016 * c[3]); x.stroke();
    }
    x.restore();
    path(x, cam, poolPts(t)); x.strokeStyle = 'rgba(40,44,52,.6)'; x.lineWidth = Math.max(1, .001 * c[3]); x.stroke();
  }
  function drops(x, cam, t) {
    const tip = TIP();
    for (const b of BEATS) {
      const t0 = b - DROP_FALL - .3, a = t - t0; if (a < 0 || a > .3 + DROP_FALL) continue;
      const sw = Math.min(1, a / .3), f = Math.max(0, a - .3), r = .002 + .0022 * sw;
      bead(x, [tip[0], tip[1] - r - 4.9 * f * f, tip[2]], r, cam, t);
    }
  }
  function dishInside(x, cam, t) {
    const [cx, cz] = DISH.c, lt = LIGHT([cx, DISH.y + .1, cz], t);
    if (!path(x, cam, ringPts(cx, cz, DISH.r - .003, DISH.y + DISH.d - .001, 48))) return;
    x.save(); x.clip();
    x.fillStyle = S3.shade('#7a5e36', [0, .4, -1], lt, { lo: .3, ink: NIGHT }); x.fill();
    if (path(x, cam, ringPts(cx, cz, DISH.r - .012, DISH.y, 48))) { x.fillStyle = S3.shade('#5a4428', [0, 1, 0], lt, { lo: .35, ink: NIGHT }); x.fill(); }
    pool(x, cam, t);
    const fl = [];
    for (const b of BEADS) { if (t < b.tb) continue; const s = beadPos(b, t); if (s && s.floor) fl.push(s); }
    const dc = cam.depth(XTAL);
    for (const s of fl) if (cam.depth(s.p) > dc) bead(x, s.p, s.r, cam, t);
    x.restore();
    dishRim(x, cam, false);
    crystal(x, cam, t);
    if (path(x, cam, ringPts(cx, cz, DISH.r - .003, DISH.y + DISH.d - .001, 48))) { x.save(); x.clip(); for (const s of fl) if (cam.depth(s.p) <= dc) bead(x, s.p, s.r, cam, t); x.restore(); }
    drops(x, cam, t);
  }

  const T_DRY = T_LOGIC + .2, T_DRY1 = T_CONS + .5;
  const tailX = t => TR.x0 + (TR.x1 - TR.x0) * ss(T_DRY, T_DRY1, t);
  const SILV = '#aab2be';
  function ribbon(x, cam, a, b, wm, col) {
    const pa = cam.proj(a), pb = cam.proj(b); if (!pa || !pb) return;
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, wa = wm * pa[3], wb = wm * pb[3];
    x.fillStyle = col; x.beginPath(); x.moveTo(pa[0] + nx * wa, pa[1] + ny * wa); x.lineTo(pb[0] + nx * wb, pb[1] + ny * wb); x.lineTo(pb[0] - nx * wb, pb[1] - ny * wb); x.lineTo(pa[0] - nx * wa, pa[1] - ny * wa); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.moveTo(pa[0] - nx * wa * .3, pa[1] - ny * wa * .3); x.lineTo(pb[0] - nx * wb * .3, pb[1] - ny * wb * .3); x.lineTo(pb[0] - nx * wb * .05, pb[1] - ny * wb * .05); x.lineTo(pa[0] - nx * wa * .05, pa[1] - ny * wa * .05); x.closePath(); x.fill();
  }
  function stream(x, cam, t) {
    if (t < T_SPILL - .05) return;
    const h = headX(t), tl = Math.max(tailX(t), SPB[0] - .004), { z, w: hw, d } = TR, fy = X => trY(X) - d + .003;

    if (h <= tl + .002) return;
    const N = Math.max(2, Math.ceil((h - tl) / .04)), e0 = [], e1 = [];
    for (let i = 0; i <= N; i++) { const X = lerp(tl, h, i / N), wd = hw * .82 * (i === N ? .6 : 1); e0.push([X, fy(X), z - wd]); e1.push([X, fy(X), z + wd]); }
    const hd = [h + .018, fy(h), z];
    if (path(x, cam, [...e0, hd, ...e1.reverse()])) {
      const a = cam.proj([tl, fy(tl), z]), b = cam.proj([h, fy(h), z]);
      if (a && b) { const g = x.createLinearGradient(a[0], a[1] - 30, a[0], a[1] + 30); g.addColorStop(0, '#c6ccd6'); g.addColorStop(.5, '#959eac'); g.addColorStop(1, '#5a6270'); x.fillStyle = g; } else x.fillStyle = SILV;
      x.fill(); x.strokeStyle = 'rgba(40,44,54,.55)'; x.lineWidth = Math.max(1, cam.f / 1700); x.stroke();
    }
    x.lineCap = 'round';
    const lw = .0028 * cam.f / Math.max(.2, cam.depth([h, fy(h), z]));
    x.strokeStyle = 'rgba(236,242,250,.5)'; x.lineWidth = Math.max(1, lw * .7); x.beginPath(); S3.line(x, cam, [tl + .01, fy(tl) + .002, z + hw * .45], [h - .02, fy(h) + .002, z + hw * .45]); x.stroke();
    for (let k = 0; k < 34; k++) {
      const sp = .9 + .7 * F.hash(k, 5), X = TR.x0 + ((F.hash(k, 3) * 2.2 + sp * t) % 2.2); if (X < tl + .01 || X > h - .03) continue;
      const dz = (F.hash(k, 7) - .5) * hw * 1.1, L2 = .012 + .05 * F.hash(k, 9) * F.hash(k, 11);
      x.strokeStyle = `rgba(255,255,255,${.35 + .45 * F.hash(k, 13)})`; x.lineWidth = Math.max(1, lw * (.5 + .7 * F.hash(k, 17))); x.beginPath();
      S3.line(x, cam, [X, fy(X) + .002, z + dz], [Math.min(h - .02, X + L2), fy(X + L2) + .002, z + dz * .8]); x.stroke();
    }
    x.lineCap = 'butt';

  }

  const RUST = (() => { const R = F.rng(2024), o = []; for (let i = 0; i < 26; i++) o.push([-120 + 245 * R(), -9 + 18 * R(), 5 + 12 * R(), R()]); return o; })();
  function knife(x, cam, t) {
    const k = ss(T_RUST - .05, T_RUST + 1.1, t), X = ITEMS.knife.x, m = .00125, lt = LIGHT([X, 1.1, ZI], t), lit2 = Math.max(0, dot([0, 1, 0], lt)), ca = Math.cos(.16), sa = Math.sin(.16);
    S3.onPlane(x, cam, [X, BENCH.y2 + .003, ZI], [m * ca, 0, -m * sa], [-m * sa, 0, -m * ca], xx => {
      const shape = () => { xx.beginPath(); xx.moveTo(-60, -9); xx.lineTo(108, -9); xx.quadraticCurveTo(132, -8, 140, 0); xx.quadraticCurveTo(120, 9, 90, 11); xx.lineTo(-60, 10); xx.closePath();
        xx.rect(-122, -6, 62, 12); xx.moveTo(-122 + 16, 0); xx.arc(-138, 0, 16, 0, TAU); };
      xx.fillStyle = 'rgba(0,0,0,.45)'; xx.save(); xx.translate(4, 5); shape(); xx.fill('evenodd'); xx.restore();
      shape(); xx.fillStyle = S3.mix(S3.mix('#3a404c', '#7a8496', .5 * lit2), '#6a3418', .55 * k); xx.fill('evenodd');
      xx.save(); shape(); xx.clip('evenodd');
      xx.strokeStyle = `rgba(210,220,236,${.75 * (1 - k)})`; xx.lineWidth = 2.5; xx.beginPath(); xx.moveTo(-56, -6); xx.lineTo(106, -6); xx.stroke();
      for (const [sx, sy, r, q] of RUST) { const rr = r * Math.pow(clamp(k * 1.3 - q * .3), .7); if (rr <= .2) continue; xx.fillStyle = q < .5 ? 'rgba(150,62,22,.9)' : 'rgba(176,96,34,.85)'; xx.beginPath(); xx.arc(sx, sy, rr, 0, TAU); xx.fill(); }
      if (k > .55) { xx.fillStyle = `rgba(30,12,6,${(k - .55) * 1.6})`; for (const [sx, sy, r] of RUST) { xx.beginPath(); xx.arc(sx + r * .3, sy - r * .2, 1.6, 0, TAU); xx.fill(); } }
      xx.restore();
      xx.strokeStyle = '#151820'; xx.lineWidth = 1.6; shape(); xx.stroke();
      xx.strokeStyle = 'rgba(20,16,12,.8)'; xx.lineWidth = 2; for (let i = 0; i < 8; i++) { xx.beginPath(); xx.moveTo(-118 + i * 7.5, -6); xx.lineTo(-114 + i * 7.5, 6); xx.stroke(); }
    });
  }
  const MOULD = (() => { const R = F.rng(808), o = []; for (let i = 0; i < 22; i++) o.push([R() * TAU, .3 + .7 * R(), R(), R() < .5]); return o; })();
  function wood(x, cam, t) {
    const k = ss(T_ROT - .05, T_ROT + 1.2, t), X = ITEMS.wood.x, r = .04, y = BENCH.y2 + r, z0 = ZI - .085, z1 = ZI + .085, lt = LIGHT([X, y, z0 - .2], t);
    S3.shadow(x, cam, [X, ZI], r * 1.3, .1, .4, BENCH.y2);
    S3.bar(x, cam, [X, y, z1], [X, y, z0], r, { col: S3.mix('#6a4428', '#221810', .75 * k), light: lt, lo: .3, ink: NIGHT, n: 16, cap: S3.mix('#a8784a', '#2e2216', .8 * k) });
    S3.onPlane(x, cam, [X, y, z0 - .001], [.001, 0, 0], [0, -.001, 0], xx => {
      xx.strokeStyle = `rgba(70,40,20,${.7 * (1 - .8 * k)})`; xx.lineWidth = 1.2;
      for (let i = 1; i <= 6; i++) { xx.beginPath(); for (let j = 0; j <= 32; j++) { const a = j / 32 * TAU, rr = i * 5.6 * (1 + .05 * Math.sin(3 * a + i)); j ? xx.lineTo(rr * Math.cos(a), rr * Math.sin(a)) : xx.moveTo(rr * Math.cos(a), rr * Math.sin(a)); } xx.stroke(); }
      xx.strokeStyle = 'rgba(20,12,8,.9)'; xx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + .4, L = 38 * clamp(k * 1.4 - i * .12); if (L <= 0) continue; xx.beginPath(); xx.moveTo(4 * Math.cos(a), 4 * Math.sin(a)); xx.lineTo(L * Math.cos(a + .1), L * Math.sin(a + .1)); xx.stroke(); }
      for (const [a, rr, q, pale] of MOULD) { const s = 4.5 * clamp(k * 1.5 - q * .5); if (s <= .1) continue; xx.fillStyle = pale ? 'rgba(190,200,170,.8)' : 'rgba(120,140,100,.75)'; xx.beginPath(); xx.arc(rr * 36 * Math.cos(a), rr * 36 * Math.sin(a), s, 0, TAU); xx.fill(); }
      if (k > .3) { xx.fillStyle = '#120c0a'; for (let i = 0; i < 7; i++) { const a = i * .9 + 2.2, s = 9 * clamp((k - .3) * 1.6 - i * .05); if (s <= 0) continue; xx.beginPath(); xx.arc(40 * Math.cos(a), 40 * Math.sin(a), s, 0, TAU); xx.fill(); } }
    });
    if (k > .4) for (let i = 0; i < 9; i++) { const q = clamp((k - .4) * 2 - i * .06); if (q <= 0) continue; const p = cam.proj([X + (F.hash(i, 3) - .5) * .09, BENCH.y2 + .003, z0 - .015 - .03 * F.hash(i, 4)]); if (!p) continue; x.fillStyle = '#1a120c'; x.beginPath(); x.ellipse(p[0], p[1], .004 * p[3] * q, .0022 * p[3] * q, 0, 0, TAU); x.fill(); }
  }
  const PETALS = (() => { const R = F.rng(1212), o = []; for (let i = 0; i < 26; i++) o.push({ a: i / 26 * TAU + R() * .1, L: .8 + .3 * R(), fall: i % 4 === 1 ? T_DIES + .35 + .5 * R() : null, sx: (R() - .5) * .07, sz: -.02 - .05 * R(), sp: R() }); return o; })();
  function flower(x, cam, t) {
    const k = ss(T_DIES - .05, T_DIES + 1.3, t), X = ITEMS.flower.x, lt = LIGHT([X, 1.15, ZI], t), o = { col: BRZ, light: lt, lo: .25, ink: NIGHT }, y0 = BENCH.y2;
    S3.shadow(x, cam, [X, ZI], .05, .04, .45, y0);
    S3.cyl(x, cam, [X, ZI], .032, y0, y0 + .07, o);
    S3.cyl(x, cam, [X, ZI], .018, y0 + .07, y0 + .1, o);
    S3.cyl(x, cam, [X, ZI], .024, y0 + .1, y0 + .108, { ...o, col: BRZ_D });
    const m = .001, u = [Math.cos(cam.yaw) * m, 0, -Math.sin(cam.yaw) * m], O = [X, y0 + .104, ZI];
    const droop = 1.9 * k, tipX = 60 * Math.sin(droop * .62), tipY = -150 + 90 * (1 - Math.cos(droop * .62)) + 30 * k;
    const head = { x: tipX + 14 * Math.sin(droop), y: tipY + 8 * (1 - Math.cos(droop)) };
    const petalCol = S3.mix('#efe6cf', '#7a5a30', k), centre = S3.mix('#e0b040', '#5a4020', k);
    S3.onPlane(x, cam, O, u, [0, -m, 0], xx => {
      xx.strokeStyle = S3.mix('#4a6a3a', '#4a3a20', k); xx.lineWidth = 3.2; xx.lineCap = 'round';
      xx.beginPath(); xx.moveTo(0, 0); xx.quadraticCurveTo(4, -80, tipX, tipY); xx.stroke();
      for (const [sv, sg] of [[.35, -1], [.6, 1]]) {
        const lx = lerp(0, tipX, sv * sv) + 2, ly = lerp(0, tipY, sv), a = sg * (.7 + .9 * k) - PI / 2 + (sg < 0 ? PI : 0);
        xx.save(); xx.translate(lx, ly); xx.rotate(sg > 0 ? .5 + 1.1 * k : PI - .5 - 1.1 * k); xx.fillStyle = S3.mix('#3e5e30', '#4a3a1e', k);
        xx.beginPath(); xx.moveTo(0, 0); xx.quadraticCurveTo(14, -9, 30 * (1 - .25 * k), 0); xx.quadraticCurveTo(14, 7, 0, 0); xx.fill(); xx.restore(); void a;
      }
      xx.save(); xx.translate(head.x, head.y); xx.rotate(droop * .9); xx.scale(1, Math.max(.25, Math.cos(Math.min(1.25, droop * .8))));
      for (const P of PETALS) { if (P.fall && t > P.fall) continue; const L = 32 * P.L * (1 - .35 * k); xx.save(); xx.rotate(P.a); xx.fillStyle = petalCol; xx.beginPath(); xx.ellipse(L * .55, 0, L * .55, 4.2 * (1 - .3 * k), 0, 0, TAU); xx.fill(); xx.strokeStyle = 'rgba(60,40,20,.45)'; xx.lineWidth = .8; xx.stroke(); xx.restore(); }
      xx.fillStyle = centre; xx.beginPath(); xx.arc(0, 0, 9 * (1 - .2 * k), 0, TAU); xx.fill();
      xx.restore();
    });
    const HW = [O[0] + u[0] * head.x, O[1] - m * head.y, O[2] + u[2] * head.x];
    for (const P of PETALS) {
      if (!P.fall || t < P.fall) continue;
      const a = t - P.fall, T = Math.sqrt(2 * (HW[1] - y0) / 2.2), s = Math.min(1, a / T), yy = HW[1] - (HW[1] - y0 - .002) * s * s;
      const p = cam.proj([HW[0] + P.sx * s + .01 * Math.sin(7 * a + P.sp * 6) * (1 - s), yy, HW[2] + P.sz * s]); if (!p) continue;
      x.fillStyle = petalCol; x.beginPath(); x.ellipse(p[0], p[1], .014 * p[3], (.004 + .003 * Math.abs(Math.sin(6 * a + P.sp * 5)) * (1 - s)) * p[3], P.a + a * 2 * (1 - s), 0, TAU); x.fill();
    }
  }
  function items(x, cam, t) {
    [[ITEMS.knife.x, knife], [ITEMS.wood.x, wood], [ITEMS.flower.x, flower]].map(([X, f]) => ({ d: cam.depth([X, 1.05, ZI]), f })).sort((a, b) => b.d - a.d).forEach(o => o.f(x, cam, t));
  }

  const LA = [CUPP[0], CUPP[1] + .125, CUPP[2]], LB0 = chartAt(0, .07), LBn = (() => { const d = [LB0[0] - LA[0], LB0[1] - LA[1], LB0[2] - LA[2]], l = Math.hypot(...d); return add3(LB0, d, -.03 / l); })();
  const lineK = t => ss(T_LOGIC, T_CLEAN + .05, t);
  const runK = t => ss(T_CONS - .05, T_INC1 + .45, t);
  function silverOf(t) { return ss(T_BECOME - .05, T_INC2 + .65, t); }
  function silverBody(xx, body, k, t) {
    const lvl = .07 + k * (.95 - .07);
    xx.save(); body(); xx.moveTo(.055, .875); xx.ellipse(0, .875, .055, .062, 0, 0, TAU); xx.clip('nonzero');
    const g = xx.createLinearGradient(-.2, 0, .2, 0); g.addColorStop(0, '#6e7684'); g.addColorStop(.42, '#e4e9f0'); g.addColorStop(.55, '#ffffff'); g.addColorStop(1, '#7e8694');
    xx.fillStyle = g; xx.fillRect(-.3, 0, .6, lvl);
    if (k < 1) { xx.fillStyle = 'rgba(255,255,255,.95)'; xx.fillRect(-.3, lvl - .006, .6, .006); }
    else { const u = ((t - (T_INC2 + .65)) / 1.6) % 1, yb = -.2 + 1.4 * u; xx.fillStyle = 'rgba(255,255,255,.55)'; xx.beginPath(); xx.moveTo(-.3, yb); xx.lineTo(.3, yb + .18); xx.lineTo(.3, yb + .26); xx.lineTo(-.3, yb + .08); xx.closePath(); xx.fill(); }
    xx.restore();
  }
  function logicLine(ctx, cam, t) {
    const k = lineK(t); if (k <= 0) return;
    const LL = Math.hypot(LBn[0] - LA[0], LBn[1] - LA[1], LBn[2] - LA[2]), kk = Math.max(k, Math.min(1, .085 / LL));
    const H = [lerp(LA[0], LBn[0], kk), lerp(LA[1], LBn[1], kk), lerp(LA[2], LBn[2], kk)], pa = cam.proj(LA), ph = cam.proj(H); if (!pa || !ph) return;
    const dx = ph[0] - pa[0], dy = ph[1] - pa[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    const pe = cam.proj(LBn), ke = pe ? pe[3] : ph[3], wA = .011 * ke, wH = .011 * ke, hl = .075 * ke, hw = .032 * ke, bl = Math.min(l, hl), bx = ph[0] - ux * bl, by = ph[1] - uy * bl;
    const shape = () => { ctx.beginPath(); if (l > hl) { ctx.moveTo(pa[0] + nx * wA, pa[1] + ny * wA); ctx.lineTo(bx + nx * wH, by + ny * wH); } else ctx.moveTo(bx + nx * wH, by + ny * wH);
      ctx.lineTo(bx + nx * hw, by + ny * hw); ctx.lineTo(ph[0], ph[1]); ctx.lineTo(bx - nx * hw, by - ny * hw); ctx.lineTo(bx - nx * wH, by - ny * wH); if (l > hl) ctx.lineTo(pa[0] - nx * wA, pa[1] - ny * wA); ctx.closePath(); };
    PR.glow(ctx, (pa[0] + ph[0]) / 2, (pa[1] + ph[1]) / 2, l * .7, '#cfe0ff', .08 + .1 * runK(t), 'flat');
    shape(); ctx.fillStyle = '#d6dce6'; ctx.fill();
    const r = runK(t);
    if (r > 0) {
      ctx.save(); shape(); ctx.clip();
      const sx = pa[0] + dx * r * 1.02, sy = pa[1] + dy * r * 1.02, g = ctx.createLinearGradient(pa[0], pa[1], sx, sy);
      g.addColorStop(0, '#9aa4b2'); g.addColorStop(.85, '#f4f7fb'); g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(pa[0] - nx * hw * 2, pa[1] - ny * hw * 2); ctx.lineTo(pa[0] + nx * hw * 2, pa[1] + ny * hw * 2); ctx.lineTo(sx + nx * hw * 2, sy + ny * hw * 2); ctx.lineTo(sx - nx * hw * 2, sy - ny * hw * 2); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (r < 1) PR.glow(ctx, sx, sy, .05 * ph[3], '#ffffff', .8, 'flat');
    }
    shape(); ctx.strokeStyle = '#141826'; ctx.lineWidth = Math.max(2, .004 * ke); ctx.lineJoin = 'miter'; ctx.stroke();
  }
  const bump = (t, a, b, c) => ss(a, b, t) * (1 - ss(b + .2, c, t));
  function overSheets(ctx, cam, t) {
    const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    const cb = cam.proj([BRAZ.c[0], BRAZ.y1 - .01, BRAZ.c[1]]); if (cb) PR.glow(ctx, cb[0], cb[1], Math.min(.22 * cb[3], .22 * W), '#ff7a30', .1 + .22 * heat(t), 'flat');
    const hk = heat(t);
    if (hk > 0 && t < T_FLOWS + 1) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const life = .7 + .5 * F.hash(i, 21), ph = F.hash(i, 22) * life, u = ((t - T_HEAT + ph) % life) / life, a0 = F.hash(i, 23) * TAU;
        if (t - T_HEAT + ph < 0 || Math.cos(a0) * (cam.pos[0] - BRAZ.c[0]) + Math.sin(a0) * (cam.pos[2] - BRAZ.c[1]) < 0) continue;
        const p = cam.proj([BRAZ.c[0] + (DISH.r + .012) * Math.cos(a0) + .02 * Math.sin(u * 6 + i), BRAZ.y1 + .01 + .16 * u, BRAZ.c[1] + (DISH.r + .012) * Math.sin(a0)]); if (!p) continue;
        ctx.fillStyle = `rgba(255,${170 + 60 * (1 - u) | 0},70,${.85 * hk * (1 - u)})`; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1, .0018 * p[3]), 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    const cu = cam.proj([CUPP[0], CUPP[1] + .06, CUPP[2]]), ca = bump(t, T_DRINK - .1, T_ETER, T_ETER + 1.2); if (cu && ca > 0) PR.glow(ctx, cu[0], cu[1], .22 * cu[3], '#ffe0a8', .5 * ca, 'flat');
    const cx = cam.proj([XTAL[0], XTAL[1] + .06, XTAL[2]]), xa = Math.max(bump(t, T_CINN - .1, T_CINN + .25, T_CINN + 1.4), .8 * bump(t, T_BLOOD - .1, T_BLOOD + .3, T_CRYS + .6));
    if (cx && xa > 0) PR.glow(ctx, cx[0], cx[1], Math.min(.14 * cx[3], .2 * W), '#ff3a30', .4 * xa, 'flat');
    logicLine(ctx, cam, t);
    const sk = silverOf(t); if (sk > 0) { const pb = cam.proj(chartAt(0, .5)); if (pb) PR.glow(ctx, pb[0], pb[1], .5 * pb[3], '#e8f0ff', .22 * sk, 'flat'); }
    const ta = ss(T_CINN - .05, T_CINN + .2, t) * (1 - ss(T_HEAT - .5, T_HEAT - .1, t));
    if (ta > 0) {
      const p = cam.proj([XTAL[0] - .008, XTAL[1] + .125, XTAL[2]]);
      if (p) {
        const s1 = M45 ? 40 : 46, s2 = Math.round(s1 * .8), bh2 = s2 * 1.26, lift = (bh2 + 8) * ss(T_MERC - .1, T_MERC + .25, t), x0 = clamp(p[0], W * .2, W * .8), y0 = Math.max(p[1], H * .05 + 2 * s1 * 1.26 + 40);
        QM.tag(ctx, x0, y0, 'CINNABAR', { alpha: ta, size: s1, stem: 30, lift, card: '#f5ecd8', accent: '#b5372b' });
        QM.tag(ctx, x0, y0, 'MERCURY SULFIDE', { alpha: ta * ss(T_MERC - .05, T_MERC + .2, t), size: s2, stem: 30, card: '#f5ecd8', accent: '#9aa2ae' });
      }
    }
    ctx.restore();
  }

  function benchGroup(x, cam, t) {
    bench(x, cam, t);
    items(x, cam, t);
    troughBack(x, cam, t);
    stream(x, cam, t);
    brazier(x, cam, t); dishOutside(x, cam, t); dishInside(x, cam, t); dishRim(x, cam, true);
    troughFront(x, cam, t);
    cup(x, cam, t); cupPour(x, cam, t);
    endSpout(x, cam, t);
  }
  function draw(ctx, t) {
    const cam = camAt(t), outside = cam.pos[2] < ZO + .05;
    LB.background(ctx);
    LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; shell(x, cam, t); chart(x, cam, t, silverOf(t)); }, { rim: false, shadow: false, fibre: .3 });
    LB.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      shelves(x, cam, t);
      const L = [{ d: cam.depth([FURN[0].c[0], .4, FURN[0].c[1]]), f: () => furnace(x, cam, t, 0) }, { d: cam.depth([FURN[1].c[0], .4, FURN[1].c[1]]), f: () => furnace(x, cam, t, 1) },
        { d: cam.depth([0, 1, 4.5]), f: () => benchGroup(x, cam, t) }, { d: cam.depth([0, 2.3, 1.9]), f: () => hanging(x, cam, t) }];
      L.sort((a, b) => b.d - a.d).forEach(o => o.f());
    }, { rimColor: '#ffc27a', rimShift: [1, .25], rimAlpha: .45, glow: .12, glowColor: '#ffae4a', glowBlur: 10 });
    furnaceGlow(ctx, cam, t);
    overSheets(ctx, cam, t);
    if (outside) {
      LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; courtyard(x, cam, t); facade(x, cam, t); eaves(x, cam, t); }, { rim: false, glow: .08, glowColor: '#ff9a4a', glowBlur: 12 });
      LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; [[CENSER, censer], [LANTERN, lantern]].map(([p, f]) => ({ d: cam.depth([p[0], .8, p[1]]), f })).sort((a, b) => b.d - a.d).forEach(o => o.f(x, cam, t)); }, { rimColor: '#ffb070', rimShift: [0, -1], rimAlpha: .45, glow: .1, glowColor: '#ff9a4a', glowBlur: 10 });
      smokeSparks(ctx, cam, t);
    }
    LB.grade(ctx, T0() + t);
  }

  F.scene('seq-20', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-19', dur: .9, dir: 'right' },
    sfx: [
      { t: .3, type: 'wind', dur: 2.6, g: .05 },
      { t: .9, type: 'rumble', dur: 2.4, g: .06 },
      { t: 2.7, type: 'swoosh', dur: .7, g: .06 },
      { t: 3.2, type: 'lib', dur: DUR - 3.2, label: 'A FURNACE ROARING SOFTLY IN A STONE ROOM, CHARCOAL TICKING' },
      { t: 3.3, type: 'rumble', dur: 3.2, g: .07 },
      { t: T_DRINK + .15, type: 'clink', f: 3100, g: .08 },
      { t: T_CINN, type: 'tick', g: .16 },
      { t: T_CINN + .02, type: 'shimmer', g: .1 },
      { t: T_MERC - .1, type: 'whoosh', f0: 60, f1: 110, dur: 1.9, g: .06 },
      ...[T_MERC + .35, T_SULF + .5, T_BLOOD + .3].map((tt, i) => ({ t: tt, type: 'clink', f: 4000 + 300 * i, g: .03, noSnap: true })),
      { t: T_HEAT - .05, type: 'rumble', dur: 2.4, g: .13 },
      { t: T_HEAT + .2, type: 'hiss', g: .025 },
      ...BEADS.map(b => b.tb + b.grow + b.hold + b.slide).filter(tt => tt > T_SWEAT && tt < T_FLOWS).filter((tt, i) => i % 3 === 0).map((tt, i) => ({ t: tt, type: 'drip', g: .035 + .01 * (i % 2), noSnap: true })),
      ...BEATS.map(tt => ({ t: tt, type: 'drip', g: .07, noSnap: true })),
      ...BEATS.filter((tt, i) => i % 2 === 0 && tt > T_LIFE - .5).map(tt => ({ t: tt, type: 'heartbeat', g: .1, noSnap: true })),
      { t: T_SPILL, type: 'splash', g: .05 },
      { t: T_SPILL + .1, type: 'lib', dur: T_POUR - T_SPILL + 1, label: 'A THIN STREAM OF HEAVY LIQUID RUNNING IN A BRONZE CHANNEL' },
      { t: T_RUST, type: 'crack', g: .05 },
      { t: T_RUST + .25, type: 'scrub', dur: .6, g: .03 },
      { t: T_ROT, type: 'creak', dur: .5, g: .06 },
      ...[0, 1, 2].map(i => ({ t: T_ROT + .45 + .12 * i, type: 'tap', g: .04, noSnap: true })),
      { t: T_DIES + .3, type: 'flutter', g: .06 },
      { t: T_POUR, type: 'splash', g: .06 },
      { t: T_LOGIC, type: 'marker', dur: T_CLEAN - T_LOGIC, g: .06 },
      { t: T_CLEAN + .05, type: 'tick', g: .14 },
      { t: T_CONS, type: 'riser', dur: 1.2, f0: 600, f1: 1600, g: .06 },
      { t: T_BECOME, type: 'shimmer', g: .18 },
      { t: T_INC2 + .4, type: 'shimmer', g: .12 },
    ],
    api: { DUR, camAt, diag: () => ({ LA, LBn, CUPP, CUP_M, BODY, CHART, chartAt, cupFill, silverOf, PTS }) },
  });
})();
