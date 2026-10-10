(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, CH = F.china, Mo = F.motion, { clamp, smooth, easeIO, lerp, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-29'), DUR = C.duration, GT0 = C.T.start;
  const PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

  const T_PROVE = 0.37, T_CORPSE = 1.1;
  const T_ARCH = 2.36, T_FOOT = 3.87;
  const T_SOIL = 4.91, T_SAMP = 5.2, T_UNOP = 6.71, T_TOMB = 7.29, T_MERC = 8.11;
  const T_FAR = 9.62, T_NAT = 10.2, T_LEV = 10.71, T_EXACT = 11.61, T_SIMA = 12.67;
  const T_BUR = 14.14, T_CHAM = 14.57, T_RIV = 15.62, T_FLOW = 16.19, T_MERC2 = 16.68;
  const T_OBS = 17.81, T_CORR = 19.73, T_GROUND = 20.83, T_ITSELF = 21.22;

  const MH = 52, RB = 175, RT = 44;
  const mr = h => RB - (RB - RT) * Math.pow(h / MH, .85);
  const SQ = (r, n = 56) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a), k = Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(s), 4), -.25); o.push([r * k * c, r * k * s]); } return o; };
  const ZC = -28;
  const CHB = { x0: -46, x1: 46, y0: -37, y1: -15, z0: -30, z1: 30 };
  const cutK = t => ss(T_FOOT - .05, T_FOOT + .75, t);
  function half(ring, far) {
    const inS = p => far ? p[1] >= ZC : p[1] <= ZC, out = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], ia = inS(a), ib = inS(b);
      if (ia) out.push(a);
      if (ia !== ib) { const k = (ZC - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * k, ZC]); }
    }
    return out;
  }
  function hullS(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const LEV = Array.from({ length: 11 }, (_, i) => MH * i / 10);
  const RINGS = LEV.map(h => SQ(mr(h)));
  function mound(x, cam, part) {
    let prev = null;
    LEV.forEach((h, i) => {
      const ring = part === 'all' ? RINGS[i] : half(RINGS[i], part === 'far'); if (ring.length < 3) { prev = null; return; }
      const pts = ring.map(([X, Z]) => cam.proj([X, h, Z])); if (pts.some(p => !p)) { prev = null; return; }
      if (prev) { const hl = hullS(prev.concat(pts.map(p => [p[0], p[1]]))); x.fillStyle = S3.mix('#6f6a3e', '#8e8a52', i / 10); x.beginPath(); hl.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); }
      prev = pts.map(p => [p[0], p[1]]);
    });
    const top = part === 'all' ? RINGS[10] : half(RINGS[10], part === 'far');
    if (top.length > 2 && S3.poly(x, cam, top.map(([X, Z]) => [X, MH, Z]))) { x.fillStyle = '#9a9a5c'; x.fill(); }
  }
  const TREES = (() => { const R = F.rng(2911), o = []; for (let i = 0; i < 520; i++) { const h = MH * Math.pow(R(), .9), a = R() * TAU, r = mr(h) * (.985 + .02 * R()), q = SQ(1, 4); const c = Math.cos(a), s = Math.sin(a), k = Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(s), 4), -.25); o.push({ X: r * k * c, Z: r * k * s, Y: h, s: 3 + 2.4 * R(), n: [c, .6, s], tone: R() }); } for (let i = 0; i < 60; i++) { const a = R() * TAU, r = RT * Math.sqrt(R()) * .95; o.push({ X: r * Math.cos(a), Z: r * Math.sin(a), Y: MH, s: 3.5 + 2 * R(), n: [0, 1, 0], tone: R() }); } return o; })();
  function trees(x, cam, list) {
    const L = [];
    for (const tr of list) {
      if (S3.facing(cam, [tr.X, tr.Y, tr.Z], tr.n) === false && tr.n[1] < .9) continue;
      const p = cam.proj([tr.X, tr.Y + tr.s * .55, tr.Z]); if (!p) continue;
      const r = tr.s * .55 * p[3]; if (r < .7) continue;
      L.push({ d: p[2], p, r, tr });
    }
    L.sort((a, b) => b.d - a.d);
    for (const { p, r, tr } of L) {
      x.fillStyle = S3.mix('#2f4a26', '#4c6a34', tr.tone); x.beginPath(); x.ellipse(p[0], p[1], r * 1.1, r, 0, 0, TAU); x.fill();
      if (r > 2.5) { x.fillStyle = 'rgba(190,210,140,.35)'; x.beginPath(); x.ellipse(p[0] - r * .3, p[1] - r * .35, r * .5, r * .4, 0, 0, TAU); x.fill(); }
    }
  }
  const TREE_FAR = TREES.filter(t => t.Z >= ZC), TREE_NEAR = TREES.filter(t => t.Z < ZC);

  function sky(ctx, cam) {
    const hy = cam.cy - cam.f * Math.tan(cam.pitch);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, hy - H, 0, hy); g.addColorStop(0, '#7fa6bf'); g.addColorStop(.8, '#c9d8d6'); g.addColorStop(1, '#efe6cc');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(0, Math.min(H, hy + 2))); ctx.restore();
  }
  const RIDGE = (() => { const o = []; for (let i = 0; i <= 70; i++) { const X = -9000 + 18000 * i / 70; o.push([X, 260 + 260 * Math.pow(Math.sin(i * .23 + 1.3) * .5 + .5, 1.6) + 120 * hash(i, 2), 3400 + 300 * Math.sin(i * .5)]); } return o; })();
  const RIDGE2 = (() => { const o = []; for (let i = 0; i <= 60; i++) { const X = -6000 + 12000 * i / 60; o.push([X, 120 + 140 * Math.pow(Math.sin(i * .31) * .5 + .5, 1.4) + 60 * hash(i, 5), 1700 + 200 * Math.sin(i * .7)]); } return o; })();
  function mountains(x, cam) {
    for (const [R, col] of [[RIDGE, '#8ea0ae'], [RIDGE2, '#7f9184']]) {
      const pts = [[R[0][0], 0, R[0][2]], ...R, [R[R.length - 1][0], 0, R[R.length - 1][2]]];
      if (S3.poly(x, cam, pts)) { x.fillStyle = col; x.fill(); }
    }
  }
  const STRIPS = (() => { const o = []; let z = -2600; for (let i = 0; z < 1700; i++) { const d = 30 + 50 * hash(i, 7); o.push([z, z + d, ['#b7b26c', '#a7ad66', '#c4b97c', '#99a85f', '#b9ae70'][i % 5]]); z += d; } return o; })();
  function ground(x, cam, part) {
    const z0 = part === 'near' ? -2600 : ZC, z1 = part === 'near' ? ZC : 1700, X0 = -2400, X1 = 2400;
    for (const [a, b, col] of STRIPS) {
      const A = Math.max(a, z0), B = Math.min(b, z1); if (B <= A) continue;
      if (S3.poly(x, cam, [[X0, 0, A], [X1, 0, A], [X1, 0, B], [X0, 0, B]])) { x.fillStyle = col; x.fill(); }
    }
    const A = Math.max(-2600, z0), B = Math.min(-RB + 4, z1);
    if (B > A && S3.poly(x, cam, [[-5, .05, A], [5, .05, A], [5, .05, B], [-5, .05, B]])) { x.fillStyle = '#d8ccA0'; x.fill(); }
  }
  const ORCH = (() => { const o = []; for (let r = 0; r < 9; r++) for (let c = 0; c < 46; c++) { const X = -460 + c * 20 + 6 * hash(r * 50 + c, 3), Z = -470 + r * 22 + 4 * hash(r * 50 + c, 4); if (Math.abs(X) < 16) continue; o.push({ X, Z, Y: 0, s: 4 + 1.2 * hash(r * 50 + c, 5), tone: hash(r, c), n: [0, 1, 0] }); } return o; })();
  const NEARROW = (() => { const o = []; for (let c = 0; c < 26; c++) o.push({ X: -440 + c * 34 + 8 * hash(c, 8), Z: -520, Y: 0, s: 5 + 1.4 * hash(c, 9), tone: hash(c, 10), n: [0, 1, 0] }); return o; })();
  function orchardTrees(x, cam, list) {
    const L = [];
    for (const tr of list) { const p = cam.proj([tr.X, tr.s * .7, tr.Z]), b = cam.proj([tr.X, 0, tr.Z]); if (!p || !b) continue; const r = tr.s * .6 * p[3]; if (r < .6) continue; L.push({ d: p[2], p, b, r, tr }); }
    L.sort((a, c) => c.d - a.d);
    for (const { p, b, r, tr } of L) {
      x.fillStyle = 'rgba(40,46,24,.35)'; x.beginPath(); x.ellipse(b[0] + r * .3, b[1], r * 1.1, r * .3, 0, 0, TAU); x.fill();
      x.strokeStyle = '#4a3a26'; x.lineWidth = Math.max(1, r * .14); x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(p[0], p[1]); x.stroke();
      x.fillStyle = S3.mix('#3e5a2c', '#5c7a3a', tr.tone); x.beginPath(); x.ellipse(p[0], p[1], r * 1.15, r * .9, 0, 0, TAU); x.fill();
      if (r > 3) { x.fillStyle = '#b8402a'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(p[0] + r * (hash(k, tr.X) - .5) * 1.4, p[1] + r * (hash(k, tr.Z) - .5) * 1.0, Math.max(1, r * .1), 0, TAU); x.fill(); } }
    }
  }

  const STAKES = (() => {
    const o = [];
    for (const X of [-380, -300, -240, -195, 195, 240, 300, 380]) o.push({ X, Z: ZC, core: true });
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + .06, r = 215 + 40 * hash(i, 11); o.push({ X: r * Math.cos(a) * 1.05, Z: r * Math.sin(a), core: false }); }
    return o;
  })();
  const stakeLit = t => Math.exp(-Math.pow((t - T_SAMP - .25) / .35, 2)) * .9 + .25 * ss(T_SOIL - .1, T_SAMP + .3, t) * (1 - ss(T_EXACT, T_BUR, t));
  function stake(x, cam, s, t) {
    const b = cam.proj([s.X, 0, s.Z]), tp = cam.proj([s.X, 2.4, s.Z]); if (!b || !tp) return;
    const k = Math.max(.6, .1 * b[3]), L = stakeLit(t);
    x.strokeStyle = S3.mix('#ece4cc', '#ffffff', L); x.lineWidth = k; x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(tp[0], tp[1]); x.stroke();
    const f = .9 * b[3]; x.fillStyle = S3.mix('#c8372a', '#ff6a4a', L); x.beginPath(); x.moveTo(tp[0], tp[1]); x.lineTo(tp[0] + f, tp[1] + f * .25); x.lineTo(tp[0], tp[1] + f * .5); x.closePath(); x.fill();
  }

  const STRATA = [[0, '#6e5a3a'], [-1.2, '#8a7048'], [-4, '#a08458'], [-7, '#7a6244'], [-12, '#9a8a62'], [-15, '#6a5638'], [-22, '#857455'], [-30, '#5e4c36'], [-44, '#776a52'], [-60, '#4c4032'], [-90, '#3a3128']];
  const wave = (X, k) => .6 * noise1(X * .02 + k * 3.1, 40 + k) + .3 * noise1(X * .07, 60 + k);
  const SX0 = -1400, SX1 = 1400, SDEEP = -420;
  const PROFILE = (() => {
    const o = [];
    for (let i = 0; i <= 10; i++) { const r = mr(LEV[i]), q = SQ(r, 400); let xm = 0; for (const p of q) if (Math.abs(p[1] - ZC) < r * .02 && p[0] > xm) xm = p[0]; o.push([xm, LEV[i]]); }
    return o;
  })();
  const SPECKS = (() => { const R = F.rng(2917), o = []; for (let i = 0; i < 900; i++) { const X = (R() - .5) * 900, Y = -2 - 70 * Math.pow(R(), 1.3), d = Math.hypot(X, Y + 30) / 260; if (R() > Math.exp(-d * 2.4)) continue; o.push([X, Y, R()]); } return o; })();
  const coreSpecks = (X) => { const R = F.rng(Math.abs(X) * 7 + 3), n = Math.round(60 * Math.exp(-(Math.abs(X) - 180) / 70)), o = []; for (let i = 0; i < n; i++) o.push([X + (R() - .5) * 4, -1 - 28 * R(), R()]); return o; };
  const silverK = t => ss(T_MERC - .05, T_MERC + .5, t);
  const hazeK = t => ss(T_FAR - .1, T_LEV + .4, t);
  function section(x, cam, t) {
    const P = (X, Y) => cam.proj([X, Y, ZC]);
    const face = [[SX0, 0], ...PROFILE.map(([X, Y]) => [-X, Y]), ...PROFILE.map(([X, Y]) => [X, Y]).reverse(), [SX1, 0], [SX1, SDEEP], [SX0, SDEEP]];
    const fp = face.map(([X, Y]) => P(X, Y)); if (fp.some(p => !p)) return;
    const hole = [[CHB.x0, CHB.y0], [CHB.x1, CHB.y0], [CHB.x1, CHB.y1], [CHB.x0, CHB.y1]].map(([X, Y]) => P(X, Y));
    x.save();
    x.beginPath(); fp.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
    if (hole.every(Boolean)) { hole.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); }
    x.clip('evenodd');
    x.fillStyle = '#9c8456'; x.fillRect(-W, -H, 3 * W, 3 * H);
    x.strokeStyle = 'rgba(70,52,30,.25)'; x.lineWidth = 1; x.beginPath(); for (let Y = .6; Y < MH; Y += .6) { const a = P(-RB, Y), b = P(RB, Y); if (a && b) { x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); } } x.stroke();
    for (let i = 0; i < STRATA.length; i++) {
      const [y0, col] = STRATA[i], y1 = i + 1 < STRATA.length ? STRATA[i + 1][0] : SDEEP;
      x.fillStyle = col; x.beginPath();
      for (let k = 0; k <= 40; k++) { const X = lerp(SX0, SX1, k / 40), q = P(X, y0 + (i ? wave(X, i) : 0)); k ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }
      for (let k = 40; k >= 0; k--) { const X = lerp(SX0, SX1, k / 40), q = P(X, y1 + (i + 1 < STRATA.length ? wave(X, i + 1) : 0)); x.lineTo(q[0], q[1]); }
      x.closePath(); x.fill();
    }
    const fr = (a, b, col) => { const q = [P(a[0], a[1]), P(b[0], a[1]), P(b[0], b[1]), P(a[0], b[1])]; if (q.every(Boolean)) { x.fillStyle = col; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); } };
    fr([CHB.x0 - 4, CHB.y0 - 3], [CHB.x1 + 4, CHB.y0], '#4a3a2a'); fr([CHB.x0 - 4, CHB.y1], [CHB.x1 + 4, CHB.y1 + 4], '#4a3a2a');
    fr([CHB.x0 - 4, CHB.y0 - 3], [CHB.x0, CHB.y1 + 4], '#4a3a2a'); fr([CHB.x1, CHB.y0 - 3], [CHB.x1 + 4, CHB.y1 + 4], '#4a3a2a');
    const sk = silverK(t), lit = stakeLit(t);
    for (const s of STAKES) if (s.core) {
      fr([s.X - 2.2, -30], [s.X + 2.2, -1.2], S3.mix('#8a7450', '#d8ccb0', .35 * lit));
      const a = P(s.X - 2.2, -1.2), b = P(s.X - 2.2, -30), c = P(s.X + 2.2, -30); if (a && b && c) { x.strokeStyle = 'rgba(40,30,20,.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(c[0], a[1]); x.stroke(); }
      if (sk > 0) for (const [X, Y, r] of coreSpecks(s.X)) { const q = P(X, Y); if (!q) continue; x.fillStyle = `rgba(240,246,255,${sk * (.7 + .3 * r)})`; x.beginPath(); x.arc(q[0], q[1], Math.max(1.6, .45 * q[3]), 0, TAU); x.fill(); }
    }
    const hk = hazeK(t);
    if (hk > 0) {
      const c = P(0, -29); if (c) { const r = 160 * c[3], g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); g.addColorStop(0, `rgba(222,230,246,${.4 * hk})`); g.addColorStop(.45, `rgba(200,210,232,${.14 * hk})`); g.addColorStop(1, 'rgba(200,210,232,0)'); x.fillStyle = g; x.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r); }
      for (const [X, Y, r] of SPECKS) { const q = P(X, Y); if (!q) continue; const tw = .6 + .4 * Math.sin(t * 3 + r * 40); x.fillStyle = `rgba(244,248,255,${hk * tw * (.4 + .6 * r)})`; x.beginPath(); x.arc(q[0], q[1], Math.max(.9, .3 * q[3]), 0, TAU); x.fill(); }
    }
    x.restore();
  }

  const MK = .12, MC = [300, -40];
  const toSet = (mx, my) => [(mx - MC[0]) * MK, (my - MC[1]) * MK];
  const FLOOR = CHB.y0, LANDH = .7;
  const LANDR = CH.CHINA.map(r => r.map(([mx, my]) => toSet(mx, my)));
  const RIVERS = [
    [[96.5, 35.0], [99, 35.5], [101.5, 36.0], [103.6, 36.1], [104.6, 37.5], [106.3, 38.5], [107.0, 40.2], [109.8, 40.6], [111.2, 40.2], [110.6, 38.5], [110.4, 36.0], [110.3, 34.6], [111.5, 34.8], [113.6, 34.9], [115.0, 35.4], [116.4, 36.2], [117.5, 36.9], [118.9, 37.6]],
    [[97, 32.8], [99, 30.8], [100.2, 27.6], [101.8, 26.5], [103.5, 28.4], [104.6, 28.8], [106.5, 29.6], [108.4, 30.7], [110.4, 30.9], [111.3, 30.6], [112.4, 30.2], [113.1, 29.4], [114.3, 30.6], [116.0, 29.8], [117.1, 30.5], [118.4, 31.5], [119.6, 32.2], [121.3, 31.6]],
    [[104.5, 34.9], [106.5, 34.4], [107.6, 34.3], [108.7, 34.4], [109.6, 34.5], [110.3, 34.6]],
    [[112.6, 32.6], [114.5, 32.5], [116.4, 32.6], [117.6, 33.1], [118.9, 33.5], [120.2, 34.0]],
    [[106.9, 33.1], [109.0, 32.7], [110.8, 32.6], [112.0, 31.7], [113.2, 30.8], [114.3, 30.6]],
  ].map(r => r.map(([lo, la]) => { const p = CH.proj(lo, la); return toSet(p[0], p[1]); }));
  const PEARLS = (() => { const R = F.rng(2929), o = []; for (let i = 0; i < 260; i++) o.push([lerp(CHB.x0 + 1, CHB.x1 - 1, R()), lerp(CHB.z0 + 1, CHB.z1 - 1, R()), R()]); return o; })();
  const LAMPS = [[-40, -8], [-40, 10], [40, -8], [40, 10], [-20, 28], [0, 28], [20, 28]];
  const flowK = t => ss(T_RIV - .1, T_FLOW + .3, t);
  function chamber(x, cam, t) {
    const face = (pts, col, n) => S3.face(x, cam, pts, col, n);
    const { x0, x1, y0, y1, z0, z1 } = CHB, zf = ZC - 8;
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], '#2a2230', [0, 0, -1]);
    face([[x0, y0, zf], [x0, y0, z1], [x0, y1, z1], [x0, y1, zf]], '#241d2a', [1, 0, 0]);
    face([[x1, y0, zf], [x1, y0, z1], [x1, y1, z1], [x1, y1, zf]], '#241d2a', [-1, 0, 0]);
    face([[x0, y1, zf], [x1, y1, zf], [x1, y1, z1], [x0, y1, z1]], '#15111c', [0, -1, 0]);
    if (cam.pos[1] < y1) for (const [X, Z, r] of PEARLS) { const q = cam.proj([X, y1 - .05, Z]); if (!q) continue; x.fillStyle = `rgba(246,240,226,${.5 + .5 * r})`; x.beginPath(); x.arc(q[0], q[1], Math.max(1, (.12 + .1 * r) * q[3]), 0, TAU); x.fill(); }
    x.save();
    if (!S3.poly(x, cam, [[x0, y0, zf], [x1, y0, zf], [x1, y0, z1], [x0, y0, z1]])) { x.restore(); return; }
    x.clip();
    const sc = cam.proj([0, y0, 10]); if (sc) { const g = x.createRadialGradient(sc[0], sc[1], 0, sc[0], sc[1], 60 * sc[3]); g.addColorStop(0, '#c9d0dc'); g.addColorStop(.5, '#8e96a6'); g.addColorStop(1, '#5a6070'); x.fillStyle = g; x.fillRect(-W, -H, 3 * W, 3 * H); }
    x.strokeStyle = 'rgba(250,252,255,.55)'; x.lineWidth = 1.2; x.beginPath();
    for (let i = 0; i < 70; i++) { const X = lerp(x0, x1, hash(i, 21)), Z = lerp(zf, z1, hash(i, 22)), ph = (t * .5 + hash(i, 23)) % 1, a = cam.proj([X - 1.2, y0 + .01, Z + ph * 2]), b = cam.proj([X + 1.2, y0 + .01, Z + ph * 2]); if (a && b) { x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); } }
    x.stroke();
    for (const [h, col] of [[0, '#2a1d10'], [LANDH * .5, '#3a2a16'], [LANDH, '#5a4224']]) {
      x.fillStyle = col; x.beginPath();
      for (const r of LANDR) { const s = S3.clip(cam, r.map(([X, Z]) => [X, y0 + h, Z])); if (s.length < 3) continue; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
      x.fill();
    }
    const fk = flowK(t);
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const R of RIVERS) {
      const q = R.map(([X, Z]) => cam.proj([X, y0 + LANDH + .02, Z])); if (q.some(p => !p)) continue;
      x.strokeStyle = '#3a3f4a'; x.lineWidth = Math.max(1.5, .45 * q[q.length >> 1][3]); x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
      x.strokeStyle = '#c4ccd8'; x.lineWidth = Math.max(1, .28 * q[q.length >> 1][3]); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(.8, .09 * q[q.length >> 1][3]); x.stroke();
      if (fk > 0) {
        x.save(); x.strokeStyle = `rgba(255,255,255,${.9 * fk})`; x.lineWidth = Math.max(1, .2 * q[q.length >> 1][3]);
        const dash = Math.max(6, 2.2 * q[q.length >> 1][3]); x.setLineDash([dash, dash * 2.2]); x.lineDashOffset = -t * dash * 4.5;
        x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.restore();
      }
    }
    x.restore();
    for (const [X, Z] of LAMPS) { const b = cam.proj([X, y0, Z]), tp = cam.proj([X, y0 + 2.2, Z]); if (!b || !tp) continue; x.strokeStyle = '#3a2a1a'; x.lineWidth = Math.max(1, .15 * b[3]); x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(tp[0], tp[1]); x.stroke(); x.fillStyle = '#ffcf80'; x.beginPath(); x.ellipse(tp[0], tp[1] - .2 * tp[3], .18 * tp[3], .3 * tp[3], 0, 0, TAU); x.fill(); }
  }
  function inDark(ctx, cam, t, k = 1, open = false) {
    if (k <= 0) return;
    const sh = SH(), clipOpen = c => { const q = [[CHB.x0, CHB.y0], [CHB.x1, CHB.y0], [CHB.x1, CHB.y1], [CHB.x0, CHB.y1]].map(([X, Y]) => cam.proj([X, Y, ZC])); if (q.some(p => !p)) return true; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0] - sh.x, p[1] - sh.y) : c.moveTo(p[0] - sh.x, p[1] - sh.y)); c.closePath(); c.clip(); return true; };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (open && !clipOpen(ctx)) { ctx.restore(); return; }
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(52,48,76,${.62 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    const fk = flowK(t); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (open && !clipOpen(ctx)) { ctx.restore(); return; } ctx.translate(-sh.x, -sh.y); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
    for (const R of RIVERS) {
      const q = R.map(([X, Z]) => cam.proj([X, CHB.y0 + LANDH + .02, Z])); if (q.some(p => !p)) continue;
      ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = 'rgba(150,170,210,.22)'; ctx.lineWidth = Math.max(3, .6 * q[q.length >> 1][3]); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,230,250,.55)'; ctx.lineWidth = Math.max(1.5, .2 * q[q.length >> 1][3]); ctx.stroke();
      if (fk > 0) { const dash = Math.max(6, 2.2 * q[q.length >> 1][3]); ctx.setLineDash([dash, dash * 2.2]); ctx.lineDashOffset = -t * dash * 4.5; ctx.strokeStyle = `rgba(255,255,255,${.8 * fk})`; ctx.lineWidth = Math.max(1, .14 * q[q.length >> 1][3]); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
  }
  function chamberGlows(ctx, cam, t, k) {
    if (k <= 0) return; const sh = SH();
    const c = cam.proj([0, CHB.y0 + 1, 6]); if (c) PR.glow(ctx, c[0] - sh.x, c[1] - sh.y, Math.min(W * .6, 34 * c[3]), '#dfe8ff', .16 * k * (1 + .5 * flowK(t)), 'lightbox');
    for (const [X, Z] of LAMPS) { const q = cam.proj([X, CHB.y0 + 2.4, Z]); if (q) PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.min(200, 2.6 * q[3]), '#ffb868', .5 * k, 'lightbox'); }
  }

  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const K = [
      [-.6, [-300, 24, -600], [0, 18, 0], 1700], [0, [-290, 24, -598], [0, 18, 0], 1700], [T_CORPSE, [-230, 23, -590], [0, 17, 0], 1700],
      [T_FOOT, [-120, 20, -540], [-20, 6, 0], 1700], [T_SAMP + .3, [-110, 14, -430], [-80, -8, ZC], 1700], [T_MERC + .3, [-70, 10, -410], [-50, -12, ZC], 1700],
      [T_LEV + .2, [-20, 4, -360], [-5, -18, ZC], 1700], [T_SIMA, [0, -8, -200], [0, -26, ZC], 1700], [T_CHAM, [0, -24, -75], [0, -32, 0], 1500],
      [T_RIV, [0, -17, -26], [2, -37, 2], 1100], [T_MERC2 + .3, [3, -16.6, -23], [3, -37, 5], 1100],
      [T_OBS + .4, [0, -26, -60], [0, -30, 0], 1500], [T_CORR, [0, 4, -330], [0, -18, ZC], 1700], [T_GROUND + .4, [30, 18, -520], [0, -6, ZC], 1700],
      [DUR, [50, 22, -560], [0, -2, ZC], 1700], [DUR + 1.4, [62, 24, -580], [0, 0, ZC], 1700]];
    if (M45) K.forEach(k => { if (k[1][2] < -200) { k[1] = [k[1][0] * .6, k[1][1] + 10, k[1][2] - 160]; } k[3] *= .92; });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    const yaw = Math.atan2(d[0], d[2]);
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: Math.exp(S.f(t)), W, H, near: .05 });
  }
  const eyeInChamber = cam => { const [X, Y, Z] = cam.pos; return X > CHB.x0 && X < CHB.x1 && Y > CHB.y0 && Y < CHB.y1 && Z > ZC && Z < CHB.z1; };

  function earthDark(ctx, cam) {
    const k = ss(4, -14, cam.pos[1]); if (k <= 0) return;
    const c = cam.proj([0, (CHB.y0 + CHB.y1) / 2, ZC]); const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (c) { const r0 = 60 * c[3], g = ctx.createRadialGradient(c[0] - sh.x, c[1] - sh.y, r0 * .55, c[0] - sh.x, c[1] - sh.y, r0 * 1.6 + 200); g.addColorStop(0, 'rgba(10,8,14,0)'); g.addColorStop(1, `rgba(10,8,14,${.88 * k})`); ctx.fillStyle = g; }
    else ctx.fillStyle = `rgba(10,8,14,${.88 * k})`;
    ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  function frame(ctx, t, cam) {
    const cut = cutK(t), inside = eyeInChamber(cam), deep = ss(2, -18, cam.pos[1]);
    if (inside) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0a080e'; ctx.fillRect(0, 0, W, H); ctx.restore();
      PA.sheet(ctx, ID, 1, RC, x => chamber(x, cam, t), { rim: false, shadow: false, fibre: .3 });
      inDark(ctx, cam, t);
      chamberGlows(ctx, cam, t, 1);
    } else {
      PA.background(ctx);
      sky(ctx, cam);
      PA.sheet(ctx, ID, 1, RC, x => { mountains(x, cam); }, { rim: false, shadow: false, fibre: .4 });
      PA.sheet(ctx, ID, 1, RC, x => {
        ground(x, cam, 'far');
        orchardTrees(x, cam, ORCH.filter(o => o.Z >= ZC));
        for (const s of STAKES) if (s.Z > ZC + .5) stake(x, cam, s, t);
        mound(x, cam, cut > 0 ? 'far' : 'all'); trees(x, cam, cut > 0 ? TREE_FAR : TREES);
      }, { paperShadow: [3, 4, 4, .18] });
      if (cut > 0) {
        PA.sheet(ctx, ID, 1, RC, x => { chamber(x, cam, t); section(x, cam, t); for (const s of STAKES) if (s.core) stake(x, cam, s, t); }, { paperShadow: [4, 6, 6, .25], alpha: Math.min(1, cut * 1.5), shadowAlpha: Math.min(1, cut * 1.5) });
        inDark(ctx, cam, t, deep * Math.min(1, cut * 1.5), true);
        chamberGlows(ctx, cam, t, Math.min(1, cut * 1.5) * (.35 + .65 * deep));
        if (cut < 1) PA.sheet(ctx, ID, 1, RC, x => { ground(x, cam, 'near'); mound(x, cam, 'near'); trees(x, cam, TREE_NEAR); orchardTrees(x, cam, ORCH); for (const s of STAKES) if (s.Z < ZC - .5) stake(x, cam, s, t); }, { paperShadow: [3, 4, 4, .18], alpha: 1 - cut, shadowAlpha: 1 - cut });
      } else {
        PA.sheet(ctx, ID, 1, RC, x => { ground(x, cam, 'near'); orchardTrees(x, cam, ORCH); for (const s of STAKES) if (s.Z < ZC - .5) stake(x, cam, s, t); }, { paperShadow: [3, 4, 4, .18] });
      }
      if (cut < 1) PA.sheet(ctx, ID, 1, RC, x => orchardTrees(x, cam, NEARROW), { blur: 3, shadow: false, alpha: 1 - cut });
      const hk = hazeK(t) * cut, pulse = 1 + .6 * Math.exp(-Math.pow((t - T_GROUND - .3) / .45, 2)), sh = SH();
      if (hk > 0) { const c = cam.proj([0, -22, ZC]); if (c) PR.glow(ctx, c[0] - sh.x, c[1] - sh.y, Math.min(W * .45, 70 * c[3]), '#e6ecfa', .14 * hk * pulse, 'paper'); }
      for (const s of STAKES) if (s.core) { const L = stakeLit(t); if (L > .05) { const q = cam.proj([s.X, 2.4, s.Z]); if (q) PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.max(10, 4 * q[3]), '#fff2d0', .45 * L, 'paper'); } }
      earthDark(ctx, cam);
    }
    PA.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-29', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-28', dur: .9, dir: 'right' },
    sfx: [
      { t: .9, type: 'lib', dur: T_FOOT, label: 'COUNTRYSIDE BY DAY: A LIGHT WIND IN ORCHARDS, BIRDS FAR OFF' },
      { t: T_FOOT - .1, type: 'rumble', dur: 1.2, g: .12 },
      { t: T_FOOT, type: 'whoosh', f0: 120, f1: 50, dur: 1.0, g: .1 },
      { t: T_SAMP + .2, type: 'tick', g: .08 },
      { t: T_MERC, type: 'shimmer', g: .1 },
      { t: T_FAR, type: 'riser', dur: T_LEV - T_FAR + .5, f0: 700, f1: 1800, g: .05 },
      { t: T_EXACT, type: 'whoosh', f0: 150, f1: 60, dur: T_CHAM - T_EXACT, g: .08 },
      { t: T_CHAM, type: 'hum', dur: T_OBS - T_CHAM, g: .06 },
      { t: T_RIV, type: 'lib', dur: T_OBS - T_RIV + .3, label: 'LIQUID METAL FLOWING IN A CHANNEL, A LOW RESONANT TRICKLE' },
      { t: T_RIV + .05, type: 'shimmer', g: .1 },
      { t: T_OBS + .2, type: 'whoosh', f0: 60, f1: 150, dur: T_CORR - T_OBS + .6, g: .09 },
      { t: T_GROUND + .2, type: 'shimmer', g: .1 },
    ],
    api: { DUR, camAt, frame },
  });
})();
