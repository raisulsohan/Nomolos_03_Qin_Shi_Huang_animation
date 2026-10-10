(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, { clamp, lerp, TAU } = F;
  const HB = (F.harbour = {});
  HB.SIG = .5;
  HB.G = [436.0, -59.5];
  HB.TOP = 128;
  HB.SEA = -30;
  HB.BETA = 115 * Math.PI / 180;
  const AX = [Math.sin(HB.BETA), Math.cos(HB.BETA)], LF = [-Math.cos(HB.BETA), Math.sin(HB.BETA)];
  HB.toH = P => { const dx = P[0] - HB.G[0], dz = P[2] + HB.G[1]; return [(dx * AX[0] + dz * AX[1]) / HB.SIG, (P[1] - HB.TOP) / HB.SIG, (dx * LF[0] + dz * LF[1]) / HB.SIG]; };
  HB.fromH = p => [HB.G[0] + (p[0] * AX[0] + p[2] * LF[0]) * HB.SIG, HB.TOP + p[1] * HB.SIG, -HB.G[1] + (p[0] * AX[1] + p[2] * LF[1]) * HB.SIG];
  HB.nToMap = n => [n[0] * AX[0] + n[2] * LF[0], n[1], n[0] * AX[1] + n[2] * LF[1]];
  HB.camOf = (c, W, H) => S3.camera({ pos: HB.toH(c.pos), yaw: c.yaw - HB.BETA + Math.PI / 2, pitch: c.pitch, f: c.f, W, H, cx: c.cx, cy: c.cy, near: .05 });
  HB.axisPt = (d, h) => [HB.G[0] - d * AX[0], h, -HB.G[1] - d * AX[1]];
  HB.onMap = d => [HB.G[0] - d * AX[0], HB.G[1] + d * AX[1]];

  HB.ARCH = { w: 2, y0: 1.2, y1: 7.4, u0: -3, u1: 3 };
  const WALL = '#b99c72', BASE = '#8f8a80', ROOF = '#2e2628', INNER = '#6e5a44', TIMBER = '#8a2a20';
  const BOXES = [
    { b: { x0: -4.6, x1: 4.6, y0: 0, y1: 1.2, z0: -10.4, z1: 10.4 }, col: BASE },
    { b: { x0: -3, x1: 3, y0: 1.2, y1: 8.6, z0: 2, z1: 5.2 }, col: WALL },
    { b: { x0: -3, x1: 3, y0: 1.2, y1: 8.6, z0: -5.2, z1: -2 }, col: WALL },
    { b: { x0: -3, x1: 3, y0: 7.4, y1: 8.6, z0: -2, z1: 2 }, col: WALL },
    { b: { x0: -3.8, x1: 3.8, y0: 1.2, y1: 11.8, z0: 5.2, z1: 9.8 }, col: WALL },
    { b: { x0: -3.8, x1: 3.8, y0: 1.2, y1: 11.8, z0: -9.8, z1: -5.2 }, col: WALL },
  ];
  function hip(x, cam, P, N, light, c, ow, od, e, r, rw) {
    const Q = (u, y, v) => P([c[0] + u, y, c[1] + v]);
    const faces = [
      [[Q(-ow, e, -od), Q(-ow, e, od), Q(0, r, rw), Q(0, r, -rw)], [-.6, .8, 0]],
      [[Q(ow, e, od), Q(ow, e, -od), Q(0, r, -rw), Q(0, r, rw)], [.6, .8, 0]],
      [[Q(-ow, e, od), Q(ow, e, od), Q(0, r, rw)], [0, .6, .8]],
      [[Q(ow, e, -od), Q(-ow, e, -od), Q(0, r, -rw)], [0, .6, -.8]],
    ];
    for (const [pts, n0] of faces) { const n = N(n0); if (S3.facing(cam, pts[0], n) && S3.poly(x, cam, pts)) { x.fillStyle = S3.shade(ROOF, n, light, { lo: .5 }); x.fill(); } }
  }
  HB.gate = (x, cam, o = {}) => {
    const light = o.light || S3.LIGHT, P = o.P || (p => p), N = o.N || (n => n), lo = o.lo ?? .5;
    const box = (b, col) => {
      const { x0, x1, y0, y1, z0, z1 } = b;
      const faces = [
        [[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]],
        [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1]],
        [[[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1]],
        [[[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0]],
        [[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0]],
      ];
      for (const [pts, n] of faces) {
        const w = pts.map(P), nn = N(n);
        if (!S3.facing(cam, w[0], nn)) continue;
        if (S3.poly(x, cam, w)) { x.fillStyle = S3.shade(col, nn, light, { lo }); x.fill(); }
      }
    };
    box(BOXES[0].b, BOXES[0].col);
    const A = HB.ARCH, inner = [
      [[[A.u0, A.y0, A.w], [A.u1, A.y0, A.w], [A.u1, A.y1, A.w], [A.u0, A.y1, A.w]], [0, 0, -1]],
      [[[A.u1, A.y0, -A.w], [A.u0, A.y0, -A.w], [A.u0, A.y1, -A.w], [A.u1, A.y1, -A.w]], [0, 0, 1]],
      [[[A.u0, A.y1, -A.w], [A.u0, A.y1, A.w], [A.u1, A.y1, A.w], [A.u1, A.y1, -A.w]], [0, -1, 0]],
    ];
    for (const [pts, n] of inner) { const w = pts.map(P), nn = N(n); if (S3.facing(cam, w[0], nn) && S3.poly(x, cam, w)) { x.fillStyle = S3.shade(INNER, nn, light, { lo: .35 }); x.fill(); } }
    const L = BOXES.slice(1).map(o2 => ({ o2, d: cam.depth(P([(o2.b.x0 + o2.b.x1) / 2, (o2.b.y0 + o2.b.y1) / 2, (o2.b.z0 + o2.b.z1) / 2])) }));
    L.sort((a, b) => b.d - a.d).forEach(q => box(q.o2.b, q.o2.col));
    for (const u of [A.u0 - .05, A.u1 + .05]) for (const b of [{ x0: u - .2, x1: u + .2, y0: A.y0, y1: A.y1 + .5, z0: -A.w - .45, z1: -A.w }, { x0: u - .2, x1: u + .2, y0: A.y0, y1: A.y1 + .5, z0: A.w, z1: A.w + .45 }, { x0: u - .2, x1: u + .2, y0: A.y1, y1: A.y1 + .55, z0: -A.w - .45, z1: A.w + .45 }]) box(b, TIMBER);
    for (const v of [-4.2, -1.4, 1.4, 4.2]) for (const u of [-2.4, 2.4]) box({ x0: u - .18, x1: u + .18, y0: 8.6, y1: 10.6, z0: v - .18, z1: v + .18 }, TIMBER);
    hip(x, cam, P, N, light, [0, 0], 3.9, 5.8, 10.6, 12.9, 3.2);
    for (const s of [-1, 1]) hip(x, cam, P, N, light, [0, s * 7.5], 4.5, 3.0, 11.8, 13.8, .8);
  };
  HB.archQuads = (cam, P = (p => p)) => {
    const A = HB.ARCH, q = u => [[u, A.y0, -A.w], [u, A.y0, A.w], [u, A.y1, A.w], [u, A.y1, -A.w]].map(p => cam.proj(P(p)));
    const a = q(A.u0), b = q(A.u1); if (a.some(v => !v) || b.some(v => !v)) return null;
    return [a, b];
  };
  HB.ARCH_C = [0, (HB.ARCH.y0 + HB.ARCH.y1) / 2, 0];

  const SEA = HB.SEA, DECK = SEA + 1.5;
  HB.DECK = DECK;
  HB.STAIR = { x0: 5, x1: 42, y0: 0, y1: DECK + .3, w: 3.6 };
  HB.JET = { x0: 44, x1: 150, w: 2.6 };
  HB.PENG = [6580, 2390];
  HB.DAYS = {
    morning: { sun: norm3([.62, .52, -.58]), sky: ['#9fb4c0', '#d9d6c4', '#f1e2bc'], sea: ['#2f4f5e', '#5f7f86', '#b9c2b4'], land: '#b98f5c', rock: '#8a6e50', haze: 'rgba(241,226,188,', glow: '#fff1c8' },
    evening: { sun: norm3([-.75, .3, .2]), sky: ['#5e6a8a', '#c98a6a', '#f0b878'], sea: ['#253650', '#4f5a6e', '#c08a6a'], land: '#a8734a', rock: '#6e5040', haze: 'rgba(240,184,120,', glow: '#ffd7a0' },
  };
  function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  HB.mixDay = (a, b, k) => {
    if (k <= 0) return a; if (k >= 1) return b;
    const m = (p, q) => S3.mix(p, q, k);
    return { sun: norm3(a.sun.map((v, i) => lerp(v, b.sun[i], k))), sky: a.sky.map((c, i) => m(c, b.sky[i])), sea: a.sea.map((c, i) => m(c, b.sea[i])), land: m(a.land, b.land), rock: m(a.rock, b.rock), haze: k < .5 ? a.haze : b.haze, glow: m(a.glow, b.glow) };
  };
  const hz = cam => cam.cy + cam.f * Math.tan(cam.pitch);
  HB.skySea = (ctx, cam, D, t) => {
    const W = cam.W, H = cam.H, y = hz(cam);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (y > 0) { const g = ctx.createLinearGradient(0, y - H, 0, y); g.addColorStop(0, D.sky[0]); g.addColorStop(.7, D.sky[1]); g.addColorStop(1, D.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(H, y + 2)); }
    if (y < H) { const y0 = Math.max(0, y), g = ctx.createLinearGradient(0, y, 0, Math.max(y + 60, H)); g.addColorStop(0, D.sea[2]); g.addColorStop(.12, D.sea[1]); g.addColorStop(1, D.sea[0]); ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0); }
    ctx.restore();
  };
  const WAVES = (() => { const R = F.rng(4711), o = []; for (let i = 0; i < 900; i++) o.push([40 + Math.pow(R(), 1.6) * 900, -500 + 1000 * R(), 2.5 + 3 * R(), R() * TAU]); return o; })();
  HB.waves = (x, cam, D, t) => {
    x.lineCap = 'round';
    for (const [u, v, L, ph] of WAVES) {
      const du = .4 * Math.sin(t * .7 + ph), a = cam.proj([u + du, SEA, v]); if (!a) continue;
      if (a[0] < -40 || a[0] > cam.W + 40 || a[1] < -10 || a[1] > cam.H + 10) continue;
      const b = cam.proj([u + du, SEA, v + L]); if (!b) continue;
      if (a[3] > 30 || Math.abs(b[1] - a[1]) > .5 * Math.abs(b[0] - a[0])) continue;
      const k = Math.min(1, a[3] / 6); if (k < .05) continue;
      x.strokeStyle = `rgba(226,234,232,${.16 * k})`; x.lineWidth = Math.max(.6, .1 * a[3]);
      x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - .06 * a[3], b[0], b[1]); x.stroke();
    }
    x.lineCap = 'butt';
  };
  HB.mirage = (ctx, cam, D, k, t) => {
    if (k <= 0) return;
    const [u, v] = HB.PENG, b = cam.proj([u, SEA, v]); if (!b) return;
    const s = b[3], sh = F.SHIFT || { x: 0, y: 0 }, X = b[0] - sh.x, Y = b[1] - sh.y;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    PR.glow(ctx, X, Y - 120 * s, Math.max(70, 420 * s), D.glow, .42 * k, 'flat');
    ctx.globalAlpha = .55 * k * (.9 + .1 * Math.sin(t * 2.3));
    for (const [dx, h, w, col] of [[-90, 230, 60, '#9fb7b4'], [70, 200, 46, '#a9bfbb'], [0, 300, 70, '#b5cac4']]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + (dx - w) * s, Y); ctx.quadraticCurveTo(X + (dx - w * .5) * s, Y - h * .7 * s, X + dx * s, Y - h * s); ctx.quadraticCurveTo(X + (dx + w * .5) * s, Y - h * .7 * s, X + (dx + w) * s, Y); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,250,236,.7)'; ctx.fillRect(X - 160 * s, Y - 6 * s, 320 * s, 6 * s);
    ctx.restore();
  };
  const PR = F.props;
  const ARMS = [
    [[40, 70], [120, 80], [210, 120], [260, 170], [60, 220]], [[40, -80], [140, -90], [230, -140], [250, -190], [40, -240]],
  ];
  HB.land = (x, cam, D) => {
    const L = D.land, Rk = D.rock, sun = D.sun;
    const sh = (col, n, lo = .5) => S3.shade(col, n, sun, { lo });
    const q = (pts, col) => { if (S3.poly(x, cam, pts)) { x.fillStyle = col; x.fill(); } };
    for (const arm of (D.arms ? ARMS : [])) {
      const top = arm.map(p => [p[0], SEA + 9, p[1]]), foot = arm.map(p => [p[0], SEA, p[1]]);
      for (let i = 0; i < arm.length - 1; i++) { const n = [arm[i + 1][1] - arm[i][1], 0, -(arm[i + 1][0] - arm[i][0])], l = Math.hypot(n[0], n[2]); n[0] /= l; n[2] /= l; if (S3.facing(cam, top[i], n)) q([foot[i], foot[i + 1], top[i + 1], top[i]], sh(Rk, n, .45)); if (S3.facing(cam, top[i], [-n[0], 0, -n[2]])) q([foot[i], foot[i + 1], top[i + 1], top[i]], sh(Rk, [-n[0], 0, -n[2]], .45)); }
      q(top, sh(L, [0, 1, 0]));
    }
    q([[-600, 0, -600], [6, 0, -600], [6, 0, 600], [-600, 0, 600]], sh(L, [0, 1, 0]));
    const fn = norm3([30, 34, 0]);
    q([[6, 0, -600], [40, SEA + .6, -600], [40, SEA + .6, 600], [6, 0, 600]], sh(Rk, fn, .42));
    x.strokeStyle = 'rgba(40,28,20,.18)'; x.lineWidth = 1;
    x.beginPath(); for (let k = 1; k < 6; k++) { const a = k / 6; S3.line(x, cam, [6 + 34 * a, SEA * a, -600], [6 + 34 * a, SEA * a, -HB.STAIR.w - .3]); S3.line(x, cam, [6 + 34 * a, SEA * a, HB.STAIR.w + .3], [6 + 34 * a, SEA * a, 600]); } x.stroke();
    q([[38, DECK, -90], [48, DECK, -90], [48, DECK, 90], [38, DECK, 90]], sh('#b6a88a', [0, 1, 0]));
    q([[48, SEA, -90], [48, SEA, 90], [48, DECK, 90], [48, DECK, -90]], sh('#8f8470', [1, 0, 0], .45));
  };
  HB.stair = (x, cam, D) => {
    const S = HB.STAIR, sun = D.sun, w = S.w, N = 44, Y = u => lerp(S.y0, S.y1, (u - S.x0) / (S.x1 - S.x0));
    const sh = (col, n, lo = .5) => S3.shade(col, n, sun, { lo });
    if (S3.poly(x, cam, [[S.x0, S.y0, -w], [S.x1, S.y1, -w], [S.x1, S.y1, w], [S.x0, S.y0, w]])) { x.fillStyle = sh('#c8b894', norm3([.6, 1, 0])); x.fill(); }
    x.strokeStyle = 'rgba(70,56,40,.4)'; x.lineWidth = 1; x.beginPath();
    for (let i = 1; i < N; i++) { const u = lerp(S.x0, S.x1, i / N); S3.line(x, cam, [u, Y(u), -w], [u, Y(u), w]); }
    x.stroke();
    for (const s of [-1, 1]) {
      const z0 = s * w, z1 = s * (w + .5), top = .9;
      const n = [0, 0, s];
      if (S3.facing(cam, [S.x0, 0, z1], n)) { if (S3.poly(x, cam, [[S.x0, S.y0, z1], [S.x1, S.y1, z1], [S.x1, S.y1 + top, z1], [S.x0, S.y0 + top, z1]])) { x.fillStyle = sh('#a99a7c', n, .45); x.fill(); } }
      if (S3.facing(cam, [S.x0, 0, z0], [0, 0, -s])) { if (S3.poly(x, cam, [[S.x0, S.y0, z0], [S.x1, S.y1, z0], [S.x1, S.y1 + top, z0], [S.x0, S.y0 + top, z0]])) { x.fillStyle = sh('#a99a7c', [0, 0, -s], .45); x.fill(); } }
      if (S3.poly(x, cam, [[S.x0, S.y0 + top, z0], [S.x1, S.y1 + top, z0], [S.x1, S.y1 + top, z1], [S.x0, S.y0 + top, z1]])) { x.fillStyle = sh('#cbbd9c', [0, 1, 0]); x.fill(); }
    }
  };
  HB.LANTERNS = [56, 74, 92, 110, 128, 146].map(u => [u, 2.9]);
  HB.jetty = (x, cam, D, o = {}) => {
    const J = HB.JET, sun = D.sun, sh = (col, n, lo = .5) => S3.shade(col, n, sun, { lo });
    const posts = []; for (let u = J.x0 + 2; u <= J.x1; u += 6) for (const v of [-J.w + .2, J.w - .2]) posts.push([u, v]);
    posts.sort((a, b) => cam.depth([b[0], SEA, b[1]]) - cam.depth([a[0], SEA, a[1]]));
    for (const [u, v] of posts) S3.bar(x, cam, [u, SEA - .5, v], [u, DECK, v], .18, { col: '#4a3624', light: sun, n: 6, lo: .4 });
    S3.box(x, cam, { x0: J.x0, x1: J.x1, y0: DECK - .35, y1: DECK, z0: -J.w, z1: J.w }, { col: '#8a6a48', light: sun, lo: .45 });
    x.strokeStyle = 'rgba(50,34,22,.35)'; x.lineWidth = 1; x.beginPath();
    for (let u = J.x0; u <= J.x1; u += 1.2) S3.line(x, cam, [u, DECK + .002, -J.w], [u, DECK + .002, J.w]);
    x.stroke();
  };
  HB.lanterns = (x, cam, D, k) => {
    for (const [u, v] of HB.LANTERNS) {
      S3.bar(x, cam, [u, DECK, v], [u, DECK + 2.6, v], .06, { col: '#3a2a1e', light: D.sun, n: 5 });
      const p = cam.proj([u, DECK + 2.75, v]); if (!p) continue;
      const r = .2 * p[3];
      x.fillStyle = k > 0 ? S3.mix('#7a3a24', '#ffb060', k) : '#7a3a24'; x.beginPath(); x.ellipse(p[0], p[1], r * .8, r, 0, 0, TAU); x.fill();
    }
  };
  const HULL = '#5a3e2a', HULL_D = '#3a2818', SAIL = '#b4683c', SAIL_D = '#7a4024', DECKC = '#9a7650';
  HB.SHIP = { L: 24, B: 7, free: 2.2 };
  HB.shipPt = (s, a, w, y) => {
    const ca = Math.cos(s.a || 0), sa = Math.sin(s.a || 0), X = a * s.L / 2, Z = w * s.B / 2;
    return [s.u + X * ca + Z * sa, SEA + y + (s.bob || 0), s.v + X * sa * -1 + Z * ca];
  };
  const sheer = a => 2.1 + .8 * Math.pow(Math.max(0, a), 2) + 1.9 * Math.pow(Math.max(0, -a), 2.4);
  const beam = a => a > 0 ? 1 - .42 * Math.pow(a, 2.2) : 1 - .22 * Math.pow(-a, 3);
  HB.junk = (x, cam, s, D, o = {}) => {
    const sun = D.sun, sh = (col, n, lo = .45) => S3.shade(col, n, sun, { lo }), N = 12;
    const A = []; for (let i = 0; i <= N; i++) A.push(-1 + 2 * i / N);
    const P = (a, w, y) => HB.shipPt(s, a, w, y);
    const mid = P(0, 0, 1), side = (() => { const c = P(0, 1, 1); return S3.facing(cam, c, [c[0] - mid[0], 0, c[2] - mid[2]]) ? 1 : -1; })();
    const deckRing = [...A.map(a => P(a, beam(a), sheer(a))), ...A.slice().reverse().map(a => P(a, -beam(a), sheer(a)))];
    const far = -side;
    for (let i = 0; i < N; i++) { const a0 = A[i], a1 = A[i + 1]; if (S3.poly(x, cam, [P(a0, far * beam(a0), sheer(a0)), P(a1, far * beam(a1), sheer(a1)), P(a1, far * beam(a1), sheer(a1) + .9), P(a0, far * beam(a0), sheer(a0) + .9)])) { x.fillStyle = sh(HULL_D, [0, 1, 0], .5); x.fill(); } }
    if (S3.poly(x, cam, deckRing)) { x.fillStyle = sh(DECKC, [0, 1, 0]); x.fill(); }
    const stN = [P(-1, 0, 1)[0] - mid[0], 0, P(-1, 0, 1)[2] - mid[2]], sl = Math.hypot(stN[0], stN[2]); stN[0] /= sl; stN[2] /= sl;
    const L = [];
    L.push({ d: cam.depth(P(-.72, 0, 3.6)), f: () => {
      const c = [[-.9, -.5], [-.66, -.5], [-.66, .5], [-.9, .5]].map(([a, w]) => P(a, w, 0));
      const ring = c.map(p => [p[0], p[2]]), y0 = sheer(-.78) + SEA + (s.bob || 0), y1 = y0 + 1.9;
      S3.prism(x, cam, ring, y0, y1, { col: '#9a6a40', light: sun, lo: .45 });
      const r = [[-.95, -.62], [-.61, -.62], [-.61, .62], [-.95, .62]].map(([a, w]) => { const p = P(a, w, 0); return [p[0], y1 + .1, p[2]]; }), ri = (() => { const m = P(-.78, 0, 0); return [m[0], y1 + .9, m[2]]; })();
      for (let k = 0; k < 4; k++) { const q = [r[k], r[(k + 1) % 4], ri]; const e = [(q[0][0] + q[1][0]) / 2 - ri[0], 0, (q[0][2] + q[1][2]) / 2 - ri[2]], l = Math.hypot(e[0], e[2]) || 1, n = [e[0] / l * .6, .8, e[2] / l * .6]; if (S3.facing(cam, q[0], n) && S3.poly(x, cam, q)) { x.fillStyle = sh('#2e2628', n, .5); x.fill(); } }
    } });
    for (const [a, w, kind] of (s.load || [])) L.push({ d: cam.depth(P(a, w, sheer(a) + .5)), f: () => {
      const p = P(a, w, sheer(a)), y = p[1];
      if (kind === 'chest') {
        for (const [dy, dz, w2] of [[0, 0, .8], [1.0, .1, .65]]) {
          S3.box(x, cam, { x0: p[0] - w2, x1: p[0] + w2, y0: y + dy, y1: y + dy + .95, z0: p[2] - .55 + dz, z1: p[2] + .55 + dz }, { col: '#8a2a20', light: sun, lo: .45 });
          x.strokeStyle = '#d9a443'; x.lineWidth = Math.max(1, (cam.proj(p) || [0, 0, 0, 10])[3] * .06); x.beginPath(); S3.line(x, cam, [p[0] - w2, y + dy + .5, p[2] - .56 + dz], [p[0] + w2, y + dy + .5, p[2] - .56 + dz]); S3.line(x, cam, [p[0] - w2, y + dy + .5, p[2] + .56 + dz], [p[0] + w2, y + dy + .5, p[2] + .56 + dz]); x.stroke();
        }
      }
      else if (kind === 'bronze') { S3.cyl(x, cam, [p[0], p[2]], .55, y, y + .8, { col: '#6e5a36', light: sun, lo: .45 }); S3.cyl(x, cam, [p[0], p[2]], .4, y + .8, y + 1.2, { col: '#5e4a2a', light: sun, lo: .45 }); }
      else for (const dy of [.4, 1.1]) S3.bar(x, cam, [p[0] - .8, y + dy, p[2]], [p[0] + .8, y + dy, p[2]], .38, { col: kind === 'silk2' ? '#c9b23c' : '#d8d4c8', light: sun, n: 8, lo: .5 });
    } });
    for (const [a, hM, sw] of [[.12, 15, 1], [.62, 10.5, .68]]) L.push({ d: cam.depth(P(a, 0, 6)), f: () => {
      const foot = P(a, 0, sheer(a)), top = P(a, 0, sheer(a) + hM);
      S3.bar(x, cam, foot, top, .24, { col: '#3a2a1e', light: sun, n: 6, lo: .4 });
      sail(x, cam, s, a, hM, sw, D);
      if (sw === 1) { const pt = cam.proj(top), pb = cam.proj([top[0], top[1] - 1.2, top[2]]); if (pt && pb) { const L2 = 2.6 * pt[3], fl = Math.sin((o.t || 0) * 6 + s.i) * .25 * L2; x.fillStyle = '#b3261c'; x.beginPath(); x.moveTo(pt[0], pt[1]); x.quadraticCurveTo(pt[0] - L2 * .5, pt[1] + fl * .5 + (pb[1] - pt[1]) * .2, pt[0] - L2, pt[1] + fl + (pb[1] - pt[1]) * .4); x.lineTo(pb[0], pb[1]); x.closePath(); x.fill(); } }
    } });
    if (o.deck) L.push({ d: cam.depth(P(0, side * .6, 2)), f: () => o.deck(x, side) });
    L.sort((p, q) => q.d - p.d).forEach(e => e.f());
    const ns = side, cN = (() => { const c0 = P(0, 0, 1), c1 = P(0, ns, 1), n = [c1[0] - c0[0], 0, c1[2] - c0[2]], l = Math.hypot(n[0], n[2]); return [n[0] / l, 0, n[2] / l]; })();
    const band = (y0, y1, col) => { const top = A.map(a => P(a, ns * beam(a), y1(a))), bot = A.slice().reverse().map(a => P(a, ns * beam(a) * (y0 === 'wl' ? .82 : 1), y0 === 'wl' ? 0 : y0(a))); if (S3.poly(x, cam, [...top, ...bot])) { x.fillStyle = col; x.fill(); } };
    band('wl', a => sheer(a) + .9, sh(HULL, cN, .42));
    band(a => sheer(a) - .25, a => sheer(a) + .9, sh('#9a4a26', cN, .45));
    band(a => sheer(a) + .72, a => sheer(a) + .9, sh('#2a1c12', cN, .5));
    x.strokeStyle = 'rgba(20,12,6,.28)'; x.lineWidth = 1; x.beginPath();
    for (const f of [.3, .55, .8]) { let first = true; for (const a of A) { const p = cam.proj(P(a, ns * beam(a) * lerp(.86, 1, f), (sheer(a) - .25) * f)); if (!p) continue; first ? x.moveTo(p[0], p[1]) : x.lineTo(p[0], p[1]); first = false; } }
    x.stroke();
    if (S3.facing(cam, P(-1, 0, 2), stN)) {
      const r = []; for (let i = 0; i <= 8; i++) { const w = -1 + 2 * i / 8; r.push(P(-1, w * beam(-1), sheer(-1) + .9 + .5 * (1 - w * w))); } r.push(P(-1, beam(-1) * .8, .4), P(-1, -beam(-1) * .8, .4));
      if (S3.poly(x, cam, r)) { x.fillStyle = sh('#8a5a34', stN, .5); x.fill(); x.strokeStyle = 'rgba(30,18,10,.6)'; x.lineWidth = 1.2; x.stroke(); }
      const d = cam.proj(P(-1, 0, sheer(-1) - .3)); if (d && d[3] > 1.5) { x.fillStyle = sh('#b3261c', stN, .55); x.beginPath(); x.arc(d[0], d[1], .9 * d[3], 0, TAU); x.fill(); x.strokeStyle = '#d9a443'; x.lineWidth = Math.max(1, .12 * d[3]); x.stroke(); }
      S3.bar(x, cam, P(-1.02, 0, -.6), P(-1.02, 0, sheer(-1) + 1.2), .2, { col: '#3a2a1e', light: sun, n: 6, lo: .4 });
    }
    { const e = cam.proj(P(.86, ns * beam(.86), sheer(.86) - .9)); if (e && e[3] > 2) { const r = .42 * e[3]; x.fillStyle = '#efe6d2'; x.beginPath(); x.ellipse(e[0], e[1], r, r * .75, 0, 0, TAU); x.fill(); x.fillStyle = '#1b1612'; x.beginPath(); x.arc(e[0] + .1 * r, e[1], r * .45, 0, TAU); x.fill(); } }
    x.strokeStyle = 'rgba(20,24,30,.45)'; x.lineWidth = Math.max(1, (cam.proj(mid) || [0, 0, 0, 10])[3] * .12); x.beginPath();
    for (let i = 0; i <= N; i++) { const p = cam.proj(P(A[i], ns * beam(A[i]) * .82, .05)); if (p) i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.stroke();
  };
  function sail(x, cam, s, a, hM, sw, D) {
    const k = clamp(s.sail ?? 1), base = sheer(a) + 1.6, top = base + (hM - 2.2) * (.12 + .88 * k), w = 7.5 * sw;
    const P = (da, y) => HB.shipPt(s, a + da / (s.L / 2), 0, y);
    const q = [P(-w * .62, base), P(w * .38, base), P(w * .3, top), P(-w * .58, top + .8)];
    const n = (() => { const c = P(0, 1), e = HB.shipPt(s, a, 1, 1); return [e[0] - c[0], 0, e[2] - c[2]]; })();
    const lit = S3.facing(cam, q[0], n) === (n[0] * D.sun[0] + n[2] * D.sun[2] > 0);
    if (!S3.poly(x, cam, q)) return;
    x.fillStyle = lit ? SAIL : SAIL_D; x.fill();
    x.strokeStyle = 'rgba(30,18,10,.55)'; x.lineWidth = 1; x.beginPath();
    const nb = Math.max(1, Math.round(6 * (.2 + .8 * k)));
    for (let i = 0; i <= nb; i++) { const u = i / nb, l = [lerp(q[0][0], q[3][0], u), lerp(q[0][1], q[3][1], u), lerp(q[0][2], q[3][2], u)], r = [lerp(q[1][0], q[2][0], u), lerp(q[1][1], q[2][1], u), lerp(q[1][2], q[2][2], u)]; S3.line(x, cam, l, r); }
    x.stroke();
  }
  const Q = () => F.qin, Mo = () => F.motion;
  const INK = '#1b2130', RIM = '#fff3d8';
  const LOOK = {};
  const lookOf = (who, col) => LOOK[who + col] || (LOOK[who + col] = Q().silhouette(who, col));
  const GAIT = {};
  HB.gaitOf = (kind) => GAIT[kind] || (GAIT[kind] = Mo().gait({ from: 0, to: 200000, t0: -60, gait: kind === 'child' ? 'brisk' : kind === 'xufu' ? 'stroll' : 'walk', style: kind === 'child' ? { step: 34, arms: .5 } : kind === 'xufu' ? { step: 34, arms: .32, lean: .03 } : {} }));
  HB.SPEED = k => { const G = HB.gaitOf(k); return (G.x(40) - G.x(30)) / 10 * S3.FIG * (k === 'child' ? .7 : 1); };
  HB.path = pts => { const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2])); return { pts, acc, L: acc[acc.length - 1] }; };
  HB.at = (P, s) => {
    s = clamp(s, 0, P.L); let i = 1; while (i < P.pts.length - 1 && P.acc[i] < s) i++;
    const a = P.pts[i - 1], b = P.pts[i], u = (s - P.acc[i - 1]) / Math.max(1e-6, P.acc[i] - P.acc[i - 1]);
    return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)], dir: Math.atan2(b[2] - a[2], b[0] - a[0]), i };
  };
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  HB.person = (x, cam, p, dir, kind, tg, o = {}) => {
    const s0 = cam.proj(p); if (!s0) return;
    if (s0[0] < -120 || s0[0] > cam.W + 120 || s0[1] < -40 || s0[1] > cam.H + 260) return;
    const sc = (kind === 'child' ? .7 : 1) * s0[3] * S3.FIG; if (sc * 92 < 2) return;
    const G = o.G || HB.gaitOf(kind), tp = Mo().pose(tg), pose = o.stand ? { ...Mo().stand(0), lean: .01 + .01 * Math.sin(tg * 1.7), yaw: cam.yawOf(dir) } : { ...centre(G(tp), G.x(tp)), yaw: cam.yawOf(dir) };
    const eye = cam.pos, lev = Math.hypot(p[0] - eye[0], p[2] - eye[2]) / Math.hypot(p[0] - eye[0], p[1] + 1 - eye[1], p[2] - eye[2]);
    const tilt = clamp(1 - lev, 0, .5), who = kind === 'xufu' ? 'alchemist' : kind === 'archer' ? 'minister' : 'worker';
    const rim = o.rim || [1.2, -1.2], a = o.alpha ?? 1; if (a <= 0) return;
    const gear = (xx, col) => {
      if (kind === 'archer') {
        xx.strokeStyle = col; xx.lineWidth = 2.2; xx.beginPath(); xx.moveTo(-14, -86); xx.quadraticCurveTo(4, -64, 8, -30); xx.stroke();
        xx.fillStyle = col; xx.save(); xx.translate(-6, -70); xx.rotate(-.35); xx.fillRect(-2.4, -18, 4.8, 24); xx.fillRect(-3.6, -24, 1.4, 7); xx.fillRect(-.6, -25, 1.4, 8); xx.fillRect(2.2, -23, 1.4, 6); xx.restore();
      } else if (kind === 'craft') {
        xx.fillStyle = col; xx.fillRect(-13, -80, 13, 26); xx.fillRect(-12, -96, 3, 18); xx.fillRect(-14, -98, 8, 4);
      }
    };
    x.save(); x.globalAlpha *= a;
    for (const [col, d] of [[RIM, rim], [INK, [0, 0]]]) {
      x.save(); x.translate(s0[0] + d[0], s0[1] + d[1]); x.scale(sc, sc);
      const L = lookOf(who, col);
      Q().draw(x, F.look('flat', cam.W, cam.H).P, pose, L, { tilt, robe: kind === 'xufu' ? 46 : kind === 'child' ? null : 40, shadow: 0, behind: (xx) => gear(xx, col) });
      x.restore();
    }
    x.restore();
  };
  HB.walker = o => {
    const sc = o.kind === 'child' ? .7 : 1, k = S3.FIG * sc, P = HB.path(o.pts), Lu = P.L / k;
    const G = Mo().gait({ from: 0, to: Lu, t0: 0, gait: o.kind === 'child' ? 'brisk' : o.gait || 'walk', style: o.kind === 'child' ? { step: 34, arms: .5 } : o.kind === 'xufu' ? { arms: .32, lean: .05 } : {}, lead: o.lead });
    const want = o.s0 / k;
    let tau;
    if (want >= Lu - 1e-6) tau = G.end + 2;
    else if (want <= 0) tau = 0;
    else { let lo = 0, hi = G.end; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (G.x(m) < want) lo = m; else hi = m; } tau = (lo + hi) / 2; }
    const shift = o.T - tau;
    return { ...o, P, G, k, shift, at: t => { const tg = t - shift, s = clamp(G.x(tg) * k, 0, P.L), q = HB.at(P, s); return { p: q.p, dir: q.dir, tg, s, P }; } };
  };
  let UB = null;
  HB.underLand = (ctx, cam, fn, o = {}) => {
    const W = cam.W, H = cam.H, CHN = F.china;
    if (!UB || UB[0].width !== W || UB[0].height !== H) UB = F.canvas(W, H);
    const [cv, x] = UB;
    if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); }
    fn(x);
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    const hC = o.hC ?? 36, top = o.top ?? HB.TOP, QM = F.qinmap;
    for (let h = 0; h <= hC; h += hC / 4) { x.beginPath(); QM.rings(x, cam, CHN.CHINA, h); x.fill(); }
    for (let h = hC; h <= top + 1e-6; h += (top - hC) / 8) { x.save(); x.beginPath(); QM.rings(x, cam, CHN.CHINA, h); x.clip(); x.beginPath(); QM.ring(x, cam, CHN.QIN221[0], h); x.fill(); x.restore(); }
    x.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.alpha ?? 1; ctx.drawImage(cv, 0, 0); ctx.restore();
  };
  HB.lanternGlows = (ctx, cam, k, t) => {
    if (k <= 0) return; const sh = F.SHIFT || { x: 0, y: 0 };
    for (const [u, v] of HB.LANTERNS) { const p = cam.proj([u, DECK + 2.75, v]); if (!p) continue; const fl = 1 + .06 * Math.sin(t * 9 + u); PR.glow(ctx, p[0] - sh.x, p[1] - sh.y, Math.max(8, 1.6 * p[3]) * fl, '#ffb868', .7 * k, 'flat'); }
  };
})();
