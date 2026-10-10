(function () {
  'use strict';
  const F = FILM, PR = F.props, QM = F.qinmap, CH = F.china, Mo = F.motion, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-06'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const FLENS = M45 ? 1500 : 1700, ZF = M45 ? .62 : 1;
  const D2R = Math.PI / 180, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };

  const T_FEAR = 0.93, T_LIFE = 2.88;
  const T_BORN = 4.13, T_YING = 4.5, T_VIOL = 7.49, T_KNOWN = 9.18;
  const T_HIST = 10.25, T_WAR = 11.43;
  const T_SEVEN = 13.14, T_LOCK = 14.42, T_GEN = 16.88;
  const T_BEC = 18.36, T_QIN = 19.76;
  const T_38 = 22.07, T_SWAL = 23.3, T_ALL = 24.88;
  const T_FIRST = 26.27, T_STATE = 28.41, T_RULER = 29.61;
  const T_IRIS = 1.15;
  const T_DESC0 = .7, T_DESC = 1.45;

  const hC = 36, hK = 40, hQ = 56, hQ2 = 92;
  const K = QM.K, KQ = QM.byId.qin, XY = KQ.cap, HD = QM.byId.zhao.cap, P = (lon, lat) => CH.proj(lon, lat);
  const LUO = P(112.45, 34.62);
  const ORDER = ['han', 'zhao', 'wei', 'chu', 'yan', 'qi'];
  const SW = Object.fromEntries(ORDER.map((id, i) => [id, i < 5 ? T_SWAL + i * (T_ALL - .02 - T_SWAL) / 5 : T_ALL]));
  const RMAX = (() => {
    const out = {}, R = F.rng(7);
    for (const k of K) { let m = 0; for (let i = 0; i < 4000; i++) { const px = -150 + R() * 800, py = -360 + R() * 760; if (QM.inPoly(k.ring, px, py) && QM.inEmpire(px, py)) m = Math.max(m, Math.hypot(px - k.cap[0], py - k.cap[1])); } out[k.id] = m + 12; }
    return out;
  })();
  const T_GQ0 = T_QIN - .05, T_GQ1 = T_QIN + .75;
  const goldR = (id, t) => id === 'qin' ? RMAX.qin * easeIO(clamp((t - T_GQ0) / (T_GQ1 - T_GQ0))) : RMAX[id] * (1 - Math.pow(1 - clamp((t - SW[id] + .12) / .45), 2.2));
  const goldDone = (id, t) => goldR(id, t) >= RMAX[id] - 1e-6;
  const goldAt = (id, t) => goldR(id, t) > 0;
  const rise = (j, t) => { const u = clamp((t - T_SEVEN - .07 * j) / .6); return u <= 0 ? 0 : 1 - Math.pow(1 - u, 3) * Math.cos(u * 2.2); };
  const grind = t => ss(T_LOCK - .2, T_LOCK + .5, t) * (1 - ss(T_38, T_38 + .5, t));
  const hKing = (k, j, t) => hK * rise(j, t) + 2.4 * grind(t) * Math.sin(TAU * (t * .85 + j * .37));
  const bump = d => d <= 0 ? 0 : Math.exp(-d * 9) * Math.sin(d * 34) * .07;
  const hGold = t => {
    let h = lerp(hK, hQ, ss(T_GQ0, T_GQ1, t)) + (hQ2 - hQ) * ss(T_STATE - .2, T_STATE + .55, t);
    for (const id of ORDER) h *= 1 - bump(t - SW[id]) * (id === 'qi' ? 1.6 : 1);
    return h * (1 + 1.4 * bump(t - T_STATE - .45));
  };
  const T_BD0 = T_HIST + .35, T_BD1 = T_WAR + .35;
  const borderA = t => ss(T_BD0, T_BD1, t) * (1 - ss(T_FIRST, T_FIRST + .7, t));
  const night = t => .74 * (1 - ss(T_HIST + .3, T_WAR + .7, t));
  const T_DN0 = T_GEN - .15, T_DN1 = T_BEC + .55;

  const ROAD_W = QM.road([HD, P(113.6, 35.3), LUO, XY]);
  const T_GO0 = T_BEC + .08, T_GO1 = T_QIN - .05;
  function lightAt(t) {
    const u = easeIO(clamp((t - T_GO0) / (T_GO1 - T_GO0))), q = QM.along(ROAD_W, u * ROAD_W.L);
    return [q[0], q[1], hC + groundH(q[0], q[1], t)];
  }
  function groundH(px, py, t) {
    if (!QM.inEmpire(px, py)) return 0;
    const k = QM.kingdomAt(px, py); if (!k) return 0;
    const j = K.indexOf(k), g = k.id === 'qin' ? Math.hypot(px - XY[0], py - XY[1]) < goldR('qin', t) : Math.hypot(px - k.cap[0], py - k.cap[1]) < goldR(k.id, t);
    return g ? hGold(t) : Math.max(0, hKing(k, j, t));
  }

  const FIRES = (() => {
    const R = F.rng(23), out = [];
    while (out.length < 46) { const px = -60 + R() * 640, py = -320 + R() * 640; if (QM.inEmpire(px, py)) out.push({ x: px, y: py, d: Math.hypot(px - HD[0], py - HD[1]), r: R() }); }
    const md = Math.max(...out.map(f => f.d));
    for (const f of out) { f.t0 = T_VIOL + 1.55 * Math.pow(f.d / md, .8) + .12 * f.r; f.t1 = T_HIST + .2 + .9 * f.r; }
    return out;
  })();
  const BFIRES = (() => {
    const out = [], R = F.rng(29);
    for (const b of QM.BORDERS) {
      const r = QM.road(b);
      for (let s = 20 + R() * 20; s < r.L; s += 46 + R() * 22) {
        const [px, py] = QM.along(r, s); if (!QM.inEmpire(px, py)) continue;
        const ks = K.filter(k => QM.inPoly(k.ring, px + 4, py) || QM.inPoly(k.ring, px - 4, py) || QM.inPoly(k.ring, px, py + 4) || QM.inPoly(k.ring, px, py - 4));
        const out1 = Math.max(...ks.map(k => k.id === 'qin' ? T_GQ1 : SW[k.id] + .1));
        out.push({ x: px, y: py, r: R(), t0: T_WAR - .35 + .7 * R(), t1: out1 });
      }
    }
    return out;
  })();

  const WAR = [
    ['qin', [111.2, 37.4]], ['qin', [111.65, 34.95]], ['zhao', [114.75, 35.85]], ['zhao', [115.4, 39.1]], ['han', [111.65, 34.95]],
    ['han', [113.35, 33.45]], ['wei', [115.7, 35.55]], ['wei', [114.75, 35.85]], ['qi', [115.7, 35.55]], ['qi', [118.5, 34.75]],
    ['yan', [115.4, 39.1]], ['chu', [113.35, 33.45]], ['chu', [118.5, 34.75]], ['chu', [112.1, 32.35]],
  ].map(([id, e], i) => ({ id, i, r: QM.road([QM.byId[id].cap, P(e[0], e[1])]) }));
  const MARCH = {
    han: [LUO, QM.byId.han.cap], zhao: [LUO, P(113.6, 35.3), HD], wei: [LUO, QM.byId.wei.cap], chu: [LUO, P(114.9, 33.7), QM.byId.chu.cap],
    yan: [LUO, P(113.6, 35.3), HD, QM.byId.yan.cap], qi: [LUO, QM.byId.wei.cap, P(117.0, 35.9), QM.byId.qi.cap],
  };
  const ROADS_E = ORDER.map(id => ({ id, r: QM.road([XY, ...MARCH[id]]) }));
  const T_W0 = T_SEVEN + .35, T_W1 = T_38 + .1, V_W = 26, GAP = 10;
  function soldiers(t, out) {
    if (t > T_W0) for (const f of WAR) {
      const head = V_W * (t - T_W0) - (f.i % 3) * 3, stop = V_W * (T_W1 - T_W0), gone = f.id === 'qin' ? Infinity : SW[f.id];
      const a0 = 1 - ss(gone - .1, gone + .15, t); if (a0 <= 0) continue;
      for (let s = head - Math.floor(head / GAP) * GAP; s <= Math.min(head, f.r.L); s += GAP) {
        const born = head - s; if (born > stop) continue;
        const a = a0 * ss(0, 8, s) * (1 - ss(f.r.L - 10, f.r.L, s));
        if (a > 0) out.push({ r: f.r, s, a, ph: s / 7 });
      }
    }
    if (t > T_38 - .1) for (const e of ROADS_E) {
      const T1 = SW[e.id], v = e.r.L / (T1 - T_38 + .1), head = v * (t - T_38 + .1), g = 15;
      const a0 = 1 - ss(T_FIRST, T_STATE, t); if (a0 <= 0) continue;
      for (let s = head; s >= 16; s -= g) { if (s > e.r.L) continue; out.push({ r: e.r, s, a: a0 * ss(16, 28, s) * (1 - ss(e.r.L - 8, e.r.L, s)), ph: s / 9 }); }
    }
    return out;
  }

  const T_TH = T_QIN + .3;
  const throneSize = t => (t < T_TH - .3 ? 0 : .5) + .5 * ss(T_RULER - .1, T_RULER + .5, t);
  const mag = cam => clamp(4.5 / cam.z, 1, 3), magT = cam => clamp(6 / cam.z, 1, 3.5);
  const THRONE_H = 30;

  const XM = P(113.6, 34.4), XK = P(115.2, 35.4), XE = P(114.6, 34.9);
  const KEYS = [
    [0, HD[0], HD[1], 8, 62, 0], [T_IRIS, HD[0], HD[1], 6.2, 62, 0], [T_LIFE + .8, HD[0] - 2, HD[1] + 2, 4.4, 61, 0],
    [T_YING + 1, HD[0] - 6, HD[1] + 6, 3.6, 60, 0], [T_VIOL, HD[0] - 12, HD[1] + 14, 3.0, 59, 0], [T_KNOWN + .4, XK[0] - 16, XK[1] - 4, 2.15, 60, 0],
    [T_WAR + .2, XK[0] - 8, XK[1] - 8, 2.05, 60, -1], [T_SEVEN + .2, XK[0] - 4, XK[1] - 8, 2.08, 58, -1], [T_GEN - .4, XK[0] + 14, XK[1] - 4, 2.2, 54, 1],
    [T_BEC + .1, HD[0] - 20, HD[1] + 40, 2.5, 50, 1], [T_QIN + .2, XY[0] + 70, XY[1] + 14, 2.8, 52, 0], [T_38, XY[0] + 100, XY[1] + 12, 2.45, 54, 0],
    [T_SWAL + .4, XE[0] + 10, XE[1] + 22, 1.9, 57, -1], [T_ALL + .8, XE[0], XE[1] + 20, 1.82, 59, -2],
    [T_STATE, XM[0] + 6, XM[1] + 16, 1.78, 62, -4], [DUR + 1.5, XM[0] - 14, XM[1] + 10, 1.7, 65, -8],
  ];
  const spl = (() => {
    const ts = KEYS.map(k => k[0]), mono = f => Mo.monotone(ts.map((t, i) => [t, f(KEYS[i])]));
    return [mono(k => k[1]), mono(k => k[2]), mono(k => Math.log(k[3])), mono(k => k[4]), mono(k => k[5])];
  })();
  let IRIS_AT = null;
  function irisCentre() {
    if (IRIS_AT) return IRIS_AT;
    const A = F.getScene('seq-05');
    const q = A && A.api && A.api.lightAt ? A.api.lightAt(A.api.DUR + (T_DESC0 + T_DESC) / 2) : [W / 2, H * .45];
    return (IRIS_AT = q);
  }
  function camAt(t) {
    const [fx, fy, fz, fp, fw] = spl, k = ss(T_DESC, T_LIFE + .6, t), ic = irisCentre();
    return QM.camera({ x: fx(t), y: fy(t), z: Math.exp(fz(t)) * ZF, pitch: fp(t) * D2R, yaw: fw(t) * D2R, lift: hC, cx: k >= 1 ? W / 2 : lerp(ic[0], W / 2, k), cy: k >= 1 ? H / 2 : lerp(ic[1], H / 2, k) }, W, H, FLENS);
  }

  function inkBorders(x, cam, h, a) {
    if (a <= 0) return;
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = `rgba(27,33,48,${.85 * a})`; x.lineWidth = 2.4;
    x.beginPath(); for (const b of QM.BORDERS) QM.polyline(x, cam, b, h); x.stroke(); x.restore();
  }
  function blocks(t, cam) {
    const list = [], ba = borderA(t), done = [], onTop = (x, h) => inkBorders(x, cam, h, ba);
    for (const id of ['qin', ...ORDER]) if (goldDone(id, t)) done.push(QM.byId[id].ring);
    K.forEach((k, j) => {
      if (goldDone(k.id, t)) return;
      const ck = smooth(clamp((t - T_SEVEN - .07 * j) / .3));
      list.push({ rings: [k.ring], h: hKing(k, j, t), col: ck >= 1 ? k.col : F.stage3d.mix(FL.P.sheet, k.col, ck), n: 8, onTop });
      if (goldAt(k.id, t)) list.push({ rings: [k.ring], clips: [[QM.disk(k.cap[0], k.cap[1], goldR(k.id, t))]], h: hGold(t), col: QM.GOLD, n: 9, onTop });
    });
    if (done.length) list.push({ rings: done, h: hGold(t), col: QM.GOLD, n: 10, onTop });
    return list;
  }
  function mapLayer(x, t, cam, ex) {
    QM.land(x, cam, FL.P, hC, { n: 10 });
    if (rise(0, t) <= 0) {
      const a = borderA(t);
      if (a > 0) {
        x.save(); x.beginPath(); QM.rings(x, cam, CH.CHINA, hC); x.clip(); x.beginPath(); QM.ring(x, cam, CH.QIN221[0], hC); x.clip();
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.strokeStyle = `rgba(70,70,80,${.35 * a * (1 - ss(T_WAR + .3, T_SEVEN, t))})`; x.lineWidth = 14; x.beginPath(); for (const b of QM.BORDERS) QM.polyline(x, cam, b, hC); x.stroke();
        x.restore();
        x.save(); x.beginPath(); QM.rings(x, cam, CH.CHINA, hC); x.clip(); x.beginPath(); QM.ring(x, cam, CH.QIN221[0], hC); x.clip(); inkBorders(x, cam, hC, a); x.restore();
      }
    } else QM.blocks(x, cam, hC, blocks(t, cam));
    if (ex && ex.onTop) ex.onTop(x, cam);
    const n = night(t);
    if (n > 0) { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(16,26,60,${n})`; x.fillRect(0, 0, W, H); x.restore(); }
  }

  function uprights(ctx, t, cam, ex) {
    const L = [], m = mag(cam);
    const put = (mx, my, h, draw) => { const u = QM.up(cam, mx, my, h); if (u && u.d > 2) L.push({ d: u.d, u, draw }); };
    for (const f of FIRES) {
      const a = ss(f.t0, f.t0 + .25, t) * (1 - ss(f.t1, f.t1 + .5, t)); if (a <= 0) continue;
      put(f.x, f.y, hC, (x, u) => QM.fire(x, u.x, u.y, .75 * u.k * m * (.4 + .6 * u.lev), a, t, f.r * 9));
    }
    for (const f of BFIRES) {
      const a = ss(f.t0, f.t0 + .3, t) * (1 - ss(f.t1 - .1, f.t1 + .2, t)) * (.55 + .45 * Math.sin(t * 2.3 + f.r * 9)); if (a <= 0) continue;
      put(f.x, f.y, hC + groundH(f.x, f.y, t), (x, u) => QM.fire(x, u.x, u.y, .6 * u.k * m * (.4 + .6 * u.lev), a, t, f.r * 9 + 3));
    }
    for (const s of soldiers(t, [])) {
      const [px, py, hd] = QM.along(s.r, s.s), ahead = QM.along(s.r, s.s + 2);
      put(px, py, hC + groundH(px, py, t), (x, u) => {
        const v = cam.at(ahead[0], ahead[1], hC), dir = v && v[0] < u.x ? -1 : 1;
        QM.soldier(x, u.x, u.y, 6 * u.k * m * (.5 + .5 * u.lev), s.ph, dir, { alpha: s.a });
      });
    }
    for (const k of K) {
      const a = ss(T_SEVEN + .3, T_SEVEN + .7, t) * (k.id === 'qin' ? 1 : 1 - ss(T_FIRST, T_FIRST + .7, t)); if (a <= 0) continue;
      const out = k.id === 'qin' ? 0 : ss(SW[k.id] - .05, SW[k.id] + .15, t);
      put(k.cap[0], k.cap[1], hC + groundH(k.cap[0], k.cap[1], t), (x, u) => {
        const r = 4 + 1.2 * m, f = .35 + .65 * (1 - u.lev);
        x.fillStyle = `rgba(27,33,48,${a})`; x.beginPath(); x.ellipse(u.x, u.y, r + 1.6, (r + 1.6) * f, 0, 0, TAU); x.fill();
        x.fillStyle = k.id === 'qin' ? `rgba(179,38,28,${a})` : `rgba(255,241,208,${a * (1 - out) + .25 * a * out})`; x.beginPath(); x.ellipse(u.x, u.y, r, r * f, 0, 0, TAU); x.fill();
      });
    }
    const ts = throneSize(t);
    if (ts > 0) {
      const u0 = clamp((t - (T_TH - .3)) / .3), drop = (1 - u0 * u0), sq = u0 >= 1 ? 1 + .12 * Math.exp(-(t - T_TH) * 9) * Math.cos((t - T_TH) * 30) : 1;
      put(XY[0], XY[1], hC + groundH(XY[0], XY[1], t), (x, u) => {
        const S = THRONE_H * u.k * magT(cam) * (.45 + .55 * u.lev) * ts / 59;
        const sink = ex && ex.throneK != null ? 1 - ex.throneK : 0;
        x.save(); if (sink > 0) { x.beginPath(); x.rect(u.x - 80 * S, u.y - 90 * S, 160 * S, 90 * S); x.clip(); x.translate(0, sink * 66 * S); }
        x.translate(u.x, u.y - drop * 140); x.scale(1 / sq, sq); QM.throne(x, 0, 0, S, { deep: 3 + 8 * (1 - u.lev), side: 3 }); x.restore();
      });
    }
    if (ex && ex.uprights) ex.uprights(put, cam, m);
    L.sort((a, b) => b.d - a.d);
    FL.sheet(ctx, ID, 1, RC, x => { for (const o of L) o.draw(x, o.u); }, { flatShadow: [3, 5, 4, .45] });
  }

  function glows(ctx, t, cam, ex) {
    const m = mag(cam), sh = SH(), g = (px, py, h, r, col, a) => { const u = QM.up(cam, px, py, h); if (u && u.d > 2) PR.glow(ctx, u.x - sh.x, u.y - sh.y, r(u), col, a, 'flat'); };
    const nk = .5 + night(t);
    for (const f of FIRES) { const a = ss(f.t0, f.t0 + .25, t) * (1 - ss(f.t1, f.t1 + .5, t)); if (a > 0) g(f.x, f.y, hC + 4, u => 26 * u.k * m * .5, '#ff9a4a', .5 * a * nk); }
    for (const f of BFIRES) { const a = ss(f.t0, f.t0 + .3, t) * (1 - ss(f.t1 - .1, f.t1 + .2, t)); if (a > 0) g(f.x, f.y, hC + groundH(f.x, f.y, t) + 3, u => 20 * u.k * m * .5, '#ff7a3a', .35 * a); }
    const b = ss(T_BORN - .2, T_BORN + .3, t), toThrone = ss(T_QIN - .1, T_TH + .2, t), [lx, ly, lh] = lightAt(t);
    const pulse = 1 + .12 * Math.exp(-Math.pow((t - T_LIFE - .2) / .35, 2)) + .25 * Math.exp(-Math.pow((t - T_BORN - .1) / .3, 2));
    const r0 = u => Math.max(14, (10 + 2.2 * u.k) * pulse);
    g(lx, ly, lh + 2, u => r0(u) * 3.2, '#ffd08a', (.55 + .2 * b) * (1 - .6 * toThrone));
    g(lx, ly, lh + 2, u => r0(u) * .9, '#fff6e2', (.75 + .25 * b) * (1 - toThrone));
    const ts = throneSize(t);
    const tk = ex && ex.throneK != null ? ex.throneK : 1;
    if (ts > 0 && tk > 0) g(XY[0], XY[1], hC + groundH(XY[0], XY[1], t) + 8, u => (40 + 40 * ts) * Math.min(2.2, u.k * magT(cam) / 3), '#ffd08a', (.35 + .35 * ss(T_RULER - .1, T_RULER + .5, t)) * tk);
  }
  function dayNight(ctx, t) {
    if (t < T_DN0 || t > T_DN1) return;
    const u = (t - T_DN0) / (T_DN1 - T_DN0) * 3, i = Math.floor(u), v = u - i, a = .42 * Math.sin(Math.PI * v) * (i < 3 ? 1 : 0);
    if (a <= 0) return;
    const cx = lerp(W * 1.25, -W * .25, v), g = ctx.createLinearGradient(cx - W * .45, 0, cx + W * .45, 0);
    g.addColorStop(0, 'rgba(6,10,24,0)'); g.addColorStop(.35, `rgba(6,10,24,${a})`); g.addColorStop(.65, `rgba(6,10,24,${a})`); g.addColorStop(1, 'rgba(6,10,24,0)');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  function tags(ctx, t, cam) {
    const m = mag(cam), size = M45 ? 30 : 32;
    FL.sheet(ctx, ID, 1, RC, x => {
      const a1 = ss(T_YING - .05, T_YING + .25, t) * (1 - ss(T_HIST + .1, T_HIST + .5, t));
      if (a1 > 0) { const [lx, ly, lh] = lightAt(t), u = QM.up(cam, lx, ly, lh); if (u) QM.tag(x, u.x, u.y - 16, 'YING ZHENG · 259 BC', { alpha: a1, size, stem: 40 }); }
      const a2 = ss(T_QIN, T_QIN + .3, t) * (1 - ss(T_FIRST, T_FIRST + .4, t));
      if (a2 > 0) {
        const u = QM.up(cam, XY[0], XY[1], hC + groundH(XY[0], XY[1], t)); if (!u) return;
        const age = Math.round(lerp(13, 38, easeIO(clamp((t - T_38) / .55)))), th = THRONE_H * u.k * magT(cam) * (.45 + .55 * u.lev) * throneSize(t);
        QM.tag(x, u.x, u.y - th - 6, `QIN · AGE ${age}`, { alpha: a2, size, stem: 22 });
      }
    }, { shadow: false });
  }

  function world(ctx, t, cam, ex) {
    FL.background(ctx);
    if (ex && ex.sky) ex.sky(ctx, cam);
    FL.sheet(ctx, ID, 1, RC, x => mapLayer(x, t, cam, ex), { flatShadow: [10, 14, 12, .4] });
    uprights(ctx, t, cam, ex);
    glows(ctx, t, cam, ex);
    dayNight(ctx, t);
  }
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function own(ctx, t) {
    const cam = camAt(t);
    world(ctx, t, cam);
    tags(ctx, t, cam);
    F.impact(FL, ctx, t, { lines: [{ text: 'THE WARRING STATES', t0: T_WAR, size: M45 ? 78 : 104, color: '#f5ecd8' }], x: .5, y: M45 ? .15 : .17, out: T_SEVEN + .9, accent: '#d9a443' });
    FL.grade(ctx, t);
  }
  function draw(ctx, t) {
    const A = F.getScene('seq-05');
    if (!A || t >= T_DESC) return own(ctx, t);
    if (t <= 0) return A.draw(ctx, A.duration);
    const b = ss(T_DESC0, T_DESC, t);
    A.draw(ctx, A.duration + t);
    if (b <= 0) return;
    const [cv, x] = buf(); clean(x); own(x, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = b; ctx.drawImage(cv, 0, 0); ctx.restore();
  }

  F.scene('seq-06', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .02, type: 'whoosh', f0: 180, f1: 50, dur: 1.2, g: .14 },
      { t: .05, type: 'rumble', dur: 1.1, g: .14 },
      { t: T_DESC0 + .2, type: 'shimmer', g: .14 },
      { t: T_LIFE - .1, type: 'whoosh', f0: 70, f1: 120, dur: .9, g: .09 },
      { t: T_BORN, type: 'shimmer', g: .1 },
      { t: T_YING, type: 'tap', g: .25, noSnap: true },
      { t: T_VIOL, type: 'crackle', dur: 2.6, g: .22 },
      { t: T_VIOL + .1, type: 'lib', dur: 2.8, label: 'FIRES CRACKLING, A TOWN BURNING FAR OFF' },
      { t: T_VIOL + .6, type: 'rumble', dur: 2.4, g: .25 },
      { t: T_BD0, type: 'slide', dur: .9, g: .18 },
      { t: T_WAR, type: 'impact', size: .4, g: .38, noSnap: true },
      { t: T_SEVEN, type: 'rumble', dur: 1.1, g: .35 },
      ...K.map((k, j) => ({ t: T_SEVEN + .07 * j + .45, type: 'clunk', f: 70 + 9 * j, g: .13 })),
      { t: T_SEVEN + .5, type: 'lib', dur: T_38 - T_SEVEN + 2.2, label: 'AN ARMY MARCHING ON EARTH, MANY FEET' },
      { t: T_LOCK, type: 'scrub', dur: 1.4, g: .14 },
      { t: T_LOCK + .1, type: 'lib', dur: 3.0, label: 'STONE GRINDING ON STONE, SLOW' },
      ...[0, 1, 2, 3].map(i => ({ t: T_LOCK + .6 + i * .75, type: 'thud', g: .12 })),
      ...[0, 1, 2].map(i => ({ t: T_DN0 + (i + .35) * (T_DN1 - T_DN0) / 3, type: 'whoosh', f0: 80, f1: 160, dur: .7, g: .1 })),
      { t: T_GO0, type: 'shimmer', g: .1 },
      { t: T_QIN, type: 'swoosh', dur: .9, g: .3 },
      { t: T_TH, type: 'clunk', f: 95, g: .3, noSnap: true },
      { t: T_38, type: 'tick', g: .2 },
      ...ORDER.map(id => ({ t: SW[id], type: 'impact', size: id === 'qi' ? .6 : .28, g: id === 'qi' ? .5 : .3, noSnap: true })),
      { t: T_STATE - .55, type: 'swoosh', dur: 1.0, g: .3 },
      { t: T_STATE + .5, type: 'impact', size: .4, g: .35, noSnap: true },
      { t: T_RULER, type: 'shimmer', g: .14 },
    ],
    api: { DUR, camAt, world, spl, KEYS, XY, hC, hGold, groundH, throneSize, mag, magT, THRONE_H, FLENS, ZF },
  });
})();
