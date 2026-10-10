(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, RV = F.reversal, GL = F.globe, PC = F.pacific, { clamp, smooth, lerp, easeIO, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-41'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI, HIM = RV.HIM, CUPR = RV.CUPR, SH = RV.SH;
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];

  const T_MAN = 0.34, T_ONE2 = 1.21, T_FEAR = 1.52;
  const T_ONE3 = 2.49, T_CUP = 2.72, T_NOT = 3.49, T_STOP = 3.72, T_RAISING = 4.02;
  const T_TRAP = 5.27, T_BUILT = 5.6, T_SCALE = 6.41, T_SINGLE = 7.05, T_LIFE = 7.95;
  const T_BUT = 9.16, T_SAME = 9.59, T_TRAP2 = 9.88, T_SCALES = 10.17, T_UP = 10.61;
  const T_ALL = 11.29, T_WAY = 11.67, T_UP2 = 11.86;

  const DOSES = [T_CUP, T_NOT, T_RAISING], RUN = [.42, .36, .3];
  const brim = t => DOSES.reduce((a, d, i) => Math.max(a, bump(t, d - .28 + .04 * i, d - .04, d + .06, d + .34)), 0);
  const cupFill = t => .5 + .45 * brim(t) - .06 * ss(T_RAISING + .3, T_TRAP, t);
  const ARC = (() => { const a = [CUPR[0], CUPR[1] + .062, CUPR[2]], b = [HIM[0] + .14, .66, HIM[2]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .38, (a[2] + b[2]) / 2 + .14]; return s => { const u = 1 - s; return [0, 1, 2].map(j => u * u * a[j] + 2 * u * s * m[j] + s * s * b[j]); }; })();
  const silverIn = t => DOSES.reduce((a, d, i) => Math.max(a, bump(t, d + RUN[i] - .06, d + RUN[i] + .06, d + RUN[i] + .2, d + RUN[i] + .75)), 0);

  const lightAt = t => { const k = 1 - ss(T_BUT - .02, T_BUT + .4, t); return k * (1 + .35 * Math.sin(t * 41) * bump(t, T_BUT - .05, T_BUT + .05, T_BUT + .2, T_BUT + .38)); };
  const fearK = t => 1.25 * (1 + .55 * ss(T_FEAR - .1, T_FEAR + .45, t) + .06 * ss(T_CUP, T_CUP + .4, t) + .06 * ss(T_NOT, T_NOT + .4, t) + .06 * ss(T_RAISING, T_RAISING + .4, t));
  function stateAt(t) {
    const lit = 1 - ss(T_BUT + .05, T_BUT + .6, t);
    return {
      t: 40 + t, lit: [0, lit, 0], light: lightAt(t), fear: fearK(t),
      er: .5 * bump(t, T_FEAR - .05, T_FEAR + .15, T_FEAR + .55, T_FEAR + 1.0),
      reach: .045 * (ss(T_CUP + .2, T_CUP + .6, t) + ss(T_NOT + .2, T_NOT + .6, t) + ss(T_RAISING + .2, T_RAISING + .6, t)),
      lean: .03 * ss(T_CUP, T_RAISING + .4, t), eyes: 0, rg: .25 * bump(t, T_RAISING, T_RAISING + .4, T_TRAP, T_BUILT),
      himSilver: .85 * silverIn(t), himA: 1 - ss(T_BUT + .18, T_BUT + .42, t), cupOn: 1, cupAt: null, cupFill: cupFill(t), horizon: 0, sheen: 0, cut: 1, shadow: 0, silver: .6, halo: 0,
    };
  }

  const RING_C = [.15, 1.35], RING_R = 1.25, RN = 144;
  const ringU = t => easeIO(clamp((t - T_TRAP - .05) / (T_LIFE + .15 - T_TRAP)));
  const ringRoom = (r = RING_R) => Array.from({ length: RN }, (_, i) => { const a = i / RN * TAU; return [RING_C[0] + r * Math.sin(-a), .004, RING_C[1] + r * Math.cos(a)]; });
  const ringFlash = t => bump(t, T_LIFE + .1, T_LIFE + .16, T_LIFE + .25, T_LIFE + .7) + .6 * bump(t, T_TRAP2 - .1, T_TRAP2 + .05, T_TRAP2 + .2, T_TRAP2 + .6);
  const RING_RV = RV.fromRoom([RING_C[0], 0, RING_C[1]]);
  const ringOpt = t => ({ closed: true, w: .02, wMin: 1.6, col: S3.mix('#dde4f2', '#ffffff', ringFlash(t)), glow: .55 + .6 * ringFlash(t) });

  const R = (e, g, f) => [RV.fromRoom(e), RV.fromRoom(g), f];
  const fk = M45 ? .82 : 1;
  const R45 = (e, g, f, k) => { if (!M45) return R(e, g, f); const q = e.map((v, i) => g[i] + (v - g[i]) * k), ex = Math.max(0, q[2] - 3.7); return R([q[0], q[1] + .9 * ex, q[2] - ex], g, f); };
  const T_R = T_SCALES - .05, RE = 6371000;
  const KEYS = () => [
    [-.6, ...R([1.12, 1.18, 3.3], [-.46, .74, 1.12], 1150 * fk)],
    [0, ...R([1.08, 1.17, 3.22], [-.46, .74, 1.12], 1150 * fk)],
    [T_ONE2, ...R([.98, 1.17, 3.06], [-.5, .8, 1.06], 1170 * fk)],
    [T_FEAR + .35, ...R([.92, 1.2, 3.02], [-.72, 1.32, .5], 1120 * fk)],
    [T_ONE3 + .1, ...R([.6, 1.0, 2.2], [-.3, .74, 1.06], 1150 * fk)],
    [T_CUP + .2, ...R([.47, .88, 1.82], [-.27, .66, 1.12], 1170 * fk)],
    [T_RAISING + .3, ...R([.43, .87, 1.74], [-.28, .67, 1.12], 1180 * fk)],
    [T_BUILT, ...R45([.9, 1.42, 3.1], [-.15, .45, 1.2], 1120 * fk, 1.15)],
    [T_LIFE, ...R45([1.15, 1.62, 3.45], [.0, .2, 1.32], 1060 * fk, 1.25)],
    [T_BUT, ...R45([1.2, 1.7, 3.52], [.05, .12, 1.34], 1050 * fk, 1.25)],
    [T_BUT + .8, ...R45([1.22, 1.72, 3.54], [.06, .11, 1.34], 1050 * fk, 1.25)],
  ];
  let SPL = null;
  const roomKey = F.stage3d.calm(t => {
    if (!SPL) { const K = KEYS(), ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])])); SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) }; }
    return { e: SPL.e.map(f => f(t)), g: SPL.g.map(f => f(t)), f: Math.exp(SPL.f(t)) };
  }, T_BUT);
  const T_PD = T_BUT + 1.9, ss5 = (a, b, t) => { const u = clamp((t - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
  let C0 = null;
  const c0 = () => {
    if (C0) return C0;
    const k = roomKey(T_BUT), C = RING_RV, H0 = k.e[1] - C[1], vx = k.e[0] - C[0], vz = k.e[2] - C[2], d0 = Math.hypot(vx, vz);
    return (C0 = { H0, p0: Math.atan2(H0, d0), psi0: Math.atan2(-vx, -vz), gOff: [k.g[0] - C[0], k.g[1] - C[1], k.g[2] - C[2]], f0: k.f });
  };
  let LNH = null;
  const lnh = t => (LNH || (LNH = Mo.monotone([[T_BUT, Math.log(c0().H0)], [T_BUT + .5, Math.log(c0().H0 + .12)], [T_R, Math.log(2.75)], [T_R + .22, Math.log(4.5)], [T_R + .42, Math.log(900)], [T_R + .62, Math.log(2.2e5)], [T_R + 1.25, Math.log(5.2e5)], [T_R + 1.9, Math.log(1.25e6)], [DUR, Math.log(2.3e6)], [DUR + .6, Math.log(3.4e6)], [DUR + 1.25, Math.log(4.2e6)], [DUR + 2.0, Math.log(4.45e6)], [DUR + 2.8, Math.log(4.46e6)]])))(t);
  const hAt = t => t <= T_BUT ? c0().H0 : Math.exp(lnh(t));
  const T_GLOBE = T_R + .4;
  const planeK = t => ss(T_R + .27, T_GLOBE - .01, t);
  const planeY = t => lerp(RING_RV[1] + .004, Math.min(.0006, .002 * Math.max(0, (hAt(t) - 10.5) / RE)) * RE, planeK(t));
  function curveKey(t) {
    const { p0, psi0, gOff, f0 } = c0(), u = ss5(T_BUT, T_PD, t), p = lerp(p0, 87 * PI / 180, u), psi = psi0 * (1 - ss(T_BUT, T_GLOBE - .05, t)), H = hAt(t), C = RING_RV, gk = 1 - u;
    const gy = planeY(t) - RING_RV[1] - .004, d = (H - gy) / Math.tan(p);
    return { e: [C[0] - d * Math.sin(psi), C[1] + H, C[2] - d * Math.cos(psi)], g: [C[0] + gOff[0] * gk, C[1] + gy + gOff[1] * gk, C[2] + gOff[2] * gk], f: lerp(f0, 1060 * fk, u) };
  }
  const keyAt = t => t < T_BUT ? roomKey(t) : curveKey(t);
  const camRV = t => { const k = keyAt(t); return RV.cam(k.e, k.g, k.f, W, H); };
  const XIANYANG = [108.7, 34.35], ROT = -108.7, LX = PC.frameAt(XIANYANG[0], XIANYANG[1], ROT, 1 / RE);
  const rv2g = p => PC.toGlobe(LX, [p[0], p[1], -p[2]]);
  const keyG = t => { const k = keyAt(t); return { e: rv2g(k.e), g: rv2g(k.g), f: k.f }; };
  const camG = t => PC.globeCam(keyG(t), W, H);
  const T_DARK0 = T_R + .1;
  const camAt = t => t < T_GLOBE ? camRV(t) : camG(t);

  const CLOUDS = Array.from({ length: 20 }, (_, i) => {
    const a = PC.hash(i, 1) * TAU + i * 2.4, r = 1.0 + 11 * Math.pow(PC.hash(i, 2), .7);
    return [XIANYANG[0] + r * Math.cos(a) * 1.25, XIANYANG[1] + r * Math.sin(a) * .8, .038 + .042 * PC.hash(i, 3), .55 + 1.1 * PC.hash(i, 4), i + 1];
  });
  const kappa = t => .39 + .05 * ss(T_UP - .1, T_UP2 + .4, t);
  const rhoAt = t => { const d = 1 + (hAt(t) - 10.5) / RE, k = kappa(t); let lo = 1e-9, hi = 1.2; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (Math.sin(m) / (d - Math.cos(m)) < k ? (lo = m) : (hi = m)); } return lo / (PI / 180); };
  const globeK = t => ss(T_GLOBE, T_GLOBE + .6, t);
  const toLLg = p => { const r = Math.hypot(...p); return [Math.atan2(p[0], -p[2]) / (PI / 180) - ROT, Math.asin(p[1] / r) / (PI / 180)]; };
  const RING_LL = toLLg(rv2g(RING_RV)), CUP_LL = toLLg(rv2g(RV.fromRoom([CUPR[0], CUPR[1] + .05, CUPR[2]])));
  const stateG = t => ({ rot: ROT, night: 1, ring: { c: RING_LL, rho: rhoAt(t), a: 1, flash: ringFlash(t) }, glint: { c: CUP_LL, a: .8 }, clouds: CLOUDS, k: globeK(t) });

  const roomVeil = t => ss(T_R - .55, T_DARK0, t);
  function world(ctx, t, o = {}) {
    const st = stateAt(t), cam = camAt(t), sv = SH();
    const veil = roomVeil(t), ringIn = 1 - ss(T_BUT + .4, T_BUT + .8, t);
    if (t < T_DARK0) {
      RV.frame(ctx, LB, cam, {
        ...st,
        b2behind: (x, c) => { const u = ringU(t); if (u > 0 && ringIn > .01) { x.save(); x.globalAlpha = ringIn; PC.band(x, c, ringRoom(), { ...ringOpt(t), u, head: 1 - ss(T_LIFE, T_LIFE + .2, t) }); x.restore(); } },
        glows: (c, cm) => {
          const R2 = RV.roomCam(cm);
          DOSES.forEach((d, i) => {
            const s = (t - d) / RUN[i]; if (s <= 0 || s >= 1.05) return;
            for (let j = 6; j >= 0; j--) { const sj = clamp(s - j * .04); const q = R2.proj(ARC(sj)); if (!q) continue; RV.glow(c, q[0], q[1], Math.max(5, .05 * q[3]) * (1 - j * .1), '#e6ecff', (j ? .25 : .9) * (1 - j / 7) * (1 - ss(.95, 1.05, s))); }
          });
          const q = R2.proj([CUPR[0], CUPR[1] + .05, CUPR[2]]); if (q) { RV.glow(c, q[0], q[1], Math.min(W * .15, .12 * q[3]), '#e8eeff', .25 + .5 * brim(t) + .25 * ss(T_BUT, T_BUT + .5, t)); }
        },
      });
    } else LB.background(ctx);
    if (veil > .001) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(4,4,20,${veil})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const gk = globeK(t);
    if (gk > 0) {
      const cg = camG(t), sg = stateG(t);
      if (gk < 1) {
        PC.world(ctx, LB, cg, { ...sg, ring: null, glint: null }, t);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(4,4,20,${1 - gk})`; ctx.fillRect(0, 0, W, H);
        ctx.setTransform(1, 0, 0, 1, -sv.x, -sv.y); PC.ringBand(ctx, cg, sg.ring, sg.rot); PC.glintAt(ctx, cg, { ...sg.glint, a: sg.glint.a * gk }, sg.rot); ctx.restore();
      } else PC.world(ctx, LB, cg, sg, t);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sv.x, -sv.y);
    const ro = 1 - ringIn;
    if (ro > .001 && t < T_GLOBE) {
      const pk = planeK(t), Y = planeY(t), above = RING_RV[1] + hAt(t) - Y;
      const c = cam, r = Math.max(t < T_R ? RING_R : 0, kappa(t) * above, t < T_R ? 0 : RING_R * (1 - pk));
      const P = Array.from({ length: RN }, (_, i) => { const a = i / RN * TAU; return [RING_RV[0] + r * Math.sin(a), Y, RING_RV[2] + r * Math.cos(a)]; });
      ctx.globalAlpha = ro; PC.band(ctx, c, P, { ...ringOpt(t), w: .02 * r / RING_R }); ctx.globalAlpha = 1;
    }
    if (t >= T_DARK0 && t < T_GLOBE + .4) {
      const cp = RV.fromRoom([CUPR[0], CUPR[1] + .05, CUPR[2]]), q = camRV(t).proj([cp[0], lerp(cp[1], planeY(t), planeK(t)), cp[2]]); if (q) RV.glow(ctx, q[0], q[1], 14 * (W / 1920), '#e8eeff', .7 * (1 - globeK(t)));
    }
    ctx.restore();
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => world(ctx, t);

  F.scene('seq-41', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-40', dur: .9, dir: 'down' },
    sfx: [
      { t: .3, type: 'hum', dur: 1.6, g: .03 },
      { t: T_FEAR - .1, type: 'riser', dur: .6, f0: 90, f1: 160, g: .06 }, { t: T_FEAR + .05, type: 'impact', size: .14, g: .1, noSnap: true },
      ...DOSES.flatMap((d, i) => [{ t: d - .05, type: 'clink', f: 1700 + 150 * i, g: .06, noSnap: true }, { t: d, type: 'whoosh', f0: 900, f1: 500, dur: RUN[i] + .1, g: .035 }, { t: d + RUN[i], type: 'shimmer', g: .05 }]),
      { t: T_TRAP, type: 'riser', dur: T_LIFE - T_TRAP + .1, f0: 300, f1: 900, g: .04 },
      { t: T_LIFE + .12, type: 'clunk', f: 900, g: .11, noSnap: true }, { t: T_LIFE + .15, type: 'shimmer', g: .06 },
      { t: T_BUT, type: 'whoosh', f0: 600, f1: 200, dur: .45, g: .05 },
      { t: T_TRAP2, type: 'shimmer', g: .04 },
      { t: T_SCALES - .1, type: 'riser', dur: .55, f0: 120, f1: 380, g: .07 },
      { t: T_R + .2, type: 'whoosh', f0: 260, f1: 70, dur: 2.0, g: .09 },
      { t: T_ALL, type: 'hum', dur: 2.2, g: .04 },
    ],
    api: { DUR, camAt, keyAt, keyG, camG, hAt, stateAt, stateG, world, ROT, XIANYANG, RING_LL, CUP_LL, CLOUDS, kappa, rhoAt, T_GLOBE,
      camRate: camRV, camRef: t => { const k = keyAt(t); return Math.hypot(k.e[0] - k.g[0], k.e[1] - k.g[1], k.e[2] - k.g[2]); }, camQuiet: t => t > T_DARK0 - .05 && t < T_R + .85 },
  });
})();
