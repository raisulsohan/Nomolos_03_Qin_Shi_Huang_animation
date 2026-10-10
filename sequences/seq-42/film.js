(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, GL = F.globe, PC = F.pacific, { clamp, smooth, lerp, easeIO, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-42'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H), FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI, D = PI / 180, PL = PC.PLACES, SC = W / 1920;
  const A41 = () => F.getScene('seq-41').api, D41 = () => A41().DUR;

  const T_1941 = 0.13, T_EMPIRE = 1.31, T_FOUND = 1.76, T_CORNERED = 2.58, T_STRANGLED = 3.43, T_EMBARGOES = 4.25;
  const T_RUNNING = 4.92, T_OIL = 5.97, T_TIME = 6.5;
  const T_PLANNERS = 7.32, T_SOLUTION = 8.62, T_CLEAN = 10, T_FATAL = 10.36, T_EMPERORS = 11.56, T_ELIXIR = 12.19;
  const T_ONE = 13.21, T_BLOW = 14.14, T_ONE2 = 15.06, T_FORCE = 15.26, T_THEM = 16.45, T_AND = 17.13, T_NEGOTIATE = 18.24;
  const T_ON = 19.39, T_QUIET = 19.57, T_DECEMBER = 20.78, T_SAILED = 22.23;
  const T_IT = 24.09, T_COMPLETELY = 24.82;
  const T_EVERY = 25.94, T_BURNED = 26.88;
  const T_STANDS = 28.28, T_SELF = 29.79, T_VICTORY = 30.7, T_CENTURY = 32.16;
  const T_BACK = T_SELF, T_SNAP = T_CENTURY - .05;

  const XI = () => A41().XIANYANG;
  const slerpLL = (a, b, k) => { if (k <= 0) return a.slice(); if (k >= 1) return b.slice(); const p = GL.at(a[0], a[1], 0), q = GL.at(b[0], b[1], 0), o = Math.acos(clamp(GL.dot(p, q), -1, 1)); if (o < 1e-6) return a.slice(); const s0 = Math.sin((1 - k) * o) / Math.sin(o), s1 = Math.sin(k * o) / Math.sin(o), v = [p[0] * s0 + q[0] * s1, p[1] * s0 + q[1] * s1, p[2] * s0 + q[2] * s1]; return [Math.atan2(v[0], -v[2]) / D, Math.asin(clamp(v[1], -1, 1)) / D]; };
  const angDist = (a, b) => Math.acos(clamp(GL.dot(GL.at(a[0], a[1], 0), GL.at(b[0], b[1], 0)), -1, 1)) / D;

  const RING_J = [134.2, 36.4], RING_T = [136.6, 37.6], RHO_J = 15.5, RHO_T = 10.8, RHO_SHUT = 8.6;
  function ringAt(t) {
    const r41 = A41().rhoAt(D41() + Math.min(t, 2.2)), mv = ss(.35, T_CORNERED + .1, t), tg = ss(T_STRANGLED - .05, T_EMBARGOES + .45, t), sh = ss(T_SNAP - .05, T_SNAP + .3, t);
    const c = slerpLL(slerpLL(A41().RING_LL, RING_J, easeIO(mv)), RING_T, tg);
    const rho = lerp(lerp(lerp(r41, RHO_J, ss(.6, T_CORNERED + .1, t)), RHO_T, tg), RHO_SHUT, sh);
    const flash = bump(t, T_CORNERED - .05, T_CORNERED + .05, T_CORNERED + .15, T_CORNERED + .6) + .7 * bump(t, T_STRANGLED, T_STRANGLED + .1, T_EMBARGOES, T_EMBARGOES + .6) + bump(t, T_SNAP - .02, T_SNAP + .05, T_SNAP + .2, T_SNAP + .8);
    const open = ss(T_AND + .1, T_NEGOTIATE + .5, t) * (1 - sh);
    return { c, rho, a: 1, flash, open, wk: 1 + .35 * tg + .6 * sh, col: S3.mix(S3.mix('#dde4f2', '#ffffff', clamp(flash)), '#b9a07c', .55 * sh), dark: sh > .01 ? `rgba(60,14,10,${.85 * sh})` : undefined };
  }

  const STOPS = {};
  const stopAt = key => { if (STOPS[key] == null) { const P = PC.path(F.pacificData.LANES[key], .25); let d = 0; for (; d < P.L; d += .05) if (angDist(PC.pathAt(P, d).ll, RING_T) < RHO_T) break; STOPS[key] = d; } return STOPS[key]; };

  const CK_S = .021;
  const CK_T0 = T_RUNNING - .55, CK_T1 = T_RUNNING + .3, CK_SINK = 3.05, CK_C = [.35, 0, -.2];
  const clockUp = t => 1 - Math.pow(1 - clamp((t - CK_T0) / (CK_T1 - CK_T0)), 3);
  const HANG = .16, FALL = Math.sqrt(2 * (.55 - .2) / 9.8) * 1.6;
  const DROPS = (() => { const last = T_TIME + .05 - HANG - FALL, out = [last]; let dt = .9; while (out[0] - dt > T_RUNNING - .1) { out.unshift(out[0] - dt); dt = Math.max(.22, dt * .72); } return out; })();
  const oilLevel = t => 1 - .9 * ss(T_RUNNING, T_TIME + .3, t);
  const rodTop = t => 2.9 - 1.2 * ss(T_RUNNING, T_TIME + .3, t);

  const CUP_S = .021, CUP_M = .14;
  const CUP_T0 = T_SOLUTION - .98, CUP_T1 = T_SOLUTION + .02;
  const cupUp = t => 1 - Math.pow(1 - clamp((t - CUP_T0) / (CUP_T1 - CUP_T0)), 2.5);
  const HIGH = new Map();
  const cupHigh = () => {
    const key = W + 'x' + H;
    if (!HIGH.has(key)) { const lc = PC.local(camAt(CUP_T0), PL.TOKYO[0], PL.TOKYO[1], rotAt(CUP_T0), CUP_S); let h = 1.5; for (; h < 24; h += .25) { const q = lc.proj([0, h, 0]); if (!q || q[1] < -.03 * H) break; } HIGH.set(key, h); }
    return HIGH.get(key);
  };

  let PLANP = null; const planP = () => PLANP || (PLANP = PC.path(F.pacificData.PLAN, .25));
  const arrowU = t => easeIO(clamp((t - T_ONE - .1) / (T_THEM - T_ONE - .1)));
  let COURSEP = null; const courseP = () => COURSEP || (COURSEP = PC.path(F.pacificData.COURSE, .2));
  const carrierAt = (i, t) => {
    const P = courseP(), back = [0, .55, 1.1, .28, .83, 1.38][i] + .5, side = i < 3 ? -.18 : .18;
    const d = P.L - back - 2.6 * (1 - ss(T_ON - 1.5, T_COMPLETELY, t)) + .3 * ss(T_COMPLETELY, DUR, t);
    const a = PC.pathAt(P, d);
    return { ll: [a.ll[0] + side * Math.cos(a.hd) / Math.cos(a.ll[1] * D), a.ll[1] - side * Math.sin(a.hd)], hd: a.hd };
  };

  const SEA_CLOUDS = Array.from({ length: 9 }, (_, i) => [-160.6 + 5.6 * PC.hash(i, 31), 22.6 + 9.5 * PC.hash(i, 32), .0022 + .0028 * PC.hash(i, 33), .22 + .3 * PC.hash(i, 34), 40 + i]);
  const dayK = t => ss(.05, 1.3, t) * (1 - ss(T_QUIET - .1, T_DECEMBER + .2, t));
  function stateAt(t) {
    const s41 = A41().stateG(D41() + Math.min(t, 2.5));
    return {
      rot: rotAt(t), night: 1 - dayK(t), clouds: s41.clouds, cloudA: .92 * (1 - .7 * ss(1, 4, t)),
      ring: ringAt(t), glint: { c: A41().CUP_LL, a: .8 * (1 - ss(.2, 1.4, t)) },
      empire: ss(T_EMPIRE - .1, T_EMPIRE + .8, t), empLit: bump(t, T_EMPIRE, T_EMPIRE + .3, T_FOUND, T_CORNERED + .4) + .5 * bump(t, T_SNAP - .05, T_SNAP + .1, T_SNAP + .3, DUR + 1),
      lanes: ss(.9, 1.8, t), stop: ss(T_EMBARGOES, T_EMBARGOES + .8, t),
      tokyo: ss(T_PLANNERS - .1, T_PLANNERS + .4, t) * (1 - .6 * ss(T_ON, T_QUIET + .5, t)),
      fleet: ss(T_ONE2 - .3, T_FORCE + .2, t), fleetLit: bump(t, T_FORCE - .05, T_FORCE + .3, T_THEM + .3, T_NEGOTIATE),
      smoke: ss(T_BURNED - .2, T_STANDS + .6, t), dawn: ss(T_QUIET, T_SAILED + .5, t),
    };
  }

  const fk = M45 ? .82 : 1;
  const KEYS = [
    [1.4, [124, 27.5, 1.86], [127.5, 33], 1060],
    [2.7, [130.5, 24.5, 1.62], [133.5, 34.2], 1060],
    [4.2, [134.5, 26, 1.36], [136.6, 35.2], 1080],
    [5.6, [136.8, 28.6, 1.13], [138.3, 35.6], 1100],
    [7.3, [137.7, 30.0, 1.088], [138.8, 35.9], 1120],
    [10.0, [138.4, 30.6, 1.078], [139.05, 36.0], 1150],
    [12.6, [138.8, 30.8, 1.078], [139.2, 36.0], 1160],
    [14.6, [148, 29, 1.6], [156, 36], 1090],
    [16.2, [163, 22.5, 2.15], [176.5, 31], 1060],
    [19.0, [165.5, 22.5, 2.22], [179, 31], 1060],
    [20.3, [-177, 18.5, 1.82], [-164, 29], 1070],
    [21.4, [-161, 20.6, 1.38], [-159.2, 30], 1090],
    [22.5, [-155.2, 26.4, 1.072], [-158.6, 30.2], 1150],
    [23.8, [-155.9, 29.9, 1.022], [-158.8, 29.6], 1200],
    [24.5, [-156.0, 28.6, 1.019], [-158.4, 27.6], 1200],
    [25.9, [-155.4, 24.4, 1.02], [-157.9, 21.6], 1180],
    [28.0, [-156.75, 22.25, 1.012], [-157.97, 21.42], 1220],
    [29.4, [-156.2, 22.1, 1.075], [-158.6, 22.2], 1180],
    [30.7, [-156.6, 21.5, 1.42], [-163, 25.5], 1150],
    [32.1, [-159.5, 19.8, 2.5], [-175, 30.5], 1230],
    [DUR, [-160.5, 19.5, 2.85], [-178, 31.2], 1250], [DUR + .8, [-160.8, 19.4, 2.9], [-178.6, 31.3], 1255],
    [DUR + 6, [-161.8, 19.1, 3.05], [-179.6, 31.5], 1268],
  ];
  const ROT41 = () => A41().ROT;
  const toLL = (p, rot) => { const r = Math.hypot(p[0], p[1], p[2]); return [Math.atan2(p[0], -p[2]) / D - rot, Math.asin(clamp(p[1] / r, -1, 1)) / D, r]; };
  const unwrapCol = (vals) => { const out = [vals[0]]; for (let i = 1; i < vals.length; i++) { let v = vals[i]; while (v - out[i - 1] > 180) v -= 360; while (v - out[i - 1] < -180) v += 360; out.push(v); } return out; };
  let SPL = null;
  function params(t) {
    if (!SPL) {
      const r41 = ROT41(), P = (k, tt) => { const e = toLL(k.e, r41), g = toLL(k.g, r41); return [tt, e[0], e[1], Math.log(e[2] - 1), g[0], g[1], Math.log(k.f)]; };
      const K = [P(A41().keyG(D41() - .5), -.5), P(A41().keyG(D41()), 0), P(A41().keyG(D41() + .5), .5), ...KEYS.map(([tt, E, T, f]) => [tt, E[0], E[1], Math.log(E[2] - 1), T[0], T[1], Math.log(f * fk)])];
      const cols = [1, 2, 3, 4, 5, 6].map(j => K.map(k => k[j])); cols[0] = unwrapCol(cols[0]); cols[3] = unwrapCol(cols[3]);
      SPL = cols.map(c => Mo.monotone(K.map((k, i) => [k[0], c[i]])));
    }
    return SPL.map(s => s(t));
  }
  const ZW = [-2, -1.5, -1, -.5, 0, .5, 1, 1.5, 2], WW = ZW.map(z => Math.exp(-z * z / 2)), SW = WW.reduce((a, b) => a + b, 0);
  const paramsCalm = t => { const wd = Math.min(.18, t / 2.2, (DUR - t) / 2.2); if (!(wd > 1e-4)) return params(t); const out = [0, 0, 0, 0, 0, 0]; ZW.forEach((z, i) => { const p = params(t + z * wd); for (let j = 0; j < 6; j++) out[j] += WW[i] / SW * p[j]; }); return out; };
  const keyE = t => { const [le, pe, he, lg, pg, lf] = paramsCalm(t), r = ROT41(); return { e: GL.at(le, pe, r, 1 + Math.exp(he)), g: GL.at(lg, pg, r, 1), f: Math.exp(lf) }; };
  const rotAt = () => ROT41();
  const keyAt = t => t <= 0 ? A41().keyG(D41()) : keyE(t);
  const camAt = t => PC.globeCam(keyAt(t), W, H);
  const at = (lon, lat, rot, r = 1) => GL.at(lon, lat, rot, r);

  function inside(x, cam, st, t) {
    if (st.lanes > .01) for (const key of ['US', 'INDIES']) PC.lane(x, cam, st.rot, key, t, { a: st.lanes, stopAt: stopAt(key), stop: st.stop, tStop: T_EMBARGOES, v: 3.2, gap: 2.2, dark: st.stop });
    PC.empire(x, cam, st.rot, { rise: st.empire, lit: st.empLit, night: st.night });
    clockGround(x, cam, st.rot, t); cupGround(x, cam, st.rot, t);
  }

  const ringPts = (lc, c, r, n = 40) => { const out = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, q = lc.proj([c[0] + r * Math.cos(a), 0, c[2] + r * Math.sin(a)]); if (!q) return null; out.push(q); } return out; };
  const ringBox = (lc, c, r) => { const P = ringPts(lc, c, r, 12); if (!P) return null; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const q of P) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return x1 - x0 > 1 ? [x0, y0, x1, y1] : null; };
  function groundGlow(x, lc, c, r, col, a) {
    if (a <= .003) return; const B = ringBox(lc, c, r); if (!B) return;
    const rx = (B[2] - B[0]) / 2; PC.glow(x, (B[0] + B[2]) / 2, (B[1] + B[3]) / 2, rx, col, a, (B[3] - B[1]) / 2 / rx);
  }
  let SHSPR = null;
  function groundShade(x, lc, c, r, a) {
    if (a <= .003) return; const B = ringBox(lc, c, r); if (!B) return;
    if (!SHSPR) { const [cv, sx] = F.canvas(64, 64), g = sx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(6,8,18,1)'); g.addColorStop(.45, 'rgba(6,8,18,.62)'); g.addColorStop(1, 'rgba(6,8,18,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 64, 64); SHSPR = cv; }
    x.save(); x.globalAlpha *= a; x.drawImage(SHSPR, B[0], B[1], B[2] - B[0], B[3] - B[1]); x.restore();
  }
  function groundRing(x, lc, c, r, col, a, px) {
    if (a <= .003) return; const P = ringPts(lc, c, r); if (!P) return;
    x.save(); x.globalAlpha *= a; x.strokeStyle = col; x.lineWidth = Math.max(1, px); x.beginPath(); P.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.stroke(); x.restore();
  }
  const CRACKS = (() => {
    const walk = (seed, p0, h0, L, n) => { const pts = [[p0[0], 0, p0[1]]], hs = [h0]; let h = h0, p = p0.slice(); for (let j = 1; j <= n; j++) { h += .75 * (PC.hash(seed + j, 63) - .5); p = [p[0] + L / n * Math.cos(h), p[1] + L / n * Math.sin(h)]; pts.push([p[0], 0, p[1]]); hs.push(h); } return { pts, hs }; };
    const out = [];
    for (let i = 0; i < 6; i++) {
      const a0 = i / 6 * TAU + .7 * (PC.hash(i, 61) - .5), m = walk(i * 13, [CK_C[0] + .5 * Math.cos(a0), CK_C[2] + .5 * Math.sin(a0)], a0, 1.1 + 1.1 * PC.hash(i, 62), 9);
      out.push({ pts: m.pts, w: 1, d0: 0 });
      const k = 3 + Math.floor(3 * PC.hash(i, 64)), q = m.pts[k];
      out.push({ pts: walk(i * 13 + 7, [q[0], q[2]], m.hs[k] + (PC.hash(i, 65) > .5 ? .6 : -.6), .35 + .45 * PC.hash(i, 66), 4).pts, w: .6, d0: k / 9 });
    }
    return out;
  })();
  function clockGround(x, cam, rot, t) {
    const lit = ss(CK_T0 - .35, CK_T0 + .05, t) * (1 - ss(CK_T1 + .1, CK_T1 + 1.1, t));
    const grow = ss(CK_T0 - .3, CK_T0 + .2, t), cr = grow * (1 - ss(CK_T1 + .2, CK_T1 + 1.2, t)), sw = (t - CK_T1 + .06) / 1.0;
    if (lit < .003 && cr < .003 && !(sw > 0 && sw < 1)) return;
    const lc = PC.local(cam, PL.CLOCK[0], PL.CLOCK[1], rot, CK_S);
    groundGlow(x, lc, CK_C, 2.4, '#ff9a3a', .5 * lit); groundGlow(x, lc, CK_C, 1.1, '#ffd28a', .65 * lit);
    if (cr > .003) {
      x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const crk of CRACKS) {
        const g = clamp((grow - crk.d0) / (1 - crk.d0)); if (g <= 0) continue;
        const P = crk.pts.map(p => lc.proj(p)); if (P.some(q => !q)) continue;
        const N = P.length - 1, n = N * g;
        for (let j = 0; j < N && j < n; j++) {
          const f = Math.min(1, n - j), a = P[j], b = P[j + 1], bx = lerp(a[0], b[0], f), by = lerp(a[1], b[1], f), wk = crk.w * (1 - .75 * j / N);
          x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(bx, by);
          x.globalCompositeOperation = 'lighter'; x.globalAlpha = .38 * cr; x.strokeStyle = '#ff9440'; x.lineWidth = 9 * wk * SC; x.stroke();
          x.globalCompositeOperation = 'source-over'; x.globalAlpha = cr; x.strokeStyle = '#ffdcaa'; x.lineWidth = Math.max(.8, 2.6 * wk * SC); x.stroke();
        }
      }
      x.restore();
    }
    if (sw > 0 && sw < 1) groundRing(x, lc, CK_C, 1.3 + 3.4 * (1 - Math.pow(1 - sw, 2.2)), '#ffc46a', .75 * Math.pow(1 - sw, 1.4), (3.2 - 1.8 * sw) * SC);
  }
  function cupGround(x, cam, rot, t) {
    const k = cupUp(t); if (k <= .002) return;
    const lc = PC.local(cam, PL.TOKYO[0], PL.TOKYO[1], rot, CUP_S);
    groundShade(x, lc, [0, 0, 0], 1.2 + 1.1 * (1 - k), .55 * Math.pow(k, 1.5) * (1 - .4 * ss(CUP_T1, CUP_T1 + .6, t)));
    for (let j = 0; j < 3; j++) {
      const u = (t - CUP_T1 - .14 * j) / 1.0; if (u <= 0 || u >= 1) continue;
      groundRing(x, lc, [0, 0, 0], .7 + 3.2 * (1 - Math.pow(1 - u, 2.2)), '#e9eef8', .8 * (1 - .25 * j) * Math.pow(1 - u, 1.5), (2.6 - .7 * j - 1.2 * u) * SC);
    }
  }
  const DUST = [
    ...Array.from({ length: 16 }, (_, i) => ({ a: i / 16 * TAU + .35 * PC.hash(i, 71), t0: CK_T0 + .04 + .1 * PC.hash(i, 72), life: 1.3 + .4 * PC.hash(i, 79), d: 1 + 1.4 * PC.hash(i, 73), s: .8 + .5 * PC.hash(i, 74) })),
    ...Array.from({ length: 12 }, (_, i) => ({ a: i / 12 * TAU + .45 * PC.hash(i, 75), t0: CK_T1 - .1 + .06 * PC.hash(i, 76), life: 1.1 + .3 * PC.hash(i, 80), d: .7 + .9 * PC.hash(i, 77), s: .55 + .35 * PC.hash(i, 78) })),
  ];
  const dusty = t => t > CK_T0 && t < CK_T1 + 1.6;
  let DSPR = null;
  const dustSprite = () => { if (!DSPR) { const [c, x] = F.canvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(160,142,116,.9)'); g.addColorStop(.5, 'rgba(150,132,108,.45)'); g.addColorStop(1, 'rgba(140,124,100,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); DSPR = c; } return DSPR; };
  function dust(x, cam, rot, t, front) {
    const lc = PC.local(cam, PL.CLOCK[0], PL.CLOCK[1], rot, CK_S), dc = lc.depth(CK_C), out = [];
    for (const p of DUST) {
      const u = (t - p.t0) / p.life; if (u <= 0 || u >= 1) continue;
      const e = 1 - Math.pow(1 - u, 2.4), r = .7 + p.d * e, q = lc.proj([CK_C[0] + r * Math.cos(p.a), .08 + .5 * p.s * e, CK_C[2] + r * Math.sin(p.a)]);
      if (!q || (q[2] < dc) !== front) continue;
      out.push([q, (.2 + .5 * e) * p.s * q[3], .45 * Math.min(1, u * 8) * Math.pow(1 - u, 1.5)]);
    }
    out.sort((a, b) => b[0][2] - a[0][2]);
    const spr = dustSprite();
    for (const [q, r, a] of out) { x.globalAlpha = a; x.drawImage(spr, q[0] - 1.2 * r, q[1] - .85 * r, 2.4 * r, 1.7 * r); }
    x.globalAlpha = 1;
  }
  function rotFrame(lc, hd) {
    const sn = Math.sin(hd), cs = Math.cos(hd), R = p => [p[0] * sn + p[2] * cs, p[1], -p[0] * cs + p[2] * sn];
    const toCam = p => lc.toCam(R(p)), q = lc.pos, pos = [q[0] * sn - q[2] * cs, q[1], q[0] * cs + q[2] * sn], s = lc.frame.s;
    return { ...lc, toCam, pos, proj: p => { const cc = toCam(p); if (cc[2] < lc.near) return null; const o = lc.onScreen(cc); o[3] *= s; return o; }, depth: p => toCam(p)[2] };
  }
  const shipS = (cam, rot, ll, len, minPx) => len * PC.symK(cam, at(ll[0], ll[1], rot), len, minPx);
  function fleet(x, cam, st, t) {
    const lit = st.fleetLit, col = S3.mix(S3.mix('#b9b2a2', '#3a3a52', st.night), '#fff2cf', .7 * lit);
    const base = [-157.951, 21.3655], hd = 35 * D;
    const L = shipS(cam, st.rot, base, .00003, 16 * SC);
    x.save(); x.globalAlpha *= st.fleet;
    for (let i = 6; i >= 0; i--) {
      const step = 1.15 * L * i / D, ll = [base[0] + step * Math.sin(hd) / Math.cos(21.37 * D), base[1] + step * Math.cos(hd)];
      PC.ship(x, rotFrame(PC.local(cam, ll[0], ll[1], st.rot, L), hd), { len: 1, col });
    }
    x.restore();
  }
  function carrier(x, cam, st, c, t) {
    const far = ss(.06, .4, Math.hypot(...cam.pos) - 1), L = shipS(cam, st.rot, c.ll, .00026, lerp(96, 16, far) * SC);
    const lc = rotFrame(PC.local(cam, c.ll[0], c.ll[1], st.rot, L), c.hd), col = S3.mix('#5a5c6c', '#4a4e68', st.night);
    PC.wake(x, lc, { len: 1, a: .8 * (1 - far), px: 1.6 * SC });
    PC.ship(x, lc, { len: 1, carrier: true, col });
  }
  const shifted = (lc, dy) => { const sh = p => [p[0], p[1] + dy, p[2]]; return { ...lc, pos: [lc.pos[0], lc.pos[1] - dy, lc.pos[2]], toCam: p => lc.toCam(sh(p)), proj: p => lc.proj(sh(p)), depth: p => lc.depth(sh(p)) }; };
  function risen(lc, sink, fn) {
    if (sink <= 1e-4) return fn(lc);
    const lr = shifted(lc, -sink), G = sink, c0 = S3.clip, l0 = S3.line;
    const cut = pts => { const out = [], n = pts.length; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], ia = a[1] >= G, ib = b[1] >= G; if (ia) out.push(a); if (ia !== ib) { const u = (G - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * u, G, a[2] + (b[2] - a[2]) * u]); } } return out; };
    const onG = (a, b) => { const u = (G - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * u, G, a[2] + (b[2] - a[2]) * u]; };
    S3.clip = (cam, pts) => c0(cam, cam === lr ? cut(pts) : pts);
    S3.line = (x, cam, a, b) => { if (cam !== lr) return l0(x, cam, a, b); if (a[1] < G && b[1] < G) return false; return l0(x, cam, a[1] < G ? onG(a, b) : a, b[1] < G ? onG(a, b) : b); };
    try { return fn(lr); } finally { S3.clip = c0; S3.line = l0; }
  }
  function standing(x, cam, st, t) {
    const items = [], rot = st.rot;
    if (clockUp(t) > .002) items.push({ ll: PL.CLOCK, draw: () => {
      const lc = PC.local(cam, PL.CLOCK[0], PL.CLOCK[1], rot, CK_S), k = clockUp(t);
      risen(lc, CK_SINK * (1 - k), lr => PC.oilClock(x, lr, { level: oilLevel(t), rod: rodTop(t), basin: ss(T_RUNNING, T_TIME + .3, t), night: st.night > .5 }));
      if (k > .98) PC.oilDrops(x, lc, DROPS, t);
    } });
    if (cupUp(t) > .002) items.push({ ll: PL.TOKYO, draw: () => {
      const lc = PC.local(cam, PL.TOKYO[0], PL.TOKYO[1], rot, CUP_S), cold = ss(T_FATAL - .05, T_FATAL + .4, t) * (1 - ss(T_EMPERORS, T_ELIXIR + .3, t)), lift = cupHigh() * (1 - cupUp(t));
      PC.cupOn(x, lift > 1e-4 ? shifted(lc, lift) : lc, { m: CUP_M, fill: .82 - .5 * ss(T_ONE, T_BLOW + .6, t), liquid: S3.mix(S3.mix('#d8dee8', '#ffffff', bump(t, T_CLEAN - .05, T_CLEAN + .2, T_CLEAN + .4, T_FATAL)), '#6f7c96', cold), k: .8 });
    } });
    if (st.fleet > .01) items.push({ ll: [-157.955, 21.365], draw: () => fleet(x, cam, st, t) });
    if (t > T_ON - 1.6) for (let i = 0; i < 6; i++) { const c = carrierAt(i, t); items.push({ ll: c.ll, draw: () => carrier(x, cam, st, c, t) }); }
    const seen = PC.seenAt(cam);
    items.map(o => ({ o, p: at(o.ll[0], o.ll[1], rot) })).filter(e => seen(e.p) && cam.depth(e.p) > 0).sort((a, b) => cam.depth(b.p) - cam.depth(a.p)).forEach(e => e.o.draw());
  }
  function lights(ctx, cam, st, t) {
    const seen = PC.seenAt(cam), rot = st.rot;
    if (st.tokyo > .01) { const p = at(PL.TOKYO[0], PL.TOKYO[1], rot, 1.001); if (seen(p)) { const q = cam.proj(p); if (q) { PC.glow(ctx, q[0], q[1], 34 * SC, '#ffd27a', .8 * st.tokyo); PC.glow(ctx, q[0], q[1], 10 * SC, '#fff6e0', .9 * st.tokyo); } } }
    const gl = bump(t, T_CLEAN - .05, T_CLEAN + .15, T_CLEAN + .3, T_FATAL) + bump(t, T_ELIXIR - .05, T_ELIXIR + .15, T_ELIXIR + .4, T_ELIXIR + 1.0) + .6 * bump(t, T_ONE - .1, T_ONE + .05, T_ONE + .2, T_BLOW);
    if (gl > .01 && cupUp(t) > .5) { const lc = PC.local(cam, PL.TOKYO[0], PL.TOKYO[1], rot, CUP_S), q = lc.proj([0, 6.9 * CUP_M, 0]); if (q) PC.glow(ctx, q[0], q[1], Math.min(W * .1, 3 * CUP_M * q[3]), '#eef2ff', .8 * gl); }
    const ckL = bump(t, CK_T0 - .2, CK_T0 + .1, CK_T1 - .1, CK_T1 + .6);
    if (ckL > .01) { const q = PC.local(cam, PL.CLOCK[0], PL.CLOCK[1], rot, CK_S).proj(CK_C); if (q) PC.glow(ctx, q[0], q[1], 120 * SC, '#ffb04a', .4 * ckL, .5); }
    const cpL = bump(t, CUP_T1 - .04, CUP_T1 + .02, CUP_T1 + .1, CUP_T1 + .7);
    if (cpL > .01) { const q = PC.local(cam, PL.TOKYO[0], PL.TOKYO[1], rot, CUP_S).proj([0, 0, 0]); if (q) PC.glow(ctx, q[0], q[1], 100 * SC, '#eef3ff', .65 * cpL, .45); }
    if (st.fleetLit > .01) { const p = at(-157.955, 21.365, rot, 1.001); if (seen(p)) { const q = cam.proj(p); if (q) PC.glow(ctx, q[0], q[1], 46 * SC, '#fff2cf', .7 * st.fleetLit); } }
    const u = arrowU(t);
    if (u > 0) {
      const P = planP(), d1 = P.L * u, pts = PC.pathPts(P, rot, 1.0012, 0, d1), fade = 1 - .55 * ss(T_ON, T_QUIET + .6, t);
      PC.band(ctx, cam, pts, { w: .0042, wMin: 2 * SC, wMax: 5 * SC, seen, col: '#e6ecf8', glow: .5, a: fade });
      const a = PC.pathAt(P, d1), f = GL.frame(a.ll[0], a.ll[1], rot), fw = GL.add(GL.scl(f.north, Math.cos(a.hd)), GL.scl(f.east, Math.sin(a.hd))), sd = GL.add(GL.scl(f.east, Math.cos(a.hd)), GL.scl(f.north, -Math.sin(a.hd)));
      const tip = GL.at(a.ll[0], a.ll[1], rot, 1.0012), qt = cam.proj(tip);
      if (seen(tip) && qt) {
        const hk = Math.min(1, 36 * SC / (.032 * qt[3])), hl = .032 * hk, hw = .015 * hk, b0 = GL.add(tip, GL.scl(fw, -hl)), tri = [GL.add(tip, GL.scl(fw, .25 * hl)), GL.add(b0, GL.scl(sd, hw)), GL.add(b0, GL.scl(sd, -hw))];
        const Q = tri.map(p => cam.proj(p)); if (Q.every(Boolean)) { ctx.save(); ctx.globalAlpha *= fade; ctx.beginPath(); Q.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = '#e6ecf8'; ctx.fill(); ctx.strokeStyle = 'rgba(14,16,30,.85)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      }
    }
    const sk = ss(T_IT - .1, T_COMPLETELY + .3, t);
    if (sk > 0 && sk < 1) { const P = planP(), d = lerp(P.L - 4.9, P.L, sk), a = PC.pathAt(P, d), p = at(a.ll[0], a.ll[1], rot, 1.0015); if (seen(p)) { const q = cam.proj(p); if (q) { PC.glow(ctx, q[0], q[1], 26 * SC, '#fff2d0', .9); PC.glow(ctx, q[0], q[1], 70 * SC, '#ffb34d', .35); } } }
    const bk = (t - T_BACK) / (T_SNAP - T_BACK);
    if (bk > 0 && bk < 1.05) {
      const P = planP(), u = easeIO(clamp(bk)), dH = P.L * (1 - u), dT = Math.min(P.L, dH + 9), a = 1 - ss(1, 1.05, bk);
      PC.band(ctx, cam, PC.pathPts(P, rot, 1.0016, dH, dT), { w: .006, wMin: 2.5 * SC, wMax: 6 * SC, seen, col: '#fff4dc', glow: .8, dark: false, a });
      const p = PC.pathAt(P, dH), q3 = at(p.ll[0], p.ll[1], rot, 1.0016); if (seen(q3)) { const q = cam.proj(q3); if (q) { PC.glow(ctx, q[0], q[1], 30 * SC, '#fff2d0', .95 * a); PC.glow(ctx, q[0], q[1], 80 * SC, '#ffb34d', .4 * a); } }
    }
    PL.TARGETS.forEach((ll, i) => {
      const t0 = T_EVERY + .08 + i * .085, k = ss(t0, t0 + .12, t); if (k <= 0) return;
      const p = at(ll[0], ll[1], rot, 1.0003); if (!seen(p)) return; const q = cam.proj(p); if (!q) return;
      const fl = .75 + .25 * Math.sin(t * 17 + i * 2.1) * Math.sin(t * 7.3 + i), pop = 1 + 1.2 * bump(t, t0, t0 + .05, t0 + .1, t0 + .4) + .6 * bump(t, T_BURNED, T_BURNED + .08, T_BURNED + .2, T_BURNED + .6);
      const r = clamp(.00055 * q[3], 7, 30) * SC * pop;
      PC.glow(ctx, q[0], q[1], r * 3.2, '#ff4a3d', .55 * k * fl); PC.glow(ctx, q[0], q[1], r * 1.2, '#ffb34d', .8 * k * fl); PC.glow(ctx, q[0], q[1], r * .45, '#fff3d6', .9 * k);
    });
  }
  function smokes(x, cam, st, t) {
    if (st.smoke <= .01) return;
    PL.TARGETS.forEach((ll, i) => {
      if (i % 2) return;
      const p = at(ll[0], ll[1], st.rot), Hh = .0012 * PC.symK(cam, p, .0012, 70 * SC), lc = PC.local(cam, ll[0], ll[1], st.rot, Hh);
      PC.smoke(x, lc, t, { h: 1, a: .9, grow: clamp(st.smoke * 1.15 - i * .03), seed: i * 3.1, col: S3.mix('#2a2430', '#0e0a12', st.night) });
    });
  }

  function worldIn(ctx, L, cam, st, t) {
    PC.world(ctx, L, cam, { ...st, inside: (x, c) => inside(x, c, st, t), over: (c2, cm) => {
      const DS = { rim: false, shadow: false, fibre: 0 };
      if (dusty(t)) L.sheet(c2, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => dust(x, cm, st.rot, t, false), DS);
      if (clockUp(t) > .002 || cupUp(t) > .002 || st.fleet > .01 || t > T_ON - 1.6) L.sheet(c2, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => standing(x, cm, st, t), { rimColor: '#ffd9a0', rimAlpha: .55 * st.night, glow: .1 * st.night, glowColor: '#ffae4a', glowBlur: 8, fibre: .2, flatShadow: [6, 9, 10, .4] });
      if (dusty(t)) L.sheet(c2, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => dust(x, cm, st.rot, t, true), DS);
      if (st.smoke > .01) L.sheet(c2, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => smokes(x, cm, st, t), { rimColor: '#ffb87a', rimAlpha: .5, glow: .1, glowColor: '#ff8a4a', glowBlur: 10, fibre: .3 });
      if (t > 19.3) L.sheet(c2, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => PC.clouds(x, cm, SEA_CLOUDS, { rot: st.rot, col: '#272548', a: ss(19.3, 20.4, t) }), { rimColor: '#ffb27a', rimAlpha: .6, glow: .08, glowColor: '#ff9a5a', glowBlur: 8, fibre: .3 });
    }, lights: (c2, cm) => lights(c2, cm, st, t) }, t);
  }
  const BUF = new Map(), buf = () => { const key = W + 'x' + H; if (!BUF.has(key)) BUF.set(key, F.canvas(W, H)); return BUF.get(key); };
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function frame(ctx, t, cam, o = {}) {
    const st = stateAt(t), k = dayK(t);
    if (k <= 0) { worldIn(ctx, LB, cam, { ...st, night: 1 }, t); if (!o.noGrade) LB.grade(ctx, GT0 + t); }
    else if (k >= 1) { worldIn(ctx, FL, cam, { ...st, night: 0 }, t); if (!o.noGrade) FL.grade(ctx, GT0 + t); }
    else {
      worldIn(ctx, LB, cam, { ...st, night: 1 }, t); if (!o.noGrade) LB.grade(ctx, GT0 + t);
      const [cv, x] = buf(); clean(x); worldIn(x, FL, cam, { ...st, night: 0 }, t); if (!o.noGrade) FL.grade(x, GT0 + t);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = k; ctx.drawImage(cv, 0, 0); ctx.restore();
    }
    F.impact(FL, ctx, t, { lines: [{ text: '1941', t0: T_1941 + .05, size: M45 ? 130 : 140, color: '#f6efe2' }], x: M45 ? .5 : .17, y: M45 ? .12 : .13, out: T_CORNERED + .2, accent: '#d9a443', minW: M45 ? 420 : 460 });
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-42', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .2, type: 'riser', dur: 1.0, f0: 120, f1: 300, g: .04 },
      { t: T_1941 + .05, type: 'impact', size: .22, g: .16, noSnap: true },
      { t: T_EMPIRE, type: 'thud', g: .08 }, { t: T_EMPIRE + .1, type: 'hum', dur: 1.4, g: .03 },
      { t: T_CORNERED, type: 'clunk', f: 500, g: .07, noSnap: true },
      { t: T_STRANGLED, type: 'riser', dur: T_EMBARGOES - T_STRANGLED + .3, f0: 200, f1: 420, g: .04 }, { t: T_EMBARGOES + .3, type: 'clunk', f: 700, g: .07, noSnap: true },
      { t: CK_T0 - .3, type: 'rumble', dur: CK_T1 - CK_T0 + .7, g: .07 }, { t: CK_T1 - .12, type: 'thud', g: .07 },
      ...DROPS.map(d => ({ t: d + HANG + FALL, type: 'drip', g: .08, noSnap: true })),
      { t: T_PLANNERS - .1, type: 'riser', dur: .7, f0: 260, f1: 600, g: .035 },
      { t: CUP_T0, type: 'whoosh', f0: 700, f1: 220, dur: CUP_T1 - CUP_T0, g: .035 }, { t: CUP_T1 - .02, type: 'clunk', f: 380, g: .07, noSnap: true }, { t: T_CLEAN, type: 'shimmer', g: .05 },
      { t: T_FATAL, type: 'impact', size: .1, g: .05, noSnap: true }, { t: T_ELIXIR, type: 'shimmer', g: .06 },
      { t: T_ONE, type: 'whizz', g: .06 }, { t: T_ONE + .3, type: 'whoosh', f0: 300, f1: 90, dur: 2.6, g: .05 },
      { t: T_THEM, type: 'impact', size: .2, g: .12, noSnap: true },
      { t: T_NEGOTIATE, type: 'whoosh', f0: 500, f1: 900, dur: .6, g: .03 },
      { t: T_QUIET - .2, type: 'whoosh', f0: 160, f1: 60, dur: 2.0, g: .05 }, { t: T_SAILED - .2, type: 'hum', dur: 1.8, g: .035 },
      { t: T_IT, type: 'riser', dur: T_COMPLETELY - T_IT + .25, f0: 200, f1: 520, g: .05 },
      ...PL.TARGETS.map((_, i) => ({ t: T_EVERY + .08 + i * .085, type: 'impact', size: .05 + .02 * (i % 3), g: .05, noSnap: true })),
      { t: T_BURNED, type: 'impact', size: .16, g: .1, noSnap: true },
      { t: T_STANDS, type: 'rumble', dur: 2.6, g: .05 },
      { t: T_BACK - .05, type: 'whizz', g: .06 }, { t: T_BACK + .2, type: 'whoosh', f0: 120, f1: 380, dur: T_SNAP - T_BACK, g: .04 },
      { t: T_SNAP - .02, type: 'clunk', f: 900, g: .11, noSnap: true }, { t: T_SNAP + .1, type: 'shimmer', g: .04 },
    ],
    api: { DUR, camAt, keyAt, stateAt, frame, rotAt, camRate: t => PC.globeCam(keyE(t), W, H), camRef: t => { const k = keyE(t); return Math.hypot(k.e[0] - k.g[0], k.e[1] - k.g[1], k.e[2] - k.g[2]); } },
  });
})();
