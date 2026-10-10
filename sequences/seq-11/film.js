(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, CH = F.china, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-11'), DUR = C.duration;
  const FL = F.look('flat', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2], FIG = S3.FIG;
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api, S10 = () => F.getScene('seq-10'), A10 = () => S10().api;
  const T0 = () => A6().DUR + F.getScene('seq-07').api.DUR + F.getScene('seq-08').api.DUR + F.getScene('seq-09').api.DUR + A10().DUR;

  const T_227 = 0.14, T_BEF = 1.13, T_COMP = 3.34;
  const T_ENVOY = 4.71, T_JING = 5.54, T_ARR = 6.03, T_COURT = 7.03, T_MAP = 8.19;
  const T_SCROLL = 9.41, T_DAGGER = 10.72, T_APP = 11.05;
  const T_WHAT = 12.88, T_COMIC = 14.2, T_HORR = 14.82;
  const T_MOST = 15.98, T_CIRC = 17.77, T_PILLAR = 18.63, T_COURTIERS = 19.51, T_FROZEN = 20.09;
  const T_LAW = 21.12, T_WEAP = 22.78, T_PRES = 23.55;
  const T_HE = 24.72, T_SURV = 24.87, T_INCH = 25.65;
  const T_FADE0 = .05, T_FADE1 = .95;
  const T_X = T_WHAT + .12;

  const P = (lon, lat) => CH.proj(lon, lat), K = QM.K, XY = QM.byId.qin.cap;
  const hC = 36, hK = 40, hG0 = 92, hG = 48;
  const BACK = ['qi', 'yan', 'chu', 'wei'], GOLD0 = ['qin', 'han', 'zhao'];
  const RMAX = (() => {
    const out = {}, R = F.rng(7);
    for (const k of K) { let m = 0; for (let i = 0; i < 4000; i++) { const px = -150 + R() * 800, py = -360 + R() * 760; if (QM.inPoly(k.ring, px, py) && QM.inEmpire(px, py)) m = Math.max(m, Math.hypot(px - k.cap[0], py - k.cap[1])); } out[k.id] = m + 12; }
    return out;
  })();
  const T_RB0 = T_227 + .25, RB_STEP = (T_COMP - .5 - T_RB0) / 4, RB_DUR = .9;
  const backU = (id, t) => easeIO(clamp((t - T_RB0 - BACK.indexOf(id) * RB_STEP) / RB_DUR));
  const goldR = (id, t) => GOLD0.includes(id) ? Infinity : RMAX[id] * (1 - backU(id, t));
  const hGold = t => lerp(hG0, hG, easeIO(clamp((t - T_RB0) / (T_COMP - T_RB0))));
  const kingRise = (id, t) => { const u = clamp((t - T_RB0 - BACK.indexOf(id) * RB_STEP - RB_DUR * .7) / .5); return u <= 0 ? 0 : Math.sin(u * PI) * .12; };
  function groundH(px, py, t) {
    if (!QM.inEmpire(px, py)) return 0;
    const k = QM.kingdomAt(px, py); if (!k) return 0;
    return Math.hypot(px - k.cap[0], py - k.cap[1]) < goldR(k.id, t) ? hGold(t) : hK * (1 + kingRise(k.id, t));
  }
  const THRONE_H = 30, throneSize = t => lerp(1, .5, easeIO(clamp((t - T_RB0) / (T_COMP - T_RB0))));
  const mag = cam => clamp(4.5 / cam.z, 1, 3), magT = cam => clamp(6 / cam.z, 1, 3.5);

  const JI = QM.byId.yan.cap, HD = QM.byId.zhao.cap, LUO = P(112.45, 34.62);
  const JKS = [XY[0] + 9.5, XY[1] + 3.6], AP = [XY[0] + 17.5, XY[1] + 7.2];
  const TRACK = QM.road([JI, HD, P(113.6, 35.3), LUO, P(110.2, 34.5), AP]);
  const T_UP = T_ENVOY + .05, T_STEP = T_ARR - .1, T_TR0 = T_ARR, T_TR1 = T_ARR + 1.0, T_IN = T_TR1 - .15;
  const STEPOFF = Mo.gait({ from: 0, to: 80, t0: T_STEP, gait: 'walk' });
  const WALKIN = Mo.gait({ from: 0, to: 120, t0: T_IN, gait: 'walk', until: T_SCROLL - .35 });
  const trackS = t => TRACK.L * easeIO(clamp((t - T_TR0) / (T_TR1 - T_TR0)));
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  function envoyAt(t) {
    const tp = Mo.pose(t);
    if (t < T_IN) {
      const a = ss(T_UP, T_UP + .3, t) * (1 - ss(T_STEP + .35, T_STEP + .6, t)), d = STEPOFF.x(tp) / 92 * 1.3;
      const dir = [HD[0] - JI[0], HD[1] - JI[1]], L = Math.hypot(dir[0], dir[1]);
      return { at: [JI[0] + dir[0] / L * d, JI[1] + dir[1] / L * d], pose: centre(STEPOFF(tp), STEPOFF.x(tp)), face: Math.atan2(dir[1], dir[0]), a, rise: ss(T_UP, T_UP + .4, t) };
    }
    const k = clamp(WALKIN.x(tp) / 120), at = [lerp(AP[0], JKS[0], k), lerp(AP[1], JKS[1], k)];
    return { at, pose: centre(WALKIN(tp), WALKIN.x(tp)), face: Math.atan2(JKS[1] - AP[1], JKS[0] - AP[0]), a: ss(T_IN, T_IN + .3, t), rise: 1 };
  }
  const INK = '#1b1a22', RIM = '#efe0bb';
  const ENV = Q.silhouette('minister', INK), ENV_RIM = Q.silhouette('minister', RIM);
  function rollUnderArm(x, pj, near, fall, fwd) {
    const a = pj.arms[1]; if (fall <= 0 && !!a.near !== near) return; if (fall > 0 && !near) return;
    const c0 = [a.el[0] + 2, a.el[1] + 3], L = 17, r = 3.1, u = clamp(fall / T_DROP);
    const c = [c0[0] + fwd * 14 * u, lerp(c0[1], -r, u * u)];
    x.save(); x.translate(c[0], c[1]); x.rotate(.08 * (1 - u));
    x.fillStyle = '#3a3026'; x.beginPath(); x.roundRect(-L, -r, 2 * L, 2 * r, r); x.fill();
    x.fillStyle = '#e9dcbc'; x.beginPath(); x.ellipse(L - 1, 0, 1.4, r * .9, 0, 0, TAU); x.fill();
    x.strokeStyle = '#b88a3c'; x.lineWidth = .9; x.beginPath(); x.moveTo(-L + 4, -r); x.lineTo(-L + 4, r); x.moveTo(L - 6, -r); x.lineTo(L - 6, r); x.stroke();
    x.restore();
  }
  function envoyFigure(x, u, cam, e, hPx, t) {
    const lev = u.lev, tilt = clamp(1 - lev, 0, .6), s = hPx / 92;
    const v = cam.at(e.at[0] + Math.cos(e.face) * 3, e.at[1] + Math.sin(e.face) * 3, u.h);
    const yaw = v && v[0] < u.x ? PI : 0;
    const pose = { ...e.pose, yaw };
    pose.arms = [pose.arms[0], [.18, .95, -.2]];
    const carry = t < T_UR0, fall = t - T_SCROLL, fwd = Math.cos(yaw);
    const draw = (L, dx, dy) => {
      x.save(); x.translate(u.x + dx, u.y + dy); x.scale(s, s * e.rise);
      Q.draw(x, PA.P, pose, L, { tilt, robe: 40, shadow: 0, behind: carry ? (xx, pj) => rollUnderArm(xx, pj, false, fall, fwd) : null, over: carry ? (xx, pj) => rollUnderArm(xx, pj, true, fall, fwd) : null });
      x.restore();
    };
    x.save(); x.globalAlpha *= e.a;
    if (hPx > 26) draw(ENV_RIM, -1.4, -1.1);
    draw(ENV, 0, 0);
    x.restore();
  }

  const S0 = [JKS[0] - 1.6, JKS[1] - .55], S1 = [XY[0] + 1.9, XY[1] + 1.3];
  const SD = [S1[0] - S0[0], S1[1] - S0[1]], SL = Math.hypot(SD[0], SD[1]), SU = [SD[0] / SL, SD[1] / SL], SV = [-SU[1], SU[0]], SW2 = 1.5;
  const T_DROP = .22, T_UR0 = T_SCROLL + T_DROP, T_UR1 = T_DAGGER - .12;
  const unroll = t => { const u = clamp((t - T_UR0) / (T_UR1 - T_UR0)); return 1 - Math.pow(1 - u, 2.2); };
  const onMap = (m, h) => [m[0], h, -m[1]];
  const sAt = (a, b, h) => onMap([S0[0] + SU[0] * a + SV[0] * b, S0[1] + SU[1] * a + SV[1] * b], h);
  const DUK = (() => {
    const R = F.rng(53), fields = [], hills = [];
    for (let i = 0; i < 26; i++) fields.push([R() * SL, (R() - .5) * 2 * SW2 * .8, .25 + .35 * R(), .15 + .2 * R(), R()]);
    for (let i = 0; i < 9; i++) hills.push([R() * SL, (R() - .5) * 2 * SW2 * .75, .18 + .12 * R()]);
    return { fields, hills };
  })();
  function paintScroll(xx, uMax) {
    xx.save(); xx.beginPath(); xx.rect(0, -SW2, uMax, 2 * SW2); xx.clip();
    xx.fillStyle = '#efe4c6'; xx.fillRect(0, -SW2, SL, 2 * SW2);
    for (const [a, b, rw, rh, c] of DUK.fields) { xx.fillStyle = c < .5 ? 'rgba(126,154,96,.55)' : 'rgba(198,170,96,.5)'; xx.fillRect(a - rw, b - rh, 2 * rw, 2 * rh); }
    xx.strokeStyle = 'rgba(70,110,140,.85)'; xx.lineWidth = .09; xx.lineCap = 'round'; xx.beginPath();
    for (let a = 0; a <= SL; a += .1) { const b = .35 * Math.sin(a * 1.3) - .2; if (a === 0) xx.moveTo(a, b); else xx.lineTo(a, b); }
    xx.stroke();
    xx.strokeStyle = 'rgba(40,36,30,.75)'; xx.lineWidth = .05; xx.beginPath();
    for (const [a, b, r] of DUK.hills) { xx.moveTo(a - r, b + r * .6); xx.lineTo(a, b - r * .5); xx.lineTo(a + r, b + r * .6); }
    xx.stroke();
    xx.strokeStyle = '#7e2f24'; xx.lineWidth = .07; xx.strokeRect(.12, -SW2 + .12, SL - .24, 2 * SW2 - .24);
    xx.restore();
  }
  const DG = { a0: SL - 2.65, a1: SL - .55 };
  function daggerOnScroll(xx) {
    const { a0, a1 } = DG, hl = .62;
    xx.fillStyle = '#2a211c'; xx.fillRect(a0, -.11, hl, .22);
    xx.fillStyle = '#8a6a2c'; xx.fillRect(a0 + hl, -.26, .12, .52);
    xx.fillStyle = '#c9ccd2'; xx.beginPath(); xx.moveTo(a0 + hl + .12, -.15); xx.lineTo(a1 - .35, -.11); xx.lineTo(a1, 0); xx.lineTo(a1 - .35, .11); xx.lineTo(a0 + hl + .12, .15); xx.closePath(); xx.fill();
    xx.fillStyle = '#eef0f4'; xx.beginPath(); xx.moveTo(a0 + hl + .12, -.03); xx.lineTo(a1 - .1, -.01); xx.lineTo(a1 - .1, .01); xx.lineTo(a0 + hl + .12, .03); xx.closePath(); xx.fill();
  }
  function scroll(x, cam, t) {
    if (t < T_UR0) return;
    const h = hC + hGold(t) + .04, u = unroll(t), uMax = Math.max(.05, u * SL), N = 6;
    for (let i = 0; i < N; i++) {
      const a0 = SL * i / N, a1 = SL * (i + 1) / N; if (a0 > uMax) break;
      S3.onPlane(x, cam, sAt(a0, -SW2, h), [SU[0] * (a1 - a0), 0, -SU[1] * (a1 - a0)], [SV[0] * 2 * SW2, 0, -SV[1] * 2 * SW2], xx => {
        xx.save(); xx.scale(1 / (a1 - a0), 1 / (2 * SW2)); xx.translate(-a0, SW2);
        xx.beginPath(); xx.rect(a0 - .01, -SW2, a1 - a0 + .02, 2 * SW2); xx.clip();
        paintScroll(xx, uMax); if (uMax > DG.a1 - .1) daggerOnScroll(xx);
        xx.restore();
      });
    }
    const r = lerp(.42, .14, u), hc = h + r;
    S3.bar(x, cam, sAt(uMax, -SW2 - .15, hc), sAt(uMax, SW2 + .15, hc), r, { col: u < 1 ? '#d8c9a2' : '#5a3a22', cap: u < 1 ? '#efe4c6' : '#3a2416', n: 12, phase: -uMax / r });
  }
  const tipAt = t => sAt(DG.a1, 0, hC + hGold(t) + .06);

  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  let SPLM = null;
  function splMap() {
    if (SPLM) return SPLM;
    const [sx, sy, sz, sp, sw, sl] = A10().spl(), T10 = A10().DUR;
    const at10 = d => [d, sx(T10 + d), sy(T10 + d), Math.exp(sz(T10 + d)), sp(T10 + d), sw(T10 + d), sl(T10 + d)];
    const XE = P(114.2, 35.9), MID = QM.along(TRACK, TRACK.L * .5), tip = [S0[0] + SU[0] * DG.a1, S0[1] + SU[1] * DG.a1];
    const sc = [S0[0] + SU[0] * SL * .45, S0[1] + SU[1] * SL * .45], top = hC + hG;
    const K2 = [at10(-.6), at10(0), at10(.25),
      [T_BEF + .6, XE[0] - 20, XE[1] + 6, 1.55, 58, 4, hC + 60],
      [T_COMP + .3, XE[0] + 6, XE[1] - 10, 1.6, 56, 8, hC + 46],
      [T_ENVOY + .2, JI[0] - 14, JI[1] + 12, 3.6, 48, 6, hC + 42],
      [T_ARR, JI[0] - 6, JI[1] + 5, 5.0, 46, 2, hC + 42],
      [T_TR0 + .5, MID[0], MID[1], 3.0, 46, -6, top],
      [T_TR1 + .15, AP[0] - 3, AP[1] - 1.5, 9, 34, -16, top],
      [T_MAP, XY[0] + 7, XY[1] + 2.5, 15, 30, -24, top],
      [T_SCROLL + .1, sc[0] + 1.2, sc[1] + .4, 26, 32, -30, top],
      [T_DAGGER, tip[0] + 1.2, tip[1] + .2, 34, 31, -33, top],
      [T_APP + .3, tip[0] + .3, tip[1], 40, 30, -35, top],
      [T_X, tip[0], tip[1], 130, 28, -36, top],
      [T_X + 1, tip[0], tip[1], 200, 28, -36, top]];
    const ts = K2.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K2[j][3]) : K2[j][i]]));
    return (SPLM = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camMap(t) {
    if (t <= 0) return A10().camAt(A10().DUR);
    const [sx, sy, sz, sp, sw, sl] = splMap(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  function blocks(t, cam) {
    const list = [], done = [], hg = hGold(t);
    const edge = (x, h, k) => { x.save(); x.lineJoin = 'round'; x.strokeStyle = 'rgba(27,33,48,.85)'; x.lineWidth = 2.4; x.beginPath(); QM.ring(x, cam, k.ring, h); x.stroke(); x.restore(); };
    for (const k of K) {
      const R = goldR(k.id, t);
      if (R >= RMAX[k.id] - 1e-6) { done.push(k.ring); continue; }
      list.push({ rings: [k.ring], h: hK * (1 + kingRise(k.id, t)), col: k.col, n: 8, onTop: (x, h) => edge(x, h, k) });
      if (R > 0) list.push({ rings: [k.ring], clips: [[QM.disk(k.cap[0], k.cap[1], R)]], h: hg, col: QM.GOLD, n: 9 });
    }
    if (done.length) list.push({ rings: done, h: hg, col: QM.GOLD, n: 10 });
    return list;
  }
  function track(x, cam, t) {
    const s1 = trackS(t), a = ss(T_TR0, T_TR0 + .1, t) * (1 - ss(T_MAP, T_MAP + .6, t)); if (s1 <= 0 || a <= 0) return;
    x.save(); x.fillStyle = `rgba(27,26,34,${.85 * a})`;
    for (let s = 2; s < s1; s += 5) {
      const [px, py] = QM.along(TRACK, s), p = cam.at(px, py, hC + groundH(px, py, t) + .1); if (!p) continue;
      const r = Math.max(1.2, .55 * p[3]); x.beginPath(); x.ellipse(p[0], p[1], r, r * .6, 0, 0, TAU); x.fill();
    }
    x.restore();
  }
  function mapLayer(x, t, cam) {
    x.lineCap = 'butt'; x.lineJoin = 'miter'; x.setLineDash([]);
    QM.land(x, cam, FL.P, hC, { n: 10 });
    QM.blocks(x, cam, hC, blocks(t, cam));
    track(x, cam, t);
    scroll(x, cam, t);
  }
  function uprights(ctx, t, cam) {
    const L = [], m = mag(cam);
    const put = (mx, my, h, draw) => { const u = QM.up(cam, mx, my, h); if (u && u.d > 2) { u.h = h; L.push({ d: u.d, u, draw }); } };
    for (const id of BACK) {
      const k = QM.byId[id], a = ss(.55, .95, backU(id, t)) * (1 - ss(T_SCROLL, T_SCROLL + .6, t)); if (a <= 0) continue;
      put(k.cap[0], k.cap[1], hC + groundH(k.cap[0], k.cap[1], t), (x, u) => {
        const r = 4 + 1.2 * m, f = .35 + .65 * (1 - u.lev);
        x.fillStyle = `rgba(27,33,48,${a})`; x.beginPath(); x.ellipse(u.x, u.y, r + 1.6, (r + 1.6) * f, 0, 0, TAU); x.fill();
        x.fillStyle = `rgba(255,241,208,${a})`; x.beginPath(); x.ellipse(u.x, u.y, r, r * f, 0, 0, TAU); x.fill();
      });
    }
    put(XY[0], XY[1], hC + groundH(XY[0], XY[1], t), (x, u) => {
      const S = THRONE_H * u.k * magT(cam) * (.45 + .55 * u.lev) * throneSize(t) / 59;
      QM.throne(x, u.x, u.y, S, { deep: 3 + 8 * (1 - u.lev), side: 3 });
    });
    const e = envoyAt(t);
    if (e.a > 0) put(e.at[0], e.at[1], hC + groundH(e.at[0], e.at[1], t), (x, u) => envoyFigure(x, u, cam, e, 9 * u.k * m * (.5 + .5 * u.lev), t));
    L.sort((a, b) => b.d - a.d);
    FL.sheet(ctx, ID, 1, RC, x => { for (const o of L) o.draw(x, o.u); }, { flatShadow: [3, 5, 4, .45] });
  }
  function glows(ctx, t, cam) {
    const sh = SH(), u = QM.up(cam, XY[0], XY[1], hC + groundH(XY[0], XY[1], t) + 8);
    if (u && u.d > 2) PR.glow(ctx, u.x - sh.x, u.y - sh.y, 60 * Math.min(2.2, u.k * magT(cam) / 3), '#ffd08a', .3, 'flat');
    const g = glint(t); if (g <= 0) return;
    const p = cam.proj(tipAt(t)); if (!p) return;
    star(ctx, p[0] - sh.x, p[1] - sh.y, g, t);
  }
  let MG = null;
  const mapGlint = () => MG || (MG = (() => { const p = camMap(T_X).proj(tipAt(T_X)); return p ? [p[0], p[1]] : [W / 2, H / 2]; })());
  const glint = t => ss(T_APP - .05, T_APP + .12, t) * (.75 + .25 * Math.cos((t - T_APP) * 7)) + 2.2 * ss(T_X - .9, T_X, t);
  function star(ctx, x, y, g, t) {
    PR.glow(ctx, x, y, 40 + 120 * g, '#fff2d0', Math.min(1, .55 * g), 'flat');
    PR.glow(ctx, x, y, 10 + 30 * g, '#ffffff', Math.min(1, .9 * g), 'flat');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(.3 + .15 * t);
    for (const [L, wd] of [[70 + 260 * g, 3.2], [40 + 140 * g, 2]]) {
      for (let i = 0; i < 4; i++) {
        ctx.rotate(PI / 2); const gr = ctx.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, `rgba(255,250,235,${Math.min(1, .9 * g)})`); gr.addColorStop(1, 'rgba(255,250,235,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, -wd); ctx.lineTo(L, 0); ctx.lineTo(0, wd); ctx.closePath(); ctx.fill();
      }
      ctx.rotate(PI / 4);
    }
    ctx.restore();
  }
  function tags(ctx, t, cam) {
    const size = M45 ? 30 : 32, a = ss(T_JING - .05, T_JING + .25, t) * (1 - ss(T_SCROLL - .6, T_SCROLL - .2, t)); if (a <= 0) return;
    let at;
    if (t > T_TR0 && t < T_IN + .2) { const q = QM.along(TRACK, trackS(t)); at = [q[0], q[1]]; } else at = envoyAt(t).at;
    const h = hC + groundH(at[0], at[1], t), u = QM.up(cam, at[0], at[1], h); if (!u) return;
    const fh = 9 * u.k * mag(cam) * (.5 + .5 * u.lev);
    FL.sheet(ctx, ID, 1, RC, x => QM.tag(x, u.x, u.y - fh - 4, 'JING KE', { alpha: a, size, stem: 24 }), { shadow: false });
  }
  function mapFrame(ctx, t) {
    const cam = camMap(t);
    FL.background(ctx);
    FL.sheet(ctx, ID, 1, RC, x => mapLayer(x, t, cam), { flatShadow: [10, 14, 12, .4] });
    uprights(ctx, t, cam);
    glows(ctx, t, cam);
    tags(ctx, t, cam);
    F.impact(FL, ctx, t, { lines: [{ text: '227 BC', t0: T_227, size: M45 ? 96 : 120, color: '#f5ecd8' }], x: .5, y: M45 ? .14 : .16, out: T_ENVOY - .1, accent: '#d9a443' });
  }

  const KH = { floor: '#d6cbb0', floorLine: '#bfb18f', wall: '#7e2f24', wallGold: '#c8973f', pillar: '#5a2a22', gold: '#c8973f', stone: '#d9cfb6', stoneTop: '#e6dcc4',
    lacquer: '#2e2427', lacquerRed: '#7e2f24', ceiling: '#3a2622', window: '#f6ead0', lattice: '#6a3a2c', court: '#ece0c4', courtLine: '#d8c9a6', sky: '#f6eedb', outer: '#a24e38', roof: '#3a2a26' };
  const PILLARS = []; for (const X of [-3.7, 3.7, -7.4, 7.4]) for (const Z of [-3.6, .6, 4.8, 9.0, 13.2]) PILLARS.push([X, Z]);
  const PC = [-3.7, 4.8], PRR = .33, RR = 1.2;
  const TIERS = [{ h: .3, x: 3.0, zf: 1.6 }, { h: .6, x: 2.2, zf: 1.0 }, { h: .9, x: 1.5, zf: .4 }];
  const DOOR = { x0: -2.6, x1: 2.6, y1: 4.6, z: 16 };
  const FLENS_H = M45 ? 1180 : 1500;

  const R_FREEZE = .02, R_SLOW = .3, TS0 = T_MOST - .35, TS1 = T_MOST + .45, TAU_F = 2.4;
  const SINT = u => u * u * u - u * u * u * u / 2;
  function tau(t) {
    const d = t - T_X, u = clamp((t - TS0) / (TS1 - TS0));
    const ramp = t <= TS0 ? 0 : t >= TS1 ? (TS1 - TS0) * .5 + (t - TS1) : (TS1 - TS0) * SINT(u);
    return TAU_F + R_FREEZE * d + (R_SLOW - R_FREEZE) * ramp;
  }
  const tAt = tt => { let a = T_X, b = DUR + 2; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (tau(m) < tt) a = m; else b = m; } return (a + b) / 2; };
  const RSTYLE = { step: 64, lift: 22, lean: .3, bob: 3.4, arms: .4 };
  const RUNK = Mo.gait({ from: 0, to: 6000, t0: 0, gait: 'run', style: RSTYLE }), RUNA = Mo.gait({ from: 0, to: 6000, t0: .18, gait: 'run', style: RSTYLE });
  const TH_K0 = 82 * D2R, TH_A0 = 10 * D2R;
  function runner(G, th0, t) {
    const tp = Mo.pose(t), tt = tau(tp), th = th0 + (G.x(tt) - G.x(TAU_F)) * FIG / RR;
    const thc = th0 + (G.x(tau(t)) - G.x(TAU_F)) * FIG / RR;
    return { at: [PC[0] + RR * Math.cos(thc), 0, PC[1] + RR * Math.sin(thc)], face: Math.atan2(Math.cos(th), -Math.sin(th)), pose: centre(G(tt), G.x(tt)), th: thc };
  }
  const SHOWRUN = t => t < T_HE - .45;
  const KING = Q.silhouette('emperor', INK, '#4a4038'), KING_RIM = Q.silhouette('emperor', RIM, RIM), ENV_H = Q.silhouette('minister', INK);

  let TIP = null;
  function daggerFist(x, pj) {
    const a = pj.arms[1], d = [a.wr[0] - a.el[0], a.wr[1] - a.el[1]], L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    const at = (k, s = 0) => [a.wr[0] + u[0] * k + n[0] * s, a.wr[1] + u[1] * k + n[1] * s], e = Q.SLEEVE_EXT;
    const poly = (pts, c) => { x.fillStyle = c; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); };
    poly([at(e - 1, -1.1), at(e + 2, -1.1), at(e + 2, 1.1), at(e - 1, 1.1)], INK);
    poly([at(e + 2, -2.6), at(e + 3.2, -2.6), at(e + 3.2, 2.6), at(e + 2, 2.6)], INK);
    poly([at(e + 3.2, -1.3), at(e + 17, -.4), at(e + 19, 0), at(e + 17, .4), at(e + 3.2, 1.3)], '#2c2c34');
    x.strokeStyle = '#e8ecf2'; x.lineWidth = .7; x.beginPath(); const p0 = at(e + 3.6, -.6), p1 = at(e + 18.4, -.1); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke();
    const m = x.getTransform(), q = at(e + 18.6, 0); TIP = [m.a * q[0] + m.c * q[1] + m.e, m.b * q[0] + m.d * q[1] + m.f];
  }
  function drawRunner(x, cam, who, r, t) {
    const fa = S3.figureAt(cam, r.at, r.face); if (!fa || fa.depth < .5) return;
    const ch = [r.at[0], 1.1, r.at[2]], hd = Math.hypot(cam.pos[0] - ch[0], cam.pos[2] - ch[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - ch[1], hd)), 0, .7);
    const pose = { ...r.pose, yaw: fa.yaw }, king = who === 'king';
    if (king) pose.swing = Math.sin(r.th * 3.1) * .9;
    else pose.arms = [pose.arms[0], [.72, 1.42]];
    const o = king ? { crown: true, beard: true, robe: 40, tilt, shadow: .25 } : { robe: 40, tilt, shadow: .25, over: (xx, pj) => { if (pj.arms[1].near) daggerFist(xx, pj); }, behind: (xx, pj) => { if (!pj.arms[1].near) daggerFist(xx, pj); } };
    x.save(); x.translate(fa.sx - 1.6, fa.sy - 1.2); x.scale(fa.s, fa.s); Q.draw(x, PA.P, pose, king ? KING_RIM : ENV_RIM, { ...o, over: null, behind: null, shadow: 0 }); x.restore();
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, PA.P, pose, king ? KING : ENV_H, o); x.restore();
  }

  const COURT = []; for (const sx of [-1, 1]) for (const Z of [.5, 2.6, 4.7, 6.8, 8.9, 11.0]) COURT.push({ at: [sx * 9.45, 0, Z], face: sx < 0 ? 0 : PI, head: .04 * Math.sin(Z * 3.1) });
  const COURT_POSE = { ...Q.bowStand({ bow: .05 }), arms: [[.06, .16, -.12], [.08, .2, -.12]] }, COURT_INK = Q.silhouette('minister', '#231c1e');
  function courtier(x, cam, c) {
    const fa = S3.figureAt(cam, c.at, c.face); if (!fa || fa.depth < 1) return;
    const ch = [c.at[0], 1.1, c.at[2]], hd = Math.hypot(cam.pos[0] - ch[0], cam.pos[2] - ch[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - ch[1], hd)), 0, .7);
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, PA.P, { ...COURT_POSE, head: COURT_POSE.head + c.head, yaw: fa.yaw }, COURT_INK, { robe: 44, tilt, shadow: .2 }); x.restore();
  }

  const GUARDS = []; for (let i = 0; i < 7; i++) GUARDS.push({ at: [-4.5 + 1.5 * i, 0, 23 + .25 * Math.sin(i * 2.3)], i });
  const GUARD_POSE = (() => { const p = Mo.stand(0); return { ...p, arms: [[.1, .2], [.12, .25]] }; })(), GUARD_INK = Q.silhouette('worker', '#2a2224');
  function guard(x, cam, g) {
    const fa = S3.figureAt(cam, g.at, -PI / 2); if (!fa || fa.depth < 1) return;
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, PA.P, { ...GUARD_POSE, yaw: fa.yaw }, GUARD_INK, { tilt: .05, shadow: .25, cover: false }); x.restore();
    const a = [g.at[0] + .32, 0, g.at[2] + .05], b = [g.at[0] + .32, 2.55, g.at[2] + .05], tip = [g.at[0] + .32, 2.85, g.at[2] + .05];
    x.strokeStyle = '#2a2224'; x.lineWidth = Math.max(1, .035 * fa.s / FIG); x.lineCap = 'round'; x.beginPath(); S3.line(x, cam, a, b); x.stroke(); x.lineCap = 'butt';
    const pb = cam.proj(b), pt = cam.proj(tip); if (!pb || !pt) return;
    const wd = .06 * pb[3]; x.fillStyle = '#3a3a44'; x.beginPath(); x.moveTo(pb[0] - wd, pb[1]); x.lineTo(pt[0], pt[1]); x.lineTo(pb[0] + wd, pb[1]); x.closePath(); x.fill();
  }

  function outside(x, cam) {
    x.fillStyle = KH.sky; x.fillRect(-W, -H, 3 * W, 3 * H);
    x.fillStyle = KH.court; S3.poly(x, cam, [[-40, 0, 16], [40, 0, 16], [40, 0, 60], [-40, 0, 60]]) && x.fill();
    x.strokeStyle = KH.courtLine; x.lineWidth = 1; x.beginPath(); for (let z = 17.2; z < 46; z += 1.6) S3.line(x, cam, [-40, 0, z], [40, 0, z]); x.stroke();
    S3.box(x, cam, { x0: -40, x1: 40, y0: 0, y1: 3.6, z0: 46, z1: 46.6 }, { col: KH.outer });
    S3.box(x, cam, { x0: -40, x1: 40, y0: 3.6, y1: 4.1, z0: 45.6, z1: 47 }, { col: KH.roof });
  }
  function frontWall(x, cam) {
    const o = { col: KH.wall };
    S3.box(x, cam, { x0: -11, x1: DOOR.x0, y0: 0, y1: 7.2, z0: DOOR.z, z1: DOOR.z + .4 }, o);
    S3.box(x, cam, { x0: DOOR.x1, x1: 11, y0: 0, y1: 7.2, z0: DOOR.z, z1: DOOR.z + .4 }, o);
    S3.box(x, cam, { x0: DOOR.x0, x1: DOOR.x1, y0: DOOR.y1, y1: 7.2, z0: DOOR.z, z1: DOOR.z + .4 }, o);
    x.strokeStyle = KH.wallGold; x.lineWidth = 2; x.beginPath(); S3.line(x, cam, [DOOR.x0, DOOR.y1, DOOR.z], [DOOR.x1, DOOR.y1, DOOR.z]); S3.line(x, cam, [DOOR.x0, 0, DOOR.z], [DOOR.x0, DOOR.y1, DOOR.z]); S3.line(x, cam, [DOOR.x1, 0, DOOR.z], [DOOR.x1, DOOR.y1, DOOR.z]); x.stroke();
  }
  function walls(x, cam) {
    S3.box(x, cam, { x0: -11, x1: 11, y0: 0, y1: 7.2, z0: -6.4, z1: -6 }, { col: KH.wall });
    x.strokeStyle = KH.wallGold; x.lineWidth = 2; x.beginPath();
    for (let X = -9; X <= 9; X += 3) S3.line(x, cam, [X, .5, -6], [X, 6.6, -6]);
    S3.line(x, cam, [-11, 6.6, -6], [11, 6.6, -6]); S3.line(x, cam, [-11, .5, -6], [11, .5, -6]);
    x.stroke();
    for (const sx of [-1, 1]) {
      if (!S3.facing(cam, [sx * 11, 3, 0], [-sx, 0, 0])) continue;
      S3.box(x, cam, { x0: sx > 0 ? 11 : -11.4, x1: sx > 0 ? 11.4 : -11, y0: 0, y1: 7.2, z0: -6.4, z1: 16.4 }, { col: KH.wall });
      for (let z0 = -5.4; z0 < 15; z0 += 3.4) {
        const X = sx * 10.99, pts = [[X, .9, z0], [X, .9, z0 + 2.6], [X, 6.0, z0 + 2.6], [X, 6.0, z0]];
        if (!S3.poly(x, cam, pts)) continue; x.fillStyle = KH.window; x.fill();
        x.strokeStyle = KH.lattice; x.lineWidth = 1.4; x.beginPath();
        for (let k = 1; k < 6; k++) S3.line(x, cam, [X, .9, z0 + 2.6 * k / 6], [X, 6.0, z0 + 2.6 * k / 6]);
        for (let k = 1; k < 10; k++) S3.line(x, cam, [X, .9 + 5.1 * k / 10, z0], [X, .9 + 5.1 * k / 10, z0 + 2.6]);
        x.stroke();
      }
    }
    x.fillStyle = KH.ceiling; S3.poly(x, cam, [[-11, 7.2, -6.4], [11, 7.2, -6.4], [11, 7.2, 16.4], [-11, 7.2, 16.4]]) && x.fill();
    for (let z = -4.5; z < 16; z += 4) S3.box(x, cam, { x0: -11, x1: 11, y0: 6.9, y1: 7.2, z0: z - .2, z1: z + .2 }, { col: KH.pillar });
  }
  function floor(x, cam) {
    x.fillStyle = KH.floor; S3.poly(x, cam, [[-11, 0, -6], [11, 0, -6], [11, 0, 16], [-11, 0, 16]]) && x.fill();
    x.strokeStyle = KH.floorLine; x.lineWidth = 1; x.beginPath();
    for (let z = -6; z <= 16; z += 1.1) S3.line(x, cam, [-11, 0, z], [11, 0, z]);
    for (let X = -11; X <= 11; X += 1.1) S3.line(x, cam, [X, 0, -6], [X, 0, 16]);
    x.stroke();
    x.fillStyle = KH.lacquerRed; S3.poly(x, cam, [[-.9, .004, 1.6], [.9, .004, 1.6], [.9, .004, 16], [-.9, .004, 16]]) && x.fill();
    const L = 2.6, k = L / SL, o = [-.5, .008, 2.0];
    for (let i = 0; i < 4; i++) {
      const a0 = SL * i / 4, a1 = SL * (i + 1) / 4, c0 = [o[0], o[1], o[2] + L - a0 * k], c1 = [o[0] + 2 * SW2 * k, o[1], o[2] + L - a1 * k];
      if (Math.min(cam.depth(c0), cam.depth(c1), cam.depth([c0[0], 0, c1[2]]), cam.depth([c1[0], 0, c0[2]])) < 1.2) continue;
      S3.onPlane(x, cam, [o[0] + 2 * SW2 * k, o[1], o[2] + L - a0 * k], [0, 0, -(a1 - a0) * k], [-2 * SW2 * k, 0, 0], xx => {
        xx.save(); xx.scale(1 / (a1 - a0), 1 / (2 * SW2)); xx.translate(-a0, SW2);
        xx.beginPath(); xx.rect(a0 - .01, -SW2, a1 - a0 + .02, 2 * SW2); xx.clip(); paintScroll(xx, SL); xx.restore();
      });
    }
    S3.bar(x, cam, [o[0] - .05, .03, o[2]], [o[0] + 2 * SW2 * k + .05, .03, o[2]], .03, { col: '#5a3a22', cap: '#3a2416', n: 8 });
  }
  function pillar(x, cam, [X, Z]) {
    S3.box(x, cam, { x0: X - .5, x1: X + .5, y0: 0, y1: .3, z0: Z - .5, z1: Z + .5 }, { col: KH.stone });
    S3.cyl(x, cam, [X, Z], PRR, .3, 6.9, { col: KH.pillar, cap: false, lo: .35 });
    for (const y of [.55, 6.4, 6.6]) S3.ring(x, cam, [X, Z], PRR + .015, y, y + .08, KH.gold);
  }
  function dais(x, cam) {
    let y0 = 0;
    for (const T of TIERS) { S3.box(x, cam, { x0: -T.x, x1: T.x, y0, y1: T.h, z0: -4.2, z1: T.zf }, { col: KH.stone, top: KH.stoneTop, skip: ['0,-1,0'] }); y0 = T.h; }
    x.strokeStyle = KH.gold; x.lineWidth = 1.5; x.beginPath(); for (const T of TIERS) S3.line(x, cam, [-T.x, T.h, T.zf], [T.x, T.h, T.zf]); x.stroke();
    S3.box(x, cam, { x0: -.85, x1: .85, y0: .9, y1: 1.05, z0: -1.6, z1: -.35 }, { col: KH.lacquer, top: S3.mix(KH.lacquer, KH.lacquerRed, .3) });
    S3.box(x, cam, { x0: -.85, x1: .85, y0: 1.05, y1: 1.55, z0: -1.6, z1: -1.5 }, { col: KH.lacquer });
    for (const sx of [-1, 1]) S3.box(x, cam, { x0: sx * .85 - .05, x1: sx * .85 + .05, y0: 1.05, y1: 1.32, z0: -1.6, z1: -.8 }, { col: KH.lacquer });
    S3.box(x, cam, { x0: -2.8, x1: 2.8, y0: .9, y1: 5.05, z0: -2.1, z1: -2.0 }, { col: KH.lacquer, south: '#3b2420' });
    x.strokeStyle = KH.gold; x.lineWidth = 2; x.beginPath(); S3.line(x, cam, [-2.6, 1.25, -1.99], [2.6, 1.25, -1.99]); S3.line(x, cam, [-2.6, 4.9, -1.99], [2.6, 4.9, -1.99]); x.stroke();
  }

  const SLV0 = [PC[0] + RR * 1.05 * Math.cos((TH_A0 + TH_K0) / 2 + .2), 1.25, PC[1] + RR * 1.05 * Math.sin((TH_A0 + TH_K0) / 2 + .2)];
  function sleevePiece(x, cam, t) {
    const d = Math.max(0, tau(t) - TAU_F), y = Math.max(.02, SLV0[1] - 1.1 * (1 - Math.exp(-d * 1.3)) - .25 * d), lie = smooth((.25 - y) / .23);
    const p = cam.proj([SLV0[0] + .25 * d, y, SLV0[2] + .1 * d]); if (!p) return;
    const s = p[3] * .2, rot = .5 + 1.4 * d + Math.sin(d * 3) * .3;
    x.save(); x.translate(p[0], p[1]); x.rotate(rot * (1 - lie)); x.scale(s, s * lerp(1, .3, lie));
    x.fillStyle = INK; x.beginPath(); x.moveTo(-1, -.6); x.quadraticCurveTo(0, -.9, 1, -.5); x.lineTo(.8, .1); x.lineTo(1.05, .5); x.lineTo(.4, .45); x.lineTo(.1, .8); x.lineTo(-.3, .4); x.lineTo(-.9, .55); x.closePath(); x.fill();
    x.strokeStyle = '#8f2b20'; x.lineWidth = .16; x.beginPath(); x.moveTo(-1, -.6); x.quadraticCurveTo(0, -.9, 1, -.5); x.stroke();
    x.restore();
  }
  const MOTES = (() => { const r = F.rng(77), out = []; for (let i = 0; i < 90; i++) out.push([-8.5 + 8 * r(), .3 + 3.2 * r(), .5 + 10 * r(), r()]); return out; })();
  function motes(ctx, cam, t) {
    const d = tau(t) - TAU_F, sh = SH();
    for (const [mx, my, mz, k] of MOTES) {
      const q = cam.proj([mx + .05 * d * Math.sin(k * 9), my + .03 * Math.sin(d * .8 + k * 7), mz + .04 * d]); if (!q || q[2] < 1) continue;
      PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.max(1.5, .018 * q[3]), '#fff4dc', .55 * (.4 + .6 * k), 'paper');
    }
  }

  const T_HIT = T_SURV + .06, A_EYE = 123 * D2R;
  const surf = (a, y, out = 0) => [PC[0] + (PRR + out) * Math.cos(a), y, PC[1] + (PRR + out) * Math.sin(a)];
  const A_DAG = A_EYE - 14 * D2R, Y_DAG = 1.66, A_SHD = A_EYE + 13 * D2R;
  function stuck(x, cam, t) {
    if (t < T_HIT - .3) return;
    const hit = surf(A_DAG, Y_DAG), nrm = [Math.cos(A_DAG), 0, Math.sin(A_DAG)], tan = [-Math.sin(A_DAG), 0, Math.cos(A_DAG)];
    const back = [nrm[0] * .78 - tan[0] * .6, .1, nrm[2] * .78 - tan[2] * .6], bl = Math.hypot(...back), b = back.map(v => v / bl);
    const dt = t - T_HIT, fly = dt < 0 ? -dt * 9 : 0;
    const q = dt > 0 ? .1 * Math.exp(-dt * 4.5) * Math.sin(dt * 48) : 0;
    const rot = v => [v[0] * Math.cos(q) - v[2] * Math.sin(q), v[1], v[0] * Math.sin(q) + v[2] * Math.cos(q)];
    const ax = rot(b), at = k => [hit[0] + ax[0] * (k + fly), hit[1] + ax[1] * (k + fly), hit[2] + ax[2] * (k + fly)];
    if (fly > 0) { const p0 = cam.proj(at(0)), p1 = cam.proj(at(.9)); if (p0 && p1) { const g = x.createLinearGradient(p0[0], p0[1], p1[0], p1[1]); g.addColorStop(0, 'rgba(240,236,226,.5)'); g.addColorStop(1, 'rgba(240,236,226,0)'); x.strokeStyle = g; x.lineWidth = 3; x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke(); } }
    const up = [0, 1, 0], side = [ax[1] * up[2] - ax[2] * up[1], ax[2] * up[0] - ax[0] * up[2], ax[0] * up[1] - ax[1] * up[0]];
    const quad = (k0, k1, w0, w1, col) => { const A = at(k0), B = at(k1); const pts = [[A[0] + side[0] * w0, A[1] + w0 * .3, A[2] + side[2] * w0], [B[0] + side[0] * w1, B[1] + w1 * .3, B[2] + side[2] * w1], [B[0] - side[0] * w1, B[1] - w1 * .3, B[2] - side[2] * w1], [A[0] - side[0] * w0, A[1] - w0 * .3, A[2] - side[2] * w0]]; if (S3.poly(x, cam, pts)) { x.fillStyle = col; x.fill(); } };
    quad(fly > 0 ? -.2 : .02, .16, .004, .016, '#c9ccd2');
    quad(.16, .175, .045, .045, '#8a6a2c');
    S3.bar(x, cam, at(.175), at(.3), .013, { col: '#2a211c', n: 8 });
    S3.bar(x, cam, at(.3), at(.315), .02, { col: '#8a6a2c', n: 8 });
    if (dt > 0 && dt < .5) { const p = cam.proj(hit); if (p) { x.fillStyle = `rgba(90,50,30,${.6 * (1 - dt / .5)})`; for (let i = 0; i < 7; i++) { const a = i * .9 + 1, r = (.01 + .06 * dt) * p[3]; x.beginPath(); x.arc(p[0] + Math.cos(a) * r * 1.4, p[1] + Math.sin(a) * r, .006 * p[3], 0, TAU); x.fill(); } } }
  }
  let SHB = null;
  function kingShadow(x, cam, t) {
    const a = ss(T_HE - .5, T_HE - .1, t) * (1 - ss(T_HIT + .7, T_HIT + 1.3, t)); if (a <= 0) return;
    if (!SHB) SHB = F.canvas(400, 400);
    const [cv, y] = SHB; y.setTransform(1, 0, 0, 1, 0, 0); y.clearRect(0, 0, 400, 400);
    const r = runner(RUNK, TH_K0, t), pose = { ...r.pose, yaw: 0, swing: Math.sin(t * 2.2) * .8 };
    y.save(); y.translate(200, 360); y.scale(3.4, 3.4); Q.draw(y, PA.P, pose, Q.silhouette('emperor', '#000000', '#000000'), { crown: true, beard: true, robe: 40, tilt: 0, shadow: 0 }); y.restore();
    const slide = 26 * D2R * ss(T_HIT + .15, T_HIT + 1.2, t), A = A_SHD + slide, o = surf(A, Y_DAG + .42, .002), tn = [-Math.sin(A) * .7, 0, Math.cos(A) * .7];
    S3.onPlane(x, cam, [o[0] - tn[0] / 2, o[1], o[2] - tn[2] / 2], tn, [0, -.7, 0], xx => { xx.globalAlpha *= .42 * a; xx.filter = 'blur(2px)'; xx.drawImage(cv, 0, 0, 1, 1); });
  }

  const KC = (() => {
    const dg = [PC[0] + RR * Math.cos(TH_A0) - .5 * Math.sin(TH_A0), 1.22, PC[1] + RR * Math.sin(TH_A0) + .5 * Math.cos(TH_A0)];
    const am = (TH_A0 + TH_K0) / 2, ey = [dg[0] + 4.4 * Math.cos(am), 1.3, dg[2] + 4.4 * Math.sin(am)];
    const orb = (deg, R, y) => [PC[0] + R * Math.cos(deg * D2R), y, PC[1] + R * Math.sin(deg * D2R)], tc = [PC[0], Y_DAG + .1, PC[1]];
    const ec = surf(A_EYE, Y_DAG + .06, 2.4), ec2 = surf(A_EYE, Y_DAG + .08, 2.15), F2 = FLENS_H * 1.7;
    return [
      [T_X - .3, [ey[0] + .05, 1.28, ey[2] + .05], dg, FLENS_H],
      [T_X, ey, dg, FLENS_H],
      [T_COMIC, [.8, 3.0, 11.6], [-3.2, 1.0, 5.4], FLENS_H],
      [T_MOST - .1, [.4, 4.8, 14.0], [-4.0, .9, 4.8], FLENS_H],
      [T_CIRC + .2, orb(70, 6.6, 3.4), [PC[0], 1.0, PC[1]], FLENS_H],
      [T_PILLAR + .5, orb(25, 6.2, 2.5), [PC[0] - .4, 1.0, PC[1]], FLENS_H],
      [T_FROZEN + .1, orb(-8, 5.6, 1.9), [-8.5, 1.5, 4.4], FLENS_H],
      [T_LAW + .1, [1.4, 1.7, 7.0], [.6, 1.6, 21], FLENS_H],
      [T_WEAP, [.9, 1.65, 9.8], [0, 1.55, 23], FLENS_H],
      [T_PRES + .1, [.7, 1.65, 10.6], [0, 1.55, 23], FLENS_H],
      [T_HE - .05, ec, tc, F2],
      [T_INCH + .2, ec2, tc, F2 * 1.04],
      [DUR + 1, surf(A_EYE, Y_DAG + .1, 1.95), tc, F2 * 1.08],
    ];
  })();
  const SPLH = (() => {
    const ts = KC.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KC[i])]));
    return { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) };
  })();
  function camHall(t) {
    const eye = SPLH.e.map(f => f(t)), tgt = SPLH.g.map(f => f(t)), d = [eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]];
    return S3.camera({ pos: eye, yaw: Math.atan2(-d[0], -d[2]), pitch: Math.atan2(-d[1], Math.hypot(d[0], d[2])), f: Math.exp(SPLH.f(t)), W, H });
  }

  function hallFrame(ctx, t) {
    const cam = camHall(t), id = { x: W / 2, y: H / 2, z: 1 }, R = [W / 2, H / 2], inside = cam.pos[2] < DOOR.z;
    PA.background(ctx);
    TIP = null;
    PA.sheet(ctx, id, 1, R, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter'; x.setLineDash([]);
      outside(x, cam);
      GUARDS.slice().sort((a, b) => cam.depth(b.at) - cam.depth(a.at)).forEach(g => guard(x, cam, g));
      if (inside) frontWall(x, cam);
      walls(x, cam); floor(x, cam);
      const L = [];
      for (const p of PILLARS) L.push({ d: cam.depth([p[0], 3, p[1]]), draw: () => pillar(x, cam, p) });
      L.push({ d: cam.depth([0, .5, -1.5]) + 2.5, draw: () => dais(x, cam) });
      for (const c of COURT) L.push({ d: cam.depth([c.at[0], 1, c.at[2]]), draw: () => courtier(x, cam, c) });
      if (SHOWRUN(t)) {
        const rk = runner(RUNK, TH_K0, t), ra = runner(RUNA, TH_A0, t);
        L.push({ d: cam.depth([rk.at[0], 1, rk.at[2]]), draw: () => drawRunner(x, cam, 'king', rk, t) });
        L.push({ d: cam.depth([ra.at[0], 1, ra.at[2]]), draw: () => drawRunner(x, cam, 'envoy', ra, t) });
        L.push({ d: cam.depth(SLV0) - .01, draw: () => sleevePiece(x, cam, t) });
      }
      L.sort((a, b) => b.d - a.d).forEach(o => o.draw());
      if (t > T_HE - .6) { kingShadow(x, cam, t); stuck(x, cam, t); }
    }, { paperShadow: [3, 4, 4, .18] });
    motes(ctx, cam, t);
    hallGlints(ctx, t, cam);
  }
  function hallGlints(ctx, t, cam) {
    const sh = SH(), g = 2.2 * (1 - ss(T_X, T_X + .7, t));
    if (g > 0 && TIP) { const m = mapGlint(), k = ss(T_X, T_X + .45, t); star(ctx, lerp(m[0], TIP[0], k) - sh.x, lerp(m[1], TIP[1], k) - sh.y, g, t); }
    for (const gd of GUARDS) {
      const a = ss(T_WEAP - .05 + gd.i * .06, T_WEAP + .15 + gd.i * .06, t) * (1 - ss(T_PRES + .3, T_PRES + .9, t)); if (a <= 0) continue;
      const p = cam.proj([gd.at[0] + .32, 2.75, gd.at[2] + .05]); if (!p) continue;
      PR.glow(ctx, p[0] - sh.x, p[1] - sh.y, 26, '#fff6dc', .8 * a, 'paper'); PR.glow(ctx, p[0] - sh.x, p[1] - sh.y, 6, '#ffffff', a, 'paper');
    }
    if (t > T_HIT && t < T_HIT + .5) { const p = cam.proj(surf(A_DAG, Y_DAG)); if (p) PR.glow(ctx, p[0] - sh.x, p[1] - sh.y, 60, '#fff2d6', .6 * (1 - (t - T_HIT) / .5), 'paper'); }
  }

  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function own(ctx, t) {
    if (t < T_X) { mapFrame(ctx, t); FL.grade(ctx, T0() + t); }
    else { hallFrame(ctx, t); PA.grade(ctx, T0() + t); }
    const wa = .6 * Math.exp(-Math.pow((t - T_X) / .16, 2));
    if (wa > .01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,246,226,${wa})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  function draw(ctx, t) {
    const S = S10();
    if (t >= T_FADE1) return own(ctx, t);
    if (t <= 0) return S.draw(ctx, S.duration);
    S.draw(ctx, S.duration + t);
    const b = ss(T_FADE0, T_FADE1, t); if (b <= 0) return;
    const [cv, x] = buf(); clean(x); own(x, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = b; ctx.drawImage(cv, 0, 0); ctx.restore();
  }

  F.scene('seq-11', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .02, type: 'whoosh', f0: 90, f1: 160, dur: 1.1, g: .1 },
      { t: T_227, type: 'impact', size: .35, g: .35, noSnap: true },
      { t: T_RB0 - .1, type: 'riser', dur: T_COMP - T_RB0 + .2, f0: 900, f1: 200, g: .1 },
      ...BACK.map((id, i) => ({ t: T_RB0 + i * RB_STEP + .1, type: 'slide', dur: .8, g: .12 })),
      ...BACK.map((id, i) => ({ t: T_RB0 + i * RB_STEP + RB_DUR * .8, type: 'clunk', f: 80 + 10 * i, g: .1 })),
      { t: T_UP, type: 'tap', g: .22, noSnap: true },
      { t: T_JING, type: 'tick', g: .14 },
      { t: T_TR0, type: 'whoosh', f0: 70, f1: 150, dur: 1.1, g: .1 },
      ...WALKIN.falls.filter(f => !f.close).map(f => ({ t: f.t, type: 'footstep', g: .14 })),
      { t: T_SCROLL + T_DROP, type: 'thud', g: .12 },
      { t: T_UR0, type: 'rustle', dur: T_UR1 - T_UR0 + .2, g: .22 },
      { t: T_DAGGER, type: 'clink', g: .2, noSnap: true },
      { t: T_APP, type: 'shimmer', g: .22 },
      { t: T_X - .7, type: 'riser', dur: .75, f0: 1200, f1: 4200, g: .08 },
      { t: T_X, type: 'whoosh', f0: 220, f1: 60, dur: .9, g: .16 },
      { t: T_X + .05, type: 'hum', dur: T_MOST - T_X, g: .07 },
      { t: T_COMIC, type: 'heartbeat', g: .28 },
      { t: T_MOST - .2, type: 'whoosh', f0: 50, f1: 120, dur: 1.0, g: .1 },
      { t: T_MOST, type: 'lib', dur: T_HE - .4 - T_MOST, label: 'SLOW-MOTION CHASE ROUND A PILLAR: two men running on stone, deep muffled footfalls, robes flapping, heavy breath' },
      ...RUNK.falls.map(f => tAt(f.t)).filter(t => t > T_MOST && t < T_HE - .5).map(t => ({ t, type: 'thud', g: .12 })),
      ...RUNA.falls.map(f => tAt(f.t)).filter(t => t > T_MOST && t < T_HE - .5).map(t => ({ t, type: 'thud', g: .08 })),
      { t: T_FROZEN, type: 'hum', dur: 2.2, g: .06 },
      ...[0, 2, 4, 6].map(i => ({ t: T_WEAP + i * .06, type: 'clink', g: .07, noSnap: true })),
      { t: T_HE - .65, type: 'whoosh', f0: 140, f1: 320, dur: .6, g: .14 },
      { t: T_HIT - .24, type: 'whizz', dur: .28, g: .3 },
      { t: T_HIT, type: 'thud', g: .45, noSnap: true },
      { t: T_HIT, type: 'clunk', f: 150, g: .22, noSnap: true },
      { t: T_HIT + .02, type: 'lib', dur: 1.3, label: 'A KNIFE THROWN INTO WOOD, QUIVERING' },
      { t: T_INCH, type: 'heartbeat', g: .3 },
    ],
    api: { DUR, camHall, tipAt: t => { const c = camHall(t), p = c.proj(surf(A_DAG, Y_DAG)); return p ? [p[0], p[1]] : [W / 2, H / 2]; }, stuck, kingShadow, hallFrame },
  });
})();
