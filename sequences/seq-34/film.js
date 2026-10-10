(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, Q = F.qin, RV = F.reversal, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-34'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI, FIG = S3.FIG, Y1 = RV.B1.y0, SH = RV.SH, G = RV.GRAVE, GX = (G.x0 + G.x1) / 2, GZ = (G.z0 + G.z1) / 2;
  const A33 = () => F.getScene('seq-33').api, D33 = () => A33().DUR;

  const T_FIRST = 0.17, T_CHEM = 0.85;
  const T_HE = 3.4, T_DRANK = 3.53, T_LABELED = 4.67, T_OPP = 5.42;
  const T_EVERY = 6.48, T_PAY = 8.01, T_TO = 8.5, T_GRAVE = 8.85;
  const T_HARDER = 9.99, T_FASTER = 11.96, T_CLAIMED = 13.71, T_HIM = 14.17;

  function tagTh(t) {
    const T = D33() + t, sway = -.35 + .18 * Math.sin(T * 1.1);
    const face = ss(T_LABELED - .35, T_LABELED + .2, t), turn = ss(T_OPP - .02, T_OPP + .5, t), after = t > T_OPP + .5 ? .22 * Math.exp(-(t - T_OPP - .5) * 2.2) * Math.sin((t - T_OPP - .5) * 7) : 0;
    return lerp(sway, 0, face) * (1 - turn) + turn * (PI + after + .05 * Math.sin(T * 1.3));
  }
  const gust = t => bump(t, T_OPP - .25, T_OPP + .1, T_OPP + .4, T_OPP + 1.1);

  const BEADS = RV.ROW.map(([X, Z], i) => {
    const tL = T_EVERY - .05 + .11 * i, tB = tL + .25, tLand = tB + .35, x0 = X + .1, v = 2.5, a = 2, D = G.x0 - .05 - x0;
    const s = (-v + Math.sqrt(v * v + 2 * a * D)) / a, tEdge = tLand + s, vE = v + a * s, tFloor = tEdge + Math.sqrt(2 * 1.25 / 9.8);
    return { i, X, Z, tL, tB, tLand, x0, v, a, tEdge, vE, tFloor };
  });
  function beadAt(b, t) {
    const zr = b.Z - .17, zl = G.z1 - .12;
    if (t < b.tB) return null;
    if (t < b.tLand) {
      const u = (t - b.tB) / (b.tLand - b.tB), y0 = Y1 + 6.9 * RV.CM1, h = y0 - Y1 - .02;
      return [b.X + .1 * u, y0 + .03 * Math.sin(PI * Math.min(1, u * 2.5)) - h * u * u, lerp(zr, zl, u)];
    }
    if (t < b.tEdge) { const s = t - b.tLand; return [b.x0 + b.v * s + .5 * b.a * s * s, Y1 + .022, zl]; }
    const s = t - b.tEdge, xe = G.x0 - .05;
    return [Math.min(xe + b.vE * s * .6, G.x1 - .1), Y1 + .022 - 4.9 * s * s, zl];
  }
  const cupState = t => BEADS.map(b => ({ fill: .62 + .3 * ss(b.tL, b.tL + .25, t) - .42 * ss(b.tB + .05, b.tB + .6, t), lit: .15 + .85 * bump(t, b.tL - .05, b.tL + .2, b.tB + .3, b.tB + 1.0) - .1 * ss(b.tB + .6, b.tB + 1.4, t) }));
  const graveK = t => BEADS.reduce((a, b) => a + ss(b.tFloor - .05, b.tFloor + .3, t), 0) / BEADS.length;

  const XA = -16, XSTOP = G.x0 - .65, RUN_U = (XSTOP - XA) / FIG, U = 5.6;
  const RUN = Mo.gait({ from: 0, to: RUN_U, t0: 0, gait: 'run', style: { step: 72, lift: 24, lean: .34, bob: 3.6, arms: .35 }, until: U });
  const R1 = .42, R2 = .9, RA = T_FASTER - .15, RB = T_FASTER + .65, T_STOP = T_CLAIMED + .28;
  const tauRaw = t => { if (t <= RA) return R1 * t; const S = RB - RA; if (t >= RB) return R1 * RA + (R1 + R2) / 2 * S + R2 * (t - RB); const u = (t - RA) / S; return R1 * RA + S * (R1 * u + (R2 - R1) * (u * u * u - u * u * u * u / 2)); };
  const TAU0 = U - tauRaw(T_STOP);
  const tau = t => tauRaw(t) + TAU0;
  const untau = g => { let a = -20, b = 40; for (let k = 0; k < 50; k++) { const m = (a + b) / 2; if (tau(m) < g) a = m; else b = m; } return (a + b) / 2; };
  const runX = t => XA + RUN.x(tau(t)) * FIG;
  const STEP_T = (RUN.falls[4].t - RUN.falls[2].t) / 2;
  const FALLS = RUN.falls.map(fl => ({ ...fl, ts: untau(fl.t) }));
  function runnerPose(t) {
    const g = tau(t), p = RUN(g), x0 = RUN.x(g);
    const q = { ...p, hip: [p.hip[0] - x0, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - x0, f.at[1]] })) };
    q.head = (q.head || 0) - .06 * (1 - ss(T_STOP - .3, T_STOP + .3, t));
    q.swing = Math.sin(PI * g / STEP_T) * .8 * (1 - ss(T_STOP - .5, T_STOP + .2, t)) + Math.sin(t * 1.3) * .15;
    return q;
  }
  const ZR = GZ, INK = '#0b0a1d', SIL = Q.silhouette('emperor', INK, '#3a3548');
  function runner(x, cam, t) {
    const X = runX(t); if (X < -14.5) return;
    const fa = S3.figureAt(cam, [X, Y1, ZR], 0); if (!fa || fa.depth < .8) return;
    const ch = [X, Y1 + 1.1, ZR], hd = Math.hypot(cam.pos[0] - ch[0], cam.pos[2] - ch[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - ch[1], hd)), 0, .7);
    const pose = { ...runnerPose(Mo.pose(t)), yaw: fa.yaw }; pose.swing = runnerPose(t).swing;
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s);
    Q.draw(x, LB.P, pose, SIL, { crown: true, beard: true, profile: true, tilt, robe: 40, shadow: 0 });
    x.restore();
  }
  const PUFF = RUN.falls.map((_, i) => Array.from({ length: 6 }, (_, k) => [RV.hash(i, k * 4 + 1) - .5, RV.hash(i, k * 4 + 2), RV.hash(i, k * 4 + 3) - .5, RV.hash(i, k * 4 + 4)]));
  function dust(ctx, cam, t) {
    FALLS.forEach((fl, i) => {
      const age = t - fl.ts; if (age < 0 || age > 3 || fl.close) return;
      const fx = XA + fl.x * FIG, fz = ZR + (fl.foot ? -.09 : .09), u = age / 3;
      for (const [dx, dy, dz, k] of PUFF[i]) {
        const q = cam.proj([fx + dx * .5 - .3 * Math.sqrt(u), Y1 + .05 + (.12 + .35 * dy) * Math.sqrt(u), fz + dz * .5]); if (!q) continue;
        RV.glow(ctx, q[0], q[1], (.08 + .22 * Math.sqrt(u) * (.6 + .6 * k)) * q[3], '#aab4d8', .16 * (1 - u) * smooth(age / .15));
      }
    });
  }
  const LEAD = 2.2, CY0 = Y1 + 1.12, PITX = GX;
  const sinkY = Mo.monotone([[T_CLAIMED, CY0], [T_HIM, Y1 - .05], [DUR, -5.75], [DUR + .8, -6.45], [DUR + 1.6, -7.15]]);
  function cupAt(t) {
    const x = Math.min(runX(Math.min(t, T_STOP + 1)) + LEAD + .9 * ss(T_CLAIMED - .7, T_CLAIMED + .1, t), PITX);
    const y = t < T_CLAIMED ? CY0 + .04 * Math.sin(t * 1.1) * (1 - ss(T_CLAIMED - .6, T_CLAIMED, t)) : sinkY(t);
    return [x, y, ZR];
  }
  const cupSeen = t => runX(t) > -14 || t > T_HARDER;
  function chasedCup(x, cam, t) {
    if (!cupSeen(t)) return; const p = cupAt(t); if (p[1] < RV.B2.y1 + .05) return;
    const P = cam.proj(p); if (!P) return;
    x.save(); x.translate(P[0], P[1]); x.rotate(.06 * Math.sin(t * .9));
    Q.cup(x, { s: P[3] * .01, elev: .25, fill: .85, beads: [[0, 0, 1.6]], k: .2, liquid: '#e2e8f2' });
    x.restore();
  }
  const CLODS = Array.from({ length: 8 }, (_, i) => ({ t0: T_CLAIMED + .05 + .07 * i, z: G.z0 + .15 + .7 * RV.hash(i, 31), r: .03 + .04 * RV.hash(i, 32), vx: .2 + .4 * RV.hash(i, 33) }));
  function clods(x, cam, t) {
    for (const c of CLODS) {
      const s = t - c.t0; if (s < 0) continue; const y = Y1 - 4.9 * s * s; if (y < Y1 - 1.6) continue;
      const q = cam.proj([G.x0 + c.vx * s, y, c.z]); if (!q) continue;
      x.save(); if (y + c.r < Y1 && !(RV.holePath(x, cam, Y1 + .003) && (x.clip(), true))) { x.restore(); continue; }
      x.fillStyle = '#100d24'; x.beginPath(); x.ellipse(q[0], q[1], c.r * q[3], c.r * q[3] * .7, s * 3, 0, TAU); x.fill(); x.restore();
    }
  }

  const KEYS = () => {
    const k0 = A33().keyAt(D33() - .4), k1 = A33().keyAt(D33());
    return M45 ? [
      [-.4, k0.e, k0.g, k0.f], [0, k1.e, k1.g, k1.f],
      [1.3, [-5.0, -3.6, -9.5], [-6.8, -4.6, 3.7], 1150], [2.7, [-7.55, -4.35, 1.5], [-7.32, -4.86, 3.72], 1200],
      [T_DRANK, [-7.6, -4.55, 2.4], [-7.31, -4.88, 3.72], 1250], [T_OPP + .3, [-7.62, -4.6, 2.7], [-7.3, -4.9, 3.7], 1300],
      [T_EVERY + .3, [-7.2, -4.1, 1.4], [-5.2, -4.75, 3.85], 950], [T_PAY, [-5.4, -3.7, .4], [-1.9, -4.75, 3.5], 740],
      [T_TO, [-3.0, -3.5, .45], [-.3, -4.85, 3.1], 760], [T_GRAVE + .5, [-1.25, -3.4, .75], [.25, -4.95, 2.95], 780], [11, [-1.3, -3.4, .7], [.2, -4.95, 2.95], 780],
    ] : [
      [-.4, k0.e, k0.g, k0.f], [0, k1.e, k1.g, k1.f],
      [1.3, [-5.2, -3.6, -8.5], [-6.8, -4.6, 3.7], 1300], [2.7, [-7.55, -4.35, 1.7], [-7.32, -4.86, 3.72], 1350],
      [T_DRANK, [-7.6, -4.55, 2.55], [-7.31, -4.88, 3.72], 1450], [T_OPP + .3, [-7.62, -4.6, 2.85], [-7.3, -4.9, 3.7], 1500],
      [T_EVERY + .3, [-6.3, -4.15, 1.6], [-5.4, -4.75, 3.85], 1150], [T_PAY, [-3.5, -3.7, .4], [-2.3, -4.75, 3.6], 820],
      [T_TO, [-2.3, -3.5, .55], [-.25, -4.85, 3.1], 840], [T_GRAVE + .5, [-1.4, -3.4, .8], [.2, -4.95, 2.95], 870], [11, [-1.45, -3.4, .75], [.15, -4.95, 2.95], 870],
    ];
  };
  const DOWN = M45 ? [
    [13.9, [XSTOP - .5, -4.2, .3], [XSTOP + .9, -4.1, GZ], 850], [T_HIM + .45, [-.65, -4.55, -1.6], [GX, -5.6, GZ], 850],
    [DUR, [-.55, -5.4, -3.1], [GX, -6.8, 2.0], 860], [DUR + .8, [-.45, -6.6, -3.5], [-.4, -7.9, 1.5], 860], [DUR + 1.6, [-.35, -7.8, -3.7], [-.2, -8.9, 2.0], 860],
  ] : [
    [13.9, [XSTOP - .2, -4.25, .5], [XSTOP + .9, -4.1, GZ], 1000], [T_HIM + .45, [-.65, -4.55, -1.2], [GX, -5.6, GZ], 1000],
    [DUR, [-.55, -5.4, -2.6], [GX, -6.8, 2.0], 1050], [DUR + .8, [-.45, -6.6, -3.0], [-.4, -7.9, 1.5], 1050], [DUR + 1.6, [-.35, -7.8, -3.2], [-.2, -8.9, 2.0], 1050],
  ];
  const spline = K => { const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])])); const e = [0, 1, 2].map(j => mk(k => k[1][j])), g = [0, 1, 2].map(j => mk(k => k[2][j])), f = mk(k => Math.log(k[3])); return t => ({ e: e.map(s => s(t)), g: g.map(s => s(t)), f: Math.exp(f(t)) }); };
  let S1 = null, S3K = null;
  const track = t => { const X = runX(t); return M45 ? { e: [X - .5, -4.2, .3], g: [X + .9, -4.1, GZ], f: 850 } : { e: [X - .2, -4.25, .5], g: [X + .9, -4.1, GZ], f: 1000 }; };
  const mixK = (a, b, k) => ({ e: a.e.map((v, i) => lerp(v, b.e[i], k)), g: a.g.map((v, i) => lerp(v, b.g[i], k)), f: Math.exp(lerp(Math.log(a.f), Math.log(b.f), k)) });
  function keyAt(t) {
    if (!S1) { S1 = spline(KEYS()); S3K = spline(DOWN); }
    const wb = ss(9.3, 10.4, t), wc = ss(13.85, 14.5, t);
    let k = S1(t); if (wb > 0) k = mixK(k, track(Math.min(t, T_STOP + .2)), wb); if (wc > 0) k = mixK(k, S3K(t), wc);
    return k;
  }
  const camAt = t => { const k = keyAt(t); return RV.cam(k.e, k.g, k.f, W, H); };

  const MOTES = Array.from({ length: 70 }, (_, i) => [-11 + 12 * RV.hash(i, 41), Y1 + .1 + 2.6 * RV.hash(i, 42), .3 + 3.4 * RV.hash(i, 43), RV.hash(i, 44)]);
  function motes(ctx, cam, t) {
    const a = ss(.3, 1.6, t), gx = .9 * gust(t);
    if (a <= 0) return;
    for (const [mx, my, mz, k] of MOTES) {
      const q = cam.proj([mx + .04 * t + .1 * Math.sin(t * .4 + k * 9) + gx * (1 + k), my + .04 * Math.sin(t * .3 + k * 7) + .2 * gx * Math.sin(k * 20), mz]); if (!q || q[0] < -30 || q[0] > W + 30 || q[1] < -30 || q[1] > H + 30) continue;
      RV.glow(ctx, q[0], q[1], clamp(.012 * q[3], 1, 8) * 3, '#dfe6ff', a * (.12 + .25 * k) * (.5 + .5 * Math.sin(t * 1.7 + k * 20)));
    }
  }

  function stateAt(t) {
    const s0 = A33().stateAt(D33());
    return { ...s0, t: D33() + t, lit: [s0.lit[0] + (1 - s0.lit[0]) * ss(T_FIRST - .1, T_FIRST + .4, t), s0.lit[1], s0.lit[2]], cups: cupState(t), tagTh: tagTh(t), grave: graveK(t) };
  }

  function throughGround(x, c, p, a, r0) {
    const d = Y1 - p[1]; if (d <= 0 || a <= .01 || c.pos[1] <= Y1 + .02) return;
    const R = r0 + .55 * d, al = a * ss(0, .12, d) * (1 - .45 * ss(.3, 2.5, d));
    const q = c.proj([p[0], Y1 + .004, p[2]]); if (!q) return;
    const dd = Math.hypot(c.pos[0] - p[0], c.pos[1] - Y1, c.pos[2] - p[2]), sy = Math.max(.04, (c.pos[1] - Y1) / dd), rx = Math.min(R * q[3], 3 * c.W);
    RV.glow(x, q[0], q[1], rx, '#dfe8ff', al, sy); RV.glow(x, q[0], q[1], .4 * rx, '#ffffff', .6 * al, sy);
  }
  function b1(x, c, t) {
    {
        for (const b of BEADS) { const p = beadAt(b, t); if (p) throughGround(x, c, p, .55 * (t > b.tFloor ? 1 - ss(b.tFloor, b.tFloor + .5, t) : 1), .12); }
        if (cupSeen(t)) throughGround(x, c, cupAt(t), .9, .25);
        const ball = p => { const q = c.proj(p); if (!q) return; const r = Math.max(1.2, .028 * q[3]); const g = x.createRadialGradient(q[0] - r * .35, q[1] - r * .4, 0, q[0], q[1], r); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#cfd6e2'); g.addColorStop(1, '#6a7080'); x.fillStyle = g; x.beginPath(); x.arc(q[0], q[1], r, 0, TAU); x.fill(); };
        const inGrave = [];
        for (const b of BEADS) { const p = beadAt(b, t); if (!p || t > b.tFloor) continue; if (p[1] < Y1) inGrave.push(p); else ball(p); }
        if (inGrave.length) { x.save(); if (RV.holePath(x, c, Y1 + .003)) { x.clip(); inGrave.forEach(ball); } x.restore(); }
        clods(x, c, t);
        const cy = cupAt(t)[1], under = cy < Y1;
        if (under) { if (cy + .08 < Y1) { x.save(); if (RV.holePath(x, c, Y1 + .003)) { x.clip(); chasedCup(x, c, t); } x.restore(); } else chasedCup(x, c, t); }
        runner(x, c, t);
        if (!under) chasedCup(x, c, t);
    }
  }
  function glows(c, cm, t, o = {}) {
    const st = { cups: cupState(t), grave: graveK(t) };
    {
        motes(c, cm, t); dust(c, cm, t);
        st.cups.forEach((s, i) => { const k = s.lit - .15; if (k <= .02) return; const q = cm.proj(RV.rimOf(i)); if (q) RV.glow(c, q[0], q[1], .5 * q[3], '#e8eeff', .55 * k); });
        const above = ss(Y1 - .1, Y1 + .4, cm.pos[1]), inG = p => above * ss(0, .25, Y1 - p[1]), depth = p => Math.max(0, Y1 - p[1]);
        const inMouth = fn => { c.save(); if (RV.holePath(c, cm, Y1 + .003)) { c.clip(); fn(); } c.restore(); };
        const coreB = (b, p, k) => { const q = cm.proj(p); if (!q) return; const fade = t > b.tFloor ? 1 - ss(b.tFloor, b.tFloor + .5, t) : 1; RV.glow(c, q[0], q[1], Math.max(4, .09 * q[3]), '#f2f6ff', .8 * fade * k); };
        const down = [];
        for (const b of BEADS) {
          const p = beadAt(b, t); if (!p) continue; const q = cm.proj(p); if (!q) continue; const d = depth(p), k = inG(p), fade = t > b.tFloor ? 1 - ss(b.tFloor, b.tFloor + .5, t) : 1;
          RV.glow(c, q[0], q[1], Math.max(6, .16 * q[3] * (1 + .9 * d)), '#e4ecff', .6 * fade * (1 - .45 * ss(0, 1.2, d)));
          if (k < 1) coreB(b, p, 1 - k); if (k > 0) down.push([b, p, k]);
        }
        if (down.length) inMouth(() => down.forEach(([b, p, k]) => coreB(b, p, k)));
        const gk = st.grave; if (gk > .01) { const q = cm.proj([GX, Y1 - .2, GZ]); if (q) RV.glow(c, q[0], q[1], Math.min(1.3 * q[3], 2 * W), '#dfe8ff', .35 * gk * ss(.4, 1.6, q[2]), .5); }
        if (cupSeen(t) && !o.noCup) {
          const p = cupAt(t), q = cm.proj([p[0], p[1] + .06, p[2]]);
          if (q) {
            const deep = ss(T_HIM, DUR, t), r = clamp(.9 * q[3], 26, 160), k = inG(p), d = depth(p);
            RV.glow(c, q[0], q[1], r * 1.5 * (1 + .45 * d), '#f0f4ff', (.3 + .25 * deep) * (1 - .3 * ss(0, 1.5, d)));
            const core = a => RV.glow(c, q[0], q[1], r * .45, '#ffffff', (.5 + .3 * deep) * a);
            if (k < 1) core(1 - k); if (k > 0) inMouth(() => core(k));
          }
        }
    }
  }
  function frame(ctx, t, cam, o = {}) {
    const st = stateAt(t);
    RV.frame(ctx, LB, cam, { ...st, b1: (x, c) => b1(x, c, t), glows: (c, cm) => glows(c, cm, t) });
    if (!o.noText) {
      F.impact(LB, ctx, t, { lines: [{ text: '1 · CHEMICAL', t0: T_FIRST, size: M45 ? 92 : 112, color: '#eef2ff' }], x: .5, y: M45 ? .13 : .15, out: T_HE - .35, accent: '#cfdcff' });
    }
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-34', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .15, type: 'whoosh', f0: 150, f1: 70, dur: 1.6, g: .06 },
      { t: T_FIRST, type: 'impact', size: .3, g: .22, noSnap: true },
      { t: T_CHEM, type: 'shimmer', g: .05 },
      { t: T_LABELED - .2, type: 'flutter', g: .05 },
      { t: T_OPP - .2, type: 'whoosh', f0: 300, f1: 180, dur: .7, g: .04 },
      { t: T_OPP, type: 'flutter', g: .07 },
      { t: T_OPP + .45, type: 'tick', g: .07 },
      ...BEADS.map(b => ({ t: b.tL, type: 'tick', g: .035, noSnap: true })),
      ...BEADS.map(b => ({ t: b.tLand, type: 'drip', g: .04, noSnap: true })),
      ...BEADS.map((b, i) => ({ t: b.tFloor, type: 'clink', f: 2600 - 90 * i, g: .07 - .004 * i, noSnap: true })),
      { t: T_PAY, type: 'riser', dur: 1.1, f0: 300, f1: 700, g: .04 },
      { t: T_HARDER - .4, type: 'lib', dur: T_STOP - T_HARDER + .6, label: 'SLOW-MOTION RUN: deep muffled footfalls, one man; slow heavy breathing' },
      ...FALLS.filter(fl => fl.ts > 9.3 && fl.ts < T_STOP + .3).map(fl => ({ t: fl.ts, type: 'thud', g: .12, noSnap: true })),
      ...[10.0, 11.0, 11.9, 12.6, 13.2].map(s => ({ t: s, type: 'heartbeat', g: .14 })),
      { t: T_FASTER, type: 'riser', dur: 1.6, g: .12 },
      { t: T_CLAIMED, type: 'crack', g: .08 }, { t: T_CLAIMED + .1, type: 'rumble', dur: .9, g: .1 },
      { t: T_HIM + .05, type: 'plunge', g: .12 },
      { t: T_HIM + .3, type: 'whoosh', f0: 200, f1: 55, dur: 1.2, g: .08 },
    ],
    api: { DUR, camAt, keyAt, stateAt, cupAt, frame, b1, glows, chasedCup },
  });
})();
