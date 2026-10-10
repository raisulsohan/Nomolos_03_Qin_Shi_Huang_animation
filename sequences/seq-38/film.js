(function () {
  'use strict';
  const F = FILM, AR = F.army, Mo = F.motion, { clamp, smooth, lerp, easeIO } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-38'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const A37 = () => F.getScene('seq-37').api, D37 = () => A37().DUR;

  const T_1974 = 0.14, T_FARMERS = 1.62, T_DIGGING = 2.16, T_WELL = 2.79, T_XIAN = 3.64;
  const T_STRUCK = 3.95, T_FIRED = 4.42, T_CLAY = 4.81;
  const T_FACE = 5.75, T_ANOTHER = 6.86, T_THEN = 7.82, T_ARMY = 8.51;
  const T_EIGHT = 9.55, T_TERRA = 10.32, T_COUNTING = 11.57, T_EVERY = 12.36, T_DISTINCT = 13.06;
  const T_STANDING = 13.95, T_GUARD = 14.47, T_TOMB = 15.11, T_NEVER = 15.82, T_OPENED = 16.39;
  const T_RIVERS = 17.58, T_MERCURY = 18.09, T_STILL = 18.92, T_FLOWING = 19.24, T_DARK = 20;

  const T_DIG0 = T_ARMY - .2, T_DIG1 = T_DIG0 + 3.4;
  function stateAt(t) {
    const s37 = A37().stateAt(D37() + t), night = ss(T_MERCURY - .4, T_STILL, t);
    return {
      ...s37,
      day: ss(.08, 1.3, t) * (1 - .9 * night), paper: ss(.08, 1.3, t) * (1 - night), night, sunTop: 1 - ss(.3, 1.3, t),
      glowAz: t < 5 ? Math.atan2(1e4, 2e3) : -1.48,
      glint: s37.glint * (1 - ss(.2, 1.4, t)),
      cut: 1, zc: 0,
      zr: t < T_DISTINCT + .7 ? null : (() => {
        const e = keyAt(t).e, h = Math.max(.05, e[1]), a1 = Math.atan2(h, Math.max(.01, -e[2])), u = clamp((t - T_DISTINCT - .7) / 1.0);
        return Math.min(0, e[2] + h / Math.tan(lerp(.66, a1, .5 * u + .5 * easeIO(u))));
      })(),
      zf: 64 * easeIO(clamp((t - T_DIG0) / (T_DIG1 - T_DIG0))),
      xw: -62 - 73 * easeIO(clamp((t - T_COUNTING + .1) / 2.2)),
      found: [.35 * ss(T_FIRED - .1, T_CLAY + .2, t) + .65 * ss(T_FACE - .15, T_FACE + .25, t), ss(T_ANOTHER - .12, T_ANOTHER + .3, t)],
      strike: bump(t, T_STRUCK - .02, T_STRUCK + .03, T_STRUCK + .12, T_STRUCK + .55),
      wave: t < T_ARMY - .15 ? 1e9 : lerp(-3.2, -160, easeIO(clamp((t - T_ARMY + .15) / .75))),
      run: t > T_EVERY - .15 && t < T_DISTINCT + .8 ? lerp(-5, -22, clamp((t - T_EVERY + .15) / (T_DISTINCT + .8 - T_EVERY + .15))) : null,
      silver: ss(T_RIVERS - .35, T_MERCURY + .45, t), flow: t,
      dusk: ss(T_NEVER - .2, T_RIVERS + .3, t),
      farm: D37() + t,
    };
  }

  const fk = M45 ? .82 : 1, up = (p, d) => M45 ? [p[0], p[1] + d, p[2]] : p;
  const KEYS = () => {
    const k0 = A37().keyAt(D37() - .4), k1 = A37().keyAt(D37());
    return [
      [-.4, k0.e, k0.g, k0.f], [0, k1.e, k1.g, k1.f],
      [1.9, [-1.55, -.4, -6.4], up([-1.4, -.62, 0], .25), 1100 * fk],
      [T_STRUCK - .1, [-1.45, -2.65, -3.3], up([-1.4, -3.05, 0], .1), 1150 * fk],
      [T_FACE - .05, [-1.28, -3.34, -1.35], [-1.4, -3.4, .55], 1300 * fk],
      [T_ANOTHER - .1, [-2.6, -3.32, -1.38], [-2.73, -3.4, .55], 1300 * fk],
      [T_ARMY - .1, [-2.78, -3.3, -1.5], [-2.9, -3.42, .55], 1290 * fk],
      [T_EIGHT, [-4.8, -2.6, -6.0], up([-8.5, -4.0, 9], .3), 1100 * fk],
      [T_COUNTING + .1, [-9.0, -2.4, -6.4], up([-13, -4.0, 10], .3), 1100 * fk],
      [T_DISTINCT + .2, [-13.0, -2.2, -6.3], up([-17, -3.9, 10], .3), 1100 * fk],
      [T_STANDING, [-10.4, 1.2, -7.9], up([-14, -1.35, 12], 2.8), 1150 * fk],
      [T_STANDING + .8, [-6.8, 1.12, -4.1], up([-27, -1, 18.5], 2.2), 1450 * fk],
      [T_STANDING + 1.5, [-2.6, 1.06, .2], up([-59.5, -.3, 19.2], -.2), 2100 * fk],
      [T_STANDING + 1.85, [-.6, 1.08, 2.9], up([-247, 2, 47], -1), 2700 * fk],
      [T_TOMB + 1.0, [1.5, 1.12, 6.2], up([-1500, 20, 150], -4), 3600 * fk],
      [T_RIVERS, [2.3, 1.15, 7.6], up([-1500, 23, 150], -5), 4300 * fk],
      [DUR + .8, [2.6, 1.17, 8.1], up([-1500, 26, 150], -5), 5400 * fk],
    ];
  };
  let SPL = null;
  const spline = K => { const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])])); const e = [0, 1, 2].map(j => mk(k => k[1][j])), g = [0, 1, 2].map(j => mk(k => k[2][j])), f = mk(k => Math.log(k[3])); return t => ({ e: e.map(s => s(t)), g: g.map(s => s(t)), f: Math.exp(f(t)) }); };
  const keyed = t => (SPL || (SPL = spline(KEYS())))(t);

  const TY0 = T_DISTINCT + .2, TY1 = TY0 + 3.25, T0 = T_STANDING, TP = T0 + 1.1, T2 = T0 + 2.95, TL = T0 + 2.85, TEND = DUR + .8;
  const S5 = u => { u = clamp(u); return u * u * u * (u * (6 * u - 15) + 10); };
  const I5 = u => { u = clamp(u); return u * u * u * u * (u * (u - 3) + 2.5); };
  const herm = (t, a, b, pa, pb, va, vb) => { const h = b - a, u = clamp((t - a) / h), u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * pa + (u3 - 2 * u2 + u) * h * va + (3 * u2 - 2 * u3) * pb + (u3 - u2) * h * vb; };
  const view = (e, g) => { const d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]]; return [Math.atan2(d[0], d[2]), Math.atan2(d[1], Math.hypot(d[0], d[2]))]; };
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const cr = (p0, p1, p2, p3, u) => {
    const t1 = Math.sqrt(Math.max(1e-6, dist(p0, p1))), t2 = t1 + Math.sqrt(Math.max(1e-6, dist(p1, p2))), t3 = t2 + Math.sqrt(Math.max(1e-6, dist(p2, p3))), t = t1 + (t2 - t1) * u;
    const L = (a, b, ta, tb) => a.map((x, j) => ((tb - t) * x + (t - ta) * b[j]) / (tb - ta));
    const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
    return L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2);
  };
  let TURN = null;
  function turnSet() {
    const k0 = keyed(T0), ka = keyed(T0 - .01), kb = keyed(T0 + .01), ky = keyed(TY0);
    const v0 = dist(ka.e, kb.e) / .02, dir = [0, 1, 2].map(j => (kb.e[j] - ka.e[j]) / (v0 * .02));
    const P = [k0.e, k0.e.map((x, j) => x + dir[j]), [-6.8, 1.12, -4.1], [-2.6, 1.06, .2], [-.6, 1.08, 2.9], [1.5, 1.12, 6.2], [2.6, 1.17, 8.1]], n = P.length;
    const Q = [P[0].map((x, j) => x - 3 * dir[j]), ...P, P[n - 1].map((x, j) => x + .5 * (P[n - 1][j] - P[n - 2][j]))], pts = [], cum = [0];
    for (let i = 1; i < Q.length - 2; i++) for (let s = 0; s < 40; s++) pts.push(cr(Q[i - 1], Q[i], Q[i + 1], Q[i + 2], s / 40));
    pts.push(P[n - 1]);
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    const Lp = cum[cum.length - 1], h1 = TP - T0, h2 = T2 - TP, h3 = TEND - T2, v2 = .5;
    const vp = (Lp - v0 * h1 / 2 - v2 * h2 / 2 - v2 * h3 / 2) / (h1 / 2 + h2 / 2);
    const sAt = t => t <= TP ? v0 * (t - T0) + (vp - v0) * h1 * I5((t - T0) / h1)
      : t <= T2 ? (v0 + vp) / 2 * h1 + vp * (t - TP) + (v2 - vp) * h2 * I5((t - TP) / h2)
      : (v0 + vp) / 2 * h1 + (vp + v2) / 2 * h2 + v2 * (t - T2) - v2 * h3 * I5((t - T2) / h3);
    const at = t => {
      const s = clamp(sAt(t), 0, Lp); let lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
      const u = (s - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo]); return pts[lo].map((x, j) => x + (pts[hi][j] - x) * u);
    };
    const E = P[n - 1], gM = up([-1500, 20, 150], -4), gE = up([-1500, 26, 150], -5);
    const p0 = view(k0.e, k0.g)[1], r0 = (view(kb.e, kb.g)[1] - view(ka.e, ka.g)[1]) / .02;
    const lnM = Math.log(3800 * fk), lnE = Math.log(5400 * fk);
    return {
      at, vp, y0: view(ky.e, ky.g)[0], yE: view(E, gM)[0], p0, r0, pM: view(E, gM)[1], pE: view(E, gE)[1],
      lf0: Math.log(k0.f), rf0: (Math.log(kb.f) - Math.log(ka.f)) / .02, lnM, lnE, rM: (lnE - lnM) / (TEND - TL),
    };
  }
  function turn(t, k) {
    const T = TURN || (TURN = turnSet()), yaw = T.y0 + (T.yE - T.y0) * S5((t - TY0) / (TY1 - TY0));
    let e = k.e, f = k.f, pitch;
    if (t <= T0) pitch = view(k.e, k.g)[1];
    else {
      e = T.at(t);
      pitch = t < TY1 ? herm(t, T0, TY1, T.p0, T.pM, T.r0, 0) : T.pM + (T.pE - T.pM) * S5((t - TY1) / (TEND - TY1));
      f = Math.exp(t < TL ? herm(t, T0, TL, T.lf0, T.lnM, T.rf0, T.rM) : herm(t, TL, TEND, T.lnM, T.lnE, T.rM, 0));
    }
    const c = Math.cos(pitch);
    return { e, g: [e[0] + 40 * Math.sin(yaw) * c, e[1] + 40 * Math.sin(pitch), e[2] + 40 * Math.cos(yaw) * c], f };
  }
  const keyAt = F.stage3d.calm(t => { const k = keyed(t); return t > TY0 ? turn(t, k) : k; }, DUR);
  const camAt = t => { const k = keyAt(t); return AR.cam(k.e, k.g, k.f, W, H); };

  const BUF = new Map();
  const buf = i => { const key = W + 'x' + H + ':' + i; if (!BUF.has(key)) BUF.set(key, F.canvas(W, H)); return BUF.get(key); };
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function frame(ctx, t, cam, o = {}) {
    const st = { ...stateAt(t), ...(o.st || {}) }, k = st.paper;
    if (k <= 0) AR.frame(ctx, LB, cam, st);
    else if (k >= 1) AR.frame(ctx, PA, cam, st);
    else {
      const [ca, xa] = buf(0), [cb, xb] = buf(1);
      clean(xa); AR.frame(xa, LB, cam, st); clean(xb); AR.frame(xb, PA, cam, st);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ca, 0, 0); ctx.globalAlpha = k; ctx.drawImage(cb, 0, 0); ctx.restore();
    }
    if (!o.noText) {
      F.impact(PA, ctx, t, { lines: [{ text: '1974', t0: T_1974 + .05, size: M45 ? 130 : 150, color: '#f6efe2' }], x: M45 ? .5 : .26, y: M45 ? .84 : .6, out: T_STRUCK - .3, accent: '#d9a443', minW: M45 ? 420 : 520 });
      F.impact(PA, ctx, t, { lines: [{ text: '8,000', t0: T_EIGHT + .02, size: M45 ? 150 : 170, color: '#f6efe2' }], x: .5, y: M45 ? .12 : .15, out: T_STANDING - .3, accent: '#d9a443', minW: M45 ? 460 : 560 });
    }
    if (!o.noGrade) (k < .5 ? LB : PA).grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  const FALLS = () => AR.walkerFalls().map(ft => ft - D37()).filter(ft => ft > .05 && ft < T_STRUCK);
  F.scene('seq-38', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: T_1974 + .05, type: 'impact', size: .22, g: .16, noSnap: true },
      ...FALLS().map(ft => ({ t: ft, type: 'footstep', g: .03 })),
      { t: T_DIGGING + .05, type: 'thud', g: .07 }, { t: T_DIGGING + .55, type: 'thud', g: .06 }, { t: T_WELL + .25, type: 'thud', g: .07 },
      { t: T_STRUCK, type: 'clunk', f: 380, g: .12, noSnap: true }, { t: T_STRUCK + .01, type: 'clink', f: 1250, g: .05, noSnap: true },
      { t: T_FACE - .05, type: 'shimmer', g: .05 }, { t: T_ANOTHER - .05, type: 'shimmer', g: .045 },
      { t: T_ARMY - .2, type: 'rumble', dur: 3.4, g: .12 }, { t: T_ARMY - .1, type: 'whoosh', f0: 120, f1: 50, dur: 1.6, g: .06 },
      { t: T_EIGHT, type: 'impact', size: .32, g: .2, noSnap: true },
      { t: T_COUNTING, type: 'rumble', dur: 1.8, g: .06 },
      { t: T_EVERY - .1, type: 'riser', dur: T_DISTINCT + .6 - T_EVERY, f0: 600, f1: 1400, g: .025 },
      { t: T_STANDING - .1, type: 'whoosh', f0: 150, f1: 260, dur: 1.6, g: .05 },
      { t: T_TOMB, type: 'hum', dur: 2.6, g: .04 },
      { t: T_RIVERS - .1, type: 'shimmer', g: .06 }, { t: T_FLOWING, type: 'riser', dur: 1.2, f0: 200, f1: 420, g: .03 },
    ],
    api: { DUR, camAt, keyAt, stateAt, frame },
  });
})();
