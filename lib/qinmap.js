(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, CH = F.china, { clamp, lerp, TAU } = F;
  const QM = (F.qinmap = {});
  const P = (lon, lat) => CH.proj(lon, lat);

  const V = {
    P1: [110.6, 44], P2: [110.6, 38.2], P3: [111.8, 36.6], Q1: [111.9, 35.5], P5: [111.4, 34.4], P6: [111.6, 33.2],
    P7: [112.6, 31.5], P8: [112.8, 29.2], P9: [111.0, 27.0], P10: [109.0, 24.0], P4: [113.4, 35.8], Q2: [114.1, 35.6],
    Q3: [115.4, 36.1], Q4: [116.3, 37.6], Q5: [115.8, 38.6], Q6: [115.0, 39.6], Q7: [114.9, 44], H4: [114.0, 34.6],
    H5: [114.3, 33.6], H6: [112.4, 33.3], R1: [116.0, 35.0], R2: [115.6, 33.9], S1: [117.2, 38.4], S2: [118.5, 38.6],
    S3: [119.5, 34.9], S4: [117.5, 34.6], E1: [120, 38.8], E2: [128, 38.8], E3: [128, 34.8], E4: [128, 44], E5: [128, 18],
    W1: [95, 44], W2: [95, 18], W3: [109, 18],
  };
  const pts = s => s.split(' ').map(k => P(V[k][0], V[k][1]));
  const KDEF = [
    { id: 'qin', name: 'Qin', cap: [108.7, 34.35], col: '#8f8b80', ring: 'W1 P1 P2 P3 Q1 P5 P6 P7 P8 P9 P10 W3 W2' },
    { id: 'zhao', name: 'Zhao', cap: [114.5, 36.6], col: '#8fa58c', ring: 'P1 Q7 Q6 Q5 Q4 Q3 Q2 P4 Q1 P3 P2' },
    { id: 'han', name: 'Han', cap: [113.74, 34.39], col: '#b48b78', ring: 'Q1 P4 Q2 H4 H5 H6 P6 P5' },
    { id: 'wei', name: 'Wei', cap: [114.35, 34.8], col: '#8c9fb4', ring: 'Q2 Q3 R1 R2 H5 H4' },
    { id: 'qi', name: 'Qi', cap: [118.3, 36.8], col: '#98b3ad', ring: 'Q3 Q4 S1 S2 E1 E2 E3 S3 S4 R1' },
    { id: 'yan', name: 'Yan', cap: [116.4, 39.9], col: '#a597b6', ring: 'Q7 E4 E2 E1 S2 S1 Q4 Q5 Q6' },
    { id: 'chu', name: 'Chu', cap: [116.8, 32.6], col: '#b3a27a', ring: 'P6 H6 H5 R2 R1 S4 S3 E3 E5 W3 P10 P9 P8 P7' },
  ];
  const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const orient = (r, sgn) => (Math.sign(area(r)) === sgn ? r : r.slice().reverse());
  QM.K = KDEF.map(k => ({ ...k, ring: orient(pts(k.ring), 1), cap: P(k.cap[0], k.cap[1]) }));
  QM.byId = Object.fromEntries(QM.K.map(k => [k.id, k]));
  QM.BORDERS = ['P1 P2 P3 Q1', 'Q1 P5 P6', 'P6 P7 P8 P9 P10 W3', 'Q1 P4 Q2', 'Q2 Q3', 'Q3 Q4', 'Q4 Q5 Q6 Q7', 'Q2 H4 H5',
    'H5 H6 P6', 'Q3 R1', 'R1 R2 H5', 'R1 S4 S3 E3', 'Q4 S1 S2 E1 E2'].map(pts);
  QM.GOLD = '#d9a443';

  QM.inPoly = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  QM.inRings = (rings, x, y) => rings.some(r => QM.inPoly(r, x, y));
  QM.inEmpire = (x, y) => QM.inRings(CH.CHINA, x, y) && QM.inPoly(CH.QIN221[0], x, y);
  QM.kingdomAt = (x, y) => QM.K.find(k => QM.inPoly(k.ring, x, y)) || null;
  QM.disk = (cx, cy, r, n = 72) => { const o = []; for (let i = 0; i < n; i++) { const a = -i / n * TAU; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return orient(o, 1); };
  QM.road = p => { const acc = [0]; for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, acc, L: acc[acc.length - 1] }; };
  QM.along = (r, s) => {
    s = clamp(s, 0, r.L); let i = 1; while (i < r.p.length - 1 && r.acc[i] < s) i++;
    const a = r.p[i - 1], b = r.p[i], u = (s - r.acc[i - 1]) / Math.max(1e-6, r.acc[i] - r.acc[i - 1]);
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])];
  };

  QM.camera = (c, W, H, f) => {
    const yaw = c.yaw || 0, ph = c.pitch, D = f / c.z, cp = Math.cos(ph), sp = Math.sin(ph);
    const fwd = [Math.sin(yaw) * cp, -sp, Math.cos(yaw) * cp], T = [c.x, c.lift || 0, -c.y];
    const cam = S3.camera({ pos: [T[0] - fwd[0] * D, T[1] - fwd[1] * D, T[2] - fwd[2] * D], yaw, pitch: -ph, f, W, H, near: .5, cx: c.cx, cy: c.cy });
    cam.z = c.z; cam.ph = ph; cam.at = (x, y, h) => cam.proj([x, h, -y]);
    return cam;
  };
  QM.FAST = null;
  const rectClip = (P, W, H, m) => {
    let o = P;
    for (const [ax, sg, lim] of [[0, 1, -m], [0, -1, W + m], [1, 1, -m], [1, -1, H + m]]) {
      const inside = p => sg * (p[ax] - lim) >= 0, out = [];
      for (let i = 0; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) { const k = (lim - a[ax]) / (b[ax] - a[ax]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); } }
      o = out; if (o.length < 3) return o;
    }
    return o;
  };
  QM.ring = (x, cam, r, h) => {
    let s = S3.clip(cam, r.map(p => [p[0], h, -p[1]])); if (s.length < 3) return;
    if (QM.FAST) {
      s = rectClip(s, cam.W, cam.H, 64); if (s.length < 3) return;
      x.moveTo(s[0][0], s[0][1]); let lx = s[0][0], ly = s[0][1];
      for (let i = 1; i < s.length; i++) { const q = s[i]; if (Math.abs(q[0] - lx) + Math.abs(q[1] - ly) < 1.2) continue; x.lineTo(q[0], q[1]); lx = q[0]; ly = q[1]; }
      x.closePath(); return;
    }
    x.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) x.lineTo(s[i][0], s[i][1]); x.closePath();
  };
  QM.rings = (x, cam, rings, h) => { for (const r of rings) QM.ring(x, cam, r, h); };
  QM.polyline = (x, cam, p, h) => {
    let pen = false;
    for (const q of p) { const s = cam.at(q[0], q[1], h); if (!s) { pen = false; continue; } if (pen) x.lineTo(s[0], s[1]); else { x.moveTo(s[0], s[1]); pen = true; } }
  };

  QM.band = (x, cam, rings, h0, h1) => {
    const W = cam.W, H = cam.H, m = 64;
    let K = 0;
    for (const r of rings) { for (const p of r) { const o = cam.proj([p[0], h1, -p[1]]), u = cam.proj([p[0] + 1, h1, -p[1]]), v = cam.proj([p[0], h1, -p[1] - 1]); if (o && u && v) { K = Math.sign((u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0])); break; } } if (K) break; }
    if (!K) return;
    x.beginPath();
    for (const r of rings) {
      const n = r.length, A = r.map(p => cam.proj([p[0], h0, -p[1]])), B = r.map(p => cam.proj([p[0], h1, -p[1]]));
      let s = 0; for (let i = 0; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } s *= K;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, a = A[i], b = A[j], c = B[j], d = B[i]; if (!a || !b || !c || !d) continue;
        const q = a[0] * b[1] - b[0] * a[1] + b[0] * c[1] - c[0] * b[1] + c[0] * d[1] - d[0] * c[1] + d[0] * a[1] - a[0] * d[1];
        if (q * s <= 0) continue;
        if (Math.max(a[0], b[0], c[0], d[0]) < -m || Math.min(a[0], b[0], c[0], d[0]) > W + m || Math.max(a[1], b[1], c[1], d[1]) < -m || Math.min(a[1], b[1], c[1], d[1]) > H + m) continue;
        x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.closePath();
      }
    }
    x.fill();
  };

  QM.land = (x, cam, PL, hC, o = {}) => {
    x.fillStyle = F.tone(PL.sheet2, PL.sheet, .16); x.beginPath(); QM.rings(x, cam, CH.LAND, 0); x.fill();
    const N = QM.FAST ? Math.min(o.n || 10, QM.FAST.land || 5) : o.n || 10;
    if (QM.FAST && QM.FAST.walls) {
      for (let i = 0; i < N; i++) { x.fillStyle = F.tone(PL.sheet, PL.ink, .5 - .2 * i / N); QM.band(x, cam, CH.CHINA, hC * i / N, hC * (i + 1) / N); }
      x.fillStyle = o.top || PL.sheet; x.beginPath(); QM.rings(x, cam, CH.CHINA, hC); x.fill();
    } else for (let i = 0; i <= N; i++) {
      x.fillStyle = i < N ? F.tone(PL.sheet, PL.ink, .5 - .2 * i / N) : (o.top || PL.sheet);
      x.beginPath(); QM.rings(x, cam, CH.CHINA, hC * i / N); x.fill();
    }
    x.strokeStyle = F.tone(PL.sheet, PL.ink, .45); x.lineWidth = 1.6; x.beginPath(); QM.rings(x, cam, CH.CHINA, hC); x.stroke();
  };
  const inRing = (p, R) => { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) { const a = R[i], b = R[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  QM.intersect = (S, C0) => {
    const C = C0.map(([px, py], i) => [px + 1e-6 * Math.cos(i * 2.4), py + 1e-6 * Math.sin(i * 2.4)]);
    const list = R => { const N = R.map(p => ({ p, isect: false })); N.forEach((n, i) => { n.next = N[(i + 1) % N.length]; n.prev = N[(i + N.length - 1) % N.length]; }); return N; };
    const SN = list(S), CN = list(C), sIn = SN.map(() => []), cIn = CN.map(() => []), all = [];
    for (let i = 0; i < S.length; i++) {
      const a = S[i], b = S[(i + 1) % S.length];
      for (let j = 0; j < C.length; j++) {
        const c = C[j], d = C[(j + 1) % C.length], den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]); if (den === 0) continue;
        const ua = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den, ub = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
        if (!(ua > 0 && ua < 1 && ub > 0 && ub < 1)) continue;
        const p = [a[0] + ua * (b[0] - a[0]), a[1] + ua * (b[1] - a[1])], ns = { p, isect: true, a: ua }, nc = { p, isect: true, a: ub };
        ns.nb = nc; nc.nb = ns; sIn[i].push(ns); cIn[j].push(nc); all.push(ns);
      }
    }
    if (!all.length) return inRing(S[0], C) ? [S] : inRing(C[0], S) ? [C] : [];
    const splice = (N, ins) => N.forEach((n, i) => { const end = n.next; let prev = n; for (const m of ins[i].sort((u, v) => u.a - v.a)) { m.prev = prev; prev.next = m; prev = m; } prev.next = end; end.prev = prev; });
    splice(SN, sIn); splice(CN, cIn);
    const mark = (N0, other) => { let inside = inRing(N0.p, other); for (let n = N0.next; n !== N0; n = n.next) if (n.isect) { n.entry = !inside; inside = !inside; } };
    mark(SN[0], C); mark(CN[0], S);
    const out = [];
    for (const start of all) {
      if (start.seen) continue;
      const ring = [start.p]; let cur = start, guard = 0;
      do {
        cur.seen = cur.nb.seen = true;
        do { cur = cur.entry ? cur.next : cur.prev; ring.push(cur.p); } while (!cur.isect && ++guard < 1e6);
        cur.seen = cur.nb.seen = true; cur = cur.nb;
      } while (cur !== start && cur.nb !== start && ++guard < 1e6);
      out.push(ring);
    }
    return out;
  };
  let EMPIRE = null;
  QM.empireCut = () => EMPIRE || (EMPIRE = CH.CHINA.flatMap(R => QM.intersect(R, CH.QIN221[0])));
  QM.blocks = (x, cam, base, list) => {
    const L = [];
    for (const b of list) {
      if (!(b.h > .05)) continue;
      const n = QM.FAST ? Math.min(b.n || 8, QM.FAST.blocks || 5) : b.n || 8;
      for (let j = 0; j <= n; j++) L.push({ h: base + b.h * j / n, b, top: j === n, k: j / n });
    }
    L.sort((a, c) => a.h - c.h || a.top - c.top);
    for (const l of L) {
      const b = l.b;
      if (QM.FAST && QM.FAST.empire && !b.clips && b.rings.length === QM.K.length) {
        const cut = QM.empireCut();
        x.fillStyle = l.top ? b.col : F.tone(b.col, '#2a1d10', .45 - .25 * l.k);
        if (!l.top && QM.FAST.walls) QM.band(x, cam, cut, l.h, l.h + b.h / Math.min(b.n || 8, QM.FAST.blocks || 5));
        else { x.beginPath(); QM.rings(x, cam, cut, l.h); x.fill(); }
        if (l.top && b.onTop) { x.save(); x.beginPath(); QM.rings(x, cam, cut, l.h); x.clip(); b.onTop(x, l.h); x.restore(); }
        continue;
      }
      x.save();
      x.beginPath(); QM.rings(x, cam, CH.CHINA, l.h); x.clip();
      x.beginPath(); QM.ring(x, cam, CH.QIN221[0], l.h); x.clip();
      if (b.clips) for (const c of b.clips) { x.beginPath(); QM.rings(x, cam, c, l.h); x.clip(); }
      x.fillStyle = l.top ? b.col : F.tone(b.col, '#2a1d10', .45 - .25 * l.k);
      x.beginPath(); QM.rings(x, cam, b.rings, l.h); x.fill();
      if (l.top && b.onTop) b.onTop(x, l.h);
      x.restore();
    }
  };

  QM.up = (cam, mx, my, h) => {
    const p = cam.at(mx, my, h); if (!p) return null;
    const dx = mx - cam.pos[0], dz = -my - cam.pos[2], dy = cam.pos[1] - h, lev = Math.hypot(dx, dz) / Math.hypot(dx, dy, dz);
    return { x: p[0], y: p[1], d: p[2], k: p[3], lev };
  };
  QM.throne = (x, sx, sy, S, o = {}) => {
    const deep = o.deep ?? 7, side = o.side ?? 4, a = o.alpha ?? 1; if (a <= 0 || S <= 0) return;
    x.save(); x.globalAlpha *= a; x.translate(sx, sy); x.scale(S, S);
    const shape = () => {
      x.beginPath();
      x.moveTo(-27, 0); x.lineTo(27, 0); x.lineTo(27, -7); x.lineTo(23, -7); x.lineTo(23, -19);
      x.lineTo(23, -30); x.quadraticCurveTo(26, -34, 22, -36); x.lineTo(16, -32);
      x.lineTo(16, -50); x.quadraticCurveTo(22, -52, 22, -59); x.quadraticCurveTo(14, -57, 0, -55);
      x.quadraticCurveTo(-14, -57, -22, -59); x.quadraticCurveTo(-22, -52, -16, -50);
      x.lineTo(-16, -32); x.lineTo(-22, -36); x.quadraticCurveTo(-26, -34, -23, -30);
      x.lineTo(-23, -19); x.lineTo(-23, -7); x.lineTo(-27, -7); x.closePath();
    };
    const N = S * deep > 14 ? 7 : 3;
    for (let i = N; i >= 1; i--) { x.save(); x.translate(side * i / N, -deep * i / N); x.fillStyle = F.tone('#9c6d22', '#5a3a10', .4 * (1 - i / N)); shape(); x.fill(); x.restore(); }
    x.fillStyle = '#e8bb5c'; shape(); x.fill();
    if (S > .25) {
      x.fillStyle = '#c9963c'; x.fillRect(-12, -48, 24, 26);
      x.fillStyle = '#f7d88a'; x.fillRect(-23, -20, 46, 3); x.fillRect(-27, -8, 54, 2);
      x.strokeStyle = '#5a3a10'; x.lineWidth = 1.1; shape(); x.stroke();
    }
    x.restore();
  };
  QM.soldier = (x, sx, sy, h, ph, dir = 1, o = {}) => {
    if (h < .8) return;
    const ink = o.ink || '#1b2130', a = o.alpha ?? 1; if (a <= 0) return;
    const sw = Math.sin(ph * TAU), bob = Math.abs(Math.cos(ph * TAU)) * .03 * h;
    const body = (dx, dy, col) => {
      x.fillStyle = col; x.strokeStyle = col;
      x.beginPath();
      x.moveTo(sx + dx - .13 * h, sy + dy - .74 * h - bob); x.lineTo(sx + dx + .13 * h, sy + dy - .74 * h - bob);
      x.lineTo(sx + dx + .17 * h, sy + dy - .36 * h - bob); x.lineTo(sx + dx - .17 * h, sy + dy - .36 * h - bob); x.closePath(); x.fill();
      x.beginPath(); x.arc(sx + dx + .02 * h * dir, sy + dy - .86 * h - bob, .12 * h, 0, TAU); x.fill();
      if (h >= 5) {
        x.lineWidth = Math.max(.7, .09 * h); x.lineCap = 'round';
        x.beginPath();
        x.moveTo(sx + dx, sy + dy - .4 * h - bob); x.lineTo(sx + dx + .2 * h * sw * dir, sy + dy);
        x.moveTo(sx + dx, sy + dy - .4 * h - bob); x.lineTo(sx + dx - .2 * h * sw * dir, sy + dy);
        x.stroke();
        x.lineWidth = Math.max(.5, .045 * h);
        x.beginPath(); x.moveTo(sx + dx + .14 * h * dir, sy + dy - .5 * h - bob); x.lineTo(sx + dx - .26 * h * dir, sy + dy - 1.22 * h - bob); x.stroke();
      } else { x.fillRect(sx + dx - .12 * h, sy + dy - .4 * h, .24 * h, .4 * h); }
    };
    x.save(); x.globalAlpha *= a;
    if (h >= 7) body(-.06 * h, -.05 * h, o.rim || 'rgba(255,241,208,.55)');
    body(0, 0, ink);
    x.restore();
  };
  QM.fire = (x, sx, sy, s, a, t, seed) => {
    if (a <= 0 || s <= 0) return;
    const fl = 1 + .18 * Math.sin(t * 17 + seed * 3.1) + .1 * Math.sin(t * 29 + seed), w = 4.2 * s, h = 13 * s * fl * (.4 + .6 * a);
    for (let i = 0; i < 5; i++) {
      const u = ((t * .42 + i / 5 + seed * .137) % 1), r = (3 + 9 * u) * s, dx = (5 * Math.sin(u * 3 + seed) + 10 * u) * s;
      x.fillStyle = `rgba(58,58,66,${.42 * (1 - u) * a})`; x.beginPath(); x.arc(sx + dx, sy - h - u * 46 * s, r, 0, TAU); x.fill();
    }
    const flame = (k, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(sx - w * k, sy); x.quadraticCurveTo(sx - w * k * 1.1, sy - h * k * .55, sx + .3 * s * Math.sin(t * 9 + seed), sy - h * k); x.quadraticCurveTo(sx + w * k * 1.1, sy - h * k * .55, sx + w * k, sy); x.closePath(); x.fill(); };
    x.save(); x.globalAlpha *= Math.min(1, a * 1.4);
    flame(1, '#c9352b'); flame(.68, '#f2a33a'); flame(.34, '#fff1d0');
    x.restore();
  };
  QM.seal = (x, sx, sy, s) => {
    const w2 = 34 * s, h2 = 30 * s, dp = 10 * s;
    x.fillStyle = '#8fa48a'; x.beginPath(); x.moveTo(sx - w2, sy - h2); x.lineTo(sx - w2 + dp, sy - h2 - dp); x.lineTo(sx + w2 + dp, sy - h2 - dp); x.lineTo(sx + w2, sy - h2); x.closePath(); x.fill();
    x.fillStyle = '#9fb59a'; x.beginPath(); x.moveTo(sx + w2, sy); x.lineTo(sx + w2 + dp, sy - dp); x.lineTo(sx + w2 + dp, sy - h2 - dp); x.lineTo(sx + w2, sy - h2); x.closePath(); x.fill();
    x.fillStyle = '#cfdcc4'; x.fillRect(sx - w2, sy - h2, 2 * w2, h2);
    x.fillStyle = '#b3261c'; x.fillRect(sx - w2, sy - 3 * s, 2 * w2, 3 * s);
    x.fillStyle = '#b9c9b0'; x.beginPath();
    x.moveTo(sx - 22 * s, sy - h2 - dp * .5); x.quadraticCurveTo(sx - 20 * s, sy - h2 - 22 * s, sx - 4 * s, sy - h2 - 20 * s);
    x.quadraticCurveTo(sx + 10 * s, sy - h2 - 19 * s, sx + 16 * s, sy - h2 - 26 * s); x.lineTo(sx + 19 * s, sy - h2 - 31 * s); x.lineTo(sx + 21 * s, sy - h2 - 25 * s);
    x.quadraticCurveTo(sx + 28 * s, sy - h2 - 22 * s, sx + 26 * s, sy - h2 - 12 * s); x.lineTo(sx + 24 * s, sy - h2 - dp * .5); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(60,80,60,.5)'; x.lineWidth = 1; x.strokeRect(sx - w2, sy - h2, 2 * w2, h2);
  };
  QM.tag = (x, sx, sy, text, o = {}) => {
    const a = o.alpha ?? 1; if (a <= 0) return;
    const size = o.size || 30, stem = o.stem ?? 26, padX = size * .42, padY = size * .26;
    x.save(); x.globalAlpha *= a; x.font = `900 ${size}px NSC`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const tw = x.measureText(text).width, asc = size * .74, bw = tw + 2 * padX, bh = asc + 2 * padY, by = sy - stem - bh - (o.lift || 0);
    x.strokeStyle = o.ink || '#1b2130'; x.lineWidth = 2; x.beginPath(); x.moveTo(sx, sy - 2); x.lineTo(sx, by + bh); x.stroke();
    x.fillStyle = 'rgba(12,16,28,.35)'; x.fillRect(sx - bw / 2 + 3, by + 4, bw, bh);
    x.fillStyle = o.card || '#f5ecd8'; x.fillRect(sx - bw / 2, by, bw, bh);
    x.fillStyle = o.accent || '#d9a443'; x.fillRect(sx - bw / 2, by + bh - 4, bw, 4);
    x.fillStyle = o.ink || '#1b2130'; x.fillText(text, sx, by + padY + asc);
    x.restore();
  };
})();
