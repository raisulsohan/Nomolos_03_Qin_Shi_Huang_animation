(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, Mo = F.motion, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-13'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI;
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api, A8 = () => F.getScene('seq-08').api, A10 = () => F.getScene('seq-10').api, A12 = () => F.getScene('seq-12').api;
  const T0 = () => A6().DUR + F.getScene('seq-07').api.DUR + A8().DUR + F.getScene('seq-09').api.DUR + A10().DUR + F.getScene('seq-11').api.DUR + A12().DUR;

  const T_DIS = 0.69, T_EMP = 1.9;
  const T_BUILT = 2.94, T_COV = 3.25, T_WALK = 3.7, T_TUN = 4.39, T_PAL = 5.47;
  const T_NO = 6.04, T_SEE = 6.67, T_MOVE = 7.05;
  const T_SLEPT = 8.02, T_DIFF = 8.47, T_CONST = 9.31;
  const T_REV = 10.25, T_LOC = 10.98, T_CAP = 11.88, T_CRIME = 12.31;
  const T_OWNED = 13.31, T_EVERY = 13.61, T_HEAVEN = 14.52, T_EXCEPT = 14.88, T_NIGHT = 15.67, T_PEACE = 16.09;

  const XY = QM.byId.qin.cap, TOP = () => A8().geo().top;
  const PAL = [[-2, -6], [5, 15], [-5, -25], [19, 3], [-17, 3], [23, 19], [-21, -14], [14, -17]].map(([dx, dy], i) => ({ x: XY[0] + dx, y: XY[1] + dy, i }));
  const WALKS = [[0, 2], [0, 3], [0, 4], [0, 1], [3, 5], [4, 6], [2, 7], [7, 3], [6, 2]];
  const TUNNELS = [[1, 5], [1, 4], [6, 0]];
  const PW = 3.4, PD = 2.4;
  const upAt = (i, t) => { const u = clamp((t - T_BUILT - .02 - .075 * i) / .5); return u <= 0 ? 0 : 1 - Math.pow(1 - u, 3) * Math.cos(u * 2.2); };
  const walkU = (j, t) => easeIO(clamp((t - T_COV - .05 - .09 * j) / .7));
  const tunU = (j, t) => easeIO(clamp((t - T_TUN + .05 - .1 * j) / .7));
  const edge = (a, b) => { const A = PAL[a], B = PAL[b], d = Math.hypot(B.x - A.x, B.y - A.y), u = [(B.x - A.x) / d, (B.y - A.y) / d], k = Math.min(PW, PD) + 1.4; return { a: [A.x + u[0] * k, A.y + u[1] * k], b: [B.x - u[0] * k, B.y - u[1] * k] }; };
  const box = (x, cam, cx, cy, hw, hd, h0, h1, col, o = {}) => S3.box(x, cam, { x0: cx - hw, x1: cx + hw, y0: h0, y1: h1, z0: -(cy + hd), z1: -(cy - hd) }, { col, ...o });
  function palace(x, cam, p, k) {
    const h0 = TOP(), s = k;
    box(x, cam, p.x, p.y, PW + .9, PD + .9, h0, h0 + 1.0 * s, '#cdbf9c', { top: '#ddd0ae' });
    box(x, cam, p.x, p.y, PW, PD, h0 + 1.0 * s, h0 + 2.7 * s, '#8a3a2a');
    const e0 = h0 + 2.7 * s, e1 = h0 + 4.1 * s, ow = PW + .7, od = PD + .7, rw = PW * .55;
    const P3 = (mx, my, h) => [mx, h, -my];
    const faces = [
      [[P3(p.x - ow, p.y + od, e0), P3(p.x + ow, p.y + od, e0), P3(p.x + rw, p.y, e1), P3(p.x - rw, p.y, e1)], [0, .6, -.8]],
      [[P3(p.x + ow, p.y - od, e0), P3(p.x - ow, p.y - od, e0), P3(p.x - rw, p.y, e1), P3(p.x + rw, p.y, e1)], [0, .6, .8]],
      [[P3(p.x + ow, p.y + od, e0), P3(p.x + ow, p.y - od, e0), P3(p.x + rw, p.y, e1)], [.8, .6, 0]],
      [[P3(p.x - ow, p.y - od, e0), P3(p.x - ow, p.y + od, e0), P3(p.x - rw, p.y, e1)], [-.8, .6, 0]],
    ];
    for (const [pts, n] of faces) if (S3.facing(cam, pts[0], n) && S3.poly(x, cam, pts)) { x.fillStyle = S3.shade('#3a3440', n); x.fill(); }
  }
  function gallery(x, cam, j, u) {
    const { a, b } = edge(...WALKS[j]), e = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], h0 = TOP(), d = Math.hypot(b[0] - a[0], b[1] - a[1]) * u;
    if (d < .2) return;
    const n = [-(b[1] - a[1]), b[0] - a[0]], nl = Math.hypot(n[0], n[1]), wv = [n[0] / nl * .65, n[1] / nl * .65];
    x.strokeStyle = '#3a2c26'; x.lineWidth = 1.2; x.beginPath();
    for (let s = 0; s <= d; s += 1.6) { const q = [lerp(a[0], e[0], s / d), lerp(a[1], e[1], s / d)]; for (const sg of [-1, 1]) S3.line(x, cam, [q[0] + sg * wv[0], h0, -(q[1] + sg * wv[1])], [q[0] + sg * wv[0], h0 + 1.7, -(q[1] + sg * wv[1])]); }
    x.stroke();
    const roof = [[a[0] - wv[0] * 1.3, a[1] - wv[1] * 1.3], [e[0] - wv[0] * 1.3, e[1] - wv[1] * 1.3], [e[0] + wv[0] * 1.3, e[1] + wv[1] * 1.3], [a[0] + wv[0] * 1.3, a[1] + wv[1] * 1.3]];
    if (S3.poly(x, cam, roof.map(q => [q[0], h0 + 1.9, -q[1]]))) { x.fillStyle = '#4a3a3e'; x.fill(); x.strokeStyle = '#2a2026'; x.lineWidth = 1; x.stroke(); }
  }
  function tunnels(x, cam, t) {
    x.save(); x.lineCap = 'butt'; x.setLineDash([9, 7]); x.lineWidth = 3; x.strokeStyle = 'rgba(214,176,120,.62)';
    TUNNELS.forEach(([i, j], k) => {
      const u = tunU(k, t); if (u <= 0) return;
      const { a, b } = edge(i, j), e = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
      x.beginPath(); QM.polyline(x, cam, [a, e], TOP()); x.stroke();
    });
    x.setLineDash([]); x.fillStyle = 'rgba(30,18,12,.9)';
    TUNNELS.forEach(([i, j], k) => {
      const u = tunU(k, t); if (u <= 0) return;
      const { a, b } = edge(i, j);
      for (const q of u >= 1 ? [a, b] : [a]) { const p = cam.at(q[0], q[1], TOP()); if (!p) continue; const r = .9 * p[3]; x.beginPath(); x.ellipse(p[0], p[1], r, r * .5, 0, PI, TAU); x.fill(); }
    });
    x.restore();
  }

  const LPATH = (() => { const e1 = edge(4, 0), e2 = edge(0, 3); return QM.road([e1.a, e1.b, [PAL[0].x, PAL[0].y + PD + 1], e2.a, e2.b]); })();
  const lantern = t => ss(T_NO - .2, T_NO + .1, t) * (1 - ss(T_MOVE + .4, T_MOVE + .7, t));
  const lanternAt = t => QM.along(LPATH, LPATH.L * easeIO(clamp((t - T_NO + .2) / (T_MOVE + .6 - T_NO))));
  const NIGHTS = (() => { const order = [3, 6, 1, 7, 5, 2], out = []; let t = T_SLEPT - .05; const d0 = .62; order.forEach((p, i) => { const d = d0 * Math.pow(.86, i); out.push({ p, t0: t, t1: i === order.length - 1 ? T_EVERY : t + d }); t += d; }); return out; })();
  const winA = (p, t) => { let a = 0; for (const n of NIGHTS) if (n.p === p) a = Math.max(a, ss(n.t0, n.t0 + .1, t) * (1 - ss(n.t1 - .08, n.t1, t))); return a; };
  const HOPS = [2, 7, 0, 4, 1];
  const hopAt = t => { const k = (t - T_EXCEPT) / .42; if (k < 0) return null; const i = Math.floor(k) % HOPS.length; return { p: HOPS[i], a: Math.sin(PI * (k - Math.floor(k))) }; };
  const SPY0 = [PAL[2].x + 2, PAL[2].y + PD + 1.6], SPY1 = [PAL[2].x + 16, PAL[2].y + 12];
  const spyU = t => easeIO(clamp((t - T_REV) / (T_CAP - T_REV)));
  const spyA = t => ss(T_REV - .1, T_REV + .2, t) * (1 - ss(T_CRIME + .1, T_CRIME + .5, t));

  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const B = A12(), [sx, sy, sz, sp, sw, sl] = B.spl(), T12 = B.DUR, top = TOP();
    const at12 = d => [d, sx(T12 + d), sy(T12 + d), Math.exp(sz(T12 + d)), sp(T12 + d), sw(T12 + d), sl(T12 + d)];
    const K = [at12(-.6), at12(0), at12(.25),
      [T_EMP + .45, XY[0] + 1, XY[1] - 3, 14, 44, -6, top],
      [T_TUN + .2, XY[0] + 1, XY[1] - 3.5, 14.4, 45, -6, top],
      [T_SLEPT + .2, XY[0], XY[1] - 4, 14.8, 45, -6, top],
      [T_CRIME + .3, XY[0] + 1, XY[1] - 5, 15.2, 45, -5, top],
      [T_EVERY + .2, XY[0] + 60, XY[1] - 6, 4.5, 50, 0, top],
      [T_EXCEPT + .3, XY[0] + 110, XY[1] - 20, 2.1, 52, 2, top],
      [DUR + 1, XY[0] + 115, XY[1] - 22, 1.9, 54, 3, top]];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camAt(t) {
    if (t <= 0) return A12().camAt(A12().DUR);
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  function hisLight(ctx, cam, tl, a) {
    if (a <= 0) return;
    const g = A10().geo(), sh = SH(), u = QM.up(cam, g.XY[0], g.XY[1], g.top + 10); if (!u) return;
    const fl = 1 + .06 * Math.sin(tl * 11) + .04 * Math.sin(tl * 17.3), r = Math.min(2.4, u.k * A6().magT(cam) / 3);
    PR.glow(ctx, u.x - sh.x, u.y - sh.y, 120 * r * fl, '#ffcf80', .55 * a, 'flat');
    PR.glow(ctx, u.x - sh.x, u.y - sh.y, 30 * r * fl, '#fff4dc', .8 * a, 'flat');
  }
  function uprights(put, cam, t) {
    PAL.forEach((p, i) => { const k = upAt(i, t); if (k > 0) put(p.x, p.y, TOP(), x => palace(x, cam, p, k)); });
    WALKS.forEach((wk, j) => { const u = walkU(j, t); if (u <= 0) return; const { a, b } = edge(...wk); put((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, TOP(), x => gallery(x, cam, j, u)); });
  }
  function lights(ctx, t, cam, o) {
    const sh = SH(), win = (p, a) => {
      if (a <= 0) return; const P = PAL[p], h = TOP() + 1.5 * upAt(p, t), q = cam.at(P.x, P.y + PD + .02, h); if (!q) return;
      const r = .75 * q[3]; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,214,140,${a})`; ctx.fillRect(q[0] - sh.x - r, q[1] - sh.y - r * .7, 2 * r, 1.4 * r); ctx.restore();
      PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, 3.2 * q[3], '#ffc977', .55 * a, 'flat');
    };
    PAL.forEach((p, i) => win(i, winA(i, t)));
    const hp = o && o.hop ? o.hop(t) : hopAt(t); if (hp) win(hp.p, .4 + .6 * hp.a);
    const la = lantern(t);
    if (la > 0) { const q = lanternAt(t), p = cam.at(q[0], q[1], TOP() + 1.1); if (p) PR.glow(ctx, p[0] - sh.x, p[1] - sh.y, 1.6 * p[3], '#ffcf80', .5 * la, 'flat'); }
    const sa = spyA(t);
    if (sa > 0) {
      const u = spyU(t), q = [lerp(SPY0[0], SPY1[0], u), lerp(SPY0[1], SPY1[1], u)], cut = ss(T_CAP + .1, T_CRIME, t), red = ss(T_CRIME - .05, T_CRIME + .05, t);
      const a0 = cam.at(SPY0[0], SPY0[1], TOP() + .4), a1 = cam.at(q[0], q[1], TOP() + .4);
      if (a0 && a1) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = `rgba(255,226,160,${.75 * sa * (1 - cut)})`; ctx.lineWidth = 2;
        const m = [lerp(a0[0], a1[0], .5) - sh.x, lerp(a0[1], a1[1], .5) - sh.y], gap = 22 * cut;
        const d = [a1[0] - a0[0], a1[1] - a0[1]], L = Math.hypot(d[0], d[1]) || 1, ud = [d[0] / L, d[1] / L];
        ctx.beginPath(); ctx.moveTo(a0[0] - sh.x, a0[1] - sh.y); ctx.lineTo(m[0] - ud[0] * gap, m[1] - ud[1] * gap); ctx.moveTo(m[0] + ud[0] * gap, m[1] + ud[1] * gap); ctx.lineTo(a1[0] - sh.x, a1[1] - sh.y); ctx.stroke(); ctx.restore();
        PR.glow(ctx, a1[0] - sh.x, a1[1] - sh.y, 1.2 * a1[3], red > .5 ? '#ff3b2a' : '#ffd890', sa * (1 + .8 * red), 'flat');
      }
    }
    const ta = ss(T_EVERY - .1, T_HEAVEN, t);
    if (ta > 0) for (const l of A10().geo().lights) {
      const u = QM.up(cam, l.x, l.y, A10().geo().top + l.h); if (!u) continue;
      const on = ta * ss(0, 1, (ta * 1.6 - (l.seed % 7) / 10)), tw = .85 + .15 * Math.sin(t * 9 + l.seed * 2.3); if (on <= 0) continue;
      PR.glow(ctx, u.x - sh.x, u.y - sh.y, 16 + 8 * Math.min(1.5, u.k / 2), '#ffc977', .55 * on * tw, 'flat');
      PR.glow(ctx, u.x - sh.x, u.y - sh.y, 3.5, '#fff3d6', .9 * on, 'flat');
    }
  }
  function nightsPass(ctx, t) {
    let a = 0; for (let i = 1; i < NIGHTS.length; i++) { const n = NIGHTS[i]; a = Math.max(a, Math.exp(-Math.pow((t - n.t0) / .07, 2))); }
    if (a <= .01) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(90,110,160,${.32 * a})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  function frame(ctx, t, cam, o) {
    const B = A12(), t12 = B.DUR + t, tl = A10().DUR + t12, dark = t > T_DIS;
    B.world(ctx, t12, cam, {
      throneK: 1 - ss(T_DIS - .05, T_DIS + .55, t),
      uprights: (put, cm) => uprights(put, cm, t),
      light: (c, cm) => hisLight(c, cm, tl, 1 - ss(T_DIS, T_DIS + .3, t)),
    });
    if (t < T_EMP + .6) { B.things(ctx, t12, cam, { dark, noMusician: true }); B.glows(ctx, t12, cam, { dark }); }
    if (t > T_TUN - .2) FL.sheet(ctx, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => tunnels(x, cam, t), { shadow: false });
    lights(ctx, t, cam, o);
    nightsPass(ctx, t);
    FL.grade(ctx, T0() + t);
  }
  function draw(ctx, t) {
    if (t <= 0) return F.getScene('seq-12').draw(ctx, A12().DUR);
    frame(ctx, t, camAt(t));
  }

  F.scene('seq-13', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: T_DIS - .3, type: 'whoosh', f0: 90, f1: 180, dur: 1.2, g: .12 },
      { t: T_DIS + .02, type: 'tap', g: .2, noSnap: true },
      { t: T_DIS + .1, type: 'rumble', dur: .8, g: .14 },
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ t: T_BUILT + .1 + .075 * i, type: 'clunk', f: 70 + 6 * i, g: .1 })),
      ...WALKS.map((wk, j) => ({ t: T_COV + .1 + .09 * j, type: 'slide', dur: .6, g: .06 })),
      { t: T_TUN, type: 'rumble', dur: 1.3, g: .2 },
      { t: T_NO - .1, type: 'hum', dur: T_MOVE - T_NO + .8, g: .06 },
      ...NIGHTS.slice(1).map(n => ({ t: n.t0, type: 'shimmer', g: .07 })),
      ...NIGHTS.map(n => ({ t: n.t0 + .05, type: 'tap', g: .12, noSnap: true })),
      { t: T_REV, type: 'riser', dur: T_CAP - T_REV, f0: 2600, f1: 3400, g: .05 },
      { t: T_CRIME - .02, type: 'crack', g: .3, noSnap: true },
      { t: T_CRIME + .05, type: 'thud', g: .28, noSnap: true },
      { t: T_EVERY - .4, type: 'whoosh', f0: 60, f1: 140, dur: 2.2, g: .12 },
      { t: T_HEAVEN, type: 'shimmer', g: .16 },
      { t: T_PEACE, type: 'heartbeat', g: .3 },
    ],
    api: { DUR, camAt, spl, frame, hopAt, PAL, PD, upAt, TOP, uprights },
  });
})();
