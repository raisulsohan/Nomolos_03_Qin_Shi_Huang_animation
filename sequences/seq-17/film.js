(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, Mo = F.motion, HB = F.harbour, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-17'), DUR = C.duration;
  const FL = F.look('flat', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const S16 = () => F.getScene('seq-16'), A16 = () => S16().api, A15 = () => F.getScene('seq-15').api;
  const T0 = () => ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14', 'seq-15', 'seq-16'].reduce((s, id) => s + F.getScene(id).duration, 0);
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };

  const T_COURT = 1.75, T_MAG = 2.13, T_XU = 3.12;
  const T_TOLD = 4.17, T_EMP = 4.58, T_WANT = 5.75, T_HEAR = 6.22;
  const T_PENG = 6.99, T_REAL = 7.72, T_FIND = 8.82, T_IT = 9.03;
  const T_BY = 9.83, T_SAILED = 11.56, T_FLEET = 12.56, T_THREE = 13.42;
  const T_YOUNG = 14.28, T_CRAFT = 15.98, T_ARCH = 16.8, T_GIFTS = 17.46, T_IMM = 18.23;
  const T_IN = 12.2;
  const T_FILE = 11.3;

  const D16 = () => A16().DUR, TOP = () => A15().TOPH();
  const GX = HB.G[0], GZ = -HB.G[1], GH = HB.TOP + HB.ARCH_C[1] * HB.SIG;
  const DIV = 30 * D2R, A = d => HB.axisPt(d * Math.cos(DIV), GH + d * Math.sin(DIV));
  const D_OUT = -HB.ARCH.u1 * HB.SIG / Math.cos(DIV);
  let SPLM = null;
  function splM() {
    if (SPLM) return SPLM;
    const at16 = d => { const c = A16().camAt(D16() + d), D = c.f / c.z, e = c.pos, f = c.fwd; return [d, e, [e[0] + f[0] * D, e[1] + f[1] * D, e[2] + f[2] * D]]; };
    const XU = xuAt(), P0 = A15().PAL0();
    const K = [at16(-.6), at16(0), at16(.15),
      [2.3, [44, 157, -52], [XU[0] - .6, 128.5, -XU[1] - .6]],
      [3.7, [46, 156, -51], [XU[0] - .3, 128.5, -XU[1] - .1]],
      [4.6, [45, 158, -47], [(XU[0] + P0[0]) / 2, 128.8, -(XU[1] + P0[1]) / 2]],
      [T_HEAR, [47, 159, -45.5], [(XU[0] + P0[0]) / 2 + .6, 129, -(XU[1] + P0[1]) / 2 + .6]],
      [7.7, [112, 196, -30], [300, 128, 18]],
      [8.7, [262, 236, 20], [450, 110, 62]],
      ...(() => { const E = HB.axisPt(52, 292), T = [E[0] + 100 * Math.sin(99 * D2R) * Math.cos(54 * D2R), E[1] - 100 * Math.sin(54 * D2R), E[2] + 100 * Math.cos(99 * D2R) * Math.cos(54 * D2R)];
        return [[9.55, E, T], [10.0, [E[0] + 3, E[1] - 5, E[2] - 1], [T[0] + 3, T[1] - 5, T[2] - 1]]]; })(),
      [11.2, A(22), A(-80)], [11.65, A(8), A(-95)], [T_IN, A(D_OUT), A(-105)], [T_IN + .5, A(D_OUT - 6), A(-111)]];
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])]));
    return (SPLM = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])) });
  }
  const camFrom = (e, g, f) => {
    const d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]], L = Math.hypot(d[0], d[1], d[2]);
    const cam = S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, W, H, near: .05 });
    cam.z = f / L; cam.ph = -cam.pitch; cam.at = (x, y, h) => cam.proj([x, h, -y]);
    return cam;
  };
  const FLENS = () => F.getScene('seq-06').api.FLENS;
  function camMap(t) { const S = splM(); return camFrom(S.e.map(f => f(t)), S.g.map(f => f(t)), FLENS()); }

  const xuAt = () => { const r = A15().RANKS().find(q => q.i === 10); return [r.x, r.y]; };
  function courtGlows(ctx, cam, t) {
    const sh = SH(), top = TOP(), mag = clamp(14 / cam.z, 1, 3);
    const all = ss(T_COURT - .1, T_MAG + .2, t) * (1 - ss(T_XU - .2, T_XU + .2, t)), one = ss(T_XU - .25, T_XU + .15, t);
    for (const r of A15().RANKS()) if (r.alch) {
      const a = r.i === 10 ? Math.max(all, one) : all; if (a <= .003) continue;
      const u = QM.up(cam, r.x, r.y, top + 1.2); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, (r.i === 10 ? 1.5 + .5 * one : 1.1) * u.k * mag, '#fff1c8', .8 * a, 'flat');
    }
  }
  const T_A0 = T_TOLD - .05, T_A1 = T_EMP + .3, T_B0 = T_PENG - .05, T_B1 = T_REAL - .05, T_C0 = T_REAL + .1, T_C1 = T_IT + .05;
  let SEA_R = null;
  const seaRoad = () => SEA_R || (SEA_R = QM.road([HB.onMap(-3), HB.onMap(-30), [A15().PENG[0] - 34, A15().PENG[1] + 6], [A15().PENG[0] - 9, A15().PENG[1]]]));
  function thread(x, cam, t) {
    const top = TOP() + .08, sh0 = clamp((t - T_A0) / (T_A1 - T_A0));
    if (sh0 <= 0) return;
    const XU = xuAt(), P0 = A15().PAL0(), a = 1 - .5 * ss(T_IN - .6, T_IN, t);
    const k = easeIO(sh0), N = 24;
    x.save(); x.lineCap = 'round';
    for (const [wd, col] of [[5.5, `rgba(255,236,170,${.3 * a})`], [2, `rgba(255,248,222,${.95 * a})`]]) {
      x.strokeStyle = col; x.lineWidth = wd * Math.min(2.2, cam.z / 12 + .6); x.beginPath();
      for (let i = 0; i <= N * k; i++) { const s = i / N, p = cam.at(lerp(XU[0], P0[0], s), lerp(XU[1], P0[1], s), top + 1.4 + 3.2 * Math.sin(PI * s)); if (p) i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
      x.stroke();
    }
    x.restore();
    const kb = easeIO(clamp((t - T_B0) / (T_B1 - T_B0)));
    if (kb > 0) { const R = A16().trackE(); A16().ribbon(x, cam, R, 0, R.L * kb, .8, top + .02, `rgba(255,255,236,${.9 * a})`); }
  }
  function seaCourse(x, cam, t) {
    const kc = easeIO(clamp((t - T_C0) / (T_C1 - T_C0))); if (kc <= 0) return;
    const R = seaRoad(), s1 = R.L * kc, a = 1 - .5 * ss(T_IN - .6, T_IN, t);
    x.fillStyle = `rgba(255,246,214,${.95 * a})`;
    for (let s = 0; s < s1; s += 4.5) { const q = QM.along(R, s), h = .5 + 110 * smooth((s - (R.L - 34)) / 34), p = cam.at(q[0], q[1], h); if (p) { const r = Math.max(1.8, .9 * p[3]); x.beginPath(); x.ellipse(p[0], p[1], r, r * Math.max(.3, Math.sin(cam.ph)), 0, 0, TAU); x.fill(); } }
  }
  function threadGlows(ctx, cam, t) {
    const sh = SH(), top = TOP(), g = (q, h, r, col, a) => { if (a <= .003) return; const u = cam.at(q[0], q[1], h); if (u) PR.glow(ctx, u[0] - sh.x, u[1] - sh.y, r(u), col, a, 'flat'); };
    const XU = xuAt(), P0 = A15().PAL0(), ka = clamp((t - T_A0) / (T_A1 - T_A0));
    if (ka > 0 && ka < 1) { const s = easeIO(ka); g([lerp(XU[0], P0[0], s), lerp(XU[1], P0[1], s)], top + 1.4 + 3.2 * Math.sin(PI * s), u => Math.max(10, 2.2 * u[3]), '#fff2c8', .9); }
    const sw = ss(T_WANT - .1, T_HEAR + .1, t) * (1 - .6 * ss(T_PENG + .3, T_REAL, t));
    g(P0, P0[2], u => Math.max(24, 7 * u[3]), '#ffd890', .55 * sw);
    const kb = clamp((t - T_B0) / (T_B1 - T_B0)); if (kb > 0 && kb < 1) { const q = QM.along(A16().trackE(), A16().trackE().L * easeIO(kb)); g(q, top + .8, u => Math.max(12, 3 * u[3]), '#fff2c8', .9); }
    const kc = clamp((t - T_C0) / (T_C1 - T_C0)); if (kc > 0 && kc < 1) { const q = QM.along(seaRoad(), seaRoad().L * easeIO(kc)); g(q, 1, u => Math.max(12, 3 * u[3]), '#fff2c8', .9); }
    const pr = ss(T_REAL - .1, T_REAL + .25, t) * (1 - .5 * ss(T_IT, T_BY + .5, t)) * (1 - ss(9.3, 10.1, t)), PG = A15().PENG;
    g(PG, 140, u => Math.min(260, Math.max(50, 30 * u[3])), '#fff4d0', .5 * pr);
  }
  function tags(ctx, cam, t) {
    const a = ss(T_XU - .05, T_XU + .2, t) * (1 - ss(T_PENG + .2, T_PENG + .6, t)); if (a <= 0) return;
    const XU = xuAt(), u = QM.up(cam, XU[0], XU[1], TOP() + 2.6); if (!u) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); QM.tag(ctx, u.x, u.y, 'XU FU', { alpha: a, size: M45 ? 40 : 42, stem: 44 }); ctx.restore();
  }
  function mapFrame(ctx, t, cam) {
    A16().frame(ctx, D16() + t, cam, {
      tagA: 1 - ss(.4, 1.2, t), gateA: 1 - ss(8.6, 9.8, t),
      onTop: (x, cm) => thread(x, cm, t),
      glows: (c, cm) => { courtGlows(c, cm, t); threadGlows(c, cm, t); },
    });
    if (t > T_C0) HB.underLand(ctx, cam, x => seaCourse(x, cam, t));
    tags(ctx, cam, t);
  }

  const DAY = HB.DAYS.morning;
  let SPLH = null;
  function splH() {
    if (SPLH) return SPLH;
    const at = tt => { const c = camMap(tt), e = HB.toH(c.pos), f = c.fwd, g = HB.toH([c.pos[0] + 30 * f[0], c.pos[1] + 30 * f[1], c.pos[2] + 30 * f[2]]); return [tt, e, g]; };
    const K = [at(T_IN - .15), at(T_IN),
      [13.05, [21, -8, .6], [70, -36, -.5]],
      [14.2, [37, -16.5, 3.5], [88, -31, -1]],
      [15.3, [51, -20.5, 7.5], [101, -29, 1]],
      [16.3, [60, -20.5, 10.5], [112, -28.5, 4]],
      [17.9, [82, -21.5, 11], [138, -28, 5]],
      [DUR, [99, -21.5, 11.5], [165, -27, 6]],
      [DUR + 1.2, [107, -21.5, 11.8], [180, -27, 7]]];
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])]));
    return (SPLH = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])) });
  }
  function camH(t) {
    if (t < T_IN) return HB.camOf(camMap(t), W, H);
    const S = splH(); return camFrom(S.e.map(f => f(t)), S.g.map(f => f(t)), FLENS());
  }

  const LOADS = [[[-.3, -.35, 'chest'], [-.3, .3, 'chest'], [.35, .1, 'bronze'], [-.05, -.5, 'silk'], [.5, -.3, 'chest']],
    [[-.35, .3, 'chest'], [.3, -.35, 'silk2'], [.32, .25, 'chest'], [-.1, -.45, 'bronze']],
    [[-.3, -.3, 'chest'], [-.25, .35, 'silk'], [.4, .2, 'chest'], [.45, -.4, 'chest'], [0, -.55, 'bronze']]];
  const MOOR = [{ u: 68, hoist: 99, go: 99 }, { u: 98, hoist: 18.35, go: 18.9 }, { u: 128, hoist: 17.95, go: 18.5 }].map((m, i) => ({ ...m, v: -8, L: HB.SHIP.L, B: HB.SHIP.B, load: LOADS[i], i, plank: m.u - 1.5 }));
  const ANCH = [[195, 42, 18.2], [222, -46, 18.45], [258, 88, 18.3], [292, -18, 18.6], [330, 58, 18.4], [372, -74, 18.7], [420, 22, 18.5], [478, -40, 18.8], [540, 70, 18.65]].map(([u, v, h], i) => ({ u, v, hoist: h, go: h + .55, L: HB.SHIP.L, B: HB.SHIP.B, i: 10 + i }));
  const ACC = .9;
  const shipNow = (s, t) => {
    const k = ss(s.hoist, s.hoist + 1.2, t), dt = Math.max(0, t - s.go), du = .5 * ACC * dt * dt;
    return { ...s, u: s.u + du, du, sail: k, bob: .07 * Math.sin(t * 1.3 + s.i), a: 0 };
  };

  const STAIR = HB.STAIR, JET = HB.JET, DECK = HB.DECK, SEA = HB.SEA;
  const deckY = SEA + 2.2;
  function way(lane, ship, spot) {
    const u = ship.plank, sg = Math.sign(lane || 1);
    return [[-3, 0, 30 * sg], [1, 0, 6 * sg], [STAIR.x0 - .5, 0, lane], [STAIR.x1, STAIR.y1, lane], [JET.x0 + 1, DECK, lane * .9],
      [u - 1.6, DECK, lane * .9], [u, DECK, -JET.w + .3], [u, deckY + .9, ship.v + ship.B / 2 - .1], [u + .6, deckY, ship.v + ship.B / 2 - 1.1], [spot[0] - .6, deckY, spot[1]], [spot[0], deckY, spot[1]]];
  }
  let FILE = null;
  function file() {
    if (FILE) return FILE;
    const out = [], spots = MOOR.map(m => { const o = []; for (const dv of [1.6, 0, -1.6]) for (const du of [5.5, 2.8, 0, -2.8, -5.5, 8]) o.push([m.u + du, m.v + dv]); return o; });
    const used = [0, 0, 0];
    const GROUPS = [['archer', 2, 4, 126, 6], ['craft', 1, 4, 96, 6], ['child', 0, 34, 66, 8]];
    for (const [kind, si, n, headU, aboard] of GROUPS) {
      const m = MOOR[si];
      for (let j = 0; j < aboard; j++) { const sp = spots[si][used[si]++]; out.push(HB.walker({ kind, pts: way(.75, m, sp), s0: 1e6, T: T_FILE, ship: si })); }
      for (let j = 0; j < n; j++) {
        const lane = j % 2 ? -.75 : .75, sp = spots[si][used[si]++ % spots[si].length], pts = way(lane, m, sp);
        const sRoot = HB.path(pts.slice(0, 5)).L;
        const back = Math.floor(j / 2) * (kind === 'child' ? 1.9 : 2.3) + (j % 2) * .5;
        out.push(HB.walker({ kind, pts, s0: sRoot + (headU - JET.x0 - 1) - back, T: T_FILE, ship: si, lead: j % 3 ? 'near' : 'far' }));
      }
    }
    for (const w0 of out) w0.sBoard = HB.path(w0.pts.slice(0, 8)).L;
    return (FILE = out);
  }

  function harbourFrame(ctx, t, cam) {
    const ships = MOOR.map(s => shipNow(s, t)), far = ANCH.map(s => shipNow(s, t));
    HB.skySea(ctx, cam, DAY, t);
    HB.mirage(ctx, cam, DAY, 1, t);
    PA.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      HB.waves(x, cam, DAY, t);
      HB.land(x, cam, DAY);
      far.slice().sort((a, b) => cam.depth([b.u, SEA, b.v]) - cam.depth([a.u, SEA, a.v])).forEach(s => HB.junk(x, cam, s, DAY, { t }));
    }, { rim: false, paperShadow: [2, 3, 3, .12] });
    const W0 = file().map(w0 => ({ w0, q: w0.at(t) }));
    PA.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      HB.stair(x, cam, DAY);
      ships.slice().sort((a, b) => cam.depth([b.u, SEA, b.v]) - cam.depth([a.u, SEA, a.v])).forEach(s => {
        const mine = W0.filter(o => o.w0.ship === s.i && o.q.s >= o.w0.sBoard).sort((a, b) => cam.depth(b.q.p) - cam.depth(a.q.p));
        HB.junk(x, cam, s, DAY, { t, deck: () => mine.forEach(o => HB.person(x, cam, [o.q.p[0] + s.du, o.q.p[1] + s.bob, o.q.p[2]], o.q.dir, o.w0.kind, o.q.tg, { G: o.w0.G, rim: [1.4, -1.0] })) });
      });
      HB.jetty(x, cam, DAY);
      for (const s of ships) plank(x, cam, s, t);
      HB.lanterns(x, cam, DAY, 0);
      W0.filter(o => o.q.s < o.w0.sBoard).sort((a, b) => cam.depth(b.q.p) - cam.depth(a.q.p)).forEach(o => HB.person(x, cam, o.q.p, o.q.dir, o.w0.kind, o.q.tg, { G: o.w0.G, rim: [1.4, -1.0] }));
    }, { paperShadow: [3, 4, 4, .2] });
    gifts(ctx, cam, t, ships);
  }
  function plank(x, cam, s, t) {
    const k = 1 - ss(s.hoist - .1, s.hoist + .35, t); if (k <= 0) return;
    const u = s.plank, top = [u, deckY + .9 + s.bob, s.v + s.B / 2 - .1], foot = [u, DECK, -JET.w + .3], f2 = [lerp(top[0], foot[0], k), lerp(top[1], foot[1], k), lerp(top[2], foot[2], k)];
    const q = [[top[0] - .45, top[1], top[2]], [top[0] + .45, top[1], top[2]], [f2[0] + .45, f2[1], f2[2]], [f2[0] - .45, f2[1], f2[2]]];
    if (S3.poly(x, cam, q)) { x.fillStyle = '#7a5a3c'; x.fill(); x.strokeStyle = 'rgba(40,26,16,.5)'; x.lineWidth = 1; x.stroke(); }
  }
  function gifts(ctx, cam, t, ships) {
    const sh = SH();
    for (const s of ships) (s.load || []).forEach(([a, w2], j) => {
      const tt = T_GIFTS + .08 * j + .02 * s.i, k = Math.exp(-Math.pow((t - tt - .25) / .3, 2)) + .25 * ss(tt, tt + .4, t) * (1 - ss(T_IMM + .6, DUR, t)); if (k < .01) return;
      const p = cam.proj(HB.shipPt(s, a, w2, 3.0)); if (p) PR.glow(ctx, p[0] - sh.x, p[1] - sh.y, Math.max(8, 1.6 * p[3]), '#ffe2a0', .7 * Math.min(1, k), 'flat');
    });
  }
  function count(ctx, cam, t) {
    const a = ss(T_THREE - .05, T_THREE + .2, t) * (1 - ss(T_CRAFT + .3, T_CRAFT + .7, t)); if (a <= 0) return;
    const p = cam.proj([44, -21, 0]); if (!p) return;
    const sx = clamp(p[0], W * .14, W * .86);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); QM.tag(ctx, sx - SH().x, p[1] - SH().y, '3,000', { alpha: a, size: M45 ? 54 : 58, stem: 30 }); ctx.restore();
  }

  function portal(ctx, t, cam) {
    const Ar = HB.ARCH, eH = HB.toH(cam.pos), faces = [Ar.u0, Ar.u1].filter(u => eH[0] < u);
    if (!faces.length) return;
    const polys = faces.map(u => S3.clip(cam, [[u, Ar.y0, -Ar.w], [u, Ar.y0, Ar.w], [u, Ar.y1, Ar.w], [u, Ar.y1, -Ar.w]].map(HB.fromH)));
    if (polys.some(q => q.length < 3)) return;
    const size = Math.hypot(polys[0][1][0] - polys[0][0][0], polys[0][1][1] - polys[0][0][1]); if (size < 2) return;
    const [cv, x] = buf(); clean(x); harbourFrame(x, t, HB.camOf(cam, W, H));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const q of polys) { ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip(); }
    ctx.drawImage(cv, 0, 0); ctx.restore();
  }

  function draw(ctx, t) {
    if (t <= 0) return S16().draw(ctx, D16());
    if (t < T_IN) { const cam = camMap(t); mapFrame(ctx, t, cam); portal(ctx, t, cam); }
    else { const cam = camH(t); harbourFrame(ctx, t, cam); count(ctx, cam, t); }
    FL.grade(ctx, T0() + t);
  }
  function frameAt(ctx, t) { const cam = camH(t); harbourFrame(ctx, t, cam); count(ctx, cam, t); FL.grade(ctx, T0() + t); }

  F.scene('seq-17', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .1, type: 'whoosh', f0: 120, f1: 60, dur: 1.8, g: .08 },
      { t: T_COURT, type: 'shimmer', g: .07 },
      { t: T_XU, type: 'tick', g: .2 },
      { t: T_XU + .02, type: 'bells', g: .05 },
      { t: T_TOLD, type: 'riser', dur: T_EMP + .3 - T_TOLD, f0: 900, f1: 1500, g: .04 },
      { t: T_WANT, type: 'riser', dur: 1.0, f0: 260, f1: 420, g: .06 },
      { t: T_PENG - .05, type: 'whoosh', f0: 70, f1: 190, dur: T_IN - T_PENG, g: .14 },
      { t: T_REAL, type: 'shimmer', g: .18 },
      { t: T_FIND, type: 'clink', f: 3600, g: .1 },
      { t: T_IN - .5, type: 'wind', dur: 1.6, g: .08 },
      { t: T_IN - .05, type: 'swoosh', dur: .5, g: .08 },
      { t: T_IN + .1, type: 'lib', dur: DUR - T_IN, label: 'A HARBOUR BY MORNING: GULLS, SMALL WAVES ON TIMBER' },
      { t: T_IN + .6, type: 'lib', dur: DUR - T_IN - .6, label: 'MANY FEET WALKING ON A TIMBER JETTY AND STONE STEPS' },
      { t: T_THREE, type: 'tick', g: .2 },
      ...[0, 1, 2, 3].map(i => ({ t: T_GIFTS + .1 * i, type: 'clink', f: 3000 + 300 * i, g: .05, noSnap: true })),
      { t: 17.95, type: 'lib', dur: 1.6, label: 'SAILS HOISTED AND FILLING, ROPES CREAKING' },
      { t: 18.6, type: 'creak', dur: .4, g: .05 },
    ],
    api: { DUR, camMap, camH, frameAt, harbourFrame, T_IN, MOOR, ANCH, shipNow, file, seaRoad },
  });
})();
