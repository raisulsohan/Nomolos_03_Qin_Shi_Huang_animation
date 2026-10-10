(function () {
  'use strict';
  const F = FILM, PR = F.props, QM = F.qinmap, CH = F.china, Mo = F.motion, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-07'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A6 = () => F.getScene('seq-06').api;

  const T_TITLE = 1.63, T_POW = 3.33;
  const T_SHI = 4.23, T_FIRST = 6.06, T_THEF = 8.13;
  const T_SEC = 11, T_THI = 12.18, T_SO = 13.14, T_TEN = 14.95;
  const T_DYN = 17.3, T_EVER0 = 19.29, T_EVER = 20.04;

  let G = null;
  function geo() {
    if (G) return G;
    const A = A6(), XY = A.XY, top = A.hC + A.hGold(A.DUR + 30);
    let xe = XY[0] + 20; while (xe < 900 && QM.inEmpire(xe + 2, XY[1])) xe += 2;
    const D_TH = 24, Rc = 700, TH = .32, line = [];
    for (let i = 1; XY[0] + i * D_TH < xe - 8; i++) line.push({ x: XY[0] + i * D_TH, y: XY[1], up: 0, i });
    const nLand = line.length;
    for (let j = 1, a = 0; j <= 74; j++) {
      a += 24 * Math.pow(1.075, j - 1); const a1 = TH * Rc, th = Math.min(TH, a / Rc), over = Math.max(0, a - a1);
      line.push({ x: xe + Rc * Math.sin(th) + over * Math.cos(TH), y: XY[1], up: Rc * (1 - Math.cos(th)) + over * Math.sin(TH), i: nLand + j, arc: j });
    }
    for (const l of line) {
      if (l.i === 1) l.t0 = T_SEC; else if (l.i === 2) l.t0 = T_THI;
      else if (!l.arc) l.t0 = T_SO + (T_TEN - T_SO) * Math.pow((l.i - 3) / Math.max(1, nLand - 3), .6);
      else l.t0 = T_DYN + 1.1 + 2.3 * Math.pow((l.arc - 1) / 73, .7);
    }
    return (G = { XY, top, xe, line, nLand, STELE: [XY[0], XY[1] - 34] });
  }

  function keys() {
    const A = A6(), g = geo(), [fx, fy, fz, fp, fw] = A.spl, T6 = A.DUR, XY = g.XY, top = g.top;
    const at6 = d => [-d, fx(T6 - d), fy(T6 - d), Math.exp(fz(T6 - d)), fp(T6 - d), fw(T6 - d), A.hC];
    const look = (t, e, g2) => {
      const dx = g2[0] - e[0], dn = e[1] - g2[1], dh = e[2] - g2[2], hz = Math.hypot(dx, dn), D = Math.hypot(hz, dh);
      return [t, g2[0], g2[1], A.FLENS / D, Math.atan2(dh, hz) / D2R, Math.atan2(dx, dn) / D2R, g2[2]];
    };
    const X0 = XY[0], Y0 = XY[1], xe = g.xe;
    return [
      at6(.6), at6(0),
      [T_TITLE, XY[0] + 6, XY[1] + 6, 3.0, 52, -4, top], [T_POW, XY[0] + 2, XY[1] - 18, 5.4, 27, -3, top + 26],
      [T_SHI + .2, XY[0], XY[1] - 34, 14.2, 10, 0, top + STELE_H * .64], [T_THEF - .4, XY[0] + 1, XY[1] - 34, 13.4, 12, 2, top + STELE_H * .62],
      look(T_THEF + 1.9, [X0 - 150, Y0 + 135, top + 78], [X0 + 175, Y0 - 12, top + 12]),
      look(T_TEN, [X0 - 172, Y0 + 146, top + 88], [X0 + 190, Y0 - 12, top + 14]),
      look(T_DYN + .15, [X0 - 168, Y0 + 145, top + 88], [X0 + 205, Y0 - 12, top + 16]),
      look(T_EVER0, [X0 - 70, Y0 + 150, top + 46], [xe + 40, Y0 - 6, top + 22]),
      look(T_EVER + .1, [X0 - 50, Y0 + 150, top + 42], [xe + 900, Y0, top + 160]),
      look(DUR + 1.2, [X0 - 40, Y0 + 150, top + 40], [xe + 1400, Y0, top + 200]),
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
    const A = A6();
    if (t <= 0) return A.camAt(A.DUR);
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A.FLENS);
  }

  const T_S0 = T_TITLE - .7, T_SINK0 = T_THEF + .6, T_SINK1 = T_THEF + 1.7;
  const STELE_H = 72;
  const rise = t => { const u = clamp((t - T_S0) / (T_POW - T_S0)); return 1 - Math.pow(1 - u, 2.2); };
  const landSq = t => t >= T_POW && t < T_POW + .35 ? 1 + .06 * Math.exp(-(t - T_POW) * 12) * Math.cos((t - T_POW) * 40) : 1;
  const sinkK = t => ss(T_SINK0, T_SINK1, t);
  const carve = (t, t0, d) => clamp((t - t0) / d);
  const C1 = [T_SHI - .08, .55], C2 = [T_FIRST - .06, .45];
  const SW2 = 52, PL = 10, TOPY = -112, HEAD = -128;
  function slab(x) { x.beginPath(); x.moveTo(-SW2, -PL); x.lineTo(-SW2, TOPY); x.quadraticCurveTo(-SW2 + 4, HEAD + 2, 0, HEAD); x.quadraticCurveTo(SW2 - 4, HEAD + 2, SW2, TOPY); x.lineTo(SW2, -PL); x.closePath(); }
  const LINE1 = ['SHI HUANGDI', -82, 92], LINE2 = ['THE FIRST EMPEROR', -59, 74];
  const fontFor = (x, txt, wd) => { x.font = '900 100px NSC'; return 100 * wd / x.measureText(txt).width; };
  let STELE_UI = null;
  const FLECKS = (() => { const R = F.rng(77), o = []; for (let i = 0; i < 160; i++) o.push([R() * 2 - 1, R(), .6 + 1.6 * R(), R()]); return o; })();
  function carved(x, txt, base, wd, k, glow, t) {
    if (k <= 0) return;
    const sz = fontFor(x, txt, wd); x.font = `900 ${sz}px NSC`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const half = wd / 2, front = -half + wd * k;
    x.save(); x.beginPath(); x.rect(-half - 2, base - sz, front + half + 2, sz * 1.3); x.clip();
    x.fillStyle = 'rgba(8,8,8,.75)'; x.fillText(txt, -.5, base - .6);
    x.fillStyle = S3mix('#8a6a2c', '#ffd77a', glow); x.fillText(txt, 0, base);
    x.restore();
    if (k < 1) {
      x.save(); x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(front, base - sz * .35, 0, front, base - sz * .35, sz * .9); g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(1, 'rgba(255,200,120,0)');
      x.fillStyle = g; x.fillRect(front - sz, base - sz * 1.3, sz * 2, sz * 2);
      const R = F.rng(Math.floor(t * 30));
      x.fillStyle = 'rgba(255,226,160,.9)'; for (let i = 0; i < 6; i++) { const a = -Math.PI * R(), d = sz * (.2 + .8 * R()); x.fillRect(front + Math.cos(a) * d, base - sz * .35 + Math.sin(a) * d * .6, 1.2, 1.2); }
      x.restore();
    }
  }
  const S3mix = (a, b, k) => F.stage3d.mix(a, b, clamp(k));
  function stele(x, u, t, S) {
    const r = rise(t), down = (1 - r) * 132 + sinkK(t) * 136, sq = landSq(t), deep = 3 + 9 * (1 - u.lev);
    if (down >= 131) return;
    x.save(); x.beginPath(); x.rect(u.x - 200 * S, u.y - 300 * S, 400 * S, 300 * S); x.clip();
    x.translate(u.x, u.y + down * S); x.scale(S / sq, S * sq);
    for (let i = deep; i >= 0; i -= .5) {
      x.fillStyle = i ? '#1e1f1c' : '#33342f'; x.fillRect(-62, -PL - i, 124, PL);
      x.save(); x.translate(0, -i); x.fillStyle = i ? '#232421' : '#3b3d38'; slab(x); x.fill(); x.restore();
    }
    x.save(); slab(x); x.clip();
    const sg = x.createLinearGradient(0, HEAD, 0, -PL); sg.addColorStop(0, '#4a4c45'); sg.addColorStop(1, '#2c2e2a'); x.fillStyle = sg; x.fillRect(-SW2, HEAD, 2 * SW2, HEAD * -1);
    for (const [fx, fy, fr, fk] of FLECKS) { x.fillStyle = fk < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; x.fillRect(fx * SW2, -PL + fy * (HEAD + PL), fr, fr * .6); }
    x.fillStyle = 'rgba(255,240,210,.07)'; x.fillRect(-SW2, HEAD, 3, -HEAD);
    x.restore();
    x.strokeStyle = '#4d5049'; x.lineWidth = 1.4; x.save(); x.scale(.9, .94); slab(x); x.stroke(); x.restore();
    x.beginPath(); x.moveTo(-SW2 + 6, TOPY + 10); x.lineTo(SW2 - 6, TOPY + 10); x.stroke();
    const g1 = 1 - .55 * ss(C1[0] + C1[1] + .2, C1[0] + C1[1] + 1.4, t), g2 = 1 - .55 * ss(C2[0] + C2[1] + .2, C2[0] + C2[1] + 1.4, t);
    carved(x, LINE1[0], LINE1[1], LINE1[2], carve(t, C1[0], C1[1]), g1, t);
    if (carve(t, C1[0], C1[1]) >= 1) { x.fillStyle = S3mix('#8a6a2c', '#ffd77a', g1); x.fillRect(-LINE1[2] / 2, LINE1[1] + 4, LINE1[2] * easeIO(clamp((t - C1[0] - C1[1]) / .4)), 1.6); }
    carved(x, LINE2[0], LINE2[1], LINE2[2], carve(t, C2[0], C2[1]), g2 * (1 - .4 * ss(T_THEF, T_THEF + .4, t)), t);
    x.restore();
    const sz2 = fontFor(x, LINE2[0], LINE2[2]); x.font = `900 ${sz2}px NSC`;
    const wT = x.measureText('THE ').width, wF = x.measureText('FIRST').width, w0 = x.measureText(LINE2[0]).width;
    STELE_UI = { x: u.x + (-w0 / 2 + wT + wF / 2) * S, y: u.y + (LINE2[1] + down) * S, sz: sz2 * S };
    for (const [t0, n, k] of [[T_S0, 10, .7], [T_POW, 14, 1]]) {
      const d = t - t0; if (d < 0 || d > 1.6) continue;
      const R = F.rng(7 + n), uu = d / 1.6;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + R() * Math.PI, rr = (62 + 40 * uu * (.5 + R())) * S, sz = (4 + 8 * uu) * S * (.6 + .6 * R());
        x.fillStyle = `rgba(196,150,70,${.4 * k * (1 - uu)})`; x.beginPath(); x.arc(u.x + Math.cos(a) * rr, u.y + Math.sin(a) * rr * .3 - 6 * uu * S, sz, 0, TAU); x.fill();
      }
    }
  }
  const CRACKS = (() => { const R = F.rng(53), o = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + R() * .5, pts = [[0, 0]]; let r = 0; for (let j = 0; j < 5; j++) { r += 5 + 7 * R(); pts.push([Math.cos(a + (R() - .5) * .7) * r, Math.sin(a + (R() - .5) * .7) * r]); } o.push(pts); } return o; })();
  function onTop(x, cam, t) {
    const g = geo(), A = A6(), h = A.hC + A.hGold(A.DUR + t), [px, py] = g.STELE;
    const ca = ss(T_S0, T_S0 + .4, t) * (1 - sinkK(t)), grow = ss(T_S0, T_POW, t);
    if (ca > 0) {
      x.save(); x.strokeStyle = `rgba(60,36,10,${.7 * ca})`; x.lineWidth = 1.6; x.lineJoin = 'round'; x.beginPath();
      for (const c of CRACKS) QM.polyline(x, cam, c.map(([cx, cy]) => [px + cx * (.4 + .6 * grow), py + cy * .7 * (.4 + .6 * grow)]), h);
      x.stroke(); x.restore();
    }
    const r = (t - T_POW) * 420;
    if (r > 0 && r < 900) {
      x.save(); x.beginPath(); QM.rings(x, cam, CH.CHINA, h); x.clip(); x.beginPath(); QM.ring(x, cam, CH.QIN221[0], h); x.clip();
      const a = (1 - ss(450, 900, r)) * .8, ring = QM.disk(px, py, r, 120);
      for (const [dw, aa] of [[22, .16], [9, .35], [3, 1]]) { x.strokeStyle = `rgba(255,236,170,${a * aa})`; x.lineWidth = dw; x.beginPath(); QM.ring(x, cam, ring, h); x.stroke(); }
      x.restore();
    }
  }

  const tScale = (l, t) => { const u = clamp((t - l.t0) / .3); return u > 0 ? 1 - Math.pow(1 - u, 3) * Math.cos(u * 2.4) : 0; };
  let STARS6 = [];
  function uprights(put, cam, m, t) {
    const g = geo(), A = A6(), top = g.top, mT = A.magT(cam);
    if (t > T_S0 && t < T_SINK1) put(g.STELE[0], g.STELE[1], top, (x, u) => stele(x, u, t, STELE_H * u.k * mT * (.45 + .55 * u.lev) / 128));
    STARS6 = [];
    for (const l of g.line) {
      const k = tScale(l, t); if (k <= 0) continue;
      put(l.x, l.y, top + l.up, (x, u) => {
        const S = A.THRONE_H * u.k * mT * (.45 + .55 * u.lev) * .72 / 59;
        if (S * 59 < 5) { STARS6.push([u.x, u.y - S * 30, k]); return; }
        x.save(); x.translate(u.x, u.y); x.scale(.6 + .4 * k, k); QM.throne(x, 0, 0, S, { deep: 3 + 8 * (1 - u.lev), side: 3 }); x.restore();
      });
    }
  }

  const STARS = (() => { const R = F.rng(61), o = []; for (let i = 0; i < 260; i++) o.push([R() * 2.4 - .5 + Math.PI / 2, .02 + Math.pow(R(), .8) * 1.3, .4 + .6 * R(), R()]); return o; })();
  function sky(ctx, cam, t) {
    const sh = SH(), hy = cam.cy - cam.f * Math.tan(cam.ph) - sh.y, a = ss(T_THEF + .6, T_THEF + 1.8, t);
    if (a > 0 && hy > -200 && hy < H + 200) {
      const g = ctx.createLinearGradient(0, hy - 260, 0, hy + 40);
      g.addColorStop(0, 'rgba(255,214,160,0)'); g.addColorStop(.8, `rgba(255,214,160,${.1 * a})`); g.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, hy - 260, W, 300); ctx.restore();
    }
    const sa = ss(T_DYN, T_EVER, t);
    if (sa > 0) for (const [yw, el, br, ph] of STARS) {
      const d = [Math.sin(yw) * Math.cos(el), Math.sin(el), Math.cos(yw) * Math.cos(el)], p = cam.proj([cam.pos[0] + d[0] * 1e5, cam.pos[1] + d[1] * 1e5, cam.pos[2] + d[2] * 1e5]);
      if (!p || p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) continue;
      const tw = .75 + .25 * Math.sin(t * 3 + ph * 20);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,246,226,${sa * br * tw})`; ctx.beginPath(); ctx.arc(p[0] - sh.x, p[1] - sh.y, .8 + 1.2 * br, 0, TAU); ctx.fill(); ctx.restore();
    }
  }

  const TAGSZ = M45 ? 30 : 32;
  function throneTag(cam) {
    const A = A6(), g = geo(), u = QM.up(cam, g.XY[0], g.XY[1], g.top); if (!u) return null;
    const th = A.THRONE_H * u.k * A.magT(cam) * (.45 + .55 * u.lev);
    return [u.x, u.y - th - 6];
  }
  function words(ctx, t, cam) {
    if (t < T_THEF - .05) return;
    const g = geo(), ui = STELE_UI;
    FL.sheet(ctx, ID, 1, RC, x => {
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      const tg = throneTag(cam), lift = ss(T_THEF, T_THEF + .45, t), fly = easeIO(clamp((t - T_THEF - .45) / 1.25));
      const sz0 = ui ? ui.sz : TAGSZ, fx = ui ? ui.x : tg ? tg[0] : W / 2, fy = ui ? ui.y : tg ? tg[1] - 40 : H / 2;
      const sz = lerp(sz0 * (1 + .25 * lift), TAGSZ, fly), cx = tg ? lerp(fx, tg[0], fly) : fx, cy = tg ? lerp(fy - 14 * lift, tg[1] - 40, fly) : fy;
      const card = ss(T_THEF + 1.6, T_THEF + 1.8, t), aF = (1 - card) * (1 - ss(T_DYN + .2, T_DYN + .6, t));
      if (aF > 0) {
        x.font = `900 ${sz}px NSC`; const wd = x.measureText('FIRST').width; x.globalAlpha = aF;
        x.shadowColor = 'rgba(255,200,110,.85)'; x.shadowBlur = 18 * lift; x.fillStyle = '#f2c46a'; x.fillText('FIRST', cx - wd / 2, cy);
        x.shadowBlur = 0; x.globalAlpha = 1;
      }
      if (card > 0 && tg) QM.tag(x, tg[0] - 18, tg[1], 'FIRST', { alpha: card * (1 - ss(T_DYN + .2, T_DYN + .6, t)), size: TAGSZ, stem: 22 });
      for (const [i, txt] of [[1, 'SECOND'], [2, 'THIRD']]) {
        const l = g.line[i - 1], a = ss(l.t0 + .15, l.t0 + .4, t) * (1 - ss(T_DYN + .3, T_DYN + .9, t)); if (a <= 0) continue;
        const u = QM.up(cam, l.x, l.y, g.top); if (!u) continue;
        const th = A6().THRONE_H * u.k * A6().magT(cam) * (.45 + .55 * u.lev) * .72;
        QM.tag(x, u.x, u.y - th - 4, txt, { alpha: a, size: Math.round(TAGSZ * .85), stem: i === 1 ? 46 : 78 });
      }
    }, { shadow: false });
  }

  function draw(ctx, t) {
    const A = A6(), cam = camAt(t), T6 = A.DUR + t, sh = SH();
    STELE_UI = null;
    A.world(ctx, T6, cam, t <= 0 ? undefined : {
      sky: (c, cm) => sky(c, cm, t), onTop: (x, cm) => onTop(x, cm, t), uprights: (put, cm, m) => uprights(put, cm, m, t),
    });
    if (t > 0) for (const [sx, sy, k] of STARS6) PR.glow(ctx, sx - sh.x, sy - sh.y, 7 + 4 * k, '#fff1c8', .55 * k, 'flat');
    if (t > 0) words(ctx, t, cam);
    F.impact(FL, ctx, t, { lines: [{ text: '10,000 GENERATIONS', t0: T_TEN, size: M45 ? 74 : 100, color: '#f5ecd8' }], x: .5, y: M45 ? .14 : .16, out: T_DYN + .4, accent: '#d9a443' });
    FL.grade(ctx, T6);
  }

  F.scene('seq-07', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: T_S0, type: 'rumble', dur: T_POW - T_S0 + .2, g: .24 },
      { t: T_S0, type: 'lib', dur: T_POW - T_S0 + .3, label: 'STONE GRINDING: a heavy stone slab rising out of the ground, earth cracking' },
      { t: T_POW, type: 'impact', size: .5, g: .48, noSnap: true },
      { t: T_POW + .05, type: 'swoosh', dur: 1.3, g: .25 },
      { t: C1[0], type: 'scrub', dur: C1[1], g: .22 },
      { t: C1[0], type: 'hiss', dur: C1[1] + .1, g: .08 },
      { t: T_SHI, type: 'titleHit', g: .42, noSnap: true },
      { t: C2[0], type: 'scrub', dur: C2[1], g: .2 },
      { t: T_FIRST, type: 'impact', size: .25, g: .25, noSnap: true },
      { t: T_SINK0, type: 'rumble', dur: T_SINK1 - T_SINK0, g: .14 },
      { t: T_THEF, type: 'shimmer', g: .18 },
      { t: T_THEF + .5, type: 'whoosh', f0: 140, f1: 300, dur: 1.2, g: .14 },
      { t: T_THEF + 1.65, type: 'clunk', f: 120, g: .22, noSnap: true },
      { t: T_SEC, type: 'clunk', f: 110, g: .26, noSnap: true },
      { t: T_THI, type: 'clunk', f: 105, g: .24, noSnap: true },
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ t: T_SO + (T_TEN - T_SO) * Math.pow(i / 10, .6), type: 'tap', g: .2 * (1 - i / 14), noSnap: true })),
      { t: T_TEN, type: 'impact', size: .45, g: .42, noSnap: true },
      { t: T_DYN - .1, type: 'swoosh', dur: 2.0, g: .3 },
      { t: T_EVER0 - .2, type: 'riser', dur: T_EVER - T_EVER0 + .2, g: .22 },
      { t: T_EVER, type: 'shimmer', g: .2 },
    ],
    api: { DUR, camAt, geo, spl, sky, uprights, stars6: () => STARS6 },
  });
})();
