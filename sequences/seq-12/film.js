(function () {
  'use strict';
  const F = FILM, PR = F.props, QM = F.qinmap, CH = F.china, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-12'), DUR = C.duration;
  const FL = F.look('flat', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api, A8 = () => F.getScene('seq-08').api, A9 = () => F.getScene('seq-09').api, A10 = () => F.getScene('seq-10').api;
  const S11 = () => F.getScene('seq-11'), A11 = () => S11().api;
  const TW = () => A9().DUR + A10().DUR;
  const T0 = () => A6().DUR + F.getScene('seq-07').api.DUR + A8().DUR + A9().DUR + A10().DUR + A11().DUR;

  const T_MORE = 0.56, T_ATT = 0.75;
  const T_BLIND = 1.8, T_MUS = 2.13, T_LEAD = 3.01, T_LUTE = 3.81;
  const T_STRONG = 5.05, T_HURL = 5.9, T_CONE = 6.75, T_WINE = 7.74;
  const T_CONVOY = 9.15, T_IMP = 8.59, T_CRUSH = 9.79, T_WRONG = 10.49, T_CARR = 10.85;
  const T_G1 = .5, T_XF0 = .3, T_XF1 = .65, T_HOLD = T_XF1 + .15, T_WIDE = 1.35;

  const P = (lon, lat) => CH.proj(lon, lat), XY = QM.byId.qin.cap, hC = 36;
  const TOP = () => A8().geo().top;
  const BLS = P(113.95, 35.05), ROADY = XY[1];
  const HILL = [BLS[0] + 1.5, ROADY - 7.5], HILL_R = 7, HILL_H = 4.2;
  const M1 = [XY[0] + 13, XY[1] + 5], M2 = [HILL[0] - .6, HILL[1] + .4];
  const FIGS = [
    { at: M1, kind: 'musician', look: Q.silhouette('emperor', '#14131c'), sx: 1 },
    { at: M2, kind: 'strong', look: Q.silhouette('worker', '#14131c'), sx: 1.28 },
  ];
  const RIM = '#a9bde8', RIMS = { musician: Q.silhouette('emperor', RIM), strong: Q.silhouette('worker', RIM) };
  const hillUp = () => 1;
  const ground = (i, t) => TOP() + (i === 1 ? HILL_H : 0);
  const fill1 = () => 1, xray = t => ss(T_LEAD, T_LEAD + .35, t) * (1 - ss(T_LUTE + .5, T_LUTE + .9, t));
  const sag = t => ss(T_LUTE - .05, T_LUTE + .45, t);
  const fill2 = () => 1;
  const STAND = { ...Mo.stand(0), arms: [[.06, .16, -.12], [.08, .2, -.12]] };
  const MD = 140, MWALK = Mo.gait({ from: 0, to: MD, t0: -1.2, gait: 'walk', style: { step: 46, lift: 6, lean: .06, arms: .3, bob: 2.4 }, until: T_STRONG + .2 });
  const MDIR = (() => { const d = [XY[0] - M1[0], XY[1] - M1[1]], L = Math.hypot(d[0], d[1]); return [d[0] / L, d[1] / L]; })();
  const MLEN = MD / 92 * 7;
  const musAt = t => { const k = MWALK.x(t) / MD - 1; return [M1[0] + MDIR[0] * MLEN * k, M1[1] + MDIR[1] * MLEN * k]; };

  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  const MPUFF = (() => { const r = F.rng(31); return MWALK.falls.map(() => Array.from({ length: 5 }, () => [r() - .5, r(), r()])); })();
  function mdust(ctx, t, cam) {
    const sh = SH();
    MWALK.falls.forEach((fl, i) => {
      const age = t - fl.t; if (age < 0 || age > 2.6 || fl.close) return;
      const k = fl.x / MD - 1, fx = M1[0] + MDIR[0] * MLEN * k, fy = M1[1] + MDIR[1] * MLEN * k, u = age / 2.6;
      for (const [dx, dy, kk] of MPUFF[i]) {
        const q = QM.up(cam, fx + dx * .9 * Math.sqrt(u), fy, TOP() + (.15 + .9 * dy) * Math.sqrt(u)); if (!q) continue;
        PR.glow(ctx, q.x - sh.x, q.y - sh.y, (.25 + .7 * Math.sqrt(u) * (.6 + .5 * kk)) * q.k, '#aeb6cc', .22 * (1 - u) * smooth(age / .2), 'flat');
      }
    });
  }
  function figure(x, u, cam, i, t, hPx) {
    const f = FIGS[i], s = hPx / 92, lev = u.lev, tilt = clamp(1 - lev, 0, .6);
    const facing = i === 1 ? 1 : -1, yaw = facing > 0 ? 0 : PI, tp = Mo.pose(t);
    const pose = i === 0 ? { ...centre(MWALK(tp), MWALK.x(tp)), yaw } : { ...STAND, yaw };
    if (i === 0) { const g = sag(t); pose.lean = (pose.lean || 0) + .14 * g; pose.bend = (pose.bend || 0) + .1 * g; pose.head = (pose.head || 0) + .22 * g; }
    const up = 1;
    const fl = i === 0 ? fill1(t) : i === 1 ? fill2(t) : 0;
    const behind = i === 0 && fl > 0 ? (xx, pj) => zhu(xx, pj, yaw, fl, t) : null;
    const prop = i === 0 && fl > 0 ? (xx, pj) => band(xx, pose, pj, fl) : null;
    const draw = (L, dx, dy, o) => { x.save(); x.translate(u.x + dx, u.y + dy); x.scale(s * f.sx, s * up); Q.draw(x, PA.P, pose, L, { tilt, robe: 40, shadow: 0, cover: i !== 1, ...o }); x.restore(); };
    x.save(); x.globalAlpha *= Math.min(1, up * 1.4);
    draw(RIMS[f.kind], -1.6, -1.3, { behind: null, prop: null });
    draw(f.look, 0, 0, { behind, prop });
    x.restore();
  }
  function band(x, pose, pj, a) {
    const J = Mo.joints(pose), hc = Q.project(pose, J.head, 0, .1), fw = Math.cos(pose.yaw);
    x.save(); x.globalAlpha *= a; x.fillStyle = '#cfd6ea';
    x.beginPath(); x.ellipse(hc[0] + fw * 1.5, hc[1] - .5, 6.4, 1.7, -.08 * fw, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(hc[0] - fw * 5, hc[1] - 1); x.quadraticCurveTo(hc[0] - fw * 9, hc[1] + 3, hc[0] - fw * 10, hc[1] + 8); x.lineTo(hc[0] - fw * 8.4, hc[1] + 8.4); x.quadraticCurveTo(hc[0] - fw * 7.4, hc[1] + 3, hc[0] - fw * 4.4, hc[1] + .6); x.closePath(); x.fill();
    x.restore();
  }
  function zhu(x, pj, yaw, a, t) {
    const fw = Math.cos(yaw), sh = pj.sh, A = [sh[0] - fw * 13, sh[1] + 38], B = [sh[0] + fw * 2, sh[1] - 34];
    const d = [B[0] - A[0], B[1] - A[1]], L = Math.hypot(d[0], d[1]), ang = Math.atan2(d[1], d[0]), xr = xray(t);
    x.save(); x.globalAlpha *= a; x.translate(A[0], A[1]); x.rotate(ang);
    x.fillStyle = '#14131c'; x.beginPath(); x.roundRect(0, -4.6, L, 9.2, 2.2); x.fill();
    x.fillStyle = '#14131c'; x.beginPath(); x.roundRect(L - 3, -6.2, 6, 12.4, 2); x.fill();
    if (xr > 0) {
      x.fillStyle = `rgba(205,220,250,${.85 * xr})`; x.beginPath(); x.roundRect(1.2, -3.4, L - 2.4, 6.8, 1.6); x.fill();
      x.fillStyle = `rgba(40,42,54,${xr})`; for (const k of [.16, .4, .64]) x.fillRect(L * k, -2.9, L * .18, 5.8);
      x.strokeStyle = `rgba(240,246,255,${.7 * xr})`; x.lineWidth = .5; for (const k of [.18, .42, .66]) x.strokeRect(L * k, -2.7, L * .16, 5.4);
    }
    x.strokeStyle = `rgba(169,189,232,${.6 * a})`; x.lineWidth = .35; x.beginPath(); for (const s of [-2.2, 0, 2.2]) { x.moveTo(3, s); x.lineTo(L - 3, s); } x.stroke();
    x.restore();
    x.save(); x.globalAlpha *= a; x.strokeStyle = '#a9bde8'; x.lineWidth = 1; x.beginPath(); x.moveTo(sh[0] - fw * 4, sh[1] - 2); x.lineTo(sh[0] + fw * 5, sh[1] + 22); x.stroke(); x.restore();
  }

  const T_CUP = T_CONE - .1, T_JAR = T_WINE - .05, T_FLY = T_CRUSH - .5, T_HIT = T_CRUSH + .02;
  const SIZE = 3.7;
  function cone(x, cam, px, py, h, s, a) {
    const b = QM.up(cam, px, py, h); if (!b || a <= 0) return;
    const k = b.k * s, r = .48 * SIZE * k, hh = SIZE * k;
    x.save(); x.globalAlpha *= a;
    x.fillStyle = '#23252e'; x.beginPath(); x.moveTo(b.x - r, b.y); x.lineTo(b.x, b.y - hh); x.lineTo(b.x + r, b.y); x.ellipse(b.x, b.y, r, r * .3 * (1 - b.lev), 0, 0, PI); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(190,206,240,.85)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(b.x - r, b.y); x.lineTo(b.x, b.y - hh); x.lineTo(b.x + r, b.y); x.stroke();
    x.fillStyle = '#23252e'; x.beginPath(); x.arc(b.x, b.y - hh * 1.02, hh * .07, 0, TAU); x.fill();
    x.restore();
  }
  function jar(x, cam, px, py, h, a) {
    const b = QM.up(cam, px, py, h); if (!b || a <= 0) return;
    const k = b.k, hh = SIZE * k, rw = .42 * SIZE * k;
    x.save(); x.globalAlpha *= a; x.fillStyle = '#3a2a24';
    x.beginPath(); x.moveTo(b.x - rw * .45, b.y); x.bezierCurveTo(b.x - rw * 1.3, b.y - hh * .35, b.x - rw * 1.1, b.y - hh * .75, b.x - rw * .28, b.y - hh * .86);
    x.lineTo(b.x - rw * .32, b.y - hh); x.lineTo(b.x + rw * .32, b.y - hh); x.lineTo(b.x + rw * .28, b.y - hh * .86);
    x.bezierCurveTo(b.x + rw * 1.1, b.y - hh * .75, b.x + rw * 1.3, b.y - hh * .35, b.x + rw * .45, b.y); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(190,206,240,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(b.x + rw * .9, b.y - hh * .65); x.quadraticCurveTo(b.x + rw * 1.05, b.y - hh * .4, b.x + rw * .6, b.y - hh * .12); x.stroke();
    x.restore();
  }

  const NC = 5, GAP = 12.5, V = 7, X_HIT = HILL[0] + 10, C_HIT = 2, C_HIM = 3, SC = 2.2;
  const T_IN = T_IMP - .05;
  const carX = (c, t) => { const tt = c === C_HIT ? Math.min(t, T_HIT) : t; return X_HIT + V * (tt - T_HIT) - (c - C_HIT) * GAP; };
  const carY = (c, t) => { if (c <= C_HIT || t < T_HIT) return ROADY; const x = carX(c, t); return ROADY + 3.4 * ss(X_HIT - 13, X_HIT - 5, x) * (1 - ss(X_HIT + 5, X_HIT + 13, x)); };
  const HORSE = [[0, 1.0], [.1, 1.42], [.5, 1.55], [1.45, 1.5], [1.75, 1.95], [1.95, 2.18], [2.12, 2.12], [2.35, 1.82], [2.25, 1.72], [1.95, 1.8], [1.62, 1.3], [1.5, 1.0], [.2, .95]];
  const INK = '#14131c', WR = .7;
  function carriage(x, cam, px, py, run, o) {
    const h0 = TOP(), crush = o.crush || 0, at = (f, l, u) => cam.at(px + f * SC, py - l * SC, h0 + u * SC);
    const poly = (pts, fill) => { const q = pts.map(p => at(...p)); if (q.some(v => !v)) return null; x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } return q; };
    const line = (p, q, wd, col) => { const A = at(...p), B = at(...q); if (!A || !B) return; x.strokeStyle = col; x.lineWidth = Math.max(.6, wd * SC * (A[3] + B[3]) / 2); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); };
    const near = cam.pos[2] < -py ? 1 : -1;
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    const wheel = (l, lean) => {
      const rot = -run / WR, R = Array.from({ length: 16 }, (_, i) => { const q = i / 16 * TAU; return [WR * Math.cos(q), l + lean * (1 + Math.sin(q)) * .3, WR + WR * Math.sin(q)]; });
      const q = R.map(p => at(...p)); if (q.some(v => !v)) return;
      x.strokeStyle = INK; x.lineWidth = Math.max(1, .14 * SC * q[0][3]); x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.stroke();
      for (let i = 0; i < 4; i++) { const a = rot + i / 4 * PI; line([WR * Math.cos(a), l, WR + WR * Math.sin(a)], [-WR * Math.cos(a), l, WR - WR * Math.sin(a)], .06, INK); }
    };
    const horses = () => {
      const f0 = 1.2, legs = [[.32, 0], [.42, .5], [1.32, .25], [1.42, .75]], go = o.stop ? 0 : 1;
      for (const lane of [-.38, .38]) {
        legs.forEach(([lf, ph], i) => { const sw = .3 * go * Math.sin(run / .9 * PI + ph * TAU + lane * 3), l = lane + (i % 2 ? .12 : -.12); line([f0 + lf, l, 1.02], [f0 + lf + sw, l, .02], .12, INK); });
        for (const l of [-.12, 0, .12]) poly(HORSE.map(([f, u]) => [f0 + f, lane + l * (u > 1.6 && f > 1.6 ? .45 : 1), u]), INK);
      }
      line([.7, 0, WR + .3], [f0 + .6, 0, 1.25], .07, INK);
    };
    const body = () => {
      const top = WR + .3 + 1.25 * (1 - .62 * crush), tl = crush * .35;
      for (const l of [-.55, .55]) poly([[-.95, l, WR + .3], [.75, l, WR + .3], [.75, l, top - tl * (l + .55)], [-.95, l, top - tl * (l + .55)]], '#262330');
      poly([[-.95, -.55, WR + .3], [-.95, .55, WR + .3], [-.95, .55, top - tl * 1.1], [-.95, -.55, top]], '#2c2938');
      const rim = Array.from({ length: 18 }, (_, i) => { const q = i / 18 * TAU, c = Math.cos(q), s = Math.sin(q); return [-.1 + 1.1 * c, .75 * s, top + .08 - crush * .4 * (s + 1) * .5]; });
      poly(rim, '#1f1c28');
      const crown = rim.map(([f, l, u]) => [-.1 + (f + .1) * .6, l * .6, u + .32 * (1 - crush)]);
      poly(crown, '#2a2634');
      const wl = near * .56, wy0 = WR + .55, wy1 = WR + .55 + .55 * (1 - .7 * crush);
      const win = poly([[-.55, wl, wy0], [.35, wl, wy0], [.35, wl, wy1], [-.55, wl, wy1]], o.lit ? '#ffd890' : '#0e0d14');
      if (o.lit && win) { x.strokeStyle = 'rgba(255,240,200,.9)'; x.lineWidth = 1; x.stroke(); }
    };
    wheel(near * -.62, crush);
    horses(); body();
    wheel(near * .62, -crush);
    if (crush > 0) {
      const R = F.rng(5);
      for (let i = 0; i < 14; i++) { const a = R() * TAU, d = (.4 + 1.2 * R()) * Math.min(1, crush * 1.6), up = .4 + R() * 1.4; line([Math.cos(a) * d, Math.sin(a) * d, up * (1 - crush * .7)], [Math.cos(a) * d + .25, Math.sin(a) * d, up * (1 - crush * .7) + .1], .05, INK); }
    }
    x.restore();
  }
  const crushOf = t => ss(T_HIT, T_HIT + .18, t);
  function conePath(t) {
    const u = clamp((t - T_FLY) / (T_HIT - T_FLY)), c = [M2[0] + 1.6, M2[1] + .6], d = [carX(C_HIT, T_HIT), ROADY];
    return { x: lerp(c[0], d[0], u), y: lerp(c[1], d[1], u), h: lerp(TOP() + HILL_H, TOP() + 2.4 * SC, u) + 13 * Math.sin(PI * u), u };
  }

  let GC = null;
  const glintAt = () => GC || (GC = A11().tipAt(A11().DUR + T_XF1));
  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  const top0 = () => TOP() + 10;
  const KEYS = () => [
    [0, XY[0], XY[1], 34, 46, -10, top0()],
    [T_HOLD, XY[0], XY[1], 33, 46, -10, top0()],
    [T_STRONG - .15, XY[0] + 4, XY[1] + 1, 26, 42, -6, TOP() + 3],
    [T_STRONG + 1.25, HILL[0] + 4, ROADY - 3.5, 26, 26, 0, TOP() + 4],
    [T_CRUSH, X_HIT - 3, ROADY - 2, 26.4, 23, 0, TOP() + 3],
    [T_CARR + .3, X_HIT + 2, ROADY - 1.5, 26.8, 22, 1, TOP() + 3],
    [DUR + 1, X_HIT + 6, ROADY - 1.5, 27.2, 22, 2, TOP() + 3],
  ];
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const K = KEYS(), ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camAt(t) {
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t), g = glintAt(), k = ss(T_XF1, T_WIDE, t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t), cx: lerp(g[0], W / 2, k), cy: lerp(g[1], H / 2, k) }, W, H, A6().FLENS);
  }

  function hill(put, cam, t) {
    const a = hillUp(t); if (a <= 0) return;
    put(HILL[0], HILL[1] - HILL_R, TOP(), x => {
      for (let i = 0; i <= 6; i++) {
        const k = i / 6, r = HILL_R * Math.sqrt(1 - k * k * .92), h = TOP() + HILL_H * a * k;
        x.fillStyle = i < 6 ? F.tone('#b3ad7c', '#4a4836', .45 - .3 * k) : '#c2bc8a'; x.beginPath(); QM.ring(x, cam, QM.disk(HILL[0], HILL[1], r, 40), h); x.fill();
      }
    });
  }
  function world(ctx, t, cam, ex) {
    A9().world(ctx, TW() + t, cam, { noCarts: true, throneK: ex && ex.throneK, onTop: ex && ex.onTop, uprights: (put, cm) => { hill(put, cm, t); if (ex && ex.uprights) ex.uprights(put, cm); } });
    A10().night(ctx, A10().DUR + t);
    if (ex && ex.light) ex.light(ctx, cam); else A10().lights(ctx, A10().DUR + t, cam);
  }
  function things(ctx, t, cam, o) {
    const L = [], put = (mx, my, h, draw) => { const u = QM.up(cam, mx, my, h); if (u && u.d > 2) L.push({ d: u.d, u, draw }); };
    const m = clamp(8 / cam.z, 1, 4);
    FIGS.forEach((f, i) => { if (i === 0 && o && o.noMusician) return; const at = i === 0 ? musAt(t) : f.at; put(at[0], at[1], ground(i, t), (x, u) => figure(x, u, cam, i, t, (i === 1 ? 7.6 : 7) * u.k * m * (.5 + .5 * u.lev))); });
    const ca = 1;
    if (t < T_FLY) put(M2[0] + 1.6, M2[1] + .6, TOP() + HILL_H, x => cone(x, cam, M2[0] + 1.6, M2[1] + .6, TOP() + HILL_H, 1, ca));
    if (t >= T_FLY && t < T_HIT) { const p = conePath(t); put(p.x, p.y, p.h, x => cone(x, cam, p.x, p.y, p.h, 1, 1)); }
    if (t >= T_HIT) { const cx = carX(C_HIT, t), h = TOP() + (WR + .3 + 1.25 * (1 - .62 * crushOf(t))) * SC * .8; put(cx - .2, ROADY - .4, h, x => cone(x, cam, cx - .2, ROADY - .4, h, 1, 1)); }
    const ja = 1;
    put(M2[0] + 3.4, M2[1] + .7, TOP() + HILL_H, x => jar(x, cam, M2[0] + 3.4, M2[1] + .7, TOP() + HILL_H, ja));
    for (let c = 0; c < NC; c++) {
      const px = carX(c, t), py = carY(c, t);
      put(px, py, TOP(), x => { x.save(); carriage(x, cam, px, py, px, { crush: c === C_HIT ? crushOf(t) : 0, lit: c === C_HIM && !(o && o.dark), stop: c === C_HIT && t > T_HIT }); x.restore(); });
    }
    L.sort((a, b) => b.d - a.d);
    FL.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; for (const o of L) o.draw(x, o.u); }, { flatShadow: [3, 5, 4, .35] });
  }
  function glows(ctx, t, cam, o) {
    if (!(o && o.noMusician) && t < T_STRONG + 1) mdust(ctx, t, cam);
    const sh = SH(), m = clamp(8 / cam.z, 1, 4);
    for (const [tw, dx, dy] of [[T_CONE, 1.6, .6], [T_WINE, 3.4, .7]]) {
      const a = ss(tw - .1, tw + .15, t) * (1 - ss(tw + .7, tw + 1.3, t)); if (a <= 0 || t > T_FLY) continue;
      const u = QM.up(cam, M2[0] + dx, M2[1] + dy, TOP() + HILL_H + SIZE * .5); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, SIZE * 1.4 * u.k, '#b4c6f0', .4 * a, 'flat');
    }
    if (!(o && o.dark)) { const px = carX(C_HIM, t), u = QM.up(cam, px - .1 * SC, carY(C_HIM, t), TOP() + 1.5 * SC); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 1.6 * SC * u.k, '#ffcf80', .7, 'flat'); }
    const xr = xray(t);
    if (xr > 0) { const ma = musAt(t), u = QM.up(cam, ma[0], ma[1], TOP() + 4); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 9 * u.k, '#bcd0ff', .3 * xr, 'flat'); }
    const hk = t - T_HIT;
    if (hk > 0 && hk < 1.6) {
      const u = QM.up(cam, carX(C_HIT, t), ROADY, TOP() + 1.5 * SC); if (u) {
        PR.glow(ctx, u.x - sh.x, u.y - sh.y, (3 + 6 * hk) * u.k, '#ffe2b0', .55 * Math.exp(-hk * 5), 'flat');
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (let i = 0; i < 9; i++) { const a = i / 9 * PI + .1, r = (.6 + 2.2 * Math.sqrt(hk)) * u.k * (.8 + .4 * Math.sin(i * 7)); ctx.fillStyle = `rgba(120,118,130,${.28 * (1 - hk / 1.6)})`; ctx.beginPath(); ctx.arc(u.x - sh.x + Math.cos(a) * r * 1.4, u.y - sh.y - Math.sin(a) * r * .6, r * .45, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    }
  }
  const lightPos = cam => { const g = A10().geo(), p = cam.at(g.XY[0], g.XY[1], g.top + 10); return p ? [p[0] - SH().x, p[1] - SH().y] : glintAt(); };
  function own(ctx, t) {
    const cam = camAt(t);
    world(ctx, t, cam);
    things(ctx, t, cam);
    glows(ctx, t, cam);
    FL.grade(ctx, T0() + t);
    shine(ctx, t, lightPos(cam));
  }
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function shine(ctx, t, at) {
    const g = 2.4 * ss(.05, T_G1, t) * (1 - ss(T_XF1, T_XF1 + .5, t)); if (g <= 0) return;
    PR.glow(ctx, at[0], at[1], 40 + 160 * g, '#fff2d0', Math.min(1, .5 * g), 'flat');
    PR.glow(ctx, at[0], at[1], 10 + 40 * g, '#ffffff', Math.min(1, .8 * g), 'flat');
  }
  function draw(ctx, t) {
    const S = S11();
    if (t <= 0) return S.draw(ctx, S.duration);
    if (t >= T_XF1) return own(ctx, t);
    S.draw(ctx, S.duration + t);
    shine(ctx, t, A11().tipAt(S.duration + t));
    const b = ss(T_XF0, T_XF1, t); if (b <= 0) return;
    const [cv, x] = buf(); clean(x); own(x, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = b; ctx.drawImage(cv, 0, 0); ctx.restore();
  }

  F.scene('seq-12', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'riser', dur: .55, f0: 1200, f1: 4200, g: .08 },
      { t: T_XF0, type: 'whoosh', f0: 240, f1: 70, dur: .9, g: .14 },
      { t: T_ATT, type: 'hum', dur: 1.6, g: .07 },
      { t: T_BLIND, type: 'shimmer', g: .12 },
      { t: T_MUS, type: 'lib', dur: 1.3, label: 'ONE LOW STRING OF A ZITHER STRUCK, RINGING' },
      { t: T_LEAD, type: 'clunk', f: 70, g: .3, noSnap: true },
      { t: T_LUTE + .1, type: 'thud', g: .2 },
      ...MWALK.falls.filter(f => f.t > .7 && f.t < T_STRONG).map(f => ({ t: f.t, type: 'thud', g: .1 })),
      { t: T_STRONG - .5, type: 'whoosh', f0: 80, f1: 170, dur: .9, g: .12 },
      { t: T_CONE, type: 'shimmer', g: .08 },
      { t: T_WINE, type: 'shimmer', g: .07 },
      { t: T_STRONG + .8, type: 'rumble', dur: DUR - T_STRONG - .8, g: .1 },
      { t: T_STRONG + .8, type: 'lib', dur: DUR - T_STRONG - .8, label: 'CARRIAGES AND HORSES ON A DIRT ROAD AT NIGHT, WHEELS CREAKING' },
      { t: T_FLY, type: 'whizz', dur: T_HIT - T_FLY, f0: 900, f1: 300, g: .3 },
      { t: T_HIT, type: 'impact', size: .5, g: .5, noSnap: true },
      { t: T_HIT, type: 'crack', g: .35, noSnap: true },
      { t: T_HIT + .02, type: 'lib', dur: 1.2, label: 'WOOD SMASHING, A CARRIAGE CRUSHED' },
      { t: T_WRONG, type: 'heartbeat', g: .24 },
    ],
    api: { DUR, camAt, world, carX, carY, C_HIM, C_HIT, ROADY, things, glows, crushOf, TW, spl },
  });
})();
