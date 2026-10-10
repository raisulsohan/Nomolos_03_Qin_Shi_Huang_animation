(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, CH = F.china, Mo = F.motion, Q = F.qin, HB = F.harbour, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-27'), DUR = C.duration, GT0 = C.T.start;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A15 = () => F.getScene('seq-15').api, A6 = () => F.getScene('seq-06').api;
  const P = (lon, lat) => CH.proj(lon, lat);
  const TOP = () => A15().TOPH();
  const TF = 23.16 - .15;

  const T_210 = 0.2, T_FIFTH = 2.26, T_EMP = 3.52, T_STILL = 4.55, T_DREAM = 5.44;
  const T_ACC = 6.36, T_PERS = 7.54, T_SHOOT = 8.16, T_GIANT = 8.72, T_CREAT = 9.21;
  const T_REP = 10.02, T_XBOW = 10.57, T_CLEAR = 11.44, T_PATH = 12.18, T_PENG = 12.58, T_LAST = 13.18;

  const XY = () => A15().XY();
  const OLD = () => [
    [[111.2, 22.5], [66.1, 21.5], [34.7, 17.1], [23.2, 14.5], [11.1, 8.2], [-1.9, -0.8], [-6.6, -5.3], [-7.4, -7.5], [-6.7, -9.8], [0.9, -16.4], [20.2, -29.4], [28.8, -32.6], [42, -32], [72.5, -27.1], [77.2, -24.5], [82.3, -19.2], [111.2, 22.5]],
    [[111.2, 22.5], [211.7, 8.2], [221.4, 6.1], [232.5, 2], [277.8, -18.2], [293.3, -26.8], [352.6, -66.1], [386.7, -95.9], [394.5, -101.7], [407.3, -106.6], [428.4, -109], [434.6, -115.8], [438.2, -118], [440.2, -118.1], [441.5, -116.9], [441.8, -111.5], [431.2, -60.3], [425.6, -50.6], [410, -35.8], [364.8, 5.4], [294.7, 78.6], [283.1, 92.3], [235.6, 153.9], [232, 158], [228.6, 160.3], [225.5, 159.4], [221.9, 154.2], [175.9, 60.4], [169.8, 50.7], [160.6, 44.1], [111.2, 22.5]],
    [[111.2, 22.5], [193.3, 2], [254.8, -11.5], [264.1, -14.3], [274, -20.2], [329.7, -65.1], [341.1, -72.9], [415.5, -101.5], [462.9, -125.5], [465.2, -125.6], [465.3, -124.2], [460.8, -115.6], [438.4, -78.6], [435.9, -68.6], [433, -61.9], [430, -57.6], [425.7, -54.7], [412.7, -52], [339.5, -43], [249.4, -53.5], [238.1, -53.1], [227.9, -48.1], [166.6, -5.1], [111.2, 22.5]],
    [[111.2, 22.5], [166.7, -21.7], [178.3, -32.4], [253.8, -119.5], [314.6, -198], [320.7, -202.2], [327.9, -204.4], [392.1, -213.3], [393, -213.9], [391.3, -215.1], [371.7, -220], [335.5, -228.4], [324.1, -229.3], [312.8, -227], [246.7, -208.6], [239.5, -205.7], [231.1, -200.7], [164, -151.2], [159, -145.4], [155.5, -138.5], [134.5, -80.4], [111.2, 22.5]],
  ];
  const PENG = [560, -70];
  const EDGE = [487.6, -126.9];
  const PATH0 = [503.5, -118.6];
  const ROUTE_PTS = () => [[111.2, 22.5], [126.7, 37.3], [133.8, 42.6], [141.1, 46.3], [144.9, 47.6], [148.7, 48.4], [156.5, 48.8], [161.4, 50.2], [167.1, 53], [181.4, 62.9], [199.3, 78.3], [239.8, 117.7], [253.7, 130.4], [262.8, 137.4], [265.6, 138.8], [269, 139.4], [274.1, 142.5], [280.9, 147.9], [299.1, 165], [303.9, 168.7], [308.7, 171.7], [318.3, 176], [323, 177.2], [332.4, 177.8], [340, 177.2], [342.9, 176.7], [347, 175], [348.2, 173.9], [349.9, 168.6], [355.6, 160.9], [365.7, 149.5], [389.3, 125.3], [397.9, 118.2], [406.1, 112.9], [413.9, 109.4], [421.3, 107.8], [428.3, 108.1], [434.9, 110.2], [441.1, 114.1], [456.8, 129.4], [467.2, 138.1], [471.2, 140.3], [475.9, 141], [478.3, 145.2], [482.3, 148.4], [485.7, 149.2], [490.2, 149.3], [484.5, 149], [480.5, 147.3], [478.3, 144.8], [476.9, 138.7], [476.3, 124.7], [477.1, 114.6], [479.3, 107.9], [483.8, 101.7], [481.6, 100.6], [477.4, 97.2], [456.3, 76.8], [451.6, 71], [447.5, 64.8], [444.1, 58.3], [441.4, 51.3], [439.3, 44], [438, 36.3], [437.3, 28.2], [436.9, 6], [435.2, -6.6], [433.4, -9.8], [431.1, -10], [427.3, -11.7], [423.1, -15.1], [420.2, -18.2], [417.4, -23.7], [416.3, -30.3], [416.9, -37.2], [418.2, -41.1], [420.2, -44.4], [424.4, -48.7], [427.2, -54.3], [428.1, -59], [428.8, -67.4], [429.7, -70.4], [433, -76.6], [438.1, -83.3], [455.5, -101.3], [457.8, -104.8], [458.5, -108.1], [460.4, -111.7], [472, -124], [482, -124.2], [494, -124]];
  let RT = null;
  const route = () => RT || (RT = QM.road(ROUTE_PTS()));
  const T_R0 = T_FIFTH - .02, T_A = T_DREAM - .9, T_H = T_DREAM + .95, LEG = 12;
  const T_R1 = T_H;
  const V1 = 2 * LEG / (T_H - T_A);
  const headS = t => {
    const L = route().L, S1 = L - LEG;
    if (t <= T_R0) return 0;
    if (t < T_A) { const T1 = T_A - T_R0, u = (t - T_R0) / T1; return S1 * (3 * u * u - 2 * u * u * u) + V1 * T1 * (u * u * u - u * u); }
    if (t < T_H) { const q = t - T_A; return S1 + V1 * q - V1 * q * q / (2 * (T_H - T_A)); }
    return L;
  };
  const speedAt = t => t < T_A || t >= T_H ? 0 : V1 * (1 - (t - T_A) / (T_H - T_A));
  const convoyK = t => ss(T_A - .1, T_A + .3, t);

  const SC = 2.2, GAP = 9.6, NV = 3, V_HIM = 1;
  const vehAt = (i, t) => { if (t < T_A - .1) return null; const s = headS(t) - 3 - i * GAP; return s <= 0 ? null : QM.along(route(), s); };
  const HORSE = [[0, 1.0], [.1, 1.42], [.5, 1.55], [1.45, 1.5], [1.75, 1.95], [1.95, 2.18], [2.12, 2.12], [2.35, 1.82], [2.25, 1.72], [1.95, 1.8], [1.62, 1.3], [1.5, 1.0], [.2, .95]];
  const INK = '#1b1a22', WR = .7;
  const going = t => clamp(1.3 * speedAt(t) / V1);
  function vehicle(x, cam, px, py, hd, kind, t, o = {}) {
    const h0 = TOP(), c = Math.cos(hd), sn = Math.sin(hd), s = SC;
    const at = (f, l, u) => cam.at(px + s * (f * c + l * sn), py + s * (f * sn - l * c), h0 + u * s);
    const poly = (pts, fill) => { const q = pts.map(p => at(...p)); if (q.some(v => !v)) return null; x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } return q; };
    const wpt = (f, l, u) => [px + s * (f * c + l * sn), py + s * (f * sn - l * c), h0 + u * s], dep = m => cam.depth([m[0], m[2], -m[1]]);
    const line = (p, q, wd, col) => {
      let a = wpt(...p), b = wpt(...q); const da = dep(a), db = dep(b), DM = .3;
      if (da < DM && db < DM) return;
      if (da < DM || db < DM) { const k = (DM - da) / (db - da), m = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; if (da < DM) a = m; else b = m; }
      const A = cam.at(...a), B = cam.at(...b); if (!A || !B) return;
      x.strokeStyle = col; x.lineWidth = Math.max(.6, Math.min(90, wd * s * (A[3] + B[3]) / 2)); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
    };
    const camX = cam.pos[0], camY = -cam.pos[2], near = (camX - px) * sn + (camY - py) * -c > 0 ? 1 : -1;
    const gal = o.go ?? 0, run = o.run ?? 0, ph = run / 1.6;
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    const wheel = l => {
      const rot = -run / WR, R = Array.from({ length: 16 }, (_, i) => { const q = i / 16 * TAU; return [WR * Math.cos(q), l, WR + WR * Math.sin(q)]; });
      const q = R.map(p => at(...p));
      if (q.some(v => !v)) {
        const ok = q.find(v => v); if (!ok) return;
        x.strokeStyle = INK; x.lineWidth = Math.max(1, Math.min(90, .14 * s * ok[3])); x.beginPath();
        for (let i = 0; i < 16; i++) { const v = q[i], w = q[(i + 1) % 16]; if (v && w) { x.moveTo(v[0], v[1]); x.lineTo(w[0], w[1]); } }
        x.stroke();
      } else { x.strokeStyle = INK; x.lineWidth = Math.max(1, .14 * s * q[0][3]); x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.stroke(); }
      for (let i = 0; i < 4; i++) { const a = rot + i / 4 * PI; line([WR * Math.cos(a), l, WR + WR * Math.sin(a)], [-WR * Math.cos(a), l, WR - WR * Math.sin(a)], .06, INK); }
    };
    const horses = () => {
      const f0 = 1.2, legs = [[.32, 0], [.42, .5], [1.32, .25], [1.42, .75]];
      for (const lane of near > 0 ? [-.38, .38] : [.38, -.38]) {
        legs.forEach(([lf, lp], i) => { const sw = .3 * gal * Math.sin(ph * TAU + lp * TAU + lane * 3), l = lane + (i % 2 ? .12 : -.12); line([f0 + lf, l, 1.02], [f0 + lf + sw, l, .02], .12, INK); });
        for (const l of [-.12, 0, .12]) poly(HORSE.map(([f, u]) => [f0 + f, lane + l * (u > 1.6 && f > 1.6 ? .45 : 1), u + (o.head && f > 1.6 ? -.25 * o.head : 0)]), INK);
      }
      line([.7, 0, WR + .3], [f0 + .6, 0, 1.25], .07, INK);
    };
    const closed = () => {
      const top = WR + .3 + 1.25;
      for (const l of [-.55 * near, .55 * near]) poly([[-.95, l, WR + .3], [.75, l, WR + .3], [.75, l, top], [-.95, l, top]], l * near > 0 ? '#2e2a36' : '#262330');
      poly([[-.95, -.55, WR + .3], [-.95, .55, WR + .3], [-.95, .55, top], [-.95, -.55, top]], '#2c2938');
      const rim = Array.from({ length: 18 }, (_, i) => { const q = i / 18 * TAU; return [-.1 + 1.1 * Math.cos(q), .75 * Math.sin(q), top + .08]; });
      poly(rim, '#1f1c28');
      poly(rim.map(([f, l, u]) => [-.1 + (f + .1) * .6, l * .6, u + .32]), '#2a2634');
      const wl = near * .56, wy0 = WR + .55, wy1 = WR + 1.1;
      const win = poly([[-.55, wl, wy0], [.35, wl, wy0], [.35, wl, wy1], [-.55, wl, wy1]], o.lit ? '#ffd890' : '#0e0d14');
      if (o.lit && win) { x.strokeStyle = 'rgba(255,240,200,.9)'; x.lineWidth = 1; x.stroke(); }
    };
    const chariot = () => {
      const y0 = WR + .3, y1 = WR + .85;
      for (const l of [-.5 * near, .5 * near]) poly([[-.6, l, y0], [.55, l, y0], [.55, l, y1], [-.6, l, y1]], l * near > 0 ? '#3a3040' : '#2a2632');
      poly([[.55, -.5, y0], [.55, .5, y0], [.55, .5, y1], [.55, -.5, y1]], '#332c3a');
      crossbow(x, cam, at, o.aim ?? 0, o.lightK ?? 0, o.kick ?? 0);
    };
    wheel(-.62 * near);
    horses();
    if (kind === 'chariot') chariot(); else closed();
    wheel(.62 * near);
    x.restore();
  }
  const XB = { f: -.05, u: 2.05, len: 1.25 };
  function crossbow(x, cam, at, aim, light, kick) {
    const ca = Math.cos(aim), sa = Math.sin(aim), k = -.08 * kick;
    const A = (f, l, u) => at(XB.f + (f + k) * ca - l * sa, (f + k) * sa + l * ca, XB.u + u);
    const pl = (pts, col) => { const q = pts.map(p => A(...p)); if (q.some(v => !v)) return; x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.fillStyle = col; x.fill(); };
    const ln = (p, q, wd, col) => { const a = A(...p), b = A(...q); if (!a || !b) return; x.strokeStyle = col; x.lineWidth = Math.max(.8, wd * SC * (a[3] + b[3]) / 2); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
    const lit = c => S3.mix(c, '#ffe6a8', .55 * light);
    ln([0, 0, -1.2], [0, 0, 0], .1, INK);
    pl([[-.55, -.08, .02], [XB.len - .2, -.08, .1], [XB.len - .2, .08, .1], [-.55, .08, .02]], lit('#4a3a2c'));
    pl([[-.15, -.12, .1], [.5, -.12, .14], [.5, .12, .14], [-.15, .12, .1]], lit('#5a4632'));
    pl([[-.12, -.1, .14], [.42, -.1, .16], [.42, -.1, .55], [-.12, -.1, .52]], lit('#6a523a'));
    const tip = sg => [XB.len - .55, sg * .95, .12];
    ln([XB.len - .25, 0, .1], tip(1), .07, lit('#3a2c22')); ln([XB.len - .25, 0, .1], tip(-1), .07, lit('#3a2c22'));
    ln(tip(1), [.15 - .25 * kick, 0, .12], .025, 'rgba(240,226,190,.9)'); ln(tip(-1), [.15 - .25 * kick, 0, .12], .025, 'rgba(240,226,190,.9)');
  }
  const chariotPose = () => { const q = QM.along(route(), route().L - 3); return q; };
  const aimOf = () => { const q = chariotPose(), d = Math.atan2(FISH[1] - q[1], FISH[0] - q[0]); let a = d - q[2]; a = ((a + PI) % TAU + TAU) % TAU - PI; return -a; };
  function muzzle() {
    const q = chariotPose(), c = Math.cos(q[2]), sn = Math.sin(q[2]), a = aimOf(), f = XB.f + XB.len * Math.cos(a), l = XB.len * Math.sin(a);
    return [q[0] + SC * (f * c + l * sn), q[1] + SC * (f * sn - l * c), TOP() + SC * (XB.u + .12)];
  }

  const FIGH = 6.2, FU = FIGH / 92;
  const SIL = Q.silhouette('emperor', '#121019', '#3a3540'), RIMS = Q.silhouette('emperor', '#fff1d0', '#fff1d0');
  const T_W0 = T_R1 + .1, T_W1 = T_PERS + .2;
  let WK = null;
  function walk() {
    if (WK) return WK;
    const q = QM.along(route(), route().L - 3 - V_HIM * GAP), c = Math.cos(q[2]), sn = Math.sin(q[2]);
    const door = [q[0] + 1.6 * sn, q[1] - 1.6 * c];
    const d = [EDGE[0] - door[0], EDGE[1] - door[1]], L = Math.hypot(d[0], d[1]);
    const G = Mo.gait({ from: 0, to: L / FU, t0: T_W0, gait: 'walk', style: { step: 40, arms: .3, lean: .04 }, until: T_W1 });
    return (WK = { door, dir: [d[0] / L, d[1] / L], L, G });
  }
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  function emperorAt(t) {
    const K = walk(), tp = Mo.pose(t), d = clamp(K.G.x(tp) * FU, 0, K.L);
    return { p: [K.door[0] + K.dir[0] * d, K.door[1] + K.dir[1] * d], pose: centre(K.G(tp), K.G.x(tp)), on: t > T_W0 - .05 };
  }
  function emperor(x, cam, t) {
    const e = emperorAt(t); if (!e.on) return;
    const u = QM.up(cam, e.p[0], e.p[1], TOP()); if (!u) return;
    const face = Math.atan2(-(FISH[1] - e.p[1]), FISH[0] - e.p[0]), yaw = cam.yawOf(face), s = FIGH * u.k / 92;
    const pose = { ...e.pose, yaw, headYaw: yaw, head: (e.pose.head || 0) - .08 };
    const tilt = clamp(1 - u.lev, 0, .5);
    const draw = (L, dx, dy) => { x.save(); x.translate(u.x + dx, u.y + dy); x.scale(s, s); Q.draw(x, FL.P, pose, L, { crown: true, profile: true, tilt, robe: 42, shadow: 0 }); x.restore(); };
    const r = Math.max(.8, s * 1.4);
    x.save(); x.globalAlpha = .6; draw(RIMS, -r, -r * .8); x.restore();
    for (let k = 0; k < 2; k++) draw(SIL, 0, 0);
  }

  const FISH = [531.3, -95.8], FH = 111.5, FISH_U = .16;
  const T_B0 = T_SHOOT + .02, BOLTS = [{ t: T_B0, miss: true }, ...Array.from({ length: 8 }, (_, i) => ({ t: T_REP + .02 + i * .115, i }))];
  const FLY = .34;
  const hitAt = b => b.t + FLY;
  const T_UP = T_GIANT - .02, T_DOWN = T_CLEAR - .05;
  const fishU = t => easeIO(clamp((t - T_UP) / .85)) * (1 - easeIO(clamp((t - T_DOWN) / 1.0)));
  const roll = t => easeIO(clamp((t - T_DOWN) / 1.0));
  const shudder = t => { let a = 0; for (const b of BOLTS) if (!b.miss) { const d = t - hitAt(b); if (d > 0 && d < .3) a += (1 - d / .3) * Math.sin(d * 60); } return a; };
  function fishDraw(x, S, t, u) {
    const sway = Math.sin(t * .8) * .015 + .02 * shudder(t), rl = roll(t);
    x.save();
    x.rotate(sway + .35 * rl);
    const back = () => { x.moveTo(-232, 8); x.bezierCurveTo(-232, -96, -150, -186, -10, -190); x.bezierCurveTo(130, -192, 214, -110, 226, 10); };
    const belly = () => { x.lineTo(150, 10); x.bezierCurveTo(140, -52, 80, -86, -2, -86); x.bezierCurveTo(-90, -86, -140, -46, -150, 10); };
    const body = () => { x.beginPath(); back(); belly(); x.closePath(); };
    x.fillStyle = 'rgba(238,230,208,.97)'; body(); x.fill();
    const g = x.createLinearGradient(0, -194, 0, 0); g.addColorStop(0, 'rgba(34,34,40,.82)'); g.addColorStop(.42, 'rgba(70,70,76,.48)'); g.addColorStop(.8, 'rgba(140,136,128,.14)'); g.addColorStop(1, 'rgba(160,156,146,0)');
    x.fillStyle = g; body(); x.fill();
    x.strokeStyle = 'rgba(28,28,34,.5)'; x.lineWidth = 2.4;
    for (let row = 0; row < 4; row++) for (let i = 0; i < 22; i++) {
      const v = (i + .5 * (row % 2)) / 22, ang = PI * (1 - v), R0 = 170 - row * 22, bx = -2 + Math.cos(ang) * (205 - row * 18), by = -Math.sin(ang) * R0 + 6;
      if (v < .12 || v > .9) continue; x.beginPath(); x.arc(bx, by, 9, .15 * PI, .85 * PI); x.stroke();
    }
    x.strokeStyle = '#1b1b20'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = 9; x.beginPath(); back(); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.moveTo(150, 10); x.bezierCurveTo(140, -52, 80, -86, -2, -86); x.bezierCurveTo(-90, -86, -140, -46, -150, 10); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(-232, 8); x.quadraticCurveTo(-212, -16, -186, -10); x.stroke();
    if (rl < .3) { x.fillStyle = '#f6f1e4'; x.beginPath(); x.arc(-182, -62, 17, 0, TAU); x.fill(); x.lineWidth = 4; x.stroke(); x.fillStyle = '#141418'; x.beginPath(); x.arc(-186, -62, 8.5, 0, TAU); x.fill(); }
    else { x.lineWidth = 5; x.beginPath(); x.moveTo(-198, -60); x.quadraticCurveTo(-182, -52, -166, -60); x.stroke(); }
    x.lineWidth = 6; x.beginPath(); x.moveTo(-138, -150); x.quadraticCurveTo(-112, -90, -134, -18); x.stroke();
    x.lineWidth = 3.4; x.beginPath(); x.moveTo(-226, -18); x.bezierCurveTo(-262, -40, -284, -6, -312, -30); x.moveTo(-222, -8); x.bezierCurveTo(-256, 6, -270, 26, -300, 18); x.stroke();
    x.fillStyle = 'rgba(36,36,42,.86)';
    x.beginPath(); x.moveTo(-40, -188); x.quadraticCurveTo(-10, -262, 70, -256); x.lineTo(56, -238); x.lineTo(74, -230); x.quadraticCurveTo(46, -212, 52, -180); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-96, -60); x.quadraticCurveTo(-60, -40, -54, 4); x.quadraticCurveTo(-80, -14, -110, -30); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(210, -36); x.quadraticCurveTo(250, -120, 300, -150); x.quadraticCurveTo(282, -96, 292, -54); x.quadraticCurveTo(262, -62, 236, -4); x.closePath(); x.fill();
    for (const b of BOLTS) if (!b.miss && t >= hitAt(b)) { const bx = -120 + b.i * 34, by = -150 + 22 * Math.sin(b.i * 2.1); x.strokeStyle = '#1b1b20'; x.lineWidth = 4; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx - 30, by - 22); x.stroke(); }
    x.restore();
    x.strokeStyle = 'rgba(250,248,240,.92)'; x.lineWidth = 5;
    for (const [sx, k] of [[-224, 1], [-190, .8], [-150, .6], [160, .7], [222, 1], [250, .7]]) for (let j = 0; j < 3; j++) { const a0 = PI + .4 + j * .55, r = (16 + 10 * j) * k * (.75 + .25 * Math.sin(t * 2.6 + sx)) * (.4 + .6 * u); x.beginPath(); x.arc(sx, 12, r, a0, a0 + 1.1); x.stroke(); }
  }
  function water(x, cam, t) {
    const u = fishU(t), red = ss(T_DOWN + .5, T_DOWN + 1.1, t) * (1 - ss(T_PATH + .3, T_LAST + .4, t));
    const ring = (r, col, lw) => { const q = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, p = cam.at(FISH[0] + r * Math.cos(a), FISH[1] + r * .55 * Math.sin(a), FH); if (!p) return; q.push(p); } x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); };
    if (red > 0) { const c = cam.at(FISH[0], FISH[1], FH); if (c) { const r = 14 * c[3] * (.6 + .5 * red), g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); g.addColorStop(0, `rgba(120,24,22,${.55 * red})`); g.addColorStop(1, 'rgba(120,24,22,0)'); x.save(); x.translate(c[0], c[1]); x.scale(1, .32); x.translate(-c[0], -c[1]); x.fillStyle = g; x.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r); x.restore(); } }
    const act = Math.max(u, ss(T_B0 + FLY, T_B0 + FLY + .1, t) * (1 - ss(T_UP, T_UP + .4, t)), (1 - roll(t)) * ss(T_DOWN, T_DOWN + .2, t) * (t < T_DOWN + 1.3 ? 1 : 0));
    if (act <= 0) return;
    for (let k = 0; k < 3; k++) { const ph = (t * .6 + k / 3) % 1; ring(8 + 16 * ph, `rgba(240,244,248,${.5 * act * (1 - ph)})`, 1.4); }
  }
  function fish(x, cam, t) {
    const u = fishU(t); if (u <= 0) return;
    const c = cam.at(FISH[0], FISH[1], FH); if (!c) return;
    const S = c[3] * FISH_U;
    x.save(); x.beginPath(); x.rect(-W, -H * 2, W * 3, c[1] + H * 2); x.clip();
    x.translate(c[0], c[1] + (1 - u) * 200 * S); x.scale(S, S);
    fishDraw(x, S, t, u);
    x.restore();
  }
  let UB = null;
  function underLand(x, cam, fn) {
    if (!UB || UB[0].width !== W || UB[0].height !== H) UB = F.canvas(W, H);
    const [cv, u] = UB;
    if (u.reset) u.reset(); else { u.setTransform(1, 0, 0, 1, 0, 0); u.globalAlpha = 1; u.globalCompositeOperation = 'source-over'; u.clearRect(0, 0, W, H); }
    fn(u);
    u.globalCompositeOperation = 'destination-out'; u.fillStyle = '#000';
    const top = TOP();
    for (let h = FH - 1; h <= top + 1e-6; h += (top - FH + 1) / 3) { u.save(); u.beginPath(); QM.rings(u, cam, CH.CHINA, h); u.clip(); u.beginPath(); QM.ring(u, cam, CH.QIN221[0], h); u.fill(); u.restore(); }
    const sh = SH(); x.save(); x.setTransform(1, 0, 0, 1, -sh.x, -sh.y); x.drawImage(cv, 0, 0); x.restore();
  }
  const T_P0 = T_PATH - .05, T_P1 = T_PENG + .25;
  function lightPath(x, cam, t) {
    const k = ss(T_P0, T_P1, t); if (k <= 0) return;
    const a0 = PATH0, a1 = [PENG[0] - 8, PENG[1] - 6], d = [a1[0] - a0[0], a1[1] - a0[1]], L = Math.hypot(d[0], d[1]), ud = [d[0] / L, d[1] / L], nd = [-ud[1], ud[0]];
    x.save(); x.lineCap = 'round';
    for (let j = 0; j <= 24; j++) {
      const s = j / 24, head = (t - T_P0) / (T_P1 - T_P0); if (s > head) break;
      const p = cam.at(a0[0] + d[0] * s, a0[1] + d[1] * s, FH); if (!p) continue;
      const r = (2.5 + 7 * s) * p[3], g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(255,226,160,${.22 * k})`); g.addColorStop(1, 'rgba(255,226,160,0)');
      x.save(); x.translate(p[0], p[1]); x.scale(1, .35); x.translate(-p[0], -p[1]); x.fillStyle = g; x.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); x.restore();
    }
    for (let i = 0; i < 420; i++) {
      const r = F.hash(i, 81), s = Math.pow(r, .8), head = (t - T_P0) / (T_P1 - T_P0); if (s > head) continue;
      const spread = 2 + 8 * s, off = (F.hash(i, 82) - .5) * 2 * spread * (.4 + .6 * F.hash(i, 83)), ph = Math.sin(t * 2.4 + i * 1.7);
      const p = cam.at(a0[0] + d[0] * s + nd[0] * off, a0[1] + d[1] * s + nd[1] * off, FH); if (!p) continue;
      const Lx = Math.max(3, (1.6 + 2 * F.hash(i, 84)) * p[3]);
      x.strokeStyle = `rgba(255,240,196,${(.6 + .35 * ph) * Math.min(1, k * 1.5)})`; x.lineWidth = Math.max(1.4, .22 * p[3]);
      x.beginPath(); x.moveTo(p[0] - Lx / 2, p[1]); x.lineTo(p[0] + Lx / 2, p[1]); x.stroke();
    }
    x.restore();
  }
  const markOf = (b, cam) => {
    if (b.miss) return [FISH[0] - 6, FISH[1] - 5, FH];
    const r = [Math.cos(cam.yaw), Math.sin(cam.yaw)], lx = (-120 + b.i * 34) * FISH_U, ly = (150 - 22 * Math.sin(b.i * 2.1)) * FISH_U;
    return [FISH[0] + r[0] * lx, FISH[1] + r[1] * lx, FH + ly];
  };
  function boltAt(b, t, cam) {
    const u = (t - b.t) / FLY; if (u < 0 || u > 1) return null;
    const m = muzzle(), e = markOf(b, cam), p = k => [lerp(m[0], e[0], k), lerp(m[1], e[1], k), lerp(m[2], e[2], k) + 6 * Math.sin(PI * k)];
    return { a: p(Math.max(0, u - .18)), b: p(u) };
  }
  function bolts(ctx, cam, t) {
    const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.lineCap = 'round';
    for (const b of BOLTS) {
      const q = boltAt(b, t, cam); if (!q) continue;
      const A = cam.at(...q.a), B = cam.at(...q.b); if (!A || !B) continue;
      const g = ctx.createLinearGradient(A[0], A[1], B[0], B[1]); g.addColorStop(0, 'rgba(255,236,180,0)'); g.addColorStop(1, 'rgba(255,246,220,.95)');
      ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, .35 * B[3]); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, .22 * B[3]); const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1; ctx.beginPath(); ctx.moveTo(B[0] - dx / L * Math.max(8, 1.5 * B[3]), B[1] - dy / L * Math.max(8, 1.5 * B[3])); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    ctx.restore();
    for (const b of BOLTS) {
      const d = t - hitAt(b); if (d < 0 || d > .5) continue;
      const e = markOf(b, cam), u = cam.at(...e); if (!u) continue;
      PR.glow(ctx, u[0] - sh.x, u[1] - sh.y, Math.max(14, 2.2 * u[3]) * (1 + d * 2), '#fff4d8', .8 * (1 - d / .5), 'flat');
    }
    for (const b of BOLTS) { const d = t - b.t; if (d < 0 || d > .2) continue; const m = cam.at(...muzzle()); if (m) PR.glow(ctx, m[0] - sh.x, m[1] - sh.y, Math.max(10, 1.4 * m[3]), '#fff0c8', .7 * (1 - d / .2), 'flat'); }
  }

  function ribbon(x, cam, R, s0, s1, hw, h, col) {
    if (s1 - s0 < .05) return;
    const L = [], Rr = [];
    for (let s = s0, done = false; !done; s += 1.5) {
      if (s >= s1) { s = s1; done = true; }
      const q = QM.along(R, s), nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
      const a = cam.at(q[0] + nx * hw, q[1] + ny * hw, h), b = cam.at(q[0] - nx * hw, q[1] - ny * hw, h);
      if (a && b) { L.push(a); Rr.push(b); }
    }
    if (L.length < 2) return;
    x.fillStyle = col; x.beginPath(); L.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) x.lineTo(Rr[i][0], Rr[i][1]); x.closePath(); x.fill();
  }
  function trails(x, cam, t) {
    const h = TOP() + .05;
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = 'rgba(92,58,24,.42)'; x.lineWidth = Math.max(1.4, .55 * cam.z); x.setLineDash([Math.max(3, 1.6 * cam.z), Math.max(4, 2.2 * cam.z)]);
    for (const r of OLD()) { x.beginPath(); QM.polyline(x, cam, r, h); x.stroke(); }
    x.restore();
    const hs = headS(t); if (hs <= 0) return;
    ribbon(x, cam, route(), 0, hs, 2.2, h + .02, 'rgba(255,236,170,.3)');
    ribbon(x, cam, route(), 0, hs, .85, h + .04, 'rgba(255,248,222,.95)');
  }

  const CLOUDS = (() => { const R = F.rng(2711), o = []; for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1; o.push({ x: 470 + 12 * i + 8 * R(), y: -150 + 12 * i + side * (18 + 10 * R()), h: 150 + 14 * R(), s: 4 + 3 * R(), v: .5 + .6 * R() }); } return o; })();
  function cloud(x, cam, c, t) {
    const u = QM.up(cam, c.x + c.v * t, c.y, c.h); if (!u) return;
    const r = c.s * u.k; if (r < 2 || r > W) return;
    for (const [dx, dy, k, col] of [[0, 0, 1, 'rgba(246,244,238,.82)'], [-.9, .22, .72, 'rgba(236,236,232,.8)'], [.95, .18, .78, 'rgba(252,250,246,.85)'], [.15, .42, .85, 'rgba(226,228,226,.7)']]) {
      x.fillStyle = col; x.beginPath(); x.ellipse(u.x + dx * r, u.y + dy * r * .55, r * k, r * k * .5, 0, 0, TAU); x.fill();
    }
  }

  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const top = 128;
    const K = M45 ? [
      [-.6, 330, 24, 2.3, 62, 6, top], [0, 331, 23, 2.3, 62, 6, top], [2.4, 334, 20, 2.34, 61.5, 8, top], [T_STILL, 345, 8, 2.45, 60, 12, top],
      [T_DREAM + .35, 470, -100, 3.4, 50, 40, top], [T_PERS + .3, 527, -100, 12.5, 29, 131.7, 120], [T_REP, 528, -99, 12.9, 28.5, 131.8, 120],
      [T_CLEAR + .4, 531, -96, 13.4, 26, 132, 120.5], [DUR, 538, -89, 14.5, 21, 132.2, 122], [DUR + 1.4, 542, -85, 15.2, 19.5, 132.3, 122.5]]
      : [
      [-.6, 330, 24, 2.3, 60, 6, top], [0, 331, 23, 2.3, 60, 6, top], [2.4, 334, 20, 2.34, 59.5, 8, top], [T_STILL, 345, 8, 2.45, 58, 12, top],
      [T_DREAM + .35, 470, -100, 3.4, 48, 40, top], [T_PERS + .3, 527, -100, 12.5, 28, 131.7, 120], [T_REP, 528, -99, 12.9, 27.5, 131.8, 120],
      [T_CLEAR + .4, 531, -96, 13.4, 25, 132, 120.5], [DUR, 538, -89, 14.5, 20, 132.2, 122], [DUR + 1.4, 542, -85, 15.2, 18.5, 132.3, 122.5]];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camAt(t) {
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  function uprights(put, cam, t) {
    const hs = headS(t), stop = hs >= route().L - 1e-6, g = going(t);
    for (let i = NV - 1; i >= 0; i--) {
      const q = vehAt(i, t); if (!q) continue;
      const ck = convoyK(t), run = (headS(t) - 3 - i * GAP) / SC;
      put(q[0], q[1], TOP(), x => { x.save(); x.globalAlpha *= ck; vehicle(x, cam, q[0], q[1], q[2], i === 0 ? 'chariot' : 'closed', t, { go: g, run, lit: i === V_HIM, aim: aimOf() * ss(T_W0, T_W0 + 1.2, t), lightK: lightXB(t), kick: kickAt(t), head: stop ? .6 : 0 }); x.restore(); });
    }
    const e = emperorAt(t); if (e.on) put(e.p[0], e.p[1], TOP(), x => emperor(x, cam, t));
    put(FISH[0], FISH[1], FH, x => underLand(x, cam, u => { water(u, cam, t); lightPath(u, cam, t); fish(u, cam, t); }));
    for (const c of CLOUDS) put(c.x + c.v * t, c.y, c.h, x => cloud(x, cam, c, t));
  }
  const lightXB = t => ss(T_XBOW - .1, T_XBOW + .15, t) * (1 - ss(T_XBOW + .8, T_CLEAR + .2, t));
  const kickAt = t => { let k = 0; for (const b of BOLTS) { const d = t - b.t; if (d >= 0 && d < .1) k = Math.max(k, 1 - d / .1); } return k; };
  function glows(ctx, cam, t) {
    const sh = SH(), g = (q, r, col, a) => { if (a <= .003) return; const u = cam.at(q[0], q[1], q[2]); if (u) PR.glow(ctx, u[0] - sh.x, u[1] - sh.y, r(u), col, a, 'flat'); };
    const q = vehAt(V_HIM, t);
    if (q) g([q[0], q[1], TOP() + SC * 1.4], u => Math.max(12, 2.6 * u[3]), '#ffd890', .75 * convoyK(t));
    const hs = headS(t), ha = 1 - convoyK(t);
    if (hs > 0 && ha > 0) { const h = QM.along(route(), hs); g([h[0], h[1], TOP() + .6], u => Math.max(12, 3.4 * u[3]), '#fff2c8', .85 * ha); g([h[0], h[1], TOP() + .6], u => Math.max(26, 7 * u[3]), '#ffd890', .35 * ha); }
    const lx = lightXB(t); if (lx > 0) g(muzzle(), u => Math.max(16, 3.2 * u[3]), '#ffe2a0', .6 * lx);
    bolts(ctx, cam, t);
    const dg = ss(T_DREAM - .15, T_DREAM + .35, t) * (1 - .5 * ss(T_DREAM + .8, T_ACC + .6, t)) + .8 * ss(T_P0, T_P1 + .3, t);
    if (dg > 0) g([PENG[0], PENG[1], 132], u => Math.max(70, 40 * u[3]), '#ffe2a0', .45 * dg);
  }
  function sky(ctx, cam) {
    const hy = cam.cy - cam.f * Math.tan(cam.ph);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (hy > 0) { const g = ctx.createLinearGradient(0, hy - H * .8, 0, hy); g.addColorStop(0, '#6f8ea4'); g.addColorStop(.75, '#b9c7c3'); g.addColorStop(1, '#eadcbc'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(H, hy + 1)); }
    if (hy < H) { const y0 = Math.max(0, hy), g = ctx.createLinearGradient(0, Math.max(hy, -H), 0, H); g.addColorStop(0, hy > 0 ? S3.mix('#2a3e56', '#8a9ea8', smooth(hy / 140)) : '#2a3e56'); g.addColorStop(.25, '#30465e'); g.addColorStop(1, '#16243a'); ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0); }
    ctx.restore();
  }
  const FAST = { land: 4, blocks: 5 };
  function frame(ctx, t, cam, o = {}) {
    QM.FAST = FAST;
    try { A15().mapFrame(ctx, TF, cam, false, {
      isle: { t: 40 + t, quiet: true, alpha: 1, glow: 1 },
      sky,
      onTop: x => trails(x, cam, t),
      uprights: put => uprights(put, cam, t),
      glows: c => glows(c, cam, t),
    }); } finally { QM.FAST = null; }
    if (!o.noText) F.impact(FL, ctx, t, { lines: [{ text: '210 BC', t0: T_210 + .5, size: M45 ? 110 : 130, color: '#f5ecd8' }], x: .5, y: M45 ? .13 : .15, out: T_EMP + .5, accent: '#d9a443' });
    FL.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-27', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-26', dur: .9, dir: 'up' },
    sfx: [
      { t: .9, type: 'wind', dur: 3.6, g: .04 },
      { t: T_210 + .5, type: 'impact', size: .3, g: .26, noSnap: true },
      { t: T_R0, type: 'swoosh', dur: T_A - T_R0, g: .08 },
      { t: T_A, type: 'lib', dur: T_H - T_A + .5, label: 'A CONVOY OF CARRIAGES AT A TROT, SLOWING TO A HALT' },
      ...[0, 1, 2, 3, 4, 5].map(i => ({ t: T_A + .15 + i * .26 * (1 + .25 * i), type: 'clack', g: .04 * (1 - i / 7) })),
      { t: T_DREAM, type: 'shimmer', g: .1 },
      { t: T_DREAM + .3, type: 'whoosh', f0: 70, f1: 160, dur: 2.2, g: .1 },
      { t: T_ACC, type: 'lib', dur: DUR - T_ACC, label: 'SEA WIND ON A HEADLAND, WAVES BREAKING FAR BELOW' },
      ...BOLTS.map(b => ({ t: b.t, type: 'clack', g: .14 })),
      ...BOLTS.map(b => ({ t: b.t + .02, type: 'whizz', dur: FLY, f0: 1400, f1: 600, g: .06 })),
      { t: T_B0 + FLY, type: 'splash', g: .1 },
      { t: T_UP, type: 'lib', dur: 2.2, label: 'A GREAT FISH BREACHING: A DEEP RUSH OF WATER' },
      ...BOLTS.filter(b => !b.miss).map(b => ({ t: hitAt(b), type: 'thud', g: .08, noSnap: true })),
      { t: T_XBOW, type: 'shimmer', g: .08 },
      { t: T_DOWN + .1, type: 'splash', g: .16 }, { t: T_DOWN + .2, type: 'rumble', dur: 1.2, g: .1 },
      { t: T_P0, type: 'riser', dur: T_P1 - T_P0 + .4, f0: 900, f1: 2200, g: .05 },
      { t: T_PENG, type: 'shimmer', g: .14 },
    ],
    api: { DUR, camAt, frame, route, EDGE, PENG, vehicle, SC, WR, GAP, TF, sky },
  });
})();
