(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, QM = F.qinmap, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-24'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

  const T_RAGE = 0.21, T_WIT = 0.69;
  const T_TWO = 1.84, T_IMM = 2.61, T_HOU = 4.37, T_LU = 5.14, T_FLED = 6.35;
  const T_SAY = 7.53, T_NO = 7.94, T_ELIX = 8.07, T_WORK = 9.09, T_RULER = 9.63, T_TYR = 10.23;

  const NIGHT = '#07061a', SHADOW = '#120a1c';
  const WZ = 1, WZ0 = -1, WH = 5, GW = 2.6, GH = 4.2;
  const T1 = { x0: -26, x1: 26, z0: -46, z1: -14, y1: 6 }, T2 = { x0: -21, x1: 21, z0: -42, z1: -18, y1: 12 };
  const HALL = { x0: -17, x1: 17, z0: -38, z1: -24, y0: 12.6, y1: 20 }, SCR = { y0: 12.9, y1: 19.4 };
  const EAVE = { x: 19.6, zf: -20.4, zb: -41.6, y: 20 }, RIDGE = { x: 11, z: -31, y: 26.8 };
  const SHX = -1.4, CUPX = 3.4;
  const GX = -1.6, GZ = -50;
  const LANT_OUT = [[4.4, 2.9], [-4.4, 2.9]], LANT_IN = [[4.4, -5], [-4.4, -5], [4.4, -11], [-4.4, -11]];
  const SIDE = (() => {
    const o = []; for (const sg of [-1, 1]) for (const [x, z, w2, d2, h] of [[12, -7, 4.5, 3, 4], [22, -10, 5, 3, 4.5], [33, -8, 5.5, 3, 4.2], [44, -11, 6, 2.5, 5]]) o.push({ x: sg * x, z, w: w2, d: d2, h });
    return o;
  })();

  const flick = t => 1 + .06 * Math.sin(t * 13.7) + .04 * Math.sin(t * 23.1 + 1.3);
  const erratic = t => bump(t, -.5, 0, T_WIT + .3, T_WIT + .9) * (.6 + .4 * Math.sin(t * 3.1));
  const flare = t => bump(t, T_RAGE - .1, T_RAGE + .15, T_RAGE + .6, T_HOU) + 1.2 * ss(T_RULER - .15, T_TYR, t);
  const silver = t => (1 - ss(T_NO, T_WORK + .35, t)) * (1 - .45 * bump(t, T_NO, T_NO + .08, T_NO + .16, T_NO + .3) - .35 * bump(t, T_ELIX + .1, T_ELIX + .18, T_ELIX + .26, T_ELIX + .4));
  const rise = t => ss(T_RULER - .1, T_TYR + .9, t);
  const swell = t => ss(T_RULER - .3, T_TYR + .3, t);

  const quad = (x, cam, P, col) => { if (S3.poly(x, cam, P)) { x.fillStyle = col; x.fill(); return true; } return false; };
  function lit(x, cam, p, r, stops) {
    const q = cam.proj(p); if (!q) { x.fillStyle = stops[stops.length - 1][1]; x.fill(); return; }
    const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], Math.max(1, r * q[3])); stops.forEach(([k, c]) => g.addColorStop(k, c)); x.fillStyle = g; x.fill();
  }
  const lines = (x, cam, segs, col, wpx) => { x.strokeStyle = col; x.lineWidth = wpx; x.beginPath(); for (const [a, b] of segs) S3.line(x, cam, a, b); x.stroke(); };

  function ground(x, cam, t, o = {}) {
    const Z1 = o.z1 ?? 45;
    if (S3.poly(x, cam, [[-120, 0, -60], [120, 0, -60], [120, 0, Z1], [-120, 0, Z1]])) lit(x, cam, [0, 0, 3], 26, [[0, '#2c1e2a'], [.45, '#140f24'], [1, '#08071a']]);
    if (S3.poly(x, cam, [[-120, 0, 1.4], [120, 0, 1.4], [120, 0, 8.8], [-120, 0, 8.8]])) lit(x, cam, [0, 0, 3.5], 15, [[0, '#4a3030'], [.4, '#221a2c'], [1, '#0e0c20']]);
    if (S3.poly(x, cam, [[-40, 0, WZ0], [40, 0, WZ0], [40, 0, T1.z1], [-40, 0, T1.z1]])) lit(x, cam, [0, 0, -9], 16, [[0, '#4e3430'], [.5, '#2a1e2c'], [1, '#100d22']]);
    const segs = []; for (let X = -40; X <= 40; X += 1.2) segs.push([[X, .005, WZ0], [X, .005, T1.z1]]); for (let Z = WZ0 - 1.2; Z > T1.z1; Z -= 1.2) segs.push([[-40, .005, Z], [40, .005, Z]]);
    lines(x, cam, segs, 'rgba(4,3,10,.45)', 1);
    for (const [lx, lz] of [...LANT_OUT, ...LANT_IN]) if (S3.poly(x, cam, [[lx - 3.5, .01, lz - 3.5], [lx + 3.5, .01, lz - 3.5], [lx + 3.5, .01, lz + 3.5], [lx - 3.5, .01, lz + 3.5]])) lit(x, cam, [lx, 0, lz], 3.5, [[0, `rgba(255,160,80,${.32 * flick(t + lx)})`], [1, 'rgba(255,160,80,0)']]);
  }
  const HILLS = (() => { const o = []; for (let i = 0; i <= 60; i++) { const X = -700 + 1400 * i / 60; o.push([X, 18 + 34 * hash(i, 3) + 18 * Math.sin(i * .37), -420]); } return o; })();
  function hills(x, cam) {
    const P = [[-700, 0, -420], ...HILLS, [700, 0, -420]];
    if (S3.poly(x, cam, P)) { x.fillStyle = '#0c0a24'; x.fill(); }
  }
  function haze(ctx, cam, t, k = 1) {
    const q = cam.proj([giantAt(cam, Math.max(.01, rise(t)), swell(t)).x, 30, GZ - 6]); if (!q) return; const sh = SH(), r = 46 * q[3], a = k * (.4 + .9 * rise(t)) * flick(t * .5);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, `rgba(230,120,50,${.5 * a})`); g.addColorStop(.4, `rgba(170,70,40,${.3 * a})`); g.addColorStop(1, 'rgba(90,30,40,0)');
    ctx.fillStyle = g; ctx.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r); ctx.restore();
  }
  const HPOSE = Q.kneel({ lean: -.04, head: -.02, arms: [[.45, 1.25], [.5, 1.3]] });
  const SIL = Q.silhouette('emperor', SHADOW, SHADOW), GIANT = Q.silhouette('emperor', '#0a0612', '#0a0612'), FIRE = Q.silhouette('emperor', '#ff7a2a', '#ff7a2a');
  const KOPT = { kneel: true, crown: true, beard: true, profile: true, tilt: 0, shadow: 0 };
  const HJ = Mo.joints(HPOSE).head;
  function giantAt(cam, r, sw) {
    const m = .1 + .22 * r, base = 14 + 8 * r, ms = .083 * (1 + .45 * sw);
    const tq = cam.proj([SHX + HJ[0] * ms, SCR.y0 - HJ[1] * ms, HALL.z1]);
    const sx = X => { const p = cam.proj([X + HJ[0] * m, base - HJ[1] * m, GZ]); return p ? p[0] : NaN; };
    let X = GX;
    if (tq) for (let i = 0, X0 = GX - 2, f0 = sx(X0); i < 2; i++) { const f1 = sx(X); if (!isFinite(f0) || !isFinite(f1) || Math.abs(f1 - f0) < 1e-6) break; const X2 = X + (tq[0] - f1) * (X - X0) / (f1 - f0); X0 = X; f0 = f1; X = X2; }
    return { x: X, base, z: GZ, m };
  }
  function giant(x, cam, t, o = {}) {
    const r = o.rise ?? rise(t); if (r <= 0) return;
    const G = giantAt(cam, r, swell(t)), m = G.m, base = G.base, k15 = Math.floor(t * 15), rg = .6 + .4 * (o.flare ?? 1);
    const one = (dx, dy, s, L, a) => { x.globalAlpha = a; S3.onPlane(x, cam, [G.x + dx, base + dy, GZ], [m * s, 0, 0], [0, -m * s, 0], xx => Q.draw(xx, LB.P, HPOSE, L, KOPT)); };
    x.save();
    for (let i = 1; i <= 3; i++) one((hash(k15, i) - .5) * .8, (hash(k15, i + 4) - .3) * .9, 1 + .04 * i, FIRE, .22 * rg * r);
    one(0, 0, 1, GIANT, Math.min(1, 1.6 * r));
    x.restore();
  }
  const EARTH = { col: '#3a2a3a', light: [.15, .25, 1], lo: .3, ink: NIGHT };
  function terrace(x, cam, t) {
    for (const T of [T1, T2]) {
      const y0 = T === T1 ? 0 : T1.y1;
      S3.box(x, cam, { x0: T.x0, x1: T.x1, y0, y1: T.y1, z0: T.z0, z1: T.z1 }, EARTH);
      if (S3.poly(x, cam, [[T.x0, y0, T.z1], [T.x1, y0, T.z1], [T.x1, T.y1, T.z1], [T.x0, T.y1, T.z1]])) lit(x, cam, [0, y0, T.z1], 20, [[0, '#5a3a3a'], [.5, '#33243a'], [1, '#1a1430']]);
      const segs = []; for (let y = y0 + .4; y < T.y1; y += .4) segs.push([[T.x0, y, T.z1 + .01], [T.x1, y, T.z1 + .01]]);
      lines(x, cam, segs, 'rgba(10,6,20,.35)', 1);
      quad(x, cam, [[T.x0 - .3, T.y1, T.z1 + .3], [T.x1 + .3, T.y1, T.z1 + .3], [T.x1 + .3, T.y1 + .35, T.z1 + .3], [T.x0 - .3, T.y1 + .35, T.z1 + .3]], '#1a1226');
    }
    const S0 = -3.5, S1 = T2.z1, SW = 3.2;
    for (const sg of [-1, 1]) if ((cam.pos[0] - sg * SW) * sg > 0) quad(x, cam, [[sg * SW, 0, S0], [sg * SW, T2.y1, S1], [sg * SW, 0, S1]], '#241a2e');
    if (S3.poly(x, cam, [[-SW, 0, S0], [SW, 0, S0], [SW, T2.y1, S1], [-SW, T2.y1, S1]])) lit(x, cam, [0, 0, S0], 14, [[0, '#6a4a40'], [.5, '#3c2c38'], [1, '#221a30']]);
    const segs = []; for (let i = 1; i < 40; i++) { const u = i / 40; segs.push([[-SW, T2.y1 * u + .01, lerp(S0, S1, u)], [SW, T2.y1 * u + .01, lerp(S0, S1, u)]]); }
    lines(x, cam, segs, 'rgba(14,8,22,.55)', 1);
  }
  function screens(x, cam, t, o = {}) {
    const P = [[HALL.x0, SCR.y0, HALL.z1], [HALL.x1, SCR.y0, HALL.z1], [HALL.x1, SCR.y1, HALL.z1], [HALL.x0, SCR.y1, HALL.z1]];
    if (!S3.poly(x, cam, P)) return;
    const fl = flick(t), fr = flare(t), c0 = S3.mix('#ffd48a', '#ff9a50', clamp(.5 * fr)), c1 = S3.mix('#c27a3e', '#b04a2a', clamp(.5 * fr));
    lit(x, cam, [SHX + 1, 15.6, HALL.z1], 15 * fl * (1 + .15 * fr), [[0, c0], [.55, c1], [1, '#4a2430']]);
    x.save(); x.clip();
    const m = .083 * (1 + .45 * swell(t)), er = o.calm ? 0 : erratic(t), k15 = Math.floor(t * 15), rg = clamp(fr);
    x.fillStyle = SHADOW; S3.onPlane(x, cam, [CUPX, SCR.y0 + .5, HALL.z1 + .01], [.075, 0, 0], [0, -.075, 0], xx => { xx.beginPath(); xx.moveTo(-6, 0); xx.lineTo(6, 0); xx.lineTo(3, -2); xx.lineTo(1, -2.5); xx.lineTo(1, -6); xx.quadraticCurveTo(8, -7, 8, -12); xx.lineTo(-8, -12); xx.quadraticCurveTo(-8, -7, -1, -6); xx.lineTo(-1, -2.5); xx.lineTo(-3, -2); xx.closePath(); xx.fill(); });
    S3.box(x, cam, { x0: CUPX - 2.6, x1: CUPX + 2.6, y0: SCR.y0, y1: SCR.y0 + .5, z0: HALL.z1 + .005, z1: HALL.z1 + .01 }, { col: SHADOW });
    const one = (dx, dy, s, a) => { x.globalAlpha = a; S3.onPlane(x, cam, [SHX + dx, SCR.y0 + dy, HALL.z1 + .01], [m * s, 0, 0], [0, -m * s, 0], xx => Q.draw(xx, LB.P, HPOSE, SIL, KOPT)); };
    if (rg > .01) for (let i = 1; i <= 3; i++) one((hash(k15, i) - .5) * .5 * rg, .15 * i * rg, 1 + .04 * i * rg, .28 * rg);
    if (er > .01) for (let i = 1; i <= 2; i++) one((hash(k15, 10 + i) - .5) * 1.6 * er, (hash(k15, 20 + i) - .5) * .4 * er, 1 + (hash(k15, 30 + i) - .5) * .12 * er, .5 * er);
    one(er * (hash(k15, 3) - .5) * .5, 0, 1, 1);
    x.restore();
    const segs = [];
    for (let X = HALL.x0; X <= HALL.x1 + 1e-6; X += .53) segs.push([[X, SCR.y0, HALL.z1 + .02], [X, SCR.y1, HALL.z1 + .02]]);
    for (let Y = SCR.y0; Y <= SCR.y1 + 1e-6; Y += .62) segs.push([[HALL.x0, Y, HALL.z1 + .02], [HALL.x1, Y, HALL.z1 + .02]]);
    lines(x, cam, segs, 'rgba(60,24,22,.55)', Math.max(1, cam.f / 2400));
    for (let X = HALL.x0; X <= HALL.x1 + 1e-6; X += 4.25) S3.box(x, cam, { x0: X - .2, x1: X + .2, y0: HALL.y0, y1: HALL.y1, z0: HALL.z1, z1: HALL.z1 + .1 }, { col: '#2a1418', light: [0, .2, 1], lo: .5, ink: NIGHT });
  }
  function silverGlow(ctx, cam, t) {
    const s = silver(t); if (s <= .01) return;
    const q = cam.proj([CUPX, SCR.y0 + 1.5, HALL.z1 + .05]); if (!q) return; const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    PR.glow(ctx, q[0], q[1], 2.8 * q[3], '#dfe8ff', .6 * s, 'flat'); PR.glow(ctx, q[0], q[1], .8 * q[3], '#ffffff', .9 * s, 'flat');
    ctx.restore();
  }
  function hall(x, cam, t, o = {}) {
    S3.box(x, cam, { x0: -18.6, x1: 18.6, y0: T2.y1, y1: HALL.y0, z0: -39.5, z1: -21.6 }, { col: '#3a2c34', light: [0, .3, 1], lo: .35, ink: NIGHT });
    quad(x, cam, [[HALL.x0, HALL.y0, HALL.z1], [HALL.x1, HALL.y0, HALL.z1], [HALL.x1, SCR.y0, HALL.z1], [HALL.x0, SCR.y0, HALL.z1]], '#3a1a20');
    quad(x, cam, [[HALL.x0, SCR.y1, HALL.z1], [HALL.x1, SCR.y1, HALL.z1], [HALL.x1, HALL.y1, HALL.z1], [HALL.x0, HALL.y1, HALL.z1]], '#2a1018');
    screens(x, cam, t, o);
    const fr = flare(t);
    for (let i = 0; i <= 4; i++) { const X = HALL.x0 + i * 8.5; S3.cyl(x, cam, [X, HALL.z1 + 1.4], .3, HALL.y0, HALL.y1, { col: '#4a1e22', light: [0, .2, -1], lo: .25, ink: NIGHT }); }
    quad(x, cam, [[-EAVE.x, EAVE.y, EAVE.zf], [EAVE.x, EAVE.y, EAVE.zf], [HALL.x1, HALL.y1, HALL.z1], [HALL.x0, HALL.y1, HALL.z1]], S3.mix('#1a0e18', '#6a3020', .25 + .25 * clamp(fr)));
    const A = [-EAVE.x, EAVE.y, EAVE.zf], B = [EAVE.x, EAVE.y, EAVE.zf], Cc = [EAVE.x, EAVE.y, EAVE.zb], D = [-EAVE.x, EAVE.y, EAVE.zb], R0 = [-RIDGE.x, RIDGE.y, RIDGE.z], R1 = [RIDGE.x, RIDGE.y, RIDGE.z];
    const mid = [0, (EAVE.y + RIDGE.y) / 2, (EAVE.zf + EAVE.zb) / 2];
    const face = (P, col) => {
      const u = P[1].map((v, i) => v - P[0][i]), v = P[2].map((q, i) => q - P[0][i]);
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * (P[0][0] - mid[0]) + n[1] * (P[0][1] - mid[1]) + n[2] * (P[0][2] - mid[2]) < 0) n = n.map(q => -q);
      if (S3.facing(cam, P[0], n)) quad(x, cam, P, col);
    };
    face([D, Cc, R1, R0], '#100a1a'); face([D, A, R0], '#18101f'); face([B, Cc, R1], '#18101f'); face([A, B, R1, R0], '#1c1224');
    const gw = Math.max(1.2, cam.f / 900);
    lines(x, cam, [[A, B], [A, R0], [B, R1], [R0, R1]], '#d9a443', gw);
    const tiles = []; for (let X = -EAVE.x + .6; X < EAVE.x; X += .6) tiles.push([[X, EAVE.y, EAVE.zf], [lerp(X, X * RIDGE.x / EAVE.x, 1), RIDGE.y, RIDGE.z]]);
    lines(x, cam, tiles, 'rgba(70,46,60,.4)', 1);
    for (const sg of [-1, 1]) { const p = [sg * RIDGE.x, RIDGE.y, RIDGE.z]; S3.onPlane(x, cam, p, [sg * .55, 0, 0], [0, -.55, 0], xx => { xx.fillStyle = '#b8862e'; xx.beginPath(); xx.moveTo(0, 0); xx.quadraticCurveTo(-1, -2.5, 1.5, -4); xx.quadraticCurveTo(1.2, -2.2, 2.6, -1.4); xx.lineTo(1.6, 0); xx.closePath(); xx.fill(); }); }
  }
  function sideHall(x, cam, s) {
    const o = { col: '#2a1a28', light: [0, .3, 1], lo: .35, ink: NIGHT };
    S3.box(x, cam, { x0: s.x - s.w, x1: s.x + s.w, y0: 0, y1: s.h, z0: s.z - s.d, z1: s.z + s.d }, o);
    const e = 1.1, y = s.h, yr = s.h + 2.4, A = [s.x - s.w - e, y, s.z + s.d + e], B = [s.x + s.w + e, y, s.z + s.d + e], R0 = [s.x - s.w * .55, yr, s.z], R1 = [s.x + s.w * .55, yr, s.z];
    quad(x, cam, [A, B, R1, R0], '#170f20');
    lines(x, cam, [[A, B], [R0, R1]], 'rgba(217,164,67,.7)', 1.2);
  }
  function lantern(x, cam, [lx, lz], t) {
    const o = { col: '#2a1a14', light: [0, .2, 1], lo: .4, ink: NIGHT };
    S3.bar(x, cam, [lx, 0, lz], [lx, 2.0, lz], .06, o);
    S3.box(x, cam, { x0: lx - .24, x1: lx + .24, y0: 2.0, y1: 2.5, z0: lz - .24, z1: lz + .24 }, { col: '#e09040', light: [0, 0, 1], lo: .8 });
    S3.box(x, cam, { x0: lx - .32, x1: lx + .32, y0: 2.5, y1: 2.6, z0: lz - .32, z1: lz + .32 }, o);
  }
  function passage(x, cam, t) {
    for (const sg of [-1, 1]) if ((cam.pos[0] - sg * GW) * -sg > 0) { const P = [[sg * GW, 0, WZ0], [sg * GW, 0, WZ], [sg * GW, GH, WZ], [sg * GW, GH, WZ0]]; if (S3.poly(x, cam, P)) lit(x, cam, [sg * GW, 0, WZ0], 3, [[0, '#7a4a3a'], [1, '#2a1626']]); }
    quad(x, cam, [[-GW, GH, WZ0], [GW, GH, WZ0], [GW, GH, WZ], [-GW, GH, WZ]], '#1a0e1a');
    quad(x, cam, [[-GW, 0, WZ0], [GW, 0, WZ0], [GW, 0, WZ], [-GW, 0, WZ]], '#3a2626');
  }
  function wall(x, cam, t) {
    const outer = [[-140, 0, WZ], [140, 0, WZ], [140, WH, WZ], [-140, WH, WZ]], gate = [[-GW, 0, WZ], [-GW, GH, WZ], [GW, GH, WZ], [GW, 0, WZ]];
    const a = S3.clip(cam, outer), b = S3.clip(cam, gate);
    if (a.length > 2) {
      x.beginPath(); for (const s of [a, b]) if (s.length > 2) { s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
      const q = cam.proj([0, 2.4, WZ]);
      if (q) { const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], 16 * q[3]); g.addColorStop(0, '#7a3028'); g.addColorStop(.35, '#4a1c24'); g.addColorStop(1, '#1c0c1c'); x.fillStyle = g; } else x.fillStyle = '#1c0c1c';
      x.fill('evenodd');
    }
    const segs = []; for (let y = .6; y < WH; y += .6) { segs.push([[-140, y, WZ + .01], [-GW, y, WZ + .01]]); if (y > GH) segs.push([[-GW, y, WZ + .01], [GW, y, WZ + .01]]); segs.push([[GW, y, WZ + .01], [140, y, WZ + .01]]); }
    lines(x, cam, segs, 'rgba(10,4,14,.3)', 1);
    S3.box(x, cam, { x0: -GW - .3, x1: GW + .3, y0: GH, y1: GH + .4, z0: WZ, z1: WZ + .12 }, { col: '#2a1612', light: [0, .2, 1], lo: .45, ink: NIGHT });
    S3.box(x, cam, { x0: -140, x1: 140, y0: WH, y1: WH + .35, z0: WZ0 - .3, z1: WZ + .3 }, { col: '#1a1020', light: [0, .2, 1], lo: .5, ink: NIGHT });
    lines(x, cam, [[[-140, WH, WZ + .3], [140, WH, WZ + .3]]], 'rgba(217,164,67,.75)', Math.max(1, cam.f / 1200));
    const ey = WH + .35, A = [-4.8, ey, 2.1], B = [4.8, ey, 2.1], R0 = [-2.4, ey + 1.15, 0], R1 = [2.4, ey + 1.15, 0];
    quad(x, cam, [A, B, R1, R0], '#1c1224');
    lines(x, cam, [[A, B], [R0, R1], [A, R0], [B, R1]], '#d9a443', Math.max(1.2, cam.f / 1000));
  }
  const REEDS = (() => { const R = F.rng(2407), o = []; for (let i = 0; i < 90; i++) o.push({ x: -8 + 26 * R(), z: 13 + 2.6 * R(), h: .55 + .6 * R(), l: (R() - .4) * .35, ph: R() * TAU }); return o; })();
  function reeds(x, cam, t) {
    x.fillStyle = '#04030b';
    for (const r of REEDS) {
      const sw = .05 * r.h * Math.sin(t * 1.3 + r.ph), b = cam.proj([r.x, 0, r.z]), m = cam.proj([r.x + .5 * (r.l + sw), r.h * .6, r.z]), tp = cam.proj([r.x + r.l + sw, r.h, r.z]); if (!b || !m || !tp) continue;
      const wd = Math.max(1.5, .012 * b[3]);
      x.beginPath(); x.moveTo(b[0] - wd, b[1]); x.quadraticCurveTo(m[0] - wd * .6, m[1], tp[0], tp[1]); x.quadraticCurveTo(m[0] + wd * .6, m[1], b[0] + wd, b[1]); x.closePath(); x.fill();
    }
  }

  const FIG = S3.FIG, INK = '#06050f', RIM = '#ffb870';
  const LK = { ink: Q.silhouette('alchemist', INK), rim: Q.silhouette('alchemist', RIM) };
  const pathOf = pts => { const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2])); return { pts, acc, L: acc[acc.length - 1] }; };
  const along = (P, s) => {
    s = clamp(s, 0, P.L); let i = 1; while (i < P.pts.length - 1 && P.acc[i] < s) i++;
    const a = P.pts[i - 1], b = P.pts[i], u = (s - P.acc[i - 1]) / Math.max(1e-6, P.acc[i] - P.acc[i - 1]);
    return [lerp(a[0], b[0], u), 0, lerp(a[2], b[2], u)];
  };
  const dirAt = (P, s) => { const a = along(P, s - .7), b = along(P, s + .7); return Math.atan2(b[2] - a[2], b[0] - a[0]); };
  const LOOK_AT = [0, 0, -31];
  const SCHOLARS = [
    { name: 'HOU SHENG', pts: [[.95, 0, -6.4], [.95, 0, 1.9], [3.5, 0, 5.3], [5.8, 0, 6.7]], step: 39, t0: -1.3, until: T_SAY + .05, turn: T_SAY + .08, tag: T_HOU, dx: -1 },
    { name: 'LU SHENG', pts: [[-.8, 0, -7.6], [-.8, 0, 1.5], [2.0, 0, 5.7], [4.2, 0, 7.5]], step: 37, t0: -1.15, until: T_SAY + .2, turn: T_SAY + .3, tag: T_LU, dx: 1 },
  ].map(o => {
    const P = pathOf(o.pts), G = Mo.gait({ from: 0, to: P.L / FIG, t0: o.t0, gait: 'brisk', style: { step: o.step, arms: .4, lean: .1 }, until: o.until });
    const end = along(P, P.L), d0 = dirAt(P, P.L - .01), dB = Math.atan2(LOOK_AT[2] - end[2], LOOK_AT[0] - end[0]);
    let dw = ((dB - d0) % TAU + TAU + Math.PI) % TAU - Math.PI;
    const TN = Mo.turn({ x: 0, t0: o.turn, from: 0, to: -dw, dur: .5 + .6 * Math.abs(dw) / Math.PI });
    return { ...o, P, G, d0, dw, TN };
  });
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  function scholarAt(S, cam, t) {
    const tp = Mo.pose(t);
    if (tp < S.turn) {
      const s = clamp(S.G.x(tp) * FIG, 0, S.P.L), p = along(S.P, s), dir = dirAt(S.P, s);
      return { p, pose: { ...centre(S.G(tp), S.G.x(tp)), yaw: cam.yawOf(dir) } };
    }
    const Y = cam.yawOf(S.d0), q = S.TN(tp), up = ss(T_RULER - .1, T_TYR + .4, t);
    return { p: along(S.P, S.P.L), pose: { ...q, yaw: Y + q.yaw, headYaw: Y + q.headYaw, head: (q.head || 0) - .3 * up, lean: (q.lean || .02) + .008 * Math.sin(t * 1.7 + S.step), feet: q.feet.map(f => ({ ...f, yaw: f.yaw != null ? Y + f.yaw : f.yaw })) } };
  }
  function scholar(x, cam, t, S) {
    const { p, pose } = scholarAt(S, cam, t), s0 = cam.proj(p); if (!s0) return null;
    const sc = s0[3] * FIG, eye = cam.pos, lev = Math.hypot(p[0] - eye[0], p[2] - eye[2]) / Math.hypot(p[0] - eye[0], 1 - eye[1], p[2] - eye[2]);
    const tilt = clamp(1 - lev, 0, .5), r = Math.max(1, sc * 1.5), lit = .75 + .25 * bump(t, T_WIT - .1, T_WIT + .2, T_WIT + .8, T_WIT + 1.4);
    const draw = (L, dx, dy) => { x.save(); x.translate(s0[0] + dx, s0[1] + dy); x.scale(sc, sc); Q.draw(x, LB.P, pose, L, { tilt, robe: 44, shadow: 0 }); x.restore(); };
    x.save(); x.globalAlpha = lit; draw(LK.rim, -r, -r * .7); draw(LK.rim, r, -r * .7); x.restore();
    for (let k = 0; k < 2; k++) draw(LK.ink, 0, 0);
    return { sx: s0[0], sy: s0[1] - 114 * sc, sc };
  }
  function tag(ctx, at, text, a, dx) {
    if (a <= 0 || !at) return;
    const size = M45 ? 34 : 36, padX = size * .42, padY = size * .26, sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalAlpha = a; ctx.font = `900 ${size}px NSC`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const tw = ctx.measureText(text).width, asc = size * .74, bw = tw + 2 * padX, bh = asc + 2 * padY, rise = (M45 ? 70 : 54) + (M45 && dx < 0 ? bh + 16 : 0);
    const cx = at.sx + dx * (M45 ? 30 : bw * .62), by = at.sy - rise - bh;
    ctx.strokeStyle = '#f5ecd8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(at.sx, at.sy - 4); ctx.lineTo(at.sx, at.sy - rise * .45); ctx.lineTo(cx, by + bh); ctx.stroke();
    ctx.fillStyle = 'rgba(4,3,12,.45)'; ctx.fillRect(cx - bw / 2 + 3, by + 4, bw, bh);
    ctx.fillStyle = '#f5ecd8'; ctx.fillRect(cx - bw / 2, by, bw, bh);
    ctx.fillStyle = '#d9a443'; ctx.fillRect(cx - bw / 2, by + bh - 4, bw, 4);
    ctx.fillStyle = '#1b2130'; ctx.fillText(text, cx, by + padY + asc);
    ctx.restore();
  }

  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const K = [
      [-.3, [.6, 4.0, 21.4], [.2, 8.6, -24], 1750],
      [T_WIT, [1.0, 3.95, 20.8], [.4, 8.4, -24], 1720],
      [T_HOU, [2.8, 3.8, 19.2], [1.5, 7.4, -20], 1500],
      [T_FLED + .3, [5.0, 3.7, 18.1], [2.3, 6.8, -18], 1380],
      [T_SAY + .2, [6.5, 3.7, 17.6], [2.1, 7.4, -22], 1300],
      [T_RULER, [7.0, 3.75, 17.7], [1.7, 8.2, -27], 1220],
      [DUR, [7.5, 3.8, 18.1], [1.4, 10.0, -30], 1080],
      [DUR + 1.2, [7.8, 3.82, 18.4], [1.3, 10.4, -30], 1060]];
    if (M45) K.forEach(k => { k[1] = [k[1][0] * .5, k[1][1] + .35, k[1][2] + 2]; k[2] = [k[2][0] * .5, k[2][1] + 1.2, k[2][2]]; k[3] *= .96; });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    let yaw = Math.atan2(d[0], d[2]); if (yaw < 0) yaw += TAU;
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: Math.exp(S.f(t)), W, H, near: .05 });
  }

  function world(ctx, cam, t, o = {}) {
    const people = o.people !== false, tg = o.giantT ?? t;
    if (o.far) {
      haze(ctx, cam, tg, o.haze ?? 1);
      LB.sheet(ctx, ID, 1, RC, x => {
        x.lineCap = 'butt'; x.lineJoin = 'miter';
        hills(x, cam); giant(x, cam, tg, o);
        if (o.ground !== false) ground(x, cam, t);
        terrace(x, cam, t); hall(x, cam, t, o);
        SIDE.map(s => ({ s, d: cam.depth([s.x, 2, s.z]) })).sort((a, b) => b.d - a.d).forEach(({ s }) => sideHall(x, cam, s));
        wall(x, cam, t); for (const L of LANT_OUT) lantern(x, cam, L, t);
      }, { rim: false, shadow: false, glow: .12, glowColor: '#ff8a3a', glowBlur: 14, fibre: .3 });
      silverGlow(ctx, cam, t);
      const sh = SH(); ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); for (const [lx, lz] of LANT_OUT) { const q = cam.proj([lx, 2.25, lz]); if (q) PR.glow(ctx, q[0], q[1], 1.1 * q[3], '#ffb060', .3 * flick(t + lx), 'flat'); } ctx.restore();
      return [];
    }
    LB.sheet(ctx, ID, 1, RC, x => { hills(x, cam); }, { rim: false, shadow: false, fibre: .2 });
    haze(ctx, cam, tg, o.haze ?? 1);
    LB.sheet(ctx, ID, 1, RC, x => { giant(x, cam, tg, o); }, { rim: false, shadow: false, fibre: 0, glow: .25, glowColor: '#ff7a3a', glowBlur: 18 });
    LB.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      if (o.ground !== false) ground(x, cam, t);
      terrace(x, cam, t); hall(x, cam, t, o);
      SIDE.map(s => ({ s, d: cam.depth([s.x, 2, s.z]) })).sort((a, b) => b.d - a.d).forEach(({ s }) => sideHall(x, cam, s));
      for (const L of LANT_IN) lantern(x, cam, L, t);
      passage(x, cam, t);
    }, { rim: false, shadow: false, glow: .1, glowColor: '#ff9a4a', glowBlur: 12, fibre: .3 });
    silverGlow(ctx, cam, t);
    const flames = Ls => { const sh = SH(); ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); for (const [lx, lz] of Ls) { const q = cam.proj([lx, 2.25, lz]); if (q) PR.glow(ctx, q[0], q[1], 1.1 * q[3], '#ffb060', .3 * flick(t + lx), 'flat'); } ctx.restore(); };
    flames(LANT_IN);
    let at = [];
    const inside = S => scholarAt(S, cam, t).p[2] < WZ + .2;
    if (people) LB.sheet(ctx, ID, 1, RC, x => { for (const S of SCHOLARS) if (inside(S)) at[SCHOLARS.indexOf(S)] = scholar(x, cam, t, S); }, { rim: false, shadow: false, fibre: 0 });
    LB.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter'; wall(x, cam, t);
      LANT_OUT.map(L => ({ L, d: cam.depth([L[0], 1, L[1]]) })).sort((a, b) => b.d - a.d).forEach(({ L }) => lantern(x, cam, L, t));
    }, { rimColor: '#ffb070', rimShift: [0, -1], rimAlpha: .35, glow: .1, glowColor: '#ff9a4a', glowBlur: 10, fibre: .3 });
    flames(LANT_OUT);
    if (people) LB.sheet(ctx, ID, 1, RC, x => { SCHOLARS.map((S, i) => ({ S, i, d: cam.depth(scholarAt(S, cam, t).p) })).sort((a, b) => b.d - a.d).forEach(({ S, i }) => { if (!inside(S)) at[i] = scholar(x, cam, t, S); }); }, { rim: false, shadow: false, fibre: 0 });
    if (o.near !== false) LB.sheet(ctx, ID, 1, RC, x => reeds(x, cam, t), { rim: false, shadow: false, fibre: 0, blur: 3 });
    return at;
  }
  function frame(ctx, t, cam, o = {}) {
    LB.background(ctx);
    const at = world(ctx, cam, t, o);
    if (o.tags !== false) SCHOLARS.forEach((S, i) => tag(ctx, at[i], S.name, ss(S.tag - .05, S.tag + .2, t) * (1 - ss(T_RULER - .3, T_RULER + .2, t)), S.dx));
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-24', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-23', dur: .9, dir: 'right' },
    sfx: [
      { t: .9, type: 'crackle', dur: 2.2, rate: 7, g: .02 },
      ...SCHOLARS.flatMap(S => S.G.falls.map(fl => fl.t).filter(tt => tt > .95 && tt < S.until)).map(tt => ({ t: tt, type: 'footstep', g: .035 })),
      ...SCHOLARS.map(S => ({ t: S.tag, type: 'tick', g: .06 })),
      ...SCHOLARS.map(S => ({ t: S.turn + .05, type: 'cloth', dur: .5, g: .04 })),
      { t: T_NO + .05, type: 'shimmer', dur: .6, g: .03 },
      { t: T_RULER - .1, type: 'riser', dur: .9, g: .05 },
      { t: T_TYR - .05, type: 'rumble', dur: 1.6, g: .1 }, { t: T_TYR, type: 'swoosh', dur: .9, g: .07 },
      { t: .95, type: 'lib', dur: 10.5, label: 'FAR NIGHT CITY, VERY LOW' },
    ],
    api: { DUR, camAt, world, frame, GT0, rise, giant, haze, LB, HPOSE, KOPT, giantAt },
  });
})();
