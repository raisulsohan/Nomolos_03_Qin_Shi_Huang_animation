(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, QM = F.qinmap, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-22'), DUR = C.duration;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const S21 = () => F.getScene('seq-21'), A21 = () => S21().api, D21 = () => A21().DUR;
  const T0 = () => A21().T0() + D21();
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };

  const T_SLOW = 0.84, T_POIS = 1.18;
  const T_KID = 2.74, T_LUNG = 3.64, T_ABOVE = 4.67, T_BRAIN = 5.4;
  const T_CURSE = 7.7, T_THIS = 9.35, T_MAN = 9.6;
  const T_TREM = 10.26, T_INS = 10.97, T_MEM = 12.13, T_CREEP = 13.51, T_PARA = 14;
  const T_X = 1.0;

  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const D = A21().lean(D21()).D, o = D.chartAt(0, 0), Hh = D.CHART.y1 - D.CHART.y0, Wd = D.CHART.w;
    return (GEO = { o, Hh, Wd });
  }
  const OUT = (() => {
    const r = [[0, .838], [.014, .835], [.025, .826], [.031, .812], [.033, .797], [.0355, .794], [.037, .786], [.0355, .777], [.032, .775], [.029, .766],
      [.023, .757], [.013, .751], [.0135, .743], [.015, .732], [.022, .724], [.045, .716], [.066, .709], [.083, .699], [.093, .68], [.098, .64], [.103, .56],
      [.11, .47], [.113, .418], [.106, .405], [.097, .41], [.094, .47], [.086, .55], [.079, .61], [.071, .615], [.069, .52], [.07, .44], [.071, .37],
      [.064, .22], [.059, .085], [.062, .068], [.054, .062], [.032, .062], [.028, .08], [.026, .2], [.019, .33], [0, .385]];
    return r.concat(r.slice(1, -1).reverse().map(([X, Y]) => [-X, Y]));
  })();
  const P = (X, Y, Z = 0) => { const o = geo().o; return [o[0] + X, o[1] + Y, o[2] + Z]; };
  const ORG = {
    lungL: [-.03, .645, .023, .049, .12, .07, '#ffb49a', '#c4503c'], lungR: [.03, .645, .023, .049, -.12, .07, '#ffb49a', '#c4503c'],
    heart: [-.006, .614, .013, .014, .3, .045, '#ff7a56', '#b03a2a'],
    stomach: [.017, .577, .025, .016, -.45, .04, '#ffc66a', '#c27a2c'],
    kidL: [-.03, .528, .009, .016, .25, .09, '#ff8a5a', '#a43c24'], kidR: [.03, .528, .009, .016, -.25, .09, '#ff8a5a', '#a43c24'],
    brain: [0, .81, .026, .019, 0, .03, '#ffe2b0', '#e0904c'],
  };
  const EYE = [.0125, .787];
  const GULLET = [[0, .738], [0, .7], [.003, .655], [.01, .615], [.016, .582]];
  const THREADS = {
    kidL: [[.012, .574], [-.006, .556], [-.024, .538]], kidR: [[.02, .572], [.03, .553], [.03, .54]],
    lungL: [[.01, .59], [-.004, .615], [-.024, .64]], lungR: [[.016, .592], [.022, .615], [.028, .64]],
    brain: [[0, .62], [0, .68], [0, .738], [0, .772], [0, .796]],
  };
  const darkOf = (k, t) => k === 'kidL' || k === 'kidR' ? ss(T_KID - .05, T_KID + .55, t) : k === 'lungL' || k === 'lungR' ? ss(T_LUNG - .05, T_LUNG + .55, t)
    : k === 'brain' ? .9 * ss(T_BRAIN - .05, T_BRAIN + .9, t) : k === 'stomach' ? .4 * ss(T_POIS + .4, T_POIS + 1.2, t) + .3 * ss(T_BRAIN, T_BRAIN + 1, t)
    : k === 'heart' ? .75 * ss(T_LUNG, T_LUNG + .8, t) : 0;
  const threadK = (k, t) => k === 'kidL' || k === 'kidR' ? ss(T_KID - .55, T_KID, t) : k === 'lungL' || k === 'lungR' ? ss(T_LUNG - .5, T_LUNG, t) : k === 'brain' ? ss(T_ABOVE - .1, T_BRAIN, t) : 0;
  const threadA = (k, t) => .9 * (1 - ss((k === 'brain' ? T_BRAIN : k[0] === 'k' ? T_KID : T_LUNG) + .7, (k === 'brain' ? T_BRAIN : k[0] === 'k' ? T_KID : T_LUNG) + 1.6, t));
  const sheenOf = t => 1 - ss(.15, .8, t);
  const dropR = t => .0055 * ss(.25, .75, t) * (1 - .6 * ss(T_POIS + .5, T_POIS + .9, t));
  const dropU = t => ss(T_SLOW, T_POIS + .62, t);

  const FHA = M45 ? 1.02 : .95;
  let PA = null;
  function pa() {
    if (PA) return PA;
    const L = A21().lean(D21()), cam = L.cam, c = P(0, .6), q = cam.proj(c), zE = H * cam.depth(c) / (FHA * cam.f), zL = A21().lean(D21() + .4).zz;
    return (PA = { chest: [q[0], q[1]], zE, zL });
  }
  function equiv(t) {
    const L = A21().lean(D21() + t), { chest, zE, zL } = pa(), u = clamp(t / T_X), a = u * u;
    const zz = L.zz * Math.pow(zE / zL, a), q = [lerp(L.mx, chest[0], a), lerp(L.my, chest[1], a)], s = [lerp(L.mx, W / 2, a), lerp(L.my, H / 2, a)];
    const A = [s[0] - zz * q[0], s[1] - zz * q[1]], c = L.cam;
    const cam = S3.camera({ pos: c.pos, yaw: c.yaw, pitch: c.pitch, f: c.f * zz, cx: A[0] + zz * c.cx, cy: A[1] + zz * c.cy, W, H, near: .02 });
    return { cam, CZ: { x: (W / 2 - A[0]) / zz, y: (H / 2 - A[1]) / zz, z: zz } };
  }
  const FH = M45 ? 1.28 : 1;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const fromEq = tt => { const c = equiv(tt).cam, d = c.depth(P(0, .6)); return [tt, c.pos, c.pos.map((v, i) => v + c.fwd[i] * d), Math.log(c.f), c.cx, c.cy]; };
    const key = (tt, e, a, fh) => { const E = P(e[0], e[1], -e[2]); return [tt, E, P(a[0], a[1]), Math.log(H * e[2] / (fh * FH)), W / 2, H / 2]; };
    const K = [fromEq(T_X - .2), fromEq(T_X - .1), fromEq(T_X),
      key(2.05, [.02, .6, 2.45], [.01, .585], .64),
      key(T_KID + .2, [-.06, .56, 1.8], [0, .556], .46),
      key(T_LUNG + .25, [-.03, .66, 1.55], [0, .642], .42),
      key(T_BRAIN + .3, [.06, .8, 1.28], [0, .79], .36),
      key(T_THIS, [.03, .8, 1.12], [0, .789], .34),
      key(T_MEM, [-.05, .79, 1.02], [0, .789], .325),
      key(T_PARA + .2, [-.02, .79, .9], [EYE[0] * .6, .789], .27),
      key(DUR, [EYE[0], EYE[1], .46], EYE, .06),
      key(DUR + .7, [EYE[0], EYE[1], .3], EYE, .02)];
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => k[3]), cx: mk(k => k[4]), cy: mk(k => k[5]) });
  }
  function camAt(t) {
    if (t <= T_X) return equiv(t).cam;
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: Math.exp(S.f(t)), cx: S.cx(t), cy: S.cy(t), W, H, near: .02 });
  }
  const INK = '#07061a', LAT = .5;
  function backlight(x, cam, t) {
    x.fillStyle = '#0b0a22'; x.fillRect(0, 0, W, H);
    const c = cam.proj(P(0, .64, LAT + .3)); if (!c) return;
    const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], 1.15 * c[3]);
    g.addColorStop(0, '#ffe2ae'); g.addColorStop(.22, '#f4ae6a'); g.addColorStop(.5, '#9c4e4c'); g.addColorStop(.8, '#2a1840'); g.addColorStop(1, '#0b0a22');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.strokeStyle = 'rgba(26,14,40,.4)'; x.filter = 'blur(2.5px)';
    const k = (cam.proj(P(0, .6, LAT)) || [0, 0, 0, 1])[3]; x.lineWidth = Math.max(1, .007 * k); x.beginPath();
    for (let X = -1.26; X <= 1.2601; X += .18) S3.line(x, cam, P(X, -.3, LAT), P(X, 1.5, LAT));
    for (let Y = -.3; Y <= 1.5001; Y += .18) S3.line(x, cam, P(-1.26, Y, LAT), P(1.26, Y, LAT));
    x.stroke(); x.restore();
  }

  function shakeOf(t) {
    const a = bump(t, T_TREM - .05, T_TREM + .08, T_TREM + .9, T_TREM + 1.5); if (a <= 0) return [0, 0];
    const k = Math.floor(t * 15); return [(hash(k, 1) - .5) * 15 * a, (hash(k, 2) - .5) * 5 * a];
  }
  function bodyPath(xx) { xx.beginPath(); OUT.forEach(([X, Y], i) => i ? xx.lineTo(X, Y) : xx.moveTo(X, Y)); xx.closePath(); }
  const on = (x, cam, Z, fn) => S3.onPlane(x, cam, P(0, 0, Z), [1, 0, 0], [0, 1, 0], fn);
  const along = (pts, u) => {
    const L = []; let s = 0; for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(s); }
    const d = clamp(u) * s, out = [pts[0]]; let i = 0;
    while (i < L.length && L[i] <= d) out.push(pts[++i]);
    if (i < L.length) { const a = i ? L[i - 1] : 0, f = (d - a) / (L[i] - a); out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); }
    return out;
  };
  const SILV = '#dfe6f0';
  function organ(xx, key, t) {
    const [X, Y, rx, ry, rot, , lit, edge] = ORG[key], dk = darkOf(key, t);
    const g = xx.createRadialGradient(X - rx * .25, Y + ry * .3, 0, X, Y, Math.max(rx, ry) * 1.1);
    g.addColorStop(0, S3.mix(lit, '#2a2734', dk)); g.addColorStop(1, S3.mix(edge, '#16141e', dk));
    xx.fillStyle = g; xx.beginPath(); xx.ellipse(X, Y, rx, ry, rot, 0, TAU); xx.fill();
    if (key === 'brain') {
      xx.strokeStyle = `rgba(120,52,30,${.45 * (1 - dk)})`; xx.lineWidth = .0012; xx.beginPath();
      for (const [a, b, c] of [[-.018, .81, .006], [-.006, .816, -.005], [.008, .812, .006], [-.012, .798, -.004], [.012, .8, .005]]) { xx.moveTo(a, b); xx.quadraticCurveTo(a + .006, b + c, a + .013, b); }
      xx.stroke();
    }
    if (dk > .02) {
      xx.save(); xx.beginPath(); xx.ellipse(X, Y, rx, ry, rot, 0, TAU); xx.clip();
      xx.fillStyle = SILV;
      for (let i = 0; i < 7; i++) { if (hash(i, key.length) > dk * 1.2) continue; xx.globalAlpha = .7 * dk; xx.beginPath(); xx.arc(X + (hash(i, 3) - .5) * 1.5 * rx, Y + (hash(i, 4) - .5) * 1.5 * ry, .0011 + .001 * hash(i, 5), 0, TAU); xx.fill(); }
      xx.restore();
    }
  }
  function silverLine(xx, pts, wd, a = 1) {
    if (pts.length < 2) return;
    xx.save(); xx.globalAlpha = a; xx.lineCap = 'round'; xx.lineJoin = 'round';
    xx.strokeStyle = '#6c7482'; xx.lineWidth = wd * 1.8; xx.beginPath(); pts.forEach((p, i) => i ? xx.lineTo(p[0], p[1]) : xx.moveTo(p[0], p[1])); xx.stroke();
    xx.strokeStyle = SILV; xx.lineWidth = wd; xx.stroke(); xx.restore();
  }
  function crown(xx, t) {
    xx.fillStyle = INK;
    xx.fillRect(-.012, .831, .024, .017);
    xx.beginPath(); xx.moveTo(-.074, .846); xx.lineTo(.074, .846); xx.lineTo(.071, .853); xx.lineTo(-.071, .853); xx.closePath(); xx.fill();
    for (let i = 0; i < 8; i++) {
      const X = -.063 + i * .018, sw = .0009 * Math.sin(t * 1.7 + i);
      xx.strokeStyle = 'rgba(7,6,26,.8)'; xx.lineWidth = .0008; xx.beginPath(); xx.moveTo(X, .846); xx.lineTo(X + sw, .796); xx.stroke();
      for (let j = 0; j < 5; j++) {
        const v = j / 4, bx = X + sw * v, by = .841 - j * .0113;
        xx.fillStyle = '#7a6650'; xx.beginPath(); xx.arc(bx, by, .0031, 0, TAU); xx.fill();
        xx.fillStyle = 'rgba(255,214,150,.55)'; xx.beginPath(); xx.arc(bx - .0009, by + .001, .0011, 0, TAU); xx.fill();
      }
    }
  }
  const eyeOpen = t => ss(T_INS - .05, T_INS + .3, t);
  function eyes(xx, t) {
    const o = eyeOpen(t); if (o <= 0) return;
    for (const s of [-1, 1]) {
      const X = s * EYE[0], Y = EYE[1], hw = .0064, hh = .0024 * o;
      xx.fillStyle = '#fff2d8'; xx.beginPath(); xx.moveTo(X - hw, Y); xx.quadraticCurveTo(X, Y + 2 * hh, X + hw, Y); xx.quadraticCurveTo(X, Y - 2 * hh, X - hw, Y); xx.fill();
      xx.fillStyle = INK; xx.beginPath(); xx.arc(X, Y, .0014 * o, 0, TAU); xx.fill();
    }
  }
  function body(x, cam, t) {
    const [sx, sy] = shakeOf(t); x.translate(sx, sy);
    const g = geo();
    on(x, cam, 0, xx => { bodyPath(xx); xx.fillStyle = '#100d24'; xx.fill('nonzero'); });
    x.save();
    on(x, cam, 0, xx => { bodyPath(xx); }); x.clip('nonzero');
    const cc = cam.proj(P(0, .6, .2)); if (cc) { const gl = x.createRadialGradient(cc[0], cc[1], 0, cc[0], cc[1], .35 * cc[3]); gl.addColorStop(0, 'rgba(255,170,100,.16)'); gl.addColorStop(1, 'rgba(255,170,100,0)'); x.fillStyle = gl; x.fillRect(0, 0, W, H); }
    const keys = Object.keys(ORG).sort((a, b) => ORG[b][5] - ORG[a][5]);
    for (const k of keys) on(x, cam, ORG[k][5], xx => organ(xx, k, t));
    on(x, cam, .02, xx => {
      const sh = sheenOf(t);
      if (sh > 0) {
        const lo = lerp(-.02, .728, 1 - sh), hi = lerp(.86, .748, 1 - sh);
        const sg = xx.createLinearGradient(-.12, 0, .12, 0); sg.addColorStop(0, '#7a8292'); sg.addColorStop(.45, '#e6ebf2'); sg.addColorStop(.55, '#ffffff'); sg.addColorStop(1, '#8a92a0');
        xx.save(); xx.globalAlpha = Math.min(1, 1.6 * sh); xx.fillStyle = sg; xx.fillRect(-.2, lo, .4, hi - lo); xx.restore();
      }
      const u = dropU(t), path = along(GULLET, u);
      if (u > 0) silverLine(xx, path, .0013, .55 * (1 - ss(T_POIS + .6, T_KID, t)));
      for (const k of Object.keys(THREADS)) { const kk = threadK(k, t); if (kk > 0) silverLine(xx, along(THREADS[k], kk), .0011, threadA(k, t)); }
      const r = dropR(t);
      if (r > 0) {
        const p = path[path.length - 1], dg = xx.createRadialGradient(p[0] - r * .35, p[1] + r * .4, 0, p[0], p[1], r * 1.1);
        dg.addColorStop(0, '#ffffff'); dg.addColorStop(.4, '#e2e8f0'); dg.addColorStop(1, '#6d7686');
        xx.fillStyle = dg; xx.beginPath(); xx.ellipse(p[0], p[1], r, r * (1 + .5 * ss(T_SLOW, T_SLOW + .3, t) * (1 - ss(T_POIS + .4, T_POIS + .62, t))), 0, 0, TAU); xx.fill();
      }
    });
    x.restore();
    on(x, cam, -.002, xx => { eyes(xx, t); });
    on(x, cam, -.004, xx => { crown(xx, t); });
    on(x, cam, 0, xx => { bodyPath(xx); xx.strokeStyle = INK; xx.lineWidth = .0016; xx.lineJoin = 'round'; xx.stroke(); });
  }
  const ring = t => { const k = ss(T_THIS - .05, T_MAN + .45, t); return [lerp(.096, .074, k), lerp(.108, .086, k)]; };
  const N_GLYPH = 30, T_RING0 = T_CURSE - .15, T_RING1 = T_THIS - .1;
  function curse(ctx, cam, t) {
    if (t < T_RING0) return;
    const [rx, ry] = ring(t), rot = .045 * (t - T_RING0), fade = 1 - .55 * ss(T_CREEP - .2, T_PARA + .4, t);
    const draw = (xx, lw, col) => {
      xx.strokeStyle = col; xx.lineWidth = lw; xx.lineCap = 'round'; xx.beginPath();
      for (let i = 0; i < N_GLYPH; i++) {
        const a0 = T_RING0 + i * (T_RING1 - T_RING0) / N_GLYPH, k = clamp((t - a0) / .12); if (k <= 0) continue;
        const th = i / N_GLYPH * TAU - Math.PI / 2 + rot, gx = Math.cos(th) * rx, gy = .795 + Math.sin(th) * ry, s = .006;
        const n = 4 + Math.floor(hash(i, 9) * 3), m = Math.ceil(k * n);
        for (let j = 0; j < m; j++) {
          const h = q => hash(i * 7 + j, q) - .5, f = Math.min(1, j < m - 1 ? 1 : (k * n - j)), kind = hash(i * 7 + j, 5);
          const ax = gx + h(1) * 1.6 * s, ay = gy + h(2) * 1.6 * s, len = s * (.6 + .8 * Math.abs(h(3)));
          const [dx, dy] = kind < .45 ? [len, 0] : kind < .85 ? [0, -len] : [len * .6, -len * .6];
          const x0 = Math.min(Math.max(ax, gx - s), gx + s - dx), y0 = Math.min(Math.max(ay, gy - s - dy), gy + s);
          xx.moveTo(x0, y0); xx.lineTo(x0 + dx * f, y0 + dy * f);
        }
      }
      xx.stroke();
    };
    ctx.save(); ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(4px)'; on(ctx, cam, -.035, xx => draw(xx, .0032, 'rgba(255,190,110,.45)'));
    ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; on(ctx, cam, -.035, xx => draw(xx, .0012, '#ffe6b8'));
    ctx.restore();
  }
  const EMB = Array.from({ length: 9 }, (_, i) => [(hash(i, 21) - .5) * .036, .806 + (hash(i, 22) - .5) * .03, T_MEM + .02 + i * .09, (hash(i, 23) - .5) * 2]);
  function embers(ctx, cam, t) {
    const on0 = ss(T_BRAIN + .35, T_BRAIN + .8, t); if (on0 <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    EMB.forEach(([X, Y, td, dx], i) => {
      const a = Math.max(0, t - td), gone = ss(td, td + 1.1, t); if (gone >= 1) return;
      const sh = shakeOf(t), q = cam.proj(P(X + dx * .025 * a, Y + .045 * a * a + .02 * a, -.01)); if (!q) return;
      const fl = .75 + .25 * Math.sin(t * (9 + i) + i * 2.1);
      PR.glow(ctx, q[0] + sh[0], q[1] + sh[1], Math.max(3, .0045 * q[3]), '#ffb860', .8 * on0 * fl * (1 - gone), 'flat');
    });
    ctx.restore();
  }
  function glows(ctx, cam, t) {
    const sh = shakeOf(t);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const k of Object.keys(ORG)) {
      const [X, Y, rx, ry, , Z, lit] = ORG[k], a = .3 * (1 - darkOf(k, t)) * (1 - ss(T_CREEP - .2, T_PARA + .5, t)), q = cam.proj(P(X, Y, Z)); if (!q || a <= .01) continue;
      PR.glow(ctx, q[0] + sh[0], q[1] + sh[1], 2.2 * Math.max(rx, ry) * q[3], lit, a, 'flat');
    }
    const r = dropR(t); if (r > 0) { const p = along(GULLET, dropU(t)).pop(), q = cam.proj(P(p[0], p[1], .02)); if (q) PR.glow(ctx, q[0], q[1], .016 * q[3], '#e8f0ff', .5, 'flat'); }
    const o = eyeOpen(t);
    if (o > 0) for (const s of [-1, 1]) { const q = cam.proj(P(s * EYE[0], EYE[1], -.002)); if (q) PR.glow(ctx, q[0] + sh[0], q[1] + sh[1], .012 * q[3], '#ffe8c0', .45 * o, 'flat'); }
    ctx.restore();
  }
  function marks(ctx, cam, t) {
    const a = bump(t, T_TREM - .02, T_TREM + .1, T_TREM + 1.0, T_TREM + 1.4); if (a <= 0) return;
    const c = cam.proj(P(0, .79)); if (!c) return;
    const hw = .04 * c[3];
    ctx.save(); ctx.strokeStyle = '#ffe6b8'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, hw * .06);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const ph = ((t - T_TREM) * 2.2 + i / 3) % 1, r = hw * (1.25 + .9 * ph);
      ctx.globalAlpha = a * (1 - ph) * .9; ctx.beginPath(); ctx.arc(c[0], c[1], r, s > 0 ? -.55 : Math.PI - .55, s > 0 ? .55 : Math.PI + .55); ctx.stroke();
    }
    ctx.restore();
  }
  const MOTES = Array.from({ length: 34 }, (_, i) => [(hash(i, 31) - .5) * .9, .25 + hash(i, 32) * .8, -.15 - hash(i, 33) * 1.15, hash(i, 34)]);
  function motes(ctx, cam, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const dim = 1 - ss(T_CREEP - .2, T_PARA + .3, t);
    MOTES.forEach(([X, Y, Z, h], i) => {
      const p = P(X + .015 * Math.sin(t * .3 + i), Y + .01 * Math.sin(t * .23 + 2 * i) + .006 * t, Z), d = cam.depth(p); if (d < .06 || d > 6) return;
      const q = cam.proj(p); if (!q || q[0] < -60 || q[0] > W + 60 || q[1] < -60 || q[1] > H + 60) return;
      const a = (.18 + .25 * h) * ss(.06, .25, d) * dim; if (a < .01) return;
      PR.glow(ctx, q[0], q[1], Math.max(2, (.0016 + .0016 * h) * q[3]), '#ffd9a0', a, 'flat');
    });
    ctx.restore();
  }
  const darkR = t => { const R = Math.hypot(W, H) * .62; return R * lerp(1, .2, ss(T_CREEP - .3, T_PARA + .6, t)) * lerp(1, .3, ss(T_PARA + .6, DUR, t)); };
  const WATCH = Array.from({ length: 8 }, (_, i) => [i / 8 * TAU + .35 + (hash(i, 41) - .5) * .5, .62 + .28 * hash(i, 42), T_PARA - .1 + i * .09]);
  function dark(ctx, cam, t) {
    const da = ss(T_CREEP - .35, T_CREEP + .15, t); if (da <= 0) return;
    const q = cam.proj(P(EYE[0], EYE[1], -.002)), c = q ? [q[0], q[1]] : [W / 2, H / 2], R = darkR(t), N = 90;
    ctx.save(); ctx.globalAlpha = da; ctx.filter = 'blur(14px)'; ctx.fillStyle = '#03030c'; ctx.beginPath(); ctx.rect(-80, -80, W + 160, H + 160);
    for (let i = 0; i <= N; i++) {
      const th = i / N * TAU, r = R * (1 + .15 * (Math.sin(5 * th + 1.3 * t) * .5 + Math.sin(9 * th - 2.1 * t) * .3 + Math.sin(13 * th + .7 * t) * .2));
      i ? ctx.lineTo(c[0] + r * Math.cos(th), c[1] + r * Math.sin(th)) : ctx.moveTo(c[0] + r, c[1]);
    }
    ctx.fill('evenodd'); ctx.filter = 'none';
    const Rf = Math.hypot(W, H) * .5;
    WATCH.forEach(([th, rr, t0], i) => {
      const o = ss(t0, t0 + .15, t) * (1 - ss(DUR - .45 + i * .02, DUR - .25 + i * .02, t)); if (o <= 0) return;
      const ex = W / 2 + Math.cos(th) * rr * Rf * (M45 ? .8 : 1), ey = H / 2 + Math.sin(th) * rr * Rf * (M45 ? 1.05 : .8);
      if (Math.hypot(ex - c[0], ey - c[1]) < R * 1.1) return;
      const s = Math.min(W, H) * .026, lk = [(c[0] - ex), (c[1] - ey)], ll = Math.hypot(...lk) || 1;
      for (const e of [-1, 1]) {
        const x0 = ex + e * s * 1.5;
        ctx.globalAlpha = .85 * o; ctx.fillStyle = '#d6daf0'; ctx.beginPath(); ctx.moveTo(x0 - s, ey); ctx.quadraticCurveTo(x0, ey + s * .8 * o, x0 + s, ey); ctx.quadraticCurveTo(x0, ey - s * .8 * o, x0 - s, ey); ctx.fill();
        ctx.fillStyle = '#05050f'; ctx.beginPath(); ctx.arc(x0 + lk[0] / ll * s * .4, ey + lk[1] / ll * s * .15, s * .32 * o, 0, TAU); ctx.fill();
      }
    });
    ctx.restore();
  }
  function eyeLight(cam, t) {
    const q = cam.proj(P(EYE[0], EYE[1], -.002)); if (!q) return null;
    return { x: q[0], y: q[1], r: Math.min(.0105 * q[3], H * .16) * (1 + .6 * ss(DUR - .7, DUR + .5, t)), a: ss(T_PARA, DUR - .2, t) };
  }
  function light(ctx, cam, t) {
    const L = eyeLight(cam, t); if (!L || L.a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    PR.glow(ctx, L.x, L.y, L.r * 2.4, '#ffae4a', .35 * L.a, 'flat'); PR.glow(ctx, L.x, L.y, L.r, '#fff0cc', .7 * L.a, 'flat');
    ctx.restore();
  }
  const WORDS = [['TREMORS', T_TREM, -1, -1], ['INSOMNIA', T_INS, 1, -1], ['MEMORY LOSS', T_MEM, -1, 1], ['PARANOIA', T_PARA, 1, 1]];
  let KREF = null;
  function tags(ctx, t, only, tt = t) {
    if (tt < T_TREM - .1) return;
    if (!KREF) { const c = camAt(T_TREM), q = c.proj(P(0, .79)); KREF = [q[3], q[0], q[1]]; }
    const k = KREF[0], size = M45 ? 44 : 50, bh = size * .74 + size * .52;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [txt, tw, sx, sy] of WORDS) {
      if (only && txt !== only) continue;
      const a = ss(tw - .05, tw + .18, tt) * (txt === 'PARANOIA' ? 1 : 1 - ss(DUR - .75, DUR - .35, tt)); if (a <= 0) continue;
      const x0 = W / 2 + sx * (M45 ? .068 : .14) * k, y0 = H / 2 + sy * (M45 ? .118 : .05) * k + (M45 ? 0 : (sy > 0 ? .012 : -.012) * k);
      QM.tag(ctx, clamp(x0, W * .2, W * .8), y0 + bh / 2, txt, { alpha: a, size, stem: 0, lift: 8 * (1 - ss(tw - .05, tw + .25, tt)), card: '#f5ecd8', accent: '#9aa2ae' });
    }
    ctx.restore();
  }

  function frame(ctx, t, cam, ex = {}) {
    LB.background(ctx);
    LB.sheet(ctx, ID, 1, RC, x => backlight(x, cam, t), { rim: false, shadow: false, fibre: 0 });
    LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; body(x, cam, t); }, { rimColor: '#ffc27a', rimAlpha: .55, rimShift: [0, -1], glow: .3, glowColor: '#ffae4a', glowBlur: 14, fibre: .25 });
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    glows(ctx, cam, t); embers(ctx, cam, t); curse(ctx, cam, t); marks(ctx, cam, t); motes(ctx, cam, t);
    dark(ctx, cam, t); light(ctx, cam, t);
    ctx.restore();
    if (!ex.noTags) tags(ctx, t);
    if (!ex.noGrade) LB.grade(ctx, T0() + t);
  }
  const SOFT = () => H * .14;
  function draw(ctx, t) {
    if (t <= 0) return S21().draw(ctx, D21());
    if (t >= T_X) return frame(ctx, t, camAt(t));
    const E = equiv(t);
    A21().card(ctx, D21() + t, { CZ: E.CZ });
    const c = E.cam.proj(P(0, .6)), k = ss(.1, .95, t); if (!c || k <= 0) return;
    const Rf = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([a, b]) => Math.hypot(a - c[0], b - c[1]))) + SOFT(), r = Math.pow(k, 1.35) * Rf;
    const [cv, x] = buf(); clean(x); frame(x, t, E.cam);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in';
    const m = x.createRadialGradient(c[0], c[1], Math.max(0, r - SOFT()), c[0], c[1], r + .5); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = m; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cv, 0, 0);
    const ea = .5 * (1 - ss(.6, .95, t)), r0 = Math.max(0, r - SOFT() * .9), r1 = r + SOFT() * .2;
    if (ea > 0) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(c[0], c[1], r0, c[0], c[1], r1); g.addColorStop(0, 'rgba(255,170,90,0)'); g.addColorStop(.7, `rgba(255,190,110,${ea})`); g.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  F.scene('seq-22', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .1, type: 'riser', dur: .9, g: .05 },
      { t: .55, type: 'clink', g: .05, noSnap: true },
      { t: T_SLOW, type: 'slide', dur: 1.0, g: .035 },
      { t: T_KID, type: 'thud', g: .12 }, { t: T_LUNG, type: 'thud', g: .12 },
      { t: T_BRAIN, type: 'thud', g: .18 }, { t: T_BRAIN + .1, type: 'exhale', g: .05 },
      { t: T_CURSE, type: 'quill', dur: 1.4, g: .06 },
      { t: T_MAN, type: 'tick', g: .06 },
      ...WORDS.map(([, tw]) => ({ t: tw, type: 'tick', g: .08 })),
      { t: T_TREM + .02, type: 'rumble', dur: 1.1, g: .07 },
      { t: T_INS + .05, type: 'shimmer', g: .05 },
      { t: T_MEM + .05, type: 'shimmer', g: .04 },
      { t: T_CREEP, type: 'exhale', g: .05 }, { t: T_PARA + .1, type: 'cloth', g: .04 },
      { t: DUR - .9, type: 'whoosh', f0: 180, f1: 70, dur: 1.0, g: .06 },
    ],
    api: { DUR, camAt, frameAt: (ctx, tt, ex) => frame(ctx, tt, camAt(tt), ex), eyeLight: t => eyeLight(camAt(t), t), tags: (ctx, tt) => tags(ctx, tt, 'PARANOIA') },
  });
})();
