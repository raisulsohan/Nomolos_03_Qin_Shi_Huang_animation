(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-05'), DUR = C.duration;
  const PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const FIG = S3.FIG, PI = Math.PI;

  const T_QIN = 1.14, T_FIRST = 2.27;
  const T_MAN = 4.1, T_CHASE = 6.8, T_KILLED = 8.39;
  const T_AT = 9.56, T_49 = 9.7;

  const STOP = 49.4, RUN_M = 13, X0 = STOP - RUN_M, PIT = { x0: 50.1, x1: 52.8, z0: -1.3, z1: 1.1, d: 1.8 }, PITX = (50.1 + 52.8) / 2;
  const RUN = Mo.gait({ from: 0, to: RUN_M / FIG, t0: -2.2, gait: 'run', style: { step: 72, lift: 24, lean: .34, bob: 3.6, arms: .35 }, until: T_AT + .55 });
  const STEP_T = (RUN.falls[4].t - RUN.falls[2].t) / 2;
  const runX = t => X0 + RUN.x(t) * FIG;
  const stopping = t => ss(T_AT, T_AT + .7, t);
  function runnerPose(t) {
    const p = RUN(t), x0 = RUN.x(t);
    const q = { ...p, hip: [p.hip[0] - x0, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - x0, f.at[1]] })) };
    q.head = (q.head || 0) - .06 * ss(T_MAN - .1, T_MAN + .6, t) * (1 - ss(T_AT + .1, T_AT + .7, t));
    q.swing = Math.sin(PI * t / STEP_T) * .8 * (1 - stopping(t)) + Math.sin(t * 1.3) * .15;
    return q;
  }
  const CUP_LEAD = 2.2, CUP_Y = 1.12;
  const sinkY = Mo.monotone([[T_AT + .35, CUP_Y], [T_49 + .75, -1.5], [DUR, -2.7], [DUR + .7, -4.7], [DUR + 1.6, -7.6]]);
  function cupAt(t) {
    const x = runX(t) + CUP_LEAD + .8 * ss(T_KILLED, T_AT + .4, t), over = Math.min(x, PITX);
    const y = t < T_AT + .35 ? CUP_Y + .04 * Math.sin(t * 1.1) * (1 - ss(T_AT - .4, T_AT + .3, t)) : sinkY(t);
    return [over, y, -.05];
  }
  const cupGone = t => ss(T_49 + .3, T_49 + .8, t);

  const KEYS = M45 ? [
    [-1, [.8, .74, -3.5], [.45, 1.08, 0], 1900], [0, [.81, .74, -3.52], [.46, 1.08, 0], 1900], [3.7, [.94, .72, -3.8], [.57, 1.06, 0], 1900],
    [6.3, [1.3, .8, -6.4], [1.5, 1.1, 0], 1180], [8.8, [2.3, 1.0, -9.4], [2.6, .95, 0], 1180], [10.0, [2.1, 1.3, -9.0], [2.15, .2, .4], 1180],
    [10.85, [2.05, .05, -5.9], [2.05, -1.35, -.05], 1180], [DUR, [2.05, -.9, -5.8], [2.05, -2.65, -.05], 1180],
    [DUR + .7, [2.05, -3.5, -5.7], [2.05, -4.9, -.05], 1180], [DUR + 1.6, [2.05, -6.9, -5.7], [2.05, -7.9, -.05], 1180],
  ] : [
    [-1, [1.35, .74, -4.6], [1.0, 1.05, 0], 2500], [0, [1.36, .74, -4.63], [1.01, 1.05, 0], 2500], [3.7, [1.5, .72, -4.95], [1.1, 1.03, 0], 2500],
    [6.3, [1.3, .85, -4.6], [1.5, 1.15, 0], 1500], [8.8, [2.1, 1.0, -6.8], [2.5, .95, 0], 1500], [10.0, [2.05, 1.25, -6.6], [2.15, .3, .4], 1500],
    [10.85, [2.05, .05, -4.8], [2.05, -1.3, -.05], 1500], [DUR, [2.05, -.9, -4.7], [2.05, -2.6, -.05], 1500],
    [DUR + .7, [2.05, -3.6, -4.6], [2.05, -4.9, -.05], 1500], [DUR + 1.6, [2.05, -7.0, -4.6], [2.05, -7.9, -.05], 1500],
  ];
  const spl = (() => {
    const ts = KEYS.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KEYS[i])]));
    const e = [0, 1, 2].map(j => mk(k => k[1][j])), g = [0, 1, 2].map(j => mk(k => k[2][j])), fl = mk(k => Math.log(k[3]));
    return t => ({ e: e.map(f => f(t)), g: g.map(f => f(t)), f: Math.exp(fl(t)) });
  })();
  function camAt(t) {
    if (window.__cam5) return S3.camera({ f: M45 ? 1180 : 1500, ...window.__cam5, W, H });
    const { e, g, f } = spl(t), x = runX(Math.min(t, T_AT + .6));
    const eye = [x + e[0], e[1], e[2]], tgt = [x + g[0], g[1], g[2]], d = [eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]];
    return S3.camera({ pos: eye, yaw: Math.atan2(-d[0], -d[2]), pitch: Math.atan2(-d[1], Math.hypot(d[0], d[2])), f, W, H });
  }
  const below = cam => cam.pos[1] < 0;
  const cutK = t => ss(10.3, 10.75, t);

  const dark = t => ss(T_MAN - .2, T_AT + .2, t);
  const dusk = t => .25 * ss(4, DUR, t);
  const TREES = (() => { const r = F.rng(12), out = []; for (let x = -40; x < 110; x += 2.2 + r() * 3.4) out.push([x, 9 + r() * 9, 3.5 + r() * 3, r()]); return out; })();
  const TUFTS = (() => { const r = F.rng(5), out = []; for (let x = 20; x < 90; x += .3 + r() * .7) out.push([x, r() < .5 ? -1.9 - r() * 4 : 1.9 + r() * 3, .25 + r() * .35, r()]); return out; })();
  const SUN = [Math.sin(.2), .05, Math.cos(.2)];
  const sunAt = cam => cam.proj([cam.pos[0] + 1e5 * SUN[0], cam.pos[1] + 1e5 * SUN[1], cam.pos[2] + 1e5 * SUN[2]]);
  function land(x, cam, t) {
    const hz = cam.proj([cam.pos[0] + 1e5 * Math.sin(cam.yaw), cam.pos[1], cam.pos[2] + 1e5 * Math.cos(cam.yaw)]), hy = hz ? hz[1] : H * .5;
    const g = x.createLinearGradient(0, hy - H * .9, 0, hy + 40); g.addColorStop(0, '#46605f'); g.addColorStop(.55, '#7f8e86'); g.addColorStop(.85, '#d4a274'); g.addColorStop(1, '#efbd82');
    x.fillStyle = g; x.fillRect(-20, -20, W + 40, H + 40);
    const sp = sunAt(cam);
    if (sp) {
      const r = .011 * cam.f;
      for (const [k, a] of [[8, .06], [4, .11], [2, .2]]) { const gg = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r * k); gg.addColorStop(0, `rgba(255,226,170,${a})`); gg.addColorStop(1, 'rgba(255,226,170,0)'); x.fillStyle = gg; x.fillRect(sp[0] - r * k, sp[1] - r * k, 2 * r * k, 2 * r * k); }
      x.fillStyle = '#fff1d2'; x.beginPath(); x.arc(sp[0], sp[1], r, 0, TAU); x.fill();
    }
    const half = Math.atan(W / 2 / cam.f) + .3;
    for (const [R, hgt, col, seed] of [[900, 120, '#9ba59a', 3], [260, 26, '#6f7f74', 7], [120, 9, '#56645a', 11]]) {
      x.fillStyle = col; x.beginPath();
      for (let i = 0; i <= 90; i++) { const az = cam.yaw - half + 2 * half * i / 90, h = hgt * (.4 + .6 * (noise1(az * 9 + R, seed) + 1) / 2); const p = cam.proj([cam.pos[0] + R * Math.sin(az), h, cam.pos[2] + R * Math.cos(az)]); if (p) i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
      x.lineTo(W + 300, H + 300); x.lineTo(-300, H + 300); x.closePath(); x.fill();
    }
    x.fillStyle = '#4c5a4c'; S3.poly(x, cam, [[-3000, 0, 0], [3000, 0, 0], [3000, 0, 120], [-3000, 0, 120]]) && x.fill();
    for (const [tx, tz, th, r] of TREES.slice().sort((a, b) => b[1] - a[1])) {
      const b = cam.proj([tx, 0, tz]), top = cam.proj([tx, th, tz]); if (!b || !top || b[0] < -200 || b[0] > W + 200) continue;
      const wd = (.7 + .5 * r) * b[3];
      x.fillStyle = S3.mix('#34413a', '#56645a', clamp((tz - 9) / 9)); x.beginPath(); x.moveTo(b[0] - wd * .15, b[1]); x.lineTo(b[0] - wd * .5, b[1] - (b[1] - top[1]) * .35); x.quadraticCurveTo(b[0] - wd * .45, top[1] + (b[1] - top[1]) * .2, top[0], top[1]); x.quadraticCurveTo(b[0] + wd * .45, top[1] + (b[1] - top[1]) * .2, b[0] + wd * .5, b[1] - (b[1] - top[1]) * .35); x.lineTo(b[0] + wd * .15, b[1]); x.closePath(); x.fill();
    }
    if (below(cam)) { grave(x, cam, t); return; }
    x.fillStyle = '#3d4a3e'; S3.poly(x, cam, [[-3000, 0, -60], [3000, 0, -60], [3000, 0, 9], [-3000, 0, 9]]) && x.fill();
    x.fillStyle = '#8a7556'; S3.poly(x, cam, [[-400, 0, -1.5], [PIT.x0, 0, -1.5], [PIT.x0, 0, 1.5], [-400, 0, 1.5]]) && x.fill();
    x.strokeStyle = '#6f5c42'; x.lineWidth = 1.5; x.beginPath(); for (const z of [-.55, .55]) S3.line(x, cam, [-400, .002, z], [PIT.x0, .002, z]); x.stroke();
    grave(x, cam, t);
  }
  function grave(x, cam, t) {
    const { x0, x1, z0, z1, d } = PIT;
    if (!below(cam)) {
      x.save();
      if (S3.poly(x, cam, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]])) { x.fillStyle = '#16110d'; x.fill(); x.clip(); }
      x.fillStyle = '#3a2c20'; S3.poly(x, cam, [[x0, 0, z1], [x1, 0, z1], [x1, -d, z1], [x0, -d, z1]]) && x.fill();
      x.fillStyle = '#2a2018'; S3.poly(x, cam, [[x1, 0, z0], [x1, 0, z1], [x1, -d, z1], [x1, -d, z0]]) && x.fill();
      x.restore();
      x.fillStyle = '#3d4a3e'; S3.poly(x, cam, [[x1, .001, -1.5], [400, .001, -1.5], [400, .001, 1.5], [x1, .001, 1.5]]) && x.fill();
    }
    const heap = []; for (let i = 0; i <= 16; i++) { const u = i / 16; heap.push([x0 - .7 + (x1 - x0 + 1.4) * u, .95 * Math.pow(Math.sin(PI * u), .7) * (1 + .08 * Math.sin(u * 23)), z1 + 1.15]); }
    const sp0 = cam.proj([x1 - .3, .35, z1 + 1.2]), sp1 = cam.proj([x1 - .1, 1.35, z1 + 1.2]);
    if (sp0 && sp1) { x.strokeStyle = '#3a2c20'; x.lineWidth = Math.max(1.5, .035 * sp0[3]); x.beginPath(); x.moveTo(sp0[0], sp0[1]); x.lineTo(sp1[0], sp1[1]); x.stroke(); x.fillStyle = '#4a4440'; const bl = cam.proj([x1 - .34, .1, z1 + 1.2]); if (bl) { const ww = .12 * bl[3]; x.fillRect(bl[0] - ww / 2, bl[1] - .3 * bl[3], ww, .3 * bl[3]); } }
    x.fillStyle = '#5e4c36'; x.beginPath(); heap.forEach((p, i) => { const q = cam.proj(p); if (q) i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); });
    const e1 = cam.proj([x1 + .3, 0, z1 + .2]), e0 = cam.proj([x0 - .3, 0, z1 + .2]); if (e1 && e0) { x.lineTo(e1[0], e1[1]); x.lineTo(e0[0], e0[1]); } x.closePath(); x.fill();
  }
  function tufts(x, cam, near, t) {
    if (near && cutK(t) > .5) return;
    for (const [tx, tz, h, r] of TUFTS) {
      if ((tz < 0) !== near) continue;
      const b = cam.proj([tx, 0, tz]); if (!b || b[0] < -100 || b[0] > W + 100) continue;
      const s = h * b[3]; if (s < 2) continue;
      x.fillStyle = near ? '#26302a' : '#33402f';
      x.beginPath(); x.moveTo(b[0] - s * .5, b[1]); x.lineTo(b[0] - s * .3, b[1] - s * .8); x.lineTo(b[0] - s * .1, b[1] - s * .3); x.lineTo(b[0] + s * .05, b[1] - s); x.lineTo(b[0] + s * .2, b[1] - s * .35); x.lineTo(b[0] + s * .4, b[1] - s * .75); x.lineTo(b[0] + s * .5, b[1]); x.closePath(); x.fill();
    }
  }

  const ZC = -.05;
  const STRATA = [[0, '#4a3a2a'], [-.38, '#76603f'], [-1.0, '#927650'], [-1.32, '#6a5238'], [-2.3, '#a08a62'], [-2.55, '#5a4532'],
    [-3.7, '#7b6a52'], [-4.25, '#463828'], [-5.6, '#5e5040'], [-6.0, '#2f261d'], [-8.2, '#1c1712']];
  const STONES = (() => { const r = F.rng(31), out = []; for (let i = 0; i < 150; i++) out.push([PITX - 7 + 14 * r(), -.25 - 11 * Math.pow(r(), 1.1), .04 + .16 * r() * r(), r()]); return out; })();
  const ROOTS = (() => { const r = F.rng(17), out = []; for (let i = 0; i < 14; i++) { const x0 = PITX - 6 + 12 * r(); if (x0 > PIT.x0 - .1 && x0 < PIT.x1 + .1) continue; out.push([x0, .3 + .5 * r(), r()]); } return out; })();
  const wave = (X, k) => .07 * noise1(X * .9 + k * 3.1, 40 + k) + .03 * noise1(X * 3.3, 60 + k);
  function section(x, cam, t) {
    const { x0, x1, d, z1 } = PIT, xa = cam.pos[0] - 12, xb = cam.pos[0] + 12;
    const P = (X, Y) => cam.proj([X, Y, ZC]);
    x.fillStyle = '#251c14'; S3.poly(x, cam, [[x0, 0, ZC], [x1, 0, ZC], [x1, -d, ZC], [x0, -d, ZC]]) && x.fill();
    x.fillStyle = '#2e231a'; S3.poly(x, cam, [[x0, -d, ZC], [x1, -d, ZC], [x1, -d, z1], [x0, -d, z1]]) && x.fill();
    x.fillStyle = '#3a2c20'; S3.poly(x, cam, [[x0, 0, z1], [x1, 0, z1], [x1, -d, z1], [x0, -d, z1]]) && x.fill();
    x.save(); x.beginPath();
    const pts = [P(xa, 0), P(x0, 0), P(x0, -d), P(x1, -d), P(x1, 0), P(xb, 0), P(xb, -40), P(xa, -40)];
    if (pts.some(p => !p)) { x.restore(); return; }
    pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.clip();
    for (let i = 0; i < STRATA.length; i++) {
      const [y0, col] = STRATA[i], y1 = i + 1 < STRATA.length ? STRATA[i + 1][0] : -40;
      x.fillStyle = col; x.beginPath();
      for (let k = 0; k <= 48; k++) { const X = lerp(xa, xb, k / 48), q = P(X, y0 + (i ? wave(X, i) : 0)); k ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }
      for (let k = 48; k >= 0; k--) { const X = lerp(xa, xb, k / 48), q = P(X, y1 + (i + 1 < STRATA.length ? wave(X, i + 1) : 0)); x.lineTo(q[0], q[1]); }
      x.closePath(); x.fill();
    }
    for (const [X, Y, r, k] of STONES) { const q = P(X, Y); if (!q || q[1] < -50 || q[1] > H + 50) continue; x.fillStyle = S3.mix('#5d5348', '#8d8172', k); x.beginPath(); x.ellipse(q[0], q[1], r * q[3], r * q[3] * (.55 + .3 * k), k * 2, 0, TAU); x.fill(); }
    x.strokeStyle = '#2c2218'; x.lineCap = 'round';
    for (const [X, L, k] of ROOTS) { x.lineWidth = Math.max(1, .018 * (P(X, 0) || [0, 0, 60])[3]); x.beginPath(); for (let j = 0; j <= 8; j++) { const u = j / 8, q = P(X + .12 * Math.sin(u * 5 + k * 9) * u, -L * u); j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); } x.stroke(); }
    x.restore();
  }

  const INK = '#1d1917', SIL = Q.silhouette('emperor', INK, '#4a4038');
  function runner(x, cam, t) {
    const fa = S3.figureAt(cam, [runX(t), 0, 0], 0); if (!fa) return null;
    const ch = [runX(t), 1.1, 0], hd = Math.hypot(cam.pos[0] - ch[0], cam.pos[2] - ch[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - ch[1], hd)), 0, .7);
    const pose = { ...runnerPose(Mo.pose(t)), yaw: fa.yaw };
    pose.swing = runnerPose(t).swing;
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s);
    Q.draw(x, PA.P, pose, SIL, { crown: true, beard: true, profile: true, tilt, robe: 40, shadow: .3 * (1 - cutK(t)) });
    x.restore();
    return fa;
  }
  const PUFF = (() => { const r = F.rng(23); return RUN.falls.map(fl => Array.from({ length: 6 }, () => [r() - .5, r(), r() - .5, r()])); })();
  function dust(x, cam, t, near) {
    RUN.falls.forEach((fl, i) => {
      const age = t - fl.t; if (age < 0 || age > 3.2 || fl.close) return;
      const fx = X0 + fl.x * FIG, fz = fl.foot ? -.09 : .09, u = age / 3.2;
      for (const [dx, dy, dz, k] of PUFF[i]) {
        const z = fz + dz * .5; if ((z < 0) !== near) continue;
        const q = cam.proj([fx + dx * .5 - .35 * Math.sqrt(u), .05 + (.12 + .35 * dy) * Math.sqrt(u), z]); if (!q) continue;
        const r = (.06 + .22 * Math.sqrt(u) * (.6 + .6 * k)) * q[3], a = .3 * (1 - u) * smooth(age / .15);
        const g = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, `rgba(214,182,136,${a})`); g.addColorStop(1, 'rgba(214,182,136,0)');
        x.fillStyle = g; x.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r);
      }
    });
  }
  const MOTES = (() => { const r = F.rng(41), out = []; for (let i = 0; i < 70; i++) out.push([X0 - 3 + (RUN_M + 9) * r(), .2 + 2.4 * r(), -3.2 + 5 * r(), r()]); return out; })();
  function motes(ctx, cam, t) {
    if (below(cam)) return;
    const sx0 = F.SHIFT ? F.SHIFT.x : 0, sy0 = F.SHIFT ? F.SHIFT.y : 0, sp = sunAt(cam);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
    for (const [mx, my, mz, k] of MOTES) {
      const q = cam.proj([mx + .05 * t + .1 * Math.sin(t * .4 + k * 9), my + .06 * Math.sin(t * .3 + k * 7), mz]); if (!q || q[0] < -20 || q[0] > W + 20 || q[1] < -20 || q[1] > H + 20) continue;
      const near = sp ? clamp(1 - Math.hypot(q[0] - sp[0], q[1] - sp[1]) / (W * .7)) : .3, r = clamp(.012 * q[3], 1, 5);
      ctx.fillStyle = `rgba(255,232,190,${(.12 + .45 * near) * (.5 + .5 * Math.sin(t * 1.7 + k * 20)) * (1 - dark(t) * .5)})`;
      ctx.beginPath(); ctx.arc(q[0] - sx0, q[1] - sy0, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function cup(x, cam, t) {
    const p = cupAt(t), P = cam.proj(p); if (!P) return;
    const gone = cupGone(t); if (gone >= 1) return;
    x.save(); x.globalAlpha = 1 - gone; x.translate(P[0], P[1]); x.rotate(.06 * Math.sin(t * .9));
    Q.cup(x, { s: P[3] * .01, elev: .25, fill: .8, beads: [[0, 0, 1.6]], k: 0, liquid: '#c9ced6' });
    x.restore();
  }
  function cupLight(ctx, cam, t) {
    const p = cupAt(t), P = cam.proj([p[0], p[1] + .06, p[2]]); if (!P) return;
    const pit = ss(T_49 + .2, T_49 + .9, t), sx0 = F.SHIFT ? F.SHIFT.x : 0, sy0 = F.SHIFT ? F.SHIFT.y : 0;
    if (pit > 0 && !below(cam)) { const Q2 = cam.proj([PITX, 0, (PIT.z0 + PIT.z1) / 2]); if (Q2) PR.glow(ctx, Q2[0] - sx0, Q2[1] - sy0, .9 * Q2[3], '#ffe6b0', .28 * pit, 'lightbox'); }
    P[0] -= sx0; P[1] -= sy0;
    const k = 1 - cupGone(t), r = clamp(.9 * P[3], 30, 150), deep = below(cam) ? 1 : ss(T_49 + .4, T_49 + 1, t);
    PR.glow(ctx, P[0], P[1], r * 1.6, '#ffe6b0', .22 * k + .3 * deep, 'lightbox');
    PR.glow(ctx, P[0], P[1], r * .45, '#ffffff', .45 * k + .5 * deep, 'lightbox');
    ctx.save(); ctx.translate(P[0], P[1]); ctx.scale(5, .12); PR.glow(ctx, 0, 0, r * .8, '#ffd9a0', .28 * (k + deep), 'lightbox'); ctx.restore();
  }
  function earthDark(ctx, cam, t) {
    if (!below(cam)) return;
    const p = cupAt(t), P = cam.proj([p[0], p[1] + .06, p[2]]); if (!P) return;
    const k = ss(0, -6.5, cam.pos[1]), r0 = 1.1 * P[3] * (1 - .35 * k), sx0 = F.SHIFT ? F.SHIFT.x : 0, sy0 = F.SHIFT ? F.SHIFT.y : 0;
    const g = ctx.createRadialGradient(P[0] - sx0, P[1] - sy0, r0 * .25, P[0] - sx0, P[1] - sy0, r0 * 2.4);
    g.addColorStop(0, 'rgba(8,7,10,0)'); g.addColorStop(1, `rgba(8,7,10,${.35 * ss(0, -.4, cam.pos[1]) + .63 * k})`);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  function behindDark(ctx, cam, t) {
    const k = dark(t) * (1 - ss(10.4, 10.9, t)); if (k > 0) {
      const P = cam.proj([runX(t) - 1.4, 1, 0]);
      if (P) {
        const ex = P[0] - (F.SHIFT ? F.SHIFT.x : 0), soft = Math.max(260, W * .22);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        const g = ctx.createLinearGradient(ex - soft, 0, ex + soft * .4, 0);
        g.addColorStop(0, `rgba(14,12,16,${.82 * k})`); g.addColorStop(.7, `rgba(14,12,16,${.4 * k})`); g.addColorStop(1, 'rgba(14,12,16,0)');
        ctx.fillStyle = g; ctx.fillRect(-10, -10, ex + soft * .4 + 10, H + 20); ctx.restore();
      }
    }
    const e = dusk(t);
    if (e > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(16,14,20,${e})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  function draw(ctx, t) {
    const cam = camAt(t), id = { x: W / 2, y: H / 2, z: 1 }, R = [W / 2, H / 2], sv = F.SHIFT;
    PA.background(ctx);
    PA.sheet(ctx, id, 1, R, x => { if (sv) x.translate(sv.x * .5, sv.y * .5); land(x, cam, t); tufts(x, cam, false, t); }, { paperShadow: [3, 4, 4, .2] });
    PA.sheet(ctx, id, 1, R, x => { dust(x, cam, t, false); const under = cupAt(t)[1] < .1; if (under) cup(x, cam, t); runner(x, cam, t); if (!under) cup(x, cam, t); dust(x, cam, t, true); }, { paperShadow: [6, 8, 7, .3] });
    if (cutK(t) > 0) PA.sheet(ctx, id, 1, R, x => section(x, cam, t), { alpha: cutK(t), shadowAlpha: cutK(t), paperShadow: [4, 6, 6, .3] });
    behindDark(ctx, cam, t);
    earthDark(ctx, cam, t);
    cupLight(ctx, cam, t);
    motes(ctx, cam, t);
    PA.sheet(ctx, id, 1, R, x => tufts(x, cam, true, t), { blur: 3, shadow: false });
    F.impact(PA, ctx, t, { lines: [{ text: 'QIN SHI HUANG', t0: T_QIN, size: M45 ? 104 : 150, color: '#f3ebda' }, { text: 'THE FIRST EMPEROR OF CHINA', t0: T_FIRST, size: M45 ? 50 : 64, color: '#f3ebda' }],
      x: M45 ? .5 : .66, y: M45 ? .2 : .19, out: T_MAN + .4, accent: '#d9a443' });
    F.impact(PA, ctx, t, { lines: [{ text: '49', t0: T_49, size: M45 ? 230 : 260, color: '#f3ebda' }], x: .5, y: M45 ? .24 : .26, out: DUR + .5, accent: '#d9a443', minW: M45 ? 520 : 640 });
    PA.grade(ctx, t);
  }
  const lightAt = t => { const c = camAt(t), p = cupAt(t), q = c.proj([p[0], p[1] + .06, p[2]]); return q ? [q[0], q[1]] : [W / 2, H / 2]; };

  F.scene('seq-05', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-04', dur: .9, dir: 'right' },
    sfx: [
      { t: .05, type: 'hum', dur: DUR - .3, g: .06 },
      { t: .3, type: 'lib', dur: T_AT + .4, label: 'SLOW-MOTION RUN: deep muffled footfalls, one man; slow heavy breathing; a low wind' },
      ...RUN.falls.filter(fl => fl.t > .1 && fl.t < T_AT + .6).map(fl => ({ t: fl.t, type: 'thud', g: .14 })),
      ...[1.2, 3.0, 4.8, 6.6, 8.3].map(s => ({ t: s, type: 'heartbeat', g: .16 })),
      { t: T_QIN, type: 'titleHit', g: .45, noSnap: true },
      { t: T_FIRST, type: 'impact', size: .35, g: .3, noSnap: true },
      { t: T_MAN, type: 'whoosh', f0: 70, f1: 140, dur: 2.2, g: .08 },
      { t: T_KILLED - .5, type: 'riser', dur: .5, g: .25 },
      { t: T_AT + .3, type: 'swoosh', dur: .8, g: .2 },
      { t: T_49, type: 'impact', size: .55, g: .5, noSnap: true },
      { t: T_49 + .5, type: 'whoosh', f0: 260, f1: 60, dur: 1.4, g: .14 },
      { t: T_49 + .8, type: 'rumble', dur: 1.2, g: .2 },
    ],
    api: { DUR, camAt, lightAt, at: (t, p) => { const c = camAt(t), q = c.proj(p); return q ? [q[0], q[1]] : [W / 2, H / 2]; }, runX },
  });
})();
