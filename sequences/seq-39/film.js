(function () {
  'use strict';
  const F = FILM, GL = F.globe, S3 = F.stage3d, Mo = F.motion, { clamp, smooth, lerp, easeIO, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-39'), DUR = C.duration, GT0 = C.T.start;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2], D = Math.PI / 180;

  const T_NAME = 0.47, T_KINGDOM = 1.18, T_QIN = 2.08, T_PRON = 2.37, T_CHIN = 2.88;
  const T_ROOT = 4.66, T_WORD = 5.27, T_CHINA = 5.54, T_ITSELF = 5.88;
  const T_MAN = 7.17, T_NAME2 = 7.64, T_COUNTRY = 8.16, T_SPOKEN = 8.76, T_BILLIONS = 9.21;
  const T_DAY = 10.4, T_TWENTY = 11, T_CENT = 11.55, T_HEART = 12.6, T_STOPPED = 12.91;

  const rotAt = t => -107 + .55 * t;
  const toW = (lon, lat, r, t) => GL.at(lon, lat, rotAt(t), r);
  const XIANYANG = [108.7, 34.35];
  const fk = M45 ? .82 : 1;
  const KEYS = (() => {
    const K = [
      [-.6, toW(106, 33.5, 1.66, -.6), [0, 0, 0], 1100 * fk], [0, toW(106, 33.5, 1.64, 0), [0, 0, 0], 1100 * fk],
      [T_KINGDOM + .2, toW(106.5, 32.5, 1.58, T_KINGDOM), [0, 0, 0], 1100 * fk],
      [(T_KINGDOM + T_QIN) / 2 + .1, toW(107.2, 27.5, 1.52, T_KINGDOM), toW(107.8, 32, .3, T_KINGDOM), 1100 * fk],
      [T_QIN + .1, toW(107.9, 20.5, 1.42, T_QIN), toW(108.4, 30.9, .72, T_QIN), 1100 * fk],
      [T_CHIN + .15, toW(108.5, 15.5, 1.33, T_CHIN), toW(108.5, 30.5, 1, T_CHIN), 1100 * fk],
      [T_CHINA + .3, toW(108, 12.5, 1.43, T_CHINA), toW(108.5, 30, 1, T_CHINA), 1100 * fk],
      [T_COUNTRY, toW(108.6, 13.5, 1.42, T_COUNTRY), toW(108.7, 31, 1, T_COUNTRY), 1100 * fk],
      [T_TWENTY, toW(106, 6, 3.1, T_SPOKEN), [0, .08, 0], 1100 * fk],
      [DUR, toW(104, 4, 3.55, T_SPOKEN), [0, 0, 0], 1100 * fk], [DUR + .8, toW(103.8, 3.8, 3.6, T_SPOKEN), [0, 0, 0], 1100 * fk],
    ];
    return K;
  })();
  const SPL = (() => {
    const ts = KEYS.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KEYS[i])]));
    return { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) };
  })();
  const keyAt = F.stage3d.calm(t => ({ e: SPL.e.map(f => f(t)), g: SPL.g.map(f => f(t)), f: Math.exp(SPL.f(t)) }), DUR);
  const camAt = t => { const k = keyAt(t), e = k.e, g = k.g, d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]]; return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: k.f, W, H, near: .002 }); };

  const ADV = { Q: 67.4, C: 55, H: 65.6, I: 38, N: 70.9, A: 62 }, TRACK = 6;
  const BASE_LAT = 27.6, MID_LON = 109.5;
  const layout = (word, h) => { const s = h / 72, ws = [...word].map(c => (ADV[c] + TRACK) * s), tot = ws.reduce((a, b) => a + b, 0) - TRACK * s; let x = -tot / 2; return ws.map(wd => { const m = x + (wd - TRACK * s) / 2; x += wd; return m; }); };
  const LETTERS = (t) => {
    const hQ = .074, hC = lerp(.074, .088, ss(T_CHINA, T_ITSELF + .3, t));
    const L1 = layout('QIN', hQ), L2 = layout('CHIN', hQ), L3 = layout('CHINA', hC);
    const m2 = easeIO(clamp((t - T_CHIN + .05) / .55)), m3 = easeIO(clamp((t - T_CHINA + .05) / .55));
    const pos = (a, b, c) => lerp(lerp(a ?? b, b, m2), c, m3);
    const out = [];
    const th = Math.PI * easeIO(clamp((t - T_CHIN + .02) / .5)), back = th > Math.PI / 2;
    out.push({ ch: back ? 'C' : 'Q', turn: back ? th - Math.PI : th, x: pos(L1[0], L2[0], L3[0]), h: hC, stand: ss(T_QIN - .05, T_QIN + .4, t) });
    const uh = clamp((t - T_CHIN - .3) / .46), oh = uh - 1;
    out.push({ ch: 'H', x: pos(L2[1], L2[1], L3[1]), h: hC * (uh <= 0 ? 0 : 1 + 1.9 * oh * oh * oh + .9 * oh * oh), stand: 1, alpha: clamp(uh * 4) });
    out.push({ ch: 'I', x: pos(L1[1], L2[2], L3[2]), h: hC, stand: ss(T_QIN + .04, T_QIN + .44, t) });
    out.push({ ch: 'N', x: pos(L1[2], L2[3], L3[3]), h: hC, stand: ss(T_QIN + .08, T_QIN + .48, t) });
    const ua = clamp((t - T_CHINA - .18) / .46), oa = ua - 1;
    out.push({ ch: 'A', x: L3[4], h: hC * (ua <= 0 ? 0 : 1 + 1.9 * oa * oa * oa + .9 * oa * oa), stand: 1, alpha: clamp(ua * 4) });
    return out;
  };
  const along = u => [MID_LON + u / Math.cos(BASE_LAT * D) / D, BASE_LAT];

  const CITY = () => F.world.CITIES;
  const hsh = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  function pulses(ctx, cam, t, rot) {
    const on = ss(T_SPOKEN - .1, T_BILLIONS + .3, t); if (on <= 0) return;
    const rate = lerp(.7, 2.2, ss(T_SPOKEN, T_DAY + .6, t)), sh = F.SHIFT || { x: 0, y: 0 };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    CITY().forEach(([, lon, lat], i) => {
      const q = GL.at(lon, lat, rot, 1.001); if (!GL.seen(cam, q)) return;
      const p = cam.proj(q); if (!p) return;
      const per = 1.1 + 1.3 * hsh(i, 1), ph = hsh(i, 2), u0 = (t * rate / per + ph), u = u0 - Math.floor(u0), n = Math.floor(u0);
      if (hsh(i, n + 3) > .55 + .4 * on) return;
      const fr = GL.frame(lon, lat, rot), cosv = Math.max(.15, GL.dot(fr.up, (() => { const v = [cam.pos[0] - q[0], cam.pos[1] - q[1], cam.pos[2] - q[2]], l = Math.hypot(...v); return v.map(c => c / l); })()));
      const R = (4 + 26 * u) * p[3] / 600, a = on * (1 - u) * .9;
      ctx.strokeStyle = `rgba(255,214,140,${a * .8})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(p[0], p[1], R, R * cosv, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(255,236,190,${a})`; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.4, 2.2 * (1 - u) * p[3] / 600), 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function hisLight(ctx, cam, t, rot) {
    const a = ss(T_MAN - .1, T_MAN + .35, t) * (1 - .78 * ss(T_STOPPED - .05, T_STOPPED + .5, t)); if (a <= .01) return;
    const q = GL.at(XIANYANG[0], XIANYANG[1], rot, 1.002); if (!GL.seen(cam, q)) return;
    const fr = GL.frame(XIANYANG[0], XIANYANG[1], rot), top = cam.proj(GL.add(q, GL.scl(fr.up, .12))), p = cam.proj(q); if (!p || !top) return;
    const sh = F.SHIFT || { x: 0, y: 0 }; ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    const k = p[3] / 600, beat = bump(t, T_HEART - .02, T_HEART + .08, T_HEART + .2, T_HEART + .6);
    const g = ctx.createLinearGradient(p[0], p[1], top[0], top[1]); g.addColorStop(0, `rgba(255,205,110,${.55 * a})`); g.addColorStop(1, 'rgba(255,205,110,0)');
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, 10 * k); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
    const r = Math.max(10, 60 * k) * (1 + .6 * beat), gl = ctx.createRadialGradient(top[0], top[1], 0, top[0], top[1], r); gl.addColorStop(0, `rgba(255,236,190,${.9 * a})`); gl.addColorStop(.35, `rgba(255,190,90,${.45 * a})`); gl.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = gl; ctx.fillRect(top[0] - r, top[1] - r, 2 * r, 2 * r);
    const ub = clamp((t - T_HEART) / .9); if (ub > 0 && ub < 1) { ctx.strokeStyle = `rgba(255,214,140,${.7 * (1 - ub)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(top[0], top[1], r * (.6 + 2.4 * ub), 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  const letterLit = (i, t) => ss(T_NAME2 - .1 + .07 * Math.abs(i - 1.6), T_NAME2 + .25 + .07 * Math.abs(i - 1.6), t) * (1 - .7 * ss(T_STOPPED, T_STOPPED + .6, t));

  const STARS = Array.from({ length: 260 }, (_, i) => { const u = hsh(i, 11) * 2 - 1, a = hsh(i, 12) * TAU, r = Math.sqrt(1 - u * u); return [r * Math.cos(a) * 60, u * 60, r * Math.sin(a) * 60, hsh(i, 13)]; });

  function frame(ctx, t, cam, o = {}) {
    const rot = rotAt(t);
    FL.background(ctx);
    FL.sheet(ctx, ID, 1, RC, x => {
      for (const [sx, sy, sz, b] of STARS) { const p = cam.proj([cam.pos[0] + sx, cam.pos[1] + sy, cam.pos[2] + sz]); if (!p) continue; x.fillStyle = `rgba(230,236,255,${.15 + .4 * b})`; x.fillRect(p[0], p[1], b > .9 ? 2 : 1.2, b > .9 ? 2 : 1.2); }
      GL.draw(x, cam, { rot, gold: ss(T_KINGDOM - .1, T_KINGDOM + .4, t) * (1 - .45 * ss(T_CHINA, T_ITSELF + .4, t)), china: .55 * ss(T_CHINA - .05, T_ITSELF + .3, t) + .45 * bump(t, T_COUNTRY - .1, T_COUNTRY + .2, T_COUNTRY + .5, T_SPOKEN + .6) });
    }, { shadow: false });
    FL.sheet(ctx, ID, 1, RC, x => {
      const Ls = LETTERS(t).map((l, i) => ({ ...l, i, at: along(l.x) }));
      Ls.sort((a, b) => cam.depth(GL.at(b.at[0], b.at[1], rot)) - cam.depth(GL.at(a.at[0], a.at[1], rot)));
      for (const l of Ls) { const lit = letterLit(l.i, t); GL.letter(x, cam, l.ch, l.at[0], l.at[1], rot, l.h, l.stand, S3.mix('#e3a43c', '#ffd77a', lit), { face: S3.mix('#f6e7c4', '#fff6dc', lit), turn: l.turn, alpha: l.alpha }); }
    }, { flatShadow: [8, 12, 10, .45] });
    hisLight(ctx, cam, t, rot);
    pulses(ctx, cam, t, rot);
    if (!o.noGrade) FL.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));
  const discAt = t => GL.disc(camAt(t));

  F.scene('seq-39', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-38', dur: .9, dir: 'up' },
    sfx: [
      { t: T_KINGDOM, type: 'shimmer', g: .05 },
      { t: T_QIN, type: 'impact', size: .28, g: .17, noSnap: true },
      { t: T_CHIN - .02, type: 'swoosh', g: .06 }, { t: T_CHIN + .52, type: 'thud', g: .08 },
      { t: T_CHINA, type: 'impact', size: .34, g: .2, noSnap: true }, { t: T_CHINA + .1, type: 'shimmer', g: .06 },
      { t: T_MAN, type: 'riser', dur: .8, f0: 300, f1: 700, g: .04 }, { t: T_NAME2, type: 'shimmer', g: .05 },
      { t: T_SPOKEN - .2, type: 'whoosh', f0: 260, f1: 90, dur: 2.2, g: .06 },
      ...Array.from({ length: 14 }, (_, i) => ({ t: T_BILLIONS + .15 + i * .19 + .05 * hsh(i, 5), type: 'tick', g: .012 + .002 * (i % 3) })),
      { t: T_HEART, type: 'heartbeat', g: .16 },
    ],
    api: { DUR, camAt, keyAt, frame, discAt, rotAt },
  });
})();
