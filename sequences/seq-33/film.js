(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, RV = F.reversal, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-33'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));

  const T_PURSUIT = 0.67, T_ETERNAL = 1.17, T_LIFE = 1.56, T_BECOME = 1.78, T_ENDS = 2.78, T_IT = 3;
  const T_IN = 3.7, T_REV = 4.92, T_RUNS = 5.43, T_THREE = 5.69, T_LAYERS = 6.01, T_DEEP = 6.39;

  function stateAt(t) {
    const sink = ss(T_ENDS - .15, T_IT + .55, t);
    return {
      t,
      horizon: 1 - .62 * sink, sheen: 1 - .4 * sink,
      silver: .55 + .45 * ss(T_ETERNAL - .1, T_LIFE + .2, t) - .78 * sink,
      halo: bump(t, T_ETERNAL - .05, T_LIFE + .2, T_BECOME + .3, T_ENDS),
      shadow: 2.6 + 13 * Math.pow(sink, 1.4), shadowA: 1,
      cut: ss(T_REV - .25, T_REV + .55, t),
      lit: [.85 * ss(T_THREE - .08, T_THREE + .3, t), .62 * ss(T_LAYERS - .08, T_LAYERS + .3, t), .85 * ss(T_DEEP - .08, T_DEEP + .3, t)],
      grave: 0, fear: 1.25, light: .7, cupOn: 0, cupsFill: .62, tagTh: -.35 + .18 * Math.sin(t * 1.1),
    };
  }

  const KEYS = M45 ? [
    [-.4, [-3.5, .5, -3.6], [0, .7, 2.6], 1250], [0, [-3.35, .52, -3.7], [0, .71, 2.6], 1250],
    [T_LIFE, [-2.2, .58, -4.2], [0, .75, 2.6], 1250], [T_IT + .3, [-.7, .66, -4.7], [0, .7, 2.6], 1250],
    [T_REV, [0, 1.7, -8.6], [0, .1, 1.6], 1250], [T_THREE, [0, .4, -14.5], [0, -4.2, 0], 1250],
    [T_DEEP + .3, [0, -3.4, -19.8], [0, -7.4, 0], 1250], [DUR, [-.2, -4.0, -20.2], [-.15, -7.6, 0], 1250], [DUR + .6, [-.7, -4.5, -19.8], [-.6, -7.5, 0], 1250],
  ] : [
    [-.4, [-3.5, .5, -3.0], [0, .7, 2.6], 1350], [0, [-3.35, .52, -3.1], [0, .71, 2.6], 1350],
    [T_LIFE, [-2.2, .58, -3.5], [0, .75, 2.6], 1350], [T_IT + .3, [-.7, .66, -3.9], [0, .7, 2.6], 1350],
    [T_REV, [0, 1.7, -7.8], [0, .1, 1.6], 1350], [T_THREE, [0, .5, -15], [0, -3.9, 0], 1320],
    [T_DEEP + .3, [0, -3.4, -21.5], [0, -7.2, 0], 1300], [DUR, [-.2, -4.0, -22], [-.15, -7.4, 0], 1300], [DUR + .6, [-.7, -4.5, -21.6], [-.6, -7.3, 0], 1300],
  ];
  const SPL = (() => {
    const ts = KEYS.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KEYS[i])]));
    return { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) };
  })();
  const keyAt = t => ({ e: SPL.e.map(f => f(t)), g: SPL.g.map(f => f(t)), f: Math.exp(SPL.f(t)) });
  const camAt = t => { const k = keyAt(t); return RV.cam(k.e, k.g, k.f, W, H); };

  const MOTES = Array.from({ length: 60 }, (_, i) => [-3 + 6 * RV.hash(i, 1), .15 + 1.7 * RV.hash(i, 2), -2.2 + 4 * RV.hash(i, 3), RV.hash(i, 4)]);
  function motes(ctx, cam, st, t) {
    const a = 1 - st.cut; if (a <= .01) return;
    for (const [mx, my, mz, k] of MOTES) {
      const q = cam.proj([mx + .05 * t + .12 * Math.sin(t * .4 + k * 9), my + .05 * Math.sin(t * .3 + k * 7), mz]); if (!q || q[0] < -30 || q[0] > W + 30 || q[1] < -30 || q[1] > H + 30) continue;
      const d = q[2], r = clamp(.012 * q[3], 1, 7) * (d < 2 ? 1.6 : 1);
      RV.glow(ctx, q[0], q[1], r * 3, '#dfe6ff', a * (.18 + .3 * k) * (.5 + .5 * Math.sin(t * 1.7 + k * 20)) * (.4 + .6 * st.horizon));
    }
  }

  function frame(ctx, t, cam, o = {}) {
    const st = { ...stateAt(t), ...(o.st || {}) };
    RV.frame(ctx, LB, cam, { ...st, glows: (c, cm) => { motes(c, cm, st, t); if (o.glows) o.glows(c, cm); } });
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-33', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-32', dur: .9, dir: 'right' },
    sfx: [
      { t: .2, type: 'hum', dur: DUR - .4, g: .05 },
      { t: T_ETERNAL, type: 'shimmer', g: .07 },
      { t: T_ENDS - .1, type: 'whoosh', f0: 220, f1: 50, dur: 1.4, g: .07 },
      { t: T_ENDS + .1, type: 'rumble', dur: 1.4, g: .08 },
      { t: T_REV - .2, type: 'rumble', dur: 1.6, g: .14 },
      { t: T_REV, type: 'crack', g: .08 },
      { t: T_THREE, type: 'clink', f: 1500, g: .06, noSnap: true },
      { t: T_LAYERS, type: 'clink', f: 1900, g: .06, noSnap: true },
      { t: T_DEEP, type: 'clink', f: 2400, g: .06, noSnap: true },
      { t: T_DEEP + .2, type: 'whoosh', f0: 140, f1: 60, dur: 1.2, g: .06 },
    ],
    api: { DUR, camAt, keyAt, stateAt, frame },
  });
})();
