(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, CH = F.china, Mo = F.motion, { clamp, smooth, easeIO, easeIn, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-32'), DUR = C.duration, GT0 = C.T.start;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI;
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A31 = () => F.getScene('seq-31').api, A15 = () => F.getScene('seq-15').api, A6 = () => F.getScene('seq-06').api;
  const TOP = () => A15().TOPH();
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

  const T_YEAR = 0.47, T_EMPIRE = 0.99, T_OPEN = 1.93, T_REVOLT = 2.28;
  const T_207 = 3.47, T_BC = 4.54, T_GONE = 5.17;
  const T_DYN = 6.22, T_DESIGNED = 6.69, T_TEN = 7.42, T_GEN = 8.16;
  const T_OUTLIVED = 8.89, T_FOUNDER = 9.63, T_ROUGHLY = 10.23, T_FOUR = 10.7, T_YEARS = 10.97;
  const T31 = () => A31().DUR;

  const DZX = CH.proj(117.0, 33.6);
  let FIRES = null;
  function fires() {
    if (FIRES) return FIRES;
    const R = F.rng(3211), o = [{ x: DZX[0], y: DZX[1], r: .1 }];
    for (let k = 0; o.length < 46 && k < 4000; k++) {
      const x = 150 + 330 * R(), y = -210 + 300 * R();
      if (!QM.inEmpire(x, y)) continue;
      if (o.some(f => Math.hypot(f.x - x, f.y - y) < 16)) continue;
      o.push({ x, y, r: R() });
    }
    const span = Math.max(...o.map(f => Math.hypot(f.x - DZX[0], f.y - DZX[1])));
    o.forEach((f, i) => { const d = Math.hypot(f.x - DZX[0], f.y - DZX[1]) / span; f.t0 = i === 0 ? T_YEAR - .05 : lerp(T_EMPIRE - .05, T_REVOLT + .35, Math.pow(d, .8)) + .12 * f.r; });
    return (FIRES = o);
  }
  const fireA = (f, t) => ss(f.t0, f.t0 + .3, t) * (1 - .55 * ss(T_DYN, T_TEN, t));

  let CRACKS = null;
  function cracks() {
    if (CRACKS) return CRACKS;
    return (CRACKS = QM.BORDERS.map((b, j) => {
      const pts = [];
      for (let i = 0; i < b.length - 1; i++) { const a = b[i], c = b[i + 1], n = Math.max(2, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 5)); for (let k = 0; k < n; k++) { const u = k / n, jit = k ? 2.2 * (hash(j * 97 + i * 13 + k, 5) - .5) : 0; pts.push([lerp(a[0], c[0], u) + jit, lerp(a[1], c[1], u) + 2.2 * (hash(j * 97 + i * 13 + k, 6) - .5) * (k ? 1 : 0)]); } }
      pts.push(b[b.length - 1]);
      const r = QM.road(pts), t0 = T_207 - .1 + .09 * j, t1 = T_GONE - .3 + .07 * j;
      return { r, t0, t1, j };
    }));
  }
  const crackU = (c, t) => easeIO(clamp((t - c.t0) / (c.t1 - c.t0)));
  const sheenK = t => ss(.4, 1.6, t);
  function crackLines(x, cam, t, glow) {
    const h = TOP() + .05;
    x.save(); x.beginPath(); QM.rings(x, cam, CH.CHINA, h); x.clip(); x.beginPath(); QM.ring(x, cam, CH.QIN221[0], h); x.clip();
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const c of cracks()) {
      const u = crackU(c, t); if (u <= 0) continue;
      const pass = glow ? [[7, `rgba(255,96,40,${.35 * (1 - .5 * ss(T_DYN, T_TEN, t))})`], [2.2, `rgba(255,190,120,${.8 * (1 - .6 * ss(T_DYN, T_TEN, t))})`]] : [[3.4, '#1a0e08']];
      for (const [wd, col] of pass) {
        x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); let pen = false;
        for (let s = 0; s <= u * c.r.L; s += 1.5) { const q = QM.along(c.r, s), p = cam.at(q[0], q[1], h); if (!p) { pen = false; continue; } if (pen) x.lineTo(p[0], p[1]); else { x.moveTo(p[0], p[1]); pen = true; } }
        x.stroke();
      }
    }
    x.restore();
  }
  function sheen(ctx, cam, t) {
    const k = sheenK(t) * (1 - ss(T_GONE - .15, T_GONE + .6, t)); if (k <= .002) return;
    const sh = SH(), h = TOP() + .05;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(217,164,67,${.1 * k})`; ctx.beginPath(); QM.ring(ctx, cam, CH.QIN221[0], h); ctx.fill();
    ctx.restore();
  }
  const FLAKES = Array.from({ length: 140 }, (_, i) => ({ i, c: Math.floor(hash(i, 1) * 13), s: hash(i, 2), v: .6 + .8 * hash(i, 3), t0: T_GONE - .2 + 1.1 * hash(i, 4) }));
  function flakes(ctx, cam, t) {
    const sh = SH(), cs = cracks();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    for (const fl of FLAKES) {
      const age = t - fl.t0; if (age <= 0 || age > 2.4) continue;
      const c = cs[fl.c % cs.length], q = QM.along(c.r, fl.s * c.r.L), up = 14 * fl.v * age, p = cam.at(q[0] + 3 * Math.sin(age * 2 + fl.i), q[1], TOP() + up); if (!p) continue;
      const a = Math.sin(PI * age / 2.4) * .8;
      ctx.fillStyle = `rgba(255,200,110,${a})`; ctx.beginPath(); ctx.arc(p[0], p[1], 1.6 + .6 * hash(fl.i, 5), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  const DIRL = [Math.cos(-20 * PI / 180), Math.sin(-20 * PI / 180)], NTH = 34;
  const thronePos = i => { const T = A31().THR(), s = i === 1 ? 8 : 8 + 7 * Math.pow(i - 1, 1.08), h = i <= 1 ? 0 : 2.2 * Math.pow(i - 1, 1.45); return [T[0] + DIRL[0] * s, T[1] + DIRL[1] * s, h]; };
  const upAt = (i, t) => ss(T_DESIGNED - .1 + .055 * Math.pow(i, .9), T_DESIGNED + .25 + .055 * Math.pow(i, .9), t);
  const fallAt = i => T_FOUR - .3 + .1 * Math.pow(i - 2, .85);
  function lineThrone(x, cam, i, t) {
    const [mx, my, h] = thronePos(i), u = QM.up(cam, mx, my, TOP() + h); if (!u) return;
    const k = upAt(i, t); if (k <= 0) return;
    const fk = i >= 2 ? clamp((t - fallAt(i)) / .95) : 0, star = ss(20, 28, i);
    const S = A31().THRONE_H * u.k * (.45 + .55 * u.lev) / 59 * (1 - .15 * star);
    if (S * 59 < 1.2 || star >= 1) return;
    x.save();
    const drop = Math.min(h, 22 * fk * fk), d = QM.up(cam, mx, my, TOP() + h - drop); const X = d ? d.x : u.x, Y = d ? d.y : u.y;
    x.translate(X, Y); x.rotate((i % 2 ? 1 : -1) * 1.35 * easeIn(fk)); x.translate(-X, -Y);
    x.globalAlpha *= k * (1 - ss(.55, .95, fk)) * (1 - star);
    QM.throne(x, X, Y - (1 - k) * 4 * S, S, { alpha: 1 });
    x.restore();
  }
  function lineGlows(ctx, cam, t) {
    const sh = SH();
    for (let i = 1; i < NTH; i++) {
      const k = upAt(i, t); if (k <= 0) continue;
      const fk = i >= 2 ? clamp((t - fallAt(i)) / .95) : 0, [mx, my, h] = thronePos(i), u = QM.up(cam, mx, my, TOP() + h - Math.min(h, 22 * fk * fk) + A31().THRONE_H * .45); if (!u) continue;
      const star = ss(16, 26, i), a = k * (1 - ss(.2, .7, fk)) * (i === 1 ? .55 : .3 + .5 * star) * (1 - .4 * ss(T_FOUNDER, T_ROUGHLY, t) * (i === 1 ? 1 : 0));
      if (a <= .01) continue;
      A31().sglow(ctx, u.x - sh.x, u.y - sh.y, Math.max(6, Math.min(240, 7 * u.k * (1 - .6 * star))), '#ffd27a', .45 * a);
      if (star > .2) A31().sglow(ctx, u.x - sh.x, u.y - sh.y, 3, '#fff6e0', .9 * a);
    }
  }
  function tags(ctx, cam, t) {
    const a = ss(T_GEN - .3, T_GEN + .1, t) * (1 - ss(T_YEARS + .3, T_YEARS + .8, t)); if (a <= 0) return;
    const sh = SH(), T = A31().THR();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    for (const [i, text] of [[0, 'FIRST'], [1, 'SECOND']]) {
      const p = i ? thronePos(1) : [T[0], T[1], 0], u = QM.up(cam, p[0], p[1], TOP() + p[2] + A31().THRONE_H); if (!u) continue;
      QM.tag(ctx, u.x, u.y - 4, text, { alpha: a, size: M45 ? 30 : 32, stem: 22, lift: i ? 52 : 0 });
    }
    ctx.restore();
  }

  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const A = A31(), p0 = A.params(T31() - .4), p1 = A.params(T31()), T = A.THR(), top = TOP(), L = [T[0] + DIRL[0] * 30, T[1] + DIRL[1] * 30];
    const K = [
      [-.4, p0.x, p0.y, p0.z, p0.pitch, p0.yaw, p0.lift], [0, p1.x, p1.y, p1.z, p1.pitch, p1.yaw, p1.lift],
      [.9, T[0] + 30, T[1] - 18, 9, 40, -12, top + 2], [T_OPEN, 228, -30, 2.6, 56, -6, top], [T_REVOLT + .6, 252, -22, 2.15, 58, -5, top],
      [T_GONE + .5, 256, -20, 2.05, 59, -4.5, top], [T_DYN + .25, 205, 2, 2.4, 56, 4, top],
      [T_DESIGNED + .3, T[0] + 12, T[1] + 6, 6.5, 30, 12, top + 4], [T_GEN, L[0], L[1], 14, -3, 20, top + 13],
      [T_FOUR, L[0] + 1, L[1] - .5, 14.4, -3.6, 21, top + 13.5], [DUR, L[0] + 1.6, L[1] - .8, 14.8, -4, 22, top + 14], [DUR + 1.4, L[0] + 1.8, L[1] - .9, 15, -4.1, 22.2, top + 14.1],
    ];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function params(t) { const [sx, sy, sz, sp, sw, sl] = spl(); return { x: sx(t), y: sy(t), z: Math.exp(sz(t)), pitch: sp(t), yaw: sw(t), lift: sl(t) }; }
  const camAt = t => A31().camOf(params(t));

  function frame(ctx, t, cam, o = {}) {
    const A = A31(), mag = A6().mag(cam), lights = 1 - ss(T_GONE - .1, T_GONE + .7, t);
    A.frame(ctx, T31() + t, cam, {
      noText: true,
      shq: ss(.2, 1.4, t), walk: 1 - ss(1.0, 1.8, t), lights, throneGlow: 1 - .85 * ss(T_FOUNDER - .1, T_ROUGHLY, t), throneAlpha: 1 - .55 * ss(T_FOUNDER - .1, T_ROUGHLY, t),
      onTop: x => { crackLines(x, cam, t, false); },
      uprights: put => {
        for (const f of fires()) { const a = fireA(f, t); if (a <= 0) continue; put(f.x, f.y, TOP(), x => { const u = QM.up(cam, f.x, f.y, TOP()); if (u) QM.fire(x, u.x, u.y, .75 * u.k * mag * (.4 + .6 * u.lev), a, t, f.r * 9 + 1); }); }
        for (let i = 1; i < NTH; i++) { const p = thronePos(i); if (upAt(i, t) > 0) put(p[0], p[1], TOP() + p[2], x => lineThrone(x, cam, i, t)); }
      },
      afterNight: c => {
        sheen(c, cam, t);
        const sh = SH();
        for (const f of fires()) { const a = fireA(f, t); if (a <= 0) continue; const u = QM.up(cam, f.x, f.y, TOP() + 2); if (u) A31().sglow(c, u.x - sh.x, u.y - sh.y, Math.min(120, Math.max(10, 3.5 * u.k * mag)), '#ff7a3a', .5 * a * (.85 + .15 * Math.sin(t * 13 + f.r * 30))); }
        c.save(); c.setTransform(1, 0, 0, 1, -sh.x, -sh.y); c.globalCompositeOperation = 'lighter'; crackLines(c, cam, t, true); c.restore();
        flakes(c, cam, t);
        lineGlows(c, cam, t);
      },
      beforeGrade: c => {
        if (o.noText) return;
        tags(c, cam, t);
        F.impact(FL, c, t, { lines: [{ text: '207 BC', t0: T_207 + .05, size: M45 ? 120 : 140, color: '#f5ecd8' }], x: .5, y: M45 ? .13 : .16, out: T_DYN - .3, accent: '#c9352b' });
        F.impact(FL, c, t, { lines: [{ text: '10,000 GENERATIONS', t0: T_TEN, size: M45 ? 66 : 92, color: '#f5ecd8' }], x: .5, y: M45 ? .12 : .14, out: T_FOUR + .05, accent: '#d9a443' });
        strike(c, t);
        F.impact(FL, c, t, { lines: [{ text: 'ABOUT 4 YEARS', t0: T_FOUR + .5, size: M45 ? 84 : 110, color: '#f5ecd8' }], x: .5, y: M45 ? .12 : .14, accent: '#c9352b', minW: M45 ? 640 : 900 });
      },
    });
  }
  function strike(ctx, t) {
    const k = ss(T_ROUGHLY - .05, T_FOUR - .1, t) * (1 - ss(T_FOUR + .05, T_FOUR + .45, t)); if (k <= 0) return;
    const size = M45 ? 66 : 92, text = '10,000 GENERATIONS', [, mx] = F.canvas(8, 8); mx.font = `900 ${size}px NSC`;
    const tr = size * .05, wds = [...text].map(ch => mx.measureText(ch).width), tw = wds.reduce((a, b) => a + b, 0) + tr * (wds.length - 1);
    const cx = W * .5, cy = H * (M45 ? .12 : .14) - 24 * smooth(clamp((t - T_FOUR - .05) / .4)), x0 = cx - tw / 2 - 10;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(201,53,43,${(1 - ss(T_FOUR + .05, T_FOUR + .45, t))})`;
    ctx.fillRect(x0, cy - size * .06, (tw + 20) * smooth(ss(T_ROUGHLY - .05, T_FOUR - .1, t)), Math.max(6, size * .09)); ctx.restore();
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-32', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .1, type: 'whoosh', f0: 60, f1: 150, dur: 1.6, g: .09 },
      { t: T_YEAR - .05, type: 'crackle', dur: 2.6, g: .1 },
      { t: T_EMPIRE, type: 'lib', dur: T_GONE - T_EMPIRE + .6, label: 'FIRES CRACKLING, FAR SHOUTS OF A CROWD' },
      { t: T_REVOLT, type: 'impact', size: .25, g: .2, noSnap: true },
      { t: T_207 + .05, type: 'impact', size: .35, g: .28, noSnap: true },
      { t: T_207 + .1, type: 'crack', g: .14 }, { t: T_BC + .2, type: 'crack', g: .12 },
      { t: T_GONE, type: 'rumble', dur: 1.6, g: .14 },
      { t: T_DYN, type: 'whoosh', f0: 150, f1: 60, dur: 1.4, g: .08 },
      { t: T_DESIGNED, type: 'riser', dur: 1.4, f0: 500, f1: 1200, g: .05 },
      { t: T_TEN, type: 'hum', dur: T_FOUR - T_TEN, g: .06 },
      { t: T_FOUNDER, type: 'hiss', dur: .4, g: .04 },
      ...Array.from({ length: 12 }, (_, i) => ({ t: fallAt(i + 2) + .35, type: 'thud', g: .1 * Math.pow(.85, i), noSnap: true })),
      { t: T_FOUR + .5, type: 'impact', size: .3, g: .22, noSnap: true },
    ],
    api: { DUR, camAt, params, frame },
  });
})();
