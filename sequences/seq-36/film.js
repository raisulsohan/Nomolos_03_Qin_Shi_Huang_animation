(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, RV = F.reversal, { clamp, smooth, lerp, easeIO, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-36'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const A35 = () => F.getScene('seq-35').api, D35 = () => A35().DUR;
  const P3 = RV.P3, FIG = S3.FIG;

  const T_THIRD = 0.19, T_EMPIRE = 1.15;
  const T_REFUSAL = 2.19, T_SUCC = 4.27, T_PLAN = 4.98, T_TERROR = 5.99, T_ASSASSINS = 6.51;
  const T_TOTAL = 7.42, T_SECRECY = 7.75, T_AROUND = 8.2, T_PERSON = 8.79;
  const T_PUT = 9.52, T_TOGETHER = 10, T_DEAD = 11.07, T_NOBODY = 12.33, T_SEALED = 13.49, T_CARRIAGE = 13.93;
  const T_TWO = 15.07, T_COURTIERS = 15.27, T_ALONE = 15.9, T_IMPERIAL = 16.72, T_SEAL = 17.27;
  const T_OBSESSION = 18.71, T_PERM = 19.43, T_PRECISELY = 20.1, T_FORGERY = 21.21, T_POSSIBLE = 21.6;
  const T_SOUGHT = 22.62, T_THRONE = 23.03, T_STAND = 23.88, T_FOREVER = 24.17, T_SEEKING = 25.41;
  const T_HANDED = 25.83, T_EUNUCH = 26.47, T_FAKE = 27.12, T_LETTER = 27.36;

  const Z0 = RV.MEN3.zhao, LI = RV.MEN3.li, STOP = [-.6, 5.62];
  const PHI0 = Math.atan2(LI[1] - Z0[1], LI[0] - Z0[0]), PHIW = Math.atan2(STOP[1] - Z0[1], STOP[0] - Z0[0]);
  const DIST = Math.hypot(STOP[0] - Z0[0], STOP[1] - Z0[1]) / FIG;
  const T_TURN0 = T_POSSIBLE + .1, T_ARRIVE = T_EUNUCH + .05;
  const HELD = RV.standPose3().arms;
  let PERF = null;
  const perf = () => PERF || (PERF = Mo.perform([
    { do: 'wait', until: T_TURN0 },
    { do: 'turn', to: -PHIW, dur: .85 },
    { do: 'walk', dist: DIST, gait: 'walk', style: { step: 34, arms: .1, lean: .03 }, until: T_ARRIVE },
    { do: 'wait', for: 30 },
  ], { x: 0, z: 0, yaw: -PHI0, t0: -1, arms: HELD, hands: [{ pose: 'none' }, { pose: 'none' }] }));
  const standY = (st, e) => ({ ...RV.standPose3(), lean: .02 + .006 * Math.sin(st.t * 1.4 + 2), head: .08 + .14 * e.glance, yaw: -PHI0, headYaw: -PHI0 });
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  const mixN = (a, b, k) => (a ?? b) + ((b ?? a) - (a ?? b)) * k;
  function mixPose(a, b, k) {
    if (k <= 0) return a; if (k >= 1) return b;
    const y0 = a.yaw, y1 = b.yaw;
    return { ...b, hip: [mixN(a.hip[0], b.hip[0], k), mixN(a.hip[1], b.hip[1], k)], lean: mixN(a.lean, b.lean, k), bend: mixN(a.bend, b.bend, k), head: mixN(a.head, b.head, k),
      yaw: mixN(y0, y1, k), headYaw: mixN(a.headYaw ?? y0, b.headYaw ?? y1, k),
      arms: b.arms.map((r, i) => r.map((v, j) => mixN(a.arms[i][j], v, k))),
      feet: b.feet.map((f, i) => ({ ...f, at: [mixN(a.feet[i].at[0], f.at[0], k), mixN(a.feet[i].at[1], f.at[1], k)], ang: mixN(a.feet[i].ang, f.ang, k), yaw: mixN(a.feet[i].yaw ?? y0, f.yaw ?? y1, k) })) };
  }
  function zhaoAt(t, st, e) {
    if (t < T_TURN0 - .3) return null;
    const f = perf(), tp = Mo.pose(t), p = f(tp), at = f.at(tp), pc = { ...centre(p, p.hip[0]), root: [0, 0] };
    const k = ss(T_TURN0 - .3, T_TURN0, t), pose = mixPose(standY(st, e), pc, k);
    return { x: Z0[0] + at.x * FIG, z: Z0[1] - at.z * FIG, pose };
  }
  const FALLS = () => { const f = perf(), wk = f.parts.find(q => q.do === 'walk'); return wk ? wk.fn.falls.map(fl => fl.t) : []; };

  const T_LIFT = T_SOUGHT - .1, T_RUN0 = T_LIFT + .55, T_LAND = T_LETTER;
  function redAt(t) {
    if (t < T_LIFT) return null;
    const A = RV.printAt3(), a = 1 - ss(T_LAND - .05, T_LAND + .3, t);
    if (t < T_RUN0) { const k = ss(T_LIFT, T_RUN0, t); return { p: [A[0], A[1] + .55 * k, A[2]], a: a * ss(T_LIFT, T_LIFT + .2, t) }; }
    const B = RV.LETTER3.c, S = [A[0], A[1] + .55, A[2]], M = [(S[0] + B[0]) / 2 + 1.3, Math.max(S[1], B[1]) + 2.2, (S[2] + B[2]) / 2 - .6];
    const u = easeIO(clamp((t - T_RUN0) / (T_LAND - T_RUN0))), q = (a0, b0, c0) => (1 - u) * (1 - u) * a0 + 2 * u * (1 - u) * b0 + u * u * c0;
    return { p: [q(S[0], M[0], B[0]), q(S[1], M[1], B[1]) + .03 * Math.sin(t * 5) * (1 - u), q(S[2], M[2], B[2])], a };
  }

  const shutT = b => T_TOTAL - .05 + (T_PERSON + .2 - T_TOTAL + .05) * (b + .5) / 10;
  function e3At(t, st) {
    const out = ss(T_DEAD - .05, T_DEAD + .55, t), win = ss(T_TOGETHER - .25, T_TOGETHER + .25, t) * (1 - out) * (out > 0 && out < 1 ? .55 + .45 * Math.abs(Math.sin(t * 37)) : 1);
    const e = {
      flare: bump(t, T_THIRD - .05, T_THIRD + .35, T_EMPIRE + .2, T_EMPIRE + 1.4),
      glow: ss(T_TERROR, T_PERSON + .55, t), shut: ss(T_TOTAL - .05, T_PERSON + .2, t), win,
      thread: ss(T_SUCC - .1, T_PLAN - .1, t), threadA: bump(t, T_SUCC - .15, T_SUCC + .05, T_PLAN + .1, T_PLAN + .55),
      sin: bump(t, T_TERROR - .25, T_ASSASSINS + .35, T_AROUND - .1, T_PERSON + .45),
      seal: bump(t, T_SEALED - .1, T_SEALED + .25, T_CARRIAGE + .7, T_CARRIAGE + 1.4), guard: bump(t, T_NOBODY - .1, T_NOBODY + .4, T_NOBODY + .9, T_NOBODY + 1.4),
      men: bump(t, T_TWO - .1, T_TWO + .35, T_SEAL + .9, T_OBSESSION + .6),
      glance: bump(t, T_ALONE - .1, T_ALONE + .4, T_POSSIBLE - .4, T_POSSIBLE),
      belt: bump(t, T_IMPERIAL - .1, T_SEAL + .15, T_SEAL + .9, T_SEAL + 1.6),
      line: ss(T_PERM - .15, T_PRECISELY, t),
      ink: clamp((t - (T_PRECISELY + .15)) / (T_FORGERY - .1 - T_PRECISELY - .15)), print: ss(T_FORGERY - .05, T_FORGERY + .06, t), ring: (t - T_FORGERY) / 1.1,
      first: ss(T_THRONE - .1, T_THRONE + .35, t), climb: ss(T_STAND - .1, T_FOREVER + .75, t),
      gold: ss(T_HANDED - .1, T_EUNUCH + .35, t), letter: ss(T_LETTER - .1, T_LETTER + .3, t), red: redAt(t),
    };
    e.zhao = zhaoAt(t, st, e);
    return e;
  }

  const fk = M45 ? .82 : 1;
  const up = (p, d) => M45 ? [p[0], p[1] + d, p[2]] : p;
  const KEYS = () => {
    const k0 = A35().keyAt(D35() - .4), k1 = A35().keyAt(D35());
    return [
      [-.4, k0.e, k0.g, k0.f], [0, k1.e, k1.g, k1.f],
      [1.2, [1.6, -9.15, -3.2], up([1.1, -9.9, 3.6], 1.5), 1000 * fk],
      [2.2, [1.25, -11.6, -3.6], [.9, -12.6, 4.0], 900 * fk],
      [3.1, [1.0, -13.6, -2.2], [.7, -14.3, 6.0], 980 * fk],
      [4.0, P3(.85, 1.6, .5), up(P3(.5, .95, 6.7), 0.5), 1080 * fk],
      [5.4, P3(.65, 1.5, 1.45), up(P3(.3, 1.0, 7.0), 0.55), 1100 * fk],
      [7.0, P3(1.1, 1.5, 1.6), up(P3(3.6, 1.1, 7.3), 0.55), 1080 * fk],
      [9.1, P3(2.0, 1.55, 1.7), up(P3(5.6, 1.0, 7.2), 0.5), 1080 * fk],
      [10.9, P3(-3.85, 1.45, .8), up(P3(-5.6, 1.3, 3.3), 0.25), 1080 * fk],
      [12.6, P3(-4.3, 1.45, .95), P3(-5.6, 1.35, 3.0), 1120 * fk],
      [14.4, P3(-5.2, 1.45, 1.05), P3(-5.97, 1.38, 2.68), 1200 * fk],
      [16.2, P3(-4.85, 1.45, .95), up(P3(-3.55, .95, 3.35), 0.35), 1100 * fk],
      [18.0, P3(-3.75, 1.3, 1.75), P3(-2.81, .92, 3.08), 1150 * fk],
      [19.4, P3(-4.6, .62, .45), P3(-1.9, -.25, 9.0), 1000 * fk],
      [22.3, P3(-4.5, .64, .55), P3(-1.85, -.2, 9.0), 1010 * fk],
      [24.6, P3(-.2, 1.15, 1.95), up(P3(.2, .95, 6.6), 0.45), 1100 * fk],
      [27.8, P3(1.45, 1.4, 3.2), up(P3(.35, .92, 6.35), 0.45), 1100 * fk],
      [DUR + .8, P3(1.5, 1.41, 3.25), P3(.34, .92, 6.35), 1100 * fk],
    ];
  };
  let SPL = null;
  const spline = K => { const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])])); const e = [0, 1, 2].map(j => mk(k => k[1][j])), g = [0, 1, 2].map(j => mk(k => k[2][j])), f = mk(k => Math.log(k[3])); return t => ({ e: e.map(s => s(t)), g: g.map(s => s(t)), f: Math.exp(f(t)) }); };
  const keyAt = t => (SPL || (SPL = spline(KEYS())))(t);
  const camAt = t => { const k = keyAt(t); return RV.cam(k.e, k.g, k.f, W, H); };

  function frame(ctx, t, cam, o = {}) {
    const s35 = A35().stateAt(D35() + t), l3 = s35.lit[2] + (1 - s35.lit[2]) * ss(T_THIRD - .08, T_THIRD + .35, t);
    A35().frame(ctx, D35() + t, cam, { noText: true, noGrade: true, st: { lit: [s35.lit[0], s35.lit[1], l3], e3: e3At(t, s35) } });
    if (!o.noText) F.impact(LB, ctx, t, { lines: [{ text: '3 · THE EMPIRE', t0: T_THIRD, size: M45 ? 76 : 104, color: '#fff1dc' }], x: .5, y: M45 ? .13 : .15, out: T_REFUSAL + .5, accent: '#ffcf6a' });
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-36', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'whoosh', f0: 200, f1: 90, dur: 1.0, g: .06 },
      { t: 1.0, type: 'whoosh', f0: 160, f1: 55, dur: 1.4, g: .07 },
      { t: T_THIRD, type: 'impact', size: .3, g: .22, noSnap: true },
      { t: T_THIRD + .05, type: 'hum', dur: 1.8, g: .05 },
      { t: 2.6, type: 'whoosh', f0: 120, f1: 220, dur: 1.0, g: .04 },
      { t: T_SUCC, type: 'shimmer', g: .06 }, { t: T_PLAN - .05, type: 'whoosh', f0: 900, f1: 300, dur: .6, g: .03 },
      { t: T_ASSASSINS - .2, type: 'rumble', dur: 1.3, g: .1 }, { t: T_ASSASSINS + .1, type: 'clink', f: 3200, g: .05, noSnap: true },
      ...Array.from({ length: 8 }, (_, b) => ({ t: shutT(b), type: 'clack', g: .045 })),
      { t: T_AROUND, type: 'whoosh', f0: 300, f1: 120, dur: .9, g: .04 },
      { t: T_PUT, type: 'whoosh', f0: 140, f1: 80, dur: 1.0, g: .05 },
      { t: T_DEAD, type: 'hiss', dur: .5, g: .05 }, { t: T_DEAD + .45, type: 'heartbeat', g: .14 },
      { t: T_SEALED, type: 'tick', g: .05 }, { t: T_SEALED + .05, type: 'shimmer', g: .05 },
      { t: T_ALONE, type: 'cloth', g: .04 },
      { t: T_SEAL, type: 'clink', f: 2600, g: .06, noSnap: true }, { t: T_SEAL + .03, type: 'shimmer', g: .05 },
      { t: T_OBSESSION - .1, type: 'whoosh', f0: 180, f1: 70, dur: 1.1, g: .05 },
      { t: T_PERM, type: 'riser', dur: .9, f0: 400, f1: 1300, g: .05 },
      ...Array.from({ length: 7 }, (_, i) => ({ t: T_PRECISELY + .15 + i * (T_FORGERY - .25 - T_PRECISELY) / 7, type: 'quill', dur: .14, g: .035 })),
      { t: T_FORGERY, type: 'thud', g: .2, noSnap: true }, { t: T_FORGERY + .05, type: 'hum', dur: 1.2, g: .06 },
      { t: T_TURN0 + .1, type: 'cloth', g: .035 },
      ...FALLS().map(ft => ({ t: ft, type: 'footstep', g: .05 })),
      { t: T_SOUGHT, type: 'riser', dur: T_LETTER - T_SOUGHT, f0: 300, f1: 900, g: .035 },
      { t: T_THRONE, type: 'shimmer', g: .07 },
      { t: T_STAND, type: 'riser', dur: 1.0, f0: 500, f1: 1600, g: .05 },
      { t: T_LETTER, type: 'thud', g: .12, noSnap: true }, { t: T_LETTER + .05, type: 'hum', dur: .9, g: .06 },
    ],
    api: { DUR, camAt, keyAt, frame, e3At },
  });
})();
