(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, QM = F.qinmap, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-23'), DUR = C.duration;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const S22 = () => F.getScene('seq-22'), A22 = () => S22().api, D22 = () => A22().DUR;
  const A14 = () => F.getScene('seq-14').api, R = () => A14().room;
  const T0 = () => F.getScene('seq-21').api.T0() + F.getScene('seq-21').api.DUR + D22();
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

  const T_EMP = 1.71, T_MED = 2.89, T_FEAR1 = 3.76, T_SIDE = 5.96, T_EFF = 6.22, T_MORE = 6.78, T_FEAR2 = 7.03;
  const T_SRC = 8.23, T_INCR = 10.6, T_ERR = 11.41, T_SECR = 12.13, T_ENR = 13.41;
  const T_EVERY = 14.56, T_SYMP = 14.82, T_HIM = 16.39, T_ALCH = 17.02, T_PROOF = 18.18, T_STRONG = 19.34, T_DOSE = 19.86;
  const T_FEED = 21.1, T_LOOP = 21.67, T_NO = 22.25, T_SEAL = 23.55, T_INSIDE = 23.94, T_UNLIM = 24.86, T_SUPPLY = 25.46;
  const XF = .5;

  const LAMP = () => R().LAMP, INK = '#07061a', SHADOW = '#140f22';
  const HIM = [-.57, 0, 1.12];
  const CUP = [-.08, .55, 1.12], CUP_M = .0074;
  const SHX = -1.25;
  const ALCH = [[1.12, .0172], [1.6, .0168]];
  const clockT = t => t + 3;
  const erratic = t => bump(t, T_ERR - .05, T_ERR + .05, T_SECR - .2, T_SECR + .05);
  const lightK = t => 1 - .72 * bump(t, T_SECR - .05, T_SECR + .35, T_ENR - .15, T_ENR + .05);
  const rage = t => bump(t, T_ENR - .05, T_ENR + .12, T_ENR + .9, T_EVERY + .6);
  const flameK = t => { const k = Math.floor(t * 15); return lightK(t) * (1 + .9 * rage(t)) * (1 + .5 * erratic(t) * (hash(k, 7) - .3)); };
  const fearK = t => 1.25 * (1 - .12 * bump(t, T_FEAR1 - .1, T_FEAR1 + .5, T_SIDE - .4, T_SIDE)) * (1 + .7 * ss(T_MORE - .05, T_FEAR2 + .55, t) + .22 * ss(T_INCR - .05, T_INCR + .6, t) + .3 * rage(t) + .08 * ss(T_FEED, T_SUPPLY, t));

  const FK = M45 ? .78 : 1;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const L = LAMP(), E = A22().eyeLight(D22()), f0 = E.r * .55 / .12;
    const K = [
      [0, [L[0], L[1], L[2] + .55], [L[0], L[1], 0], f0],
      [XF, [L[0], L[1], L[2] + .55], [L[0], L[1], 0], f0],
      [1.65, [.2, 1.18, 3.25], [-.3, 1.05, .8], 1100 * FK],
      [T_MED + .1, [.62, 1.4, 3.55], [-.15, 1.08, .5], 1150 * FK],
      [T_FEAR2 + .3, [.78, 1.5, 3.6], [-.2, 1.42, .3], 1150 * FK],
      [T_ERR, [.92, 1.55, 3.62], [-.22, 1.46, .3], 1150 * FK],
      [T_EVERY, [1.02, 1.55, 3.64], [-.2, 1.42, .3], 1150 * FK],
      [T_PROOF + .2, [1.1, 1.55, 3.66], [-.15, 1.36, .35], 1170 * FK],
      [T_FEED - .1, [.9, 1.68, 3.68], [-.05, 1.42, .4], 1170 * FK],
      [T_NO + .1, [.3, 2.15, 3.8], [.25, 1.72, 0], 1150 * FK],
      [T_SEAL - .5, [.3, 2.25, 4.45], [.3, 2.0, 0], 1120 * FK],
      [T_INSIDE - .1, [.3, 2.8, 8.5], [.3, 2.6, 1.9], 1100 * FK],
      [T_UNLIM - .2, [.3, 4.0, 14], [.3, 4.0, 1.9], 1150 * FK],
      [T_SUPPLY + .2, [.3, 5.0, 20], [.3, 4.3, 1.9], 1250 * FK],
      [DUR, [.3, 5.5, 23.5], [.3, 4.3, 1.9], 1300 * FK],
      [DUR + .8, [.3, 5.55, 25], [.3, 4.3, 1.9], 1300 * FK]];
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(Math.max(0, t))), g = S.g.map(f => f(Math.max(0, t))), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    let yaw = Math.atan2(d[0], d[2]); if (yaw < 0) yaw += TAU;
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: Math.exp(S.f(Math.max(0, t))), W, H, near: .02 });
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
    const CK = R().CK, WA = A14().WATER(), top = 1.62 - .012 * clockT(t);
    const L = [BX(-.15, .95, .5, .55, .7, 1.55), BX(.24, .56, .55, .73, .89, 1.21), CY(CK[0], CK[1], .15, .73, 1.14),
      BX(.33, .345, 1.14, 1.31, 1.043, 1.057), BX(.455, .47, 1.14, 1.31, 1.043, 1.057), BX(.33, .47, 1.31, 1.335, 1.043, 1.057),
      BX(.394, .406, 1.1, top, 1.044, 1.056), CY(WA.c[0], WA.c[1], .11, .55, .62)];
    for (const [X, Z] of [[-.1, .75], [.9, .75], [-.1, 1.5], [.9, 1.5]]) L.push(BX(X - .03, X + .03, 0, .5, Z - .03, Z + .03));
    return L;
  }
  const HPOSE = Q.kneel({ lean: .02, head: .02, arms: [[.06, .16], [.09, .2]] }), SIL = Q.silhouette('emperor', SHADOW, SHADOW);
  const APOSE = { ...Q.bowStand({ bow: .04 }), yaw: 0 }, ASIL = Q.silhouette('alchemist', SHADOW, SHADOW);
  const shM = t => .0178 * fearK(t);
  const shPt = (u, v, t) => { const m = shM(t); return [SHX + u * m, .1 + v * m, .01]; };
  let SHB = null, WBOX = null;
  function blurred(x, px, alpha, fn) {
    if (!SHB) SHB = F.canvas(W, H);
    const [cv, b] = SHB, B = WBOX;
    if (B) { b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.filter = 'none'; b.clearRect(B[0], B[1], B[2], B[3]); } else clean(b);
    fn(b);
    x.save(); x.filter = `blur(${(Math.round(px * 4) / 4).toFixed(2)}px)`; x.globalAlpha = alpha;
    if (B) x.drawImage(cv, B[0], B[1], B[2], B[3], B[0], B[1], B[2], B[3]); else x.drawImage(cv, 0, 0);
    x.restore();
  }
  function shadows(x, cam, t) {
    const fl = R().flick(t), L = LAMP(), Lf = [L[0], L[1] + .03 * (fl - 1), L[2]];
    blurred(x, Math.max(1, cam.f / 900), 1, b => {
      b.fillStyle = SHADOW; b.beginPath();
      for (const part of parts(t)) {
        const hl = hull2(part.map(p => onWall(p, Lf))).map(q => cam.proj([q[0], q[1], .002])); if (hl.some(v => !v)) continue;
        hl.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.closePath();
      }
      b.fill();
    });
    const ak = ss(T_ALCH - .1, T_ALCH + .35, t);
    blurred(x, lerp(5, 1.4, ak), .4 + .55 * ak, b => { for (const [X, m] of ALCH) S3.onPlane(b, cam, [X, .1, .003], [-m, 0, 0], [0, -m, 0], xx => Q.draw(xx, LB.P, APOSE, ASIL, { robe: 44, tilt: 0, shadow: 0 })); });
    const m = shM(t) * (1 + .12 * (fl - 1)), er = erratic(t), rg = rage(t), k15 = Math.floor(t * 15);
    blurred(x, Math.max(1, cam.f / 800), 1, b => {
      const one = (dx, dy, s, a) => { b.globalAlpha = a; S3.onPlane(b, cam, [SHX + dx, .1 + dy, .002], [m * s, 0, 0], [0, -m * s, 0], xx => Q.draw(xx, LB.P, HPOSE, SIL, { kneel: true, crown: true, beard: true, profile: true, tilt: 0, shadow: 0 })); };
      if (rg > .01) for (let i = 1; i <= 3; i++) one((hash(k15, i) - .5) * .05 * rg, .02 * i * rg, 1 + .035 * i * rg, .22 * rg);
      if (er > .01) for (let i = 1; i <= 2; i++) one((hash(k15, 10 + i) - .5) * .3 * er, (hash(k15, 20 + i) - .5) * .08 * er, 1 + (hash(k15, 30 + i) - .5) * .1 * er, .5 * er);
      one(er * (hash(k15, 3) - .5) * .12, 0, 1, 1);
    });
  }

  const KING = Q.silhouette('emperor', INK, '#4a4038'), KING_RIM = Q.silhouette('emperor', '#ffb466', '#ffb466'), KING_SILV = Q.silhouette('emperor', '#e8f0ff', '#e8f0ff');
  const doseIn = t => bump(t, T_MED + .35, T_MED + .7, T_FEAR1 + .2, T_FEAR1 + .8);
  function him(x, cam, t) {
    const fa = S3.figureAt(cam, HIM, 0); if (!fa || fa.depth < .5) return;
    const hd = Math.hypot(cam.pos[0] - HIM[0], cam.pos[2] - HIM[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - .7, hd)), 0, .6);
    const pose = { ...HPOSE, lean: HPOSE.lean + .006 * Math.sin(t * 1.6), yaw: fa.yaw }, o = { kneel: true, crown: true, beard: true, profile: true, tilt, shadow: 0 };
    const rim = Math.max(1.6, fa.s * .35), lit = .7 + .3 * bump(t, T_HIM - .1, T_HIM + .15, T_HIM + .7, T_HIM + 1.2);
    x.save(); x.globalAlpha = lit * lightK(t) * (1 + .3 * rage(t)); x.translate(fa.sx + rim, fa.sy - rim * .4); x.scale(fa.s, fa.s); Q.draw(x, LB.P, pose, KING_RIM, o); x.restore();
    const sv = doseIn(t); if (sv > 0) { x.save(); x.globalAlpha = sv; x.translate(fa.sx + rim * .6, fa.sy - rim * .6); x.scale(fa.s, fa.s); Q.draw(x, LB.P, pose, KING_SILV, o); x.restore(); }
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, LB.P, pose, KING, o); x.restore();
  }
  const LIGHTF = p => { const L = LAMP(), d = [L[0] - p[0], L[1] - p[1], L[2] - p[2]], l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; };
  const LEGS = [[-.1, .75], [.9, .75], [-.1, 1.5], [.9, 1.5]];
  function tableLegs(x, cam, far) {
    const c = R().colours, o = { col: c.WOOD_D, light: LIGHTF([.4, .3, 1.1]), lo: .22, ink: c.NIGHT }, dh = cam.depth([HIM[0], .45, HIM[2]]);
    LEGS.map(([X, Z]) => ({ X, Z, d: cam.depth([X, .25, Z]) })).filter(g => (g.d > dh) === far).sort((a, b) => b.d - a.d)
      .forEach(({ X, Z }) => S3.box(x, cam, { x0: X - .03, x1: X + .03, y0: 0, y1: .5, z0: Z - .03, z1: Z + .03 }, o));
  }
  function tableTop(x, cam) {
    const c = R().colours, o = { col: c.WOOD_D, light: LIGHTF([.4, .3, 1.1]), lo: .22, ink: c.NIGHT };
    S3.box(x, cam, { x0: -.15, x1: .95, y0: .5, y1: .55, z0: .7, z1: 1.55 }, { ...o, col: c.WOOD, light: LIGHTF([.4, .55, 1.1]) });
    S3.box(x, cam, { x0: .24, x1: .56, y0: .55, y1: .73, z0: .89, z1: 1.21 }, { ...o, col: c.WOOD_D, light: LIGHTF([.4, .65, 1.05]) });
  }
  const cupFill = t => .55 - .27 * ss(T_MED + .3, T_FEAR1 + .3, t) + .68 * ss(T_STRONG - .1, T_DOSE + .3, t) - .02 * Math.max(0, Math.sin((t - T_FEED) * 6)) * ss(T_FEED, T_LOOP, t);
  function cup(x, cam, t) {
    const p = CUP, e = Math.atan2(cam.pos[1] - (p[1] + .05), Math.hypot(cam.pos[0] - p[0], cam.pos[2] - p[2]));
    S3.onPlane(x, cam, p, [Math.cos(cam.yaw) * CUP_M, 0, -Math.sin(cam.yaw) * CUP_M], [0, -CUP_M, 0], xx => Q.cup(xx, { s: 1, elev: Math.max(.12, e), fill: cupFill(t), liquid: '#b8bec8', k: .15, beads: [] }));
  }

  function flame(ctx, cam, t) {
    const L = LAMP(), q = cam.proj([L[0], .972, L[2]]); if (!q) return;
    const fl = R().flick(t), k = flameK(t), rg = rage(t), h = .075 * q[3] * fl * k, wd = .021 * q[3] * (.8 + .2 * k);
    const col = (a, b) => S3.mix(a, b, .55 * rg);
    PR.glow(ctx, q[0], q[1] - h * .4, .8 * q[3] * (.6 + .4 * k), col('#ffae4a', '#ff6a2a'), .2 * Math.min(1.6, k), 'flat');
    const tear = (s, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(q[0] - wd * s, q[1]); ctx.quadraticCurveTo(q[0] - wd * s * 1.15, q[1] - h * s * .55, q[0] + .1 * wd * Math.sin(t * 9), q[1] - h * s); ctx.quadraticCurveTo(q[0] + wd * s * 1.15, q[1] - h * s * .55, q[0] + wd * s, q[1]); ctx.closePath(); ctx.fill(); };
    tear(1, col('#ff9a3a', '#ff5a1e')); tear(.62, col('#ffd27a', '#ffa040')); tear(.3, '#fff6e0');
    PR.glow(ctx, q[0], q[1] - h * .5, .12 * q[3], '#fff0cc', .6, 'flat');
  }
  function drops(ctx, cam, t) {
    const D = A14().drips(), tc = clockT(t), i1 = Math.floor((tc - D.t0) / D.every);
    for (let i = i1 - 1; i <= i1; i++) {
      const a = tc - (D.t0 + i * D.every); if (a < 0 || a >= D.hang + D.fall) continue;
      const u = Math.max(0, a - D.hang), k = Math.min(1, a / D.hang), p = [D.tip[0], D.tip[1] - .004 - .004 * k - 4.9 * u * u, D.tip[2] + .003], q = cam.proj(p); if (!q) continue;
      const r = Math.max(1.4, (.0014 + .0018 * k) * q[3]);
      const g = ctx.createRadialGradient(q[0] - r * .3, q[1] - r * .4, 0, q[0], q[1], r * 1.6); g.addColorStop(0, 'rgba(255,246,224,.95)'); g.addColorStop(.45, 'rgba(255,214,150,.55)'); g.addColorStop(1, 'rgba(120,90,70,.25)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * (1 + Math.min(1.4, 9 * u)), 0, 0, TAU); ctx.fill();
    }
  }
  function mood(ctx, cam, t) {
    const L = LAMP(), q = cam.proj([L[0], L[1], L[2]]), dk = .82 * (1 - lightK(t)), rg = rage(t);
    if (dk > .01 && q) {
      const g = ctx.createRadialGradient(q[0], q[1], .25 * q[3], q[0], q[1], 1.1 * q[3]); g.addColorStop(0, 'rgba(2,2,10,0)'); g.addColorStop(1, `rgba(2,2,10,${dk})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (rg > .01) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,96,32,${.13 * rg})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  }

  const qb = (A, B, Cc, s) => { const a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s; return [A[0] * a + B[0] * b + Cc[0] * c, A[1] * a + B[1] * b + Cc[1] * c, A[2] * a + B[2] * b + Cc[2] * c]; };
  function arcs(t) {
    const A1a = [CUP[0], CUP[1] + .085, CUP[2]], A1b = [HIM[0] + .14, .66, HIM[2]], A2a = [HIM[0] - .04, .98, HIM[2] - .04], A2b = shPt(6, 38, t), A3a = shPt(14, 58, t), A3b = [CUP[0] + .005, CUP[1] + .1, CUP[2]];
    const mid = (a, b, d) => add3([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], d);
    return [[A1a, mid(A1a, A1b, [0, .42, .16]), A1b], [A2a, mid(A2a, A2b, [.05, .55, .3]), A2b], [A3a, mid(A3a, A3b, [.25, .75, .45]), A3b]];
  }
  const drawn = t => [ss(T_MED - .05, T_MED + .5, t), ss(T_SIDE - .1, T_EFF + .25, t), ss(T_PROOF - .05, T_PROOF + .5, t)];
  function arrow(ctx, cam, A, u, a) {
    const N = 40, pts = []; for (let i = 0; i <= N; i++) { const p = cam.proj(qb(...A, u * i / N)); if (!p) return; pts.push(p); }
    const L = []; let s = 0; for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(s); }
    const kE = pts[N][3], hl = Math.min(.09 * kE, s * .6), hw = .036 * kE, ww = i => Math.max(2.2, .0125 * pts[i][3]);
    const nrm = i => { const a0 = pts[Math.max(0, i - 1)], a1 = pts[Math.min(N, i + 1)], dx = a1[0] - a0[0], dy = a1[1] - a0[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    let ib = N; while (ib > 1 && s - (L[ib - 2] || 0) < hl) ib--;
    const left = [], right = [];
    for (let i = 0; i <= ib; i++) { const n = nrm(i), r = ww(i); left.push([pts[i][0] + n[0] * r, pts[i][1] + n[1] * r]); right.push([pts[i][0] - n[0] * r, pts[i][1] - n[1] * r]); }
    const nb = nrm(ib), tip = pts[N];
    const path = () => { ctx.beginPath(); left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineTo(pts[ib][0] + nb[0] * hw, pts[ib][1] + nb[1] * hw); ctx.lineTo(tip[0], tip[1]); ctx.lineTo(pts[ib][0] - nb[0] * hw, pts[ib][1] - nb[1] * hw); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath(); };
    ctx.save(); ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(6px)'; path(); ctx.fillStyle = 'rgba(200,220,255,.35)'; ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; path(); ctx.fillStyle = '#dfe6f0'; ctx.fill(); ctx.strokeStyle = '#1b2130'; ctx.lineWidth = Math.max(1.2, .0022 * kE); ctx.lineJoin = 'miter'; ctx.stroke();
    ctx.restore();
  }
  const intS = (t, a, b) => { const x = clamp((t - a) / (b - a)); return (b - a) * (x * x * x - x * x * x * x / 2) + Math.max(0, t - b); };
  function beads(ctx, cam, t, AR) {
    const at = (j, s) => cam.proj(qb(...AR[j], s));
    const dot = (p, r, a) => { if (!p) return; PR.glow(ctx, p[0], p[1], r * 3, '#cfe0ff', .45 * a, 'flat'); ctx.fillStyle = `rgba(240,246,255,${a})`; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill(); };
    const r0 = p => Math.max(2.5, .007 * (p ? p[3] : 0));
    for (const [j, a, b] of [[0, T_MED + .3, T_FEAR1 + .4], [1, T_EFF + .25, T_FEAR2 + .2]]) {
      if (t < a || t > b + .8) continue;
      for (let i = 0; i < 4; i++) { const s = (t - a - i * .16) / .55; if (s < 0 || s > 1 || a + i * .16 + .55 > b + .8) continue; const p = at(j, s); dot(p, r0(p), 1 - ss(.85, 1, s)); }
    }
    const lk = ss(T_FEED - .1, T_FEED + .3, t); if (lk <= 0) return;
    const ph = .55 * ((t - T_FEED) + 3 * intS(t, T_FEED, T_SEAL));
    for (let i = 0; i < 9; i++) { const v = (((ph + i / 9) % 1 + 1) % 1) * 3, j = Math.min(2, Math.floor(v)), p = at(j, v - j); dot(p, r0(p), lk); }
  }
  const WORDS = [['TREMORS', .62, .42], ['INSOMNIA', -.62, .42], ['MEMORY LOSS', .66, -.12], ['PARANOIA', -.66, -.12]];
  function words(ctx, cam, t, AR) {
    if (t < T_SYMP - .1 || t > T_PROOF + 1.6) return;
    const size = M45 ? 38 : 42, bh = size * 1.26;
    WORDS.forEach(([txt, u, v], i) => {
      const a = ss(T_SYMP - .05 + i * .12, T_SYMP + .15 + i * .12, t), s = ss(T_PROOF + .4 + i * .1, T_PROOF + 1.05 + i * .1, t); if (a <= 0 || s >= .97) return;
      const hc = shPt(8, 50, t), p0 = cam.proj([hc[0] + u, Math.min(hc[1], 2.55) + v, .02]), p1 = cam.proj(qb(...AR[2], Math.max(.08, s))); if (!p0 || !p1) return;
      const k = ss(0, .12, s), x0 = lerp(p0[0], p1[0], k), y0 = lerp(p0[1], p1[1], k);
      QM.tag(ctx, x0, y0 + bh / 2, txt, { alpha: a * (1 - ss(.8, .97, s)), size: Math.round(size * (1 - .65 * s)), stem: 0, card: '#f5ecd8', accent: '#9aa2ae' });
    });
  }
  function shell(x, cam, t) {
    const L = LAMP(), c = cam.proj(L), dim = (pts, col) => {
      if (!S3.poly(x, cam, pts)) return;
      if (c) { const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], 2.6 * c[3]); g.addColorStop(0, S3.mix(col, '#5e3c3a', .5)); g.addColorStop(1, col); x.fillStyle = g; } else x.fillStyle = col;
      x.fill();
    };
    dim([[-3.2, 3.2, 0], [3.8, 3.2, 0], [3.8, 3.2, 3.9], [-3.2, 3.2, 3.9]], '#0c0a1e');
    dim([[-3.2, 0, 0], [-3.2, 3.2, 0], [-3.2, 3.2, 3.9], [-3.2, 0, 3.9]], '#120e28');
    dim([[3.8, 0, 0], [3.8, 0, 3.9], [3.8, 3.2, 3.9], [3.8, 3.2, 0]], '#120e28');
  }

  const AXX = .3, AXZ = 1.9, CUTZ = 4.2, GY = -2.9, SHELL = .2;
  const rOut = Mo.monotone([[-2.5, 0], [-2.3, 2.2], [-1.7, 3.8], [-.8, 4.8], [.4, 5.4], [1.8, 5.6], [3.2, 5.3], [4.4, 4.4], [5.3, 3.0], [5.9, 2.15], [6.4, 2.0],
    [7.0, 2.4], [7.8, 2.95], [8.6, 3.05], [9.3, 2.7], [9.9, 1.9], [10.3, 1.15], [10.6, .95], [11.0, 1.0]]);
  const rIn = y => Math.max(.05, rOut(y) - SHELL);
  const NY = 38, NA = 44, YS = Array.from({ length: NY + 1 }, (_, i) => -2.45 + 13.45 * i / NY);
  const ring = (y, r, a) => [AXX + r * Math.cos(a), y, AXZ + r * Math.sin(a)];
  const clipZ = P => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = a[2] <= CUTZ, ib = b[2] <= CUTZ; if (ia) out.push(a); if (ia !== ib) { const u = (CUTZ - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, CUTZ]); } } return out; };
  function gourdQuads(cam, inner) {
    const out = [], V = cam.pos;
    for (let i = 0; i < NY; i++) {
      const y0 = YS[i], y1 = YS[i + 1], ym = (y0 + y1) / 2; if (inner && ym > 5.9) continue;
      const rf = inner ? rIn : rOut, r0 = rf(y0), r1 = rf(y1), dr = (r1 - r0) / (y1 - y0);
      for (let j = 0; j < NA; j++) {
        const a0 = j / NA * TAU, a1 = (j + 1) / NA * TAU, am = (a0 + a1) / 2, n = [Math.cos(am), -dr, Math.sin(am)], nl = Math.hypot(...n);
        const c = ring(ym, (r0 + r1) / 2, am), v = [V[0] - c[0], V[1] - c[1], V[2] - c[2]], vd = (v[0] * n[0] + v[1] * n[1] + v[2] * n[2]) / nl;
        if (inner ? vd >= 0 : vd <= 0) continue;
        const Q4 = [ring(y0, r0, a0), ring(y0, r0, a1), ring(y1, r1, a1), ring(y1, r1, a0)], P = ym < 5.9 ? clipZ(Q4) : Q4; if (P.length < 3) continue;
        out.push({ P, d: cam.depth(c), y: ym, f: Math.abs(vd) / (Math.hypot(...v) || 1) });
      }
    }
    return out.sort((a, b) => b.d - a.d);
  }
  function quadGrown(x, cam, P, col) {
    const s = S3.clip(cam, P); if (s.length < 3) return;
    let mx = 0, my = 0; for (const q of s) { mx += q[0]; my += q[1]; } mx /= s.length; my /= s.length;
    x.beginPath(); s.forEach((q, i) => { const dx = q[0] - mx, dy = q[1] - my, l = Math.hypot(dx, dy) || 1, X = q[0] + dx / l * .55, Y = q[1] + dy / l * .55; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath();
    x.fillStyle = col; x.fill();
  }
  function gourdRings(x, cam, inner, colorOf) {
    const rings = new Map();
    for (const q of gourdQuads(cam, inner)) { const k = q.y; let r = rings.get(k); if (!r) rings.set(k, r = { qs: [], d: 0 }); r.qs.push(q); r.d += q.d; }
    const list = [...rings.values()].sort((a, b) => b.d / b.qs.length - a.d / a.qs.length);
    for (const r of list) {
      const mids = []; x.beginPath();
      for (const q of r.qs) {
        const s = S3.clip(cam, q.P); if (s.length < 3) continue;
        let mx = 0, my = 0; for (const p of s) { mx += p[0]; my += p[1]; } mx /= s.length; my /= s.length;
        s.forEach((p, i) => { const dx = p[0] - mx, dy = p[1] - my, l = Math.hypot(dx, dy) || 1, X = p[0] + dx / l * .55, Y = p[1] + dy / l * .55; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath();
        mids.push([mx, my, colorOf(q)]);
      }
      if (!mids.length) continue;
      if (mids.length === 1) { x.fillStyle = mids[0][2]; x.fill(); continue; }
      let a = mids[0], z = mids[0]; for (const m of mids) { if (m[0] < a[0]) a = m; if (m[0] > z[0]) z = m; }
      const dx = z[0] - a[0], dy = z[1] - a[1], L2 = dx * dx + dy * dy;
      if (L2 < 1) { x.fillStyle = mids[0][2]; x.fill(); continue; }
      const g = x.createLinearGradient(a[0], a[1], z[0], z[1]);
      mids.map(m => [clamp(((m[0] - a[0]) * dx + (m[1] - a[1]) * dy) / L2), m[2]]).sort((u, v) => u[0] - v[0]).forEach(([s, c]) => g.addColorStop(s, c));
      x.fillStyle = g; x.fill();
    }
  }
  function gourdIn(x, cam) {
    gourdRings(x, cam, true, q => S3.mix(S3.mix('#7a3a30', '#2a1830', ss(-.5, 6.2, q.y)), '#140c22', .35 * (1 - q.f)));
  }
  function gourdOut(x, cam, t) {
    gourdRings(x, cam, false, q => { const glow = clamp(1 - Math.abs(q.y - 1.8) / 12), fr = Math.pow(1 - q.f, 4); return S3.mix(S3.mix('#1c1028', '#b8643a', .8 * Math.pow(q.f, 1.5) * (.3 + .7 * glow)), '#ffb466', .3 * fr); });
    const c = CUTZ - AXZ, side = (rf, s, ys) => ys.map(y => { const r = rf(y); return [AXX + s * Math.sqrt(Math.max(0, r * r - c * c)), y, CUTZ]; });
    const ysO = [], ysI = []; for (let y = -2.45; y <= 6.2; y += .08) { if (rOut(y) > c) ysO.push(y); if (rIn(y) > c) ysI.push(y); }
    const pth = pts => { const s = S3.clip(cam, pts); if (s.length < 3) return false; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
    x.beginPath();
    const okO = ysO.length > 2 && pth(side(rOut, 1, ysO).concat(side(rOut, -1, ysO.slice().reverse())));
    if (okO && ysI.length > 2) pth(side(rIn, 1, ysI).concat(side(rIn, -1, ysI.slice().reverse())));
    if (okO) {
      const pu = bump(t, T_SEAL - .05, T_SEAL + .15, T_SEAL + .5, T_SEAL + 1.1), q0 = cam.proj([AXX, 1.5, CUTZ]);
      if (q0) { const g = x.createRadialGradient(q0[0], q0[1], 0, q0[0], q0[1], 7 * q0[3]); g.addColorStop(0, S3.mix('#d48a4c', '#fff0c8', .6 * pu)); g.addColorStop(1, S3.mix('#6a3424', '#ffb466', .6 * pu)); x.fillStyle = g; } else x.fillStyle = '#a0603a';
      x.fill('evenodd');
    }
  }
  function platform(x, cam) {
    const r = rIn(0) - .02, P = clipZ(Array.from({ length: 48 }, (_, i) => ring(0, r, i / 48 * TAU)));
    if (S3.poly(x, cam, P)) { x.fillStyle = '#1a1226'; x.fill(); }
    const xc = Math.sqrt(Math.max(0, r * r - (CUTZ - AXZ) ** 2));
    if (S3.poly(x, cam, [[AXX - xc, 0, CUTZ], [AXX + xc, 0, CUTZ], [AXX + xc, -.22, CUTZ], [AXX - xc, -.22, CUTZ]])) { x.fillStyle = '#7a4630'; x.fill(); }
  }
  const stand = (x, cam) => S3.cyl(x, cam, [AXX, AXZ], 2.4, GY, -2.25, { col: '#2a1e16', lo: .25, ink: INK, light: [0, .6, .8] });
  const sealK = t => bump(t, T_SEAL + .1, T_SEAL + .35, T_INSIDE + .5, T_UNLIM);
  function stopper(x, cam, t) {
    const o = { col: '#5a1a16', lo: .3, ink: INK, light: [.2, .5, .85] };
    S3.cyl(x, cam, [AXX, AXZ], .84, 10.5, 11.45, o);
    S3.ring(x, cam, [AXX, AXZ], 1.03, 10.62, 10.76, '#a88a52');
    S3.onPlane(x, cam, [AXX - .34, 11.33, AXZ + .86], [.68, 0, 0], [0, -.68, 0], xx => {
      xx.fillStyle = '#b5372b'; xx.fillRect(0, 0, 1, 1); xx.strokeStyle = '#f0d0b0'; xx.lineWidth = .05; xx.strokeRect(.08, .08, .84, .84);
      xx.lineWidth = .06; xx.beginPath(); for (const [a, b, c2, d] of [[.25, .25, .25, .75], [.25, .5, .45, .5], [.55, .22, .55, .78], [.55, .3, .78, .3], [.78, .3, .78, .7], [.55, .7, .78, .7]]) { xx.moveTo(a, b); xx.lineTo(c2, d); } xx.stroke();
    });
  }
  function exterior(x, cam, t) {
    const [hw, hh, th] = R().WIN, [wx, wy] = R().ROOM_W, Z1 = 3.9 + th;
    const frontPath = () => { x.beginPath(); for (const pts of [[[-3.2, 0, Z1], [3.8, 0, Z1], [3.8, 3.2, Z1], [-3.2, 3.2, Z1]], [[wx - hw, wy - hh, Z1], [wx - hw, wy + hh, Z1], [wx + hw, wy + hh, Z1], [wx + hw, wy - hh, Z1]]]) { const s = S3.clip(cam, pts); if (s.length < 3) return false; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); } return true; };
    if (cam.pos[2] > Z1 && frontPath()) {
      const q = cam.proj([wx, wy, Z1]); if (q) { const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], 3.2 * q[3]); g.addColorStop(0, '#6a2a2a'); g.addColorStop(1, '#2a1020'); x.fillStyle = g; } else x.fillStyle = '#2a1020';
      x.fill('evenodd');
      x.strokeStyle = '#d9a443'; x.lineWidth = Math.max(1, .03 * (q ? q[3] : 1)); x.beginPath(); S3.line(x, cam, [-3.2, 3.18, Z1], [3.8, 3.18, Z1]); x.stroke();
    }
    for (const [a, b, n, col] of [[[wx - hw, wy - hh], [wx + hw, wy - hh], [0, 1, 0], '#a0643a'], [[wx - hw, wy + hh], [wx + hw, wy + hh], [0, -1, 0], '#3a2418'], [[wx - hw, wy - hh], [wx - hw, wy + hh], [1, 0, 0], '#6e4228'], [[wx + hw, wy - hh], [wx + hw, wy + hh], [-1, 0, 0], '#6e4228']]) {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 3.9 + th / 2]; if (!S3.facing(cam, m, n)) continue;
      if (S3.poly(x, cam, [[a[0], a[1], 3.9], [b[0], b[1], 3.9], [b[0], b[1], Z1], [a[0], a[1], Z1]])) { x.fillStyle = col; x.fill(); }
    }
    const x0 = -3.7, x1 = 4.3, z0 = -.5, z1 = Z1 + .5, ya = 3.2, yb = 3.95, rA = [-1.2, yb, 2.03], rB = [1.8, yb, 2.03];
    for (const [pts, n] of [[[[x1, ya, z0], [x0, ya, z0], rA, rB], [0, .7, -.7]], [[[x0, ya, z0], [x0, ya, z1], rA], [-.7, .7, 0]], [[[x1, ya, z1], [x1, ya, z0], rB], [.7, .7, 0]], [[[x0, ya, z1], [x1, ya, z1], rB, rA], [0, .7, .7]]]) {
      if (!S3.facing(cam, pts[0], n) || !S3.poly(x, cam, pts)) continue;
      x.fillStyle = n[2] > 0 ? '#1e1226' : '#160e20'; x.fill();
    }
    const ea = smooth((cam.pos[2] - z1 - .3) / .3);
    if (cam.pos[2] > z1 && ea > 0) { x.save(); x.globalAlpha *= ea; x.strokeStyle = '#d9a443'; x.lineWidth = Math.max(1, .05 * ((cam.proj([0, ya, z1]) || [0, 0, 0, 1])[3])); x.beginPath(); S3.line(x, cam, [x0, ya, z1], [x1, ya, z1]); S3.line(x, cam, rA, rB); x.stroke(); x.restore(); }
  }
  const CHESTS = (() => {
    const o = [];
    for (let gx = -15; gx <= 15; gx++) for (let gz = -14; gz <= 16; gz++) {
      const i = (gx + 20) * 50 + gz + 20, x = AXX + gx * 2.3 + (hash(i, 1) - .5) * .5, z = AXZ + gz * 2.0 + (hash(i, 2) - .5) * .4, rho = Math.hypot(x - AXX, z - AXZ);
      if (rho < 6.6 || rho > 33 || hash(i, 3) < .3 || (Math.abs(x - AXX) < 2.6 && z > 3.2)) continue;
      const n = rho < 11 ? 1 + Math.floor(hash(i, 4) * 3) : 1 + Math.floor(hash(i, 5) * 1.8), turn = hash(i, 6) < .4;
      o.push({ x, z, rho, n, w: turn ? .42 : .64, d: turn ? .64 : .42, i });
    }
    return o;
  })();
  let GSP = null;
  const glintSprite = () => { if (GSP) return GSP; const [c, x] = F.canvas(128, 128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,74,42,1)'); g.addColorStop(1, 'rgba(255,74,42,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return (GSP = c); };
  const glintOf = (t, rho) => { const tw = T_UNLIM - .1 + (rho - 6.6) / 26.4 * 1.1; return .3 + .7 * bump(t, tw - .08, tw + .12, tw + .5, tw + 1.5) + .25 * ss(T_SUPPLY, DUR, t); };
  function chests(x, cam, t, near) {
    const list = CHESTS.filter(c => (c.z >= AXZ) === near).map(c => ({ c, d: cam.depth([c.x, GY, c.z]) })).filter(e => e.d > .6).sort((a, b) => b.d - a.d);
    const sparks = [];
    for (const { c, d } of list) {
      const q = cam.proj([c.x, GY + .4 * c.n, c.z]); if (!q || q[0] < -.2 * W || q[0] > 1.2 * W || q[1] < -.2 * H || q[1] > 1.3 * H) continue;
      const lt = [AXX - c.x, 3, AXZ - c.z], ll = Math.hypot(...lt), o = { col: '#2a1a1e', lo: .22, ink: '#06050e', light: lt.map(v => v / ll) };
      const yt = GY + (c.n - 1) * .74 + .71, g = glintOf(t, c.rho), px = 2 * c.w * q[3];
      if (px < 24) {
        const B = []; for (const X of [c.x - c.w, c.x + c.w]) for (const Y of [GY, yt]) for (const Z of [c.z - c.d, c.z + c.d]) { const p = cam.proj([X, Y, Z]); if (p) B.push(p); }
        if (B.length === 8) {
          const v = [cam.pos[0] - c.x, cam.pos[2] - c.z], n = Math.abs(v[0]) > Math.abs(v[1]) ? [Math.sign(v[0]), 0, 0] : [0, 0, Math.sign(v[1])];
          const hl = hull2(B); x.beginPath(); hl.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fillStyle = S3.shade(o.col, n, o.light, o); x.fill();
        }
      } else for (let k = 0; k < c.n; k++) S3.box(x, cam, { x0: c.x - c.w, x1: c.x + c.w, y0: GY + k * .74, y1: GY + k * .74 + .7, z0: c.z - c.d, z1: c.z + c.d }, o);
      const lid = [[c.x - c.w, yt, c.z - c.d], [c.x + c.w, yt, c.z - c.d], [c.x + c.w, yt + .9 * 2 * c.d, c.z - c.d - .42 * 2 * c.d], [c.x - c.w, yt + .9 * 2 * c.d, c.z - c.d - .42 * 2 * c.d]];
      if (px >= 5 && S3.poly(x, cam, lid)) { x.fillStyle = '#34201e'; x.fill(); if (px >= 30) { x.strokeStyle = '#06050e'; x.lineWidth = 1; x.stroke(); } }
      if (S3.poly(x, cam, [[c.x - c.w * .9, yt, c.z - c.d * .85], [c.x + c.w * .9, yt, c.z - c.d * .85], [c.x + c.w * .9, yt, c.z + c.d * .85], [c.x - c.w * .9, yt, c.z + c.d * .85]])) { x.fillStyle = S3.mix('#5a1410', '#c8301e', .6 * g); x.fill(); }
      const p = cam.proj([c.x, yt + .05, c.z]); if (p && g > .45) sparks.push([p[0], p[1], Math.max(2, .35 * p[3]), g]);
    }
    return sparks;
  }
  function ground(x, cam) {
    if (!S3.poly(x, cam, [[-45, GY, -45], [45, GY, -45], [45, GY, 45], [-45, GY, 45]])) return;
    const q = cam.proj([AXX, GY, AXZ]); if (q) { const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], 16 * q[3]); g.addColorStop(0, '#3a1e24'); g.addColorStop(.5, '#1a1022'); g.addColorStop(1, '#08071a'); x.fillStyle = g; } else x.fillStyle = '#08071a';
    x.fill();
  }

  const OUT_Z = 3.85;
  function frame(ctx, t, cam, ex = {}) {
    const out = cam.pos[2] > OUT_Z, AR = arcs(t), dn = drawn(t);
    const [whw, whh, wth] = R().WIN, [wcx, wcy] = R().ROOM_W, WZ1 = 3.9 + wth;
    const WP = cam.pos[2] > WZ1 + .05 ? [[wcx - whw, wcy - whh], [wcx + whw, wcy - whh], [wcx + whw, wcy + whh], [wcx - whw, wcy + whh]].map(([X, Y]) => cam.proj([X, Y, WZ1])) : null;
    const inWin = (x, fn) => {
      if (!WP || WP.some(q => !q)) return fn();
      const mx = WP.reduce((a, q) => a + q[0], 0) / 4, my = WP.reduce((a, q) => a + q[1], 0) / 4;
      x.save(); x.beginPath(); WP.forEach((q, i) => { const dx = q[0] - mx, dy = q[1] - my, l = Math.hypot(dx, dy) || 1, X = q[0] + dx / l * 30, Y = q[1] + dy / l * 30; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.clip();
      fn(); x.restore();
    };
    WBOX = null;
    if (WP && !WP.some(q => !q)) {
      const xs = WP.map(q => q[0]), ys = WP.map(q => q[1]), x0 = Math.max(0, Math.floor(Math.min(...xs) - 60)), y0 = Math.max(0, Math.floor(Math.min(...ys) - 60));
      const x1 = Math.min(W, Math.ceil(Math.max(...xs) + 60)), y1 = Math.min(H, Math.ceil(Math.max(...ys) + 60));
      if (x1 > x0 && y1 > y0) WBOX = [x0, y0, x1 - x0, y1 - y0];
    }
    LB.background(ctx);
    if (out) LB.sheet(ctx, ID, 1, RC, x => { ground(x, cam); chests(x, cam, t, false); stand(x, cam); gourdIn(x, cam); platform(x, cam); }, { rim: false, shadow: false, fibre: .25 });
    const roomBack = x => { shell(x, cam, t); R().wall(x, cam, t); if (cam.pos[2] < 3.9 + R().WIN[2]) R().floor(x, cam, t); shadows(x, cam, t); };
    const roomFront = x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; tableLegs(x, cam, true); him(x, cam, t); tableLegs(x, cam, false); tableTop(x, cam); R().clock(x, cam, clockT(t)); cup(x, cam, t); R().lamp(x, cam); };
    const FRONT = { rimColor: '#ffc27a', rimShift: [1, .25], rimAlpha: .5, glow: .12, glowColor: '#ffae4a', glowBlur: 10 };
    if (WP) LB.sheet(ctx, ID, 1, RC, x => inWin(x, () => { roomBack(x); roomFront(x); }), FRONT);
    else { LB.sheet(ctx, ID, 1, RC, x => inWin(x, () => roomBack(x)), { rim: false, shadow: false, fibre: .3 }); LB.sheet(ctx, ID, 1, RC, x => inWin(x, () => roomFront(x)), FRONT); }
    const sh = F.SHIFT || { x: 0, y: 0 };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    mood(ctx, cam, t); flame(ctx, cam, t); drops(ctx, cam, t);
    const cq = cam.proj([CUP[0], CUP[1] + .07, CUP[2]]), ca = Math.max(bump(t, T_MED - .15, T_MED + .1, T_MED + .5, T_MED + 1.1), bump(t, T_STRONG - .1, T_DOSE, T_DOSE + .6, T_DOSE + 1.4));
    if (cq && ca > 0) PR.glow(ctx, cq[0], cq[1], .18 * cq[3], '#eef4ff', .55 * ca, 'flat');
    AR.forEach((A, j) => { if (dn[j] > 0) arrow(ctx, cam, A, dn[j], 1); });
    beads(ctx, cam, t, AR); words(ctx, cam, t, AR);
    ctx.restore();
    if (out) {
      let sparks = [];
      LB.sheet(ctx, ID, 1, RC, x => { x.lineJoin = 'miter'; exterior(x, cam, t); gourdOut(x, cam, t); stopper(x, cam, t); sparks = chests(x, cam, t, true); },
        { rimColor: '#ffb466', rimShift: [0, -1], rimAlpha: .45, glow: .18, glowColor: '#ff9a4a', glowBlur: 14, fibre: .25 });
      ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
      const [wx, wy] = R().ROOM_W, wq = cam.proj([wx, wy, 3.9 + R().WIN[2]]); if (wq && cam.pos[2] > 4.3) PR.glow(ctx, wq[0], wq[1], 1.3 * wq[3], '#ffb466', .3 * smooth((cam.pos[2] - 4.3) / .3), 'flat');
      const sq = cam.proj([AXX, 11.0, AXZ + .9]), sk = sealK(t); if (sq && sk > 0) PR.glow(ctx, sq[0], sq[1], 1.4 * sq[3], '#ff5a3a', .55 * sk, 'flat');
      const GS = glintSprite();
      for (const [px, py, r, g] of sparks) { ctx.globalAlpha = Math.min(1, .5 * (g - .3)); ctx.drawImage(GS, px - r, py - r, 2 * r, 2 * r); }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    if (t < 1) { ctx.save(); ctx.globalAlpha = 1 - ss(.65, .95, t); A22().tags(ctx, D22() + t); ctx.restore(); }
    if (!ex.noGrade) LB.grade(ctx, T0() + t);
  }
  function draw(ctx, t) {
    if (t <= 0) return S22().draw(ctx, D22());
    if (t >= XF) return frame(ctx, t, camAt(t));
    frame(ctx, t, camAt(t), { noGrade: true });
    const [cv, x] = buf(); clean(x); A22().frameAt(x, D22() + t, { noTags: true, noGrade: true });
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - ss(0, XF, t); ctx.drawImage(cv, 0, 0); ctx.restore();
    ctx.save(); A22().tags(ctx, D22() + t); ctx.restore();
    LB.grade(ctx, T0() + t);
  }

  F.scene('seq-23', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .1, type: 'crackle', dur: 3, rate: 6, g: .03 },
      ...(D => Array.from({ length: 60 }, (_, i) => D.t0 + i * D.every + D.hang + D.fall - clockT(0)).filter((tt, i) => i % 2 === 0 && tt > .8 && tt < T_NO))(A14().drips()).map(tt => ({ t: tt, type: 'drip', g: .045, noSnap: true })),
      { t: T_MED, type: 'shimmer', g: .06 },
      { t: T_MORE, type: 'riser', dur: .9, g: .06 }, { t: T_FEAR2 + .1, type: 'rumble', dur: 1.2, g: .08 },
      { t: T_ERR, type: 'crackle', dur: .6, rate: 30, g: .06 },
      { t: T_SECR, type: 'exhale', dur: .8, g: .05 },
      { t: T_ENR, type: 'swoosh', dur: .7, g: .08 }, { t: T_ENR + .05, type: 'rumble', dur: 1.0, g: .1 },
      ...WORDS.map((_, i) => ({ t: T_SYMP + i * .12, type: 'tick', g: .06 })),
      { t: T_ALCH, type: 'cloth', g: .03 },
      { t: T_PROOF, type: 'shimmer', g: .05 },
      { t: T_DOSE - .1, type: 'clink', f: 2200, g: .06 },
      { t: T_FEED, type: 'riser', dur: 1.8, g: .05 },
      { t: T_NO + .2, type: 'whoosh', f0: 160, f1: 60, dur: 1.4, g: .07 },
      { t: T_SEAL + .2, type: 'clunk', g: .12 },
      ...Array.from({ length: 6 }, (_, i) => ({ t: T_UNLIM + i * .18, type: 'thud', g: .05 - i * .006 })),
    ],
    api: { DUR, camAt },
  });
})();
