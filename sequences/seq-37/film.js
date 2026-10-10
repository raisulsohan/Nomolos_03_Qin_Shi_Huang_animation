(function () {
  'use strict';
  const F = FILM, AR = F.army, Mo = F.motion, { clamp, smooth } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-37'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));

  const T_THEN = 0.2, T_TWIST = 1.16, T_HIST = 1.79, T_LAST = 2.85;
  const T_HE = 3.62, T_IMM = 4.13, T_ANYWAY = 4.84;

  function stateAt(t) {
    return {
      day: 0, dawn: ss(.15, T_LAST + .5, t), dusk: 0, sunTop: ss(T_HIST, T_LAST + .4, t),
      cut: ss(T_HE - .05, T_IMM + .45, t), zf: 0, xw: -62, found: [0, 0], strike: 0, wave: 1e9, run: null, silver: 0,
      glint: ss(T_IMM - .1, T_IMM + .3, t) * (.75 + .25 * ss(T_ANYWAY - .05, T_ANYWAY + .25, t)) * (.92 + .08 * Math.sin(t * 9)),
      farm: t,
    };
  }

  const fk = M45 ? .82 : 1, up = M45 ? 2.6 : 0;
  const KEYS = [
    [-.5, [10.8, 1.16, -6.3], [-20, 3.2 + up, 2.9], 1250 * fk], [0, [10.6, 1.15, -6.2], [-20, 3.2 + up, 3.0], 1250 * fk],
    [T_LAST + .3, [8.0, 1.05, -5.5], [-21, 3.0 + up, 3.6], 1250 * fk],
    [T_HE + .15, [6.0, 1.0, -6.4], [-14, 1.5 + up * .7, 6], 1220 * fk],
    [T_IMM + .45, [2.3, .4, -6.9], [-3.0, -.6 + up * .4, 4.0], 1150 * fk],
    [DUR, [-1.2, -.6, -6.2], [-1.4, -1.15 + up * .3, 0], 1100 * fk], [DUR + .8, [-1.3, -.65, -6.3], [-1.4, -1.05 + up * .3, 0], 1100 * fk],
  ];
  const SPL = (() => {
    const ts = KEYS.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(KEYS[i])]));
    return { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) };
  })();
  const keyAt = F.stage3d.calm(t => ({ e: SPL.e.map(f => f(t)), g: SPL.g.map(f => f(t)), f: Math.exp(SPL.f(t)) }), DUR);
  const camAt = t => { const k = keyAt(t); return AR.cam(k.e, k.g, k.f, W, H); };

  function frame(ctx, t, cam, o = {}) {
    const st = { ...stateAt(t), ...(o.st || {}) };
    AR.frame(ctx, LB, cam, st);
    const dk = 1 - ss(0, .9, t);
    if (dk > .001) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = dk; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-37', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .2, type: 'hum', dur: 3.2, g: .035 },
      { t: T_TWIST - .1, type: 'riser', dur: T_LAST + .5 - T_TWIST, f0: 180, f1: 520, g: .035 },
      ...AR.walkerFalls().filter(ft => ft > .3 && ft < DUR).map(ft => ({ t: ft, type: 'footstep', g: .025 })),
      { t: T_HE - .05, type: 'whoosh', f0: 160, f1: 60, dur: 1.4, g: .06 },
      { t: T_HE + .2, type: 'rumble', dur: 1.2, g: .07 },
      { t: T_IMM, type: 'shimmer', g: .07 },
      { t: T_ANYWAY, type: 'clink', f: 2200, g: .04, noSnap: true },
    ],
    api: { DUR, camAt, keyAt, stateAt, frame },
  });
})();
