(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, HB = F.harbour, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-19'), DUR = C.duration;
  const FL = F.look('flat', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SEQS = ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14', 'seq-15', 'seq-16', 'seq-17', 'seq-18'];
  const T0 = () => SEQS.reduce((s, id) => s + F.getScene(id).duration, 0);

  const T_COST = 1.38, T_MAR = 3.03, T_WORLD = 4.98, T_FAIRY = 6.05, T_TALE = 6.43;

  const DAWN = { sun: [.7, .2, .68].map(v => v / Math.hypot(.7, .2, .68)), sky: ['#7a8cad', '#d9b7a2', '#f4d6a6'], sea: ['#2a3c56', '#56677c', '#c9a98e'], land: '#a8845a', rock: '#7a6048', haze: 'rgba(244,214,166,', glow: '#ffe2b0' };
  const DECK = HB.DECK;
  const PIV = [138, DECK + 4.6, 0], ARM = 2.6, HANG = 1.9, PAN_R = .82;
  const AX = [Math.sin(128 * D2R), 0, Math.cos(128 * D2R)];
  const TILT0 = 17 * D2R;
  const wob = (t, t0, a, k) => t > t0 ? a * Math.exp(-k * (t - t0)) * Math.sin(9 * (t - t0)) : 0;
  const tiltAt = t => TILT0 + wob(t, T_COST, 1.8 * D2R, 1.6) - wob(t, T_FAIRY + .3, 1.2 * D2R, 1.4);
  const ends = th => [-1, 1].map(sg => [PIV[0] + sg * ARM * AX[0] * Math.cos(th), PIV[1] + sg * ARM * Math.sin(th), PIV[2] + sg * ARM * AX[2] * Math.cos(th)]);
  const panAt = (th, i) => { const e = ends(th)[i]; return [e[0], e[1] - HANG, e[2]]; };
  const BRZ = '#8a6a36';
  function balance(x, cam, t, D) {
    const th = tiltAt(t), E = ends(th), sun = D.sun;
    S3.box(x, cam, { x0: PIV[0] - .8, x1: PIV[0] + .8, y0: DECK, y1: DECK + .35, z0: -.8, z1: .8 }, { col: '#6e5634', light: sun, lo: .4 });
    S3.cyl(x, cam, [PIV[0], PIV[2]], .5, DECK + .35, DECK + .55, { col: BRZ, light: sun, lo: .4 });
    S3.bar(x, cam, [PIV[0], DECK + .5, PIV[2]], [PIV[0], PIV[1] + .15, PIV[2]], .13, { col: BRZ, light: sun, n: 8, lo: .4 });
    const pans = [0, 1].map(i => ({ i, d: cam.depth(panAt(th, i)) })).sort((a, b) => b.d - a.d);
    const panDraw = i => {
      const c = panAt(th, i), pc = cam.proj(c);
      x.strokeStyle = '#3a2a16'; x.lineWidth = Math.max(1, (pc ? pc[3] : 40) * .025); x.beginPath();
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .4; S3.line(x, cam, E[i], [c[0] + PAN_R * .92 * Math.cos(a), c[1] + .16, c[2] + PAN_R * .92 * Math.sin(a)]); }
      x.stroke();
      S3.cyl(x, cam, [c[0], c[2]], PAN_R * .7, c[1] - .12, c[1], { col: '#6e5228', light: sun, lo: .4, cap: false });
      S3.cyl(x, cam, [c[0], c[2]], PAN_R, c[1], c[1] + .16, { col: BRZ, light: sun, lo: .4, top: '#5a4220' });
      if (i === 0) heap(x, cam, c, t, D); else cloudOnPan(x, cam, c, t);
    };
    panDraw(pans[0].i);
    S3.bar(x, cam, E[0], E[1], .085, { col: '#9a7a40', light: sun, n: 8, lo: .4 });
    for (const e of E) S3.bar(x, cam, [e[0], e[1] - .06, e[2]], [e[0], e[1] + .06, e[2]], .16, { col: BRZ, light: sun, n: 8, lo: .4 });
    S3.bar(x, cam, [PIV[0] - .15 * AX[2], PIV[1], PIV[2] + .15 * AX[0]], [PIV[0] + .15 * AX[2], PIV[1], PIV[2] - .15 * AX[0]], .14, { col: '#6e5228', light: sun, n: 8, lo: .4 });
    panDraw(pans[1].i);
  }
  const HEAP = (() => { const R = F.rng(7919), o = []; for (let i = 0; i < 190; i++) { const r = Math.sqrt(R()) * .72, a = R() * TAU, y = .16 + .78 * Math.pow(1 - r / .72, .8) * (.7 + .3 * R()) + .04; o.push({ r, a, y, ingot: R() < .22, s: .075 + .035 * R() }); } return o.sort((a, b) => a.y - b.y); })();
  function heap(x, cam, c, t, D) {
    const glint = Math.exp(-Math.pow((t - T_COST - .2) / .35, 2));
    const cb = [c[0] + .3 * AX[2], c[1] + .16, c[2] - .3 * AX[0]];
    S3.box(x, cam, { x0: cb[0] - .3, x1: cb[0] + .3, y0: cb[1], y1: cb[1] + .42, z0: cb[2] - .22, z1: cb[2] + .22 }, { col: '#8a2a20', light: D.sun, lo: .45 });
    for (let k = 0; k < 5; k++) S3.cyl(x, cam, [c[0], c[2]], .72 - k * .14, c[1] + .16 + k * .15, c[1] + .31 + k * .15, { col: '#8e949c', light: D.sun, lo: .5 });
    for (const q of HEAP) {
      const p = cam.proj([c[0] + q.r * Math.cos(q.a), c[1] + q.y, c[2] + q.r * Math.sin(q.a)]); if (!p) continue;
      const r = q.s * p[3];
      if (q.ingot) { x.fillStyle = '#b9bfc8'; x.beginPath(); x.ellipse(p[0], p[1], r * 1.6, r * .75, 0, 0, PI); x.closePath(); x.fill(); x.fillStyle = '#eef1f4'; x.beginPath(); x.ellipse(p[0], p[1] - r * .2, r * .7, r * .38, 0, 0, TAU); x.fill(); }
      else { x.fillStyle = '#6e747c'; x.beginPath(); x.ellipse(p[0], p[1] + r * .15, r, r * .45, 0, 0, TAU); x.fill(); x.fillStyle = '#d8dce2'; x.beginPath(); x.ellipse(p[0], p[1], r, r * .45, 0, 0, TAU); x.fill(); }
    }
    if (glint > .02) { const p = cam.proj([c[0], c[1] + .5, c[2]]); if (p) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 1.2 * p[3]); g.addColorStop(0, `rgba(255,255,240,${.5 * glint})`); g.addColorStop(1, 'rgba(255,255,240,0)'); x.fillStyle = g; x.fillRect(p[0] - 1.2 * p[3], p[1] - 1.2 * p[3], 2.4 * p[3], 2.4 * p[3]); x.restore(); } }
  }
  const MIRD = (() => { const l = Math.hypot(HB.PENG[0] - PIV[0], HB.PENG[1] - PIV[2]); return [(HB.PENG[0] - PIV[0]) / l, (HB.PENG[1] - PIV[2]) / l]; })();
  const liftU = t => easeIO(clamp((t - T_FAIRY + .05) / 1.6));
  function cloudPos(c, t) { const u = liftU(t), d = 22 * u * u + 2.5 * u; return [c[0] + MIRD[0] * d, c[1] + .55 + 1.6 * u + 5 * u * u, c[2] + MIRD[1] * d]; }
  function cloudOnPan(x, cam, c, t) {
    const p = cam.proj(cloudPos(c, t)); if (!p) return;
    const s = p[3] * .021, bob = Math.sin(t * 1.4) * .03 * p[3];
    x.save(); x.translate(p[0], p[1] + bob); x.scale(s, s);
    const lobes = [[-10, -2, 8], [2, -7, 10], [14, -3, 8], [4, 2, 9]];
    x.fillStyle = '#f6f1e6'; for (const [cx, cy, r] of lobes) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
    x.beginPath(); x.moveTo(-14, 6); x.lineTo(24, 6); x.quadraticCurveTo(40, 6, 56, 0); x.quadraticCurveTo(42, 10, 22, 11); x.lineTo(-12, 11); x.closePath(); x.fill();
    x.strokeStyle = '#2a2a30'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = 1.6; x.beginPath(); x.arc(-10, -2, 8, PI * .95, PI * 1.85); x.stroke(); x.beginPath(); x.arc(2, -7, 10, PI * 1.12, PI * 1.9); x.stroke(); x.beginPath(); x.arc(14, -3, 8, PI * 1.25, PI * 2.05); x.stroke();
    x.beginPath(); for (let a2 = 0, i = 0; a2 < 2.6 * PI; a2 += .18, i++) { const rr = 6.5 * (1 - a2 / (3 * PI)), px = -12 - rr * Math.cos(a2), py = 2 - rr * Math.sin(a2); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    x.lineWidth = 1.3; x.beginPath(); x.moveTo(-14, 11); x.lineTo(22, 11); x.quadraticCurveTo(42, 10, 58, 1); x.moveTo(6, 7); x.quadraticCurveTo(30, 6, 46, 3); x.stroke();
    x.restore();
  }

  const FLENS = () => F.getScene('seq-06').api.FLENS;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const P0 = panAt(TILT0, 0), P1 = panAt(TILT0, 1), mid = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    const K = [[-1, [129.0, DECK + 2.3, -9.5], [P0[0], P0[1] + 1.1, P0[2]], 1], [0, [129.1, DECK + 2.3, -9.3], [P0[0], P0[1] + 1.0, P0[2]], 1],
      [T_COST + .3, [129.8, DECK + 2.4, -8.8], mid(P0, PIV, .3), 1],
      [T_WORLD, [131.6, DECK + 2.9, -7.0], mid(PIV, P1, .45), 1],
      [T_FAIRY + .1, [132.6, DECK + 3.3, -6.0], [P1[0], P1[1] + .9, P1[2]], 1.05],
      [DUR, [132.8, DECK + 3.6, -5.8], [P1[0] + MIRD[0] * 14, P1[1] + 4, P1[2] + MIRD[1] * 14], 1.05],
      [DUR + 1, [132.9, DECK + 3.7, -5.7], [P1[0] + MIRD[0] * 22, P1[1] + 6, P1[2] + MIRD[1] * 22], 1.05]];
    if (M45) K.forEach(k => { const d = [k[1][0] - k[2][0], k[1][1] - k[2][1], k[1][2] - k[2][2]], l = Math.hypot(...d); k[1] = k[1].map((v, i) => v + d[i] / l * 3.2); });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: FLENS() * Math.exp(S.f(t)), W, H, near: .05 });
  }

  function draw(ctx, t) {
    const cam = camAt(t), D = DAWN;
    HB.skySea(ctx, cam, D, t);
    HB.mirage(ctx, cam, D, .8, t);
    PA.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; HB.waves(x, cam, D, t); HB.land(x, cam, D); }, { rim: false, paperShadow: [2, 3, 3, .12] });
    PA.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; HB.jetty(x, cam, D); HB.lanterns(x, cam, D, 0); balance(x, cam, t, D); }, { paperShadow: [3, 4, 4, .22] });
    FL.grade(ctx, T0() + t);
  }

  F.scene('seq-19', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-18', dur: .9, dir: 'right' },
    sfx: [
      { t: .2, type: 'lib', dur: DUR - .2, label: 'A HARBOUR AT DAWN, EMPTY: SMALL WAVES ON TIMBER, ONE GULL FAR OFF' },
      { t: .4, type: 'wind', dur: 3.5, g: .05 },
      { t: T_COST - .02, type: 'creak', dur: .6, g: .08 },
      ...[0, 1, 2, 3, 4, 5].map(i => ({ t: T_COST + .05 + .09 * i, type: 'clink', f: 2600 + 260 * i, g: .05, noSnap: true })),
      { t: T_MAR, type: 'whoosh', f0: 70, f1: 120, dur: 2.2, g: .05 },
      { t: T_FAIRY, type: 'shimmer', g: .14 },
      { t: T_FAIRY + .35, type: 'creak', dur: .5, g: .05 },
      { t: T_TALE + .2, type: 'exhale', g: .05 },
    ],
    api: { DUR, camAt },
  });
})();
