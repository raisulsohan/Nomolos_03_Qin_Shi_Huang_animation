(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, CH = F.china, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-28'), DUR = C.duration, GT0 = C.T.start;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A15 = () => F.getScene('seq-15').api, A6 = () => F.getScene('seq-06').api, A10 = () => F.getScene('seq-10').api, A27 = () => F.getScene('seq-27').api;
  const P = (lon, lat) => CH.proj(lon, lat);
  const TOP = () => A15().TOPH();

  const T_WEEKS = 0, T_DEAD = 1.35;
  const T_FORTY = 2.18, T_FAR = 3.65, T_CAP = 4.31, T_MIDDLE = 5.22, T_NOWHERE = 5.62;
  const T_NO = 6.39, T_AUT = 6.57, T_OBV = 7.31;
  const T_TRAD = 8.52, T_PASSED = 10.09, T_YEARS = 11.78, T_ELIX = 12.8, T_KILLED = 13.17, T_HIM = 13.5;

  const SHQ = P(115.15, 37.07), HD = PI;
  const VEH = () => { const g = A27().GAP; return [[SHQ[0] - g, SHQ[1], 'chariot'], [SHQ[0], SHQ[1], 'closed'], [SHQ[0] + g, SHQ[1], 'closed']]; };
  const HIM = () => VEH()[1];
  const toW = (f, l, u) => { const [px, py] = HIM(), s = A27().SC, c = Math.cos(HD), sn = Math.sin(HD); return [px + s * (f * c + l * sn), TOP() + u * s, -(py + s * (f * sn - l * c))]; };
  const toM = (f, l, u) => { const p = toW(f, l, u); return [p[0], -p[2], p[1]]; };
  const lamp = t => t < T_DEAD - .05 ? 1 + .05 * Math.sin(t * 13) : Math.max(0, 1 - ss(T_DEAD - .05, T_DEAD + .35, t)) * (.6 + .4 * Math.abs(Math.sin(t * 41)));
  const GUARDS = [[-5.2, -7.5], [14.6, -8.2]];
  const LANTERNS = [[-9.5, 4.2], [9.8, -4.0]];

  const WIN = { f0: -.55, f1: .35, u0: 1.25, u1: 1.8, l: .55, t: .035 };
  const WC = [-.1, .55, 1.525];
  const LAT_F = [-.55, -.37, -.19, -.01, .17, .35], LAT_U = [1.25, 1.4333, 1.6167, 1.8], BAR = .022;
  const IN = { f0: -.95, f1: .75, l0: -.55, l1: .55, u0: 1.0, u1: 2.25 };
  const CUP = [-.36, .02, 1.012];
  const TRAY = { f0: -.56, f1: -.14, l0: -.12, l1: .14, u: 1.006 };
  const LAMPP = [-.66, -.36];

  const NEAR = .004;
  function camera(c, f) {
    const yaw = c.yaw, ph = c.pitch, D = f / c.z, cp = Math.cos(ph), sp = Math.sin(ph);
    const fwd = [Math.sin(yaw) * cp, -sp, Math.cos(yaw) * cp], T = [c.x, c.lift, -c.y];
    const cam = S3.camera({ pos: [T[0] - fwd[0] * D, T[1] - fwd[1] * D, T[2] - fwd[2] * D], yaw, pitch: -ph, f, W, H, near: NEAR });
    cam.z = c.z; cam.ph = ph; cam.at = (x, y, h) => cam.proj([x, h, -y]);
    return cam;
  }
  const zf = pitch => M45 ? .62 + .26 * ss(40, 12, pitch) : 1;
  let DV = null;
  function dive() {
    if (DV) return DV;
    const a = toW(...CUP), b = toW(...WC), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d);
    const yaw = Math.atan2(-d[0], -d[2]), pitch = Math.atan2(d[1], Math.hypot(d[0], d[2]));
    return (DV = { a, L, yaw, pitch });
  }
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const top = TOP(), dv = dive(), f = A6().FLENS, cx = -dv.a[2], hx = HIM()[0];
    const zAt = Dd => f / Dd;
    const K = [
      [-.6, hx + 1.5, SHQ[1] - 1, 58, 11, 2, top + 3], [0, hx + 1.2, SHQ[1] - 1, 60, 11, 2, top + 3], [T_DEAD, hx + .4, SHQ[1] - 1, 64, 11.5, 2.5, top + 3],
      [T_DEAD + .45, hx, SHQ[1] - 1.5, 62, 13, 2.5, top + 3],
      [T_FAR - .2, 212, -40, 3.3, 56, 1, top], [T_NOWHERE + .4, 216, -44, 3.45, 55, 1.5, top],
      [T_OBV + .1, dv.a[0], cx, zAt(dv.L + 5.5), dv.pitch / D2R, dv.yaw / D2R, dv.a[1]],
      [T_TRAD + .8, dv.a[0], cx, zAt(dv.L - .35), dv.pitch / D2R, dv.yaw / D2R, dv.a[1]],
      [T_ELIX, dv.a[0], cx, zAt(1.45), dv.pitch / D2R + 2, dv.yaw / D2R, dv.a[1]],
      [DUR, dv.a[0], cx, zAt(1.2), dv.pitch / D2R + 3, dv.yaw / D2R + 1, dv.a[1]], [DUR + 1.4, dv.a[0], cx, zAt(1.12), dv.pitch / D2R + 3.4, dv.yaw / D2R + 1.3, dv.a[1]]];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function camAt(t) {
    const [sx, sy, sz, sp, sw, sl] = spl(), p = sp(t), zz = Math.exp(sz(t));
    const zk = lerp(zf(p), 1, smooth((Math.log(zz) - Math.log(20)) / Math.log(3)));
    return camera({ x: sx(t), y: sy(t), z: zz * zk, pitch: p * D2R, yaw: sw(t) * D2R, lift: sl(t) }, A6().FLENS);
  }
  function eyeIn(cam) {
    const [px, py] = HIM(), s = A27().SC, c = Math.cos(HD), sn = Math.sin(HD), dx = (cam.pos[0] - px) / s, dy = (-cam.pos[2] - py) / s;
    const f = dx * c + dy * sn, l = dx * sn - dy * c, u = (cam.pos[1] - TOP()) / s;
    const inOpening = l < IN.l1 + .05 && Math.abs(f - WC[0]) < .085 && Math.abs(u - WC[2]) < .085;
    return { f, l, u, inside: inOpening || (l < IN.l1 - .005 && l > IN.l0 && f > IN.f0 && f < IN.f1 && u > IN.u0 && u < IN.u1) };
  }

  const nightK = cam => { const d = Math.hypot(...cam.pos.map((v, i) => v - toW(...WC)[i])); return lerp(.9, .5, ss(9, 2.5, d)); };
  function night(ctx, k = .9) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(34,44,84,${k})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,.45)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function townLights(ctx, cam, t) {
    const sh = SH(), g = A10().geo();
    for (const l of g.lights) {
      const d = Math.hypot(l.x - SHQ[0], l.y - SHQ[1]), on = ss(14, 40, d); if (on <= 0) continue;
      const u = QM.up(cam, l.x, l.y, g.top + l.h); if (!u) continue;
      const tw = .85 + .15 * Math.sin(t * 9 + l.seed * 2.3), r = Math.min(26, 16 + 8 * Math.min(1.5, u.k / 2));
      PR.glow(ctx, u.x - sh.x, u.y - sh.y, r, '#ffc977', .5 * on * tw, 'flat');
      PR.glow(ctx, u.x - sh.x, u.y - sh.y, 3.5, '#fff3d6', .85 * on, 'flat');
    }
    const xy = A15().XY(), u = QM.up(cam, xy[0], xy[1], g.top + 6);
    if (u) { const k = 1 + .5 * Math.exp(-Math.pow((t - T_CAP - .15) / .35, 2)); PR.glow(ctx, u.x - sh.x, u.y - sh.y, Math.min(140, 60 * k + 2 * u.k), '#ffcf80', .5, 'flat'); PR.glow(ctx, u.x - sh.x, u.y - sh.y, 8, '#fff4dc', .9, 'flat'); }
  }

  function guard(x, cam, gx, gy, t) {
    const u = QM.up(cam, SHQ[0] + gx, SHQ[1] + gy, TOP()); if (!u) return;
    const h = 5.0 * u.k * (.5 + .5 * u.lev); if (h < 1.2) return;
    QM.soldier(x, u.x, u.y, h, 0, gx < 0 ? -1 : 1, { ink: '#14131c', rim: 'rgba(190,206,240,.45)' });
  }
  function lanternPole(x, cam, lx, ly) {
    const b = QM.up(cam, SHQ[0] + lx, SHQ[1] + ly, TOP()), tp = QM.up(cam, SHQ[0] + lx, SHQ[1] + ly, TOP() + 6.5); if (!b || !tp) return;
    x.strokeStyle = '#14131c'; x.lineWidth = Math.max(1, .25 * b.k); x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(tp.x, tp.y); x.stroke();
    x.fillStyle = '#e8a050'; x.beginPath(); x.ellipse(tp.x, tp.y + .5 * tp.k, .55 * tp.k, .8 * tp.k, 0, 0, TAU); x.fill();
  }
  function road(x, cam) {
    const h = TOP() + .03, pts = [[SHQ[0] - 140, SHQ[1] + 6], [SHQ[0] - 40, SHQ[1] + 1], [SHQ[0] + 40, SHQ[1] - .5], [SHQ[0] + 140, SHQ[1] - 10]];
    const rd = QM.road(pts); A27Ribbon(x, cam, rd, 0, rd.L, 3.2, h, '#cdb98e');
  }
  function A27Ribbon(x, cam, R, s0, s1, hw, h, col) {
    const L = [], Rr = [];
    for (let s = s0, done = false; !done; s += 2) {
      if (s >= s1) { s = s1; done = true; }
      const q = QM.along(R, s), nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
      const a = cam.at(q[0] + nx * hw, q[1] + ny * hw, h), b = cam.at(q[0] - nx * hw, q[1] - ny * hw, h);
      if (a && b) { L.push(a); Rr.push(b); }
    }
    if (L.length < 2) return;
    x.fillStyle = col; x.beginPath(); L.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) x.lineTo(Rr[i][0], Rr[i][1]); x.closePath(); x.fill();
  }
  const pinK = t => ss(T_FORTY - .3, T_FORTY + .2, t) * (1 - ss(T_NO - .2, T_NO + .4, t));
  const lineK = t => ss(T_FAR - .05, T_CAP + .35, t) * (1 - ss(T_NO - .3, T_NO + .3, t));
  function mapMarks(x, cam, t) {
    const h = TOP() + .06, pk = pinK(t);
    if (pk > 0) {
      for (const [r, a] of [[7, .9], [11 + 3 * ((t * .8) % 1), .5 * (1 - (t * .8) % 1)]]) {
        x.strokeStyle = `rgba(236,232,220,${a * pk})`; x.lineWidth = 2; x.beginPath(); QM.ring(x, cam, QM.disk(SHQ[0], SHQ[1], r, 48), h); x.stroke();
      }
    }
    const lk = lineK(t);
    if (lk > 0) {
      const xy = A15().XY(), n = 60, m = Math.floor(n * ss(T_FAR - .05, T_CAP + .3, t));
      x.fillStyle = `rgba(236,232,220,${.85 * lk})`;
      for (let i = 2; i <= m; i++) { const k = i / n, p = cam.at(lerp(SHQ[0], xy[0], k), lerp(SHQ[1], xy[1], k), h); if (!p) continue; x.beginPath(); x.arc(p[0], p[1], Math.max(1.6, .5 * p[3]), 0, TAU); x.fill(); }
    }
  }

  const quadL = (x, cam, pts, col) => { if (S3.poly(x, cam, pts.map(p => toW(...p)))) { x.fillStyle = col; x.fill(); return true; } return false; };
  const MOON = [-.1, -1, -1.25];
  const onFloor = (f, u) => { const k = (u - IN.u0) / -MOON[2]; return [f + MOON[0] * k, IN.l1 + MOON[1] * k, IN.u0 + .002]; };
  function interior(x, cam, t) {
    quadL(x, cam, [[IN.f0, IN.l0, IN.u0], [IN.f1, IN.l0, IN.u0], [IN.f1, IN.l1, IN.u0], [IN.f0, IN.l1, IN.u0]], '#1c1720');
    quadL(x, cam, [[IN.f0, IN.l0, IN.u0], [IN.f1, IN.l0, IN.u0], [IN.f1, IN.l0, IN.u1], [IN.f0, IN.l0, IN.u1]], '#15121b');
    quadL(x, cam, [[IN.f0, IN.l0, IN.u0], [IN.f0, IN.l1, IN.u0], [IN.f0, IN.l1, IN.u1], [IN.f0, IN.l0, IN.u1]], '#18141e');
    quadL(x, cam, [[IN.f1, IN.l0, IN.u0], [IN.f1, IN.l1, IN.u0], [IN.f1, IN.l1, IN.u1], [IN.f1, IN.l0, IN.u1]], '#18141e');
    quadL(x, cam, [[IN.f0, IN.l0, IN.u1], [IN.f1, IN.l0, IN.u1], [IN.f1, IN.l1, IN.u1], [IN.f0, IN.l1, IN.u1]], '#0f0d14');
    x.strokeStyle = 'rgba(190,150,80,.35)'; x.lineWidth = 2; x.beginPath();
    for (const u of [1.3, 1.95]) { S3.line(x, cam, toW(IN.f0, IN.l0 + .003, u), toW(IN.f1, IN.l0 + .003, u)); S3.line(x, cam, toW(IN.f0 + .003, IN.l0, u), toW(IN.f0 + .003, IN.l1, u)); S3.line(x, cam, toW(IN.f1 - .003, IN.l0, u), toW(IN.f1 - .003, IN.l1, u)); }
    x.stroke();
    quadL(x, cam, [[-.85, -.5, IN.u0 + .001], [.65, -.5, IN.u0 + .001], [.65, .5, IN.u0 + .001], [-.85, .5, IN.u0 + .001]], '#2a2228');
    x.strokeStyle = 'rgba(10,8,12,.28)'; x.lineWidth = 1; x.beginPath(); for (let f = -.85; f <= .65; f += .1) S3.line(x, cam, toW(f, -.5, IN.u0 + .002), toW(f, .5, IN.u0 + .002)); x.stroke();
    for (let i = 0; i < LAT_F.length - 1; i++) for (let j = 0; j < LAT_U.length - 1; j++) {
      const f0 = LAT_F[i] + BAR / 2, f1 = LAT_F[i + 1] - BAR / 2, u0 = LAT_U[j] + BAR / 2, u1 = LAT_U[j + 1] - BAR / 2;
      quadL(x, cam, [onFloor(f0, u0), onFloor(f1, u0), onFloor(f1, u1), onFloor(f0, u1)], 'rgba(178,196,240,.42)');
    }
    const lb = toW(LAMPP[0], LAMPP[1], IN.u0);
    S3.cyl(x, cam, [lb[0], lb[2]], .045 * A27().SC, lb[1], lb[1] + .035 * A27().SC, { col: '#6a4a26', light: [.3, .8, .4], lo: .4 });
    S3.cyl(x, cam, [lb[0], lb[2]], .07 * A27().SC, lb[1] + .035 * A27().SC, lb[1] + .05 * A27().SC, { col: '#7a5a30', light: [.3, .8, .4], lo: .4 });
    x.save(); x.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      x.strokeStyle = `rgba(190,190,206,${.5 - .15 * k})`; x.lineWidth = Math.max(1.5, 2.5 - .8 * k); x.beginPath();
      for (let i = 0; i <= 24; i++) { const v = i / 24, p = toW(LAMPP[0] + .03 * Math.sin(v * 7 + t * 1.3 + k) * v, LAMPP[1] + .02 * Math.cos(v * 5 + t + k), IN.u0 + .06 + .7 * v); const q = cam.proj(p); if (!q) continue; i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }
      x.stroke();
    }
    x.restore();
    quadL(x, cam, [[TRAY.f0, TRAY.l0, TRAY.u], [TRAY.f1, TRAY.l0, TRAY.u], [TRAY.f1, TRAY.l1, TRAY.u], [TRAY.f0, TRAY.l1, TRAY.u]], '#7a2018');
    const e = .018; quadL(x, cam, [[TRAY.f0 + e, TRAY.l0 + e, TRAY.u + .002], [TRAY.f1 - e, TRAY.l0 + e, TRAY.u + .002], [TRAY.f1 - e, TRAY.l1 - e, TRAY.u + .002], [TRAY.f0 + e, TRAY.l1 - e, TRAY.u + .002]], '#141016');
    silverPool(x, cam, t);
    cupDown(x, cam, t);
    bead(x, cam, t);
  }
  const MOUTH = [CUP[0] + .085, CUP[1] + .01, TRAY.u + .003];
  function cupDown(x, cam, t) {
    const p = cam.proj(toW(...CUP)), m = cam.proj(toW(...MOUTH)); if (!p || !m) return;
    const s = p[3] * A27().SC / 140, ang = Math.atan2(m[1] - p[1], m[0] - p[0]);
    x.save(); x.translate(p[0], p[1]); x.rotate(ang + PI / 2);
    x.fillStyle = 'rgba(4,3,8,.5)'; x.beginPath(); x.ellipse(-1.6 * s, -3.6 * s, 2.4 * s, 7 * s, 0, 0, TAU); x.fill();
    x.translate(2.4 * s, 0);
    Q.cup(x, { s, elev: .9, fill: 0, k: 0 });
    x.restore();
  }
  function silverPool(x, cam, t) {
    const c = toW(MOUTH[0] + .025, MOUTH[1] + .005, MOUTH[2]), q = cam.proj(c); if (!q) return;
    const r = .028 * A27().SC * q[3];
    x.save(); x.translate(q[0], q[1]); x.scale(1, .45);
    const g = x.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, '#d6dbe4'); g.addColorStop(.85, '#7d838e'); g.addColorStop(1, 'rgba(90,96,108,.0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill(); x.restore();
  }
  const B0 = T_ELIX - .1, B1 = T_HIM + .1;
  function beadAt(t) {
    const u = easeIO(clamp((t - B0) / (B1 - B0))), a = [MOUTH[0] + .03, MOUTH[1] + .01], edge = [MOUTH[0] + .015, TRAY.l1], end = [MOUTH[0] + .025, TRAY.l1 + .014];
    const k1 = .62, onT = u < k1;
    const fl = onT ? [lerp(a[0], edge[0], u / k1), lerp(a[1], edge[1], u / k1)] : [lerp(edge[0], end[0], (u - k1) / (1 - k1)), lerp(edge[1], end[1], (u - k1) / (1 - k1))];
    const drop = onT ? 0 : Math.min(1, (u - k1) / .12);
    return [fl[0], fl[1], lerp(TRAY.u + .012, IN.u0 + .012, drop), u];
  }
  function bead(x, cam, t) {
    if (t < B0 - .5) return;
    const b = beadAt(t), q = cam.proj(toW(b[0], b[1], b[2])); if (!q) return;
    const r = Math.max(2, .011 * A27().SC * q[3]);
    x.fillStyle = 'rgba(8,6,10,.4)'; x.beginPath(); x.ellipse(q[0] + r * .2, q[1] + r * .5, r, r * .4, 0, 0, TAU); x.fill();
    const g = x.createRadialGradient(q[0] - r * .35, q[1] - r * .4, 0, q[0], q[1], r * 1.05); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, '#dfe4ea'); g.addColorStop(.8, '#8d949e'); g.addColorStop(1, '#5d636c');
    x.fillStyle = g; x.beginPath(); x.arc(q[0], q[1], r, 0, TAU); x.fill();
  }
  function lattice(x, cam) {
    const col = '#2a2532';
    for (const f of LAT_F) quadL(x, cam, [[f - BAR / 2, WIN.l, WIN.u0], [f + BAR / 2, WIN.l, WIN.u0], [f + BAR / 2, WIN.l, WIN.u1], [f - BAR / 2, WIN.l, WIN.u1]], col);
    for (const u of LAT_U) quadL(x, cam, [[WIN.f0, WIN.l, u - BAR / 2], [WIN.f1, WIN.l, u - BAR / 2], [WIN.f1, WIN.l, u + BAR / 2], [WIN.f0, WIN.l, u + BAR / 2]], col);
  }
  function windowOutside(x, cam, t) {
    const q = [[WIN.f0, WIN.l + .002, WIN.u0], [WIN.f1, WIN.l + .002, WIN.u0], [WIN.f1, WIN.l + .002, WIN.u1], [WIN.f0, WIN.l + .002, WIN.u1]].map(p => toW(...p));
    const lit = lamp(t);
    x.save();
    if (!S3.poly(x, cam, q)) { x.restore(); return; }
    x.fillStyle = lit > .01 ? S3.mix('#0e0d14', '#ffd890', clamp(lit)) : '#0b0a10'; x.fill();
    if (lit < .99 && cam.pos[1] < TOP() + 40) { x.clip(); interior(x, cam, t); }
    x.restore();
    lattice(x, cam);
  }

  const FAST = { land: 4, blocks: 5 };
  function outside(ctx, t, cam) {
    const near = cam.pos[1] < TOP() + 40;
    QM.FAST = FAST;
    try { A15().mapFrame(ctx, A27().TF, cam, false, {
      isle: { t: 60 + t, quiet: true, alpha: 1, glow: .3 },
      sky: A27().sky,
      onTop: x => road(x, cam),
      uprights: put => {
        VEH().forEach(([vx, vy, kind], i) => put(vx, vy, TOP(), x => {
          A27().vehicle(x, cam, vx, vy, HD, kind, t, { go: 0, lit: false, aim: 0, lightK: 0, kick: 0, head: .7 });
          if (i === 1 && near) windowOutside(x, cam, t);
        }));
        GUARDS.forEach(([gx, gy]) => put(SHQ[0] + gx, SHQ[1] + gy, TOP(), x => guard(x, cam, gx, gy, t)));
        LANTERNS.forEach(([lx, ly]) => put(SHQ[0] + lx, SHQ[1] + ly, TOP(), x => lanternPole(x, cam, lx, ly)));
      },
    }); } finally { QM.FAST = null; }
    night(ctx, nightK(cam));
    const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); mapMarks(ctx, cam, t); ctx.restore();
    townLights(ctx, cam, t);
    for (const [lx, ly] of LANTERNS) { const u = QM.up(cam, SHQ[0] + lx, SHQ[1] + ly, TOP() + 6.2); if (u) { const fl = 1 + .08 * Math.sin(t * 9 + lx); PR.glow(ctx, u.x - sh.x, u.y - sh.y, Math.min(90, Math.max(8, 2.2 * u.k)) * fl, '#ffb868', .55, 'flat'); } }
    const lw = lamp(t);
    if (lw > .01) { const q = cam.proj(toW(...WC)); if (q) PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.max(16, 1.6 * q[3]), '#ffd890', .7 * lw, 'flat'); }
  }
  function inside(ctx, t, cam) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07060b'; ctx.fillRect(0, 0, W, H); ctx.restore();
    FL.sheet(ctx, ID, 1, RC, x => interior(x, cam, t), { shadow: false });
    night(ctx, nightK(cam));
  }
  function glowsIn(ctx, t, cam) {
    const sh = SH();
    const cq = cam.proj(toW(CUP[0] + .04, CUP[1], CUP[2] + .04)); if (cq) PR.glow(ctx, cq[0] - sh.x, cq[1] - sh.y, Math.min(260, .07 * A27().SC * cq[3]), '#a8b8e8', .22, 'flat');
    const pool = cam.proj(toW(MOUTH[0] + .025, MOUTH[1] + .005, MOUTH[2])); if (pool) PR.glow(ctx, pool[0] - sh.x, pool[1] - sh.y, Math.min(120, Math.max(6, .025 * A27().SC * pool[3])), '#dfe8ff', .3, 'flat');
    if (t >= B0 - .5) { const b = beadAt(t), q = cam.proj(toW(b[0], b[1], b[2])); if (q) PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.min(80, Math.max(6, .018 * A27().SC * q[3])), '#eef3ff', .5, 'flat'); }
  }
  function frame(ctx, t, cam, o = {}) {
    const e = eyeIn(cam);
    if (e.inside) inside(ctx, t, cam); else outside(ctx, t, cam);
    if (cam.pos[1] < TOP() + 40) glowsIn(ctx, t, cam);
    if (!o.noText) F.impact(FL, ctx, t, { lines: [{ text: '49', t0: T_FORTY + .05, size: M45 ? 210 : 240, color: '#f5ecd8' }], x: M45 ? .5 : .24, y: M45 ? .14 : .22, out: T_NOWHERE + .55, accent: '#d9a443', minW: M45 ? 480 : 560 });
    FL.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-28', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-27', dur: .9, dir: 'right' },
    sfx: [
      { t: .9, type: 'wind', dur: 5, g: .04 },
      { t: .95, type: 'lib', dur: T_DEAD + .2, label: 'NIGHT ON AN EMPTY PLAIN: CRICKETS, A HORSE SHIFTING, HARNESS' },
      { t: T_DEAD - .05, type: 'hiss', dur: .4, g: .06 },
      { t: T_DEAD + .3, type: 'heartbeat', g: .18 },
      { t: T_DEAD + .55, type: 'whoosh', f0: 60, f1: 150, dur: 2, g: .1 },
      { t: T_FORTY + .05, type: 'impact', size: .35, g: .3, noSnap: true },
      { t: T_FAR, type: 'slide', dur: T_CAP - T_FAR + .3, g: .06 },
      { t: T_CAP + .1, type: 'shimmer', g: .06 },
      { t: T_NOWHERE, type: 'hum', dur: 1.6, g: .06 },
      { t: T_NO - .3, type: 'whoosh', f0: 160, f1: 70, dur: 2.0, g: .1 },
      { t: T_OBV + .3, type: 'creak', dur: .3, g: .06 },
      { t: T_TRAD + .3, type: 'swoosh', dur: 1.2, g: .05 },
      { t: T_PASSED, type: 'hum', dur: T_ELIX - T_PASSED, g: .05 },
      { t: B0 + .05, type: 'clink', f: 3600, g: .05 },
      { t: B0 + (B1 - B0) * .58, type: 'drip', g: .06, noSnap: true },
      { t: T_HIM + .1, type: 'tick', g: .05 },
    ],
    api: { DUR, camAt, frame, SHQ, HIM, toW },
  });
})();
