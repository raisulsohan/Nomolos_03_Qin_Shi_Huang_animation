(function () {
  'use strict';
  const F = FILM, PR = F.props, QM = F.qinmap, CH = F.china, Mo = F.motion, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-08'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api, A7 = () => F.getScene('seq-07').api;
  const P = (lon, lat) => CH.proj(lon, lat);

  const T_BUILD = 1, T_TOO = 1.83;
  const T_ONE1 = 2.92, T_WRIT = 3.13, T_SYS = 3.62, T_EMP = 4.81;
  const T_ONE2 = 5.7, T_CUR = 5.98;
  const T_ONE3 = 7.22, T_WGT = 8.31, T_MEAS = 9.04, T_EVEN = 10.02;
  const T_AXL = 11.54, T_EVERY = 12.06, T_RUTS = 14.21, T_NEW = 15.25;
  const T_WALLS = 16.94, T_NORTH = 17.54, T_JOIN = 18.09, T_EXT = 18.63;
  const T_GREAT = 20.32;

  const D_TH = 24;
  let G = null;
  function geo() {
    if (G) return G;
    const g7 = A7().geo(), XY = g7.XY, top = g7.top, xe = g7.xe, nLand = g7.nLand;
    const J = [200, XY[1]], J2 = [258, XY[1]];
    const ROADS = [
      [XY, [xe, XY[1]]],
      [XY, J, P(114.5, 36.6), P(116.4, 39.9), P(119.6, 40.4), P(123.2, 41.3)],
      [XY, J2, P(116.3, 35.9), P(118.3, 36.8), P(121.4, 37.5)],
      [XY, J, P(114.9, 33.7), P(116.8, 32.6), P(119.4, 31.6), P(120.6, 30.0)],
      [XY, P(110.9, 33.6), P(112.5, 33.0), P(112.2, 30.4), P(113.0, 28.2)],
      [XY, P(107.0, 33.1), P(104.1, 30.7)],
      [XY, P(106.3, 35.0), P(103.9, 35.4)],
      [XY, P(108.9, 36.6), P(109.2, 38.0)],
    ].map(QM.road);
    return (G = { XY, top, xe, nLand, ROADS });
  }

  function keys() {
    const A = A6(), B = A7(), g = geo(), [fx, fy, fz, fp, fw, fl] = B.spl(), T7 = B.DUR, XY = g.XY, top = g.top;
    const at7 = d => [-d, fx(T7 - d), fy(T7 - d), Math.exp(fz(T7 - d)), fp(T7 - d), fw(T7 - d), fl(T7 - d)];
    const look = (t, e, g2) => {
      const dx = g2[0] - e[0], dn = e[1] - g2[1], dh = e[2] - g2[2], hz = Math.hypot(dx, dn), D = Math.hypot(hz, dh);
      return [t, g2[0], g2[1], A.FLENS / D, Math.atan2(dh, hz) / D2R, Math.atan2(dx, dn) / D2R, g2[2]];
    };
    const X0 = XY[0], Y0 = XY[1];
    return [
      at7(.6), at7(0), at7(-.3),
      look(.75, [X0 - 52, Y0 + 168, top + 66], [X0 + 620, Y0 - 5, top + 60]),
      look(1.2, [X0 - 70, Y0 + 222, top + 150], [X0 + 250, Y0 - 10, top]),
      look(1.95, [X0 - 20, Y0 + 380, top + 380], [X0 + 150, Y0 - 20, top]),
      [T_TOO + .8, 232, 0, 1.4, 52, 4, top],
      [T_EMP, 254, -52, 1.85, 55, 2, top], [T_CUR + .6, 258, -56, 1.95, 56, 0, top],
      [T_MEAS + .6, 262, -54, 2.05, 55, -2, top],
      [T_EVEN + .75, 296, 40, 8, 34, 42, top],
      [T_AXL - .2, 304, 24, 40, 22, 74, top], [T_RUTS, 325, 23, 42, 21, 77, top],
      [T_NEW + .3, 338, 4, 8, 36, 52, top],
      [T_WALLS + .2, 262, -150, 2.25, 46, 12, top],
      [T_EXT + .2, 236, -200, 1.95, 42, 6, top], [DUR + 1.2, 250, -215, 1.9, 38, 12, top],
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
    const B = A7();
    if (t <= 0) return B.camAt(B.DUR);
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  const T_SK0 = .3, T_SK1 = 1.35;
  const sinkAt = i => T_SK0 + (i - 1) / Math.max(1, geo().nLand) * (T_SK1 - T_SK0);
  const skyFade = t => 1 - ss(.15, 1.3, t);
  function thrones(put, cm, m, t) {
    const A = A6(), B = A7(), g = geo(), mT = A.magT(cm);
    const wrap = (mx, my, h, draw) => {
      if (h > g.top + 1e-6) {
        const a = skyFade(t); if (a <= 0) return;
        return put(mx, my, h, a >= 1 ? draw : (x, u) => { x.save(); x.globalAlpha *= a; draw(x, u); x.restore(); });
      }
      const i = Math.round((mx - g.XY[0]) / D_TH), k = ss(sinkAt(i), sinkAt(i) + .45, t); if (k >= 1) return;
      put(mx, my, h, k <= 0 ? draw : (x, u) => {
        const hp = A.THRONE_H * u.k * mT * (.45 + .55 * u.lev) * .72;
        x.save(); x.beginPath(); x.rect(u.x - 3 * hp, u.y - 3 * hp, 6 * hp, 3 * hp); x.clip(); x.translate(0, k * hp * 1.15); draw(x, u); x.restore();
        const R = F.rng(i * 7 + 3);
        for (let j = 0; j < 7; j++) { const a = Math.PI + R() * Math.PI, d = hp * (.35 + .5 * k * (.5 + R())); x.fillStyle = `rgba(196,150,70,${.45 * Math.sin(Math.PI * k)})`; x.beginPath(); x.arc(u.x + Math.cos(a) * d, u.y + Math.sin(a) * d * .3, hp * (.05 + .07 * R()), 0, TAU); x.fill(); }
      });
    };
    B.uprights(wrap, cm, m, B.DUR + t);
  }
  function roadHead(j, r, t) {
    if (j === 0) return r.L * easeIO(clamp((t - T_SK0 - .1) / (T_SK1 - T_SK0 + .3)));
    return r.L * easeIO(clamp((t - T_BUILD + .05 - .04 * j) / (T_TOO + .75 - T_BUILD)));
  }
  function cut(r, s) {
    const o = [r.p[0]];
    for (let i = 1; i < r.p.length; i++) {
      if (r.acc[i] <= s) { o.push(r.p[i]); continue; }
      const u = (s - r.acc[i - 1]) / Math.max(1e-6, r.acc[i] - r.acc[i - 1]);
      if (u > 0) o.push([lerp(r.p[i - 1][0], r.p[i][0], u), lerp(r.p[i - 1][1], r.p[i][1], u)]);
      break;
    }
    return o;
  }
  function band(p, wd) {
    if (p.length < 2) return null;
    const L = [], R = [], n = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    for (let i = 0; i < p.length; i++) {
      const n0 = n(p[Math.max(0, i - 1)], p[Math.max(1, i)]), n1 = n(p[Math.min(p.length - 2, i)], p[Math.min(p.length - 1, i + 1)]);
      let mx = n0[0] + n1[0], my = n0[1] + n1[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
      const k = wd / 2 / Math.max(.5, mx * n1[0] + my * n1[1]);
      L.push([p[i][0] + mx * k, p[i][1] + my * k]); R.push([p[i][0] - mx * k, p[i][1] - my * k]);
    }
    return [...L, ...R.reverse()];
  }
  const roadW = cm => lerp(3.4, 8, ss(2.5, 10, cm.z));
  function roads(x, cm, t, h) {
    const g = geo(), wd = roadW(cm);
    for (const [k, col] of [[1, 'rgba(112,72,20,.6)'], [.84, 'rgba(250,228,160,.75)']]) {
      x.fillStyle = col;
      g.ROADS.forEach((r, j) => {
        const s = roadHead(j, r, t); if (s <= .5) return;
        const b = band(cut(r, s), wd * k); if (!b) return;
        x.beginPath(); QM.ring(x, cm, b, h); x.fill();
      });
    }
  }

  const XYQ = QM.byId.qin.cap;
  const PL_H = 29;
  const PLACES = [['qin', 160, 44, 'round'], ['han', 246, 28, 'spade'], ['wei', 302, -16, 'spade'], ['zhao', 262, -102, 'spade'],
    ['yan', 330, -180, 'knife'], ['qi', 392, -88, 'knife'], ['chu', 340, 96, 'oval']]
    .map(([id, x, y, coin], j) => ({ id, j, x, y, coin, col: QM.byId[id].col, d: Math.hypot(x - XYQ[0], y - XYQ[1]) }));
  const RINGS = [[T_SYS - .05, 330], [T_CUR + .02, 420], [T_WGT + .1, 650], [T_MEAS + .12, 650]];
  const hitAt = (pl, i) => RINGS[i][0] + pl.d / RINGS[i][1];
  const standAt = pl => pl.id === 'qin' ? T_ONE1 + .05 : T_WRIT + .06 * pl.j;
  const FLIPS = [[T_ONE2 - .02, .3], [T_WGT - .14, .28], [T_MEAS - .13, .28]];
  const T_DOWN = T_EVEN - .05;
  const GLYPH = [
    [[-.8, -.7], [-.8, -.9], [.8, -.9], [.8, -.7]], [[0, -.9], [0, .15]],
    [[-.55, -.55], [.55, -.55], [.55, .05], [-.55, .05], [-.55, -.55]], [[-.55, -.25], [.55, -.25]],
    [[0, .15], [-.25, .45], [-.75, .95]], [[0, .15], [.25, .45], [.75, .95]], [[-.45, .62], [0, .78], [.45, .62]],
  ].map(p => { const r = QM.road(p), n = Math.max(6, Math.round(r.L * 7)), o = []; for (let i = 0; i < n; i++) { const q = QM.along(r, r.L * i / (n - 1)); o.push([q[0], q[1]]); } return o; });
  function variant(seed) {
    const R = F.rng(seed), sh = (R() - .5) * 1.0, rot = (R() - .5) * .5, ax = .66 + .5 * R(), ay = .8 + .3 * R(), c = Math.cos(rot), s = Math.sin(rot);
    return GLYPH.map(st => {
      const bend = (R() - .5) * 1.1, ox = (R() - .5) * .4, oy = (R() - .5) * .34, a = st[0], b = st[st.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = L > .01 ? -(b[1] - a[1]) / L : 0, ny = L > .01 ? (b[0] - a[0]) / L : 0;
      return st.map(([px, py], k) => {
        const u = k / (st.length - 1), bb = Math.sin(Math.PI * u) * bend, qx = px + ox + nx * bb + (R() - .5) * .05, qy = py + oy + ny * bb + (R() - .5) * .05;
        const X = qx * ax + sh * qy, Y = qy * ay;
        return [X * c - Y * s, X * s + Y * c];
      });
    });
  }
  const SIGNS = PLACES.map(pl => pl.id === 'qin' ? GLYPH : variant(31 + 17 * pl.j));
  const N_OUT = 72;
  const ellipse = (cx, cy, rx, ry, n = 48) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i / n * TAU; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  function outline(p) {
    let a = 0; for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; }
    if (a < 0) p = p.slice().reverse();
    let top = 0; p.forEach((q, i) => { if (q[1] < p[top][1] - 1e-9 || (Math.abs(q[1] - p[top][1]) < 1e-9 && Math.abs(q[0]) < Math.abs(p[top][0]))) top = i; });
    const r = QM.road([...p.slice(top), ...p.slice(0, top), p[top]]), o = [];
    for (let i = 0; i < N_OUT; i++) { const q = QM.along(r, r.L * i / N_OUT); o.push([q[0], q[1]]); }
    return o;
  }
  const COIN = {
    spade: outline([[-5, -58], [5, -58], [5, -46], [14, -42], [16, -6], [4, -6], [0, -15], [-4, -6], [-16, -6], [-14, -42], [-5, -46]]),
    knife: outline([[-12, -62], [-4, -58], [4, -48], [9, -34], [10, -20], [9, -12], [13, -8], [12, -3], [8, -1], [4, -3], [3, -8], [5, -12], [5, -20], [4, -32], [0, -44], [-6, -54]]),
    oval: outline(ellipse(0, -28, 12, 19)),
    round: outline(ellipse(0, -28, 21, 21)),
  };
  const WEIGHT = outline([[-17, 0], ...Array.from({ length: 13 }, (_, i) => { const a = Math.PI + i / 12 * Math.PI; return [17 * Math.cos(a), -6 - 30 * Math.pow(Math.abs(Math.sin(a)), .8)]; }), [17, 0]]);
  const SZW = { qin: 1, han: .7, wei: 1.32, zhao: .84, yan: 1.2, qi: .76, chu: 1.26 };
  const SZM = { qin: [1, 1], han: [1.32, .78], wei: [.74, 1.2], zhao: [1.16, 1.12], yan: [.84, .8], qi: [1.26, 1.26], chu: [.8, .94] };
  const BRONZE = '#9c6428', BRONZE_D = '#5a3610', BRONZE_L = '#e0b464';
  function path(x, p) { x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.closePath(); }
  function strokeSign(x, sign, bw, k) {
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#1b2130'; x.lineWidth = lerp(bw, 3, k);
    x.beginPath();
    sign.forEach((st, i) => st.forEach(([px, py], j) => { const q = [lerp(px, GLYPH[i][j][0], k) * 14, -35 + lerp(py, GLYPH[i][j][1], k) * 20]; j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }));
    x.stroke(); x.restore();
  }
  function tablet(x, pl, k, gold) {
    x.fillStyle = '#5a3a1c'; x.fillRect(-24, -67, 48, 64);
    for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#eadbb6' : '#f3e6c6'; x.fillRect(-21.6 + i * 7.3, -65, 6.5, 60); }
    x.fillStyle = 'rgba(80,50,20,.75)'; x.fillRect(-23, -58, 46, 1.6); x.fillRect(-23, -12, 46, 1.6);
    x.strokeStyle = F.stage3d.mix(pl.col, QM.GOLD, gold); x.lineWidth = 3.4; x.strokeRect(-24, -67, 48, 64);
    x.fillStyle = '#3b2612'; x.fillRect(-20, -3, 8, 3); x.fillRect(12, -3, 8, 3);
    strokeSign(x, SIGNS[pl.j], [3, 2, 4.6, 2.4, 4.2, 2.2, 3.9][pl.j], k);
  }
  function coin(x, pl, m) {
    const a = COIN[pl.coin], b = COIN.round, hot = Math.sin(Math.PI * clamp(m)), pts = a.map((q, i) => [lerp(q[0], b[i][0], m), lerp(q[1], b[i][1], m)]);
    x.beginPath(); path(x, pts.map(q => [q[0] + 1.5, q[1] + 1.5])); x.fillStyle = BRONZE_D; x.fill();
    x.beginPath(); path(x, pts);
    if (pl.coin === 'knife' && m < 1) { const r = 2.6 * (1 - m); x.moveTo(8 + r, -6); x.arc(8, -6, r, 0, TAU, true); }
    const hs = pl.coin === 'round' ? 4.6 : 4.6 * m;
    if (hs > .2) { x.moveTo(-hs, -28 - hs); x.lineTo(-hs, -28 + hs); x.lineTo(hs, -28 + hs); x.lineTo(hs, -28 - hs); x.closePath(); }
    x.fillStyle = F.stage3d.mix(BRONZE, '#ffe1a8', hot * .85); x.fill('evenodd');
    x.strokeStyle = F.stage3d.mix(BRONZE_D, '#ffb04a', hot); x.lineWidth = 1.4; x.stroke();
    const done = ss(.6, 1, m);
    if (done > 0) {
      x.globalAlpha *= done; x.strokeStyle = BRONZE_L; x.lineWidth = 1.2; x.beginPath(); x.arc(0, -28, 18.5, 0, TAU); x.stroke();
      x.fillStyle = BRONZE_D; x.fillRect(-13, -30, 5, 1.6); x.fillRect(-12, -27, 3, 1.6); x.fillRect(8, -30, 5, 1.6); x.fillRect(9.5, -27, 1.6, 4);
    }
  }
  function weight(x, s) {
    x.save(); x.scale(s, s);
    x.beginPath(); path(x, WEIGHT.map(q => [q[0] + 1.4, q[1] + 1])); x.fillStyle = BRONZE_D; x.fill();
    x.beginPath(); path(x, WEIGHT); x.fillStyle = '#9a6c30'; x.fill();
    x.fillStyle = 'rgba(255,230,170,.35)'; x.beginPath(); x.ellipse(-6, -24, 3, 9, -.4, 0, TAU); x.fill();
    x.strokeStyle = BRONZE_D; x.lineWidth = 3; x.beginPath(); x.arc(0, -40, 4.5, 0, TAU); x.stroke();
    x.restore();
  }
  function measure(x, sx, sy) {
    x.save(); x.scale(sx, sy);
    x.fillStyle = BRONZE_D; x.fillRect(16, -15, 17, 4); x.fillRect(31, -17, 3, 8);
    x.fillStyle = '#8f6430'; x.fillRect(-17, -22, 34, 22);
    x.fillStyle = '#b48446'; x.beginPath(); x.moveTo(-17, -22); x.lineTo(17, -22); x.lineTo(22, -29); x.lineTo(-12, -29); x.closePath(); x.fill();
    x.fillStyle = '#3a2410'; x.beginPath(); x.moveTo(-13, -23.5); x.lineTo(14, -23.5); x.lineTo(18, -27.5); x.lineTo(-9, -27.5); x.closePath(); x.fill();
    x.fillStyle = '#6e4a20'; x.beginPath(); x.moveTo(17, -22); x.lineTo(22, -29); x.lineTo(22, -7); x.lineTo(17, 0); x.closePath(); x.fill();
    x.fillStyle = 'rgba(40,24,8,.5)'; x.fillRect(-12, -14, 22, 1.4); x.fillRect(-12, -9, 16, 1.4);
    x.restore();
  }
  function placeState(pl, t) {
    let sx = 1;
    for (const [a, d] of FLIPS) if (t > a && t < a + d) sx = Math.max(.04, Math.abs(Math.cos(Math.PI * (t - a) / d)));
    const ch = (i, d) => easeIO(clamp((t - hitAt(pl, i)) / d));
    if (t < FLIPS[0][0] + FLIPS[0][1] / 2) return ['tablet', sx, ch(0, .35)];
    if (t < FLIPS[1][0] + FLIPS[1][1] / 2) return ['coin', sx, ch(1, .45)];
    if (t < FLIPS[2][0] + FLIPS[2][1] / 2) return ['weight', sx, ch(2, .3)];
    return ['measure', sx, ch(3, .3)];
  }
  const settle = (k, t, t0) => k + (t >= t0 && t - t0 < .6 ? .06 * Math.exp(-(t - t0) * 7) * Math.sin((t - t0) * 26) : 0);
  function places(put, cm, m, t) {
    const top = geo().top;
    for (const pl of PLACES) {
      const t0 = standAt(pl), u = clamp((t - t0) / .3); if (u <= 0) continue;
      const up = 1 - Math.pow(1 - u, 3) * Math.cos(u * 2.4), down = ss(T_DOWN + .03 * pl.j, T_DOWN + .5 + .03 * pl.j, t); if (down >= 1) continue;
      put(pl.x, pl.y, top, (x, uu) => {
        const S = PL_H / 60 * uu.k * m * (.45 + .55 * uu.lev), [kind, sx, k] = placeState(pl, t);
        x.save();
        if (down > 0) { x.beginPath(); x.rect(uu.x - 80 * S, uu.y - 120 * S, 160 * S, 120 * S); x.clip(); }
        x.translate(uu.x, uu.y + down * 75 * S); x.scale(S * sx * (.6 + .4 * up), S * up);
        if (kind === 'tablet') tablet(x, pl, k, k);
        else if (kind === 'coin') coin(x, pl, pl.coin === 'round' ? 1 : k);
        else if (kind === 'weight') weight(x, settle(lerp(SZW[pl.id], 1, k), t, hitAt(pl, 2) + .3));
        else { const [a, b] = SZM[pl.id]; measure(x, lerp(a, 1, k), lerp(b, 1, k)); }
        x.restore();
      });
    }
  }
  function placeGlows(ctx, t, cam, m) {
    const sh = SH(), top = geo().top;
    for (const pl of PLACES) {
      if (t < standAt(pl) || t > T_DOWN + .3) continue;
      const u = QM.up(cam, pl.x, pl.y, top); if (!u) continue;
      const S = PL_H / 60 * u.k * m * (.45 + .55 * u.lev);
      for (let i = 0; i < 4; i++) {
        const d = t - hitAt(pl, i), a = d > -.05 && d < .6 ? Math.exp(-Math.pow((d - .12) / .16, 2)) : 0; if (a <= .01) continue;
        PR.glow(ctx, u.x - sh.x, u.y - 34 * S - sh.y, 44 * S, i === 1 ? '#ffb45a' : '#ffe6a8', (i === 1 ? .95 : .7) * a, 'flat');
      }
    }
  }
  function goldRings(x, cm, t, h) {
    for (const [t0, v] of RINGS) {
      const r = (t - t0) * v; if (r <= 0 || r > 700) continue;
      const a = (1 - ss(380, 700, r)) * .8, ring = QM.disk(XYQ[0], XYQ[1], r, 120);
      for (const [dw, aa] of [[22, .16], [9, .35], [3, 1]]) { x.strokeStyle = `rgba(255,236,170,${a * aa})`; x.lineWidth = dw; x.beginPath(); QM.ring(x, cm, ring, h); x.stroke(); }
    }
  }

  const GAUGE = 2.2, WR = .78;
  const CARTW = [1.36, .78, 1.16, .7, 1.26, .9, 1.42, .74];
  const V_C = 7.5, T_C0 = T_EVEN + .05, T_SNAP = T_AXL + .02, T_SAME2 = 13.9;
  const cartX = (c, t) => 330 + V_C * (t - (T_AXL - .2)) - 8.5 * c;
  const gaugeOf = (c, t) => GAUGE * lerp(CARTW[c], 1, easeIO(clamp((t - T_SNAP - .045 * c) / .28)));
  const cartScale = cm => clamp(6 / cm.z, 1.25, 3.5);
  function roadCarts(t) {
    const out = [], a = ss(T_SAME2 - .2, T_SAME2 + .3, t); if (a <= 0) return out;
    geo().ROADS.forEach((r, j) => {
      const n = Math.max(2, Math.floor(r.L / 34));
      for (let i = 0; i < n; i++) {
        const dir = (i + j) % 2 ? 1 : -1, s = (((i + .5) / n * r.L + dir * 22 * (t - T_SAME2)) % r.L + r.L) % r.L;
        if (s < 14 || s > r.L - 6 || (j === 0 && s < 230)) continue;
        const [px, py, hd] = QM.along(r, s);
        out.push({ px, py, hd: dir > 0 ? hd : hd + Math.PI, a: a * ss(14, 24, s) * (1 - ss(r.L - 14, r.L - 6, s)), g: GAUGE, run: s * dir, seed: j * 50 + i });
      }
    });
    return out;
  }
  const HORSE = [[0, 1.0], [.1, 1.42], [.5, 1.55], [1.45, 1.5], [1.75, 1.95], [1.95, 2.18], [2.12, 2.12], [2.35, 1.82], [2.25, 1.72], [1.95, 1.8], [1.62, 1.3], [1.5, 1.0], [.2, .95]];
  const INK = '#1b2130';
  function cart(x, cm, px, py, hd, g, run, a) {
    const h0 = geo().top, cf = Math.cos(hd), sf = Math.sin(hd), sc = cartScale(cm);
    const at = (f, l, u) => cm.at(px + (f * cf + l * sf) * sc, py + (f * sf - l * cf) * sc, h0 + u * sc);
    const ex = cm.pos[0], ey = -cm.pos[2], behind = (ex - px) * cf + (ey - py) * sf < 0, lnear = (ex - px) * sf - (ey - py) * cf > 0 ? 1 : -1;
    const poly = (pts, fill, stroke, lw) => { const q = pts.map(p => at(...p)); if (q.some(v => !v)) return; x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } };
    const line = (p, q, wd, col) => { const A = at(...p), B = at(...q); if (!A || !B) return; x.strokeStyle = col; x.lineWidth = Math.max(.6, wd * sc * (A[3] + B[3]) / 2); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); };
    const hull = pts => { const q = pts.map(p => at(...p)); if (q.some(v => !v)) return null; q.sort((u, v) => u[0] - v[0] || u[1] - v[1]); const cr = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]); const lo = [], up = []; for (const p of q) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of q.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return [...lo.slice(0, -1), ...up.slice(0, -1)]; };
    const fillHull = (h, col) => { if (!h) return; x.beginPath(); h.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.fillStyle = col; x.fill(); };
    const rot = -run / (WR * sc);
    const lines = (segs, wd, col) => { let k = 0, n = 0; const P = []; for (const [p, q] of segs) { const A = at(...p), B = at(...q); if (!A || !B) continue; P.push(A, B); k += A[3] + B[3]; n += 2; } if (!n) return; x.strokeStyle = col; x.lineWidth = Math.max(.6, wd * sc * k / n); x.beginPath(); for (let i = 0; i < P.length; i += 2) { x.moveTo(P[i][0], P[i][1]); x.lineTo(P[i + 1][0], P[i + 1][1]); } x.stroke(); };
    const polys = (list, fill) => { x.beginPath(); for (const pts of list) { const q = pts.map(p => at(...p)); if (q.some(v => !v)) continue; q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); } x.fillStyle = fill; x.fill(); };
    const kpx = sc * (at(0, 0, WR) || [0, 0, 0, 0])[3], spokes = ss(1.8, 3.2, WR * kpx), thin = .52 * kpx < 1.2;
    const wheel = l => {
      const rim = Array.from({ length: 18 }, (_, i) => { const q = i / 18 * TAU; return [WR * Math.cos(q), l, WR + WR * Math.sin(q)]; });
      poly(rim, null, INK, Math.max(.8, .2 * sc * (at(0, l, WR) || [0, 0, 0, 1])[3]));
      if (spokes <= 0) return;
      const ga = x.globalAlpha; x.globalAlpha = ga * spokes;
      lines(Array.from({ length: 6 }, (_, i) => { const q = rot + i / 6 * Math.PI; return [[WR * Math.cos(q), l, WR + WR * Math.sin(q)], [-WR * Math.cos(q), l, WR - WR * Math.sin(q)]]; }), .07, INK);
      x.globalAlpha = ga;
    };
    const horse = () => {
      const f0 = 1.05, legs = [[.32, 0], [.42, .5], [1.32, .25], [1.42, .75]];
      lines(legs.map(([lf, ph], i) => { const sw = .3 * Math.sin(run / (.9 * sc) * Math.PI + ph * TAU), l = i % 2 ? .18 : -.18; return [[f0 + lf, l, 1.02], [f0 + lf + sw, l, .02]]; }), .13, INK);
      polys((thin ? [0] : [-.26, -.13, 0, .13, .26]).map(l => HORSE.map(([f, u]) => [f0 + f, l * (u > 1.6 && f > 1.6 ? .45 : 1), u])), INK);
      line([f0 + .02, 0, 1.38], [f0 - .22, 0, .82], .1, INK);
      lines([-1, 1].map(s => [[.75, s * .42, WR + .25], [f0 + .5, s * .2, 1.3]]), .07, INK);
    };
    const box = () => {
      fillHull(hull([-.75, .75].flatMap(f => [-.62, .62].flatMap(l => [[f, l, WR + .05], [f, l, WR + .62]]))), '#2c2620');
      poly([[-.75, -.62, WR + .62], [.75, -.62, WR + .62], [.75, .62, WR + .62], [-.75, .62, WR + .62]], null, 'rgba(240,220,170,.45)', 1);
      line([0, -g / 2, WR], [0, g / 2, WR], .1, INK);
    };
    const canopy = () => {
      line([0, 0, WR + .5], [0, 0, WR + 1.95], .07, INK);
      const disc = Array.from({ length: 20 }, (_, i) => { const q = i / 20 * TAU; return [.66 * Math.cos(q), .66 * Math.sin(q), WR + 1.92]; });
      fillHull(hull([...disc, [0, 0, WR + 2.12]]), '#3a2a20');
      poly(disc, null, 'rgba(240,220,170,.5)', 1);
    };
    x.save(); x.globalAlpha *= a; x.lineCap = 'round'; x.lineJoin = 'round';
    wheel(-lnear * g / 2);
    if (behind) { horse(); box(); } else { box(); horse(); }
    wheel(lnear * g / 2);
    canopy();
    x.restore();
  }
  function carts(put, cm, t) {
    const top = geo().top, y0 = geo().XY[1];
    if (t > T_C0 && t < T_WALLS + 1) for (let c = 0; c < CARTW.length; c++) {
      const a = ss(T_C0 + .05 * c, T_C0 + .35 + .05 * c, t), px = cartX(c, t); if (a <= 0) continue;
      put(px, y0, top, x => cart(x, cm, px, y0, 0, gaugeOf(c, t), px, a));
    }
    for (const k of roadCarts(t)) put(k.px, k.py, top, x => cart(x, cm, k.px, k.py, k.hd, k.g, k.run, k.a));
  }
  function ruts(x, cm, t, h) {
    const a = ss(5, 12, cm.z); if (a <= 0 || t < T_C0) return;
    const y0 = geo().XY[1], old = (1 - ss(T_EVERY, T_RUTS + .3, t)) * a, neu = ss(T_SNAP, T_RUTS, t) * a;
    const rut = (yy, wd, col) => { const b = band([[250, yy], [geo().xe, yy]], wd); x.fillStyle = col; x.beginPath(); QM.ring(x, cm, b, h); x.fill(); };
    if (old > 0) for (const k of CARTW) for (const s of [-1, 1]) rut(y0 + s * cartScale(cm) * GAUGE * k / 2, .18, `rgba(92,58,16,${.5 * old})`);
    for (const s of [-1, 1]) rut(y0 + s * cartScale(cm) * GAUGE / 2, .18 + .2 * neu, `rgba(70,42,10,${.5 * a + .35 * neu})`);
  }

  let WALL = null;
  function wallGeo() {
    if (WALL) return WALL;
    const o = [];
    for (let x = -58; x <= 556; x += 6) { let y = -340; while (y < 200 && !QM.inEmpire(x, y)) y += 1; o.push([x, y + 9]); }
    const p = o.map((q, i) => { let sx = 0, sy = 0, n = 0; for (let j = Math.max(0, i - 2); j <= Math.min(o.length - 1, i + 2); j++) { sx += o[j][0]; sy += o[j][1]; n++; } return [sx / n, sy / n]; });
    const r = QM.road(p), sAt = xq => r.acc[Math.max(0, p.findIndex(q => q[0] >= xq))];
    return (WALL = { r, w: [sAt(-46), sAt(104)], z: [sAt(152), sAt(282)], y: [sAt(322), sAt(500)] });
  }
  const T_TW = T_GREAT - .05;
  function wallSpans(t) {
    const Wg = wallGeo(), L = Wg.r.L, out = [], jn = easeIO(clamp((t - T_JOIN) / .5)), ex = easeIO(clamp((t - T_EXT) / .9));
    [Wg.w, Wg.z, Wg.y].forEach(([a, b], j) => out.push([a, b, ss(T_WALLS + .15 * j, T_WALLS + .65 + .15 * j, t)]));
    for (const [a, b] of [[Wg.w[1], Wg.z[0]], [Wg.z[1], Wg.y[0]]]) if (jn > 0) { const m = (b - a) / 2 * jn; out.push([a, a + m, 1], [b - m, b, 1]); }
    if (ex > 0) out.push([Wg.w[0] * (1 - ex), Wg.w[0], 1], [Wg.y[1], Wg.y[1] + (L - Wg.y[1]) * ex, 1]);
    return out;
  }
  const wallF = cm => clamp(6.5 / cm.z, 1, 4);
  const wallH = (cm, t) => 6.5 * wallF(cm) * (1 + .3 * ss(T_GREAT - .5, T_GREAT + .3, t));
  const runAt = t => wallGeo().r.L * clamp((t - T_GREAT + .25) / 1.3);
  function wall(x, cm, t, h) {
    if (t < T_WALLS) return;
    const Wg = wallGeo(), f = wallF(cm), Hw = wallH(cm, t), th = 2.6 * f, ex = cm.pos[0], ey = -cm.pos[2], sr = runAt(t), lit = t > T_GREAT - .25 && t < T_GREAT + 1.6;
    const items = [];
    for (const [a, b, k] of wallSpans(t)) { if (b - a < .05 || k <= 0) continue; for (let s = a; s < b - 1e-6; s += 4) items.push({ s0: s, s1: Math.min(b, s + 4), k }); }
    if (t > T_TW) for (let s = 10; s < Wg.r.L; s += 38) { const k = ss(T_TW + s / Wg.r.L * .6, T_TW + .3 + s / Wg.r.L * .6, t); if (k > 0) items.push({ s0: s - 2.4 * f, s1: s + 2.4 * f, k, tower: true }); }
    for (const it of items) { const m = QM.along(Wg.r, (it.s0 + it.s1) / 2), p = cm.at(m[0], m[1], h); it.d = p ? p[2] : -1; }
    items.sort((a, b) => b.d - a.d);
    const P3 = (q, l, u) => cm.at(q[0] + Math.sin(q[2]) * l, q[1] - Math.cos(q[2]) * l, u);
    for (const it of items) {
      if (it.d < 0) continue;
      const A = QM.along(Wg.r, it.s0), B = QM.along(Wg.r, it.s1), hd = Math.atan2(B[1] - A[1], B[0] - A[0]); A[2] = B[2] = hd;
      const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], south = (ex - mid[0]) * -Math.sin(hd) + (ey - mid[1]) * Math.cos(hd) > 0 ? -1 : 1;
      const w2 = it.tower ? th * .95 : th / 2, top = h + (it.tower ? Hw + 3.2 * f : Hw) * it.k;
      const glow = lit ? Math.exp(-Math.pow(((it.s0 + it.s1) / 2 - sr) / 26, 2)) : 0;
      const q = [P3(A, south * w2, h), P3(B, south * w2, h), P3(B, south * w2, top), P3(A, south * w2, top)];
      const tp = [P3(A, -w2, top), P3(B, -w2, top), P3(B, w2, top), P3(A, w2, top)];
      if (q.some(v => !v) || tp.some(v => !v)) continue;
      const quad = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.fill(); };
      if (it.tower) {
        const sides = [[P3(A, -w2, h), P3(A, w2, h), P3(A, w2, top), P3(A, -w2, top)], [P3(B, -w2, h), P3(B, w2, h), P3(B, w2, top), P3(B, -w2, top)]];
        for (const sd of sides) if (!sd.some(v => !v)) quad(sd, '#4f402e');
        quad(q, '#5e4c36'); quad(tp, F.stage3d.mix('#a08866', '#fff0c4', glow));
        continue;
      }
      quad(q, F.stage3d.mix('#6a5640', '#c9a970', glow * .6)); quad(tp, F.stage3d.mix('#a48d68', '#fff0c4', glow));
      if (cm.z > 5) {
        x.fillStyle = '#5a4834';
        for (let s = it.s0 + .6; s < it.s1; s += 1.3) { const c0 = QM.along(Wg.r, s); c0[2] = hd; const c1 = [c0[0] + Math.cos(hd) * .65, c0[1] + Math.sin(hd) * .65, hd]; const pp = [P3(c0, south * w2, top), P3(c1, south * w2, top), P3(c1, south * w2, top + .7 * it.k), P3(c0, south * w2, top + .7 * it.k)]; if (!pp.some(v => !v)) quad(pp, '#5a4834'); }
      }
    }
  }
  function wallGlow(ctx, t, cam) {
    if (t < T_GREAT - .25 || t > T_GREAT + 1.6) return;
    const Wg = wallGeo(), q = QM.along(Wg.r, runAt(t)), sh = SH(), u = QM.up(cam, q[0], q[1], geo().top + wallH(cam, t)); if (!u) return;
    const a = ss(T_GREAT - .25, T_GREAT, t) * (1 - ss(T_GREAT + 1.1, T_GREAT + 1.6, t));
    PR.glow(ctx, u.x - sh.x, u.y - sh.y, 70, '#fff0c4', .8 * a, 'flat'); PR.glow(ctx, u.x - sh.x, u.y - sh.y, 18, '#ffffff', a, 'flat');
  }

  function onTop(x, cm, t) {
    if (t <= 0) return;
    const h = geo().top;
    x.save(); x.beginPath(); QM.rings(x, cm, CH.CHINA, h); x.clip(); x.beginPath(); QM.ring(x, cm, CH.QIN221[0], h); x.clip();
    roads(x, cm, t, h);
    ruts(x, cm, t, h);
    goldRings(x, cm, t, h);
    x.restore();
    wall(x, cm, t, h);
  }

  function uprights(put, cm, m, t, ex) {
    places(put, cm, m, t);
    if (!(ex && ex.noCarts)) carts(put, cm, t);
  }
  function glows(ctx, t, cam) {
    placeGlows(ctx, t, cam, A6().mag(cam));
    wallGlow(ctx, t, cam);
  }
  function words(ctx, t, cam) {
    F.impact(FL, ctx, t, { lines: [{ text: 'ONE SCRIPT', t0: T_ONE1, size: M45 ? 84 : 110, color: '#f5ecd8' }], x: .5, y: M45 ? .12 : .14, out: T_ONE2 - .42, accent: '#d9a443' });
    F.impact(FL, ctx, t, { lines: [{ text: 'ONE CURRENCY', t0: T_ONE2, size: M45 ? 84 : 110, color: '#f5ecd8' }], x: .5, y: M45 ? .12 : .14, out: T_ONE3 + .9, accent: '#d9a443' });
  }

  function world(ctx, t, cam, ex) {
    const A = A6(), B = A7(), T7 = B.DUR + t, sh = SH(), fade = skyFade(t);
    A.world(ctx, A.DUR + T7, cam, { throneK: ex && ex.throneK,
      sky: (c, cm) => { B.sky(c, cm, T7); if (ex && ex.sky) ex.sky(c, cm); },
      onTop: (x, cm) => { onTop(x, cm, t); if (ex && ex.onTop) ex.onTop(x, cm); },
      uprights: (put, cm, m) => { thrones(put, cm, m, t); if (t > 0) uprights(put, cm, m, t, ex); if (ex && ex.uprights) ex.uprights(put, cm, m); },
    });
    if (fade > 0) for (const [sx, sy, k] of B.stars6()) PR.glow(ctx, sx - sh.x, sy - sh.y, 7 + 4 * k, '#fff1c8', .55 * k * fade, 'flat');
    if (t > 0) glows(ctx, t, cam);
    if (ex && ex.glows) ex.glows(ctx, cam);
  }
  const FAST = { land: 4, blocks: 5, empire: true, walls: true };
  function draw(ctx, t) {
    const f0 = QM.FAST; QM.FAST = f0 || FAST;
    try {
      const cam = camAt(t);
      world(ctx, t, cam);
      if (t > 0) words(ctx, t, cam);
    } finally { QM.FAST = f0; }
    FL.grade(ctx, A6().DUR + A7().DUR + t);
  }

  F.scene('seq-08', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'whoosh', f0: 160, f1: 60, dur: 1.6, g: .16 },
      { t: T_SK0, type: 'rumble', dur: T_SK1 - T_SK0 + .5, g: .16 },
      ...[0, 1, 2, 3, 4].map(i => ({ t: T_SK0 + .1 + i * (T_SK1 - T_SK0) / 5, type: 'thud', g: .07 * (1 - i / 7), noSnap: true })),
      { t: T_BUILD - .05, type: 'slide', dur: 1.3, g: .2 },
      { t: T_BUILD, type: 'swoosh', dur: 1.5, g: .2 },
      ...PLACES.map(pl => ({ t: standAt(pl) + .12, type: 'clunk', f: 150 + 10 * pl.j, g: .12, noSnap: true })),
      { t: T_ONE1, type: 'impact', size: .32, g: .34, noSnap: true },
      { t: RINGS[0][0], type: 'shimmer', g: .14 },
      ...PLACES.filter(pl => pl.id !== 'qin').map(pl => ({ t: hitAt(pl, 0), type: 'draw', dur: .3, g: .1 })),
      { t: FLIPS[0][0], type: 'flip', g: .22 },
      { t: T_ONE2, type: 'impact', size: .3, g: .32, noSnap: true },
      { t: RINGS[1][0], type: 'hiss', dur: 1.0, g: .1 },
      ...PLACES.filter(pl => pl.id !== 'qin').map(pl => ({ t: hitAt(pl, 1) + .4, type: 'clink', f: 2400 + 140 * pl.j, g: .1 })),
      { t: FLIPS[1][0], type: 'flip', g: .2 },
      ...PLACES.map(pl => ({ t: hitAt(pl, 2) + .3, type: 'clunk', f: 90, g: .09, noSnap: true })),
      { t: FLIPS[2][0], type: 'flip', g: .2 },
      ...PLACES.map(pl => ({ t: hitAt(pl, 3) + .3, type: 'tap', g: .12, noSnap: true })),
      { t: T_EVEN - .05, type: 'whoosh', f0: 220, f1: 80, dur: 1.1, g: .18 },
      { t: T_EVEN + .5, type: 'lib', dur: T_NEW - T_EVEN, label: 'CARTS AND HORSES ON A DIRT ROAD, WOODEN WHEELS CREAKING' },
      ...[0, 1, 2, 3, 4, 5].map(i => ({ t: T_EVEN + .7 + i * .62, type: 'creak', dur: .2, g: .08 })),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({ t: T_EVEN + .8 + i * .33, type: 'clack', g: .05 })),
      { t: T_SNAP, type: 'clunk', f: 120, g: .3, noSnap: true },
      ...CARTW.map((_, c) => ({ t: T_SNAP + .045 * c + .25, type: 'tap', g: .1, noSnap: true })),
      { t: T_NEW - .1, type: 'swoosh', dur: 1.4, g: .22 },
      { t: T_WALLS, type: 'rumble', dur: 1.3, g: .3 },
      { t: T_WALLS, type: 'lib', dur: DUR - T_WALLS, label: 'STONE BLOCKS GRINDING, A HEAVY WALL RISING' },
      ...[0, 1, 2].map(j => ({ t: T_WALLS + .55 + .15 * j, type: 'clunk', f: 75, g: .16, noSnap: true })),
      { t: T_JOIN + .45, type: 'thud', g: .18, noSnap: true },
      { t: T_EXT, type: 'scrub', dur: .9, g: .14 },
      { t: T_GREAT, type: 'impact', size: .4, g: .34, noSnap: true },
      { t: T_GREAT - .2, type: 'shimmer', g: .16 },
    ],
    api: { DUR, camAt, geo, world, spl, wallGeo, wallH, runAt },
  });
})();
