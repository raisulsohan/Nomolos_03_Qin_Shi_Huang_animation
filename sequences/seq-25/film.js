(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-25'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const A24 = () => F.getScene('seq-24').api;

  const T_SIMA = 0.75, T_RESP = 2.23, T_FOUR = 3.25, T_SIXTY = 4.1, T_SCH = 4.4;
  const T_BUR = 4.88, T_ALIVE = 5.24, T_CAP = 5.84, T_ATR = 6.79, T_ALONG = 7.86;
  const T_INF = 8.67, T_BURN = 9.2, T_BOOKS = 9.81;

  const TZ0 = 18, TZ1 = 160, TW = 2.2, TD = 2.5;
  const EDGE = 2.6, NPER = 230, GAP = (TZ1 - 2 - TZ0 - 1) / (NPER - 1);
  const FIRE = [-13, 126];
  const INK = '#06050f', NIGHT = '#07061a';
  const bare = (who, ink) => ({ ...Q.silhouette(who, ink), hat: null });
  const VARS = [Q.silhouette('minister', INK), Q.silhouette('alchemist', INK), bare('minister', INK)];
  const MEN = [];
  for (const sg of [1, -1]) for (let i = 0; i < NPER; i++) {
    const k = MEN.length, z = TZ1 - 2 - i * GAP + (hash(k, 1) - .5) * .12;
    MEN.push({ x: sg * (EDGE + (hash(k, 2) - .5) * .16), z, sg, v: Math.floor(hash(k, 3) * 3), bow: .03 + .07 * hash(k, 4), ts: T_BUR + .02 + (TZ1 - z) / (TZ1 - TZ0) * .95 + .08 * hash(k, 5), k });
  }
  const sinkOf = (m, t) => ss(m.ts, m.ts + .5, t);
  const BRUSH = [];
  for (let j = 0; j < 115; j++) for (const X of [-1.5, -.5, .5, 1.5]) { const k = BRUSH.length, z = TZ1 - 1.4 - j * .945 + (hash(k, 7) - .5) * .2; BRUSH.push({ x: X + (hash(k, 8) - .5) * .25, z, lean: (hash(k, 9) - .5) * .12, h: 1.35 + .25 * hash(k, 10), tb: T_CAP - .15 + (TZ1 - z) / (TZ1 - TZ0) * .75 + .05 * hash(k, 11) }); }
  const fillAt = (z, t) => ss(T_CAP - .5 + (TZ1 - z) / (TZ1 - TZ0) * .6, T_CAP - .1 + (TZ1 - z) / (TZ1 - TZ0) * .6, t);
  const fireK = t => 1 + .9 * ss(T_BURN - .1, T_BURN + .5, t) - .2 * ss(T_BOOKS + .4, DUR + 1, t);

  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const K = [
      [-.3, [8.2, 2.3, 168.5], [-2, 2.0, 120], 1250],
      [T_RESP, [8.6, 2.6, 168.8], [-2, 2.2, 118], 1250],
      [T_FOUR + .2, [9.4, 3.6, 169.6], [-2, 1.4, 116], 1240],
      [T_BUR, [10.2, 4.4, 170.5], [-2, .9, 114], 1230],
      [T_CAP, [11, 5.0, 171.5], [-2.4, .6, 112], 1225],
      [T_ATR, [12.4, 6.4, 172], [-3.5, .4, 106], 1215],
      [T_ALONG, [13, 8.2, 172.5], [-7, .2, 104], 1210],
      [T_BURN, [11.6, 9.0, 173], [-8.5, .1, 104], 1200],
      [DUR, [10.9, 9.4, 173.4], [-9, .1, 103], 1190],
      [DUR + 1, [10.6, 9.5, 173.7], [-9.2, .1, 103], 1185]];
    if (M45) K.forEach(k => { k[1] = [k[1][0] * .6, k[1][1] + 1.5, k[1][2] + 4]; k[2] = [k[2][0] * .6, k[2][1] - 1, k[2][2]]; k[3] *= .98; });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    let yaw = Math.atan2(d[0], d[2]); if (yaw < 0) yaw += TAU;
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: Math.exp(S.f(t)), W, H, near: .05 });
  }

  const quad = (x, cam, P, col) => { if (S3.poly(x, cam, P)) { x.fillStyle = col; x.fill(); return true; } return false; };
  function lit(x, cam, p, r, stops) {
    const q = cam.proj(p); if (!q) { x.fillStyle = stops[stops.length - 1][1]; x.fill(); return; }
    const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], Math.max(1, r * q[3])); stops.forEach(([k, c]) => g.addColorStop(k, c)); x.fillStyle = g; x.fill();
  }

  function ground(x, cam, t) {
    if (S3.poly(x, cam, [[-400, 0, -60], [400, 0, -60], [400, 0, 420], [-400, 0, 420]])) lit(x, cam, [FIRE[0], 0, FIRE[1]], 75 * Math.sqrt(fireK(t)), [[0, '#6a3a2a'], [.18, '#4a2a2a'], [.45, '#24182a'], [1, '#09081a']]);
    quad(x, cam, [[-400, .01, 1.4], [400, .01, 1.4], [400, .01, 8.8], [-400, .01, 8.8]], '#1a1426');
  }
  function trench(x, cam, t) {
    const fk = fireK(t);
    x.save(); if (!S3.poly(x, cam, [[-TW, 0, TZ0], [TW, 0, TZ0], [TW, 0, TZ1], [-TW, 0, TZ1]])) { x.restore(); return; } x.clip();
    quad(x, cam, [[-TW, -TD, TZ0], [TW, -TD, TZ0], [TW, -TD, TZ1], [-TW, -TD, TZ1]], '#05040c');
    for (const sg of [1, -1]) { const X = sg * TW, n = [-sg, 0, 0]; if (S3.facing(cam, [X, -1, 100], n) && S3.poly(x, cam, [[X, 0, TZ0], [X, 0, TZ1], [X, -TD, TZ1], [X, -TD, TZ0]])) lit(x, cam, [X, 0, FIRE[1]], 40, [[0, sg < 0 ? '#4a2c24' : '#5a3426'], [1, '#120c1c']]); }
    for (const [Z, n] of [[TZ0, [0, 0, 1]], [TZ1, [0, 0, -1]]]) if (S3.facing(cam, [0, -1, Z], n)) quad(x, cam, [[-TW, 0, Z], [TW, 0, Z], [TW, -TD, Z], [-TW, -TD, Z]], '#1e1420');
    x.restore();
    const N = 44;
    for (let i = 0; i < N; i++) {
      const z1 = TZ1 - (TZ1 - TZ0) * i / N, z0 = TZ1 - (TZ1 - TZ0) * (i + 1) / N, k = fillAt((z0 + z1) / 2, t); if (k <= 0) continue;
      const y = -TD + (TD + .12) * k;
      if (S3.poly(x, cam, [[-TW, y, z0], [TW, y, z0], [TW, y, z1], [-TW, y, z1]])) { x.fillStyle = S3.mix('#3a2a26', '#6a4632', .35 * Math.min(1, fk - .2) * clamp(1 - (FIRE[1] - (z0 + z1) / 2) ** 2 / 4000)); x.fill(); }
    }
  }

  const STS = 2.2, SW0 = 70, SH0 = 128, FOOT = 112;
  let STAMPS = null;
  function stamps() {
    if (STAMPS) return STAMPS;
    STAMPS = [];
    for (let v = 0; v < 3; v++) for (const yaw of [0, Math.PI]) {
      const [cv, cx] = F.canvas(Math.round(SW0 * STS), Math.round(SH0 * STS));
      cx.translate(SW0 * STS / 2, FOOT * STS); cx.scale(STS, STS);
      Q.draw(cx, LB.P, { ...Q.bowStand({ bow: .06 }), yaw }, VARS[v], { tilt: .08, robe: 44, shadow: 0 });
      Q.draw(cx, LB.P, { ...Q.bowStand({ bow: .06 }), yaw }, VARS[v], { tilt: .08, robe: 44, shadow: 0 });
      STAMPS.push(cv);
    }
    return STAMPS;
  }
  function men(x, cam, t) {
    const S = stamps(), list = [];
    for (const m of MEN) { const u = sinkOf(m, t); if (u >= 1) continue; const d = cam.depth([m.x, 1, m.z]); if (d < 1) continue; list.push({ m, u, d }); }
    list.sort((a, b) => b.d - a.d);
    for (const { m, u } of list) {
      const xin = m.x - m.sg * 1.1 * smooth(u), drop = 2.6 * u * u, p = cam.proj([xin, -drop, m.z]), g = cam.proj([xin, 0, m.z]); if (!p || !g) continue;
      if (p[0] < -200 || p[0] > W + 200) continue;
      const sc = p[3] * S3.FIG, yawF = m.sg > 0 ? Math.PI : 0;
      const fig = cam.yawOf(yawF === 0 ? 0 : Math.PI), facesRight = Math.cos(fig) > 0;
      if (sc > 1.9) {
        x.save(); x.beginPath(); x.rect(-W, -H, 3 * W, g[1] + H + 1); x.clip(); x.translate(p[0], p[1]); x.scale(sc, sc);
        const pose = { ...Q.bowStand({ bow: m.bow }), yaw: fig, lean: .02 + .006 * Math.sin(t * 1.4 + m.k) };
        for (let i = 0; i < 2; i++) Q.draw(x, LB.P, pose, VARS[m.v], { tilt: .1, robe: 44, shadow: 0 });
        x.restore(); continue;
      }
      const st = S[m.v * 2 + (facesRight ? 0 : 1)], k = sc / STS, rows = Math.max(0, (FOOT * STS) - (p[1] - g[1]) / k);
      if (rows <= 1) continue;
      x.drawImage(st, 0, 0, st.width, rows, p[0] - st.width / 2 * k, p[1] - FOOT * STS * k, st.width * k, rows * k);
    }
  }
  function dust(ctx, cam, t) {
    const sh = SH(); ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    for (const m of MEN) {
      const a = bump(t, m.ts + .15, m.ts + .35, m.ts + .6, m.ts + 1.3); if (a <= .01) continue;
      const q = cam.proj([m.x - m.sg * .9, .3 + .5 * ss(m.ts, m.ts + 1.3, t), m.z]); if (!q) continue;
      const r = Math.max(2, .7 * q[3]), g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, `rgba(120,96,110,${.35 * a})`); g.addColorStop(1, 'rgba(120,96,110,0)');
      ctx.fillStyle = g; ctx.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r);
    }
    ctx.restore();
  }
  function brushes(x, cam, t) {
    const list = [];
    for (const b of BRUSH) { const u = ss(b.tb, b.tb + .45, t); if (u <= 0) continue; const d = cam.depth([b.x, .5, b.z]); if (d < .8) continue; list.push({ b, u, d }); }
    list.sort((a, b) => b.d - a.d);
    for (const { b, u } of list) {
      const hh = b.h * u, top = [b.x + b.lean * hh, .12 + hh, b.z], base = [b.x, .12, b.z], P = cam.proj(base), T = cam.proj(top); if (!P || !T) continue;
      const k = P[3], wd = Math.max(.7, .022 * k), tl = Math.min(hh, .34), tip0 = cam.proj([b.x + b.lean * (hh - tl), .12 + hh - tl, b.z]);
      const lightK = clamp(1 - Math.hypot(b.x - FIRE[0], b.z - FIRE[1]) / 90);
      x.strokeStyle = S3.mix('#5a4636', '#e0b878', .25 + .6 * lightK); x.lineWidth = wd * 2; x.lineCap = 'butt';
      x.beginPath(); x.moveTo(P[0], P[1]); x.lineTo(tip0[0], tip0[1]); x.stroke();
      if (wd > 1.2) { x.strokeStyle = 'rgba(255,190,120,.35)'; x.lineWidth = Math.max(.6, wd * .6); x.beginPath(); x.moveTo(P[0] + wd * .5, P[1]); x.lineTo(tip0[0] + wd * .5, tip0[1]); x.stroke(); }
      const dx = T[0] - tip0[0], dy = T[1] - tip0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, bw = wd * 1.9;
      x.fillStyle = '#100a0e'; x.beginPath(); x.moveTo(tip0[0] + nx * bw, tip0[1] + ny * bw); x.quadraticCurveTo(tip0[0] + dx * .55 + nx * bw * 1.2, tip0[1] + dy * .55 + ny * bw * 1.2, T[0], T[1]);
      x.quadraticCurveTo(tip0[0] + dx * .55 - nx * bw * 1.2, tip0[1] + dy * .55 - ny * bw * 1.2, tip0[0] - nx * bw, tip0[1] - ny * bw); x.closePath(); x.fill();
      if (wd > 1) { x.strokeStyle = '#c9a24a'; x.lineWidth = Math.max(.8, wd * .7); x.beginPath(); x.moveTo(tip0[0] + nx * bw, tip0[1] + ny * bw); x.lineTo(tip0[0] - nx * bw, tip0[1] - ny * bw); x.stroke(); }
    }
  }
  const ROLLS = (() => { const R = F.rng(2525), o = []; for (let i = 0; i < 44; i++) { const a = R() * TAU, r = 2.6 * Math.sqrt(R()), y = .2 + 1.4 * (1 - r / 2.6) * R(); o.push({ c: [FIRE[0] + r * Math.cos(a), y, FIRE[1] + r * Math.sin(a)], ang: R() * Math.PI, len: .6 + .35 * R(), open: R() < .35 }); } return o; })();
  function heap(x, cam, t) {
    const fk = fireK(t);
    S3.shadow(x, cam, FIRE, 4, 4, .5);
    ROLLS.map(r => ({ r, d: cam.depth(r.c) })).sort((a, b) => b.d - a.d).forEach(({ r }) => {
      const a = [r.c[0] - Math.cos(r.ang) * r.len / 2, r.c[1], r.c[2] - Math.sin(r.ang) * r.len / 2], b = [r.c[0] + Math.cos(r.ang) * r.len / 2, r.c[1], r.c[2] + Math.sin(r.ang) * r.len / 2];
      S3.bar(x, cam, a, b, .13, { col: S3.mix('#3a2418', '#c86a2a', .3 * fk * hash(r.len * 100, 1)), light: [0, 1, 0], lo: .3, ink: '#05040a', n: 8 });
      if (r.open) { const p = cam.proj(r.c); if (p) { x.strokeStyle = `rgba(255,140,60,${.4 * fk})`; x.lineWidth = Math.max(1, .02 * p[3]); x.beginPath(); S3.line(x, cam, a, b); x.stroke(); } }
    });
  }
  const SPARKS = (() => { const R = F.rng(9113), o = []; for (let i = 0; i < 70; i++) o.push({ t0: R() * 3, x: (R() - .5) * 2.4, z: (R() - .5) * 2.4, dx: (R() - .5) * 1.4, v: 1.6 + 2.2 * R(), life: 1.3 + 1.3 * R() }); return o; })();
  function flames(ctx, cam, t) {
    const fk = fireK(t), sh = SH(), q0 = cam.proj([FIRE[0], .9, FIRE[1]]); if (!q0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    PR.glow(ctx, q0[0], q0[1], 7 * q0[3] * Math.sqrt(fk), '#ff8a3a', .32 * Math.min(1.5, fk), 'flat');
    for (let i = 0; i < 9; i++) {
      const ph = t * (2.1 + .37 * i) + i * 1.7, rr = i ? 1.9 : 0, fx = FIRE[0] + rr * Math.cos(i * 2.39), fz = FIRE[1] + rr * .8 * Math.sin(i * 2.39), b = cam.proj([fx, .9, fz]); if (!b) continue;
      const hgt = (i ? 2.2 : 3.4) * (1 + .3 * Math.sin(ph) + .2 * Math.sin(ph * 2.3)) * fk * b[3], wd = (.7 + .12 * Math.sin(ph * 1.7)) * b[3] * Math.sqrt(fk), sway = .25 * wd * Math.sin(ph * 1.3);
      for (const [s, c] of [[1, '#e0461e'], [.7, '#ff9a32'], [.38, '#ffe3a0']]) {
        ctx.fillStyle = c; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(b[0] - wd * s, b[1]);
        ctx.quadraticCurveTo(b[0] - wd * s * 1.1, b[1] - hgt * s * .5, b[0] + sway, b[1] - hgt * s); ctx.quadraticCurveTo(b[0] + wd * s * 1.1, b[1] - hgt * s * .5, b[0] + wd * s, b[1]); ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
    const burst = 1 + 2 * bump(t, T_BURN - .05, T_BURN + .3, T_BOOKS + .2, DUR + .8);
    for (const s of SPARKS) {
      const life = s.life / Math.sqrt(burst), u = ((t - s.t0) % life + life) % life / life, p = cam.proj([FIRE[0] + s.x + s.dx * u * burst, 1 + s.v * 3 * u * Math.sqrt(burst), FIRE[1] + s.z]); if (!p) continue;
      const r = Math.max(1.2, .05 * p[3]); ctx.fillStyle = `rgba(255,${150 + 90 * (1 - u) | 0},70,${(1 - u) * .9})`; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  const N460 = { x: M45 ? .75 : .74, y: M45 ? .13 : .2, size: M45 ? 128 : 170, col: '#d6402e' };
  function num(ctx, t) {
    if (t < T_FOUR) return; const sh = SH(), txt = '460', font = `900 ${N460.size}px NSC`;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const ws = [...txt].map(ch => ctx.measureText(ch).width), tr = N460.size * .04, tw = ws.reduce((a, b) => a + b, 0) + tr * 2;
    let xx = N460.x * W - tw / 2; const y = N460.y * H + N460.size * .36;
    [...txt].forEach((ch, i) => {
      const k = clamp((t - (T_FOUR + i * .12)) / .22); if (k <= 0) { xx += ws[i] + tr; return; }
      const e = 1 - Math.pow(1 - k, 3), s = 1 + 1.1 * (1 - e), mid = xx + ws[i] / 2;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 2.5); ctx.translate(mid, y); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText(ch, -ws[i] / 2 + 4, 5); ctx.fillStyle = N460.col; ctx.fillText(ch, -ws[i] / 2, 0); ctx.restore();
      xx += ws[i] + tr;
    });
    ctx.restore();
  }

  const t24 = t => A24().DUR + 2 + t;
  function frame(ctx, t, cam, o = {}) {
    LB.background(ctx);
    LB.sheet(ctx, ID, 1, RC, x => ground(x, cam, t), { rim: false, shadow: false, fibre: .3 });
    A24().world(ctx, cam, t24(t), { far: true, people: false, near: false, ground: false, calm: true, flare: 1 + 1.5 * bump(t, T_RESP - .1, T_RESP + .2, T_RESP + .7, T_FOUR), haze: 1.2 });
    LB.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; trench(x, cam, t); }, { rim: false, shadow: false, fibre: .3 });
    LB.sheet(ctx, ID, 1, RC, x => { brushes(x, cam, t); men(x, cam, t); }, { rimColor: '#ffb066', rimShift: [1, .2], rimAlpha: .55, glow: .12, glowColor: '#ff8a3a', glowBlur: 10, fibre: 0 });
    dust(ctx, cam, t);
    LB.sheet(ctx, ID, 1, RC, x => heap(x, cam, t), { rimColor: '#ffb066', rimShift: [0, 1], rimAlpha: .5, glow: .3, glowColor: '#ff7a2a', glowBlur: 14, fibre: .2 });
    flames(ctx, cam, t);
    if (!o.noText) num(ctx, t);
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-25', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-24', dur: .9, dir: 'right' },
    sfx: [
      { t: .9, type: 'crackle', dur: 9.6, rate: 9, g: .03 },
      { t: T_RESP, type: 'swoosh', dur: .7, g: .05 },
      { t: T_FOUR, type: 'impact', size: .8, g: .1 },
      { t: T_BUR, type: 'rumble', dur: 1.8, g: .12 },
      ...Array.from({ length: 8 }, (_, i) => ({ t: T_BUR + .1 + i * .12, type: 'thud', g: .035 - i * .003 })),
      ...Array.from({ length: 10 }, (_, i) => ({ t: T_CAP - .1 + i * .075, type: 'tap', g: .03 })),
      { t: T_BURN - .05, type: 'swoosh', dur: 1.0, g: .08 }, { t: T_BURN, type: 'crackle', dur: 1.5, rate: 32, g: .06 },
      { t: .95, type: 'lib', dur: 9.6, label: 'LARGE BONFIRE' },
    ],
    api: { DUR, camAt, frame, N460, GT0, LB },
  });
})();
