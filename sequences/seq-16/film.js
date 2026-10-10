(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, Mo = F.motion, HB = F.harbour, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-16'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI;
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const S15 = () => F.getScene('seq-15'), A15 = () => S15().api, A6 = () => F.getScene('seq-06').api, A13 = () => F.getScene('seq-13').api;
  const T0 = () => ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14', 'seq-15'].reduce((s, id) => s + F.getScene(id).duration, 0);

  const T_PROG = 1.02, T_TWO = 1.89, T_TRACKS = 2.11;
  const T_EXP = 3.01, T_AND = 4.18, T_ELX = 4.41;

  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const D15 = A15().DUR, c = tt => { const k = A15().camMap(tt); return k; };
    const at15 = d => { const k = c(D15 + d), ph = -k.pitch, fwd = [Math.sin(k.yaw) * Math.cos(ph), -Math.sin(ph), Math.cos(k.yaw) * Math.cos(ph)], Dd = k.f / k.z, T = [k.pos[0] + fwd[0] * Dd, k.pos[1] + fwd[1] * Dd, k.pos[2] + fwd[2] * Dd]; return [d, T[0], -T[2], k.z / zf(ph / D2R), ph / D2R, k.yaw / D2R, T[1]]; };
    const top = A15().TOPH(), [x0, y0] = A15().XY();
    const K = [at15(-.6), at15(0), at15(.15),
      ...(M45 ? [[2.75, x0 + 40, y0 - 6, 10.5, 15, 75.5, top], [DUR, x0 + 45, y0 - 8, 10.9, 14.6, 76.5, top], [DUR + 1.5, x0 + 48, y0 - 9, 11.2, 14.4, 77.2, top]]
        : [[2.75, x0 + 60, y0 - 9, 9.5, 16.5, 75.5, top], [DUR, x0 + 66, y0 - 11, 9.9, 16, 76.5, top], [DUR + 1.5, x0 + 70, y0 - 12, 10.2, 15.8, 77.2, top]])];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camAt(t) {
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t);
    return QM.camera({ x: sx(t), y: sy(t), z: Math.exp(sz(t)) * zf(p), pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, W, H, A6().FLENS);
  }

  let TR_E = null, TR_X = null;
  const trackE = () => TR_E || (TR_E = (() => { const [px, py] = A15().PAL0(), [x0, y0] = A15().XY(); return QM.road([[px, py + 1.2], [x0 + 3, y0], [x0 + 200, y0], [372, 6], [410, -38], HB.onMap(7)]); })());
  const trackX = () => TR_X || (TR_X = (() => { const [px, py] = A15().PAL0(), [wx, wy] = A15().WS(), d = A15().WSO.PD; return QM.road([[px + 1.2, py + 1.4], [px + 6, py + 9], [wx - 5, wy - 3], [wx - 1.6, wy + d + .9], [wx, wy + d + .25]]); })());
  const T_E0 = T_TWO - .05, T_E1 = T_EXP - .12, T_X0 = T_TRACKS - .1, T_X1 = T_TRACKS + .75;
  const headE = t => trackE().L * easeIO(clamp((t - T_E0) / (T_E1 - T_E0)));
  const headX = t => trackX().L * easeIO(clamp((t - T_X0) / (T_X1 - T_X0)));
  function ribbon(x, cam, R, s0, s1, hw, h, col) {
    if (s1 - s0 < .05) return;
    const L = [], Rr = [];
    for (let s = s0, done = false; !done; s += 1.5) {
      if (s >= s1) { s = s1; done = true; }
      const q = QM.along(R, s), nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
      const a = cam.at(q[0] + nx * hw, q[1] + ny * hw, h), b = cam.at(q[0] - nx * hw, q[1] - ny * hw, h);
      if (a && b) { L.push(a); Rr.push(b); }
    }
    if (L.length < 2) return;
    x.fillStyle = col; x.beginPath(); L.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) x.lineTo(Rr[i][0], Rr[i][1]); x.closePath(); x.fill();
  }
  function tracks(x, cam, t) {
    const h = A15().TOPH() + .06;
    for (const [R, hs] of [[trackE(), headE(t)], [trackX(), headX(t)]]) {
      if (hs <= 0) continue;
      ribbon(x, cam, R, 0, hs, 1.5, h, 'rgba(255,236,170,.28)');
      ribbon(x, cam, R, 0, hs, .55, h, 'rgba(255,246,214,.95)');
      if (hs >= R.L - 1e-6) for (let k = 0; k < 9; k++) { const s = ((t * 38 + k * R.L / 9) % R.L); ribbon(x, cam, R, Math.max(0, s - 2.2), s, .8, h + .02, 'rgba(255,255,240,.85)'); }
    }
  }

  const fromH = HB.fromH;
  const CLOUDS = (() => { const R = F.rng(1607), o = []; for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1; o.push({ x: 150 + 42 * i + 14 * R(), y: side > 0 ? 70 + 40 * R() : -120 - 30 * R(), h: 150 + 18 * R(), s: 6 + 4 * R(), v: .4 + .5 * R() }); } return o; })();
  function cloud(x, cam, c, t) {
    const u = QM.up(cam, c.x + c.v * t, c.y, c.h); if (!u) return;
    const r = c.s * u.k;
    if (r < 2) return;
    for (const [dx, dy, k, col] of [[0, 0, 1, 'rgba(246,244,238,.82)'], [-.9, .22, .72, 'rgba(236,236,232,.8)'], [.95, .18, .78, 'rgba(252,250,246,.85)'], [.15, .42, .85, 'rgba(226,228,226,.7)']]) {
      x.fillStyle = col; x.beginPath(); x.ellipse(u.x + dx * r, u.y + dy * r * .55, r * k, r * k * .5, 0, 0, TAU); x.fill();
    }
  }
  function uprights(put, cam, t) {
    const GA = fromH([HB.ARCH.u1 + 5, 0, 0]);
    put(GA[0], -GA[2], HB.TOP, x => HB.gate(x, cam, { P: fromH, N: HB.nToMap, lo: .55 }));
    for (const c of CLOUDS) put(c.x + c.v * t, c.y, c.h, x => cloud(x, cam, c, t));
  }

  function glows(ctx, cam, t, gk = 1) {
    const sh = SH(), h = A15().TOPH() + .6, g = (q, r, col, a) => { if (a <= .003) return; const u = cam.at(q[0], q[1], q[2] ?? h); if (u) PR.glow(ctx, u[0] - sh.x, u[1] - sh.y, r(u), col, a, 'flat'); };
    const hE = headE(t), hX = headX(t);
    if (hE > 0 && hE < trackE().L) { const q = QM.along(trackE(), hE); g(q, u => Math.max(10, 3 * u[3]), '#fff2c8', .85); }
    if (hX > 0 && hX < trackX().L) { const q = QM.along(trackX(), hX); g(q, u => Math.max(10, 2.6 * u[3]), '#fff2c8', .85); }
    const p0 = A15().PAL0(); g(p0, u => Math.max(16, 4 * u[3]), '#ffd890', .5 * Math.exp(-Math.pow((t - T_TWO - .1) / .35, 2)));
    const fe = Math.exp(-Math.pow((t - T_EXP - .05) / .22, 2)), se = ss(T_EXP - .1, T_EXP + .3, t);
    g([HB.G[0], HB.G[1], HB.TOP + 2], u => Math.min(220, Math.max(18, 9 * u[3])), '#fff0c0', (.8 * fe + .35 * se) * gk);
    const [wx, wy] = A15().WS(), d = A15().WSO.PD, fx = Math.exp(-Math.pow((t - T_ELX - .05) / .25, 2)), sx = ss(T_ELX - .1, T_ELX + .35, t);
    g([wx, wy + d + .3, A15().TOPH() + 1.1], u => Math.max(14, 2.4 * u[3]), '#eef4ff', .55 * sx + .5 * fx);
    g([wx, wy, A15().roofTop() + 1.5], u => Math.max(18, 4.5 * u[3]), '#ffd2a0', .45 * fx);
  }
  function tags(ctx, cam, t, k = 1) {
    const aE = ss(T_EXP - .05, T_EXP + .2, t) * k, aX = ss(T_ELX - .05, T_ELX + .2, t) * k;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (aE > 0) { const q = QM.along(trackE(), trackE().L - 75), u = QM.up(cam, q[0], q[1], HB.TOP + .5); if (u) QM.tag(ctx, u.x, u.y, 'EXPEDITIONS', { alpha: aE, size: M45 ? 34 : 36, stem: 30 }); }
    if (aX > 0) { const [wx, wy] = A15().WS(), u = QM.up(cam, wx, wy, A15().roofTop() + 2.5); if (u) QM.tag(ctx, u.x, u.y, 'ELIXIRS', { alpha: aX, size: M45 ? 38 : 40, stem: 40 }); }
    ctx.restore();
  }

  const D15 = () => A15().DUR;
  function frame(ctx, t, cam, o = {}) {
    A15().mapFrame(ctx, D15() + t, cam, false, {
      isle: { t: D15() + t, quiet: true, alpha: o.isleA ?? 1, glow: o.isleA ?? 1 },
      sky: o.sky,
      onTop: (x, cm) => { tracks(x, cm, t); if (o.onTop) o.onTop(x, cm); },
      uprights: (put, cm) => { uprights(put, cm, t); if (o.uprights) o.uprights(put, cm); },
      glows: (c, cm) => { glows(c, cm, t, o.gateA ?? 1); if (o.glows) o.glows(c, cm); },
    });
    if (!o.noTags) tags(ctx, cam, t, o.tagA ?? 1);
  }
  function draw(ctx, t) {
    if (t <= 0) return S15().draw(ctx, D15());
    frame(ctx, t, camAt(t));
    FL.grade(ctx, T0() + t);
  }

  F.scene('seq-16', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .05, type: 'whoosh', f0: 60, f1: 140, dur: 2.6, g: .12 },
      { t: .2, type: 'wind', dur: 3.2, g: .05 },
      { t: T_TWO - .05, type: 'riser', dur: T_EXP - T_TWO, f0: 1800, f1: 2600, g: .05 },
      { t: T_TRACKS - .1, type: 'swoosh', dur: .7, g: .12 },
      { t: T_TWO, type: 'swoosh', dur: 1.1, g: .1 },
      { t: T_EXP, type: 'shimmer', g: .14 },
      { t: T_ELX, type: 'rumble', dur: 1.0, g: .12 },
      { t: T_ELX + .02, type: 'clink', f: 3400, g: .1 },
      ...(() => { const o = []; for (let tt = .1, k = 0; tt < DUR; k++) { o.push({ t: tt, type: 'clink', f: 2900 + 1300 * F.hash(k, 13), g: .025 + .02 * F.hash(k, 14), noSnap: true }); tt += .09 * (.6 + .8 * F.hash(k, 15)); } return o; })(),
    ],
    api: { DUR, camAt, spl, frame, trackE, trackX, headE, headX, ribbon, T_EXP, T_ELX },
  });
})();
