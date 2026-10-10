(function () {
  'use strict';
  const F = FILM, PR = F.props, QM = F.qinmap, Mo = F.motion, { clamp, smooth, lerp } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-10'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180;
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api, A8 = () => F.getScene('seq-08').api, A9 = () => F.getScene('seq-09').api;
  const T0 = () => A6().DUR + F.getScene('seq-07').api.DUR + A8().DUR + A9().DUR;

  const T_MAN = 0.3, T_CENTER = 0.7, T_NOT = 1.45, T_SLEEP = 1.6;
  const T_N0 = 0, T_N1 = T_CENTER + .2;

  let G = null;
  function geo() {
    if (G) return G;
    const g8 = A8().geo(), Wg = A8().wallGeo(), XY = g8.XY, L = [], R = F.rng(91);
    for (const r of g8.ROADS) for (let s = 34 + 20 * R(); s < r.L - 8; s += 46 + 24 * R()) { const q = QM.along(r, s); L.push([q[0], q[1], 2]); }
    for (let s = 10; s < Wg.r.L; s += 38) { const q = QM.along(Wg.r, s); L.push([q[0], q[1], 16]); }
    const dm = Math.max(...L.map(l => Math.hypot(l[0] - XY[0], l[1] - XY[1])));
    const lights = L.map(([x, y, h], i) => { const d = Math.hypot(x - XY[0], y - XY[1]) / dm; return { x, y, h, out: T_CENTER + .25 + (1 - d) * (T_SLEEP - T_CENTER - .4) + .1 * R(), seed: i }; });
    return (G = { XY, top: g8.top, lights });
  }

  function keys() {
    const B = A9(), g = geo(), [fx, fy, fz, fp, fw, fl] = B.spl(), T9 = B.DUR, top = g.top, XY = g.XY;
    const at9 = d => [-d, fx(T9 - d), fy(T9 - d), Math.exp(fz(T9 - d)), fp(T9 - d), fw(T9 - d), fl(T9 - d)];
    return [at9(.6), at9(0), at9(-.3), [T_CENTER + .2, XY[0] + 50, XY[1] - 20, 2.1, 52, 0, top], [DUR + 1, XY[0] + 12, XY[1] + 4, 3.3, 54, -4, top]];
  }
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const K = keys(), ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  function camAt(t) {
    const B = A9();
    if (t <= 0) return B.camAt(B.DUR);
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  function night(ctx, t) {
    const k = ss(T_N0, T_N1, t); if (k <= 0) return;
    const xf = lerp(W * 1.25, -W * .6, k), g = ctx.createLinearGradient(xf - W * .45, 0, xf + W * .15, 0);
    g.addColorStop(0, 'rgba(34,44,84,0)'); g.addColorStop(1, 'rgba(34,44,84,.88)');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${.4 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const SPR = new Map();
  function glow(ctx, cx, cy, r, color, a) {
    if (a <= 0) return;
    const tgt = F.route ? F.route(ctx, 'glow') : ctx; if (!tgt) return;
    let c = SPR.get(color);
    if (!c) { const [cv, x] = F.canvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, color); g.addColorStop(1, color + '00'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); SPR.set(color, c = cv); }
    tgt.save(); if (tgt !== ctx) { tgt.setTransform(ctx.getTransform()); tgt.globalAlpha = ctx.globalAlpha; }
    tgt.globalCompositeOperation = 'lighter'; tgt.globalAlpha *= Math.min(1, a); tgt.drawImage(c, cx - r, cy - r, 2 * r, 2 * r); tgt.restore();
  }
  function lights(ctx, t, cam) {
    const g = geo(), sh = SH(), k = ss(T_N0, T_N1, t), xf = lerp(W * 1.25, -W * .6, k);
    for (const l of g.lights) {
      const u = QM.up(cam, l.x, l.y, g.top + l.h); if (!u) continue;
      const on = ss(xf - W * .1, xf + W * .1, u.x) * (1 - ss(l.out, l.out + .18, t)); if (on <= 0) continue;
      const tw = .85 + .15 * Math.sin(t * 9 + l.seed * 2.3);
      glow(ctx, u.x - sh.x, u.y - sh.y, 16 + 8 * Math.min(1.5, u.k / 2), '#ffc977', .55 * on * tw);
      glow(ctx, u.x - sh.x, u.y - sh.y, 3.5, '#fff3d6', .9 * on);
    }
    const u = QM.up(cam, g.XY[0], g.XY[1], g.top + 10); if (!u) return;
    const fl = 1 + .06 * Math.sin(t * 11) + .04 * Math.sin(t * 17.3), b = ss(T_N0 + .3, T_N1, t), r = Math.min(2.4, u.k * A6().magT(cam) / 3);
    PR.glow(ctx, u.x - sh.x, u.y - sh.y, 120 * r * fl, '#ffcf80', .55 * b, 'flat');
    PR.glow(ctx, u.x - sh.x, u.y - sh.y, 30 * r * fl, '#fff4dc', .8 * b, 'flat');
  }

  const FAST = { land: 4, blocks: 5, empire: true, walls: true };
  function draw(ctx, t) {
    const f0 = QM.FAST; QM.FAST = f0 || FAST;
    try {
      const cam = camAt(t);
      A9().world(ctx, A9().DUR + t, cam);
      if (t > 0) { night(ctx, t); lights(ctx, t, cam); }
    } finally { QM.FAST = f0; }
    FL.grade(ctx, T0() + t);
  }

  F.scene('seq-10', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .02, type: 'whoosh', f0: 110, f1: 45, dur: 1.4, g: .14 },
      ...[0, 1, 2, 3, 4, 5, 6].map(i => ({ t: T_CENTER + .3 + i * (T_SLEEP - T_CENTER - .3) / 7, type: 'tap', g: .08 * (1 - i / 10), noSnap: true })),
      { t: T_CENTER, type: 'hum', dur: DUR - T_CENTER + .4, g: .14 },
      { t: T_SLEEP - .15, type: 'heartbeat', g: .26 },
    ],
    api: { DUR, camAt, spl, geo, night, lights },
  });
})();
