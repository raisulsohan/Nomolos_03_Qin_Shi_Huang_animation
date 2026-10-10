(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, CH = F.china, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-15'), DUR = C.duration;
  const FL = F.look('flat', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const S14 = () => F.getScene('seq-14'), A14 = () => S14().api, A6 = () => F.getScene('seq-06').api, A8 = () => F.getScene('seq-08').api;
  const A9 = () => F.getScene('seq-09').api, A10 = () => F.getScene('seq-10').api, A13 = () => F.getScene('seq-13').api;
  const T0 = () => ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14'].reduce((s, id) => s + F.getScene(id).duration, 0);
  let BUF = null, BUF2 = null;
  const buf = () => BUF || (BUF = F.canvas(W, H)), buf2 = () => BUF2 || (BUF2 = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };

  const T_ALCH = 0.43, T_TECH = 2.15, T_PROB = 2.7;
  const T_SOME = 3.57, T_EAST = 4.44, T_COAST = 4.84, T_TRAD = 5.47;
  const T_LAY = 6.58, T_PENG = 6.84, T_ISL = 7.84, T_IMM = 8.53;
  const T_BEINGS = 9.58, T_CRACK = 10.36, T_SECRET = 11.13, T_LIVED = 11.52;
  const T_ELIX = 12.53, T_TRANS = 13.53, T_ASC = 14.93, T_MAST = 15.58;
  const T_THIS = 16.89, T_NOT = 17.34, T_FRINGE = 17.53, T_SUP = 17.91;
  const T_STATE = 20.96, T_SCI = 21.29, T_DAY = 22.09;
  const T_EMPR = 23.16, T_GIVE = 24.18, T_UNL = 24.65, T_BUD = 25.19;
  const T_XF0 = .02, T_XF1 = .45;
  const T_OUT = 4.45;

  const FW = () => A14().FR0;
  const MERC = { c: [.3, 2.4], y: .865, r: .19 };
  const IMP14 = () => { const d = A14().drips(); return d.t0 + 10 * d.every + d.hang + d.fall; };
  const ringAge = t => t + A14().DUR - IMP14();
  const WIN = { x: 3.2, z0: 1.8, z1: 3.4, y0: 1.0, y1: 2.3 }, WC = [3.2, 1.65, 2.6], WDIST = 1.45;
  const WL = (() => { const v = [.75, .55, .35], l = Math.hypot(...v); return v.map(c => c / l); })();
  const KW = [
    [0, [MERC.c[0], MERC.y + .094, MERC.c[1] + .04], [MERC.c[0], MERC.y, MERC.c[1]]],
    [.6, [.3, 1.2, 2.64], [.3, MERC.y, 2.4]],
    [2.15, [-1.3, 1.8, 6.9], [.7, 1.2, 1.5]],
    [3.45, [-1.0, 1.75, 6.5], [.9, 1.2, 1.4]],
    [T_OUT, [WC[0] - WDIST, WC[1], WC[2]], WC],
    [T_OUT + .8, [WC[0] - WDIST + .5, WC[1], WC[2]], WC],
  ];
  const SPLW = (() => { const ts = KW.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KW[i])])); return { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])) }; })();
  function camW(t) {
    const e = SPLW.e.map(f => f(t)), g = SPLW.g.map(f => f(t)), d = [e[0] - g[0], e[1] - g[1], e[2] - g[2]];
    let yaw = Math.atan2(-d[0], -d[2]); if (yaw < 0) yaw += TAU;
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(-d[1], Math.hypot(d[0], d[2])), f: FW(), W, H, near: .02 });
  }
  const CLAY = '#9a6a48', CLAY_D = '#6e4630', PLASTER = '#e4d2ac', WOODW = '#8a603f', WOODW_D = '#5e3f28', BRZ = '#6e5836', PAPER = '#f1e4c4', INKW = '#2c2824';
  const sh = (col, n, o = {}) => S3.shade(col, n, WL, { lo: .5, ...o });
  const quad = (x, cam, pts, col) => { if (S3.poly(x, cam, pts)) { x.fillStyle = col; x.fill(); return true; } return false; };
  function walls(x, cam) {
    quad(x, cam, [[3.2, 0, 0], [-3.6, 0, 0], [-3.6, 3.4, 0], [3.2, 3.4, 0]], sh(PLASTER, [0, 0, 1]));
    const E = [[3.2, 0, 0], [3.2, 0, 7], [3.2, 3.4, 7], [3.2, 3.4, 0]], ec = sh(PLASTER, [-1, 0, 0], { lo: .62 });
    const { z0, z1, y0, y1 } = WIN;
    quad(x, cam, [[3.2, 0, 0], [3.2, 0, 7], [3.2, y0, 7], [3.2, y0, 0]], ec);
    quad(x, cam, [[3.2, y1, 0], [3.2, y1, 7], [3.2, 3.4, 7], [3.2, 3.4, 0]], ec);
    quad(x, cam, [[3.2, y0, 0], [3.2, y0, z0], [3.2, y1, z0], [3.2, y1, 0]], ec);
    quad(x, cam, [[3.2, y0, z1], [3.2, y0, 7], [3.2, y1, 7], [3.2, y1, z1]], ec);
    quad(x, cam, [[-3.6, 0, 0], [3.2, 0, 0], [3.2, 0, 7], [-3.6, 0, 7]], sh('#b08a5e', [0, 1, 0]));
    x.strokeStyle = 'rgba(70,46,26,.35)'; x.lineWidth = 1.2; x.beginPath();
    for (let X = -3.6; X <= 3.2; X += .3) S3.line(x, cam, [X, 0, 0], [X, 0, 7]);
    x.stroke();
    const sun = [-.62, -.62, -.2], at = (y, z) => { const k = y / -sun[1]; return [3.2 + sun[0] * k, 0, z + sun[2] * k]; };
    quad(x, cam, [at(y0, z0), at(y0, z1), at(y1, z1), at(y1, z0)], 'rgba(255,240,205,.32)');
    const fr = { col: WOODW_D, light: WL, lo: .45 };
    S3.box(x, cam, { x0: 3.1, x1: 3.26, y0: y0 - .08, y1: y0, z0: z0 - .08, z1: z1 + .08 }, fr);
    S3.box(x, cam, { x0: 3.1, x1: 3.26, y0: y1, y1: y1 + .08, z0: z0 - .08, z1: z1 + .08 }, fr);
    S3.box(x, cam, { x0: 3.1, x1: 3.26, y0, y1, z0: z0 - .08, z1: z0 }, fr);
    S3.box(x, cam, { x0: 3.1, x1: 3.26, y0, y1, z0: z1, z1: z1 + .08 }, fr);
  }
  const CHART = { x: -1.0, y0: .95, y1: 2.75, w: .78 };
  const PTS = [[0, .62], [-.09, .45], [.08, .33], [0, .2], [.1, .08]];
  const chartAt = (u, v) => [CHART.x - u * CHART.w, CHART.y0 + v * (CHART.y1 - CHART.y0), .012];
  function chart(x, cam) {
    const H2 = CHART.y1 - CHART.y0;
    S3.onPlane(x, cam, [CHART.x + CHART.w / 2, CHART.y1, .01], [-CHART.w, 0, 0], [0, -H2, 0], xx => {
      xx.fillStyle = PAPER; xx.fillRect(0, 0, 1, 1);
      xx.save(); xx.translate(.5, 1); xx.scale(1, -1);
      xx.strokeStyle = INKW; xx.lineWidth = .006; xx.fillStyle = 'rgba(44,40,36,.08)';
      const S = .8 / H2 * CHART.w;
      xx.beginPath(); xx.ellipse(0, .84, .055, .065, 0, 0, TAU); xx.fill(); xx.stroke();
      xx.beginPath(); xx.moveTo(-.04, .77); xx.lineTo(-.15, .72); xx.lineTo(-.2, .48); xx.lineTo(-.17, .47); xx.lineTo(-.12, .66); xx.lineTo(-.1, .42);
      xx.lineTo(-.08, .06); xx.lineTo(-.02, .06); xx.lineTo(0, .38); xx.lineTo(.02, .06); xx.lineTo(.08, .06); xx.lineTo(.1, .42); xx.lineTo(.12, .66);
      xx.lineTo(.17, .47); xx.lineTo(.2, .48); xx.lineTo(.15, .72); xx.lineTo(.04, .77); xx.closePath(); xx.fill(); xx.stroke();
      xx.strokeStyle = 'rgba(63,93,120,.85)'; xx.lineWidth = .004;
      for (const dx of [-.06, 0, .06]) { xx.beginPath(); xx.moveTo(dx * .6, .76); xx.quadraticCurveTo(dx * 1.4, .5, dx, .1); xx.stroke(); }
      xx.fillStyle = '#b5372b'; for (const [u, v] of PTS) { xx.beginPath(); xx.arc(u, v * .9 + .05, .012, 0, TAU); xx.fill(); }
      xx.restore();
      xx.fillStyle = 'rgba(44,40,36,.75)'; for (let i = 0; i < 9; i++) xx.fillRect(.08 + (i % 3) * .3, .05 + Math.floor(i / 3) * .028, .2, .008);
      void S;
    });
    for (const y of [CHART.y1 + .02, CHART.y0 - .02]) S3.bar(x, cam, [CHART.x + CHART.w / 2 + .04, y, .03], [CHART.x - CHART.w / 2 - .04, y, .03], .025, { col: WOODW_D, light: WL, lo: .5 });
  }
  const GOURDS = []; for (const [y, n] of [[.97, 4], [1.57, 4]]) for (let i = 0; i < n; i++) GOURDS.push([.75 + i * .42, y, .16]);
  function shelves(x, cam) {
    for (const [y] of [[.97], [1.57]]) S3.box(x, cam, { x0: .55, x1: 2.4, y0: y - .04, y1: y, z0: 0, z1: .32 }, { col: WOODW, light: WL, lo: .5 });
    for (const X of [.58, 2.37]) S3.box(x, cam, { x0: X - .03, x1: X + .03, y0: 0, y1: 1.9, z0: .26, z1: .32 }, { col: WOODW_D, light: WL, lo: .5 });
    GOURDS.forEach((g, i) => S3.onPlane(x, cam, g, [.019, 0, 0], [0, -.019, 0], xx => {
      Q.gourd(xx, 1, 0);
      xx.fillStyle = PAPER; xx.save(); xx.translate(2.6, -6.6); xx.rotate(.18 + .1 * (i % 3)); xx.fillRect(0, 0, 3.2, 4.4); xx.fillStyle = INKW; xx.fillRect(.7, 1, 1.8, .45); xx.fillRect(.7, 2.1, 1.8, .45); xx.restore();
    }));
  }
  function balance(x, cam) {
    const o = { col: '#3a2c1e', light: WL, lo: .5 }, X = -2.0, Z = .9;
    x.strokeStyle = '#3a2c1e'; x.lineWidth = Math.max(1, cam.f / 1500); x.beginPath();
    S3.line(x, cam, [X, 3.4, Z], [X, 2.3, Z]);
    for (const a of [0, 2.1, 4.2]) S3.line(x, cam, [X - .42, 2.28, Z], [X - .42 + .12 * Math.cos(a), 1.9, Z + .12 * Math.sin(a)]);
    S3.line(x, cam, [X + .34, 2.28, Z], [X + .34, 2.0, Z]);
    x.stroke();
    S3.bar(x, cam, [X - .45, 2.28, Z], [X + .4, 2.28, Z], .012, o);
    S3.cyl(x, cam, [X - .42, Z], .14, 1.88, 1.91, { ...o, col: BRZ });
    S3.cyl(x, cam, [X + .34, Z], .04, 1.92, 2.0, { ...o, col: BRZ });
  }
  function jars(x, cam) {
    for (const [X, Z, r, h] of [[-2.7, .7, .3, .75], [-2.2, 1.5, .24, .6], [-2.85, 1.6, .2, .5]].sort((a, b) => cam.depth([b[0], .3, b[1]]) - cam.depth([a[0], .3, a[1]]))) {
      S3.cyl(x, cam, [X, Z], r, 0, h * .8, { col: '#7a5a3e', light: WL, lo: .45 });
      S3.cyl(x, cam, [X, Z], r * .55, h * .8, h, { col: '#6a4c34', light: WL, lo: .45 });
    }
  }
  function furnace(x, cam, t) {
    const [cx, cz] = MERC.c, o = { col: CLAY, light: WL, lo: .45 };
    S3.cyl(x, cam, [cx, cz], .5, 0, .62, { ...o, cap: false });
    S3.cyl(x, cam, [cx, cz], .54, .62, .7, { ...o, col: CLAY_D });
    const a0 = Math.atan2(cam.pos[2] - cz, cam.pos[0] - cx), arc = [];
    for (let i = 0; i <= 10; i++) { const a = a0 - .35 + .7 * i / 10; arc.push([cx + .501 * Math.cos(a), .06, cz + .501 * Math.sin(a)]); }
    for (let i = 10; i >= 0; i--) { const a = a0 - .35 + .7 * i / 10, k = Math.sin(PI * i / 10); arc.push([cx + .501 * Math.cos(a), .2 + .12 * k, cz + .501 * Math.sin(a)]); }
    const fl = .85 + .15 * Math.sin(t * 17) + .08 * Math.sin(t * 29);
    if (S3.poly(x, cam, arc)) { x.fillStyle = '#2a120a'; x.fill(); }
    const m = cam.proj([cx + .5 * Math.cos(a0), .16, cz + .5 * Math.sin(a0)]);
    if (m) { const r = .2 * m[3], g = x.createRadialGradient(m[0], m[1] + r * .3, 0, m[0], m[1] + r * .3, r); g.addColorStop(0, `rgba(255,230,150,${fl})`); g.addColorStop(.5, `rgba(242,140,50,${.8 * fl})`); g.addColorStop(1, 'rgba(180,50,20,0)'); x.save(); if (S3.poly(x, cam, arc)) x.clip(); x.fillStyle = g; x.fillRect(m[0] - r, m[1] - r, 2 * r, 2 * r); x.restore(); }
    crucible(x, cam, t);
  }
  const ringPts = (cx, cz, r, y, n = 48) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]); } return o; };
  const path = (x, cam, pts) => { const s = S3.clip(cam, pts); if (s.length < 3) return false; x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
  function crucible(x, cam, t) {
    const [cx, cz] = MERC.c, o = { col: BRZ, light: WL, lo: .4 };
    if (path(x, cam, ringPts(cx, cz, .205, .9))) { x.fillStyle = '#3a2c1c'; x.fill(); }
    if (path(x, cam, ringPts(cx, cz, MERC.r, MERC.y))) {
      const c = cam.proj([cx, MERC.y, cz]), R = c ? Math.max(40, .3 * c[3]) : W;
      const g = c ? x.createRadialGradient(c[0] - R * .3, c[1] - R * .2, 0, c[0], c[1], R * 1.3) : null;
      if (g) { g.addColorStop(0, '#f4f6f8'); g.addColorStop(.45, '#b9c0c8'); g.addColorStop(1, '#6d747e'); }
      x.fillStyle = g || '#b9c0c8'; x.fill();
      x.save(); x.clip();
      const age = ringAge(t);
      for (const [a0, k0] of [[age, 1], [age - 1.1, .8], [age - 2.3, .7]]) {
        const u = a0 / 1.6; if (u < 0 || u >= 1) continue;
        for (const k of [1, .6]) { if (!path(x, cam, ringPts(cx, cz, .004 + .12 * u * k, MERC.y + .0005, 40))) continue; x.strokeStyle = `rgba(60,66,76,${.5 * (1 - u) * k * k0})`; x.lineWidth = Math.max(1, .0007 * cam.f / Math.max(.05, cam.depth([cx, MERC.y, cz]))); x.stroke(); }
      }
      x.restore();
    }
    S3.cyl(x, cam, MERC.c, .205, .68, .9, { ...o, cap: false });
    if (path(x, cam, ringPts(cx, cz, .205, .9))) { x.strokeStyle = '#a88a5a'; x.lineWidth = Math.max(1, cam.f / 1100); x.stroke(); }
  }
  const lk = (i, t) => ss(T_TECH - .05 + .14 * i, T_TECH + .5 + .14 * i, t);
  function drafting(x, cam, t) {
    if (t < T_TECH - .1) return;
    const [cx, cz] = MERC.c, segs = [];
    const line = (a, b) => segs.push([a, b]);
    const k1 = lk(0, t);
    for (let i = 0; i < 48 * k1; i++) { const a0 = i / 48 * TAU, a1 = Math.min(i + 1, 48 * k1) / 48 * TAU; line([cx + .34 * Math.cos(a0), .9, cz + .34 * Math.sin(a0)], [cx + .34 * Math.cos(a1), .9, cz + .34 * Math.sin(a1)]); if (i % 4 === 0) line([cx + .34 * Math.cos(a0), .9, cz + .34 * Math.sin(a0)], [cx + .39 * Math.cos(a0), .9, cz + .39 * Math.sin(a0)]); }
    const k2 = lk(1, t), zf = cz + .62;
    if (k2 > 0) { const x0 = cx + .5, x1 = lerp(x0, cx - .5, k2); line([x0, .36, zf], [x1, .36, zf]); line([x0, .3, zf], [x0, .42, zf]); if (k2 >= 1) line([x1, .3, zf], [x1, .42, zf]); }
    const k3 = lk(2, t), xv = cx - .66;
    if (k3 > 0) { line([xv, 0, zf - .1], [xv, .9 * k3, zf - .1]); line([xv - .06, 0, zf - .1], [xv + .06, 0, zf - .1]); if (k3 >= 1) line([xv - .06, .9, zf - .1], [xv + .06, .9, zf - .1]); }
    PTS.forEach((p, i) => {
      const k = lk(3 + i * .7, t); if (k <= 0) return;
      const A = chartAt(p[0], p[1] * .9 + .05), G = GOURDS[[0, 5, 2, 7, 3][i]], B = [G[0], G[1] + .14, .02];
      line(A, [lerp(A[0], B[0], k), lerp(A[1], B[1], k), .02]);
    });
    for (const [wd, col] of [[4.6, 'rgba(255,250,236,.85)'], [2.1, '#24324a']]) {
      x.strokeStyle = col; x.lineWidth = wd * Math.min(1.6, cam.f / 2000); x.lineCap = 'round'; x.beginPath();
      for (const [a, b] of segs) S3.line(x, cam, a, b);
      x.stroke();
    }
    x.lineCap = 'butt';
  }
  function windowMap(ctx, t, cam) {
    const corners = [[3.19, WIN.y0, WIN.z0], [3.19, WIN.y0, WIN.z1], [3.19, WIN.y1, WIN.z1], [3.19, WIN.y1, WIN.z0]].map(p => cam.proj(p));
    if (corners.some(c => !c)) return;
    const top = cam.proj([3.19, WIN.y1, WC[2]]), bot = cam.proj([3.19, WIN.y0, WC[2]]), mid = cam.proj([3.19, WC[1], WC[2]]); if (!top || !bot || !mid) return;
    const s = Math.hypot(top[0] - bot[0], top[1] - bot[1]) / ((WIN.y1 - WIN.y0) * FW() / WDIST);
    const [cv, x] = buf(); clean(x); mapFrame(x, t, camMap(T_OUT, mid[0], mid[1], s), true);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); corners.forEach((c, i) => i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1])); ctx.closePath(); ctx.clip();
    ctx.drawImage(cv, 0, 0); ctx.restore();
  }
  function workshopFrame(ctx, t) {
    const cam = camW(t);
    PA.background(ctx);
    if (t > .9) windowMap(ctx, t, cam);
    PA.sheet(ctx, ID, 1, RC, x => { walls(x, cam); chart(x, cam); }, { rim: false, paperShadow: [2, 3, 4, .12] });
    PA.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      const L = [{ d: cam.depth([1.5, 1.2, .2]), f: () => shelves(x, cam) }, { d: cam.depth([-2, 2.1, .9]), f: () => balance(x, cam) },
        { d: cam.depth([-2.5, .4, 1.2]), f: () => jars(x, cam) }, { d: cam.depth([MERC.c[0], .45, MERC.c[1]]), f: () => furnace(x, cam, t) }];
      L.sort((a, b) => b.d - a.d).forEach(o => o.f());
    }, { paperShadow: [4, 6, 5, .26] });
    PA.sheet(ctx, ID, 1, RC, x => drafting(x, cam, t), { rim: false, shadow: false, fibre: 0 });
    const [cx, cz] = MERC.c, f = cam.proj([cx + .5 * Math.cos(Math.atan2(cam.pos[2] - cz, cam.pos[0] - cx)), .18, cz + .5 * Math.sin(Math.atan2(cam.pos[2] - cz, cam.pos[0] - cx))]);
    if (f) PR.glow(ctx, f[0], f[1], .5 * f[3], '#ffb060', .25, 'flat');
  }

  const XY = () => A8().geo().XY, TOPH = () => A8().geo().top, TW = () => A9().DUR + A10().DUR;
  const PENG = [560, -70];
  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  const T_FLY = T_MAST + .2, T_LAND = 18.9;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const [x0, y0] = XY(), [px, py] = PENG, top = TOPH(), Z0 = 4.6, P0 = 30, c1 = craneAt(16.45), c2 = craneAt(17.3), c3 = craneAt(18.15);
    const K = [
      [T_OUT - .6, x0 + 42, y0 + 4, Z0, P0, 90, top], [T_OUT, x0 + 50, y0 + 4, Z0, P0, 90, top], [T_LAY + .15, px - 70, py + 6, Z0, P0, 90, top],
      [T_ISL, px - 30, py + 3, 8, 28, 88, 128], [T_BEINGS, px - 6, py + 1, 13.5, 27, 82, 130], [T_ELIX, px - 3, py + 1, 16.5, 26, 78, 131],
      [T_FLY, px - 1, py, 18.5, 26, 72, 132], [16.45, c1[0], c1[1], 8, 30, 50, c1[2]], [17.3, c2[0], c2[1], 3.4, 34, 24, c2[2]],
      [18.15, c3[0], c3[1], 5, 38, 7, c3[2] - 8], [T_LAND, x0 - 1, y0 + 11, 27, 47, 0, top], [DUR + 1, x0 + 7, y0 + 14, 26, 49, 3, top]];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camMap(t, cx = W / 2, cy = H / 2, s = 1) {
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p) * s, pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t), cx, cy }, W, H, A6().FLENS * s);
  }
  function daySky(ctx, cam) {
    const hy = cam.cy - cam.f * Math.tan(cam.ph);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (hy > 0) { const g = ctx.createLinearGradient(0, hy - H * .8, 0, hy); g.addColorStop(0, '#6f8ea4'); g.addColorStop(.75, '#b9c7c3'); g.addColorStop(1, '#eadcbc'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(H, hy + 1)); }
    if (hy < H) { const y0 = Math.max(0, hy), g = ctx.createLinearGradient(0, Math.max(hy, -H), 0, H); g.addColorStop(0, hy > 0 ? '#8a9ea8' : S3.mix('#2a3e56', '#8a9ea8', smooth((hy + .25 * H) / (.25 * H)))); g.addColorStop(.25, '#30465e'); g.addColorStop(1, '#16243a'); ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0); }
    ctx.restore();
  }

  const PEAKS = [{ c: [0, 0], h: 152, r: 9, s: 1 }, { c: [7, -9], h: 140, r: 6, s: 2 }, { c: [8, 8], h: 133, r: 5.4, s: 3 }];
  const BASE = 110, FA = 3.0;
  const peakR = (pk, h) => { const u = clamp((h - BASE) / (pk.h - BASE)), j = .13 * Math.sin(u * 29 + pk.s * 3) + .08 * Math.sin(u * 53 + pk.s) + (F.hash(Math.round(u * 16), pk.s, 7) - .5) * .16; return pk.r * (.22 + .78 * (1 - Math.pow(u, .9))) * (1 + j) * (u > .97 ? .55 : 1); };
  const peakC = (pk, h) => { const u = (h - BASE) / (pk.h - BASE); return [PENG[0] + pk.c[0] + .7 * Math.sin(u * 6 + pk.s), PENG[1] + pk.c[1] + .5 * Math.cos(u * 5 + pk.s)]; };
  const TERR = [
    { pk: 0, h: 124, w: 7.5, hr: 4.2, halls: [[FA - .72, 'gold', 1], [FA + .78, 'silver', 1]], pines: [2.05, 3.42, 3.98] },
    { pk: 0, h: 139, w: 4, hr: 2.1, halls: [[FA, 'gold', .85]], pines: [3.5] },
    { pk: 1, h: 130, w: 3, hr: 1.6, halls: [[FA - .25, 'silver', .7]] },
    { pk: 2, h: 125, w: 3, hr: 1.6, halls: [[FA + .25, 'silver', .7]] }];
  const terrR = tr => peakR(PEAKS[tr.pk], tr.h) + tr.w;
  const onTerr = (tr, a, r) => { const c = peakC(PEAKS[tr.pk], tr.h); return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), tr.h]; };
  const ROCK0 = '#245a58', ROCK1 = '#4f9886', ROCK_TOP = '#a3d0b0', LEDGE = '#3d7a70', LEDGE_TOP = '#d8e4c6';
  function hullS(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const ringScr = (cam, c, r, h, n = 32) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, p = cam.at(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), h); if (!p) return null; o.push([p[0], p[1]]); } return o; };
  function band(x, A, B, col) {
    const hl = hullS(A.concat(B)); let x0 = 1e9, x1 = -1e9; for (const q of hl) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); }
    const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, F.tone(col, '#0e2426', .3)); g.addColorStop(.55, col); g.addColorStop(1, F.tone(col, '#e8f2d6', .2));
    x.fillStyle = g; x.beginPath(); hl.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill();
  }
  function peak(x, cam, pk) {
    const N = 22, terr = TERR.filter(tr => PEAKS[tr.pk] === pk);
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const h = BASE + (pk.h - BASE) * i / N, k = i / N, cur = ringScr(cam, peakC(pk, h), Math.max(.4, peakR(pk, h)), h);
      if (prev && cur) band(x, prev, cur, F.tone(ROCK1, ROCK0, .85 - .85 * k));
      prev = cur;
      for (const tr of terr) if (tr.h > h - (pk.h - BASE) / N && tr.h <= h) {
        const c = peakC(pk, tr.h), R = terrR(tr), lo = ringScr(cam, c, R, tr.h - 1.1, 40), hi = ringScr(cam, c, R, tr.h, 40);
        if (lo && hi) { band(x, lo, hi, LEDGE); x.fillStyle = LEDGE_TOP; x.beginPath(); hi.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); x.strokeStyle = 'rgba(255,255,240,.6)'; x.lineWidth = Math.max(1, .12 * cam.z); x.stroke(); }
      }
    }
    const top = peakC(pk, pk.h); x.fillStyle = ROCK_TOP; x.beginPath(); QM.ring(x, cam, QM.disk(top[0], top[1], Math.max(.4, peakR(pk, pk.h)), 30), pk.h); x.fill();
  }
  const facingA = (cam, c, a, h) => { const p = [c[0] + Math.cos(a), h, -(c[1] + Math.sin(a))]; return (cam.pos[0] - p[0]) * Math.cos(a) + (cam.pos[2] - p[2]) * -Math.sin(a) > 0; };
  function crevices(x, cam) {
    const pk = PEAKS[0];
    x.strokeStyle = 'rgba(14,40,40,.38)'; x.lineWidth = Math.max(1, .22 * cam.z);
    for (const a of [2.45, 3.28, 3.9]) for (const [h0, h1] of [[BASE + 1, 122.6], [125.4, 137.6], [140.4, 149]]) {
      if (!facingA(cam, peakC(pk, (h0 + h1) / 2), a, (h0 + h1) / 2)) continue;
      x.beginPath(); for (let h = h0, j = 0; h <= h1; h += 1, j++) { const c = peakC(pk, h), r = peakR(pk, h) + .1, aa = a + .05 * Math.sin(h * .9), p = cam.at(c[0] + r * Math.cos(aa), c[1] + r * Math.sin(aa), h); if (p) j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.stroke();
    }
  }
  function stairs(x, cam) {
    const pk = PEAKS[0], pts = [];
    for (let i = 0; i <= 6; i++) { const h = 124.2 + 14.8 * i / 6, a = i % 2 ? 2.86 : 2.62, c = peakC(pk, h), r = peakR(pk, h) + .3, p = cam.at(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), h); if (p) pts.push(p); }
    for (const [wd, col] of [[.75, '#e8ead6'], [.22, 'rgba(60,90,80,.6)']]) { x.strokeStyle = col; x.lineWidth = Math.max(1, wd * cam.z); x.beginPath(); pts.forEach((p, j) => j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
  }
  function falls(x, cam, t) {
    const one = (tr, a, h0, h1) => {
      const c = peakC(PEAKS[tr.pk], tr.h), R = terrR(tr) + .05, P = (aa, h) => cam.at(c[0] + R * Math.cos(aa), c[1] + R * Math.sin(aa), h);
      const q = [P(a - .05, h0), P(a + .05, h0), P(a + .05, h1), P(a - .05, h1)]; if (q.some(v => !v)) return;
      x.fillStyle = 'rgba(236,246,248,.92)'; x.beginPath(); q.forEach((p, j) => j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(150,186,200,.7)'; x.lineWidth = Math.max(1, .14 * cam.z);
      for (let k = 0; k < 6; k++) { const v = (t * 1.1 + k / 6) % 1, a0 = P(a - .02 + .04 * (k % 3) / 2, lerp(h0, h1, v)), a1 = P(a - .02 + .04 * (k % 3) / 2, lerp(h0, h1, Math.min(1, v + .12))); if (a0 && a1) { x.beginPath(); x.moveTo(a0[0], a0[1]); x.lineTo(a1[0], a1[1]); x.stroke(); } }
    };
    one(TERR[1], 3.45, 139, 124.1);
    one(TERR[0], 3.56, 124, 111);
  }
  function hall(x, cam, q, roof, sc) {
    const [mx, my, h0] = q, PW = 1.8 * sc, PD = 1.25 * sc, bx = (hw, hd, a, b, col) => S3.box(x, cam, { x0: mx - hw, x1: mx + hw, y0: a, y1: b, z0: -(my + hd), z1: -(my - hd) }, { col });
    bx(PW + .45, PD + .45, h0, h0 + .4, '#e6dcc0');
    bx(PW, PD, h0 + .4, h0 + .4 + 1.3 * sc, '#a8452e');
    const e0 = h0 + .4 + 1.3 * sc, e1 = e0 + 1.05 * sc, ow = PW + .5 * sc, od = PD + .5 * sc, rw = PW * .5, P3 = (a, b, hh) => [a, hh, -b];
    const col = roof === 'gold' ? '#dba640' : '#d2d6de';
    const faces = [[[P3(mx - ow, my + od, e0), P3(mx + ow, my + od, e0), P3(mx + rw, my, e1), P3(mx - rw, my, e1)], [0, .6, -.8]], [[P3(mx + ow, my - od, e0), P3(mx - ow, my - od, e0), P3(mx - rw, my, e1), P3(mx + rw, my, e1)], [0, .6, .8]],
      [[P3(mx + ow, my + od, e0), P3(mx + ow, my - od, e0), P3(mx + rw, my, e1)], [.8, .6, 0]], [[P3(mx - ow, my - od, e0), P3(mx - ow, my + od, e0), P3(mx - rw, my, e1)], [-.8, .6, 0]]];
    for (const [pts, n] of faces) if (S3.facing(cam, pts[0], n) && S3.poly(x, cam, pts)) { x.fillStyle = S3.shade(col, n); x.fill(); }
  }
  function pine(x, cam, q, mag) {
    const u = QM.up(cam, q[0], q[1], q[2]); if (!u) return;
    const s = 2.3 * u.k * mag;
    x.strokeStyle = '#3a2a1e'; x.lineWidth = Math.max(1, .07 * s); x.beginPath(); x.moveTo(u.x, u.y); x.lineTo(u.x + .05 * s, u.y - .85 * s); x.stroke();
    for (const [dx, dy, w] of [[-.08, -.42, .5], [.1, -.62, .42], [-.02, -.82, .32]]) { x.fillStyle = '#1f4a3a'; x.beginPath(); x.ellipse(u.x + dx * s, u.y + dy * s, w * s, .11 * s, -.08, 0, TAU); x.fill(); x.fillStyle = '#2f6a4e'; x.beginPath(); x.ellipse(u.x + dx * s + .04 * s, u.y + dy * s - .04 * s, w * s * .7, .07 * s, -.08, 0, TAU); x.fill(); }
  }
  const gourdAt = () => onTerr(TERR[0], FA + .06, peakR(PEAKS[0], 124) + 2.4);
  function pool(x, cam) {
    const q = onTerr(TERR[0], FA - .1, peakR(PEAKS[0], 124) + 2.6);
    x.fillStyle = '#9fd2dc'; x.beginPath(); QM.ring(x, cam, QM.disk(q[0], q[1], 1.3, 28), q[2] + .03); x.fill();
    x.strokeStyle = '#eef4ea'; x.lineWidth = Math.max(1, .1 * cam.z); x.stroke();
  }
  function gourd(x, cam, t, mag) {
    const q = gourdAt(), u = QM.up(cam, q[0], q[1], q[2]); if (!u) return;
    x.save(); x.translate(u.x, u.y); Q.gourd(x, 3.6 * u.k * mag / 15, 0); x.restore();
  }
  const PUFFS = (() => { const R = F.rng(606), o = []; for (let i = 0; i < 40; i++) o.push({ a: i / 40 * TAU + R() * .2, r: 14 + 10 * R(), h: 110 + 6 * R(), s: 2.4 + 2 * R(), w: .03 + .03 * R() }); return o; })();
  const puffAt = (p, t) => [PENG[0] + p.r * Math.cos(p.a + p.w * t), PENG[1] + p.r * Math.sin(p.a + p.w * t), p.h];
  function puff(x, cam, p, t) {
    const q = puffAt(p, t), u = QM.up(cam, q[0], q[1], q[2]); if (!u) return;
    const r = p.s * u.k;
    for (const [dx, dy, k, c] of [[0, 0, 1, '#eef2f4'], [-.8, .25, .7, '#e2e9ee'], [.85, .2, .75, '#f7f8f9'], [.1, .45, .8, '#dbe3e8']]) { x.fillStyle = c; x.beginPath(); x.ellipse(u.x + dx * r, u.y + dy * r * .6, r * k, r * k * .55, 0, 0, TAU); x.fill(); }
  }
  const HU = 2.6, INK = '#1b2130', RIMC = '#fff3d8', IMM = Q.silhouette('alchemist', INK), IMM_RIM = Q.silhouette('alchemist', RIMC);
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  const WALK = [{ a0: 2.47, t0: 5.0 }, { a0: 2.32, t0: 5.35 }];
  const GAITS = WALK.map(wk => Mo.gait({ from: 0, to: 560, t0: wk.t0, gait: 'stroll', style: { step: 38, lift: 4, lean: .02, arms: .22, bob: 1.6 }, until: 16.8 }));
  const RW = () => peakR(PEAKS[0], 124) + 6.2;
  const walkerA = (i, t) => WALK[i].a0 + GAITS[i].x(t) * HU / 92 / RW();
  const walkerPos = (i, t) => onTerr(TERR[0], walkerA(i, t), RW());
  const transK = t => ss(T_TRANS + .05, T_TRANS + .4, t);
  function walker(x, cam, i, t, mag) {
    const q = walkerPos(i, t), q2 = onTerr(TERR[0], walkerA(i, t) + .03, RW()), u = QM.up(cam, q[0], q[1], q[2]), u2 = QM.up(cam, q2[0], q2[1], q2[2]); if (!u || !u2) return;
    const k = i === 1 ? 1 - transK(t) : 1; if (k <= 0) return;
    const G = GAITS[i], tp = Mo.pose(t), pose = { ...centre(G(tp), G.x(tp)), yaw: u2.x > u.x ? 0 : PI };
    const s = HU * u.k * mag / 92 * (.6 + .4 * k), tilt = clamp(1 - u.lev, 0, .5);
    x.save(); x.globalAlpha *= k;
    for (const [L, dx, dy] of [[IMM_RIM, -1.4, -1.2], [IMM, 0, 0]]) { x.save(); x.translate(u.x + dx, u.y + dy); x.scale(s, s); Q.draw(x, FL.P, pose, L, { tilt, robe: 46, shadow: 0 }); x.restore(); }
    x.restore();
  }
  const MASTER_POSE = { ...Mo.stand(0), arms: [[.06, .16, -.12], [.08, .2, -.12]], yaw: .5 };
  const riseH = t => 30 * easeIO(clamp((t - T_ASC + .05) / 2.6));
  function master(x, cam, t, mag) {
    const top = PEAKS[0].h, c = peakC(PEAKS[0], top), u = QM.up(cam, c[0], c[1], top + .2 + riseH(t)); if (!u) return;
    const s = HU * 1.1 * u.k * mag / 92, cl = ss(T_ASC - .2, T_ASC + .2, t);
    if (cl > 0) for (const [dx, dy, k] of [[0, 0, 1], [-.5, .1, .7], [.55, .08, .75]]) { x.fillStyle = `rgba(246,247,248,${cl})`; x.beginPath(); x.ellipse(u.x + dx * 38 * s, u.y + 4 * s + dy * 20 * s, 30 * s * k, 9 * s * k, 0, 0, TAU); x.fill(); }
    for (const [L, dx, dy] of [[IMM_RIM, -1.4, -1.2], [IMM, 0, 0]]) { x.save(); x.translate(u.x + dx, u.y + dy); x.scale(s, s); Q.draw(x, FL.P, MASTER_POSE, L, { tilt: clamp(1 - u.lev, 0, .5), robe: 48, shadow: 0 }); x.restore(); }
  }
  function crane(x, sx, sy, S, dir, ph, stand = 0) {
    x.save(); x.translate(sx, sy); x.scale(dir * S / 40, S / 40);
    if (stand > .5) {
      x.strokeStyle = '#2a2a2e'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-1, 2); x.lineTo(-1.5, 14); x.moveTo(1.5, 2); x.lineTo(2.5, 14); x.stroke();
      x.fillStyle = '#f4f2ec'; x.beginPath(); x.ellipse(0, 0, 7, 3.6, -.15, 0, TAU); x.fill();
      x.fillStyle = '#1d1d22'; x.beginPath(); x.ellipse(-5.5, 1.2, 4, 2, .3, 0, TAU); x.fill();
      x.strokeStyle = '#1d1d22'; x.lineWidth = 2; x.beginPath(); x.moveTo(5, -1.5); x.quadraticCurveTo(7, -9, 7.5, -13); x.stroke();
      x.fillStyle = '#1d1d22'; x.beginPath(); x.arc(7.8, -13.5, 1.5, 0, TAU); x.fill();
      x.strokeStyle = '#8a7a50'; x.lineWidth = 1; x.beginPath(); x.moveTo(9, -13.4); x.lineTo(12.5, -12.6); x.stroke();
      x.restore(); return;
    }
    const wa = Math.sin(ph), wing = (col, tip, k) => {
      const L = 19 * k, y = -1 - L * wa * .95;
      x.fillStyle = col; x.beginPath(); x.moveTo(-4, -1); x.lineTo(4, -1); x.lineTo(-1, y); x.lineTo(-9, y * .92); x.closePath(); x.fill();
      x.fillStyle = tip; x.beginPath(); x.moveTo(-1, y); x.lineTo(-9, y * .92); x.lineTo(-6.4, y * .62 - 1); x.closePath(); x.fill();
    };
    wing('#d9d8d2', '#3a3a40', .92);
    x.strokeStyle = '#2a2a2e'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-6, 1); x.lineTo(-20, 3); x.stroke();
    x.fillStyle = '#f4f2ec'; x.beginPath(); x.ellipse(0, 0, 8, 2.8, 0, 0, TAU); x.fill();
    x.strokeStyle = '#1d1d22'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(6, -.8); x.quadraticCurveTo(11, -2.6, 15, -2.8); x.stroke();
    x.fillStyle = '#1d1d22'; x.beginPath(); x.arc(15.5, -3, 1.6, 0, TAU); x.fill();
    x.strokeStyle = '#8a7a50'; x.lineWidth = 1; x.beginPath(); x.moveTo(17, -2.8); x.lineTo(21, -2.2); x.stroke();
    wing('#f8f7f2', '#1d1d22', 1);
    x.restore();
  }
  const CRANES = [0, 1, 2, 3].map(i => ({ a0: i * 1.7 + .4, r: 12 + 2.5 * i, h: 158 + 2.5 * i, w: .42 + .05 * i }));
  const circAt = (c, t) => [PENG[0] + c.r * Math.cos(c.a0 + c.w * t), PENG[1] + c.r * Math.sin(c.a0 + c.w * t), c.h + 1.5 * Math.sin(t * 1.3 + c.a0)];
  const COURT = () => [XY()[0] - 8, XY()[1] + 8];
  function craneAt(t) {
    const q0 = walkerPos(1, T_TRANS + .2), a0 = Math.atan2(q0[1] - PENG[1], q0[0] - PENG[0]);
    const pA = tt => { const u = easeIO(clamp((tt - T_TRANS - .2) / (T_FLY - T_TRANS - .2))), a = a0 + 1.1 * u, r = lerp(Math.hypot(q0[0] - PENG[0], q0[1] - PENG[1]), 14, u); return [PENG[0] + r * Math.cos(a), PENG[1] + r * Math.sin(a), lerp(q0[2] + 1.5, 156, u)]; };
    if (t <= T_FLY) { const p = pA(t); return [p[0], p[1], p[2], 0]; }
    const P1 = pA(T_FLY), cc = COURT(), end = [cc[0] - 1, cc[1] + 6, TOPH() + .2], mid = [lerp(P1[0], end[0], .5), lerp(P1[1], end[1], .5) - 20, 192];
    const u = easeIO(clamp((t - T_FLY) / (T_LAND - T_FLY))), b = i => (1 - u) * (1 - u) * P1[i] + 2 * u * (1 - u) * mid[i] + u * u * end[i];
    return [b(0), b(1), b(2), u >= 1 ? 1 : 0];
  }
  function island(put, cam, t, o) {
    if (!o && t > T_LAND + 1) return;
    const mag = clamp(14 / cam.z, 1, 3), dOf = q => cam.depth([q[0], q[2], -q[1]]), ia = o && o.alpha != null ? o.alpha : 1;
    if (ia <= 0) return;
    put(PENG[0], PENG[1], 130, x => {
      if (ia < 1) { x.save(); x.globalAlpha *= ia; }
      x.lineCap = 'round'; x.lineJoin = 'round';
      const cd = dOf([PENG[0], PENG[1], 113]), puffs = PUFFS.map(p => { const q = puffAt(p, t); return { p, d: dOf(q) }; }).sort((a, b) => b.d - a.d);
      puffs.filter(o => o.d > cd).forEach(o => puff(x, cam, o.p, t));
      const groups = PEAKS.map((pk, k) => ({ k, d: dOf([PENG[0] + pk.c[0], PENG[1] + pk.c[1], 120]) })).sort((a, b) => b.d - a.d);
      for (const g of groups) {
        const pk = PEAKS[g.k], L = [];
        peak(x, cam, pk);
        if (g.k === 0) { crevices(x, cam); falls(x, cam, t); }
        TERR.forEach(tr => {
          if (tr.pk !== g.k) return;
          tr.halls.forEach(([a, roof, sc]) => { const q = onTerr(tr, a, peakR(pk, tr.h) + tr.hr); L.push({ d: dOf(q), f: () => hall(x, cam, q, roof, sc) }); });
          (tr.pines || []).forEach(a => { const q = onTerr(tr, a, terrR(tr) - .9); L.push({ d: dOf(q), f: () => pine(x, cam, q, mag) }); });
        });
        if (g.k === 0) {
          L.push({ d: dOf(gourdAt()) + .3, f: () => { pool(x, cam); gourd(x, cam, t, mag); } });
          if (!(o && o.quiet)) {
            WALK.forEach((wk, i) => L.push({ d: dOf(walkerPos(i, t)), f: () => walker(x, cam, i, t, mag) }));
            L.push({ d: 1e6, f: () => master(x, cam, t, mag) });
          }
        }
        L.sort((a, b) => b.d - a.d).forEach(o => o.f());
      }
      puffs.filter(o => o.d <= cd).forEach(o => puff(x, cam, o.p, t));
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      if (ia < 1) x.restore();
    });
    for (const c of CRANES) { const q = circAt(c, t), q2 = circAt(c, t + .05), u = QM.up(cam, q[0], q[1], q[2]), u2 = QM.up(cam, q2[0], q2[1], q2[2]); if (u && u2) put(q[0], q[1], q[2], x => { if (ia < 1) { x.save(); x.globalAlpha *= ia; } crane(x, u.x, u.y, 3.6 * u.k * mag, u2.x > u.x ? 1 : -1, t * 7 + c.a0 * 3); if (ia < 1) x.restore(); }); }
  }
  function flyingCrane(put, cam, t) {
    if (t < T_TRANS + .2) return;
    const q = craneAt(t), q2 = craneAt(Math.min(t + .05, T_LAND)), u = QM.up(cam, q[0], q[1], q[2]), u2 = QM.up(cam, q2[0], q2[1], q2[2]); if (!u) return;
    const mag = clamp(14 / cam.z, 1, 3), grow = ss(T_TRANS + .2, T_TRANS + .5, t), dir = q[3] ? -1 : (u2 && Math.abs(u2.x - u.x) > .3 ? (u2.x > u.x ? 1 : -1) : -1);
    const fly = ss(T_FLY - .4, T_FLY + .3, t) * (1 - ss(T_LAND - .6, T_LAND, t)), S = Math.max(3.6 * u.k * mag, (M45 ? 120 : 150) * fly);
    put(q[0], q[1], q[2], x => crane(x, u.x, u.y, S * grow, dir, t * (6 + 2 * (1 - fly)), q[3]));
  }
  function islandGlows(ctx, t, cam, o) {
    if (!o && t > T_LAND + 1) return;
    const sh = SH(), g = QM.up(cam, PENG[0], PENG[1], 132); if (!g) return;
    PR.glow(ctx, g.x - sh.x, g.y - sh.y, Math.max(60, 34 * g.k), '#ffe2a0', .2 * (o && o.glow != null ? o.glow : 1), 'flat');
    if (o && o.quiet) return;
    const mg = clamp(14 / cam.z, 1, 3);
    const ge = ss(T_ELIX - .05, T_ELIX + .3, t) * (1 - .5 * ss(T_TRANS, T_TRANS + 1, t));
    if (ge > 0) { const q = gourdAt(), u = QM.up(cam, q[0], q[1], q[2] + 2); if (u) { PR.glow(ctx, u.x - sh.x, u.y - sh.y, 5 * u.k * mg, '#fff0c0', .8 * ge, 'flat'); vapour(ctx, u, t, ge, cam); } }
    const gt = Math.exp(-Math.pow((t - T_TRANS - .25) / .18, 2));
    if (gt > .01) { const q = walkerPos(1, T_TRANS + .2), u = QM.up(cam, q[0], q[1], q[2] + 1.3); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 4.5 * u.k * mg, '#ffffff', .9 * gt, 'flat'); }
    const gm = ss(T_ASC - .1, T_ASC + .3, t);
    if (gm > 0) { const c = peakC(PEAKS[0], PEAKS[0].h), u = QM.up(cam, c[0], c[1], PEAKS[0].h + 1.4 + riseH(t)); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 4.5 * u.k * mg, '#fff4d8', .7 * gm, 'flat'); }
  }
  function vapour(ctx, u, t, a, cam) {
    const s = u.k * clamp(14 / cam.z, 1, 3), sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = (t * .5 + i / 3) % 1; ctx.strokeStyle = `rgba(255,248,226,${.5 * a * (1 - ph)})`; ctx.lineWidth = Math.max(1, .3 * s);
      ctx.beginPath(); for (let k = 0; k <= 12; k++) { const v = k / 12, yy = u.y - sh.y - (1 + 4 * ph + 2 * v) * s, xx = u.x - sh.x + Math.sin(v * 5 + t * 2 + i) * .7 * s; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
    }
    ctx.restore();
  }

  function house(x, cam, mx, my, o) {
    const h0 = TOPH(), { PW, PD, wall, rise, wallCol, roofCol } = o, bx = (hw, hd, a, b, col) => S3.box(x, cam, { x0: mx - hw, x1: mx + hw, y0: a, y1: b, z0: -(my + hd), z1: -(my - hd) }, { col });
    bx(PW + .5, PD + .5, h0, h0 + .45, '#cdbf9c');
    bx(PW, PD, h0 + .45, h0 + .45 + wall, wallCol);
    if (o.door) o.door(h0 + .45);
    const e0 = h0 + .45 + wall, e1 = e0 + rise, ow = PW + .55, od = PD + .55, rw = PW * .5, P3 = (a, b, hh) => [a, hh, -b];
    const faces = [[[P3(mx - ow, my + od, e0), P3(mx + ow, my + od, e0), P3(mx + rw, my, e1), P3(mx - rw, my, e1)], [0, .6, -.8]], [[P3(mx + ow, my - od, e0), P3(mx - ow, my - od, e0), P3(mx - rw, my, e1), P3(mx + rw, my, e1)], [0, .6, .8]],
      [[P3(mx + ow, my + od, e0), P3(mx + ow, my - od, e0), P3(mx + rw, my, e1)], [.8, .6, 0]], [[P3(mx - ow, my - od, e0), P3(mx - ow, my + od, e0), P3(mx - rw, my, e1)], [-.8, .6, 0]]];
    for (const [pts, n] of faces) if (S3.facing(cam, pts[0], n) && S3.poly(x, cam, pts)) { x.fillStyle = S3.shade(roofCol, n); x.fill(); }
    return e1;
  }
  const WS = () => [XY()[0] + 13, XY()[1] + 24], TR = () => [XY()[0] - 9, XY()[1] + 25];
  const WSO = { PW: 2.6, PD: 1.8, wall: 1.8, rise: 1.3, wallCol: '#d8c6a0' }, TRO = { PW: 3.4, PD: 1.6, wall: 1.6, rise: 1.1, wallCol: '#c9b48c', roofCol: '#5a3a2a' };
  const T_G0 = T_STATE - .05, T_G1 = T_STATE + .6;
  const galU = t => easeIO(clamp((t - T_G0) / (T_G1 - T_G0)));
  const goldK = t => ss(T_G1 - .1, T_G1 + .15, t);
  const GAL = () => { const p = A13().PAL[1], [wx, wy] = WS(), d = [wx - p.x, wy - p.y], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L]; return { a: [p.x + u[0] * 3.9, p.y + u[1] * 3.9], b: [wx - u[0] * 2.9, wy - u[1] * 2.9], n: [-u[1], u[0]] }; };
  function gallery(x, cam, t) {
    const k = galU(t); if (k <= 0) return;
    const { a, b, n } = GAL(), e = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], h0 = TOPH(), d = Math.hypot(b[0] - a[0], b[1] - a[1]) * k, wv = [n[0] * .65, n[1] * .65];
    if (d < .2) return;
    x.strokeStyle = '#3a2c26'; x.lineWidth = Math.max(1, .09 * cam.z); x.beginPath();
    for (let s2 = 0; s2 <= d; s2 += 1.3) { const q = [lerp(a[0], e[0], s2 / d), lerp(a[1], e[1], s2 / d)]; for (const sg of [-1, 1]) S3.line(x, cam, [q[0] + sg * wv[0], h0, -(q[1] + sg * wv[1])], [q[0] + sg * wv[0], h0 + 1.7, -(q[1] + sg * wv[1])]); }
    x.stroke();
    const roof = [[a[0] - wv[0] * 1.3, a[1] - wv[1] * 1.3], [e[0] - wv[0] * 1.3, e[1] - wv[1] * 1.3], [e[0] + wv[0] * 1.3, e[1] + wv[1] * 1.3], [a[0] + wv[0] * 1.3, a[1] + wv[1] * 1.3]];
    if (S3.poly(x, cam, roof.map(q => [q[0], h0 + 1.9, -q[1]]))) { x.fillStyle = S3.mix('#4a3a3e', '#d9a443', .55); x.fill(); x.strokeStyle = '#2a2026'; x.lineWidth = 1; x.stroke(); }
  }
  const roofTop = () => TOPH() + .45 + WSO.wall + WSO.rise;
  const ALCH = [[1, 1], [2, 3], [1, 4]];
  const RANKS = () => { const c = COURT(), o = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) o.push({ x: c[0] + (k - 2.5) * 1.6, y: c[1] + (r - 1.5) * 1.7, alch: ALCH.some(([a, b]) => a === r && b === k), i: r * 6 + k }); return o; };
  function standee(x, u, h, alch) {
    const body = (dx, dy, robe, cap) => {
      x.fillStyle = robe; x.beginPath();
      x.moveTo(u.x + dx - .16 * h, u.y + dy - .74 * h); x.lineTo(u.x + dx + .16 * h, u.y + dy - .74 * h); x.lineTo(u.x + dx + .24 * h, u.y + dy); x.lineTo(u.x + dx - .24 * h, u.y + dy); x.closePath(); x.fill();
      x.fillStyle = cap; x.beginPath(); x.arc(u.x + dx, u.y + dy - .84 * h, .11 * h, 0, TAU); x.fill();
      if (alch) { x.beginPath(); x.ellipse(u.x + dx, u.y + dy - 1.0 * h, .075 * h, .13 * h, 0, 0, TAU); x.fill(); }
      else x.fillRect(u.x + dx - .07 * h, u.y + dy - 1.03 * h, .14 * h, .15 * h);
    };
    if (h > 9) body(-.06 * h, -.04 * h, 'rgba(255,241,208,.6)', 'rgba(255,241,208,.6)');
    body(0, 0, alch ? '#ece4d0' : '#36505a', alch ? '#4a3f5e' : '#161618');
    if (alch && h > 9) { x.fillStyle = '#9a7234'; x.beginPath(); x.ellipse(u.x + .2 * h, u.y - .36 * h, .05 * h, .07 * h, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(u.x + .2 * h, u.y - .46 * h, .035 * h, .04 * h, 0, 0, TAU); x.fill(); }
  }
  function smoke(x, cam, t) {
    const [mx, my] = WS(), base = roofTop() + 1.4, big = 1 + 1.2 * ss(T_G1 - .05, T_G1 + .5, t);
    for (let i = 0; i < 7; i++) {
      const u = (t * .32 + i / 7) % 1, q = QM.up(cam, mx + 1.6 + 3 * u, my - .6 - 1.5 * u, base + 7 * u); if (!q) continue;
      x.fillStyle = `rgba(92,90,96,${.42 * (1 - u)})`; x.beginPath(); x.arc(q.x, q.y, (.5 + 1.4 * u) * big * q.k, 0, TAU); x.fill();
    }
  }
  function capital(put, cam, t) {
    const mag = clamp(14 / cam.z, 1, 3), [wx, wy] = WS(), [tx, ty] = TR();
    put(wx, wy, TOPH(), x => {
      const roof = S3.mix('#4a4648', '#e8b040', goldK(t));
      house(x, cam, wx, wy, { ...WSO, roofCol: roof, wallCol: S3.mix(WSO.wallCol, '#8a3a2a', goldK(t)), door: h => { const pts = [[wx - .6, h, -(wy + WSO.PD + .01)], [wx + .6, h, -(wy + WSO.PD + .01)], [wx + .6, h + 1.2, -(wy + WSO.PD + .01)], [wx - .6, h + 1.2, -(wy + WSO.PD + .01)]]; if (S3.poly(x, cam, pts)) { x.fillStyle = '#2a140c'; x.fill(); } } });
      S3.box(x, cam, { x0: wx + 1.3, x1: wx + 1.9, y0: roofTop() - 1, y1: roofTop() + 1.4, z0: -(wy - .3), z1: -(wy - .9) }, { col: '#5a5450' });
      smoke(x, cam, t);
    });
    put(tx, ty, TOPH(), x => house(x, cam, tx, ty, { ...TRO, door: h => {
      const X = tx + TRO.PW + .01, pts = [[X, h, -(ty + .7)], [X, h, -(ty - .7)], [X, h + 1.1, -(ty - .7)], [X, h + 1.1, -(ty + .7)]];
      if (S3.facing(cam, pts[0], [1, 0, 0]) && S3.poly(x, cam, pts)) { x.fillStyle = '#1e140e'; x.fill(); }
      for (const s of [-1, 1]) { const z0 = -(ty + s * .7), z1 = -(ty + s * 1.4); S3.face(x, cam, [[X, h, z0], [X + .5, h, z1], [X + .5, h + 1.1, z1], [X, h + 1.1, z0]], '#6a4428'); }
    } }));
    for (const r of RANKS()) put(r.x, r.y, TOPH(), x => { const u = QM.up(cam, r.x, r.y, TOPH()); if (u) standee(x, u, 2.2 * u.k * mag * (.7 + .3 * u.lev), r.alch); });
    if (galU(t) > 0) { const { a, b } = GAL(); put((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, TOPH(), x => gallery(x, cam, t)); }
    flyingCrane(put, cam, t);
  }
  const COINW = () => { const [tx, ty] = TR(), [wx, wy] = WS(), [x0, y0] = XY(); return QM.road([[tx + 3.9, ty], [tx + 6.5, ty + .6], [wx - 3.6, wy + 2.6], [wx + 3.4, wy + 2.8], [wx + 9, wy - 5], [x0 + 42, y0 + .5], [x0 + 200, y0 + .5]]); };
  let CW = null;
  const coinRoad = () => CW || (CW = COINW());
  const headS = t => t < T_GIVE ? -1 : 12 * (t - T_GIVE) + 10 * Math.pow(Math.max(0, t - T_UNL), 1.5);
  function coins(x, cam, t) {
    const hs = headS(t); if (hs < 0) return;
    const R = coinRoad(), h = TOPH() + .15, gap = .9, sp = Math.sin(cam.ph), wide = ss(T_UNL - .05, T_UNL + .6, t);
    for (let s = Math.min(hs, R.L), i = 0; s > 0; s -= gap * (1 - .4 * wide), i++) {
      const q = QM.along(R, s), nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
      for (const ln of wide > 0 ? [0, -1, 1] : [0]) {
        if (ln && (F.hash(i, ln + 5) > wide)) continue;
        const off = ln * .85 + (F.hash(i, ln, 2) - .5) * .4, u = cam.at(q[0] + nx * off, q[1] + ny * off, h); if (!u) continue;
        const r = Math.max(2.2, .62 * u[3]), spin = .55 + .45 * Math.abs(Math.cos(t * 6 + i * 1.7 + ln));
        x.fillStyle = '#7a5418'; x.beginPath(); x.ellipse(u[0] + .5, u[1] + 1, r * spin, r * Math.max(.3, sp), 0, 0, TAU); x.fill();
        x.fillStyle = '#f0c25a'; x.beginPath(); x.ellipse(u[0], u[1], r * spin, r * Math.max(.3, sp), 0, 0, TAU); x.fill();
        if (r > 3) { x.fillStyle = '#7a5418'; x.fillRect(u[0] - r * .22 * spin, u[1] - r * .22 * Math.max(.3, sp), r * .44 * spin, r * .44 * Math.max(.3, sp)); }
      }
    }
  }
  const PAL0 = () => { const p = A13().PAL[0]; return [p.x, p.y + A13().PD + .02, A13().TOP() + 1.5]; };
  const lightA = t => ss(T_EMPR - .1, T_EMPR + .25, t), threadU = t => easeIO(clamp((t - T_EMPR - .15) / (T_GIVE - T_EMPR - .1)));
  function capitalGlows(ctx, t, cam) {
    const sh = SH(), mag = clamp(14 / cam.z, 1, 3);
    for (const r of RANKS()) if (r.alch) {
      const a = ss(T_LAND - .25, T_LAND + .2, t) * (1 - .35 * ss(T_STATE - .5, T_STATE, t)); if (a <= 0) continue;
      const u = QM.up(cam, r.x, r.y, TOPH() + 1.2); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 1.1 * u.k * mag, '#fff1c8', .75 * a, 'flat');
    }
    const [wx, wy] = WS(), dg = QM.up(cam, wx, wy + WSO.PD, TOPH() + 1.0);
    if (dg) PR.glow(ctx, dg.x - sh.x, dg.y - sh.y, (1.4 + 1.6 * ss(T_G1 - .05, T_G1 + .45, t)) * dg.k * mag, '#ffa040', .45 + .35 * ss(T_G1 - .05, T_G1 + .45, t), 'flat');
    const gk = galU(t);
    if (gk > 0 && gk < 1) { const { a, b } = GAL(), q = [lerp(a[0], b[0], gk), lerp(a[1], b[1], gk)], u = QM.up(cam, q[0], q[1], TOPH() + 1.1); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 1.6 * u.k * mag, '#ffd890', .7, 'flat'); }
    const imp = Math.exp(-Math.pow((t - T_G1) / .16, 2));
    if (imp > .01) { const u = QM.up(cam, wx, wy, roofTop()); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 4 * u.k * mag, '#ffe6a0', .6 * imp, 'flat'); }
    const la = lightA(t);
    if (la > 0) {
      const [px, py, ph] = PAL0(), u = QM.up(cam, px, py, ph); if (!u) return;
      PR.glow(ctx, u.x - sh.x, u.y - sh.y, 3.4 * u.k * mag, '#ffc977', .6 * la, 'flat'); PR.glow(ctx, u.x - sh.x, u.y - sh.y, 1 * u.k * mag, '#fff4dc', .9 * la, 'flat');
      const k = threadU(t), [tx, ty] = TR(), v = QM.up(cam, tx + TRO.PW, ty, TOPH() + 1.4);
      if (k > 0 && v) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = `rgba(255,226,160,${.8 * la * (1 - .5 * ss(T_UNL, T_BUD + .6, t))})`; ctx.lineWidth = 2.2; ctx.beginPath();
        const N = 24; for (let i = 0; i <= N * k; i++) { const s = i / N, xx = lerp(u.x, v.x, s) - sh.x, yy = lerp(u.y, v.y, s) - Math.sin(PI * s) * 40 - sh.y; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke(); ctx.restore();
      }
    }
  }

  function mapFrame(ctx, t, cam, inWindow, ex) {
    A9().world(ctx, TW() + t, cam, {
      noCarts: true, throneK: 0, sky: (c, cm) => (ex && ex.sky ? ex.sky : daySky)(c, cm), onTop: (x, cm) => { coins(x, cm, t); if (ex && ex.onTop) ex.onTop(x, cm); },
      uprights: (put, cm, m) => { A13().uprights(put, cm, 99); island(put, cm, ex && ex.isle ? ex.isle.t : t, ex && ex.isle); capital(put, cm, t); if (ex && ex.uprights) ex.uprights(put, cm, m); },
      glows: (c, cm) => { islandGlows(c, ex && ex.isle ? ex.isle.t : t, cm, ex && ex.isle); capitalGlows(c, t, cm); if (ex && ex.glows) ex.glows(c, cm); },
    });
    if (!inWindow) { tags(ctx, t, cam); }
  }
  function tags(ctx, t, cam) {
    const a = ss(T_PENG - .05, T_PENG + .25, t) * (1 - ss(T_BEINGS + .1, T_BEINGS + .45, t)); if (a <= 0) return;
    const u = QM.up(cam, PENG[0], PENG[1], PEAKS[0].h + 4); if (!u) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); QM.tag(ctx, u.x, u.y - 10, 'PENGLAI', { alpha: a, size: M45 ? 34 : 38, stem: 34 }); ctx.restore();
  }

  function own(ctx, t) {
    if (t < T_OUT) workshopFrame(ctx, t); else mapFrame(ctx, t, camMap(t));
    FL.grade(ctx, T0() + t);
  }
  function draw(ctx, t) {
    if (t <= 0) return S14().draw(ctx, A14().DUR);
    if (t >= T_XF1) return own(ctx, t);
    A14().roomFrame(ctx, A14().DUR + t);
    const b = ss(T_XF0, T_XF1, t); if (b <= 0) return;
    const [cv, x] = buf2(); clean(x); own(x, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = b; ctx.drawImage(cv, 0, 0); ctx.restore();
  }

  F.scene('seq-15', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'shimmer', g: .08 },
      { t: .5, type: 'rumble', dur: 3.4, g: .07 },
      { t: .6, type: 'crackle', dur: 3.6, rate: 8, g: .05 },
      ...[0, 1, 2, 3, 4, 5].map(i => ({ t: T_TECH - .02 + .14 * i, type: 'marker', dur: .32, g: .07 })),
      { t: T_PROB + .05, type: 'tick', g: .2 },
      { t: T_OUT - .55, type: 'whoosh', f0: 90, f1: 210, dur: 1.4, g: .14 },
      { t: T_OUT + .4, type: 'wind', dur: 2.4, g: .05 },
      { t: T_PENG, type: 'shimmer', g: .18 },
      { t: T_ISL, type: 'lib', dur: 2.2, label: 'CRANE CALLS, FAR' },
      { t: T_BEINGS, type: 'bells', g: .05 },
      { t: T_ELIX, type: 'clink', f: 3200, g: .12 },
      { t: T_TRANS + .2, type: 'swoosh', dur: .6, g: .12 },
      { t: T_TRANS + .25, type: 'flutter', g: .12 },
      { t: T_ASC, type: 'riser', dur: 1.6, f0: 420, f1: 1250, g: .07 },
      { t: T_FLY, type: 'whoosh', f0: 70, f1: 160, dur: T_LAND - T_FLY, g: .12 },
      { t: T_FLY + .1, type: 'flutter', g: .1 },
      { t: T_LAND, type: 'tap', g: .12, noSnap: true },
      { t: T_LAND - .1, type: 'tick', g: .2 },
      { t: T_G0, type: 'slide', dur: T_G1 - T_G0, g: .16 },
      ...[0, 1, 2, 3].map(i => ({ t: T_G0 + .1 + i * (T_G1 - T_G0 - .1) / 4, type: 'clunk', f: 120 + 8 * i, g: .07, noSnap: true })),
      { t: T_G1, type: 'shimmer', g: .16 },
      { t: T_G1, type: 'rumble', dur: 1.2, g: .14 },
      { t: T_EMPR, type: 'shimmer', g: .1 },
      { t: T_EMPR + .15, type: 'riser', dur: T_GIVE - T_EMPR, f0: 2400, f1: 3200, g: .04 },
      { t: T_GIVE, type: 'lib', dur: DUR - T_GIVE, label: 'A STREAM OF COINS POURING, ON AND ON' },
      ...(() => { const o = []; for (let tt = T_GIVE + .05, k = 0; tt < DUR; k++) { o.push({ t: tt, type: 'clink', f: 2900 + 1300 * F.hash(k, 3), g: .05 + .03 * F.hash(k, 4), noSnap: true }); tt += Math.max(.04, .22 - .035 * (tt - T_GIVE)) * (.6 + .8 * F.hash(k, 5)); } return o; })(),
    ],
    api: { DUR, camMap, craneAt, mapFrame, daySky, RANKS, COURT, WS, TR, WSO, TRO, roofTop, PAL0, PENG, PEAKS, headS, coinRoad, T_GIVE, T_UNL, TOPH, XY },
  });
})();
