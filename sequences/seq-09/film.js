(function () {
  'use strict';
  const F = FILM, PR = F.props, QM = F.qinmap, Mo = F.motion, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-09'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180;
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api, A7 = () => F.getScene('seq-07').api, A8 = () => F.getScene('seq-08').api;
  const T0 = () => A6().DUR + A7().DUR + A8().DUR;

  const T_BRUT = 0.41, T_FORCED = 1.03, T_IRON = 2.32, T_STATE = 3;
  const T_BUT = 4.53, T_SCALE = 5.61, T_ATT = 6.57;

  let G = null;
  function geo() {
    if (G) return G;
    const Wg = A8().wallGeo(), p = Wg.r.p, top = A8().geo().top;
    const wallY = xq => { for (let i = 1; i < p.length; i++) if (p[i][0] >= xq) { const u = (xq - p[i - 1][0]) / (p[i][0] - p[i - 1][0]); return lerp(p[i - 1][1], p[i][1], u); } return p[p.length - 1][1]; };
    const FILES = [214, 244, 276, 308].map((xq, i) => { const wy = wallY(xq); return { i, r: QM.road([[xq - 12 + 4 * i, wy + 84], [xq - 3, wy + 30], [xq, wy + 4.6]]) }; });
    const GUARD = [];
    for (let xq = 196; xq <= 330; xq += 7.5) if (FILES.every(f => Math.abs(f.r.p[2][0] - xq) > 4.5)) GUARD.push([xq, wallY(xq) + 3.6]);
    return (G = { top, FILES, GUARD, wallY });
  }

  function keys() {
    const A = A6(), B = A8(), g = geo(), [fx, fy, fz, fp, fw, fl] = B.spl(), T8 = B.DUR, top = g.top;
    const at8 = d => [-d, fx(T8 - d), fy(T8 - d), Math.exp(fz(T8 - d)), fp(T8 - d), fw(T8 - d), fl(T8 - d)];
    const look = (t, e, g2) => {
      const dx = g2[0] - e[0], dn = e[1] - g2[1], dh = e[2] - g2[2], hz = Math.hypot(dx, dn), D = Math.hypot(hz, dh);
      return [t, g2[0], g2[1], A.FLENS / D, Math.atan2(dh, hz) / D2R, Math.atan2(dx, dn) / D2R, g2[2]];
    };
    return [
      at8(.6), at8(0), at8(-.3),
      look(1.5, [176, -120, top + 70], [256, -200, top]),
      look(T_IRON + .2, [186, -150, top + 25], [262, -212, top + 3]),
      look(T_BUT, [200, -156, top + 23], [282, -218, top + 3]),
      look(T_SCALE + .3, [196, 10, top + 260], [262, -170, top]),
      [DUR + 1.2, 240, -110, 1.45, 50, 4, top],
    ];
  }
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const K = keys(), ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  function camAt(t) {
    const B = A8();
    if (t <= 0) return B.camAt(B.DUR);
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  const INK = '#1b2130', LH = 3.0, GAPF = 3.4, V_F = 1.1;
  function labourer(x, sx, sy, h, ph, dir, a) {
    if (h < .8 || a <= 0) return null;
    const sw = Math.sin(ph * TAU), bob = Math.abs(Math.cos(ph * TAU)) * .02 * h;
    const hipX = sx + .02 * h * dir, hipY = sy - .42 * h - bob, shX = hipX + .2 * h * dir, shY = hipY - .28 * h;
    const body = (dx, dy, col) => {
      x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round';
      x.lineWidth = Math.max(.8, .17 * h); x.beginPath(); x.moveTo(hipX + dx, hipY + dy); x.lineTo(shX + dx, shY + dy); x.stroke();
      x.beginPath(); x.arc(shX + .1 * h * dir + dx, shY + .03 * h + dy, .085 * h, 0, TAU); x.fill();
      x.save(); x.translate((hipX + shX) / 2 - .1 * h * dir + dx, (hipY + shY) / 2 - .12 * h + dy); x.rotate(-.6 * dir);
      x.fillRect(-.13 * h, -.13 * h, .26 * h, .24 * h); x.restore();
      if (h >= 5) {
        x.lineWidth = Math.max(.7, .085 * h); x.beginPath();
        x.moveTo(hipX + dx, hipY + dy); x.lineTo(sx + .17 * h * sw * dir + dx, sy + dy);
        x.moveTo(hipX + dx, hipY + dy); x.lineTo(sx - .17 * h * sw * dir + dx, sy + dy); x.stroke();
        x.lineWidth = Math.max(.6, .06 * h); x.beginPath(); x.moveTo(shX + dx, shY + .03 * h + dy); x.lineTo(shX + .05 * h * dir + .04 * h * sw + dx, shY + .27 * h + dy); x.stroke();
      } else x.fillRect(sx - .1 * h + dx, sy - .42 * h + dy, .2 * h, .42 * h);
    };
    x.save(); x.globalAlpha *= a;
    if (h >= 7) body(-.05 * h, -.04 * h, 'rgba(255,241,208,.5)');
    body(0, 0, INK);
    x.restore();
    return [hipX, hipY + .02 * h];
  }
  function files(put, cm, m, t) {
    const g = geo(), a0 = ss(.3, 1.1, t);
    if (a0 <= 0) return;
    for (const f of g.FILES) {
      const head = V_F * t + 2 * f.i, list = [];
      for (let s = head % GAPF; s < f.r.L; s += GAPF) list.push(s);
      list.forEach((s, k) => {
        const [px, py] = QM.along(f.r, s), a = a0 * ss(0, 6, s) * (1 - ss(f.r.L - 2.2, f.r.L - .2, s)); if (a <= 0) return;
        const ahead = QM.along(f.r, s + 1), next = k + 1 < list.length ? QM.along(f.r, list[k + 1]) : null;
        put(px, py, g.top, (x, u) => {
          const v = cm.at(ahead[0], ahead[1], g.top), dir = v && v[0] < u.x ? -1 : 1, h = LH * u.k * (.55 + .45 * u.lev);
          const tie = labourer(x, u.x, u.y, h, s / 1.9, dir, a); if (!tie || !next) return;
          const un = QM.up(cm, next[0], next[1], g.top); if (!un) return;
          const hn = LH * un.k * (.55 + .45 * un.lev), nx = un.x + .02 * hn * dir, ny = un.y - .4 * hn;
          x.save(); x.globalAlpha *= a * .9; x.strokeStyle = INK; x.lineWidth = Math.max(.6, .028 * h);
          x.beginPath(); x.moveTo(tie[0], tie[1]); x.quadraticCurveTo((tie[0] + nx) / 2, (tie[1] + ny) / 2 + .12 * h, nx, ny); x.stroke(); x.restore();
        });
      });
      const ga = a0, glit = ss(T_IRON - .05, T_IRON + .15, t) * (1 - ss(T_IRON + .5, T_IRON + 1.3, t));
      if (ga > 0) for (let s = (head + 1.7) % (GAPF * 4); s < f.r.L - 3; s += GAPF * 4) {
        const [px, py, hd] = QM.along(f.r, s), ox = px + Math.sin(hd) * -2.2, oy = py - Math.cos(hd) * -2.2, ahead = QM.along(f.r, s + 1);
        put(ox, oy, g.top, (x, u) => { const v = cm.at(ahead[0], ahead[1], g.top), dir = v && v[0] < u.x ? -1 : 1; QM.soldier(x, u.x, u.y, LH * 1.12 * u.k * (.55 + .45 * u.lev), s / 1.9, dir, { alpha: ga * ss(0, 6, s), rim: `rgba(255,241,208,${.55 + .45 * glit})` }); });
      }
    }
    g.GUARD.forEach(([gx, gy], i) => {
      const t0 = T_IRON + .04 * i, lit = ss(t0, t0 + .12, t) * (1 - ss(t0 + .25, t0 + .9, t));
      put(gx, gy, g.top, (x, u) => QM.soldier(x, u.x, u.y, LH * 1.12 * u.k * (.55 + .45 * u.lev), 0, 1, { alpha: a0, rim: `rgba(255,241,208,${.55 + .45 * lit})` }));
    });
  }

  const cold = t => ss(T_BRUT - .1, T_BRUT + .7, t) * (1 - ss(T_BUT - .1, T_BUT + 1.1, t));
  function coldLight(ctx, t) {
    const c = cold(t); if (c <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${.55 * c})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(120,136,160,${.6 * c})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const R = F.rng(5);
    for (let i = 0; i < 70; i++) {
      const y = R() * H, sp = 500 + 600 * R(), x0 = ((R() * W * 1.4 - sp * t) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * .2, ln = 30 + 80 * R();
      ctx.strokeStyle = `rgba(214,206,190,${.16 * c * R()})`; ctx.lineWidth = 1 + 2 * R(); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + ln, y + ln * .06); ctx.stroke();
    }
    ctx.restore();
  }
  function wallRun(ctx, t, cam) {
    const T1 = T_SCALE - .3, T2 = T_ATT + .6; if (t < T1 || t > T2 + .5) return;
    const B = A8(), Wg = B.wallGeo(), sh = SH(), Hw = B.wallH(cam, B.DUR + t), top = geo().top, a = ss(T1, T1 + .3, t) * (1 - ss(T2, T2 + .5, t));
    const s0 = Wg.r.L * clamp((t - T1) / (T2 - T1));
    for (let i = 0; i < 9; i++) {
      const s = s0 - i * 14; if (s < 0) break;
      const q = QM.along(Wg.r, s), u = QM.up(cam, q[0], q[1], top + Hw); if (!u) continue;
      PR.glow(ctx, u.x - sh.x, u.y - sh.y, i ? 34 - 2 * i : 60, '#fff0c4', a * (i ? .5 * (1 - i / 9) : .85), 'flat');
    }
  }

  function world(ctx, t, cam, ex) {
    const B = A8();
    B.world(ctx, B.DUR + t, cam, {
      sky: ex && ex.sky, onTop: ex && ex.onTop, noCarts: ex && ex.noCarts, throneK: ex && ex.throneK,
      uprights: (put, cm, m) => { if (t > 0) files(put, cm, m, t); if (ex && ex.uprights) ex.uprights(put, cm, m); },
      glows: (c, cm) => { if (t > 0) wallRun(c, t, cm); if (ex && ex.glows) ex.glows(c, cm); },
    });
    if (t > 0) coldLight(ctx, t);
  }
  const FAST = { land: 4, blocks: 5, empire: true, walls: true };
  function draw(ctx, t) {
    const f0 = QM.FAST; QM.FAST = f0 || FAST;
    try { world(ctx, t, camAt(t)); } finally { QM.FAST = f0; }
    FL.grade(ctx, T0() + t);
  }

  F.scene('seq-09', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .1, type: 'whoosh', f0: 140, f1: 60, dur: 1.6, g: .14 },
      { t: T_BRUT - .1, type: 'wind', dur: T_BUT - T_BRUT + .8, g: .26 },
      { t: T_BRUT, type: 'impact', size: .25, g: .2, noSnap: true },
      { t: T_FORCED - .2, type: 'lib', dur: T_BUT - T_FORCED + .6, label: 'A SLOW CROWD WALKING ON GRAVEL, CHAINS, COLD WIND OVER HILLS' },
      ...[0, 1, 2, 3, 4, 5, 6].map(i => ({ t: T_FORCED + i * .45, type: 'footstep', g: .1 })),
      ...[0, 1, 2].map(i => ({ t: T_FORCED + .3 + i * .9, type: 'creak', dur: .25, g: .07 })),
      ...[0, 1, 2, 3].map(i => ({ t: T_FORCED + .5 + i * .8, type: 'clink', f: 1800, g: .05 })),
      { t: T_IRON, type: 'hum', dur: T_BUT - T_IRON, g: .18 },
      ...[0, 1, 2, 3, 4].map(i => ({ t: T_IRON + .1 + .2 * i, type: 'thud', g: .1, noSnap: true })),
      { t: T_BUT, type: 'swoosh', dur: 2.0, g: .26 },
      { t: T_BUT + .2, type: 'riser', dur: T_SCALE - T_BUT + .4, g: .16 },
      { t: T_SCALE - .3, type: 'shimmer', g: .18 },
    ],
    api: { DUR, camAt, geo, world, spl },
  });
})();
