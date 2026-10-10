(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Q = F.qin, PR = F.props, { clamp, lerp, smooth, TAU } = F;
  const RV = (F.reversal = {});
  const PI = Math.PI, ss = (a, b, t) => smooth((t - a) / (b - a));
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const A14 = () => F.getScene('seq-14').api, R = () => A14().room;
  RV.hash = hash;

  const CUP = [0, 0, 2.6], CUPM = .19;
  const B1 = { x0: -60, x1: 60, y0: -5.0, y1: -.9, z1: 9.5 };
  const GRAVE = { x0: .08, x1: .68, z0: 2.35, z1: 3.25 }, ROAD = { z0: 2.2, z1: 3.4 };
  const ROW = Array.from({ length: 9 }, (_, i) => [-7.4 + i * .7, 3.85]);
  const CM1 = .03;
  const RO = [.3, -10.5, 3.9];
  const B2 = { x0: -3.5, x1: 3.5, y0: -10.5, y1: -7.3 };
  const LINTEL = B2.y0 + 1.95;
  const B3 = { x0: -60, x1: 60, y0: -15.5, y1: -12.0, z1: 9.5 };
  const OPEN = [
    [[B1.x0, B1.y1], [B1.x1, B1.y1], [B1.x1, B1.y0], [B1.x0, B1.y0]],
    [[B2.x0, LINTEL], [B2.x1, LINTEL], [B2.x1, B2.y0], [B2.x0, B2.y0]],
    [[B3.x0, B3.y1], [B3.x1, B3.y1], [B3.x1, B3.y0], [B3.x0, B3.y0]],
  ];
  Object.assign(RV, { CUP, CUPM, B1, B2, B3, LINTEL, GRAVE, ROAD, ROW, CM1, RO, OPEN });

  const inFront = (cam, a, b) => {
    const da = cam.depth(a), db = cam.depth(b), m = .15; if (da >= m) return cam.proj(a); if (db <= m) return null;
    const u = (m - da) / (db - da); return cam.proj([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]);
  };
  RV.inFront = inFront;
  RV.cam = (e, g, f, W, H, o = {}) => { const d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]]; return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, W, H, near: o.near ?? .03 }); };
  const roomCam = cam => S3.camera({ pos: [RO[0] - cam.pos[0], cam.pos[1] - RO[1], RO[2] - cam.pos[2]], yaw: cam.yaw + PI, pitch: cam.pitch, f: cam.f, W: cam.W, H: cam.H, cx: cam.cx, cy: cam.cy, near: cam.near });
  RV.roomCam = roomCam;
  RV.toRoom = p => [RO[0] - p[0], p[1] - RO[1], RO[2] - p[2]];
  RV.fromRoom = p => [RO[0] - p[0], p[1] + RO[1], RO[2] - p[2]];
  RV.inside = cam => {
    const [x, y, z] = cam.pos;
    if (x > GRAVE.x0 && x < GRAVE.x1 && z > GRAVE.z0 && z < GRAVE.z1 && y < B1.y0 + .04 && y > B2.y1 + .04) return 4;
    if (z < -.35) return 0;
    if (y > B1.y0 - .05 && y < B1.y1 + .05 && x > B1.x0 && x < B1.x1) return 1;
    if (y > B2.y0 - .05 && y < B2.y1 + .05 && x > B2.x0 - .1 && x < B2.x1 + .1) return 2;
    if (y > B3.y0 - .05 && y < B3.y1 + .05 && x > B3.x0 && x < B3.x1) return 3;
    return 0;
  };

  const SPR = new Map();
  function sprite(col) {
    let c = SPR.get(col); if (c) return c;
    const [cv, x] = F.canvas(128, 128), n = parseInt(col.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.3, `rgba(${r},${g},${b},.5)`); gr.addColorStop(.65, `rgba(${r},${g},${b},.14)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); SPR.set(col, cv); return cv;
  }
  RV.glow = (ctx, X, Y, r, col, a, sy = 1) => {
    if (!(a > .003) || !(r > .5)) return;
    const base = ctx.globalAlpha;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a) * base; ctx.drawImage(sprite(col), X - r, Y - r * sy, 2 * r, 2 * r * sy); ctx.restore();
  };
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  RV.SH = SH;

  const LIGHTDIR = [.24, 0, .97];
  function sky(x, cam, st) {
    const W = cam.W, H = cam.H, far = 1e4, hz = cam.proj([cam.pos[0] + far * Math.sin(cam.yaw), 0, cam.pos[2] + far * Math.cos(cam.yaw)]), hy = hz ? hz[1] : H * .5;
    const g = x.createLinearGradient(0, hy - H * 1.1, 0, hy + 10); g.addColorStop(0, '#03031a'); g.addColorStop(.6, '#0c0b2c'); g.addColorStop(.9, '#1e1844'); g.addColorStop(1, '#2a1f4a');
    x.fillStyle = g; x.fillRect(-W, -H, 3 * W, 3 * H);
    const L = cam.proj([cam.pos[0] + far * LIGHTDIR[0], 30, cam.pos[2] + far * LIGHTDIR[2]]), k = st.horizon ?? 1;
    if (L && k > .01) {
      const r = H * (.55 + .25 * k), gg = x.createRadialGradient(L[0], hy, 0, L[0], hy, r);
      gg.addColorStop(0, `rgba(255,190,110,${.55 * k})`); gg.addColorStop(.25, `rgba(214,120,70,${.3 * k})`); gg.addColorStop(1, 'rgba(60,30,60,0)');
      x.save(); x.translate(L[0], hy); x.scale(2.4, 1); x.translate(-L[0], -hy); x.fillStyle = gg; x.fillRect(L[0] - r, hy - r, 2 * r, 2 * r); x.restore();
    }
    const half = Math.atan(W / 2 / cam.f) + .35;
    for (const [Rd, hgt, col, seed] of [[520, 34, '#100e2c', 3], [190, 11, '#0a0922', 7]]) {
      x.fillStyle = col; x.beginPath(); let n = 0;
      for (let i = 0; i <= 80; i++) { const az = cam.yaw - half + 2 * half * i / 80, h = hgt * (.35 + .65 * (F.noise1(az * 7 + Rd, seed) + 1) / 2), p = cam.proj([cam.pos[0] + Rd * Math.sin(az), h, cam.pos[2] + Rd * Math.cos(az)]); if (p) { n++ ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } }
      if (n > 1) { x.lineTo(W * 3, H * 3); x.lineTo(-W * 2, H * 3); x.closePath(); x.fill(); }
    }
  }
  function sheen(x, cam, st) {
    const k = (st.horizon ?? 1) * (st.sheen ?? 1) * (1 - .6 * (st.cut ?? 0)); if (k <= .01) return;
    const far = 1e4, hz = cam.proj([cam.pos[0] + far * Math.sin(cam.yaw), 0, cam.pos[2] + far * Math.cos(cam.yaw)]), L = cam.proj([cam.pos[0] + far * LIGHTDIR[0], 0, cam.pos[2] + far * LIGHTDIR[2]]); if (!hz || !L) return;
    const hy = hz[1], rx = cam.W * .22, ry = cam.H * .9;
    x.save(); x.beginPath(); x.rect(-cam.W, hy, 3 * cam.W, 3 * cam.H); x.clip();
    const g = x.createRadialGradient(L[0], hy, 0, L[0], hy, ry); g.addColorStop(0, `rgba(200,140,120,${.32 * k})`); g.addColorStop(.35, `rgba(120,86,118,${.14 * k})`); g.addColorStop(1, 'rgba(60,50,90,0)');
    x.translate(L[0], hy); x.scale(rx / ry, 1); x.translate(-L[0], -hy); x.fillStyle = g; x.fillRect(L[0] - ry, hy - ry, 2 * ry, 2 * ry); x.restore();
  }
  function cupShadow(x, cam, st, zMin) {
    const L = st.shadow ?? 2.4; if (L <= .05) return;
    const c = CUP, w = 1.15, pts = [];
    const prof = u => u < .12 ? .16 + (w * .6 - .16) * (u / .12) : u < .7 ? w * (.6 + .4 * Math.sin(PI / 2 * (u - .12) / .58)) : w * Math.sqrt(Math.max(0, 1 - Math.pow((u - .7) / .3, 2)));
    const dx = LIGHTDIR[0] / LIGHTDIR[2];
    for (let i = 0; i <= 24; i++) { const u = i / 24, z = c[2] - L * u; pts.push([c[0] - dx * (c[2] - z) + prof(u) * (.6 + .4 * u), .004, z]); }
    for (let i = 24; i >= 0; i--) { const u = i / 24, z = c[2] - L * u; pts.push([c[0] - dx * (c[2] - z) - prof(u) * (.6 + .4 * u), .004, z]); }
    const cut = pts.map(p => [p[0], p[1], Math.max(zMin, p[2])]);
    if (!S3.poly(x, cam, cut)) return;
    const a = cam.proj([c[0], 0, c[2]]), b = cam.proj([c[0], 0, Math.max(zMin, c[2] - L, cam.pos[2] + .5)]), sa = st.shadowA ?? 1;
    if (a && b && Math.abs(b[1] - a[1]) > 1) { const g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, `rgba(2,2,10,${.72 * sa})`); g.addColorStop(1, `rgba(2,2,10,${.35 * sa})`); x.fillStyle = g; } else x.fillStyle = `rgba(2,2,10,${.6 * sa})`;
    x.fill();
  }
  function farGround(x, cam, st) {
    if (cam.pos[1] <= 0) return;
    const k = st.horizon ?? 1, far = 1e4, hz = cam.proj([cam.pos[0] + far * Math.sin(cam.yaw), 0, cam.pos[2] + far * Math.cos(cam.yaw)]), hy = hz ? hz[1] : cam.H * .5;
    if (S3.poly(x, cam, [[-4000, 0, 0], [4000, 0, 0], [4000, 0, 4000], [-4000, 0, 4000]])) {
      const gp = x.createLinearGradient(0, hy, 0, cam.H); gp.addColorStop(0, S3.mix('#0d0b26', '#3a2840', .7 * k)); gp.addColorStop(.25, '#0d0b26'); gp.addColorStop(1, '#07061a');
      x.fillStyle = gp; x.fill();
    }
  }
  function nearGround(x, cam, st) {
    const a = 1 - (st.cut ?? 0); if (a <= .002 || cam.pos[1] <= 0) return;
    x.save(); x.globalAlpha = a;
    if (S3.poly(x, cam, [[-4000, 0, -400], [4000, 0, -400], [4000, 0, 0], [-4000, 0, 0]])) { x.fillStyle = '#07061a'; x.fill(); }
    cupShadow(x, cam, st, -400);
    x.restore();
  }
  function cupEmblem(x, cam, st) {
    const p = CUP, e = Math.atan2(cam.pos[1] - (p[1] + .7), Math.hypot(cam.pos[0] - p[0], cam.pos[2] - p[2]));
    S3.onPlane(x, cam, p, [Math.cos(cam.yaw) * CUPM, 0, -Math.sin(cam.yaw) * CUPM], [0, -CUPM, 0], xx => Q.cup(xx, { s: 1, elev: Math.max(.08, e), fill: .7, liquid: S3.mix('#5d6270', '#d8dee8', st.silver ?? .6), k: .8, beads: [] }));
  }
  RV.cupAt = (cam, h = 1.05) => cam.proj([CUP[0], CUP[1] + h, CUP[2]]);
  RV.plain = { sky, sheen, cupShadow, farGround, nearGround, LIGHTDIR };

  const STRATA = [[0, '#2c2354'], [-.22, '#1d1842'], [-.6, '#15123a'], [-.9, '#0f0d29'], [-5, '#221c4c'], [-5.45, '#2e2660'], [-5.9, '#1b1640'], [-6.5, '#251f52'], [-6.9, '#130f32'], [-7.3, '#100e2a'],
    [-10.5, '#262052'], [-10.9, '#1a1640'], [-11.4, '#221c4a'], [-12, '#0f0d28'], [-15.5, '#211b4a'], [-16.1, '#16123a'], [-16.9, '#1d1844'], [-18, '#0c0a22']];
  function onFrame(s, cam) {
    const W = cam.W, H = cam.H, edges = [[0, -W, 1], [0, 2 * W, -1], [1, -H, 1], [1, 2 * H, -1]];
    let P = s;
    for (const [k, lim, sg] of edges) {
      const out = [], n = P.length; if (n < 3) return [];
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n], ia = sg * (a[k] - lim) >= 0, ib = sg * (b[k] - lim) >= 0;
        if (ia) out.push(a);
        if (ia !== ib) { const u = (lim - a[k]) / (b[k] - a[k]); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
      }
      P = out;
    }
    return P;
  }
  RV.onFrame = onFrame;
  function facePath(x, cam) {
    const ring = pts => { const s = onFrame(S3.clip(cam, pts.map(([X, Y]) => [X, Y, 0])), cam); if (s.length < 3) return false; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
    x.beginPath();
    if (!ring([[-90, 0], [90, 0], [90, -60], [-90, -60]])) return false;
    for (const o of OPEN) ring(o);
    return true;
  }
  function mouthPath(x, cam, i) { const s = onFrame(S3.clip(cam, OPEN[i].map(([X, Y]) => [X, Y, 0])), cam); x.beginPath(); if (s.length < 3) return false; s.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; }
  RV.mouthPath = mouthPath;
  function face(x, cam, st) {
    if (cam.pos[2] >= -.002) return;
    x.save();
    if (!facePath(x, cam)) { x.restore(); return; }
    x.clip('evenodd');
    for (let i = 0; i < STRATA.length; i++) {
      const [y0, col] = STRATA[i], y1 = i + 1 < STRATA.length ? STRATA[i + 1][0] : -60, wv = (X, k) => k && ![3, 9, 13].includes(k) ? .14 * F.noise1(X * .3 + k * 3.1, 40 + k) + .05 * F.noise1(X * 1.7, 70 + k) : 0, P = [];
      for (let k = 0; k <= 90; k++) { const X = -90 + 180 * k / 90; P.push([X, y0 + wv(X, i), 0]); }
      for (let k = 90; k >= 0; k--) { const X = -90 + 180 * k / 90; P.push([X, y1 + wv(X, i + 1), 0]); }
      if (S3.poly(x, cam, P)) { x.fillStyle = col; x.fill(); }
      if (i) { x.strokeStyle = 'rgba(120,108,190,.22)'; x.lineWidth = Math.max(1, cam.f / 1600); x.beginPath(); let pen = false; for (let k = 0; k <= 90; k++) { const q = cam.proj(P[k]); if (!q) { pen = false; continue; } pen ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); pen = true; } x.stroke(); }
    }
    for (let i = 0; i < 70; i++) {
      const X = -30 + 60 * hash(i, 1), Y = -.4 - 17 * hash(i, 2), r = .06 + .25 * hash(i, 3) * hash(i, 4), q = cam.proj([X, Y, 0]); if (!q || q[0] < -60 || q[0] > cam.W + 60 || q[1] < -60 || q[1] > cam.H + 60) continue;
      x.fillStyle = S3.mix('#221d4a', '#2f2a5e', hash(i, 5)); x.beginPath(); x.ellipse(q[0], q[1], r * q[3], r * q[3] * .6, hash(i, 6) * 3, 0, TAU); x.fill();
    }
    x.restore();
    const lit = st.lit || [0, 0, 0], nearK = ss(.04, .3, -cam.pos[2]);
    OPEN.forEach((o, i) => {
      const a = lit[i] * nearK; if (a <= .01) return;
      const s = onFrame(S3.clip(cam, o.map(([X, Y]) => [X, Y, 0])), cam); if (s.length < 3) return;
      x.beginPath(); s.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath();
      x.strokeStyle = ['#cfdcff', '#ffc27a', '#ffcf6a'][i]; x.globalAlpha = .75 * a; x.lineWidth = Math.max(1.5, 2.5 * Math.min(1, cam.f / 1500)); x.lineJoin = 'round'; x.stroke(); x.globalAlpha = 1;
    });
  }

  const Y1 = B1.y0;
  const ridge = (z, hgt, seed) => { const P = []; for (let i = 0; i <= 160; i++) { const X = B1.x0 + (B1.x1 - B1.x0) * i / 160; P.push([X, Y1 + hgt * (.25 + .75 * (F.noise1(X * .22, seed) + 1) / 2), z]); } return P; };
  const RIDGES = [[8.3, 1.25, '#0c0b26', 11], [6.4, .7, '#121035', 13]].map(([z, h, col, s]) => ({ z, col, P: ridge(z, h, s) }));
  function band1(x, cam, st) {
    const lit = (st.lit || [0])[0];
    if (S3.poly(x, cam, [[B1.x0, Y1, B1.z1], [B1.x1, Y1, B1.z1], [B1.x1, B1.y1, B1.z1], [B1.x0, B1.y1, B1.z1]])) {
      const a = inFront(cam, [cam.pos[0], Y1 + .3, B1.z1], [cam.pos[0], Y1 + .3, cam.pos[2] + 2]), b = inFront(cam, [cam.pos[0], B1.y1, B1.z1], [cam.pos[0], B1.y1, cam.pos[2] + 2]);
      if (a && b) { const g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, S3.mix('#14143a', '#dfe6f6', .92 * lit)); g.addColorStop(.25, S3.mix('#100f30', '#8d97c4', .8 * lit)); g.addColorStop(.7, S3.mix('#0b0a24', '#2c2f62', .7 * lit)); g.addColorStop(1, '#09081e'); x.fillStyle = g; } else x.fillStyle = '#0b0a24';
      x.fill();
    }
    S3.face(x, cam, [[B1.x0, B1.y1, 0], [B1.x0, B1.y1, B1.z1], [B1.x1, B1.y1, B1.z1], [B1.x1, B1.y1, 0]], '#07061a', [0, -1, 0]);
    for (const r of RIDGES) { const P = r.P.concat([[B1.x1, Y1, r.z], [B1.x0, Y1, r.z]]); if (S3.poly(x, cam, P)) { x.fillStyle = r.col; x.fill(); } }
    if (cam.pos[1] > Y1) {
      if (S3.poly(x, cam, [[B1.x0, Y1, 0], [B1.x1, Y1, 0], [B1.x1, Y1, B1.z1], [B1.x0, Y1, B1.z1]])) {
        const a = inFront(cam, [cam.pos[0], Y1, B1.z1], [cam.pos[0], Y1, cam.pos[2] + 1]), b = inFront(cam, [cam.pos[0], Y1, Math.max(0, cam.pos[2] + .6)], [cam.pos[0], Y1, B1.z1]);
        if (a && b) { const g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, S3.mix('#0c0b24', '#4a4a78', .55 * lit)); g.addColorStop(.35, '#0c0b22'); g.addColorStop(1, '#07061a'); x.fillStyle = g; } else x.fillStyle = '#0a0920';
        x.fill();
      }
      if (S3.poly(x, cam, [[B1.x0, Y1 + .002, ROAD.z0], [GRAVE.x0, Y1 + .002, ROAD.z0], [GRAVE.x0, Y1 + .002, ROAD.z1], [B1.x0, Y1 + .002, ROAD.z1]])) { x.fillStyle = S3.mix('#100f2a', '#2a2a52', .6 * lit); x.fill(); }
      x.strokeStyle = 'rgba(5,4,16,.6)'; x.lineWidth = Math.max(1, cam.f / 1200); x.beginPath(); for (const z of [2.55, 3.05]) S3.line(x, cam, [B1.x0, Y1 + .004, z], [GRAVE.x0, Y1 + .004, z]); x.stroke();
      graveIn(x, cam, st);
    }
    const heap = []; for (let i = 0; i <= 18; i++) { const u = i / 18; heap.push([GRAVE.x0 - .4 + (GRAVE.x1 - GRAVE.x0 + 1.3) * u, Y1 + .9 * Math.pow(Math.sin(PI * u), .7) * (1 + .07 * Math.sin(u * 19)), 4.2]); }
    if (S3.poly(x, cam, heap)) { x.fillStyle = '#0e0c26'; x.fill(); }
    const cs = st.cups || [];
    ROW.map((r, i) => ({ i, d: cam.depth([r[0], Y1 + .1, r[1]]) })).filter(o => o.d > .15).sort((a, b) => b.d - a.d).forEach(({ i }) => {
      const c = cs[i] || {}; RV.rowCup(x, cam, i, c.fill ?? .62, c.lit ?? .15);
      if (i === 0) RV.tag(x, cam, st.tagTh ?? -.35);
    });
  }
  const holePath = (x, cam, y) => Math.abs(cam.pos[1] - y) > .04 && S3.poly(x, cam, [[GRAVE.x0, y, GRAVE.z0], [GRAVE.x1, y, GRAVE.z0], [GRAVE.x1, y, GRAVE.z1], [GRAVE.x0, y, GRAVE.z1]]);
  RV.holePath = holePath;
  function shaftWalls(x, cam, st) {
    const { x0, x1, z0, z1 } = GRAVE, y0 = B2.y1, g = st.grave ?? 0;
    const walls = [[[[x0, Y1, z0], [x1, Y1, z0], [x1, y0, z0], [x0, y0, z0]], [0, 0, 1]], [[[x1, Y1, z1], [x0, Y1, z1], [x0, y0, z1], [x1, y0, z1]], [0, 0, -1]],
      [[[x0, Y1, z1], [x0, Y1, z0], [x0, y0, z0], [x0, y0, z1]], [1, 0, 0]], [[[x1, Y1, z0], [x1, Y1, z1], [x1, y0, z1], [x1, y0, z0]], [-1, 0, 0]]];
    for (const [P, n] of walls) {
      if (!S3.facing(cam, P[0], n) || !S3.poly(x, cam, P)) continue;
      const mt = [(P[0][0] + P[1][0]) / 2, Y1, (P[0][2] + P[1][2]) / 2], mb = [mt[0], y0, mt[2]], a = inFront(cam, mt, mb), b = inFront(cam, mb, mt);
      if (a && b) { const gr = x.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, '#07061a'); gr.addColorStop(.36, S3.mix('#0b0920', '#d4ddf8', .85 * g)); gr.addColorStop(.6, '#0b0920'); gr.addColorStop(1, S3.mix('#1a1230', '#5a3a2a', .5 * ((st.lit || [0, 0])[1]))); x.fillStyle = gr; } else x.fillStyle = '#0b0920';
      x.fill();
      x.strokeStyle = 'rgba(70,60,120,.25)'; x.lineWidth = 1; x.beginPath(); for (let k = 1; k < 6; k++) { const yy = lerp(Y1, y0, k / 6) + .05 * Math.sin(k * 7); S3.line(x, cam, [P[0][0], yy, P[0][2]], [P[1][0], yy, P[1][2]]); } x.stroke();
    }
  }
  function graveIn(x, cam, st) {
    if (cam.pos[1] <= Y1) return;
    x.save();
    if (!holePath(x, cam, Y1 + .003)) { x.restore(); return; }
    x.fillStyle = '#030310'; x.fill(); x.clip();
    shaftWalls(x, cam, st);
    const hb = holeBox(cam), ha = hb ? (hb[2] - 80) * (hb[3] - 80) : 0;
    if (st.roomBelow !== false && hb && ha > 900) {
      x.save(); if (holePath(x, cam, B2.y1)) { x.clip(); BOX = hb; band2Lit(x, cam, st); const v = 1 - clamp((ha - 900) / 4000); if (v > 0) { x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = `rgba(3,3,16,${v})`; x.fillRect(hb[0], hb[1], hb[2], hb[3]); } BOX = null; } x.restore();
    }
    const g = st.grave ?? 0, gq = cam.proj([(GRAVE.x0 + GRAVE.x1) / 2, Y1 - 1.0, GRAVE.z1 - .05]);
    if (g > .01 && gq) RV.glow(x, gq[0], gq[1], Math.min(.55 * gq[3], cam.W), '#dfe8ff', .45 * g);
    x.restore();
    const yl = Y1 + .004, near = cam.pos[2] < GRAVE.z0 ? GRAVE.z0 : GRAVE.z1, far = near === GRAVE.z0 ? GRAVE.z1 : GRAVE.z0, lw = Math.max(1.5, cam.f / 700);
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath(); S3.line(x, cam, [GRAVE.x0, yl, near], [GRAVE.x0, yl, far]); S3.line(x, cam, [GRAVE.x0, yl, far], [GRAVE.x1, yl, far]); S3.line(x, cam, [GRAVE.x1, yl, far], [GRAVE.x1, yl, near]);
    x.strokeStyle = S3.mix('#4a4f80', '#eef2ff', .6 * g); x.lineWidth = lw; x.stroke();
    x.beginPath(); S3.line(x, cam, [GRAVE.x0, yl, near], [GRAVE.x1, yl, near]); x.strokeStyle = '#05040f'; x.lineWidth = lw * 1.6; x.stroke();
  }
  function graveSection() {}
  RV.rowCup = (x, cam, i, fill, lit = 0, o = {}) => {
    const [X, Z] = ROW[i], p = [X, Y1, Z], e = Math.atan2(cam.pos[1] - (Y1 + .15), Math.hypot(cam.pos[0] - X, cam.pos[2] - Z));
    S3.onPlane(x, cam, p, [Math.cos(cam.yaw) * CM1, 0, -Math.sin(cam.yaw) * CM1], [0, -CM1, 0], xx => Q.cup(xx, { s: 1, elev: Math.max(.08, e), fill, liquid: S3.mix('#4a4f60', '#e4e9f2', lit), k: .5, beads: [], ...o }));
  };
  RV.rimOf = i => { const [X, Z] = ROW[i]; return [X, Y1 + 6.9 * CM1, Z]; };
  RV.TAG = { w: .17, h: .1, cord: .045 };
  RV.tag = (x, cam, th) => {
    const [X, Z] = ROW[0], top = [X + .1, Y1 + 6.4 * CM1, Z - .15], hang = [top[0], top[1] - RV.TAG.cord, top[2]], { w, h } = RV.TAG;
    const a = cam.proj(top), b = cam.proj(hang); if (a && b) { x.strokeStyle = '#8f2b20'; x.lineWidth = Math.max(1, .006 * a[3]); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
    const u = [Math.cos(th) * w, 0, Math.sin(th) * w], n = [Math.sin(th), 0, -Math.cos(th)], dn = (cam.pos[0] - hang[0]) * n[0] + (cam.pos[2] - hang[2]) * n[2], front = dn > 0;
    if (cam.depth(hang) < .3 || cam.depth(top) < .3 || Math.abs(dn) < .012 * Math.hypot(cam.pos[0] - hang[0], cam.pos[2] - hang[2])) return { front, at: null };
    const uu = front ? u : u.map(v => -v), o = [hang[0] - uu[0] / 2, hang[1], hang[2] - uu[2] / 2];
    S3.onPlane(x, cam, o, uu, [0, -h, 0], xx => {
      xx.fillStyle = front ? '#ece2c8' : '#e4d8bc'; xx.beginPath(); xx.moveTo(.12, 0); xx.lineTo(.88, 0); xx.lineTo(1, .2); xx.lineTo(1, 1); xx.lineTo(0, 1); xx.lineTo(0, .2); xx.closePath(); xx.fill();
      xx.strokeStyle = 'rgba(60,40,30,.45)'; xx.lineWidth = .014; xx.strokeRect(.05, .14, .9, .8);
      xx.fillStyle = '#8f2b20'; xx.beginPath(); xx.ellipse(.5, .1, .03, .05, 0, 0, TAU); xx.fill();
      xx.save(); xx.translate(.5, .58); xx.scale(h / w, 1); xx.font = '900 1px NSC'; xx.textAlign = 'center'; xx.textBaseline = 'middle';
      const word = front ? 'ELIXIR' : 'POISON', mw = xx.measureText(word).width, s = Math.min(.5, .84 * (w / h) / mw);
      xx.scale(s, s); xx.fillStyle = front ? '#1a1514' : '#b5261c'; xx.fillText(word, 0, 0); xx.restore();
    });
    return { front, at: cam.proj([hang[0], hang[1] - h / 2, hang[2]]) };
  };

  const HIM = [-.57, 0, 1.12], CUPR = [-.08, .55, 1.12], CUP_M = .0074, SHX = -1.25;
  Object.assign(RV, { HIM, CUPR, CUP_M, SHX });
  RV.cupInRoom = () => RV.fromRoom(CUPR);
  const SHADOW = '#140f22', INK = '#07061a';
  const BX = (x0, x1, y0, y1, z0, z1) => [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]];
  const CY = (cx, cz, r, y0, y1) => BX(cx - r * .92, cx + r * .92, y0, y1, cz - r * .4, cz + r * .4);
  const onWall = (p, L) => { const s = L[2] / (L[2] - p[2]); return [L[0] + (p[0] - L[0]) * s, L[1] + (p[1] - L[1]) * s]; };
  function hull2(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const clockT = t => t + 3;
  function parts(t) {
    const CK = R().CK, WA = A14().WATER(), top = 1.62 - .012 * clockT(t);
    const L = [BX(-.15, .95, .5, .55, .7, 1.55), BX(.24, .56, .55, .73, .89, 1.21), CY(CK[0], CK[1], .15, .73, 1.14),
      BX(.33, .345, 1.14, 1.31, 1.043, 1.057), BX(.455, .47, 1.14, 1.31, 1.043, 1.057), BX(.33, .47, 1.31, 1.335, 1.043, 1.057),
      BX(.394, .406, 1.1, top, 1.044, 1.056), CY(WA.c[0], WA.c[1], .11, .55, .62)];
    for (const [X, Z] of [[-.1, .75], [.9, .75], [-.1, 1.5], [.9, 1.5]]) L.push(BX(X - .03, X + .03, 0, .5, Z - .03, Z + .03));
    return L;
  }
  const HPOSE = Q.kneel({ lean: .02, head: .02, arms: [[.06, .16], [.09, .2]] }), SIL = Q.silhouette('emperor', SHADOW, SHADOW);
  RV.HPOSE = HPOSE;
  RV.shM = st => .0178 * (st.fear ?? 1.25);
  RV.shPt = (u, v, st) => { const m = RV.shM(st); return [SHX + u * m, .1 + v * m, .01]; };
  let SHB = null, BOX = null;
  function blurred(x, W, H, px, alpha, fn) {
    const w = Math.ceil(W / 2), h = Math.ceil(H / 2);
    if (!SHB || SHB[0].width !== w || SHB[0].height !== h) SHB = F.canvas(w, h);
    const [cv, b] = SHB, B = BOX;
    if (b.reset) b.reset(); else { b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.filter = 'none'; }
    if (B) b.clearRect(Math.floor(B[0] / 2) - 1, Math.floor(B[1] / 2) - 1, Math.ceil(B[2] / 2) + 3, Math.ceil(B[3] / 2) + 3); else b.clearRect(0, 0, w, h);
    b.setTransform(.5, 0, 0, .5, 0, 0);
    fn(b);
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.imageSmoothingEnabled = true; x.filter = `blur(${(Math.round(Math.max(.25, px * .7) * 4) / 4).toFixed(2)}px)`; x.globalAlpha = alpha;
    if (B) x.drawImage(cv, B[0] / 2, B[1] / 2, B[2] / 2, B[3] / 2, B[0], B[1], B[2], B[3]); else x.drawImage(cv, 0, 0, w, h, 0, 0, 2 * w, 2 * h);
    x.restore();
  }
  function boxOf(cam, pts, m = 40) {
    const P = pts.map(p => cam.proj(p)); if (P.some(q => !q)) return null;
    const x0 = Math.max(0, Math.floor(Math.min(...P.map(q => q[0])) - m)), y0 = Math.max(0, Math.floor(Math.min(...P.map(q => q[1])) - m));
    const x1 = Math.min(cam.W, Math.ceil(Math.max(...P.map(q => q[0])) + m)), y1 = Math.min(cam.H, Math.ceil(Math.max(...P.map(q => q[1])) + m));
    return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : [0, 0, 1, 1];
  }
  const holeBox = cam => boxOf(cam, [[GRAVE.x0, B2.y1, GRAVE.z0], [GRAVE.x1, B2.y1, GRAVE.z0], [GRAVE.x1, B2.y1, GRAVE.z1], [GRAVE.x0, B2.y1, GRAVE.z1]]);
  const mouthBox = cam => boxOf(cam, OPEN[1].map(([X, Y]) => [X, Y, 0]));
  const wallClip = (b, cam) => { const s = onFrame(S3.clip(cam, [[-3.2, 0, .002], [3.8, 0, .002], [3.8, 3.2, .002], [-3.2, 3.2, .002]]), cam); b.beginPath(); if (s.length > 2) { s.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.closePath(); } b.clip(); };
  function shadows(x, cam, st) {
    const t = st.t, fl = R().flick(t), L = R().LAMP, Lf = [L[0], L[1] + .03 * (fl - 1), L[2]], W = cam.W, H = cam.H;
    blurred(x, W, H, Math.max(1, cam.f / 900), 1, b => {
      wallClip(b, cam);
      b.fillStyle = SHADOW; b.beginPath();
      for (const part of parts(t)) {
        const hl = hull2(part.map(p => onWall(p, Lf))).map(q => cam.proj([q[0], q[1], .002])); if (hl.some(v => !v)) continue;
        hl.forEach((q, i) => i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1])); b.closePath();
      }
      b.fill();
    });
    const m = RV.shM(st) * (1 + .12 * (fl - 1)), er = st.er || 0, rg = st.rg || 0, k15 = Math.floor(t * 15);
    const pose = { ...HPOSE, lean: HPOSE.lean + (st.reach || 0) + (st.lean || 0) * .5, head: HPOSE.head + .6 * (st.reach || 0) };
    blurred(x, W, H, Math.max(1, cam.f / 800), 1, b => {
      wallClip(b, cam);
      const one = (dx, dy, s, a) => { b.globalAlpha = a; S3.onPlane(b, cam, [SHX + dx, .1 + dy, .002], [m * s, 0, 0], [0, -m * s, 0], xx => Q.draw(xx, F.PAL.lightbox, pose, SIL, { kneel: true, crown: true, beard: true, profile: true, tilt: 0, shadow: 0 })); };
      if (rg > .01) for (let i = 1; i <= 3; i++) one((hash(k15, i) - .5) * .05 * rg, .02 * i * rg, 1 + .035 * i * rg, .22 * rg);
      if (er > .01) for (let i = 1; i <= 2; i++) one((hash(k15, 10 + i) - .5) * .3 * er, (hash(k15, 20 + i) - .5) * .08 * er, 1 + (hash(k15, 30 + i) - .5) * .1 * er, .5 * er);
      one(er * (hash(k15, 3) - .5) * .12, 0, 1, 1);
    });
    const ey = st.eyes || 0;
    if (ey > .01) {
      const EYES = [[4, 50, 1], [-7, 36, .8], [9, 26, .85], [-3, 16, .7], [13, 42, .75], [-10, 48, .6]];
      EYES.forEach(([u, v, s], i) => {
        const k = clamp(ey * 1.6 - i * .12); if (k <= 0) return;
        const p = RV.shPt(u, v, st), q = cam.proj([p[0], p[1], .004]); if (!q) return;
        const r = .045 * s * m / .0178 * q[3], o = .08 * Math.sin(st.t * 1.3 + i);
        for (const dx of [-1, 1]) {
          x.save(); x.translate(q[0] + dx * r * 1.25, q[1]); x.fillStyle = `rgba(232,236,250,${.85 * k})`; x.beginPath(); x.ellipse(0, 0, r, r * .32 * k, 0, 0, TAU); x.fill();
          x.fillStyle = `rgba(10,8,20,${k})`; x.beginPath(); x.arc(r * (o - .35), 0, r * .26 * k, 0, TAU); x.fill(); x.restore();
        }
      });
    }
  }
  const KING = Q.silhouette('emperor', INK, '#4a4038'), KING_RIM = Q.silhouette('emperor', '#ffb466', '#ffb466'), KING_SILV = Q.silhouette('emperor', '#e8f0ff', '#e8f0ff');
  RV.himPose = st => ({ ...HPOSE, lean: HPOSE.lean + (st.lean || 0) + .006 * Math.sin(st.t * 1.6) });
  RV.himShape = (x, cam, st) => {
    const fa = S3.figureAt(cam, HIM, 0); if (!fa || fa.depth < .5) return;
    const hd = Math.hypot(cam.pos[0] - HIM[0], cam.pos[2] - HIM[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - .7, hd)), 0, .6);
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, F.PAL.lightbox, { ...RV.himPose(st), yaw: fa.yaw }, KING, { kneel: true, crown: true, beard: true, profile: true, tilt, shadow: 0 }); x.restore();
  };
  function him(x, cam, st) {
    const fa = S3.figureAt(cam, HIM, 0); if (!fa || fa.depth < .5) return null;
    const hd = Math.hypot(cam.pos[0] - HIM[0], cam.pos[2] - HIM[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - .7, hd)), 0, .6);
    const pose = { ...RV.himPose(st), yaw: fa.yaw }, o = { kneel: true, crown: true, beard: true, profile: true, tilt, shadow: 0 };
    const rim = Math.max(1.6, fa.s * .35), lit = (st.light ?? 1) * (.75 + .25 * (st.rimUp || 0));
    x.save(); x.globalAlpha = clamp(lit); x.translate(fa.sx + rim, fa.sy - rim * .4); x.scale(fa.s, fa.s); Q.draw(x, F.PAL.lightbox, pose, KING_RIM, o); x.restore();
    const sv = st.himSilver || 0; if (sv > 0) { x.save(); x.globalAlpha = clamp(sv); x.translate(fa.sx + rim * .6, fa.sy - rim * .6); x.scale(fa.s, fa.s); Q.draw(x, F.PAL.lightbox, pose, KING_SILV, o); x.restore(); }
    x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, F.PAL.lightbox, pose, KING, o); x.restore();
    return fa;
  }
  let HIMC = null;
  const LEGS = [[-.1, .75], [.9, .75], [-.1, 1.5], [.9, 1.5]];
  const LIGHTF = p => { const L = R().LAMP, d = [L[0] - p[0], L[1] - p[1], L[2] - p[2]], l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; };
  function tableLegs(x, cam, far) {
    const c = R().colours, o = { col: c.WOOD_D, light: LIGHTF([.4, .3, 1.1]), lo: .22, ink: c.NIGHT }, dh = cam.depth([HIM[0], .45, HIM[2]]);
    LEGS.map(([X, Z]) => ({ X, Z, d: cam.depth([X, .25, Z]) })).filter(g => (g.d > dh) === far).sort((a, b) => b.d - a.d)
      .forEach(({ X, Z }) => S3.box(x, cam, { x0: X - .03, x1: X + .03, y0: 0, y1: .5, z0: Z - .03, z1: Z + .03 }, o));
  }
  function tableTop(x, cam) {
    const c = R().colours, o = { col: c.WOOD_D, light: LIGHTF([.4, .3, 1.1]), lo: .22, ink: c.NIGHT };
    S3.box(x, cam, { x0: -.15, x1: .95, y0: .5, y1: .55, z0: .7, z1: 1.55 }, { ...o, col: c.WOOD, light: LIGHTF([.4, .55, 1.1]) });
    S3.box(x, cam, { x0: .24, x1: .56, y0: .55, y1: .73, z0: .89, z1: 1.21 }, { ...o, col: c.WOOD_D, light: LIGHTF([.4, .65, 1.05]) });
  }
  function roomCup(x, cam, st) {
    const on = st.cupOn ?? 1; if (on <= 0) return;
    const p = st.cupAt || CUPR, e = Math.atan2(cam.pos[1] - (p[1] + .05), Math.hypot(cam.pos[0] - p[0], cam.pos[2] - p[2]));
    x.save(); x.globalAlpha = clamp(on);
    S3.onPlane(x, cam, p, [Math.cos(cam.yaw) * CUP_M, 0, -Math.sin(cam.yaw) * CUP_M], [0, -CUP_M, 0], xx => Q.cup(xx, { s: 1, elev: Math.max(.12, e), fill: st.cupFill ?? .55, liquid: '#b8bec8', k: .15, beads: [] }));
    x.restore();
  }
  function shell(x, cam) {
    const L = R().LAMP, c = cam.proj(L), dim = (pts, col) => {
      if (!S3.poly(x, cam, pts)) return;
      if (c) { const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], 2.6 * c[3]); g.addColorStop(0, S3.mix(col, '#5e3c3a', .5)); g.addColorStop(1, col); x.fillStyle = g; } else x.fillStyle = col;
      x.fill();
    };
    const hx0 = RO[0] - GRAVE.x1, hx1 = RO[0] - GRAVE.x0, hz0 = RO[2] - GRAVE.z1, hz1 = RO[2] - GRAVE.z0;
    { const a = S3.clip(cam, [[-3.2, 3.2, 0], [3.8, 3.2, 0], [3.8, 3.2, 3.9], [-3.2, 3.2, 3.9]]), b = S3.clip(cam, [[hx0, 3.2, hz0], [hx1, 3.2, hz0], [hx1, 3.2, hz1], [hx0, 3.2, hz1]]);
      if (a.length > 2 && Math.abs(cam.pos[1] - 3.2) > .04) { x.beginPath(); for (const s of [a, b]) if (s.length > 2) { s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
        if (c) { const g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], 2.6 * c[3]); g.addColorStop(0, S3.mix('#0c0a1e', '#5e3c3a', .5)); g.addColorStop(1, '#0c0a1e'); x.fillStyle = g; } else x.fillStyle = '#0c0a1e';
        x.fill('evenodd'); } }
    dim([[-3.2, 0, 0], [-3.2, 3.2, 0], [-3.2, 3.2, 3.9], [-3.2, 0, 3.9]], '#120e28');
    dim([[3.8, 0, 0], [3.8, 0, 3.9], [3.8, 3.2, 3.9], [3.8, 3.2, 0]], '#120e28');
  }
  function band2Lit(x, cam, st) {
    band2(x, cam, st);
    const d = 1 - (st.lit || [0, 0])[1];
    if (d > .01) { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = `rgba(3,3,12,${.82 * d})`; const B = BOX || [0, 0, cam.W, cam.H]; x.fillRect(B[0], B[1], B[2], B[3]); x.restore(); }
  }
  function band2(x, cam, st) {
    const c = roomCam(cam), t = st.t;
    shell(x, c); R().wall(x, c, t); R().floor(x, c, t); shadows(x, c, st);
    if (st.b2behind) st.b2behind(x, c);
    x.lineCap = 'butt'; x.lineJoin = 'miter';
    const himOne = () => {
      const a = st.himA ?? 1; if (a <= .005) return; if (a >= 1) { him(x, c, st); return; }
      const cw = x.canvas.width, chh = x.canvas.height; if (!HIMC || HIMC[0].width !== cw || HIMC[0].height !== chh) HIMC = F.canvas(cw, chh);
      const [hc, hx] = HIMC; hx.setTransform(1, 0, 0, 1, 0, 0); hx.globalAlpha = 1; hx.globalCompositeOperation = 'source-over'; hx.clearRect(0, 0, cw, chh); hx.setTransform(x.getTransform());
      him(hx, c, st);
      x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha *= a; x.drawImage(hc, 0, 0); x.restore();
    };
    const himDraw = () => { if (st.b2him) st.b2him(x, c, himOne); else himOne(); };
    const tableAll = () => { tableTop(x, c); R().clock(x, c, clockT(t)); roomCup(x, c, st); };
    if (c.depth([-.15, .52, 1.12]) > c.depth([HIM[0] + .1, .6, HIM[2]])) { tableLegs(x, c, true); tableLegs(x, c, false); tableAll(); himDraw(); }
    else { tableLegs(x, c, true); himDraw(); tableLegs(x, c, false); tableAll(); }
    R().lamp(x, c);
    if (st.b2over) st.b2over(x, c);
  }
  RV.roomLights = (ctx, cam, st) => {
    const c = roomCam(cam), t = st.t, L = R().LAMP, q = c.proj([L[0], .972, L[2]]), sh = SH(), lk = st.light ?? 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    if (q && lk > .02) {
      const fl = R().flick(t), h = .075 * q[3] * fl * (.4 + .6 * lk), wd = .021 * q[3] * (.7 + .3 * lk);
      RV.glow(ctx, q[0], q[1] - h * .4, .8 * q[3] * (.5 + .5 * lk), '#ffae4a', .5 * lk);
      const tear = (s, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q[0] - wd * s, q[1]); ctx.quadraticCurveTo(q[0] - wd * s * 1.15, q[1] - h * s * .55, q[0] + .1 * wd * Math.sin(t * 9), q[1] - h * s); ctx.quadraticCurveTo(q[0] + wd * s * 1.15, q[1] - h * s * .55, q[0] + wd * s, q[1]); ctx.closePath(); ctx.fill(); };
      ctx.globalAlpha = clamp(lk * 1.5); tear(1, '#ff9a3a'); tear(.62, '#ffd27a'); tear(.3, '#fff6e0'); ctx.globalAlpha = 1;
      RV.glow(ctx, q[0], q[1] - h * .5, .12 * q[3], '#fff0cc', .8 * lk);
    }
    const D = A14().drips(), tc = clockT(t), i1 = Math.floor((tc - D.t0) / D.every);
    for (let i = i1 - 1; i <= i1; i++) {
      const a = tc - (D.t0 + i * D.every); if (a < 0 || a >= D.hang + D.fall) continue;
      const u = Math.max(0, a - D.hang), k = Math.min(1, a / D.hang), p = [D.tip[0], D.tip[1] - .004 - .004 * k - 4.9 * u * u, D.tip[2] + .003], qq = c.proj(p); if (!qq) continue;
      const r = Math.max(1.4, (.0014 + .0018 * k) * qq[3]);
      ctx.fillStyle = `rgba(255,232,190,${.8 * lk})`; ctx.beginPath(); ctx.ellipse(qq[0], qq[1], r, r * (1 + Math.min(1.4, 9 * u)), 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  const Mo = F.motion, F3 = B3.y0, Z9 = B3.z1, P3 = (x, h, z) => [x, F3 + h, z];
  const big3 = (x, cam, pts) => { const s = onFrame(S3.clip(cam, pts), cam); if (s.length < 3) return false; x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); return true; };
  const INK3 = '#0b0916', INK3B = '#140f20', RIM3 = '#ffd890', GILT3 = '#b8893c';
  const LIGHT3 = (() => { const v = [.15, .5, 1], l = Math.hypot(...v); return v.map(c => c / l); })();
  const sh3 = (col, n, lo = .35) => S3.shade(col, n, LIGHT3, { lo, ink: '#05040c', dark: .7 });
  const THR3 = [.6, 6.6], TU3 = 1.45 / 59;
  const DAIS3 = { x0: -1.3, x1: 1.55, z0: 6.05, z1: 7.3, h: .32 }, STEP3 = { x0: -.95, x1: 1.3, z0: 5.78, z1: 6.05, h: .16 };
  const SEAT3 = .32 + .47;
  const LINE3 = [{ k: 1, s: .84, x: THR3[0] - 1.35, z: THR3[1] + .25, h: .32 }].concat([[.1, 1.75], [-.45, 2.15], [-.95, 2.45], [-1.4, 2.68], [-1.8, 2.86], [-2.15, 3.0], [-2.45, 3.1], [-2.7, 3.18]].map(([x, h], i) => ({ k: i + 2, s: .55 * Math.pow(.84, i), x, z: Z9 - .015, h, flat: true })));
  const GAL3 = { a: [2.05, 6.75], b: [8.25, 7.5], hw: .55, bays: 8, eave: 1.7, ridge: 2.12, over: .2 };
  const HALL3 = { x0: 8.25, x1: 9.8, z0: 6.8, z1: 8.25, h: 1.75, roof: .75, door: 7.5 };
  const CAR3 = { x: -5.9, z: 3.3 };
  const MEN3 = { zhao: [-2.81, 3.08], li: [-4.27, 3.64] };
  const LAN3 = [[-4.95, 4.25, 1.15], [-9.9, 2.4, 1.9]];
  const GUARD3 = [[-11.2, 2.6], [-8.1, 4.75]];
  const SILK3 = { c: [-4.12, 1.81], w: .8, d: .56, to: [-1.4, 9.0] };
  { const d = [SILK3.to[0] - SILK3.c[0], SILK3.to[1] - SILK3.c[1]], l = Math.hypot(...d); SILK3.v = [-d[0] / l, -d[1] / l]; SILK3.u = [d[1] / l, -d[0] / l]; }
  const LETTER3 = { o: P3(THR3[0] - .25, SEAT3 + .42, THR3[1] + .27), U: [.5, 0, 0], V: [0, -.38, -.1] };
  LETTER3.c = [LETTER3.o[0] + .25, LETTER3.o[1] - .18, LETTER3.o[2] - .05];
  Object.assign(RV, { F3, P3, THR3, TU3, DAIS3, SEAT3, LINE3, GAL3, HALL3, CAR3, MEN3, LAN3, GUARD3, SILK3, LETTER3 });
  const E3 = { flare: 0, guard: 0, glow: 0, win: 0, shut: 0, thread: 0, threadA: 0, line: 0, climb: 0, first: 0, sin: 0, seal: 0, men: 0, glance: 0, belt: 0, ink: 0, print: 0, ring: 0, red: null, letter: 0, gold: 0, zhao: null };
  RV.E3 = E3;

  function screen3(x, cam, st, e, lit) {
    const k = lit * (1 + .25 * e.flare);
    if (big3(x, cam, [[B3.x0, F3, Z9], [B3.x1, F3, Z9], [B3.x1, B3.y1, Z9], [B3.x0, B3.y1, Z9]])) {
      const a = inFront(cam, [cam.pos[0], F3, Z9], [cam.pos[0], F3, cam.pos[2] + 2]), b = inFront(cam, [cam.pos[0], B3.y1, Z9], [cam.pos[0], B3.y1, cam.pos[2] + 2]);
      if (a && b) {
        const g = x.createLinearGradient(0, a[1], 0, b[1]);
        g.addColorStop(0, S3.mix('#1a1430', '#ffe2a0', Math.min(1, .92 * k))); g.addColorStop(.3, S3.mix('#140f2a', '#f0b458', Math.min(1, .85 * k)));
        g.addColorStop(.62, S3.mix('#0f0c26', '#9a5a2c', .8 * Math.min(1, k))); g.addColorStop(1, S3.mix('#09081e', '#3a2028', .6 * Math.min(1, k)));
        x.fillStyle = g;
      } else x.fillStyle = '#0b0a22';
      x.fill();
    }
    const q = cam.proj(P3(THR3[0] - 2.6, 2.1, Z9 - .02)); if (q && lit > .02) RV.glow(x, q[0], q[1], 3.2 * q[3], '#fff0c8', .38 * k * (1 + .9 * e.climb * (1 - e.climb)));
  }
  function throneShape(x) {
    x.beginPath();
    x.moveTo(-27, 0); x.lineTo(27, 0); x.lineTo(27, -7); x.lineTo(23, -7); x.lineTo(23, -19);
    x.lineTo(23, -30); x.quadraticCurveTo(26, -34, 22, -36); x.lineTo(16, -32);
    x.lineTo(16, -50); x.quadraticCurveTo(22, -52, 22, -59); x.quadraticCurveTo(14, -57, 0, -55);
    x.quadraticCurveTo(-14, -57, -22, -59); x.quadraticCurveTo(-22, -52, -16, -50);
    x.lineTo(-16, -32); x.lineTo(-22, -36); x.quadraticCurveTo(-26, -34, -23, -30);
    x.lineTo(-23, -19); x.lineTo(-23, -7); x.lineTo(-27, -7); x.closePath();
  }
  function lineThrone(x, cam, T, lit, flatOnScreen) {
    const s = TU3 * T.s, o = P3(T.x, T.h, T.z);
    const u = flatOnScreen ? [s, 0, 0] : [Math.cos(cam.yaw) * s, 0, -Math.sin(cam.yaw) * s];
    S3.onPlane(x, cam, o, u, [0, -s, 0], xx => {
      throneShape(xx); xx.fillStyle = flatOnScreen ? S3.mix('#2a1a1c', '#120c18', .5) : INK3; xx.fill();
      const a = .35 + .65 * lit; xx.strokeStyle = `rgba(255,${Math.round(200 + 40 * lit)},${Math.round(120 + 60 * lit)},${a})`; xx.lineWidth = 1.6 + 1.8 * lit; xx.lineJoin = 'round'; xx.stroke();
    });
  }
  const HALLS = {
    far: [[-9.1, 1.5, .18, .42, .3], [-7.4, 1.9, .22, .5, .36], [-5.4, 1.4, .2, .42, .3], [-3.4, 1.7, .2, .46, .32], [4.4, 1.6, .2, .44, .32], [6.3, 2.0, .24, .52, .36], [8.3, 1.5, .18, .42, .3]],
    near: [[-8.2, 1.2, .14, .34, .26], [-6.1, 1.6, .2, .4, .3], [-3.9, 1.1, .14, .3, .24], [5.2, 1.3, .16, .36, .27], [7.4, 1.4, .16, .38, .28]],
  };
  const hallPts = ([cx, wd, tH, hH, rH]) => { const hw = wd / 2, ew = hw * 1.22, tw = hw * 1.12, y1 = tH + hH; return [[cx - tw, 0], [cx - tw, tH], [cx - hw, tH], [cx - hw, y1], [cx - ew, y1 - .01], [cx - ew * 1.02, y1 + .05], [cx - ew * .9, y1 + .045], [cx - hw * .42, y1 + rH], [cx + hw * .42, y1 + rH], [cx + ew * .9, y1 + .045], [cx + ew * 1.02, y1 + .05], [cx + ew, y1 - .01], [cx + hw, y1], [cx + hw, tH], [cx + tw, tH], [cx + tw, 0]]; };
  function palaceFlat(x, cam, which, z, col, lit) {
    const list = HALLS[which];
    x.fillStyle = col; x.beginPath(); let any = false;
    for (const hl of list) { const s = S3.clip(cam, hallPts(hl).map(([X, h]) => P3(X, h, z))); if (s.length < 3) continue; any = true; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
    for (const [x0, x1] of [[-9.8, -2.9], [3.6, 9.6]]) { const s = S3.clip(cam, [P3(x0, 0, z), P3(x1, 0, z), P3(x1, which === 'far' ? .2 : .14, z), P3(x0, which === 'far' ? .2 : .14, z)]); if (s.length < 3) continue; any = true; s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); }
    if (any) x.fill();
    if (lit < .02) return;
    x.fillStyle = S3.mix('#3a2418', '#ffd27a', Math.min(1, .95 * lit));
    for (const [cx, wd, tH, hH] of list) { const n = Math.max(2, Math.round(wd / .32)); for (let i = 0; i < n; i++) { const X = cx - wd / 2 + wd * (i + .5) / n, w2 = Math.min(.05, wd / n * .22); if (S3.poly(x, cam, [P3(X - w2, tH + hH * .25, z - .005), P3(X + w2, tH + hH * .25, z - .005), P3(X + w2, tH + hH * .72, z - .005), P3(X - w2, tH + hH * .72, z - .005)])) x.fill(); } }
  }
  function hills3(x, cam) {
    for (const [z, hgt, col, seed] of [[Z9 - .02, .9, '#1c1222', 21]]) {
      for (const [x0, x1] of [[-60, -9.6], [9.6, 60]]) { const P = []; for (let i = 0; i <= 50; i++) { const X = x0 + (x1 - x0) * i / 50; P.push(P3(X, hgt * (.3 + .7 * (F.noise1(X * .25, seed) + 1) / 2), z)); } P.push(P3(x1, 0, z), P3(x0, 0, z)); if (big3(x, cam, P)) { x.fillStyle = col; x.fill(); } }
    }
  }
  const SIN3 = [{ x: 3.7, who: 'worker', kind: 'dagger' }, { x: 5.4, who: 'minister', kind: 'lute' }, { x: 7.1, who: 'worker', kind: 'cone' }];
  const SINPOSE = {
    dagger: { ...Mo.stand(0), lean: .12, head: .05, arms: [[2.3, 2.75], [.5, 1.1]], feet: [{ at: [-12, 0], ang: 0 }, { at: [10, 0], ang: 0 }] },
    lute: { ...Mo.stand(0), lean: .04, head: .15, arms: [[.9, 2.0], [.7, 1.6]] },
    cone: { ...Mo.stand(0), lean: -.05, head: -.1, arms: [[2.9, 3.0], [2.8, 2.9]], feet: [{ at: [-9, 0], ang: 0 }, { at: [9, 0], ang: 0 }] },
  };
  const SINLOOK = { worker: Q.silhouette('worker', '#000000', '#000000'), minister: Q.silhouette('minister', '#000000', '#000000') };
  function sinProp(kind) {
    return (xx, pj) => {
      xx.fillStyle = '#000000'; xx.strokeStyle = '#000000'; xx.lineCap = 'round';
      if (kind === 'dagger') { const a = pj.arms[0].wr; xx.lineWidth = 2.4; xx.beginPath(); xx.moveTo(a[0], a[1]); xx.lineTo(a[0] + 6, a[1] - 22); xx.stroke(); xx.lineWidth = 4; xx.beginPath(); xx.moveTo(a[0] - 4, a[1] - 2); xx.lineTo(a[0] + 4, a[1] + 1); xx.stroke(); }
      if (kind === 'lute') { const a = pj.arms[1].wr; xx.beginPath(); xx.ellipse(a[0] + 2, a[1] - 2, 9, 7, -.4, 0, TAU); xx.fill(); xx.lineWidth = 2.6; xx.beginPath(); xx.moveTo(a[0] + 6, a[1] - 6); xx.lineTo(a[0] + 22, a[1] - 26); xx.stroke(); }
      if (kind === 'cone') { const a = pj.arms[0].wr, b = pj.arms[1].wr, m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 4]; xx.beginPath(); xx.moveTo(m[0] - 13, m[1]); xx.lineTo(m[0] + 13, m[1]); xx.lineTo(m[0] + 2, m[1] - 30); xx.lineTo(m[0] - 2, m[1] - 30); xx.closePath(); xx.fill(); }
    };
  }
  function sinShadows(x, cam, e) {
    const k = e.sin; if (k <= .01) return;
    const back = 1 - k, s0 = .03 * (1 + .45 * back);
    blurred(x, cam.W, cam.H, Math.max(1, cam.f / 900) * (3.5 + 26 * back * back), .62 * k, b => {
      for (const S of SIN3) {
        const P = [S.x + .25 * back * (S.x - 2), .45 - .4 * back, Z9 - .03];
        S3.onPlane(b, cam, P3(...P), [s0, 0, 0], [0, -s0, 0], xx => Q.draw(xx, F.PAL.lightbox, { ...SINPOSE[S.kind], yaw: 0 }, SINLOOK[S.who], { tilt: 0, shadow: 0, robe: S.who === 'minister' ? 40 : null, prop: sinProp(S.kind) }));
      }
    });
  }
  function floor3(x, cam, lit) {
    if (cam.pos[1] <= F3) return;
    if (big3(x, cam, [P3(B3.x0, 0, 0), P3(B3.x1, 0, 0), P3(B3.x1, 0, Z9), P3(B3.x0, 0, Z9)])) {
      const a = inFront(cam, [cam.pos[0], F3, Z9], [cam.pos[0], F3, cam.pos[2] + 1]), b = inFront(cam, [cam.pos[0], F3, Math.max(0, cam.pos[2] + .6)], [cam.pos[0], F3, Z9]);
      if (a && b) { const g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, S3.mix('#0c0b24', '#e0a050', .55 * lit)); g.addColorStop(.25, S3.mix('#0c0b22', '#6a4026', .45 * lit)); g.addColorStop(1, S3.mix('#07061a', '#1e1420', .6 * lit)); x.fillStyle = g; } else x.fillStyle = '#0a0920';
      x.fill();
    }
    if (big3(x, cam, [P3(-16, .003, 2.6), P3(-3.4, .003, 2.6), P3(-3.4, .003, 4.0), P3(-16, .003, 4.0)])) { x.fillStyle = S3.mix('#120e22', '#3a2a2a', .5 * lit); x.fill(); }
    x.strokeStyle = 'rgba(4,3,12,.5)'; x.lineWidth = Math.max(1, cam.f / 1400); x.beginPath(); for (const z of [CAR3.z - .98, CAR3.z + .98]) S3.line(x, cam, P3(-16, .005, z), P3(-3.6, .005, z)); x.stroke();
  }
  function pools3(x, cam, st) {
    const fl = 1 + .05 * Math.sin(st.t * 9.3) + .03 * Math.sin(st.t * 23.1);
    LAN3.forEach(([X, Z], i) => {
      const R = (i ? 1.5 : 1.7) * fl, al = (i ? .3 : .42) * fl, c = cam.proj(P3(X, .006, Z)); if (!c) return;
      const d = Math.hypot(cam.pos[0] - X, cam.pos[1] - F3, cam.pos[2] - Z), rx = Math.min(R * c[3], 3 * cam.W), ry = rx * Math.max(.04, (cam.pos[1] - F3) / d);
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = al; x.drawImage(sprite('#ffb45a'), c[0] - rx, c[1] - ry, 2 * rx, 2 * ry); x.restore();
    });
  }
  function dais3(x, cam, e, lit) {
    const o = { col: INK3B, light: LIGHT3, lo: .35, ink: '#05040c', dark: .7 };
    for (const B of [DAIS3, STEP3]) S3.box(x, cam, { x0: B.x0, x1: B.x1, y0: F3, y1: F3 + B.h, z0: B.z0, z1: B.z1 }, o);
    x.strokeStyle = S3.mix('#5a4020', GILT3, lit); x.lineWidth = Math.max(1, cam.f / 900); x.beginPath();
    for (const B of [DAIS3, STEP3]) { S3.line(x, cam, P3(B.x0, B.h, B.z0), P3(B.x1, B.h, B.z0)); S3.line(x, cam, P3(B.x0, B.h, B.z0), P3(B.x0, B.h, B.z1)); S3.line(x, cam, P3(B.x1, B.h, B.z0), P3(B.x1, B.h, B.z1)); }
    x.stroke();
  }
  const THRONE_BACK = [[-.42, .47], [-.42, 1.18], [-.47, 1.32], [-.53, 1.46], [-.34, 1.41], [-.16, 1.375], [0, 1.365], [.16, 1.375], [.34, 1.41], [.53, 1.46], [.47, 1.32], [.42, 1.18], [.42, .47]];
  const THRONE_ARM = [[-.36, .47], [-.36, .7], [-.42, .78], [-.36, .85], [-.27, .8], [-.25, .74], [.3, .74], [.3, .47]];
  function throneSolid(x, cam, cx, h0, cz, s, tone, o = {}) {
    const W3 = (lx, ly, lz) => P3(cx + lx * s, h0 + ly * s, cz + lz * s);
    const quad = (pts, n, col) => { if (!S3.facing(cam, pts[0], n)) return; if (S3.poly(x, cam, pts)) { x.fillStyle = col || tone(n); x.fill(); x.strokeStyle = x.fillStyle; x.lineWidth = .8; x.stroke(); } };
    const box = (x0, x1, y0, y1, z0, z1) => {
      const P = (a, b, c) => W3(a, b, c);
      quad([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], [0, 1, 0]);
      quad([P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], [0, 0, -1]);
      quad([P(x1, y0, z1), P(x0, y0, z1), P(x0, y1, z1), P(x1, y1, z1)], [0, 0, 1]);
      quad([P(x0, y0, z1), P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1)], [-1, 0, 0]);
      quad([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], [1, 0, 0]);
    };
    const extrude = (poly, map, n0, n1) => {
      let A = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; A += a[0] * b[1] - b[0] * a[1]; }
      const sg = A > 0 ? 1 : -1;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, e2 = [sg * dy / l, -sg * dx / l];
        quad([map(a, 0), map(b, 0), map(b, 1), map(a, 1)], map.n(e2));
      }
      for (const [k, n] of [[0, n0], [1, n1]]) { const pts = poly.map(p => map(p, k)); if (S3.facing(cam, pts[0], n) && S3.poly(x, cam, pts)) { x.fillStyle = tone(n); x.fill(); } }
    };
    const back = Object.assign((p, k) => W3(p[0], p[1], k ? .42 : .3), { n: e2 => [e2[0], e2[1], 0] });
    const arm = side => Object.assign((p, k) => W3(side * (k ? .56 : .44), p[1], p[0]), { n: e2 => [0, e2[1], e2[0]] });
    box(-.62, .62, 0, .16, -.45, .45);
    const parts = [
      { d: cam.depth(W3(0, .9, .36)), fn: () => extrude(THRONE_BACK, back, [0, 0, -1], [0, 0, 1]) },
      { d: cam.depth(W3(0, .3, -.05)), fn: () => box(-.5, .5, .16, .47, -.4, .3) },
      { d: cam.depth(W3(-.5, .6, -.03)), fn: () => extrude(THRONE_ARM, arm(-1), [1, 0, 0], [-1, 0, 0]) },
      { d: cam.depth(W3(.5, .6, -.03)), fn: () => extrude(THRONE_ARM, arm(1), [-1, 0, 0], [1, 0, 0]) },
    ];
    parts.sort((a, b) => b.d - a.d).forEach(p => p.fn());
    if (o.panel && S3.facing(cam, W3(0, .9, .3), [0, 0, -1]) && S3.poly(x, cam, [W3(-.28, .62, .295), W3(.28, .62, .295), W3(.28, 1.16, .295), W3(-.28, 1.16, .295)])) { x.fillStyle = o.panel; x.fill(); }
    if (o.trim) {
      x.save(); x.strokeStyle = o.trim; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = Math.max(1, .012 * s * (cam.proj(W3(0, .5, 0)) || [0, 0, 0, 100])[3]); x.beginPath();
      if (S3.facing(cam, W3(0, 1, .3), [0, 0, -1])) for (let i = 1; i < THRONE_BACK.length - 1; i++) S3.line(x, cam, W3(THRONE_BACK[i][0], THRONE_BACK[i][1], .3), W3(THRONE_BACK[i + 1][0], THRONE_BACK[i + 1][1], .3));
      S3.line(x, cam, W3(-.5, .47, -.4), W3(.5, .47, -.4)); S3.line(x, cam, W3(-.62, .16, -.45), W3(.62, .16, -.45));
      for (const sd of [-1, 1]) S3.line(x, cam, W3(sd * .5, .74, -.25), W3(sd * .5, .74, .3));
      x.stroke(); x.restore();
    }
  }
  const LIGHTG = (() => { const v = [-.4, .75, -.55], l = Math.hypot(...v); return v.map(c => c / l); })();
  function throne3(x, cam, e, lit) {
    const dim = (.62 - .5 * e.first) * (1 - .3 * lit);
    const tone = n => S3.mix(S3.shade('#eebd58', n, LIGHTG, { lo: .3, ink: '#2a1804', dark: .9 }), '#120d1c', clamp(dim));
    throneSolid(x, cam, THR3[0], DAIS3.h, THR3[1], 1, tone, { panel: S3.mix('#a8781e', '#120d1c', clamp(dim)), trim: S3.mix('#fff0b8', '#2a2030', clamp(dim)) });
    if (e.letter > .01) letterOn(x, cam, RV.LETTER3.o, RV.LETTER3.U, RV.LETTER3.V, 1, 1, 0, e.letter);
  }
  function lineItems(items, cam, e) {
    for (const T of LINE3) {
      if (T.flat) continue;
      const d = cam.depth(P3(T.x, .9, T.z)); if (d < .25) continue;
      items.push({ d, fn: x => throneSolid(x, cam, T.x, T.h, T.z, T.s, n => sh3(INK3B, n, .3)) });
    }
  }
  const lineLit = (k, e) => { const u = (k - 2) / 7; return clamp(e.line * 1.8 - u * .8) * .8 + .9 * clamp(1 - Math.abs(e.climb * 1.15 - u) * 5); };
  function lineFlat(x, cam, e) { for (const T of LINE3) if (T.flat) lineThrone(x, cam, T, lineLit(T.k, e), true); }
  function thread3(x, cam, e) {
    if (e.threadA <= .01) return;
    const A = P3(THR3[0] + .1, SEAT3 + .2, THR3[1]), T = LINE3[0], B = P3(T.x, T.h + .55 * T.s, T.z - .05), u = .62 * e.thread;
    const M = [lerp(A[0], B[0], u), lerp(A[1], B[1], u) + .12 * Math.sin(PI * u), lerp(A[2], B[2], u)], a = cam.proj(A), m = cam.proj(M); if (!a || !m) return;
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.strokeStyle = `rgba(255,220,150,${e.threadA})`; x.lineWidth = Math.max(2.5, .022 * a[3]);
    x.beginPath(); x.moveTo(a[0], a[1]); for (let i = 1; i <= 12; i++) { const v = u * i / 12, q = cam.proj([lerp(A[0], B[0], v), lerp(A[1], B[1], v) + .12 * Math.sin(PI * v), lerp(A[2], B[2], v)]); if (q) x.lineTo(q[0], q[1]); } x.stroke(); x.restore();
    RV.glow(x, m[0], m[1], Math.max(8, .09 * m[3]), '#fff2cc', .9 * e.threadA);
  }

  const GD = (() => { const [ax, az] = GAL3.a, [bx, bz] = GAL3.b, L = Math.hypot(bx - ax, bz - az), d = [(bx - ax) / L, (bz - az) / L]; return { L, d, n: [-d[1], d[0]] }; })();
  const gP = (s, side, h) => P3(GAL3.a[0] + GD.d[0] * s + GD.n[0] * side, h, GAL3.a[1] + GD.d[1] * s + GD.n[1] * side);
  const glowAt = (u, t) => { const s = u * (GD.L + .6); return gP(s, 0, 1.0 + .02 * Math.sin(t * 6.3)); };
  function shutter(x, cam, b, sg, c, w) {
    const s0 = b * w, s1 = s0 + w, sc = s0 + .06 + (w - .12) * Math.max(.12, c), y0 = .28, y1 = 1.52, side = sg * GAL3.hw;
    const q = [gP(s0 + .06, side, y0), gP(sc, side, y0), gP(sc, side, y1), gP(s0 + .06, side, y1)];
    x.strokeStyle = INK3; x.lineCap = 'butt'; const k = cam.proj(gP((s0 + s1) / 2, side, .9)); if (!k) return;
    if (S3.poly(x, cam, q)) { x.fillStyle = `rgba(11,9,22,${clamp(1 - (c - .12) * 4)})`; x.fill(); }
    x.lineWidth = Math.max(1, .022 * k[3]); x.beginPath(); S3.line(x, cam, q[0], q[1]); S3.line(x, cam, q[1], q[2]); S3.line(x, cam, q[2], q[3]); S3.line(x, cam, q[3], q[0]); x.stroke();
    x.lineWidth = Math.max(.7, .012 * k[3]); x.beginPath();
    const nu = Math.max(1, Math.round((sc - s0 - .06) / .085)); for (let i = 1; i < nu; i++) { const s = s0 + .06 + (sc - s0 - .06) * i / nu; S3.line(x, cam, gP(s, side, y0), gP(s, side, y1)); }
    for (let j = 1; j < 9; j++) { const h = y0 + (y1 - y0) * j / 9; S3.line(x, cam, gP(s0 + .06, side, h), gP(sc, side, h)); }
    x.stroke();
  }
  function galleryItems(items, cam, e, t) {
    const n = GAL3.bays, w = GD.L / n, near = S3.facing(cam, gP(GD.L / 2, GAL3.hw, 1), [GD.n[0], 0, GD.n[1]]) ? 1 : -1;
    const g = e.glow < 1 ? glowAt(e.glow, t) : null, gs = e.glow * (GD.L + .6);
    for (let b = 0; b < n; b++) {
      const d = cam.depth(gP((b + .5) * w, 0, 1)); if (d < .25) continue;
      const cb = clamp(e.shut * (n + 2) - b);
      items.push({ d, fn: x => {
        const o = { col: INK3B, light: LIGHT3, lo: .3, ink: '#05040c', dark: .7 };
        S3.face(x, cam, [gP(b * w, -GAL3.hw - .05, .1), gP((b + 1) * w, -GAL3.hw - .05, .1), gP((b + 1) * w, GAL3.hw + .05, .1), gP(b * w, GAL3.hw + .05, .1)], INK3B, [0, 1, 0]);
        const posts = sg => { for (const s of b === n - 1 ? [b * w, (b + 1) * w] : [b * w]) { const p = gP(s, sg * GAL3.hw, 0); S3.box(x, cam, { x0: p[0] - .035, x1: p[0] + .035, y0: F3, y1: F3 + GAL3.eave, z0: p[2] - .035, z1: p[2] + .035 }, o); } };
        posts(-near); shutter(x, cam, b, -near, cb, w);
        if (g && gs >= b * w && gs < (b + 1) * w) { const q = cam.proj(g); if (q) { RV.glow(x, q[0], q[1], Math.max(10, .75 * q[3]), '#ffb860', .55); RV.glow(x, q[0], q[1], Math.max(3, .1 * q[3]), '#fff4dc', .95); } }
        shutter(x, cam, b, near, cb, w);
        posts(near);
        const sA = b * w - (b ? 0 : GAL3.over), sB = (b + 1) * w + (b === n - 1 ? GAL3.over : 0), eo = GAL3.hw + GAL3.over;
        for (const sg of [-near, near]) { const pts = [gP(sA, sg * eo, GAL3.eave - .08), gP(sB, sg * eo, GAL3.eave - .08), gP(sB, 0, GAL3.ridge), gP(sA, 0, GAL3.ridge)]; if (S3.poly(x, cam, pts)) { x.fillStyle = sh3('#2a1c22', [GD.n[0] * sg * .8, .6, GD.n[1] * sg * .8]); x.fill(); x.strokeStyle = x.fillStyle; x.lineWidth = 1; x.stroke(); } }
        x.strokeStyle = S3.mix('#3a2a24', RIM3, .35); x.lineWidth = Math.max(1, cam.f / 1100); x.beginPath(); S3.line(x, cam, gP(sA, 0, GAL3.ridge + .01), gP(sB, 0, GAL3.ridge + .01)); x.stroke();
        if (g && Math.abs(gs - (b + .5) * w) < 1.2) { const q = cam.proj(gP(gs, near * GAL3.hw, 1.62)); if (q) RV.glow(x, q[0], q[1], Math.max(8, .5 * q[3]), '#ffb860', .25 * (1 - Math.abs(gs - (b + .5) * w) / 1.2), .35); }
      } });
    }
    const hd = cam.depth(P3((HALL3.x0 + HALL3.x1) / 2, 1, (HALL3.z0 + HALL3.z1) / 2));
    if (hd > .3) items.push({ d: hd, fn: x => {
      const o = { col: INK3B, light: LIGHT3, lo: .3, ink: '#05040c', dark: .7 }, H = HALL3;
      S3.box(x, cam, { x0: H.x0 - .1, x1: H.x1 + .1, y0: F3, y1: F3 + .22, z0: H.z0 - .1, z1: H.z1 + .1 }, o);
      S3.box(x, cam, { x0: H.x0, x1: H.x1, y0: F3 + .22, y1: F3 + H.h, z0: H.z0, z1: H.z1 }, o);
      const ex = .25, c = [(H.x0 + H.x1) / 2, (H.z0 + H.z1) / 2], rx = (H.x1 - H.x0) / 2 + ex, rz = (H.z1 - H.z0) / 2 + ex, top = H.h + H.roof, r2 = rz * .25;
      const E0 = [c[0] - rx, H.h - .05, c[1] - rz], E1 = [c[0] + rx, H.h - .05, c[1] - rz], E2 = [c[0] + rx, H.h - .05, c[1] + rz], E3_ = [c[0] - rx, H.h - .05, c[1] + rz], R0 = [c[0] - rx + rz, top, c[1]], R1 = [c[0] + rx - rz, top, c[1]];
      const face = (pts, n) => { if (!S3.facing(cam, P3(...pts[0]), n)) return; if (S3.poly(x, cam, pts.map(p => P3(...p)))) { x.fillStyle = sh3('#2a1c22', n); x.fill(); x.strokeStyle = x.fillStyle; x.lineWidth = 1; x.stroke(); } };
      face([E0, E1, R1, R0], [0, .6, -.8]); face([E1, E2, R1], [.8, .6, 0]); face([E2, E3_, R0, R1], [0, .6, .8]); face([E3_, E0, R0], [-.8, .6, 0]);
      if (e.glow > .9) { const q = cam.proj(P3(H.x0 - .01, 1.0, H.door)); if (q) RV.glow(x, q[0], q[1], .9 * q[3], '#ffb860', .35 * clamp((e.glow - .9) * 10) * (1 - clamp((e.glow - .97) * 30))); }
    } });
  }

  const frame3 = (X, Z, d) => ({ X, Z, d, P: (f, l, u) => [X + f * d[0] + l * d[1], F3 + u, Z + f * d[1] - l * d[0]], N: (nf, nl, nu) => [nf * d[0] + nl * d[1], nu, nf * d[1] - nl * d[0]] });
  const WEST3 = [-1, 0], frac = v => v - Math.floor(v);
  const ell = (f, uc, hh, hw, n = 10) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [f, hw * Math.cos(a), uc + hh * Math.sin(a)]; });
  const HORSE3 = {
    front: [...ell(.68, 1.02, .24, .18), ...ell(.42, 1.04, .30, .25), ...ell(.08, 1.03, .31, .27), [.46, 0, 1.38]],
    rear: [...ell(.1, 1.03, .31, .27), ...ell(-.28, 1.05, .30, .27), ...ell(-.56, 1.08, .27, .24), ...ell(-.78, 1.07, .18, .17), [-.48, 0, 1.38]],
    neck: [...ell(.46, 1.12, .26, .17), ...ell(.76, 1.42, .16, .12), ...ell(.96, 1.62, .1, .085), [.62, 0, 1.52], [.86, 0, 1.72]],
    head: [...ell(.96, 1.63, .1, .09, 8), ...ell(1.06, 1.54, .12, .1, 8), ...ell(1.3, 1.25, .075, .07, 8)],
    pivot: [.5, 1.12],
    legs: [{ f: .5, u: .86, a: .36, b: .34, bend: 1, n: .55, l: .13, fore: true }, { f: .5, u: .86, a: .36, b: .34, bend: 1, n: .55, l: -.13, fore: true },
      { f: -.44, u: .92, a: .42, b: .36, bend: -1, n: -.58, l: .14 }, { f: -.44, u: .92, a: .42, b: .36, bend: -1, n: -.58, l: -.14 }],
    width: [.16, .1, .075], hoof: .1,
  };
  function hull3(q) {
    const p = q.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const v of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
    for (let i = p.length - 1; i >= 0; i--) { const v = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function fillHull3(x, cam, pts, col) {
    const q = []; for (const p of pts) { const s = cam.proj(p); if (!s) return false; q.push(s); }
    const h = hull3(q); if (h.length < 3) return false;
    x.fillStyle = col; x.beginPath(); h.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.fill(); return true;
  }
  function seg3(x, cam, a, b, wd, col) {
    let A = a, B = b; const da = cam.depth(A), db = cam.depth(B), DM = .3;
    if (da < DM && db < DM) return;
    if (da < DM || db < DM) { const k = (DM - da) / (db - da), m = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]; if (da < DM) A = m; else B = m; }
    const p = cam.proj(A), q = cam.proj(B); if (!p || !q) return;
    x.strokeStyle = col; x.lineWidth = Math.max(.7, Math.min(90, wd * (p[3] + q[3]) / 2)); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke();
  }
  function ik3(T, Ft, a, b, bend) {
    const dx = Ft[0] - T[0], dy = Ft[1] - T[1], L = Math.min(Math.hypot(dx, dy), a + b - 1e-4), base = Math.atan2(dy, dx), A = Math.acos(clamp((a * a + L * L - b * b) / (2 * a * L), -1, 1));
    const j1 = [T[0] + a * Math.cos(base + A), T[1] + a * Math.sin(base + A)], j2 = [T[0] + a * Math.cos(base - A), T[1] + a * Math.sin(base - A)];
    return (bend > 0 ? j1[0] > j2[0] : j1[0] < j2[0]) ? j1 : j2;
  }
  function horse3(x, cam, fr, headDown, t, seed, col) {
    const Bd = HORSE3, P = (f, l, u) => fr.P(f, l, u), camL = (cam.pos[0] - fr.X) * fr.d[1] - (cam.pos[2] - fr.Z) * fr.d[0];
    const br = .006 * Math.sin(t * 1.7 + seed), nod = -headDown + .025 * Math.sin(t * .9 + seed * 2.1);
    const rotN = p => { const dx = p[0] - Bd.pivot[0], du = p[2] - Bd.pivot[1], c = Math.cos(nod), sn = Math.sin(nod); return [Bd.pivot[0] + dx * c - du * sn, p[1], Bd.pivot[1] + dx * sn + du * c]; };
    const body = pts => pts.map(([f, l, u]) => P(f, l, u + br));
    const leg = L => { const T = [L.f, L.u + br], Fl = [L.n + (L.fore ? .02 : -.02), .1], J = ik3(T, Fl, L.a, L.b, L.bend); x.lineCap = 'round'; seg3(x, cam, P(T[0], L.l, T[1]), P(J[0], L.l, J[1]), Bd.width[0], col); seg3(x, cam, P(J[0], L.l, J[1]), P(Fl[0], L.l, Fl[1]), Bd.width[1], col); seg3(x, cam, P(Fl[0], L.l, Fl[1]), P(Fl[0] + .03, L.l, .02), Bd.width[2], col); seg3(x, cam, P(Fl[0] - .02, L.l, .015), P(Fl[0] + .07, L.l, .015), Bd.hoof, col); };
    Bd.legs.filter(L => L.l * camL < 0).forEach(leg);
    seg3(x, cam, P(-.76, 0, 1.17 + br), P(-.86, 0, 1.0 + br), .09, col); { const k = cam.proj(P(-.85, 0, 1.03 + br)); if (k) { x.fillStyle = col; x.beginPath(); x.arc(k[0], k[1], Math.max(1, .075 * k[3]), 0, TAU); x.fill(); } } seg3(x, cam, P(-.86, 0, 1.0 + br), P(-.9, 0, .86 + br), .05, col);
    fillHull3(x, cam, body(Bd.rear), col); fillHull3(x, cam, body(Bd.front), col);
    fillHull3(x, cam, body(Bd.neck.map(rotN)), col); fillHull3(x, cam, body(Bd.head.map(rotN)), col);
    for (const sg of [1, -1]) { const a = rotN([.93, .05 * sg, 1.68]), b = rotN([.92, .06 * sg, 1.84]), c = rotN([.99, .05 * sg, 1.7]); const q = [a, b, c].map(v => cam.proj(P(v[0], v[1], v[2] + br))); if (q.every(Boolean)) { x.fillStyle = col; x.beginPath(); x.moveTo(q[0][0], q[0][1]); x.lineTo(q[1][0], q[1][1]); x.lineTo(q[2][0], q[2][1]); x.closePath(); x.fill(); } }
    Bd.legs.filter(L => L.l * camL >= 0).forEach(leg);
    return P(...rotN([1.24, 0, 1.21]));
  }
  function wheel3(x, cam, fr, l, r, n, col, hub) {
    const rim = Array.from({ length: 28 }, (_, i) => { const q = i / 28 * TAU; return fr.P(r * Math.cos(q), l, r + r * Math.sin(q)); });
    const q = rim.map(p => cam.proj(p)); if (q.some(v => !v)) return;
    const k = cam.proj(fr.P(0, l, r))[3];
    x.strokeStyle = col; x.lineWidth = Math.max(1, .075 * k); x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.stroke();
    x.lineWidth = Math.max(.6, .02 * k); x.beginPath();
    for (let i = 0; i < n; i++) { const a = .3 + i / n * TAU, p = cam.proj(fr.P(.09 * Math.cos(a), l, r + .09 * Math.sin(a))), e = cam.proj(fr.P(r * .96 * Math.cos(a), l, r + r * .96 * Math.sin(a))); if (p && e) { x.moveTo(p[0], p[1]); x.lineTo(e[0], e[1]); } }
    x.stroke();
    const hc = cam.proj(fr.P(0, l, r)); if (hc) { x.fillStyle = hub || col; x.beginPath(); x.arc(hc[0], hc[1], Math.max(1, .1 * k), 0, TAU); x.fill(); }
  }
  function lbox3(x, cam, fr, f0, f1, l0, l1, u0, u1, col, o = {}) {
    const P = fr.P, faces = [
      [[[f0, l0, u1], [f1, l0, u1], [f1, l1, u1], [f0, l1, u1]], [0, 0, 1], o.top],
      [[[f1, l0, u0], [f1, l1, u0], [f1, l1, u1], [f1, l0, u1]], [1, 0, 0], o.front],
      [[[f0, l0, u0], [f0, l1, u0], [f0, l1, u1], [f0, l0, u1]], [-1, 0, 0], o.back],
      [[[f0, l1, u0], [f1, l1, u0], [f1, l1, u1], [f0, l1, u1]], [0, 1, 0], o.left],
      [[[f0, l0, u0], [f1, l0, u0], [f1, l0, u1], [f0, l0, u1]], [0, -1, 0], o.right],
    ];
    for (const [pts, n, c] of faces) { const N = fr.N(...n), W3 = pts.map(p => P(...p)); if (!S3.facing(cam, W3[0], N)) continue; if (S3.poly(x, cam, W3)) { x.fillStyle = c || sh3(col, N, .45); x.fill(); } }
  }
  const LAC3 = '#17131d', BODY3 = .37;
  function carriageItems(items, cam, e, t) {
    const fr = frame3(CAR3.x, CAR3.z, WEST3), P = fr.P, camL = (cam.pos[0] - CAR3.x) * WEST3[1] - (cam.pos[2] - CAR3.z) * WEST3[0], near = camL >= 0 ? 1 : -1;
    const add = (f, l, u, fn) => { const d = cam.depth(P(f, l, u)); if (d > .2) items.push({ d, fn }); };
    for (const sg of [-near, near]) add(0, sg * .98, .62, x => wheel3(x, cam, fr, sg * .98, .62, 26, '#100d16', GILT3));
    const lanes = [-.93, -.31, .31, .93], mouths = [];
    lanes.forEach((l, i) => { const hf = frame3(CAR3.x - 3.55, CAR3.z + l, WEST3); add(3.55, l, 1.0, x => { mouths[i] = horse3(x, cam, hf, .24 + .05 * hash(i, 5), t, i + 3, '#0e0c15'); }); });
    add(2.2, 0, .95, x => {
      x.lineCap = 'round';
      seg3(x, cam, P(.4, 0, .74), P(1.6, 0, .82), .09, LAC3); seg3(x, cam, P(1.6, 0, .82), P(2.5, 0, 1.0), .08, LAC3); seg3(x, cam, P(2.5, 0, 1.0), P(2.85, 0, 1.18), .07, LAC3);
      seg3(x, cam, P(2.8, -1.05, 1.2), P(2.8, 1.05, 1.2), .07, LAC3);
      for (const l of lanes) seg3(x, cam, P(2.8, l, 1.2), P(3.95, l, 1.28), .02, 'rgba(20,16,26,.85)');
      x.strokeStyle = '#1a1218'; x.lineWidth = Math.max(.8, cam.f / 1500);
      for (let i = 0; i < 4; i++) { const hf = frame3(CAR3.x - 3.55, CAR3.z + lanes[i], WEST3), m = hf.P(1.22, 0, 1.15 - .24), a = fr.P(BODY3 + .78, lanes[i] * .3, 1.16), mid = [(a[0] + m[0]) / 2, (a[1] + m[1]) / 2 - .14, (a[2] + m[2]) / 2]; x.beginPath(); let pen = false; for (let j = 0; j <= 12; j++) { const u = j / 12, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u, q = cam.proj([w0 * a[0] + w1 * mid[0] + w2 * m[0], w0 * a[1] + w1 * mid[1] + w2 * m[1], w0 * a[2] + w1 * mid[2] + w2 * m[2]]); if (!q) { pen = false; continue; } pen ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); pen = true; } x.stroke(); }
    });
    add(0, 0, 1.3, x => carriageBody3(x, cam, e, t, near));
  }
  function carriageBody3(x, cam, e, t, near) {
    const fr = frame3(CAR3.x + BODY3 * WEST3[0], CAR3.z + BODY3 * WEST3[1], WEST3), P = fr.P, c0 = -1.0, c1 = .22, d1 = .78, top = 1.86;
    canopy3(x, cam, fr, (c0 + c1) / 2, top, 'under');
    lbox3(x, cam, fr, c1, d1, -.62, .62, .74, .86, LAC3);
    lbox3(x, cam, fr, c0, c1, -.62, .62, .74, top, LAC3);
    const fw = (f0, f1, l0, l1) => lbox3(x, cam, fr, f0, f1, l0, l1, .86, 1.16, LAC3);
    fw(c1, d1, -near * .62, -near * .58); fw(c1, d1, near * .58, near * .62); fw(d1 - .04, d1, -.62, .62);
    for (const sg of [-1, 1]) {
      const l = sg * .625, N = fr.N(0, sg, 0), q = [[-.62, l, 1.2], [.02, l, 1.2], [.02, l, 1.6], [-.62, l, 1.6]].map(p => P(...p));
      if (!S3.facing(cam, q[0], N)) continue;
      if (S3.poly(x, cam, q)) { x.fillStyle = S3.mix('#2a2430', '#ffc070', clamp(e.win)); x.fill(); }
      if (e.win > .01) { const m = cam.proj(P(-.3, l, 1.4)); if (m) RV.glow(x, m[0], m[1], .55 * m[3], '#ffb860', .5 * e.win); }
      x.strokeStyle = '#100d14'; x.lineWidth = Math.max(1, cam.f / 1000); x.beginPath();
      for (let i = 1; i < 6; i++) S3.line(x, cam, P(-.62 + .64 * i / 6, l, 1.2), P(-.62 + .64 * i / 6, l, 1.6));
      for (let j = 1; j < 4; j++) S3.line(x, cam, P(-.62, l, 1.2 + .4 * j / 4), P(.02, l, 1.2 + .4 * j / 4));
      x.stroke();
      if (sg === near) {
        x.strokeStyle = '#8a6a44'; x.lineWidth = Math.max(1, .012 * (cam.proj(P(-.3, l, 1.4)) || [0, 0, 0, 80])[3]); x.beginPath(); S3.line(x, cam, P(-.66, l + sg * .01, 1.5), P(.06, l + sg * .01, 1.3)); x.stroke();
        const c = cam.proj(P(-.3, l + sg * .015, 1.4)); if (c) { const r = .045 * c[3], lit = .25 + .75 * e.seal; x.fillStyle = S3.mix('#9a2a1e', '#ff6a40', lit); x.beginPath(); x.ellipse(c[0], c[1], r * .8, r, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,220,180,.5)'; x.beginPath(); x.ellipse(c[0] - r * .25, c[1] - r * .3, r * .25, r * .3, 0, 0, TAU); x.fill(); if (e.seal > .01) RV.glow(x, c[0], c[1], Math.max(6, .25 * c[3]), '#ff7a50', .55 * e.seal); }
      }
    }
    x.lineCap = 'butt';
    for (const [a, b, n] of [[[c0, -.625], [c1, -.625], [0, -1]], [[c0, .625], [c1, .625], [0, 1]], [[c0, -.625], [c0, .625], [-1, 0]], [[c1, -.625], [c1, .625], [1, 0]]])
      if (S3.facing(cam, P(a[0], a[1], top), fr.N(n[0], n[1], 0))) seg3(x, cam, P(a[0], a[1], top - .05), P(b[0], b[1], top - .05), .03, GILT3);
    canopy3(x, cam, fr, (c0 + c1) / 2, top, 'shell');
  }
  const CANOPY3 = { A: 1.0, B: .9, T: .05, H: .3, NR: 10, NS: 48, col: '#5c4636', under: '#0c0a11' };
  function canopy3(x, cam, fr, cf, top, part) {
    const C = CANOPY3, P = fr.P, ang = j => j / C.NS * TAU, rr = i => 1 - i / C.NR, hu = r => top + C.T + C.H * (1 - r * r);
    const pt = (r, a, u) => P(cf + C.A * r * Math.cos(a), C.B * r * Math.sin(a), u);
    const unit = v => { const l = Math.hypot(...v); return v.map(c => c / l); };
    const nDome = (r, a) => fr.N(...unit([2 * C.H * r * Math.cos(a) / C.A, 2 * C.H * r * Math.sin(a) / C.B, 1]));
    const nRim = a => fr.N(...unit([Math.cos(a) / C.A, Math.sin(a) / C.B, 0]));
    const lit = n => Math.max(0, n[0] * LIGHT3[0] + n[1] * LIGHT3[1] + n[2] * LIGHT3[2]);
    const Fu = S3.facing(cam, pt(1, 0, top), fr.N(0, 0, -1)), Fb = Array.from({ length: C.NS }, (_, j) => S3.facing(cam, pt(1, ang(j + .5), top + C.T / 2), nRim(ang(j + .5))));
    const k = (cam.proj(pt(0, 0, top)) || [0, 0, 0, 100])[3];
    const edge = (p, q, n) => { const a = .85 * Math.pow(lit(n), .7); if (a < .03) return; x.globalAlpha = a; x.beginPath(); S3.line(x, cam, p, q); x.stroke(); };
    if (part === 'under') {
      const ring = Array.from({ length: C.NS }, (_, j) => pt(1, ang(j), top));
      if (Fu && S3.poly(x, cam, ring)) { x.fillStyle = C.under; x.fill(); }
      x.save(); x.strokeStyle = RIM3; x.lineWidth = Math.max(1, .005 * k);
      for (let j = 0; j < C.NS; j++) if (Fb[j] !== Fu) edge(pt(1, ang(j), top), pt(1, ang(j + 1), top), Fu ? nRim(ang(j + .5)) : fr.N(0, 0, -1));
      x.restore();
      return;
    }
    const tone = n => S3.shade(C.col, n, LIGHT3, { lo: .15, ink: '#0b0912', dark: .95 });
    const fill = (pts, col) => { if (S3.poly(x, cam, pts)) { x.fillStyle = col; x.fill(); x.strokeStyle = col; x.lineWidth = .8; x.stroke(); } };
    const Fd = [];
    for (let j = 0; j < C.NS; j++) {
      const a0 = ang(j), a1 = ang(j + 1), n = nRim(ang(j + .5));
      if (Fb[j]) fill([pt(1, a0, top), pt(1, a1, top), pt(1, a1, top + C.T), pt(1, a0, top + C.T)], tone(n));
    }
    for (let i = 0; i < C.NR; i++) {
      Fd[i] = []; const r0 = rr(i), r1 = rr(i + 1), rm = (r0 + r1) / 2;
      for (let j = 0; j < C.NS; j++) {
        const a0 = ang(j), a1 = ang(j + 1), am = (a0 + a1) / 2, n = nDome(rm, am);
        Fd[i][j] = S3.facing(cam, pt(rm, am, hu(rm)), n);
        if (Fd[i][j]) fill(i === C.NR - 1 ? [pt(r0, a0, hu(r0)), pt(r0, a1, hu(r0)), pt(0, 0, hu(0))] : [pt(r0, a0, hu(r0)), pt(r0, a1, hu(r0)), pt(r1, a1, hu(r1)), pt(r1, a0, hu(r1))], tone(n));
      }
    }
    x.save(); x.lineCap = 'round'; x.strokeStyle = GILT3; x.lineWidth = Math.max(.8, .012 * k); x.beginPath();
    for (let j = 0; j < C.NS; j++) if (Fb[j]) S3.line(x, cam, pt(1, ang(j), top + .004), pt(1, ang(j + 1), top + .004));
    x.stroke();
    const rg = .55; x.globalAlpha = .55; x.lineWidth = Math.max(.7, .007 * k); x.beginPath();
    for (let j = 0; j < C.NS; j++) { const am = ang(j + .5); if (S3.facing(cam, pt(rg, am, hu(rg)), nDome(rg, am))) S3.line(x, cam, pt(rg, ang(j), hu(rg) + .003), pt(rg, ang(j + 1), hu(rg) + .003)); }
    x.stroke(); x.globalAlpha = 1;
    x.strokeStyle = RIM3; x.lineWidth = Math.max(1, .005 * k);
    for (let j = 0; j < C.NS; j++) {
      const j1 = (j + 1) % C.NS, a1 = ang(j + 1), am = ang(j + .5);
      if (Fb[j] !== Fb[j1]) edge(pt(1, a1, top), pt(1, a1, top + C.T), nRim(a1));
      if (Fb[j] !== Fd[0][j]) edge(pt(1, ang(j), top + C.T), pt(1, a1, top + C.T), Fb[j] ? nDome(1, am) : nRim(am));
      for (let i = 0; i < C.NR; i++) {
        const r0 = rr(i), r1 = rr(i + 1);
        if (Fd[i][j] !== Fd[i][j1]) edge(pt(r0, a1, hu(r0)), pt(r1, a1, hu(r1)), nDome((r0 + r1) / 2, a1));
        if (i < C.NR - 1 && Fd[i][j] !== Fd[i + 1][j]) edge(pt(r1, ang(j), hu(r1)), pt(r1, a1, hu(r1)), nDome(r1, am));
      }
    }
    x.restore();
  }
  function lanternItems(items, cam, st) {
    LAN3.forEach(([X, Z, h], i) => {
      const d = cam.depth(P3(X, h * .6, Z)); if (d < .3) return;
      items.push({ d, fn: x => {
        const b = cam.proj(P3(X, 0, Z)), tp = cam.proj(P3(X, h + .12, Z)), lp = cam.proj(P3(X, h, Z)); if (!b || !tp || !lp) return;
        x.strokeStyle = '#0c0a12'; x.lineWidth = Math.max(1, .03 * b[3]); x.lineCap = 'round'; x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(tp[0], tp[1]); x.stroke();
        const fl = 1 + .06 * Math.sin(st.t * 9.3 + i * 2) + .03 * Math.sin(st.t * 23.1 + i);
        x.fillStyle = '#f0a850'; x.beginPath(); x.ellipse(lp[0], lp[1], .07 * lp[3], .1 * lp[3], 0, 0, TAU); x.fill();
        x.fillStyle = '#2a1c14'; x.fillRect(lp[0] - .08 * lp[3], lp[1] - .12 * lp[3], .16 * lp[3], .025 * lp[3]); x.fillRect(lp[0] - .08 * lp[3], lp[1] + .1 * lp[3], .16 * lp[3], .02 * lp[3]);
        RV.glow(x, lp[0], lp[1], Math.max(10, .8 * lp[3]), '#ffb45a', .5 * fl); RV.glow(x, lp[0], lp[1], Math.max(3, .1 * lp[3]), '#fff2d8', .9);
      } });
    });
  }
  const PK3 = { min: Q.silhouette('minister', INK3), minR: Q.silhouette('minister', RIM3, RIM3), sol: Q.silhouette('worker', INK3), solR: Q.silhouette('worker', RIM3, RIM3) };
  RV.PK3 = PK3;
  RV.standPose3 = () => ({ ...Mo.stand(0), lean: .02, head: 0, arms: [[.2, 2.75], [.25, 2.8]], hands: [{ pose: 'none' }, { pose: 'none' }] });
  const faceOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  function beltSeal3(xx, pj, t, glint) {
    const yaw = pj.yaw, c = Math.cos(yaw), sn = Math.sin(yaw), f = 2.5, s = -5.5;
    const vis = ss(-2, 1.5, f * sn + s * c); if (vis <= .01) return;
    const hipX = (pj.hip[0] + f) * c - s * sn, hipY = pj.hip[1] - 3.5;
    const sw = .06 * Math.sin(t * 1.3), L = 10, ex = hipX + L * Math.sin(sw), ey = hipY + L * Math.cos(sw);
    xx.save(); xx.globalAlpha *= vis;
    xx.strokeStyle = '#7a2418'; xx.lineWidth = 1; xx.lineCap = 'round'; xx.beginPath(); xx.moveTo(hipX, hipY); xx.quadraticCurveTo(hipX + .6, hipY + L * .5, ex, ey); xx.stroke();
    xx.fillStyle = '#7a2418'; xx.beginPath(); xx.arc(hipX, hipY, 1.1, 0, TAU); xx.fill();
    xx.translate(ex, ey); xx.rotate(-sw);
    xx.fillStyle = S3.mix('#3e5446', '#8fc49c', .7 * glint); xx.fillRect(-2, 0, 4, 3.4);
    xx.fillStyle = S3.mix('#7d9a82', '#eafbe8', glint); xx.fillRect(-2, 0, 4, .7);
    xx.fillStyle = S3.mix('#4a6452', '#a8d8b0', .7 * glint); xx.beginPath(); xx.moveTo(-1.4, 0); xx.quadraticCurveTo(-.8, -2, 1.2, -1.2); xx.lineTo(1.4, 0); xx.closePath(); xx.fill();
    if (glint > .01) RV.glow(xx, 0, 1.6, 6, '#cdeed4', .3 * glint);
    xx.restore();
  }
  function person3(x, cam, p, facing, pose, o) {
    const fa = S3.figureAt(cam, P3(p[0], 0, p[1]), facing); if (!fa || fa.depth < .3) return null;
    const eye = cam.pos, hd = Math.hypot(p[0] - eye[0], p[1] - eye[2]), elev = Math.atan2(eye[1] - (F3 + .9), hd), tilt = clamp(Math.sin(elev), 0, .5);
    const vis = 1 - ss(30, 34, elev * 180 / PI); if (vis <= .001) return null;
    const ps = o.yframe ? { ...pose, yaw: pose.yaw - cam.yaw, headYaw: (pose.headYaw ?? pose.yaw) - cam.yaw, feet: pose.feet.map(f => f.yaw != null ? { ...f, yaw: f.yaw - cam.yaw } : f) } : { ...pose, yaw: fa.yaw, headYaw: fa.yaw + (o.headYaw || 0) }, sc = fa.s * (o.h || 1);
    const opts = { tilt, robe: o.soldier ? null : 44, shadow: 0, beard: !!o.beard, prop: o.prop };
    const r = Math.max(.8, sc * 1.25), draw = (L, dx, dy) => { x.save(); x.translate(fa.sx + dx, fa.sy + dy); x.scale(sc, sc); Q.draw(x, F.PAL.lightbox, ps, L, opts); x.restore(); };
    const hpx = sc * 92; if (hpx < 3) return fa;
    const near3 = ss(-2.0, -.4, cam.pos[2]), rimA = (o.rim ?? .6) * ss(18, 40, hpx) * near3, r2 = ss(70, 95, hpx), k2 = ss(105, 135, hpx) * near3;
    x.save(); x.globalAlpha *= vis;
    if (rimA > .01) { x.save(); x.globalAlpha *= clamp(rimA); const L = o.rimCol ? Q.silhouette('minister', o.rimCol, o.rimCol) : o.soldier ? PK3.solR : PK3.minR; draw(L, -r, -r * .6); if (r2 > 0) { x.globalAlpha *= r2; draw(L, r * .7, -r * .7); } x.restore(); }
    draw(o.soldier ? PK3.sol : PK3.min, 0, 0); if (k2 > 0) { x.save(); x.globalAlpha *= k2; draw(o.soldier ? PK3.sol : PK3.min, 0, 0); x.restore(); }
    x.restore();
    return fa;
  }
  function peopleItems(items, cam, e, t) {
    const zh = e.zhao, zp = zh ? [zh.x, zh.z] : MEN3.zhao, li = MEN3.li;
    const breath = k => .006 * Math.sin(t * 1.4 + k);
    { const d = cam.depth(P3(li[0], .9, li[1])); if (d > .3) items.push({ d, fn: x => person3(x, cam, li, faceOf(li, MEN3.zhao), { ...RV.standPose3(), lean: .02 + breath(1), head: .08 + .14 * e.glance }, { beard: true, h: 1.03, rim: .55 + .4 * e.men }) }); }
    { const d = cam.depth(P3(zp[0], .9, zp[1])); if (d > .3) items.push({ d, fn: x => {
      const pose = zh ? zh.pose : { ...RV.standPose3(), lean: .02 + breath(2), head: .08 + .14 * e.glance }, facing = zh ? 0 : faceOf(MEN3.zhao, li);
      const gold = e.gold;
      person3(x, cam, zp, facing, pose, { beard: false, h: 1, rim: .55 + .4 * e.men + .4 * gold, rimCol: gold > .01 ? S3.mix(RIM3, '#ffc040', gold) : null, yframe: !!zh, prop: (xx, pj) => beltSeal3(xx, pj, t, e.belt) });
    } }); }
    GUARD3.forEach(([X, Z], i) => {
      const d = cam.depth(P3(X, .9, Z)); if (d < .3) return;
      items.push({ d, fn: x => person3(x, cam, [X, Z], PI, { ...Mo.stand(0), lean: .02 + breath(3 + i), arms: [[.1, .2], [.25, .35]] }, { headYaw: i ? 0 : -.9 * (e.guard || 0), soldier: true, h: .98, rim: .5, prop: (xx, pj) => { xx.strokeStyle = INK3; xx.lineWidth = 1.6; xx.lineCap = 'round'; const a = pj.arms[1].wr; xx.beginPath(); xx.moveTo(a[0] + 2, a[1] + 30); xx.lineTo(a[0] - 2, a[1] - 74); xx.stroke(); xx.fillStyle = INK3; xx.beginPath(); xx.moveTo(a[0] - 2, a[1] - 74); xx.lineTo(a[0] - 5, a[1] - 86); xx.lineTo(a[0] + 1, a[1] - 76); xx.fill(); } }) });
    });
  }
  function menShadows3(x, cam, e) {
    const L = LAN3[0], zh = e.zhao, men = [zh ? [zh.x, zh.z] : MEN3.zhao, MEN3.li];
    men.forEach((m, i) => {
      const d = [m[0] - L[0], m[1] - L[1]], l = Math.hypot(d[0], d[1]); if (l < .2) return;
      const u = [d[0] / l, d[1] / l], n = [-u[1], u[0]], len = 1.7 + .4 * i, at = (s, o) => P3(m[0] + u[0] * s + n[0] * o, .004, m[1] + u[1] * s + n[1] * o);
      const prof = [[0, .1], [.3, .16], [.55, .24], [.72, .3], [.76, .21], [.8, .09], [.83, .12], [.9, .12], [.92, .05], [1.0, .05]];
      for (const [grow, a] of [[.05, .2], [0, .38]]) {
        const pts = []; for (const [f, w2] of prof) pts.push(at(len * f, -(w2 + grow))); for (let j = prof.length - 1; j >= 0; j--) pts.push(at(len * prof[j][0], prof[j][1] + grow));
        if (big3(x, cam, pts)) { x.fillStyle = `rgba(4,3,10,${a})`; x.fill(); }
      }
    });
  }
  const NC3 = 7, NR3 = 9;
  const GLYPH3 = (() => {
    const R = F.rng(3111), o = [];
    const part = (x0, y0, x1, y1, out) => {
      const n = 2 + Math.floor(R() * 2), W2 = x1 - x0, H2 = y1 - y0;
      for (let k = 0; k < n; k++) {
        const r = R(), X = u => x0 + W2 * u, Y = v => y0 + H2 * v;
        if (r < .3) { const v = .15 + .7 * R(); out.push([[X(.08), Y(v)], [X(.92), Y(v + .03)]]); }
        else if (r < .5) { const u = .25 + .5 * R(); out.push([[X(u), Y(.05)], [X(u), Y(.95)]]); }
        else if (r < .65) { const a = .2 + .2 * R(), b = .45 + .3 * R(); out.push([[X(.18), Y(a)], [X(.18), Y(b)], [X(.82), Y(b)], [X(.82), Y(a)], [X(.18), Y(a)]]); }
        else if (r < .8) out.push([[X(.75), Y(.15)], [X(.55), Y(.55)], [X(.12), Y(.9)]]);
        else if (r < .92) out.push([[X(.25), Y(.25)], [X(.5), Y(.6)], [X(.92), Y(.88)]]);
        else { const u = .3 + .4 * R(), v = .1 + .3 * R(); out.push([[X(u), Y(v)], [X(u + .12), Y(v + .14)]]); }
      }
    };
    for (let c = 0; c < NC3; c++) for (let r = 0; r < NR3; r++) {
      if (c === 0 && r > 5) continue;
      const st = [], k = R();
      if (k < .35) part(0, 0, 1, 1, st);
      else if (k < .7) { const m = .38 + .14 * R(); part(0, 0, m, 1, st); part(m, 0, 1, 1, st); }
      else { const m = .35 + .2 * R(); part(0, 0, 1, m, st); part(0, m, 1, 1, st); }
      o.push({ c, r, s: st });
    }
    return o;
  })();
  function letterOn(x, cam, o, U, V, ink, print, matA, alpha = 1) {
    const W3 = (u, v) => [o[0] + U[0] * u + V[0] * v, o[1] + U[1] * u + V[1] * v, o[2] + U[2] * u + V[2] * v];
    const quad = (u0, v0, u1, v1, col) => { if (big3(x, cam, [W3(u0, v0), W3(u1, v0), W3(u1, v1), W3(u0, v1)])) { x.fillStyle = col; x.fill(); } };
    x.save(); x.globalAlpha *= alpha;
    if (matA > 0) quad(-.18, -.2, 1.18, 1.22, '#4a3624');
    quad(0, 0, 1, 1, '#efe2c2');
    quad(-.03, 0, .02, 1, '#7a4a28'); quad(.98, 0, 1.03, 1, '#7a4a28');
    const cw = .86 / NC3, ch = .82 / NR3, inkAt = (c, r) => clamp((ink * (NC3 * .12 + .14 + NR3 * .018) - (NC3 - 1 - c) * .12 - r * .018) / .14);
    const uLen = Math.hypot(U[0], U[1], U[2]);
    x.strokeStyle = '#1e1714'; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const g of GLYPH3) {
      const k = inkAt(g.c, g.r); if (k <= 0) continue;
      const u0 = .07 + g.c * cw, v0 = .08 + g.r * ch, mc = cam.proj(W3(u0 + cw / 2, v0 + ch / 2)); if (!mc) continue;
      x.lineWidth = Math.max(.6, .085 * Math.min(cw, ch) * uLen * mc[3]); x.globalAlpha = alpha * k; x.beginPath();
      for (const pl of g.s) { let pen = false; for (const [a, b] of pl) { const q = cam.proj(W3(u0 + cw * (.12 + .76 * a), v0 + ch * (.08 + .84 * b))); if (!q) { pen = false; continue; } pen ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); pen = true; } }
      x.stroke();
    }
    x.globalAlpha = alpha;
    if (print > 0) {
      const sc = 1 + .35 * (1 - print), cu = .1, cv = .86, hw = .075 * sc, hv = .11 * sc;
      quad(cu - hw, cv - hv, cu + hw, cv + hv, `rgba(178,38,28,${print})`);
      const mc = cam.proj(W3(cu, cv));
      if (mc) { x.strokeStyle = `rgba(250,226,206,${.8 * print})`; x.lineWidth = Math.max(.6, .008 * uLen * mc[3]); x.beginPath();
        for (const [a, b, c2, d] of [[-.5, -.2, .5, -.2], [0, -.6, 0, .6], [-.5, .3, .5, .3], [-.3, -.6, -.3, -.1], [.3, .1, .3, .6]]) S3.line(x, cam, W3(cu + hw * a, cv + hv * b), W3(cu + hw * c2, cv + hv * d));
        x.stroke(); }
    }
    x.restore();
  }
  const silkPlane = () => { const { c, w, d, u, v } = SILK3; return { o: P3(c[0] - u[0] * w / 2 - v[0] * d / 2, .006, c[1] - u[1] * w / 2 - v[1] * d / 2), U: [u[0] * w, 0, u[1] * w], V: [v[0] * d, 0, v[1] * d] }; };
  RV.printAt3 = () => { const p = silkPlane(); return [p.o[0] + p.U[0] * .1 + p.V[0] * .86, p.o[1], p.o[2] + p.U[2] * .1 + p.V[2] * .86]; };
  function silk3(x, cam, e) { const p = silkPlane(); letterOn(x, cam, p.o, p.U, p.V, e.ink, e.print, 1); }
  function ring3(x, cam, e) {
    const k = e.ring; if (k <= 0 || k >= 1) return;
    const p = RV.printAt3(), r = .05 + 1.4 * k * (2 - k), a = .7 * (1 - k) * ss(0, .1, k);
    x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,70,40,${a})`; x.lineWidth = Math.max(1.5, cam.f / 700); x.beginPath(); let pen = false;
    for (let i = 0; i <= 48; i++) { const q = cam.proj([p[0] + r * Math.cos(i / 48 * TAU), p[1] + .002, p[2] + r * Math.sin(i / 48 * TAU)]); if (!q) { pen = false; continue; } pen ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); pen = true; }
    x.stroke(); x.restore();
    const q = cam.proj(p); if (q) RV.glow(x, q[0], q[1], Math.max(10, .5 * q[3]), '#ff5a3a', .55 * (1 - k) * ss(0, .1, k));
  }
  function red3(x, cam, e) {
    const R = e.red; if (!R || R.a <= .01) return; const q = cam.proj(R.p); if (!q) return;
    RV.glow(x, q[0], q[1], Math.max(14, .55 * q[3]), '#ff4a2a', .7 * R.a); RV.glow(x, q[0], q[1], Math.max(4, .12 * q[3]), '#ffe2d0', .95 * R.a);
  }
  function band3(x, cam, st) {
    const lit = (st.lit || [0, 0, 0])[2], e = st.e3 ? { ...E3, ...st.e3 } : E3, t = st.t || 0;
    x.save();
    screen3(x, cam, st, e, lit);
    sinShadows(x, cam, e);
    hills3(x, cam);
    lineFlat(x, cam, e);
    if (cam.pos[1] < B3.y1 && big3(x, cam, [P3(B3.x0, B3.y1 - F3, 0), P3(B3.x0, B3.y1 - F3, Z9), P3(B3.x1, B3.y1 - F3, Z9), P3(B3.x1, B3.y1 - F3, 0)])) { x.fillStyle = '#07061a'; x.fill(); }
    floor3(x, cam, lit);
    palaceFlat(x, cam, 'far', Z9 - .3, S3.mix('#1a1020', '#5a3420', .55 * lit), lit);
    palaceFlat(x, cam, 'near', Z9 - .78, '#120c1a', lit * .85);
    x.save(); x.globalCompositeOperation = 'lighter'; pools3(x, cam, st); x.restore();
    menShadows3(x, cam, e);
    if (cam.pos[1] > F3 + .02) { silk3(x, cam, e); ring3(x, cam, e); }
    const items = [];
    lineItems(items, cam, e);
    { const d = cam.depth(P3(THR3[0], .5, THR3[1])); if (d > .25) items.push({ d, fn: xx => { dais3(xx, cam, e, lit); throne3(xx, cam, e, lit); thread3(xx, cam, e); } }); }
    galleryItems(items, cam, e, t);
    carriageItems(items, cam, e, t);
    lanternItems(items, cam, st);
    peopleItems(items, cam, e, t);
    items.sort((a, b) => b.d - a.d).forEach(it => { x.save(); it.fn(x); x.restore(); });
    red3(x, cam, e);
    x.restore();
  }

  RV.frame = (ctx, LB, cam, st) => {
    const W = cam.W, H = cam.H, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2], inn = RV.inside(cam), sv = F.SHIFT;
    LB.background(ctx);
    const above = cam.pos[1] > 0;
    if (!inn) LB.sheet(ctx, ID, 1, RC, x => { if (sv) x.translate(sv.x * .4, sv.y * .4); sky(x, cam, st); }, { rim: false, shadow: false, fibre: .25 });
    LB.sheet(ctx, ID, 1, RC, x => {
      if (inn === 4) {
        shaftWalls(x, cam, st);
        x.save(); if (holePath(x, cam, Y1)) { x.clip(); band1(x, cam, st); if (st.b1) st.b1(x, cam); } x.restore();
        x.save(); if (holePath(x, cam, B2.y1)) { x.clip(); BOX = holeBox(cam); band2Lit(x, cam, st); BOX = null; } x.restore();
        if (st.b4) st.b4(x, cam);
      }
      if (!inn || inn === 2) {
        x.save(); if (!inn) { if (mouthPath(x, cam, 1)) x.clip(); else x.beginPath(); BOX = mouthBox(cam); } band2Lit(x, cam, st); BOX = null; x.restore();
      }
      const own = (i, fn) => {
        if (inn) { fn(); return; }
        const s = onFrame(S3.clip(cam, OPEN[i].map(([X, Y]) => [X, Y, 0])), cam); if (s.length < 3) return;
        const xs = s.map(q => q[0]), ys = s.map(q => q[1]);
        if (Math.max(...xs) < -50 || Math.min(...xs) > W + 50 || Math.max(...ys) < -50 || Math.min(...ys) > H + 50) return;
        x.save(); x.beginPath(); s.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.clip(); fn(); x.restore();
      };
      if (!inn || inn === 3) own(2, () => band3(x, cam, st));
      if (!inn || inn === 1) own(0, () => { band1(x, cam, st); if (st.b1) st.b1(x, cam); });
    }, { rimColor: '#ffd9a0', rimAlpha: .5, glow: .14, glowColor: '#cfd8ff', glowBlur: 12, fibre: .3 });
    LB.sheet(ctx, ID, 1, RC, x => {
      if (!above && !inn) { x.save(); const s = onFrame(S3.clip(cam, [[-90, 0, 0], [90, 0, 0], [90, 60, 0], [-90, 60, 0]]), cam); if (s.length > 2) { x.beginPath(); s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.clip(); cupEmblem(x, cam, st); } x.restore(); }
      face(x, cam, st); graveSection(x, cam, st);
      if (st.onFace) st.onFace(x, cam);
    }, { rimColor: '#ffc978', rimAlpha: .55, glow: .22, glowColor: '#ffae4a', glowBlur: 16, fibre: .35 });
    if (above && !inn) {
      LB.sheet(ctx, ID, 1, RC, x => { farGround(x, cam, st); nearGround(x, cam, st); sheen(x, cam, st); cupShadow(x, cam, st, 0); }, { rim: false, shadow: false, fibre: .3 });
      LB.sheet(ctx, ID, 1, RC, x => cupEmblem(x, cam, st), { rimColor: '#ffd9a0', rimAlpha: .6, glow: .25, glowColor: '#ffae4a', glowBlur: 14, fibre: .25 });
    }
    if (!inn || inn === 2) {
      if ((st.lit || [0, 0])[1] > .02) {
        if (!inn) { ctx.save(); const s = S3.clip(cam, OPEN[1].map(([X, Y]) => [X, Y, 0])); if (s.length > 2) { ctx.beginPath(); s.forEach((q, i) => i ? ctx.lineTo(q[0] - (sv ? sv.x : 0), q[1] - (sv ? sv.y : 0)) : ctx.moveTo(q[0] - (sv ? sv.x : 0), q[1] - (sv ? sv.y : 0))); ctx.closePath(); ctx.clip(); RV.roomLights(ctx, cam, { ...st, light: (st.light ?? 1) * st.lit[1] }); } ctx.restore(); }
        else RV.roomLights(ctx, cam, st);
      }
    }
    if ((inn === 1 && cam.pos[1] > Y1) || inn === 4) {
      ctx.save(); const s = S3.clip(cam, [[GRAVE.x0, B2.y1, GRAVE.z0], [GRAVE.x1, B2.y1, GRAVE.z0], [GRAVE.x1, B2.y1, GRAVE.z1], [GRAVE.x0, B2.y1, GRAVE.z1]]);
      if (s.length > 2) { ctx.beginPath(); s.forEach((q, i) => i ? ctx.lineTo(q[0] - (sv ? sv.x : 0), q[1] - (sv ? sv.y : 0)) : ctx.moveTo(q[0] - (sv ? sv.x : 0), q[1] - (sv ? sv.y : 0))); ctx.closePath(); ctx.clip(); RV.roomLights(ctx, cam, { ...st, light: (st.light ?? 1) * (st.lit || [0, 0])[1] }); }
      ctx.restore();
    }
    const sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    if (!inn) {
      const lit = st.lit || [0, 0, 0], away = above ? 1 : ss(.35, 2.5, -cam.pos[2]);
      for (const [i, Y, col, r] of [[0, -3.2, '#cfdcff', 10], [2, -13.8, '#ffc56a', 9]]) {
        if (lit[i] <= .01 || away <= 0) continue; const q = cam.proj([0, Y, 0]); if (q) RV.glow(ctx, q[0], q[1], Math.min(r * q[3], 3 * W), col, .12 * lit[i] * away, .3);
      }
      const c = RV.cupAt(cam, 1.15); if (c && away > 0 && (above || cam.pos[1] > -20)) {
        const s = st.silver ?? .6, hal = st.halo || 0;
        RV.glow(ctx, c[0], c[1], 1.1 * c[3], '#e8eeff', (.22 * s + .3 * hal) * away);
        if (hal > .01) RV.glow(ctx, c[0], c[1] - .1 * c[3], 2.4 * c[3], '#ffcf7a', .35 * hal * away, .45);
      }
    }
    if (st.glows) st.glows(ctx, cam);
    ctx.restore();
  };
})();
