(function () {
  'use strict';
  const F = FILM, RV = F.reversal, AR = F.army, S3 = F.stage3d, Q = F.qin, Mo = F.motion, { clamp, smooth, lerp, easeIO, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-40'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H), FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2], PI = Math.PI;
  const A39 = () => F.getScene('seq-39').api, D39 = () => A39().DUR;
  const hash = RV.hash, PL = RV.plain, CUP = RV.CUP, CUPM = RV.CUPM;

  const T_SWALLOWED = 0.65, T_BETRAYED = 1.14, T_HIM = 1.58;
  const T_EVERY2 = 2.17, T_BUILT = 2.91, T_KEPT = 3.22, T_PROMISE = 3.66;
  const T_IMM = 4.68, T_NEVER = 5.69, T_SALE = 6.26, T_CUP = 6.76;
  const T_PAID = 7.57, T_PRICE = 8.96, T_ONLY = 9.55, T_OWNED = 10.56, T_YEARS = 11.5, T_LEFT = 12.14;

  const FILL0 = .7, LR = 6.2 * .93 * Math.sqrt(FILL0);
  const T_IRIS = .85;
  const irisK = t => easeIO(clamp(t / T_IRIS));
  const fillAt = t => FILL0 * (1 - ss(T_HIM + .05, T_CUP - .25, t));
  const crackAt = t => clamp((t - T_BETRAYED) / .3);
  const partAt = t => easeIO(clamp((t - T_HIM) / .45));
  function cupDraw(x, cam, t, st) {
    const q = cam.proj(CUP); if (!q) return;
    const e = Math.atan2(cam.pos[1] - .7, Math.hypot(cam.pos[0] - CUP[0], cam.pos[2] - CUP[2])), elev = clamp(e, .08, PI / 2 - .001);
    const k = q[3] * CUPM, ce = Math.cos(elev), se = Math.max(.1, Math.sin(elev));
    const fill = fillAt(t), liquid = S3.mix('#5d6270', '#e4e9f2', .55 + .35 * (st.silver ?? .6));
    const o = { s: 1, elev, fill, liquid, k: .8, beads: [] };
    const R = 6.2, ry = R * se, rimY = -(.5 + 1.5) * ce - .3 * ce - 4.6 * ce, bowlB = -2.3 * ce;
    const cr = crackAt(t), pa = partAt(t);
    x.save(); x.translate(q[0], q[1]); x.scale(k, k);
    const shine = () => {
      if (fill < .03) return;
      const lr = R * .93 * Math.sqrt(fill), ly = rimY + (1 - fill) * 4.4 * ce, lry = lr * se;
      x.save(); x.beginPath(); x.ellipse(0, ly, lr, lry, 0, 0, TAU); x.clip();
      const gh = x.createRadialGradient(-.3 * lr, ly - .35 * lry, 0, -.3 * lr, ly - .35 * lry, .55 * lr); gh.addColorStop(0, 'rgba(255,255,255,.42)'); gh.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gh; x.fillRect(-lr, ly - lry, 2 * lr, 2 * lry);
      x.lineWidth = .22;
      for (const t0 of [.12, .42, .78]) { const u = (t - t0) / 1.3; if (u <= 0 || u >= 1) continue; x.strokeStyle = `rgba(255,255,255,${.5 * (1 - u)})`; x.beginPath(); x.ellipse(0, ly, lr * u, lry * u, 0, 0, TAU); x.stroke(); }
      x.restore();
    };
    if (cr <= 0) { Q.cup(x, o); shine(); }
    else {
      const Cp = [[1.0, rimY - ry - 3], [.75, rimY - ry * .1], [.45, rimY + ry * .97], [1.15, rimY + ry + 1.1], [.3, rimY + ry + 2.3], [.95, bowlB - 1.1], [.25, bowlB + .2], [.35, 3]];
      const g = .75 * pa, a = .035 * pa;
      for (const sg of [-1, 1]) {
        x.save(); x.beginPath(); Cp.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
        x.lineTo(sg * 30, 3); x.lineTo(sg * 30, rimY - ry - 3); x.closePath(); x.clip();
        x.translate(sg * g, 0); x.translate(sg * 3.4, 0); x.rotate(sg * a); x.translate(-sg * 3.4, 0);
        Q.cup(x, o); x.restore();
      }
      const n = Cp.length - 2, upto = 2 + (n - 2) * cr,
      flare = bump(t, T_HIM - .03, T_HIM + .03, T_HIM + .1, T_HIM + .45);
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = pa < .5 ? `rgba(255,236,200,${.85 * (1 - 2 * pa) + .15 * flare})` : `rgba(6,5,16,${.8 * (2 * pa - 1)})`; x.lineWidth = .07 + .08 * flare + .05 * pa;
      x.beginPath(); for (let i = 2; i <= Math.floor(upto); i++) { const p = Cp[i]; i === 2 ? x.moveTo(p[0], p[1]) : x.lineTo(p[0], p[1]); }
      const fi = Math.floor(upto), fr = upto - fi; if (fi < n) { const a0 = Cp[fi], b0 = Cp[fi + 1]; x.lineTo(lerp(a0[0], b0[0], fr), lerp(a0[1], b0[1], fr)); }
      x.stroke();
      const th = ss(T_HIM + .1, T_HIM + .5, t) * (1 - ss(T_CUP - .6, T_CUP - .1, t));
      if (th > .01) { x.strokeStyle = `rgba(232,238,250,${.75 * th})`; x.lineWidth = .1; x.beginPath(); x.moveTo(.6, bowlB + .2); x.quadraticCurveTo(.9, bowlB * .4, .7, 0); x.stroke(); }
    }
    x.restore();
  }

  const RIDGE = az => 34 * (.35 + .65 * (F.noise1(az * 7 + 520, 3) + 1) / 2);
  function wall(x, cam, st) {
    const lit = st.built || 0, half = Math.atan(W / 2 / cam.f) + .3, Rd = 520, run = st.runW ?? -1;
    const pts = [];
    for (let i = 0; i <= 140; i++) { const az = cam.yaw - half + 2 * half * i / 140, h = RIDGE(az) + 1.2, p = cam.proj([cam.pos[0] + Rd * Math.sin(az), h, cam.pos[2] + Rd * Math.cos(az)]); if (p) pts.push([p[0], p[1], az, p[3]]); }
    if (pts.length < 2) return;
    x.fillStyle = '#080718'; x.beginPath(); pts.forEach((p, i) => { const hh = 7 * p[3]; i ? x.lineTo(p[0], p[1] - hh) : x.moveTo(p[0], p[1] - hh); }); for (let i = pts.length - 1; i >= 0; i--) x.lineTo(pts[i][0], pts[i][1] + 2); x.closePath(); x.fill();
    for (const p of pts) { const tw = Math.round(p[2] / .035); if (Math.abs(p[2] - tw * .035) > .004) continue; const hh = 14 * p[3], ww = 9 * p[3]; x.fillRect(p[0] - ww / 2, p[1] - hh, ww, hh); }
    if (lit > .01) {
      x.strokeStyle = `rgba(255,206,120,${.75 * lit})`; x.lineWidth = 1.6; x.beginPath(); pts.forEach((p, i) => { const hh = 7 * p[3]; i ? x.lineTo(p[0], p[1] - hh) : x.moveTo(p[0], p[1] - hh); }); x.stroke();
      if (run > -1 && run < 2) for (const p of pts) { const u = (p[0] / W - run); if (Math.abs(u) > .12) continue; const g = Math.exp(-u * u / .003); x.fillStyle = `rgba(255,226,160,${.8 * g * lit})`; x.fillRect(p[0] - 2, p[1] - 7 * p[3] - 2, 4, 4); }
    }
  }
  const ROADS = [[-9, -60], [4, 30], [16, 140]];
  function roads(x, cam, st) {
    const lit = st.built || 0;
    for (const [x0, x1] of ROADS) {
      const P = [], w2 = 2.2, z0 = 5, z1 = 520;
      const at = z => lerp(x0, x1, (z - z0) / (z1 - z0));
      if (!S3.poly(x, cam, [[at(z0) - w2, .003, z0], [at(z1) - w2, .003, z1], [at(z1) + w2, .003, z1], [at(z0) + w2, .003, z0]])) continue;
      const a = cam.proj([at(z0), 0, z0]), b = cam.proj([at(z1), 0, z1]);
      if (a && b) { const g = x.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, S3.mix('#100e28', '#3a3060', lit)); g.addColorStop(1, S3.mix('#16123a', '#6e5674', lit)); x.fillStyle = g; } else x.fillStyle = '#1a1638';
      x.fill();
    }
  }
  const ARMY = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 13; c++) ARMY.push([-21 + c * 1.6 + (r % 2) * .8, 15 + r * 2.4, (r * 5 + c * 3) % 8]);
  function army(x, cam, st) {
    const P = LB.P, fy = cam.yawOf(-PI / 2);
    let yaw = fy; while (yaw > PI) yaw -= TAU; while (yaw < -PI) yaw += TAU;
    const ya = clamp(Math.abs(yaw), 0, 1.6), yb = Math.round(ya / 1.6 * 31);
    for (let i = ARMY.length - 1; i >= 0; i--) {
      const [X, Z, v] = ARMY[i], q = cam.proj([X, 0, Z]); if (!q || q[0] < -50 || q[0] > W + 50) continue;
      const s = q[3] * S3.FIG, hpx = 92 * s; if (hpx < 2) continue;
      const sp = AR.sprite(v, yb, hpx > 110 ? 1 : 0, true, P);
      AR.stamp(x, sp, q[0], q[1], s / sp.sc);
    }
  }

  const CK = [-10.5, 3.4], POT = .62, SP0 = [CK[0] + .5, .6, CK[1] - .25], TIP = [CK[0] + 1.02, .55, CK[1] - .55], BAS = [TIP[0], TIP[2]], BAS_R = .4, WATER_Y = .26;
  const FALL = Math.sqrt(2 * (TIP[1] - WATER_Y) / 9.8), HANG = .16;
  const DROPS = (() => { const last = T_LEFT - FALL - HANG + .02, out = [last]; let dt = 1.35; while (out[0] - dt > -1) { out.unshift(out[0] - dt); dt = Math.max(.42, dt * .86); } return out; })();
  const rodTop = t => 2.95 - 1.15 * easeIO(clamp(t / (T_LEFT + .1)));
  function clock(x, cam, t, st) {
    const BR = '#7a5c38', BRD = '#4a3822', ink = '#05040e', light = (() => { const v = [.2, .55, 1], l = Math.hypot(...v); return v.map(c => c / l); })();
    const o = { col: BR, light, lo: .3, ink, dark: .72 };
    const legs = [90, 210, 330].map(a => [CK[0] + .42 * Math.cos(a * PI / 180), CK[1] + .42 * Math.sin(a * PI / 180)]).sort((a, b) => cam.depth([b[0], .3, b[1]]) - cam.depth([a[0], .3, a[1]]));
    for (const g of legs) S3.cyl(x, cam, g, .06, 0, .44, { ...o, col: BRD });
    const basinFar = cam.depth([BAS[0], .2, BAS[1]]) > cam.depth([CK[0], .9, CK[1]]);
    if (basinFar) basin(x, cam, t, o);
    S3.cyl(x, cam, CK, POT, .4, 1.6, { ...o, n: 40 });
    for (const y of [.46, 1.52]) S3.ring(x, cam, CK, POT + .015, y, y + .04, BRD);
    S3.cyl(x, cam, CK, POT + .03, 1.6, 1.68, { ...o, col: BRD });
    for (const dx of [-.26, .26]) S3.box(x, cam, { x0: CK[0] + dx - .03, x1: CK[0] + dx + .03, y0: 1.68, y1: 2.42, z0: CK[1] - .03, z1: CK[1] + .03 }, { ...o, col: BRD });
    S3.box(x, cam, { x0: CK[0] - .3, x1: CK[0] + .3, y0: 2.42, y1: 2.5, z0: CK[1] - .035, z1: CK[1] + .035 }, { ...o, col: BRD });
    const top = rodTop(t);
    S3.box(x, cam, { x0: CK[0] - .025, x1: CK[0] + .025, y0: 1.5, y1: top, z0: CK[1] - .025, z1: CK[1] + .025 }, { ...o, col: '#6a5236' });
    x.strokeStyle = '#120e08'; x.lineWidth = Math.max(1, cam.f / 1300); x.beginPath(); for (let y = top - .08; y > 1.7; y -= .08) S3.line(x, cam, [CK[0] - .03, y, CK[1] - .026], [CK[0] + .03, y, CK[1] - .026]); x.stroke();
    S3.bar(x, cam, SP0, TIP, .035, { ...o, lo: .3 });
    if (!basinFar) basin(x, cam, t, o);
  }
  const ring = (cx, cz, r, y, n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [cx + r * Math.cos(a), y, cz + r * Math.sin(a)]; });
  function basin(x, cam, t, o) {
    if (S3.poly(x, cam, ring(BAS[0], BAS[1], BAS_R, .3))) { x.fillStyle = '#1a140e'; x.fill(); }
    if (S3.poly(x, cam, ring(BAS[0], BAS[1], BAS_R - .03, WATER_Y))) {
      x.fillStyle = '#0d0c26'; x.fill(); x.save(); x.clip();
      for (const d of DROPS) { const age = t - (d + HANG + FALL), u = age / 1.6; if (age < 0 || u >= 1) continue; for (const kk of [1, .6]) { if (!S3.poly(x, cam, ring(BAS[0], BAS[1], .01 + .34 * u * kk, WATER_Y + .001))) continue; x.strokeStyle = `rgba(220,228,255,${.55 * (1 - u) * kk})`; x.lineWidth = Math.max(1, cam.f / 1500); x.stroke(); } }
      x.restore();
    }
    S3.cyl(x, cam, BAS, BAS_R, 0, .3, { ...o, cap: false, n: 30 });
    if (S3.poly(x, cam, ring(BAS[0], BAS[1], BAS_R, .3))) { x.strokeStyle = '#8a6a42'; x.lineWidth = Math.max(1, cam.f / 1100); x.stroke(); }
  }
  function drops(ctx, cam, t) {
    for (const d of DROPS) {
      const a = t - d; if (a < 0 || a >= HANG + FALL) continue;
      const u = Math.max(0, a - HANG), kk = Math.min(1, a / HANG), p = [TIP[0], TIP[1] - .012 - .012 * kk - 4.9 * u * u, TIP[2]], q = cam.proj(p); if (!q) continue;
      RV.glow(ctx, q[0], q[1], Math.max(4, .05 * q[3]), '#e8eeff', .7);
      ctx.fillStyle = 'rgba(236,242,255,.95)'; ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(1.4, (.008 + .007 * kk) * q[3]), 0, TAU); ctx.fill();
    }
  }

  const POOL = [CUP[0] + .35, CUP[2] - .55];
  function pool(ctx, cam, t) {
    const grow = ss(T_HIM + .4, T_HIM + 1.6, t), sink = ss(T_IMM - .3, T_SALE + .2, t), gone = 1 - ss(T_CUP - .1, T_CUP + 1.2, t);
    if (grow <= .01 || gone <= .01) return;
    const depth = 1.6 * sink, q = cam.proj([POOL[0], -depth, POOL[1]]), q0 = cam.proj([POOL[0], 0, POOL[1]]); if (!q || !q0) return;
    const elv = Math.max(.12, Math.sin(Math.atan2(cam.pos[1], Math.hypot(cam.pos[0] - POOL[0], cam.pos[2] - POOL[1])))), r = (.25 + .35 * grow + .6 * sink) * q[3];
    RV.glow(ctx, q[0], q[1], Math.min(W * .3, r * 1.6), '#b8c4ea', .45 * grow * gone * (1 - .45 * sink), elv);
    if (sink < .98) RV.glow(ctx, q0[0], q0[1], Math.min(W * .2, (.2 + .35 * grow) * q0[3]), '#eef2ff', .55 * grow * (1 - sink), elv * .9);
  }

  const MOTES = Array.from({ length: 60 }, (_, i) => [-3 + 6 * hash(i, 1), .15 + 1.7 * hash(i, 2), -2.2 + 4 * hash(i, 3), hash(i, 4)]);
  function motes(ctx, cam, t) {
    for (const [mx, my, mz, k] of MOTES) {
      const q = cam.proj([mx + .05 * t + .12 * Math.sin(t * .4 + k * 9), my + .05 * Math.sin(t * .3 + k * 7), mz]); if (!q || q[0] < -30 || q[0] > W + 30 || q[1] < -30 || q[1] > H + 30) continue;
      const r = clamp(.012 * q[3], 1, 7) * (q[2] < 2 ? 1.6 : 1);
      RV.glow(ctx, q[0], q[1], r * 3, '#dfe6ff', (.16 + .26 * k) * (.5 + .5 * Math.sin(t * 1.7 + k * 20)));
    }
  }

  function stateAt(t) {
    const built = ss(T_BUILT - .15, T_PROMISE + .2, t);
    return {
      horizon: .5 + .8 * built - .2 * ss(T_PAID, T_LEFT + .5, t), sheen: 1, cut: 0, shadow: 2.4, shadowA: 1,
      silver: .6 + .3 * bump(t, T_SWALLOWED - .2, T_SWALLOWED + .2, T_BETRAYED, T_HIM + .3) - .4 * ss(T_HIM, T_CUP, t), halo: 0,
      built, runW: t > T_KEPT - .1 && t < T_PROMISE + 1.2 ? lerp(-.15, 1.15, (t - T_KEPT + .1) / (T_PROMISE + 1.3 - T_KEPT)) : -1,
    };
  }

  const fk = M45 ? .82 : 1;
  let SPL = null;
  const KEYS = () => {
    const dc = A39().discAt(D39()), f0 = 1100 * fk, h0 = LR * CUPM * f0 / dc[2], top = [CUP[0], h0, CUP[2] - .001];
    const C0 = [CUP[0], .76, CUP[2]], E1 = [-1.7, 1.15, -2.9], dH = (() => { const v = [E1[0] - C0[0], E1[2] - C0[2]], l = Math.hypot(...v); return [v[0] / l, v[1] / l]; })();
    const R1 = Math.hypot(E1[0] - C0[0], E1[1] - C0[1], E1[2] - C0[2]), el1 = Math.asin((E1[1] - C0[1]) / R1);
    const arc = (k, f) => { const el = lerp(1.535, el1, 1 - (1 - k) ** 1.12), R = lerp(h0 - C0[1], R1, k); return [.5 + k * (T_HIM + .8 - .5), [C0[0] + R * Math.cos(el) * dH[0], C0[1] + R * Math.sin(el), C0[2] + R * Math.cos(el) * dH[1]], [0, lerp(.2, .78, Math.sqrt(k)), 2.6], f]; };
    return [
      [-.4, [top[0], top[1] * .985, top[2]], [CUP[0], 0, CUP[2]], f0], [0, top, [CUP[0], 0, CUP[2]], f0],
      arc(0, f0), arc(.25, 1060 * fk), arc(.5, 1120 * fk), arc(.75, 1190 * fk), arc(1, 1250 * fk),
      [T_PROMISE + .3, [-3.6, 2.0, -4.6], [2.0, 2.4, 40], 1150 * fk],
      [T_SALE, [-.7, 2.25, -1.2], [0, .95, 2.6], 1300 * fk],
      [T_CUP + .25, [-.9, 2.15, -1.3], [-.1, .95, 2.6], 1300 * fk],
      [T_PRICE, [-11.0, 1.75, -2.2], [-10.1, 1.15, 3.2], 1250 * fk],
      [T_LEFT, [-10.35, 1.3, -.1], [-9.7, .62, 3.0], 1350 * fk],
      [DUR + .8, [-10.3, 1.27, .05], [-9.7, .6, 3.0], 1360 * fk],
    ];
  };
  const keyAt = F.stage3d.calm(t => { if (!SPL) { const K = KEYS(), ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])])); SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) }; } return { e: SPL.e.map(f => f(t)), g: SPL.g.map(f => f(t)), f: Math.exp(SPL.f(t)) }; }, DUR);
  const camAt = t => { const k = keyAt(t); return RV.cam(k.e, k.g, k.f, W, H); };

  function world(ctx, t, cam) {
    const st = stateAt(t), sv = F.SHIFT;
    LB.background(ctx);
    LB.sheet(ctx, ID, 1, RC, x => { if (sv) x.translate(sv.x * .4, sv.y * .4); PL.sky(x, cam, st); wall(x, cam, st); }, { rim: false, shadow: false, fibre: .25 });
    LB.sheet(ctx, ID, 1, RC, x => { PL.farGround(x, cam, st); PL.nearGround(x, cam, st); PL.sheen(x, cam, st); roads(x, cam, st); PL.cupShadow(x, cam, st, -400); }, { rim: false, shadow: false, fibre: .3 });
    LB.sheet(ctx, ID, 1, RC, x => army(x, cam, st), { rimColor: '#ffcf8a', rimAlpha: .25 + .55 * st.built, glow: .08 + .3 * st.built, glowColor: '#ffae4a', glowBlur: 10, fibre: .25 });
    LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; clock(x, cam, t, st); }, { rimColor: '#ffc27a', rimAlpha: .45, glow: .12, glowColor: '#ffae4a', glowBlur: 10, fibre: .3 });
    LB.sheet(ctx, ID, 1, RC, x => cupDraw(x, cam, t, st), { rimColor: '#ffd9a0', rimAlpha: .6, glow: .25, glowColor: '#ffae4a', glowBlur: 14, fibre: .25 });
    const sh = sv || { x: 0, y: 0 };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    const c = RV.cupAt(cam, 1.15); if (c) {
      RV.glow(ctx, c[0], c[1], Math.min(W * .35, 1.1 * c[3]), '#e8eeff', .22 * st.silver);
      const fl = bump(t, T_HIM - .03, T_HIM + .03, T_HIM + .08, T_HIM + .35); if (fl > .01) RV.glow(ctx, c[0] + .05 * c[3], c[1] + .25 * c[3], Math.min(W * .15, .5 * c[3]), '#fff4dc', .7 * fl);
      const rimL = bump(t, T_CUP - .12, T_CUP + .12, T_CUP + .4, T_CUP + 1.1); if (rimL > .01) RV.glow(ctx, c[0], c[1] + .1 * c[3], Math.min(W * .3, 1.3 * c[3]), '#ffd9a0', .3 * rimL, .3);
    }
    pool(ctx, cam, t); drops(ctx, cam, t); motes(ctx, cam, t);
    ctx.restore();
  }

  const BUF = new Map(), buf = () => { const key = W + 'x' + H; if (!BUF.has(key)) BUF.set(key, F.canvas(W, H)); return BUF.get(key); };
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function frame(ctx, t, cam, o = {}) {
    const ki = irisK(t), DIAG = Math.hypot(W, H);
    if (ki < 1) {
      const t39 = D39() + t, dc = A39().discAt(t39);
      A39().frame(ctx, t39, A39().camAt(t39), { noGrade: true });
      if (ki > 0 && dc) {
        const r = ki * Math.max(DIAG, dc[2] * 1.05), [cv, x] = buf(); clean(x); world(x, t, cam);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.arc(dc[0], dc[1], r, 0, TAU); ctx.clip(); ctx.drawImage(cv, 0, 0); ctx.restore();
      }
      if (!o.noGrade) FL.grade(ctx, GT0 + t);
    } else {
      world(ctx, t, cam);
      if (!o.noGrade) LB.grade(ctx, GT0 + t);
    }
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-40', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'whoosh', f0: 300, f1: 120, dur: .9, g: .05 }, { t: .3, type: 'shimmer', g: .05 },
      { t: T_BETRAYED, type: 'crack', g: .1 }, { t: T_HIM + .02, type: 'clunk', f: 300, g: .1, noSnap: true },
      { t: T_HIM + .3, type: 'hiss', dur: 1.4, g: .03 },
      { t: T_BUILT - .1, type: 'riser', dur: .9, f0: 160, f1: 420, g: .05 }, { t: T_BUILT + .3, type: 'hum', dur: 2.2, g: .05 },
      { t: T_KEPT, type: 'shimmer', g: .05 },
      { t: T_IMM - .1, type: 'whoosh', f0: 180, f1: 70, dur: 1.2, g: .05 },
      { t: T_CUP, type: 'clink', f: 1500, g: .05, noSnap: true },
      { t: T_PAID - .05, type: 'whoosh', f0: 140, f1: 90, dur: 1.1, g: .04 },
      ...DROPS.filter(d => d + HANG + FALL > 0 && d + HANG + FALL < DUR).map(d => ({ t: d + HANG + FALL, type: 'drip', g: .1, noSnap: true })),
    ],
    api: { DUR, camAt, keyAt, stateAt, frame },
  });
})();
