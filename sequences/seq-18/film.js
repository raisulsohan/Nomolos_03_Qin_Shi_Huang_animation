(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, Mo = F.motion, HB = F.harbour, CH = F.china, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-18'), DUR = C.duration;
  const FL = F.look('flat', W, H), PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A15 = () => F.getScene('seq-15').api, A16 = () => F.getScene('seq-16').api, A17 = () => F.getScene('seq-17').api;
  const SEQS = ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14', 'seq-15', 'seq-16', 'seq-17'];
  const T0 = () => SEQS.reduce((s, id) => s + F.getScene(id).duration, 0);
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };

  const T_CAME = 0.14, T_EMPTY = 1.16, T_EXC = 3.42;
  const T_GIANT = 4.44, T_FISH = 4.78, T_BLOCK = 5.26, T_ROUTE = 6.22;
  const T_GOT = 7.19, T_MSHIPS = 7.75, T_MARCH = 8.61, T_SAILED = 9.56, T_AGAIN = 9.91;
  const T_NEVER = 10.89, T_BACK = 11.36;
  const T_LEG = 12.3, T_LANDED = 13.13, T_JAPAN = 13.68, T_MADE = 14.23, T_KING = 15.05;
  const T_GOOD = 16.1, T_ONLY = 17.53, T_LEG3 = 17.86;

  const EVE = HB.DAYS.evening;
  const DUSK = { sun: EVE.sun, sky: ['#262c4c', '#6a4e66', '#d08a64'], sea: ['#121a2e', '#2a3046', '#86604e'], land: '#6a4a34', rock: '#4a3628', haze: 'rgba(208,138,100,', glow: '#ffd7a0' };
  const dayAt = t => HB.mixDay(EVE, DUSK, ss(T_SAILED, T_BACK + .4, t));
  const SEA = HB.SEA, DECK = HB.DECK, deckY = SEA + 2.2;
  const EYE = [118, -22.6, -30];
  const MIR = [HB.PENG[0], HB.PENG[1]], MD = (() => { const l = Math.hypot(MIR[0] - EYE[0], MIR[1] - EYE[2]); return [(MIR[0] - EYE[0]) / l, (MIR[1] - EYE[2]) / l]; })();
  const T_SW = T_LEG - .12, UP = 14 * D2R;
  let SPLH = null;
  function splH() {
    if (SPLH) return SPLH;
    const tg = (d, y) => [EYE[0] + MD[0] * d, y, EYE[2] + MD[1] * d], up = (e, d) => [e[0] + MD[0] * d * Math.cos(UP), e[1] + d * Math.sin(UP), e[2] + MD[1] * d * Math.cos(UP)];
    const E1 = [118.8, -22, -31.4];
    const K = [[-1, [118.6, -22.6, -30], [139, -27.6, 4], 1.3],
      [0, [118.4, -22.6, -30], [138, -27.6, 4], 1.3],
      [2.6, [117.9, -22.7, -30.1], [134, -27.7, 3], 1.3],
      [T_EXC, [117.7, -22.7, -30.2], [131, -27.6, 2.5], 1.3],
      [T_EXC + 1.0, [117.5, -22.6, -30.4], tg(1300, -16), 2.1],
      [T_SAILED, [118, -22.4, -30.8], tg(1400, -15), 2.1],
      [T_BACK + .15, [118.5, -22.2, -31.2], tg(2400, -8), 2.1],
      [T_SW, E1, up(E1, 1000), 2.1],
      [T_SW + 1, [119, -21.9, -31.5], up([119, -21.9, -31.5], 1000).map((v, i) => i === 1 ? v + 40 : v), 2.1]];
    if (M45) K.forEach(k => { if (k[3] > 1.5) k[3] *= .82; });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])]));
    return (SPLH = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  const FLENS = () => F.getScene('seq-06').api.FLENS;
  function camH(t) {
    const S = splH(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: FLENS() * Math.exp(S.f(t)), W, H, near: .05 });
  }

  const LONE = { u: 141, v: 8.2, a: PI, L: HB.SHIP.L, B: HB.SHIP.B, i: 30, load: [] };
  const loneNow = t => { const k = 1 - Math.pow(1 - clamp((t + .4) / 1.3), 2.4); return { ...LONE, u: LONE.u - 9 * (1 - k), du: -9 * (1 - k), sail: .25, bob: .07 * Math.sin(t * 1.3 + 3) }; };
  const PLANK = { u: 141.2, top: [deckY + .9, LONE.v - LONE.B / 2 - .05], foot: [DECK + .02, HB.JET.w] };
  const plankK = t => easeIO(clamp((t - .4) / .42));
  function plank(x, cam, t, lone) {
    const k = plankK(t); if (k <= 0) return;
    const du = lone.du, top = [PLANK.u + du, PLANK.top[0] + lone.bob, PLANK.top[1]], foot = [PLANK.u + du * 0, PLANK.foot[0], PLANK.foot[1]], f2 = [lerp(top[0], foot[0], k), lerp(top[1], foot[1], k), lerp(top[2], foot[2], k)];
    const q = [[top[0] - .5, top[1], top[2]], [top[0] + .5, top[1], top[2]], [f2[0] + .5, f2[1], f2[2]], [f2[0] - .5, f2[1], f2[2]]];
    if (S3.poly(x, cam, q)) { x.fillStyle = '#8a6a48'; x.fill(); x.strokeStyle = 'rgba(40,26,16,.55)'; x.lineWidth = 1; x.stroke(); }
    x.strokeStyle = 'rgba(40,26,16,.4)'; x.beginPath(); for (let i = 1; i < 6; i++) { const v = i / 6; S3.line(x, cam, [lerp(top[0], f2[0], v) - .5, lerp(top[1], f2[1], v), lerp(top[2], f2[2], v)], [lerp(top[0], f2[0], v) + .5, lerp(top[1], f2[1], v), lerp(top[2], f2[2], v)]); } x.stroke();
  }
  let XU = null;
  const xu = () => XU || (XU = HB.walker({ kind: 'xufu', pts: [[143.2, deckY, 7.4], [141.7, deckY, 6.2], [141.3, deckY + .9, PLANK.top[1]], [141.1, DECK + .02, PLANK.foot[1]], [139.8, DECK, 1.2], [60, DECK, .6]], s0: 1.95 + 1.5, T: .85 }));
  const FLEET = [[170, 70, 22, T_GOT - .2], [215, 95, -14, T_GOT + .1], [265, 120, 48, T_MSHIPS - .1], [330, 150, 4, T_MSHIPS + .2], [400, 180, 60, T_MARCH - .2], [480, 215, -30, T_MARCH + .1], [570, 250, 30, T_MARCH + .4]]
    .map(([s0, side0, side1, t0], i) => ({ s0, side0, side1, t0, i: 40 + i, L: HB.SHIP.L, B: HB.SHIP.B, load: [[-.3, -.3, 'chest'], [.35, .2, 'chest']] }));
  const along = (f, t) => f.s0 + 9 * (t - f.t0) + 7 * Math.pow(Math.max(0, t - T_SAILED), 2) + 40 * Math.pow(Math.max(0, t - T_SAILED - .4), 3);
  const across = (f, t) => lerp(f.side0 + .25 * f.s0, f.side1, easeIO(clamp((t - f.t0 + 1.4) / 3.2)));
  function fleetNow(t) {
    const nx = MD[1], nz = -MD[0];
    return FLEET.map(f => {
      const s = along(f, t), sd = across(f, t), s2 = along(f, t + .1), sd2 = across(f, t + .1);
      const du = MD[0] * (s2 - s) + nx * (sd2 - sd), dv = MD[1] * (s2 - s) + nz * (sd2 - sd);
      return { ...f, u: EYE[0] + MD[0] * s + nx * sd, v: EYE[2] + MD[1] * s + nz * sd, a: -Math.atan2(dv, du), sail: 1, bob: .08 * Math.sin(t * 1.4 + f.i), du: 0, s };
    });
  }
  function archersOn(x, cam, s, t) {
    for (const [a, w2] of [[-.45, .45], [-.2, .5], [.05, .45], [.3, .4], [-.3, -.4], [.15, -.45]]) {
      const p = HB.shipPt(s, a, w2, 2.2);
      HB.person(x, cam, p, -s.a, 'archer', t + s.i, { rim: [1.4, -1], stand: true });
    }
  }

  function lightPath(x, cam, D, t, k) {
    if (k <= 0) return;
    x.save(); x.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const r = F.hash(i, 71), d = 30 + Math.pow(r, 1.8) * 4000, spread = .05 * d + 2, off = (F.hash(i, 72) - .5) * 2 * spread * (.4 + .6 * F.hash(i, 73));
      const u = EYE[0] + MD[0] * d + MD[1] * off, v = EYE[2] + MD[1] * d - MD[0] * off, ph = Math.sin(t * 2.2 + i * 1.7);
      const a = cam.proj([u, SEA, v]); if (!a) continue;
      const L = Math.max(2, (2 + 2 * F.hash(i, 74)) * a[3]);
      x.strokeStyle = `rgba(255,226,170,${(.35 + .35 * ph) * k * (1 - .6 * (1 - Math.min(1, a[3] * 2)))})`; x.lineWidth = Math.max(.8, .18 * a[3]);
      x.beginPath(); x.moveTo(a[0] - L / 2, a[1]); x.lineTo(a[0] + L / 2, a[1]); x.stroke();
    }
    x.restore();
  }
  const FISH_D = 1500;
  const fishU = t => easeIO(clamp((t - T_GIANT + .05) / 1.0)) * (1 - easeIO(clamp((t - T_SAILED - .2) / 1.7)));
  function fish(x, cam, t) {
    const u = fishU(t); if (u <= 0) return;
    const c = [EYE[0] + MD[0] * FISH_D, SEA, EYE[2] + MD[1] * FISH_D], p = cam.proj(c); if (!p) return;
    const S = p[3] * 1.0, sway = Math.sin(t * .8) * .015;
    x.save();
    x.beginPath(); x.rect(-W, -H * 2, W * 3, p[1] + H * 2); x.clip();
    x.translate(p[0], p[1] + (1 - u) * 190 * S); x.scale(S, S); x.rotate(sway);
    const back = () => { x.moveTo(-232, 8); x.bezierCurveTo(-232, -96, -150, -186, -10, -190); x.bezierCurveTo(130, -192, 214, -110, 226, 10); };
    const belly = () => { x.lineTo(150, 10); x.bezierCurveTo(140, -52, 80, -86, -2, -86); x.bezierCurveTo(-90, -86, -140, -46, -150, 10); };
    const body = () => { x.beginPath(); back(); belly(); x.closePath(); };
    x.fillStyle = 'rgba(238,230,208,.97)'; body(); x.fill();
    const g = x.createLinearGradient(0, -194, 0, 0); g.addColorStop(0, 'rgba(34,34,40,.82)'); g.addColorStop(.42, 'rgba(70,70,76,.48)'); g.addColorStop(.8, 'rgba(140,136,128,.14)'); g.addColorStop(1, 'rgba(160,156,146,0)');
    x.fillStyle = g; body(); x.fill();
    x.strokeStyle = 'rgba(28,28,34,.5)'; x.lineWidth = 2.4;
    for (let row = 0; row < 4; row++) for (let i = 0; i < 22; i++) {
      const v = (i + .5 * (row % 2)) / 22, ang = PI * (1 - v), R0 = 170 - row * 22, bx = -2 + Math.cos(ang) * (205 - row * 18), by = -Math.sin(ang) * R0 + 6;
      if (v < .12 || v > .9) continue; x.beginPath(); x.arc(bx, by, 9, .15 * PI, .85 * PI); x.stroke();
    }
    x.strokeStyle = '#1b1b20'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = 9; x.beginPath(); back(); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.moveTo(150, 10); x.bezierCurveTo(140, -52, 80, -86, -2, -86); x.bezierCurveTo(-90, -86, -140, -46, -150, 10); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(-232, 8); x.quadraticCurveTo(-212, -16, -186, -10); x.stroke();
    x.fillStyle = '#f6f1e4'; x.beginPath(); x.arc(-182, -62, 17, 0, TAU); x.fill(); x.lineWidth = 4; x.stroke();
    x.fillStyle = '#141418'; x.beginPath(); x.arc(-186, -62, 8.5, 0, TAU); x.fill();
    x.lineWidth = 6; x.beginPath(); x.moveTo(-138, -150); x.quadraticCurveTo(-112, -90, -134, -18); x.stroke();
    x.lineWidth = 3.4; x.beginPath(); x.moveTo(-226, -18); x.bezierCurveTo(-262, -40, -284, -6, -312, -30); x.moveTo(-222, -8); x.bezierCurveTo(-256, 6, -270, 26, -300, 18); x.stroke();
    x.fillStyle = 'rgba(36,36,42,.86)';
    x.beginPath(); x.moveTo(-40, -188); x.quadraticCurveTo(-10, -262, 70, -256); x.lineTo(56, -238); x.lineTo(74, -230); x.quadraticCurveTo(46, -212, 52, -180); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-96, -60); x.quadraticCurveTo(-60, -40, -54, 4); x.quadraticCurveTo(-80, -14, -110, -30); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(210, -36); x.quadraticCurveTo(250, -120, 300, -150); x.quadraticCurveTo(282, -96, 292, -54); x.quadraticCurveTo(262, -62, 236, -4); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(250,248,240,.92)'; x.lineWidth = 5;
    for (const [sx, k] of [[-224, 1], [-190, .8], [-150, .6], [160, .7], [222, 1], [250, .7]]) for (let j = 0; j < 3; j++) { const a0 = PI + .4 + j * .55, r = (16 + 10 * j) * k * (.75 + .25 * Math.sin(t * 2.6 + sx)); x.beginPath(); x.arc(sx, 12, r, a0, a0 + 1.1); x.stroke(); }
    x.restore();
  }

  function harbourFrame(ctx, t, cam) {
    const D = dayAt(t), lone = loneNow(t), fl = fleetNow(t);
    HB.skySea(ctx, cam, D, t);
    HB.mirage(ctx, cam, D, 1 + .3 * ss(T_NEVER, T_SW, t), t);
    PA.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      HB.waves(x, cam, D, t);
      lightPath(x, cam, D, t, ss(T_EXC - .6, T_EXC + .6, t));
      HB.land(x, cam, D);
      const L = fl.filter(s => s.s > 70).map(s => ({ d: cam.depth([s.u, SEA, s.v]), f: () => HB.junk(x, cam, s, D, { t, deck: () => archersOn(x, cam, s, t) }) }));
      L.push({ d: cam.depth([EYE[0] + MD[0] * FISH_D, SEA, EYE[2] + MD[1] * FISH_D]), f: () => fish(x, cam, t) });
      L.sort((a, b) => b.d - a.d).forEach(o => o.f());
    }, { rim: false, paperShadow: [2, 3, 3, .12] });
    PA.sheet(ctx, ID, 1, RC, x => {
      x.lineCap = 'butt'; x.lineJoin = 'miter';
      HB.stair(x, cam, D);
      const q = xu().at(t), aboard = q.s < HB.path(xu().pts.slice(0, 3)).L - .05;
      HB.junk(x, cam, lone, D, { t, deck: () => { if (aboard) HB.person(x, cam, [q.p[0] + lone.du, q.p[1] + lone.bob, q.p[2]], q.dir, 'xufu', q.tg, { G: xu().G, rim: [-1.4, -1] }); } });
      HB.jetty(x, cam, D);
      plank(x, cam, t, lone);
      HB.lanterns(x, cam, D, lampK(t));
      if (!aboard) HB.person(x, cam, q.p, q.dir, 'xufu', q.tg, { G: xu().G, rim: [-1.4, -1] });
      fl.filter(s => s.s <= 70).sort((a, b) => cam.depth([b.u, SEA, b.v]) - cam.depth([a.u, SEA, a.v])).forEach(s => HB.junk(x, cam, s, D, { t, deck: () => archersOn(x, cam, s, t) }));
    }, { paperShadow: [3, 4, 4, .2] });
    HB.lanternGlows(ctx, cam, lampK(t), t);
  }
  const lampK = t => ss(T_NEVER - .3, T_BACK + .4, t);

  const D16 = () => A16().DUR, D17 = () => A17().DUR, PG = () => A15().PENG;
  const KYU = [771, -24];
  const LAND_AT = [760, -31];
  let SPLM = null;
  function splM() {
    if (SPLM) return SPLM;
    const E0 = [665, 262, -172], T0u = [E0[0], E0[1] + 1000 * Math.sin(UP), E0[2] + 1000 * Math.cos(UP)], Z0 = M45 ? 2.1 * .82 : 2.1;
    const K = [[T_SW - 1, E0, T0u, Z0], [T_SW, E0, T0u, Z0],
      [T_SW + 1.3, [665, 256, -166], [665, 50, 50], 1.0],
      [T_JAPAN + .55, [702, 214, -142], [762, 25, 26], 1.0],
      [T_KING, [710, 131, -163], [764, 22, 25], 1.0],
      [T_ONLY + .4, [721, 139, -151], [767, 40, 24.5], 1.0],
      [DUR, [722, 146, -150], [768, 42, 24], 1.0],
      [DUR + 2, [723, 146.5, -149], [769, 42.5, 24], 1.0]];
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])]));
    return (SPLM = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  const camFrom = (e, g, f) => {
    const d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]], L = Math.hypot(d[0], d[1], d[2]);
    const cam = S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, W, H, near: .05 });
    cam.z = f / L; cam.ph = -cam.pitch; cam.at = (x, y, h) => cam.proj([x, h, -y]);
    return cam;
  };
  function camMap(t) { const S = splM(); return camFrom(S.e.map(f => f(t)), S.g.map(f => f(t)), FLENS() * Math.exp(S.f(t))); }
  let LEG_R = null;
  const legRoad = () => LEG_R || (LEG_R = QM.road([[PG()[0] + 8, PG()[1] + 1], [640, -66], [712, -50], LAND_AT]));
  const legK = t => easeIO(clamp((t - T_LEG + .05) / (T_JAPAN - T_LEG)));
  const dot = (x, cam, q, r0, col) => { const p = cam.at(q[0], q[1], .5); if (!p) return; const r = Math.max(r0, .8 * p[3]); x.fillStyle = col; x.beginPath(); x.ellipse(p[0], p[1], r, r * Math.max(.3, Math.sin(cam.ph)), 0, 0, TAU); x.fill(); };
  function legend(x, cam, t) {
    const sea = A17().seaRoad(); for (let s = 0; s < sea.L; s += 4.5) dot(x, cam, QM.along(sea, s), 1.5, 'rgba(255,240,210,.5)');
    const k = legK(t), R = legRoad(); if (k <= 0) return;
    for (let s = 0; s < R.L * k; s += 3.2) dot(x, cam, QM.along(R, s), 2.2, '#e0703c');
  }
  const SC_H = 64, SC_W = 34, SC_LIFT = 8;
  const unroll = t => easeIO(clamp((t - T_MADE + .05) / (T_KING + .35 - T_MADE))) * (1 - easeIO(clamp((t - T_ONLY + .1) / 1.05)));
  const curl = t => ss(T_GOOD - .15, T_GOOD + .75, t);
  function painting(x, w, h, t) {
    x.fillStyle = '#efe4c8'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(120,130,120,.35)'; x.beginPath(); x.moveTo(0, h * .5); x.quadraticCurveTo(w * .25, h * .18, w * .45, h * .34); x.quadraticCurveTo(w * .7, h * .12, w, h * .4); x.lineTo(w, h * .62); x.lineTo(0, h * .62); x.closePath(); x.fill();
    x.fillStyle = 'rgba(60,70,64,.45)'; x.beginPath(); x.moveTo(w * .05, h * .6); x.quadraticCurveTo(w * .3, h * .3, w * .55, h * .5); x.quadraticCurveTo(w * .8, h * .4, w * .95, h * .6); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(60,80,100,.55)'; x.lineWidth = Math.max(.6, w * .006);
    for (let i = 0; i < 9; i++) { const y = h * (.7 + .03 * i); x.beginPath(); for (let k = 0; k <= 8; k++) { const xx = w * k / 8, yy = y + Math.sin(k * 1.3 + i) * h * .006; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
    x.fillStyle = 'rgba(170,140,96,.6)'; x.beginPath(); x.moveTo(0, h * .66); x.quadraticCurveTo(w * .4, h * .6, w * .75, h * .66); x.lineTo(w * .75, h * .7); x.lineTo(0, h * .72); x.closePath(); x.fill();
    x.fillStyle = 'rgba(40,30,24,.8)'; x.beginPath(); x.moveTo(w * .12, h * .66); x.lineTo(w * .4, h * .66); x.lineTo(w * .36, h * .7); x.lineTo(w * .15, h * .7); x.closePath(); x.fill();
    x.fillRect(w * .25, h * .5, w * .012, h * .16); x.fillStyle = 'rgba(160,80,50,.75)'; x.fillRect(w * .19, h * .52, w * .12, h * .11);
    x.fillStyle = 'rgba(120,40,30,.85)'; x.fillRect(w * .55, h * .47, w * .32, h * .16);
    x.fillStyle = 'rgba(40,34,36,.9)'; x.beginPath(); x.moveTo(w * .5, h * .48); x.lineTo(w * .92, h * .48); x.lineTo(w * .82, h * .41); x.lineTo(w * .6, h * .41); x.closePath(); x.fill();
    x.fillStyle = 'rgba(232,220,190,1)'; x.fillRect(w * .6, h * .5, w * .22, h * .13);
    x.fillStyle = '#1b1a20'; x.beginPath(); x.ellipse(w * .71, h * .555, w * .022, h * .016, 0, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(w * .67, h * .63); x.lineTo(w * .75, h * .63); x.lineTo(w * .74, h * .575); x.lineTo(w * .68, h * .575); x.closePath(); x.fill();
    const glint = Math.exp(-Math.pow((t - T_KING - .1) / .3, 2));
    x.fillStyle = '#e8b040'; x.beginPath(); x.moveTo(w * .685, h * .54); x.lineTo(w * .69, h * .52); x.lineTo(w * .70, h * .534); x.lineTo(w * .71, h * .515); x.lineTo(w * .72, h * .534); x.lineTo(w * .73, h * .52); x.lineTo(w * .735, h * .54); x.closePath(); x.fill();
    if (glint > .01) { x.fillStyle = `rgba(255,236,170,${.5 * glint})`; x.beginPath(); x.arc(w * .71, h * .53, w * .05, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(180,40,30,.85)'; x.fillRect(w * .82, h * .08, w * .07, w * .07);
    x.fillStyle = 'rgba(40,36,34,.7)'; for (let i = 0; i < 6; i++) x.fillRect(w * .84, h * .17 + i * h * .028, w * .03, h * .016);
  }
  function scroll(x, cam, t, a = 1) {
    const k = unroll(t), on = ss(T_MADE - .2, T_MADE + .05, t) * a; if (on <= 0) return;
    const top = QM.up(cam, KYU[0], KYU[1], SC_LIFT + SC_H), bot = QM.up(cam, KYU[0], KYU[1], SC_LIFT); if (!top || !bot) return;
    const hpx = Math.abs(bot.y - top.y), s = hpx / SC_H, wpx = SC_W * s, X = top.x, Y0 = top.y, open = k * hpx, cu = curl(t);
    x.save(); x.globalAlpha *= on;
    if (open > 1) {
      x.save(); x.beginPath(); x.rect(X - wpx / 2 - 2, Y0, wpx + 4, open); x.clip();
      const inset = cu * wpx * .18;
      x.fillStyle = '#3e5a6a'; x.fillRect(X - wpx / 2 + inset * .3, Y0, wpx - inset * .6, hpx);
      x.save(); x.translate(X - wpx / 2 + wpx * .08 + inset, Y0 + hpx * .1); painting(x, wpx * .84 - 2 * inset, hpx * .78, t); x.restore();
      if (cu > 0) for (const sg of [-1, 1]) {
        const ex = X + sg * (wpx / 2 - inset * .3), g = x.createLinearGradient(ex - sg * inset * 1.5, 0, ex, 0);
        g.addColorStop(0, 'rgba(62,90,106,0)'); g.addColorStop(.45, '#2c4452'); g.addColorStop(.75, '#6e8c9c'); g.addColorStop(1, '#22343e');
        x.fillStyle = g; x.fillRect(Math.min(ex, ex - sg * inset * 1.5), Y0, inset * 1.5, hpx);
      }
      x.restore();
    }
    const roll = (y, r) => { const g = x.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, '#8a6a4a'); g.addColorStop(.5, '#4a3424'); g.addColorStop(1, '#2a1c12'); x.fillStyle = g; x.fillRect(X - wpx / 2 - r * 1.4, y - r, wpx + r * 2.8, 2 * r); x.fillStyle = '#c9a050'; for (const sg of [-1, 1]) { x.beginPath(); x.ellipse(X + sg * (wpx / 2 + r * 1.6), y, r * .7, r * 1.1, 0, 0, TAU); x.fill(); } };
    const rr = Math.max(3, s * 1.6);
    roll(Y0, rr * .8);
    roll(Y0 + Math.max(open, rr * .6), rr * (1 + .6 * (1 - k)));
    x.strokeStyle = '#3a2a1e'; x.lineWidth = Math.max(1, s * .3); x.beginPath(); x.moveTo(X - wpx * .3, Y0); x.lineTo(X, Y0 - s * 5); x.lineTo(X + wpx * .3, Y0); x.stroke();
    x.restore();
  }
  function scrollGlow(ctx, cam, t) {
    const g = Math.exp(-Math.pow((t - T_KING - .1) / .35, 2)); if (g < .01) return;
    const u = QM.up(cam, KYU[0], KYU[1], SC_LIFT + SC_H * .42); if (u) PR.glow(ctx, u.x - SH().x, u.y - SH().y, 60, '#ffe2a0', .5 * g, 'flat');
  }
  function tagLegend(ctx, cam, t, a0 = 1) {
    const a = ss(T_LEG3 - .05, T_LEG3 + .2, t) * a0; if (a <= 0) return;
    const u = QM.up(cam, KYU[0], KYU[1], SC_LIFT + SC_H + 6); if (!u) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); QM.tag(ctx, u.x, u.y, 'LEGEND', { alpha: a, size: M45 ? 46 : 50, stem: 26 }); ctx.restore();
  }
  function dusk(ctx, k = 1, cam) {
    if (k <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (cam) { const hy = cam.cy + cam.f * Math.tan(cam.pitch); ctx.beginPath(); ctx.rect(0, Math.max(0, hy), W, H); ctx.clip(); }
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, S3.mix('#ffffff', '#5a5a96', k)); g.addColorStop(.55, S3.mix('#ffffff', '#8a7aa0', k)); g.addColorStop(1, S3.mix('#ffffff', '#b08a86', k));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  const JAPAN = () => CH.LAND.filter(r => { let x0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of r) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return x0 > 730 && x1 < 1100 && y1 < 60 && r.length > 6; });
  let JP = null;
  function japan(x, cam) { JP = JP || JAPAN(); x.beginPath(); QM.rings(x, cam, JP, .1); x.fillStyle = 'rgba(214,190,150,.16)'; x.fill(); x.strokeStyle = 'rgba(255,238,200,.7)'; x.lineWidth = 1.6; x.stroke(); }
  function mapFrame(ctx, t, cam, o = {}) {
    const ex = o.extra || {}, la = o.legendA ?? 1, sa = o.scrollA ?? 1;
    A16().frame(ctx, D16() + D17() + t, cam, { noTags: true, gateA: 0, isleA: o.isleA ?? 1, sky: (c, cm) => HB.skySea(c, cm, DUSK, t), onTop: ex.onTop, uprights: ex.uprights, glows: ex.glows });
    dusk(ctx, o.dusk ?? .8, cam);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(-SH().x, -SH().y);
    HB.underLand(ctx, cam, x => { japan(x, cam); if (la > 0) { x.globalAlpha = la; legend(x, cam, t); x.globalAlpha = 1; } });
    if (ex.after) ex.after(ctx, cam);
    scroll(ctx, cam, t, sa);
    ctx.restore();
    scrollGlow(ctx, cam, t);
    tagLegend(ctx, cam, t, sa);
  }

  function draw(ctx, t) {
    if (t < T_SW) harbourFrame(ctx, t, camH(t)); else mapFrame(ctx, t, camMap(t));
    FL.grade(ctx, T0() + t);
  }

  F.scene('seq-18', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-17', dur: .9, dir: 'right' },
    sfx: [
      { t: .1, type: 'lib', dur: 4.2, label: 'A HARBOUR IN THE EVENING: SMALL WAVES ON TIMBER, A FEW GULLS' },
      { t: .75, type: 'thud', g: .12 },
      { t: .85, type: 'creak', dur: .5, g: .06 },
      ...[0, 1, 2, 3, 4, 5].map(i => ({ t: 1.05 + .62 * i, type: 'footstep', g: .07, noSnap: true })),
      { t: T_GIANT - .1, type: 'rumble', dur: 2.0, g: .18 },
      { t: T_GIANT, type: 'lib', dur: 2.4, label: 'A GREAT FISH BREACHING, FAR: A DEEP RUSH OF WATER' },
      { t: T_FISH + .2, type: 'splash', g: .12 },
      { t: T_GOT, type: 'lib', dur: 3.0, label: 'SAILS FILLING, A FLEET UNDER WAY, ROPES CREAKING' },
      { t: T_MARCH, type: 'creak', dur: .5, g: .06 },
      { t: T_SAILED, type: 'cloth', g: .1 },
      { t: T_SAILED + .4, type: 'splash', g: .08 },
      { t: T_NEVER, type: 'wind', dur: 2.2, g: .05 },
      { t: T_BACK + .2, type: 'whoosh', f0: 60, f1: 120, dur: 1.4, g: .08 },
      { t: T_SW + .1, type: 'whoosh', f0: 140, f1: 60, dur: 1.3, g: .08 },
      { t: T_LEG + .1, type: 'quill', dur: T_JAPAN - T_LEG, g: .08 },
      { t: T_MADE, type: 'rustle', dur: 1.0, g: .12 },
      { t: T_KING, type: 'shimmer', g: .12 },
      { t: T_GOOD - .1, type: 'rustle', dur: .9, g: .08 },
      { t: T_ONLY - .1, type: 'rustle', dur: .9, g: .1 },
      { t: T_ONLY + .95, type: 'clack', g: .12 },
      { t: T_LEG3, type: 'tick', g: .2 },
    ],
    api: { DUR, camMap, mapFrame, legRoad, KYU, SC_H, SC_W, SC_LIFT, dusk, xu },
  });
})();
