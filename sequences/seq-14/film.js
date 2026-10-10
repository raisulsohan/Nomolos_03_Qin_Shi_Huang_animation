(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-14'), DUR = C.duration;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const S13 = () => F.getScene('seq-13'), A13 = () => S13().api, A6 = () => F.getScene('seq-06').api;
  const T0 = () => ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13'].reduce((s, id) => s + F.getScene(id).duration, 0);

  const T_ONE = 0.71, T_ENEMY = 0.88, T_LEFT = 1.18;
  const T_AND = 2.06, T_ERA = 2.69, T_DEF = 3.07, T_MAD = 4.61;
  const T_EXC13 = 14.88, T_HOLD13 = T_EXC13 + 6.5 * .42;
  const T_AIM = 1.0, P_DIVE = 22, T_COVER = 1.95, T_IN = 2.15;

  const SIG = 1.25, WHW = .75, WHH = .65, WTH = .2;
  const ROOM_W = [.3, 2.2, 3.9];
  const WGEO = () => { const p = A13().PAL[7], h0 = A13().TOP(); return { x: p.x, y: h0 + 1.7, zo: -(p.y + A13().PD), h0 }; };
  const toRoom = Pw => { const g = WGEO(); return [ROOM_W[0] - (Pw[0] - g.x) / SIG, ROOM_W[1] + (Pw[1] - g.y) / SIG, ROOM_W[2] - (Pw[2] - g.zo - WTH) / SIG]; };
  const roomCamOf = c => S3.camera({ pos: toRoom(c.pos), yaw: c.yaw + PI, pitch: c.pitch, f: c.f, W, H, cx: c.cx, cy: c.cy, near: .02 });
  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  const DW = 3;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const [sx, sy, sz, sp, sw, sl] = A13().spl(), D13 = A13().DUR, g = WGEO(), P = P_DIVE * D2R;
    const at13 = d => [d, sx(D13 + d), sy(D13 + d), Math.exp(sz(D13 + d)), sp(D13 + d), sw(D13 + d), sl(D13 + d)];
    const L = [g.x, -(g.zo + Math.cos(P) * DW), g.y - Math.sin(P) * DW], zD = D => A6().FLENS / D / zf(P_DIVE);
    const K = [at13(-.6), at13(0), at13(.12), [T_AIM, L[0], L[1], 2.8, P_DIVE, 0, L[2]], [T_COVER, L[0], L[1], zD(DW + .6), P_DIVE, 0, L[2]],
      [T_IN, L[0], L[1], zD(DW - .3), P_DIVE, 0, L[2]], [T_IN + .6, L[0], L[1], zD(DW - .9), P_DIVE, 0, L[2]]];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camMap(t) {
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  const pathOf = (x, q) => { x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
  function portal(ctx, t, cam, a) {
    if (a <= 0) return;
    const g = WGEO(), P = (dx, dy, dz) => cam.proj([g.x + dx, g.y + dy, g.zo + dz]);
    const outer = [P(-WHW, -WHH, 0), P(WHW, -WHH, 0), P(WHW, WHH, 0), P(-WHW, WHH, 0)], inner = [P(-WHW, -WHH, WTH), P(WHW, -WHH, WTH), P(WHW, WHH, WTH), P(-WHW, WHH, WTH)];
    if (outer.some(v => !v) || inner.some(v => !v)) return;
    const fl = 1 + .06 * Math.sin(t * 13.1) + .04 * Math.sin(t * 21.7 + 1.3), mid = P(0, 0, 0), size = Math.abs(outer[1][0] - outer[0][0]);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const [y, z0, z1, w0, w1, al] of [[g.h0 + 1.0, 0, -.9, WHW, 1.1, .34], [g.h0 + .02, -.9, -3.8, 1.15, 2.1, .22]]) {
      const q = [P(-w0, y - g.y, z0), P(w0, y - g.y, z0), P(w1, y - g.y, z1), P(-w1, y - g.y, z1)]; if (q.some(v => !v)) continue;
      const n0 = [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2], n1 = [(q[2][0] + q[3][0]) / 2, (q[2][1] + q[3][1]) / 2], gr = ctx.createLinearGradient(n0[0], n0[1], n1[0], n1[1]);
      gr.addColorStop(0, `rgba(255,190,110,${al * a * fl})`); gr.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = gr; pathOf(ctx, q); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    const [cv, x] = buf(); clean(x); roomFrame(x, t, roomCamOf(cam));
    ctx.save(); pathOf(ctx, outer); ctx.clip(); pathOf(ctx, inner); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(cv, 0, 0); ctx.restore();
    const rev = [[0, 1, [0, 1, 0], '#a0643a'], [2, 3, [0, -1, 0], '#3a2418'], [1, 2, [-1, 0, 0], '#6e4228'], [3, 0, [1, 0, 0], '#6e4228']];
    for (const [i, j, n, col] of rev) {
      const c3 = [g.x + (i === 1 || i === 2 ? WHW : -WHW) * (n[0] ? 1 : 0), g.y + (n[1] > 0 ? -WHH : n[1] < 0 ? WHH : 0), g.zo + WTH / 2];
      if (!S3.facing(cam, c3, n)) continue;
      ctx.globalAlpha = Math.max(.25, a); ctx.fillStyle = col; pathOf(ctx, [outer[i], outer[j], inner[j], inner[i]]); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = '#1a120e'; ctx.lineWidth = Math.max(1, size * .035); pathOf(ctx, outer); ctx.stroke();
    ctx.restore();
    PR.glow(ctx, mid[0], mid[1], Math.max(10, size * 1.9), '#ffc477', .32 * a * (1 - ss(260, 700, size)), 'flat');
  }

  const LAMP = [-.25, .99, 2.35];
  const flick = t => 1 + .07 * Math.sin(t * 13.1) + .045 * Math.sin(t * 21.7 + 1.3);
  const LIGHT = p => { const d = [LAMP[0] - p[0], LAMP[1] - p[1], LAMP[2] - p[2]], l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; };
  const BRONZE = '#5e4a2a', BRONZE_D = '#3e2e1a', WOOD = '#6a4428', WOOD_D = '#3e2616', NIGHT = '#0c0a1e', ROD = '#d2b070', SHADOW = '#140f22';
  const CK = [.4, 1.05], POT_R = .15;
  const WATER = { c: [.4, 1.33], y: .606, r: .1 };
  const TIP = [.4, .83, 1.30];
  const rodTop = t => 1.62 - .012 * t;
  const DRIP0 = -.024, DRIP = .5, HANG = .12, FALL = Math.sqrt(2 * (TIP[1] - .008 - WATER.y) / 9.8);
  const DRIPS = { t0: DRIP0, every: DRIP, hang: HANG, fall: FALL, tip: TIP };

  const FR0 = M45 ? 1800 : 2225;
  let SPLR = null;
  function splR() {
    if (SPLR) return SPLR;
    const P = P_DIVE * D2R, dir = [0, -Math.sin(P), -Math.cos(P)], at = tt => { const e = toRoom(camMap(tt).pos); return [tt, e, [e[0] + 2 * dir[0], e[1] + 2 * dir[1], e[2] + 2 * dir[2]], A6().FLENS]; };
    const KR = [at(T_IN - .15), at(T_IN),
      [T_IN + .9, [.3, 1.5, 3.0], [.37, .92, .85], lerp(A6().FLENS, FR0, .5)],
      [T_MAD - .3, [.36, 1.16, 2.2], [.4, 1.06, 1.0], FR0],
      [T_MAD + .45, [.4, .9, 1.62], [.4, .64, 1.31], FR0],
      [DUR, [TIP[0], WATER.y + .094, TIP[2] + .04], [TIP[0], WATER.y, TIP[2]], FR0],
      [DUR + .8, [TIP[0], WATER.y + .04, TIP[2] + .017], [TIP[0], WATER.y, TIP[2]], FR0]];
    const ts = KR.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KR[i])]));
    return (SPLR = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function roomCam(t) {
    if (t < T_IN) return roomCamOf(camMap(t));
    const R = splR(), e = R.e.map(f => f(t)), g = R.g.map(f => f(t)), d = [e[0] - g[0], e[1] - g[1], e[2] - g[2]];
    let yaw = Math.atan2(-d[0], -d[2]); if (yaw < 0) yaw += TAU;
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(-d[1], Math.hypot(d[0], d[2])), f: Math.exp(R.f(t)), W, H, near: .02 });
  }

  function wall(x, cam, t) {
    if (!S3.poly(x, cam, [[-3.2, 0, 0], [3.8, 0, 0], [3.8, 3.2, 0], [-3.2, 3.2, 0]])) return;
    const c = cam.proj([LAMP[0], LAMP[1], 0]); if (!c) { x.fillStyle = '#100d26'; x.fill(); return; }
    const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], 2.5 * c[3] * (1 + .25 * (flick(t) - 1)));
    g.addColorStop(0, '#9a6c3e'); g.addColorStop(.3, '#5e3c3a'); g.addColorStop(.7, '#241a36'); g.addColorStop(1, '#100d26');
    x.fillStyle = g; x.fill();
    S3.box(x, cam, { x0: -3.2, x1: 3.8, y0: 0, y1: .12, z0: 0, z1: .03 }, { col: '#2a1c22', light: LIGHT([0, .1, 0]), lo: .4, ink: NIGHT });
  }
  function floor(x, cam, t) {
    if (!S3.poly(x, cam, [[-3.2, 0, .03], [3.8, 0, .03], [3.8, 0, 5], [-3.2, 0, 5]])) return;
    const c = cam.proj([LAMP[0], 0, Math.min(LAMP[2], cam.pos[2] - .4)]);
    if (c) { const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], 1.9 * c[3]); g.addColorStop(0, '#5a3c28'); g.addColorStop(.5, '#2a1c26'); g.addColorStop(1, '#0d0b1e'); x.fillStyle = g; } else x.fillStyle = '#0d0b1e';
    x.fill();
    x.strokeStyle = 'rgba(8,6,16,.45)'; x.lineWidth = 1.2; x.beginPath();
    for (let X = -3.2; X <= 3.8; X += .24) S3.line(x, cam, [X, 0, .03], [X, 0, 5]);
    x.stroke();
  }
  const onWall = (p, L) => { const s = L[2] / (L[2] - p[2]); return [L[0] + (p[0] - L[0]) * s, L[1] + (p[1] - L[1]) * s]; };
  function hull2(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const BX = (x0, x1, y0, y1, z0, z1) => [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]];
  const CY = (cx, cz, r, y0, y1) => BX(cx - r * .92, cx + r * .92, y0, y1, cz - r * .4, cz + r * .4);
  function parts(t) {
    const L = [BX(-.15, .95, .5, .55, .7, 1.55), BX(.24, .56, .55, .73, .89, 1.21), CY(CK[0], CK[1], POT_R, .73, 1.14),
      BX(.33, .345, 1.14, 1.31, 1.043, 1.057), BX(.455, .47, 1.14, 1.31, 1.043, 1.057), BX(.33, .47, 1.31, 1.335, 1.043, 1.057),
      BX(.394, .406, 1.1, rodTop(t), 1.044, 1.056), CY(WATER.c[0], WATER.c[1], .11, .55, .62)];
    for (const [X, Z] of [[-.1, .75], [.9, .75], [-.1, 1.5], [.9, 1.5]]) L.push(BX(X - .03, X + .03, 0, .5, Z - .03, Z + .03));
    return L;
  }
  const SIL = Q.silhouette('emperor', SHADOW, SHADOW), HPOSE = Q.kneel({ lean: .02, head: .02, arms: [[.06, .16], [.09, .2]] });
  function shadows(x, cam, t) {
    const fl = flick(t), L = [LAMP[0], LAMP[1] + .03 * (fl - 1), LAMP[2]];
    x.save(); x.filter = `blur(${Math.max(1, cam.f / 900).toFixed(2)}px)`; x.fillStyle = SHADOW; x.beginPath();
    for (const part of parts(t)) {
      const hl = hull2(part.map(p => onWall(p, L))).map(q => cam.proj([q[0], q[1], .002])); if (hl.some(v => !v)) continue;
      hl.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath();
    }
    x.fill();
    const m = .0178 * (1 + .12 * (fl - 1));
    S3.onPlane(x, cam, [-.42, .1, .002], [m, 0, 0], [0, -m, 0], xx => Q.draw(xx, LB.P, HPOSE, SIL, { kneel: true, crown: true, beard: true, profile: true, tilt: 0, shadow: 0 }));
    x.restore();
  }

  function table(x, cam) {
    const o = { col: WOOD_D, light: LIGHT([.4, .3, 1.1]), lo: .22, ink: NIGHT };
    for (const [X, Z] of [[-.1, .75], [.9, .75], [-.1, 1.5], [.9, 1.5]]) S3.box(x, cam, { x0: X - .03, x1: X + .03, y0: 0, y1: .5, z0: Z - .03, z1: Z + .03 }, o);
    S3.box(x, cam, { x0: -.15, x1: .95, y0: .5, y1: .55, z0: .7, z1: 1.55 }, { ...o, col: WOOD, light: LIGHT([.4, .55, 1.1]) });
    S3.box(x, cam, { x0: .24, x1: .56, y0: .55, y1: .73, z0: .89, z1: 1.21 }, { ...o, col: WOOD_D, light: LIGHT([.4, .65, 1.05]) });
  }
  const ringPts = (cx, cz, r, y, n = 48) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]); } return o; };
  function clock(x, cam, t) {
    const lt = LIGHT([CK[0], .95, CK[1]]), o = { col: BRONZE, light: lt, lo: .2, ink: NIGHT };
    const legs = [90, 210, 330].map(a => [CK[0] + .1 * Math.cos(a * D2R), CK[1] + .1 * Math.sin(a * D2R)]).sort((a, b) => cam.depth([b[0], .76, b[1]]) - cam.depth([a[0], .76, a[1]]));
    for (const g of legs) S3.cyl(x, cam, g, .017, .73, .81, { ...o, col: BRONZE_D });
    S3.cyl(x, cam, CK, POT_R, .80, 1.12, { ...o, lo: .12, cap: false, n: 44 });
    for (const y of [.812, 1.098]) S3.ring(x, cam, CK, POT_R + .004, y, y + .012, BRONZE_D);
    potShine(x, cam);
    S3.cyl(x, cam, CK, POT_R + .006, 1.12, 1.14, { ...o, col: BRONZE_D, lo: .3 });
    const hp = { ...o, col: BRONZE_D, lo: .3 };
    S3.box(x, cam, { x0: .33, x1: .345, y0: 1.14, y1: 1.31, z0: 1.043, z1: 1.057 }, hp);
    S3.box(x, cam, { x0: .455, x1: .47, y0: 1.14, y1: 1.31, z0: 1.043, z1: 1.057 }, hp);
    const top = rodTop(t);
    S3.box(x, cam, { x0: .394, x1: .406, y0: 1.1, y1: top, z0: 1.044, z1: 1.056 }, { col: ROD, light: lt, lo: .35, ink: NIGHT });
    x.strokeStyle = '#2a1c10'; x.lineWidth = Math.max(1, cam.f / 1400); x.beginPath();
    for (let i = 1, y = top - .02; y > 1.145; i++, y -= .02) { const e = i % 5 === 0 ? .006 : .002; S3.line(x, cam, [.394 - e, y, 1.0565], [.406 + e, y, 1.0565]); }
    x.stroke();
    S3.box(x, cam, { x0: .33, x1: .47, y0: 1.31, y1: 1.335, z0: 1.043, z1: 1.057 }, hp);
    S3.bar(x, cam, [.4, .865, 1.19], [TIP[0], TIP[1] + .004, TIP[2]], .012, { ...o, lo: .3 });
    basin(x, cam, t, o);
  }
  function potShine(x, cam) {
    const toL = [LAMP[0] - CK[0], LAMP[2] - CK[1]], toC = [cam.pos[0] - CK[0], cam.pos[2] - CK[1]], nl = Math.hypot(...toL), nc = Math.hypot(...toC);
    const a = Math.atan2(toL[1] / nl + toC[1] / nc, toL[0] / nl + toC[0] / nc);
    for (const [da, al] of [[.2, .16], [.09, .34]]) {
      const P = (b, y) => [CK[0] + (POT_R + .002) * Math.cos(b), y, CK[1] + (POT_R + .002) * Math.sin(b)];
      if (!S3.poly(x, cam, [P(a - da, .83), P(a + da, .83), P(a + da, 1.09), P(a - da, 1.09)])) continue;
      x.fillStyle = `rgba(255,212,150,${al})`; x.fill();
    }
    x.fillStyle = '#8a7046';
    for (let i = 0; i < 18; i++) {
      const b = i / 18 * TAU, p = [CK[0] + (POT_R + .003) * Math.cos(b), 1.075, CK[1] + (POT_R + .003) * Math.sin(b)];
      if ((cam.pos[0] - p[0]) * Math.cos(b) + (cam.pos[2] - p[2]) * Math.sin(b) <= 0) continue;
      const q = cam.proj(p); if (!q) continue; x.beginPath(); x.arc(q[0], q[1], Math.max(1, .0055 * q[3]), 0, TAU); x.fill();
    }
  }
  function basin(x, cam, t, o) {
    const [bx, bz] = WATER.c, path = pts => { const s = S3.clip(cam, pts); if (s.length < 3) return false; x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
    if (path(ringPts(bx, bz, .105, .62))) { x.fillStyle = '#3a2a1c'; x.fill(); }
    if (path(ringPts(bx, bz, WATER.r, WATER.y))) {
      x.fillStyle = '#151230'; x.fill();
      x.save(); x.clip();
      const Lm = [LAMP[0], 2 * WATER.y - LAMP[1], LAMP[2]], e = cam.pos, u = (e[1] - WATER.y) / (e[1] - Lm[1]);
      const hit = [e[0] + (Lm[0] - e[0]) * u, WATER.y, e[2] + (Lm[2] - e[2]) * u], q = cam.proj(hit);
      if (q) { const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], .05 * q[3]); g.addColorStop(0, 'rgba(255,214,150,.75)'); g.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = g; x.fillRect(q[0] - .05 * q[3], q[1] - .05 * q[3], .1 * q[3], .1 * q[3]); }
      const n = Math.floor((t - DRIP0 - HANG - FALL) / DRIP);
      for (let i = n; i > n - 4; i--) {
        const age = t - (DRIP0 + i * DRIP + HANG + FALL), uu = age / 1.6; if (age < 0 || uu >= 1) continue;
        for (const k of [1, .6]) { if (!path(ringPts(TIP[0], TIP[2], .004 + .12 * uu * k, WATER.y + .0005, 40))) continue; x.strokeStyle = `rgba(255,212,150,${.6 * (1 - uu) * k})`; x.lineWidth = Math.max(1, .0007 * cam.f / Math.max(.05, cam.depth([TIP[0], WATER.y, TIP[2]]))); x.stroke(); }
      }
      x.restore();
    }
    S3.cyl(x, cam, WATER.c, .11, .55, .62, { ...o, cap: false });
    if (path(ringPts(bx, bz, .108, .62))) { x.strokeStyle = '#c99c5e'; x.lineWidth = Math.max(1, cam.f / 900); x.stroke(); }
  }
  function lamp(x, cam) {
    const [lx, , lz] = LAMP, o = { col: BRONZE_D, lo: .3, ink: NIGHT, light: [0, 1, 0] };
    S3.cyl(x, cam, [lx, lz], .12, 0, .035, o);
    S3.bar(x, cam, [lx, .035, lz], [lx, .9, lz], .016, o);
    S3.cyl(x, cam, [lx, lz], .03, .88, .92, o);
    S3.cyl(x, cam, [lx, lz], .085, .92, .97, { ...o, col: BRONZE, lo: .45 });
  }
  function lights(ctx, cam, t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const i1 = Math.floor((t - DRIP0) / DRIP);
    for (let i = i1 - 1; i <= i1; i++) {
      const a = t - (DRIP0 + i * DRIP); if (a < 0 || a >= HANG + FALL) continue;
      const u = Math.max(0, a - HANG), k = Math.min(1, a / HANG), p = [TIP[0], TIP[1] - .004 - .004 * k - 4.9 * u * u, TIP[2] + .003], q = cam.proj(p); if (!q) continue;
      const r = Math.max(1.4, (.0014 + .0018 * k) * q[3]);
      const g = ctx.createRadialGradient(q[0] - r * .3, q[1] - r * .4, 0, q[0], q[1], r * 1.6); g.addColorStop(0, 'rgba(255,246,224,.95)'); g.addColorStop(.45, 'rgba(255,214,150,.55)'); g.addColorStop(1, 'rgba(120,90,70,.25)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * (1 + Math.min(1.4, 9 * u)), 0, 0, TAU); ctx.fill();
    }
    const q = cam.proj([LAMP[0], .972, LAMP[2]]);
    if (q) {
      const fl = flick(t), h = .075 * q[3] * fl, wd = .021 * q[3];
      const na = smooth((q[2] - .1) / .3);
      PR.glow(ctx, q[0], q[1] - h * .4, .8 * q[3], '#ffae4a', .2 * na, 'flat');
      const tear = (s, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q[0] - wd * s, q[1]); ctx.quadraticCurveTo(q[0] - wd * s * 1.15, q[1] - h * s * .55, q[0] + .1 * wd * Math.sin(t * 9), q[1] - h * s); ctx.quadraticCurveTo(q[0] + wd * s * 1.15, q[1] - h * s * .55, q[0] + wd * s, q[1]); ctx.closePath(); ctx.fill(); };
      tear(1, '#ff9a3a'); tear(.62, '#ffd27a'); tear(.3, '#fff6e0');
      PR.glow(ctx, q[0], q[1] - h * .5, .12 * q[3], '#fff0cc', .6 * na, 'flat');
    }
    ctx.restore();
  }
  function roomFrame(ctx, t, cam) {
    LB.background(ctx);
    LB.sheet(ctx, ID, 1, RC, x => { wall(x, cam, t); floor(x, cam, t); shadows(x, cam, t); }, { rim: false, shadow: false, fibre: .3 });
    LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; table(x, cam); clock(x, cam, t); lamp(x, cam); }, { rimColor: '#ffc27a', rimShift: [1, .25], rimAlpha: .5, glow: .12, glowColor: '#ffae4a', glowBlur: 10 });
    lights(ctx, cam, t);
    LB.grade(ctx, T0() + A13().DUR + t);
  }

  function draw(ctx, t) {
    if (t <= 0) return S13().draw(ctx, A13().DUR);
    if (t >= T_COVER) return roomFrame(ctx, t, roomCam(t));
    const cam = camMap(t), t13 = A13().DUR + t, hp = A13().hopAt(t13), a = t13 >= T_HOLD13 ? 1 : hp && hp.p === 7 ? hp.a : 0;
    A13().frame(ctx, t13, cam, { hop: tt => { if (tt >= T_HOLD13) return null; const h = A13().hopAt(tt); return h && h.p === 7 ? null : h; } });
    portal(ctx, t, cam, a);
  }

  F.scene('seq-14', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'whoosh', f0: 130, f1: 55, dur: 1.6, g: .12 },
      { t: T_COVER - .45, type: 'swoosh', dur: .7, g: .06 },
      ...Array.from({ length: 12 }, (_, i) => DRIP0 + i * DRIP + HANG + FALL).filter(tt => tt > 1.2 && tt < T_MAD + .5).map(tt => ({ t: tt, type: 'drip', g: .12, noSnap: true })),
      { t: DRIP0 + 10 * DRIP + HANG + FALL, type: 'plunge', g: .24, noSnap: true },
      ...[2.45, 4.12].map(tt => ({ t: tt, type: 'creak', dur: .2, g: .035 })),
    ],
    api: { DUR, roomFrame: (ctx, t) => roomFrame(ctx, t, roomCam(t)), roomCam, WATER: () => WATER, drips: () => DRIPS, FR0,
      room: { wall, floor, table, clock, lamp, LAMP, CK, flick, ROOM_W, WIN: [WHW / SIG, WHH / SIG, WTH / SIG], colours: { BRONZE, BRONZE_D, WOOD, WOOD_D, NIGHT, SHADOW } } },
  });
})();
