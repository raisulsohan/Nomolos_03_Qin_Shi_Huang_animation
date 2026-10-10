(function () {
  'use strict';
  const F = FILM, PR = F.props, CH = F.china, { clamp, smooth, easeIO, lerp, hash, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-01'), DUR = C.duration;
  const LB = F.look('lightbox', W, H), FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const shift = () => F.SHIFT || { x: 0, y: 0 };

  const T_FLY0 = 3.04, T_FLY1 = 4.67 + .1;
  const T_RISE = 5;
  const T_FALL = 8.27;
  const T_BLEND0 = 10.9 - .15, T_BLEND1 = 11.79 + .15;
  const T_FILL0 = 10.9 + .3, T_FILL1 = 13.05;
  const T_PIN = 13.05;
  const T_PEOPLE0 = 15.56, T_PEOPLE1 = 17.52 + .4;

  const ZM = M45 ? .74 : 1;
  const PORTAL = { x0: -230, x1: 230, y0: -640, y1: 70 }, PCY = (PORTAL.y0 + PORTAL.y1) / 2;
  const P_WALL = .6, P_DAIS = .66, P_PIL = .82, P_NEAR = 1.18;
  const Z1 = 1.32;
  const zH = t => t < T_FLY0 ? lerp(.78, Z1, F.easeOut(t / T_FLY0, 2)) * ZM : Z1 * ZM * Math.pow(15 / (Z1 * ZM), easeIO((t - T_FLY0) / (T_FLY1 - T_FLY0)));
  const camH = t => { const z = zH(t), k = ss(T_FLY0, T_FLY1 - .3, t), a = F.easeOut(clamp(t / T_FLY0), 2); return { x: lerp(-90, 0, a), y: lerp(lerp(-150, -60, a), PCY / P_WALL, k), z }; };
  const hallGone = t => t > T_FLY1 - .05;
  const scr = (cam, p, X, Y) => { const s = Math.pow(cam.z, p), sv = shift(); return [W / 2 + s * (X - p * cam.x) - sv.x * p, H / 2 + s * (Y - p * cam.y) - sv.y * p, s]; };
  const nearAlpha = t => { if (t < T_FLY0) return 1; const h = .02, d = Math.abs(Math.log(zH(t + h)) - Math.log(zH(t - h))) / (2 * h); return 1 - smooth((d - 1) / .8); };

  const EMP = { x: 0, y: 40, s: 1.55 };
  function emperor(x, P, s, t) {
    x.save(); x.scale(s, s);
    const br = .6 * Math.sin(TAU * t / 3.8);
    x.fillStyle = P.ink;
    x.beginPath(); x.moveTo(-34, 0); x.lineTo(-30, -42); x.quadraticCurveTo(-38, -60, -27, -84 + br); x.lineTo(-10, -92 + br); x.lineTo(10, -92 + br);
    x.lineTo(27, -84 + br); x.quadraticCurveTo(38, -60, 30, -42); x.lineTo(34, 0); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(0, -101 + br, 9.5, 11, 0, 0, TAU); x.fill();
    x.save(); x.translate(0, -114 + br); x.rotate(-.04);
    x.fillRect(-23, -3, 46, 4.5); x.fillRect(-4, 0, 8, 6);
    x.fillStyle = F.tone(P.ink, P.rim, .35);
    for (let i = 0; i < 6; i++) { const bx = -20 + i * 3.6; for (let j = 0; j < 5; j++) { x.beginPath(); x.arc(bx, 4.5 + j * 3.4, 1.1, 0, TAU); x.fill(); } }
    x.restore();
    x.fillStyle = F.tone(P.ink, P.sheet, .25); x.fillRect(-26, -46, 52, 5);
    x.restore();
  }
  const quad = (x, a, b, c, d) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.closePath(); x.fill(); };
  function box(x, V, x0, y0, x1, y1, k, front, side, top) {
    const bk = (X, Y) => [X + k * (V[0] - X), Y + k * (V[1] - Y)];
    x.fillStyle = side;
    if (V[0] > x1) quad(x, [x1, y0], [x1, y1], bk(x1, y1), bk(x1, y0));
    if (V[0] < x0) quad(x, [x0, y0], [x0, y1], bk(x0, y1), bk(x0, y0));
    x.fillStyle = top || side;
    if (V[1] < y0) quad(x, [x0, y0], [x1, y0], bk(x1, y0), bk(x0, y0));
    if (V[1] > y1) quad(x, [x0, y1], [x1, y1], bk(x1, y1), bk(x0, y1));
    x.fillStyle = front; x.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  const Vof = (cam, p, o = [0, 0]) => [p * cam.x - o[0], p * cam.y - o[1]];
  function throne(x, P, V) {
    const ink = '#0d0c25', side = '#1d1b45', top = '#2a2758';
    box(x, V, -112, -230, -96, 0, .06, ink, side, top); box(x, V, 96, -230, 112, 0, .06, ink, side, top);
    box(x, V, -124, -244, 124, -226, .06, ink, side, top);
    x.strokeStyle = P.rim; x.lineWidth = 2.5; x.strokeRect(-124, -244, 248, 18);
    box(x, V, -82, -58, 82, 0, .08, ink, side, top); x.strokeRect(-82, -58, 164, 58);
  }
  function dais(x, P, V) {
    for (let i = 0; i < 4; i++) {
      const wv = 260 + i * 90, y = 40 + i * 26;
      box(x, V, -wv, y, wv, y + 26, .05, i % 2 ? P.sheet2 : P.sheetDim, '#141338', F.tone(P.sheetDim, P.sheet, .25));
      x.fillStyle = P.rim; x.globalAlpha = .55; x.fillRect(-wv, y, wv * 2, 2); x.globalAlpha = 1;
    }
  }
  function wall(x, P, V) {
    x.fillStyle = '#0d0c25'; x.fillRect(-1900, -1400, 3800, 1480);
    x.strokeStyle = P.rim; x.globalAlpha = .22; x.lineWidth = 2;
    for (const i of [-5, -3, 3, 5]) x.strokeRect(i * 170 - 120, -980, 240, 900);
    x.globalAlpha = 1;
    x.fillStyle = P.ink; x.fillRect(-1900, 70, 3800, 1600);
    x.strokeStyle = P.sheet2; x.lineWidth = 2;
    for (let i = -14; i <= 14; i++) { x.beginPath(); x.moveTo(i * 22, 70); x.lineTo(i * 260, 1600); x.stroke(); }
    const { x0, x1, y0, y1 } = PORTAL, k = .1, bk = (X, Y) => [X + k * (V[0] - X), Y + k * (V[1] - Y)];
    x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.fillRect(x0, y0, x1 - x0, y1 - y0); x.restore();
    x.fillStyle = '#211b3e';
    if (V[0] > x0) quad(x, [x0, y0], [x0, y1], bk(x0, y1), bk(x0, y0));
    if (V[0] < x1) quad(x, [x1, y0], [x1, y1], bk(x1, y1), bk(x1, y0));
    x.fillStyle = '#17142f'; if (V[1] > y0) quad(x, [x0, y0], [x1, y0], bk(x1, y0), bk(x0, y0));
    x.fillStyle = '#2b2448'; if (V[1] < y1) quad(x, [x0, y1], [x1, y1], bk(x1, y1), bk(x0, y1));
    x.strokeStyle = P.rim; x.lineWidth = 7; x.strokeRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 4);
    box(x, V, x0 - 110, y0 - 90, x1 + 110, y0 - 20, .07, P.sheet2, '#141338', '#1f1d4a');
    x.strokeStyle = P.rim; x.lineWidth = 3; x.strokeRect(x0 - 110, y0 - 90, x1 - x0 + 220, 70);
  }
  function box2(x, V, x0, y0, x1, y1, d0, d1, front, side, top) {
    const at = (X, Y, d) => [X + d * (V[0] - X), Y + d * (V[1] - Y)], f = (X, Y) => at(X, Y, d0), b = (X, Y) => at(X, Y, d1);
    x.fillStyle = side;
    if (V[0] > x1) quad(x, f(x1, y0), f(x1, y1), b(x1, y1), b(x1, y0));
    if (V[0] < x0) quad(x, f(x0, y0), f(x0, y1), b(x0, y1), b(x0, y0));
    x.fillStyle = top || side;
    if (V[1] < y0) quad(x, f(x0, y0), f(x1, y0), b(x1, y0), b(x0, y0));
    if (V[1] > y1) quad(x, f(x0, y1), f(x1, y1), b(x1, y1), b(x0, y1));
    x.fillStyle = front; quad(x, f(x0, y0), f(x1, y0), f(x1, y1), f(x0, y1));
    return f;
  }
  function pillars(x, P, xs, wd, V, foot) {
    for (const px of xs) {
      box2(x, V, px - wd / 2 - 20, foot - 40, px + wd / 2 + 20, foot, 0, .1, P.sheetDim, '#121132', F.tone(P.sheetDim, P.sheet, .3));
      const f = box2(x, V, px - wd / 2, -2400, px + wd / 2, foot - 40, .02, .08, P.sheet2, '#0f0e2c');
      x.fillStyle = P.rim; x.globalAlpha = .5;
      for (const by of [-520, -500, foot - 120, foot - 100]) { const a = f(px - wd / 2 - 4, by), c = f(px + wd / 2 + 4, by + 7); x.fillRect(a[0], a[1], c[0] - a[0], c[1] - a[1]); }
      x.globalAlpha = 1;
    }
  }
  function drawHall(ctx, t) {
    const cam = camH(t), R = [0, 0];
    LB.sheet(ctx, cam, P_WALL, R, x => wall(x, LB.P, Vof(cam, P_WALL)), { glow: .5 });
    LB.sheet(ctx, cam, P_DAIS, R, x => { const V = Vof(cam, P_DAIS); dais(x, LB.P, V); x.save(); x.translate(EMP.x, EMP.y); throne(x, LB.P, Vof(cam, P_DAIS, [EMP.x, EMP.y])); emperor(x, LB.P, EMP.s, t); x.restore(); }, { glow: .75 });
    for (const sx of [-170, 170]) { const [gx, gy, s] = scr(cam, P_DAIS, sx, -150); PR.glow(ctx, gx, gy, 90 * s, '#ffb04a', .55 + .08 * noise1(t * 3, sx), 'lightbox'); }
    LB.sheet(ctx, cam, P_PIL, R, x => pillars(x, LB.P, M45 ? [-420, 420] : [-470, 470], 70, Vof(cam, P_PIL), 300), {});
    const na = nearAlpha(t);
    if (na > .01) LB.sheet(ctx, cam, P_NEAR, R, x => pillars(x, LB.P, M45 ? [-640, 640] : [-900, 900], 130, Vof(cam, P_NEAR), 640), { alpha: na });
  }

  const FS = M45 ? 1250 : 1500;
  const BAN = M45 ? [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3] : [-7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8], BAN_Z = 16, ORDER = [0, 6, 1, 5, 2, 4];
  const POLE = 3.1, FLAG = [.05, .78, 2.95, 1.55];
  const GOLD = [(FLAG[0] + FLAG[1]) / 2, (FLAG[2] + FLAG[3]) / 2];
  const fallAt = i => T_FALL + ORDER.indexOf(i) * .2;
  function camF(t) {
    const a = easeIO((t - T_FLY0) / (T_FLY1 - T_FLY0 + .9));
    let cz = lerp(-80, 3, a) + 2.5 * ss(T_FLY1 + .9, T_BLEND0, t), h = lerp(2.4, 4.2, a) + 1.4 * ss(T_RISE, T_RISE + 1.8, t);
    let hz = lerp(.56, M45 ? .3 : .34, a), cx = 0;
    const b = easeIO((t - (T_BLEND0 - .6)) / (T_BLEND1 - T_BLEND0 + .3));
    if (b > 0) { cz = lerp(cz, BAN_Z - 2.2, b); h = lerp(h, GOLD[1], b); hz = lerp(hz, .5, b); cx = lerp(0, GOLD[0], b); }
    return { cx, cz, h, hz };
  }
  const proj = (c, X, Y, Z) => { const d = Z - c.cz, k = FS / d, sv = shift(); return [W / 2 + (X - c.cx) * k - sv.x, H * c.hz + (c.h - Y) * k - sv.y, k]; };
  let SOLD = null;
  function soldierSprite() {
    if (SOLD) return SOLD;
    const [c, x] = F.canvas(40, 120), P = LB.P;
    x.translate(20, 116); x.fillStyle = P.ink;
    x.fillRect(5, -112, 2.2, 112);
    x.beginPath(); x.moveTo(6.1, -118); x.lineTo(9, -106); x.lineTo(3.2, -106); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-8, 0); x.lineTo(-9, -30); x.lineTo(-11, -58); x.lineTo(-6, -66); x.lineTo(6, -66); x.lineTo(11, -58); x.lineTo(9, -30); x.lineTo(8, 0); x.closePath(); x.fill();
    x.beginPath(); x.arc(0, -74, 7.5, 0, TAU); x.fill(); x.beginPath(); x.arc(2, -83, 3.2, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(7, -48, 3.6, 3.2, 0, 0, TAU); x.fill();
    x.fillStyle = F.tone(P.ink, P.sheet, .35); x.fillRect(-9, -50, 18, 3);
    SOLD = c; return c;
  }
  const SOLDIER_H = 1.75;
  function banner(x, P, i, t, c) {
    const gold = i === 3, tf = fallAt(i), u = gold ? 0 : clamp((t - tf) / .75), dir = BAN[i] < 0 ? -1 : 1;
    const ang = dir * (u < 1 ? 1.45 * u * u : 1.45 - .06 * Math.sin((t - tf - .75) * 14) * Math.exp(-(t - tf - .75) * 6));
    const [bx, by, k] = proj(c, BAN[i], 0, BAN_Z), sw = noise1(t * 1.3, i) * .08;
    x.save(); x.translate(bx, by); x.rotate(ang); x.scale(k, -k);
    x.fillStyle = P.ink; x.fillRect(-.025, 0, .05, POLE);
    x.fillStyle = gold ? '#d9a443' : P.sheet;
    x.beginPath(); x.moveTo(FLAG[0], FLAG[2]); x.lineTo(FLAG[1] + sw, FLAG[2] - .03); x.lineTo(FLAG[1] + sw * 1.3, FLAG[3]); x.lineTo((FLAG[0] + FLAG[1]) / 2 + sw, FLAG[3] + .25); x.lineTo(FLAG[0], FLAG[3]); x.closePath(); x.fill();
    x.restore();
  }
  function field(t, x, P) {
    const c = camF(t), hy = H * c.hz - shift().y;
    x.fillStyle = P.sheet2; x.beginPath(); x.moveTo(-200, hy + 2);
    for (let i = -30; i <= 30; i++) { const [sx, sy] = proj(c, i * 120, 40 + 45 * (noise1(i * .37, 4) + 1), 3000); x.lineTo(sx, sy); }
    x.lineTo(W + 200, hy + 2); x.closePath(); x.fill();
    const gp = x.createLinearGradient(0, hy, 0, H + 200); gp.addColorStop(0, '#3a2c55'); gp.addColorStop(.12, '#262555'); gp.addColorStop(1, '#121233');
    x.fillStyle = gp; x.fillRect(-200, hy, W + 400, H + 400);
    const S = soldierSprite(), half = Z => (W / 2 + 120) * (Z - c.cz) / FS + Math.abs(c.cx);
    for (let Z = 1400; Z >= 92; Z -= Z > 400 ? 12 : 4) {
      if (Z - c.cz < 1) continue;
      const [, y, k] = proj(c, 0, 0, Z), hh = SOLDIER_H * k, hw = half(Z);
      x.fillStyle = '#121231'; x.fillRect(-200, y - hh * .62, W + 400, hh * .62);
      if (k < 1.2) continue;
      x.fillStyle = '#141436';
      for (let X = Math.floor((c.cx - hw) / 1.3); X * 1.3 < c.cx + hw; X++) { const [sx] = proj(c, X * 1.3, 0, Z); x.fillRect(sx, y - hh, Math.max(.6, .07 * k), hh * .4); }
    }
    for (let Z = 90; Z >= BAN_Z + 2; Z -= 2.2) {
      if (Z - c.cz < .9) continue;
      const [, y, k] = proj(c, 0, 0, Z), sc = SOLDIER_H * k / 116, hw = half(Z);
      for (let X = Math.floor((c.cx - hw) / 1.3); X * 1.3 < c.cx + hw; X++) {
        if (((X % 26) + 26) % 26 === 0) continue;
        const [sx] = proj(c, X * 1.3, 0, Z); x.drawImage(S, sx - 20 * sc, y - 116 * sc, 40 * sc, 120 * sc);
      }
    }
    for (let i = 0; i < 7; i++) banner(x, P, i, t, c);
  }
  function fieldLights(ctx, t) {
    const c = camF(t);
    for (let Z = 60; Z >= BAN_Z + 2; Z -= 4.4) for (let i = -30; i <= 30; i++) {
      if (Z - c.cz < 1.5) continue;
      const [sx, sy, k] = proj(c, i * 7.8 + 1.3 * (Math.round(Z) % 3) + .14, 1.7, Z);
      if (sx < -80 || sx > W + 80 || sy > H + 80) continue;
      PR.glow(ctx, sx, sy, Math.max(4, .5 * k), '#ffa040', .55 + .15 * noise1(t * 4 + i, Z), 'lightbox');
    }
    const hy = H * c.hz - shift().y;
    for (let i = -6; i <= 6; i++) PR.glow(ctx, W / 2 + i * 260 - shift().x, hy - 8, 300, '#ff9a3c', .16, 'lightbox');
    PR.glow(ctx, W * .78 - shift().x, hy - 300, 260, '#9fb6ff', .22, 'lightbox');
    const k = ss(fallAt(5) + .5, fallAt(5) + 1.2, t) * (1 - ss(T_BLEND0, T_BLEND1, t));
    if (k > 0) { const [gx, gy, s] = proj(c, GOLD[0], GOLD[1], BAN_Z); PR.glow(ctx, gx, gy, 2.4 * s, '#ffc35a', .55 * k, 'lightbox'); }
  }
  function drawField(ctx, t) {
    LB.sheet(ctx, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => { x.translate(shift().x, shift().y); field(t, x, LB.P); }, { glow: .45, rim: false });
    fieldLights(ctx, t);
  }

  const XY = CH.proj(108.7, 34.35);
  const zMap = t => (M45 ? .58 : .62) * Math.pow(9, 1 - easeIO((t - T_BLEND0) / (T_PIN + .6 - T_BLEND0))) * Math.exp(-.022 * Math.max(0, t - T_TURN - 1.2 * (1 - Math.exp(-Math.max(0, t - T_TURN) / 1.2))));
  const camMap = t => { const k = easeIO((t - T_BLEND0) / (T_PIN + .6 - T_BLEND0)); return { x: lerp(XY[0], 60, k), y: lerp(XY[1], -40, k), z: zMap(t) }; };
  const DOTS = (() => {
    const [, x] = F.canvas(4, 4), r = F.rng(31), out = [], q = new Path2D(), c = new Path2D();
    for (const rg of CH.QIN221) { rg.forEach((p, i) => i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])); q.closePath(); }
    for (const rg of CH.CHINA) { rg.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
    while (out.length < 700) { const px = -500 + r() * 1100, py = -500 + r() * 900; if (x.isPointInPath(q, px, py) && x.isPointInPath(c, px, py)) out.push([px, py, Math.hypot(px - XY[0], py - XY[1]), r()]); }
    return out;
  })();
  const MAXD = Math.max(...DOTS.map(d => d[2]));
  const lean = t => ss(T_FILL0, T_PIN + .9, t);
  function map(x, t, P) {
    const path = rings => { x.beginPath(); CH.path(x, rings); }, N = 14, L = lean(t);
    const hC = 24 * L, k = ss(T_FILL0, T_FILL1 + .2, t), hQ = 64 * L * smooth(k), r = MAXD * 1.05 * Math.pow(k, 1.6);
    x.fillStyle = F.tone(P.sheet2, P.sheet, .16); path(CH.LAND); x.fill();
    for (let i = 0; i <= N; i++) {
      x.save(); x.translate(0, -hC * i / N); x.fillStyle = i < N ? F.tone(P.sheet, P.ink, .5 - .2 * i / N) : P.sheet; path(CH.CHINA); x.fill(); x.restore();
      if (hC < .5 && i === 0) i = N - 1;
    }
    x.save(); x.translate(0, -hC); x.strokeStyle = F.tone(P.sheet, P.ink, .45); x.lineWidth = 2 / x.getTransform().a; path(CH.CHINA); x.stroke(); x.restore();
    if (r > 0) for (let i = 0; i <= N; i++) {
      x.save(); x.translate(0, -hC - hQ * i / N); path(CH.CHINA); x.clip(); path(CH.QIN221); x.clip();
      x.fillStyle = i < N ? F.tone('#d9a443', '#3a2408', .45 - .25 * i / N) : '#d9a443'; x.beginPath(); x.arc(XY[0], XY[1], r, 0, TAU); x.fill(); x.restore();
      if (hQ < .5) { if (i === 0) i = N - 1; }
    }
    const u = ss(T_PEOPLE0, T_PEOPLE1, t);
    if (u > 0) { x.save(); x.translate(0, -hC - hQ); for (const [px, py, d, rr] of DOTS) {
      const a = clamp((u * MAXD * 1.15 - d) / 60); if (a <= 0) continue;
      x.fillStyle = `rgba(255,236,170,${.22 * a})`; x.beginPath(); x.arc(px, py, 6 + 3 * rr, 0, TAU); x.fill();
      x.fillStyle = `rgba(255,250,232,${(.7 + .3 * rr) * a})`; x.beginPath(); x.arc(px, py, 2 + 1.2 * rr, 0, TAU); x.fill();
    } x.restore(); }
    return -hC - hQ;
  }
  const T_TURN = T_PIN - .8, turn = t => { const d = t - T_TURN; return d <= 0 ? 0 : -.05 * (d - .7 * (1 - Math.exp(-d / .7))); };
  const rotAbout = (cam, t, X, Y) => { const a = turn(t), c = Math.cos(a), sn = Math.sin(a), dx = X - cam.x, dy = Y - cam.y; return [cam.x + c * dx - sn * dy, cam.y + sn * dx + c * dy]; };
  function mapFrame(ctx, t, L) {
    const cam = camMap(t);
    L.sheet(ctx, cam, 1, [0, 0], x => { x.translate(cam.x, cam.y); x.rotate(turn(t)); x.translate(-cam.x, -cam.y); TOP = map(x, t, L.P); }, { flatShadow: [10, 14, 12, .4] });
  }
  let TOP = 0;
  function throne3d(ctx, t, th, f) {
    const u = clamp((t - (T_PIN - .35)) / .35); if (t <= T_PIN - .35) return;
    const cam = camMap(t), [X, Y] = rotAbout(cam, t, XY[0], XY[1] + TOP), dx = cam.z * (X - cam.x), dy = cam.z * (Y - cam.y);
    const d = f - dy * Math.sin(th), k = f / d, sx = W / 2 + dx * k, sy = H / 2 + dy * f * Math.cos(th) / d;
    const S = k * (M45 ? 1.9 : 1.7), drop = (1 - u * u) * -160 * k, sq = u >= 1 ? 1 + .12 * Math.exp(-(t - T_PIN) * 9) * Math.cos((t - T_PIN) * 30) : 1;
    const deep = 9 * Math.sin(th) + 2, side = 4 + 10 * Math.sin(-turn(t));
    FL.sheet(ctx, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => {
      x.save(); x.translate(sx, sy + drop); x.scale(S / sq, S * sq);
      const shape = () => {
        x.beginPath();
        x.moveTo(-27, 0); x.lineTo(27, 0); x.lineTo(27, -7); x.lineTo(23, -7); x.lineTo(23, -19);
        x.lineTo(23, -30); x.quadraticCurveTo(26, -34, 22, -36); x.lineTo(16, -32);
        x.lineTo(16, -50); x.quadraticCurveTo(22, -52, 22, -59); x.quadraticCurveTo(14, -57, 0, -55);
        x.quadraticCurveTo(-14, -57, -22, -59); x.quadraticCurveTo(-22, -52, -16, -50);
        x.lineTo(-16, -32); x.lineTo(-22, -36); x.quadraticCurveTo(-26, -34, -23, -30);
        x.lineTo(-23, -19); x.lineTo(-23, -7); x.lineTo(-27, -7); x.closePath();
      };
      const N = 7;
      for (let i = N; i >= 1; i--) { x.save(); x.translate(side * i / N, -deep * i / N); x.fillStyle = F.tone('#9c6d22', '#5a3a10', .4 * (1 - i / N)); shape(); x.fill(); x.restore(); }
      x.fillStyle = '#e8bb5c'; shape(); x.fill();
      x.fillStyle = '#c9963c'; x.fillRect(-12, -48, 24, 26);
      x.fillStyle = '#f7d88a'; x.fillRect(-23, -20, 46, 3); x.fillRect(-27, -8, 54, 2);
      x.strokeStyle = '#5a3a10'; x.lineWidth = 1.1; shape(); x.stroke();
      x.restore();
      if (u >= 1) { const r = (t - T_PIN) * 220 * k, a = Math.max(0, .6 - (t - T_PIN) * .8); x.strokeStyle = `rgba(242,198,106,${a})`; x.lineWidth = 3; x.beginPath(); x.ellipse(sx, sy - 4 * k, r, r * Math.cos(th), 0, 0, TAU); x.stroke(); }
    }, { flatShadow: [6, 9, 8, .5] });
  }
  function drawMap(ctx, t) {
    FL.background(ctx);
    const th = .8 * lean(t), f = M45 ? 1500 : 1700;
    F.tilt(ctx, FL, th, f, (x, L) => mapFrame(x, t, L));
    throne3d(ctx, t, th, f);
  }

  let BUF = null;
  const buf = () => BUF || (BUF = [F.canvas(W, H), F.canvas(W, H)]);
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function lightboxFrame(ctx, t) {
    LB.background(ctx);
    drawField(ctx, t);
    if (!hallGone(t)) drawHall(ctx, t);
  }
  function draw(ctx, t) {
    const b = ss(T_BLEND0, T_BLEND1, t);
    if (b <= 0) { lightboxFrame(ctx, t); LB.grade(ctx, t); return; }
    if (b >= 1) { drawMap(ctx, t); FL.grade(ctx, t); return; }
    const [[ca, xa], [cb, xb]] = buf(); clean(xa); clean(xb);
    lightboxFrame(xa, t); LB.grade(xa, t); drawMap(xb, t); FL.grade(xb, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ca, 0, 0); ctx.globalAlpha = b; ctx.drawImage(cb, 0, 0); ctx.restore();
  }

  F.scene('seq-01', {
    W, H, duration: DUR, draw, label: C.label, ready: Promise.resolve(), grain: 'none',
    sfx: [
      { t: T_FLY0 + .1, type: 'swoosh', dur: 1.6, g: .5 },
      { t: T_FLY1 - .7, type: 'whoosh', f0: 120, f1: 280, dur: 1, g: .25 },
      { t: 3.69, type: 'lib', dur: 3.4, label: 'DISTANT MASSED ARMY, WAR DRUMS (low, far off)' },
      ...ORDER.map((i, n) => ({ t: fallAt(i) + .75, type: 'thud', g: .35 - n * .02 })),
      { t: T_BLEND0, type: 'swoosh', dur: 1.4, g: .35 },
      { t: T_PIN, type: 'impact', size: .5, g: .5, noSnap: true },
    ],
    api: { DUR, camMap, drawMap, XY },
  });
})();
