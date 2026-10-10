(function (root) {
  const F = root.F || (root.F = {});
  const D = Math.PI / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const rot = (v, k, th) => { const c = Math.cos(th), s = Math.sin(th); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = t => t * t * (3 - 2 * t);

  const SKEL = {
    fingers: [
      { mcp: [-0.25, 0.97, 0], len: 0.98, r: 0.112, splay: 4 },
      { mcp: [-0.08, 1.0, 0], len: 1.06, r: 0.115, splay: 0 },
      { mcp: [0.09, 0.96, 0], len: 1.0, r: 0.11, splay: -4 },
      { mcp: [0.24, 0.88, 0], len: 0.8, r: 0.1, splay: -9 },
    ],
    seg: [0.46, 0.30, 0.24],
    taper: [1, 0.97, 0.93, 0.88],
    thumb: { cmc: [-0.2, 0.2, -0.12], seg: [0.44, 0.36, 0.3], r: [0.22, 0.135, 0.128, 0.118] },
    palm: [
      [[-0.17, 0.03, -0.1], 0.19], [[0.17, 0.05, -0.1], 0.18], [[0.24, 0.42, -0.14], 0.16], [[0, 0.5, -0.12], 0.24],
      [[-0.24, 0.84, -0.1], 0.12], [[-0.08, 0.88, -0.1], 0.12], [[0.09, 0.84, -0.1], 0.12], [[0.23, 0.76, -0.1], 0.11],
    ],
  };

  function fingerChain(i, f) {
    const S = SKEL.fingers[i], s = (S.splay + f[0]) * D;
    const d0 = [-Math.sin(s), Math.cos(s), 0];
    const k = norm(cross(d0, [0, 0, -1]));
    const pts = [S.mcp]; let a = 0;
    for (let j = 0; j < 3; j++) {
      a += f[j + 1] * D;
      pts.push(add(pts[j], mul(rot(d0, k, a), S.len * SKEL.seg[j])));
    }
    return pts;
  }
  function thumbChain(t) {
    const T = SKEL.thumb, ab = t[0] * D, pa = t[1] * D;
    const d0 = norm([-Math.sin(ab) * Math.cos(pa), Math.cos(ab) * Math.cos(pa), -Math.sin(pa)]);
    let b = norm(sub([0.05, 1.0, -0.35], T.cmc)); b = norm(sub(b, mul(d0, dot(b, d0))));
    const k = norm(cross(d0, b));
    const pts = [T.cmc, add(T.cmc, mul(d0, T.seg[0]))]; let a = 0;
    for (let j = 0; j < 2; j++) {
      a += t[j + 2] * D;
      pts.push(add(pts[j + 1], mul(rot(d0, k, a), T.seg[j + 1])));
    }
    return pts;
  }
  function skeleton(pose) {
    const fingers = pose.f.map((f, i) => fingerChain(i, f)), thumb = thumbChain(pose.t);
    const w = pose.w || [0, 0];
    const wr = p => rot(rot(p, [1, 0, 0], -w[0] * D), [0, 0, 1], w[1] * D);
    return {
      fingers: fingers.map(c => c.map(wr)), thumb: thumb.map(wr),
      palm: SKEL.palm.map(([p, r]) => [wr(p), r]).concat(SKEL.fingers.map(S => [wr(S.mcp), S.r + 0.03])),
      centre: wr([0, 0.5, -0.1]),
    };
  }

  function viewer(view, x, y, s) {
    const yw = (view.yaw || 0) * D, pt = (view.pitch || 0) * D, rl = (view.roll || 0) * D;
    return p => {
      let [a, b, c] = p;
      [a, c] = [a * Math.cos(yw) + c * Math.sin(yw), -a * Math.sin(yw) + c * Math.cos(yw)];
      [b, c] = [b * Math.cos(pt) - c * Math.sin(pt), b * Math.sin(pt) + c * Math.cos(pt)];
      [a, b] = [a * Math.cos(rl) - b * Math.sin(rl), a * Math.sin(rl) + b * Math.cos(rl)];
      return [x + a * s, y - b * s, c];
    };
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const PAL = { skin: { base: hex('#a85a38'), tip: hex('#f2cba6') }, magenta: { base: [212, 0, 122], tip: [250, 196, 222] } };
  const css = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
  function tone(pal, t, shade) {
    const u = Math.pow(smooth(clamp((t - 0.1) / 0.9)), 0.85);
    return pal.base.map((v, i) => lerp(v, pal.tip[i], u) * shade);
  }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function circle(ctx, p, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  function bone(ctx, p0, r0, c0, p1, r1, c1, cap) {
    circle(ctx, p0, r0, css(c0));
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy);
    if (d > 0.5) {
      const nx = -dy / d, ny = dx / d, g = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      g.addColorStop(0, css(c0)); g.addColorStop(1, css(c1));
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(p0[0] + nx * r0, p0[1] + ny * r0); ctx.lineTo(p1[0] + nx * r1, p1[1] + ny * r1);
      ctx.lineTo(p1[0] - nx * r1, p1[1] - ny * r1); ctx.lineTo(p0[0] - nx * r0, p0[1] - ny * r0); ctx.fill();
    }
    if (cap) circle(ctx, p1, r1, css(c1));
  }

  function run(ctx, pts, radii, cols, tip) {
    for (let j = 0; j < pts.length; j++) if (j < pts.length - 1 || tip) circle(ctx, pts[j], radii[j], css(cols[j]));
    for (let j = 0; j < pts.length - 1; j++) {
      const p0 = pts[j], p1 = pts[j + 1], r0 = radii[j], r1 = radii[j + 1];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy);
      if (d < 0.5) continue;
      const nx = -dy / d, ny = dx / d, g = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      g.addColorStop(0, css(cols[j])); g.addColorStop(1, css(cols[j + 1]));
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(p0[0] + nx * r0, p0[1] + ny * r0); ctx.lineTo(p1[0] + nx * r1, p1[1] + ny * r1);
      ctx.lineTo(p1[0] - nx * r1, p1[1] - ny * r1); ctx.lineTo(p0[0] - nx * r0, p0[1] - ny * r0); ctx.fill();
    }
  }
  function chainItems(items, q, radii, cols, zc) {
    let start = 0;
    const side = j => ((q[j][2] + q[j + 1][2]) / 2) >= zc;
    for (let j = 1; j <= q.length - 1; j++) {
      if (j === q.length - 1 || side(j) !== side(start)) {
        const a = start, b = j, zs = q.slice(a, b + 1).reduce((m, p) => m + p[2], 0) / (b - a + 1);
        items.push({ z: zs, paint: ctx => run(ctx, q.slice(a, b + 1), radii.slice(a, b + 1), cols.slice(a, b + 1), b === q.length - 1) });
        start = j;
      }
    }
  }

  function draw(ctx, o) {
    const pal = typeof o.pal === 'string' ? PAL[o.pal] : (o.pal || PAL.skin);
    const DBG = [[230, 40, 40], [40, 190, 40], [40, 60, 240], [230, 190, 0], [0, 210, 210]];
    const tint = (c, i) => o.debug ? DBG[i].map((v, j) => v * 0.5 + c[j] * 0.5) : c;
    const sk = skeleton(o.pose), P = viewer(o.view || {}, o.x, o.y, o.s), s = o.s;
    const zc = P(sk.centre)[2];
    const shade = z => 1 - 0.16 * clamp((zc - z) / 0.7);
    const items = [];
    const fa0 = P([0, 0.05, -0.1]), fa1 = P([0, -3, -0.1]);
    const tp = sk.thumb.map(P);
    items.push({ z: o.layered ? -1e9 : zc, paint: () => {
      const pts = [];
      const pg = o.palm || 1, np = SKEL.palm.length;
      sk.palm.forEach(([p, r0], j) => { const q = P(p), r = j < np ? r0 * pg : r0; for (let a = 0; a < 32; a++) pts.push([q[0] + Math.cos(a / 32 * 6.2832) * r * s, q[1] + Math.sin(a / 32 * 6.2832) * r * s]); });
      const h = hull(pts); ctx.fillStyle = css(pal.base);
      ctx.beginPath(); h.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.fill();
      const ik = P(SKEL.fingers[0].mcp.map((v, i) => v)), A = tp[1], C = P(sk.centre);
      const ikw = P(skeleton(o.pose).fingers[0][0]);
      const ctl = [lerp((A[0] + ikw[0]) / 2, C[0], 0.3), lerp((A[1] + ikw[1]) / 2, C[1], 0.3)];
      ctx.beginPath(); ctx.moveTo(tp[0][0], tp[0][1]); ctx.lineTo(A[0], A[1]); ctx.quadraticCurveTo(ctl[0], ctl[1], ikw[0], ikw[1]);
      ctx.lineTo(C[0], C[1]); ctx.fill();
    } });
    const T = SKEL.thumb;
    items.push({ z: o.layered ? -1e9 + 1 : (tp[0][2] + tp[1][2]) / 2, paint: () => bone(ctx, tp[0], T.r[0] * (o.palm || 1) * s, pal.base, tp[1], T.r[1] * s, pal.base, true) });
    const L = o.light ? (() => { const l = Math.hypot(o.light[0], o.light[1]); return [o.light[0] / l, o.light[1] / l]; })() : null;
    const lit = (q, tt, len) => L ? q.map((p, j) => clamp(0.35 * tt[j] + 0.65 * clamp(((p[0] - q[0][0]) * L[0] + (p[1] - q[0][1]) * L[1]) / (len * s * 0.75)))) : tt;
    const tl = lit(tp.slice(1), [0, T.seg[1] / (T.seg[1] + T.seg[2]), 1], T.seg[1] + T.seg[2]);
    const zs = o.layered ? -1e9 : zc;
    chainItems(items, tp.slice(1), [1, 2, 3].map(j => T.r[j] * s), tp.slice(1).map((p, j) => tint(tone(pal, tl[j], shade(p[2])), 4)), zs);
    sk.fingers.forEach((ch, i) => {
      const S = SKEL.fingers[i], q = ch.map(P), tt = lit(q, [0, SKEL.seg[0], SKEL.seg[0] + SKEL.seg[1], 1], S.len);
      q.forEach(p => { p[2] += 0.002 * (3 - i); });
      chainItems(items, q, SKEL.taper.map(k => S.r * k * s), q.map((p, j) => tint(tone(pal, tt[j], shade(p[2])), i)), zs);
    });
    if (o.forearm !== false) { ctx.strokeStyle = css(pal.base); ctx.lineCap = 'round'; ctx.lineWidth = 0.52 * (o.palm || 1) * s; ctx.beginPath(); ctx.moveTo(fa0[0], fa0[1]); ctx.lineTo(fa1[0], fa1[1]); ctx.stroke(); }
    items.sort((a, b) => a.z - b.z).forEach(it => it.paint(ctx));
    return { tips: sk.fingers.map(c => P(c[3])), thumbTip: tp[3] };
  }

  const fist4 = [[0, 85, 100, 62], [0, 88, 100, 62], [0, 90, 100, 60], [0, 92, 100, 58]];
  const T0 = [-5, 0, 60, 75];
  const POSES = {
    spread:    { f: [[16, -5, 0, 0], [4, -5, 0, 0], [-8, -5, 0, 0], [-20, -5, 0, 0]], t: [70, 10, 0, -5] },
    flat:      { f: [[1, 0, 2, 0], [0, 0, 2, 0], [-1, 0, 2, 0], [-3, 2, 3, 0]], t: [22, 8, 5, 0] },
    open:      { f: [[10, 6, 8, 4], [2, 5, 8, 4], [-5, 8, 10, 5], [-12, 10, 12, 6]], t: [62, 18, 8, 5] },
    relaxed:   { f: [[3, 14, 26, 10], [0, 20, 34, 12], [-3, 26, 40, 14], [-6, 32, 46, 18]], t: [34, 32, 12, 12] },
    cup:       { f: [[1, 28, 22, 8], [0, 28, 24, 8], [-1, 30, 26, 10], [-3, 32, 28, 12]], t: [14, 26, 12, 6] },
    curled:    { f: [[0, 40, 60, 30], [0, 45, 65, 32], [0, 50, 70, 35], [0, 55, 72, 38]], t: [30, 38, 18, 16] },
    looseFist: { f: [[0, 62, 84, 44], [0, 66, 88, 46], [0, 70, 88, 46], [0, 74, 88, 46]], t: [24, 44, 28, 22] },
    fist:      { f: fist4, t: T0, on: 'fist' },
    claw:      { f: [[12, -8, 72, 58], [3, -8, 76, 60], [-6, -8, 76, 60], [-14, -6, 76, 60]], t: [55, 32, 22, 34] },
    hook:      { f: [[0, 4, 96, 62], [0, 4, 96, 62], [0, 4, 96, 62], [0, 6, 96, 62]], t: [30, 22, 10, 10] },
    point:     { f: [[2, 4, 8, 4], fist4[1], fist4[2], fist4[3]], t: T0, on: 'fist' },
    pointHook: { f: [[2, 6, 70, 40], fist4[1], fist4[2], fist4[3]], t: T0, on: 'fist' },
    press:     { f: [[2, 22, 10, 16], fist4[1], fist4[2], fist4[3]], t: T0, on: 'fist' },
    thumbsUp:  { f: fist4, t: [8, -12, -5, -12] },
    peace:     { f: [[12, 2, 4, 2], [-8, 2, 4, 2], fist4[2], fist4[3]], t: T0, on: 'fist' },
    ok:        { f: [[0, 45, 45, 40], [-2, 8, 10, 5], [-8, 10, 12, 6], [-16, 12, 14, 8]], t: [30, 50, 15, 20], on: 'index' },
    pinch:     { f: [[0, 45, 45, 40], [0, 50, 90, 55], [-2, 46, 48, 40], [-4, 50, 50, 40]], t: [10, 70, 20, 20], on: 'index' },
    tripod:    { f: [[2, 40, 52, 26], [-4, 40, 52, 26], [0, 60, 80, 40], [0, 64, 82, 40]], t: [30, 52, 15, 20], on: 'tripod' },
    keyGrip:   { f: [[0, 55, 88, 40], [0, 70, 90, 45], [0, 75, 90, 45], [0, 78, 90, 45]], t: [4, 8, 12, 14], on: 'side' },
    sphere:    { f: [[14, 32, 36, 16], [4, 34, 40, 16], [-6, 36, 40, 18], [-14, 40, 42, 20]], t: [58, 50, 16, 14] },
    cylinder:  { f: [[0, 45, 58, 30], [0, 48, 58, 30], [0, 50, 58, 30], [0, 54, 58, 30]], t: [30, 58, 22, 20] },
    rod:       { f: [[0, 66, 92, 46], [0, 70, 92, 46], [0, 72, 92, 46], [0, 75, 92, 46]], t: T0, on: 'fist' },
    fingertips:{ f: [[14, 40, 30, 12], [4, 44, 34, 12], [-6, 46, 34, 12], [-14, 48, 36, 14]], t: [60, 58, 14, 10] },
    knife:     { f: [[2, 18, 12, 6], [0, 55, 70, 36], [0, 60, 72, 36], [0, 64, 74, 36]], t: T0, on: 'fist' },
    stop:      { f: [[1, -4, 0, 0], [0, -4, 0, 0], [-1, -4, 0, 0], [-3, -2, 0, 0]], t: [18, 5, 0, 0], w: [-20, 0] },
  };

  const SIDE = { yaw: 85, pitch: 12, roll: 12 }, BACK = { yaw: 15, pitch: -10, roll: 5 }, QUARTER = { yaw: 42, pitch: -10, roll: 8 };
  const VIEWS = { relaxed: QUARTER, cup: QUARTER, sphere: QUARTER, fingertips: QUARTER, claw: QUARTER, hook: SIDE,
    curled: SIDE, looseFist: SIDE, fist: SIDE, rod: SIDE, cylinder: SIDE, knife: SIDE, point: SIDE, pointHook: SIDE, press: SIDE,
    thumbsUp: SIDE, ok: SIDE, pinch: SIDE, tripod: SIDE, keyGrip: SIDE };
  const bestView = name => VIEWS[name] || BACK;

  function solve(pose) {
    if (!pose.on) return pose;
    const out = JSON.parse(JSON.stringify(pose)); delete out.on;
    const ch = pose.f.map((f, i) => fingerChain(i, f)), R = SKEL.thumb.r[3];
    const mid = (a, b) => mul(add(a, b), 0.5);
    let target, gap;
    if (pose.on === 'index') { target = ch[0][3]; gap = R + SKEL.fingers[0].r * SKEL.taper[3]; }
    else if (pose.on === 'tripod') { target = mid(ch[0][3], ch[1][3]); gap = R + 0.06; }
    else if (pose.on === 'fist') {
      const top = Math.max(...pose.f.map(f => f[2])), i = pose.f.findIndex(f => f[2] >= 0.9 * top), a = ch[i][2], b = ch[i][3]; target = add(add(a, mul(sub(b, a), 0.55)), [0.1, 0, -(R + SKEL.fingers[0].r) * 0.9]); gap = 0; }
    else if (pose.on === 'side') { target = add(mid(ch[0][2], ch[0][3]), [-(R + SKEL.fingers[0].r) * 0.9, 0, -0.04]); gap = 0; }
    let best = null;
    for (let ab = -10; ab <= 90; ab += 5) for (let pa = -10; pa <= 95; pa += 5)
      for (let m = -10; m <= 60; m += 5) for (let ip = -10; ip <= 80; ip += 6) {
        const t = [ab, pa, m, ip], tip = thumbChain(t)[3];
        const d = Math.abs(Math.hypot(...sub(tip, target)) - gap);
        const c = d + (pose.on === 'fist' ? 0.002 : 0.0003) * (Math.abs(ab - pose.t[0]) + Math.abs(pa - pose.t[1]) + Math.abs(m - pose.t[2]) + Math.abs(ip - pose.t[3]));
        if (!best || c < best.c) best = { c, t };
      }
    out.t = best.t; out.err = best.c; return out;
  }
  const cache = {};
  const get = name => cache[name] || (cache[name] = solve(POSES[name]));

  function backInOut(x, c1 = 0.45) {
    const c2 = c1 * 1.525;
    return x < 0.5 ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  }
  function blend(A, B, k, opts = {}) {
    const delay = opts.delay || { t: 0, i: 0.04, m: 0.1, r: 0.15, l: 0.2 };
    const span = opts.span || 0.7, jd = 0.12;
    const joint = (a, b, kf, order) => {
      const u = clamp((kf - order * jd) / (1 - 2 * jd));
      return lerp(a, b, backInOut(u, opts.snap == null ? 0.45 : opts.snap));
    };
    const fin = (fa, fb, d) => {
      const kf = clamp((k - d) / span);
      const closing = (fb[2] + fb[1]) >= (fa[2] + fa[1]);
      const ord = closing ? [0, 2, 0, 1] : [0, 0, 1, 2];
      return fa.map((v, j) => joint(v, fb[j], kf, ord[j]));
    };
    const tk = clamp((k - delay.t) / span);
    return {
      f: A.f.map((f, i) => fin(f, B.f[i], delay['imrl'[i]])),
      t: A.t.map((v, j) => joint(v, B.t[j], tk, j < 2 ? 0 : 1)),
      w: [0, 1].map(j => joint((A.w || [0, 0])[j], (B.w || [0, 0])[j], clamp(k / span), 0)),
    };
  }
  const blendView = (A, B, k, lag = 0.2) => {
    const u = smooth(clamp((k - lag) / (1 - lag)));
    return { yaw: lerp(A.yaw || 0, B.yaw || 0, u), pitch: lerp(A.pitch || 0, B.pitch || 0, u), roll: lerp(A.roll || 0, B.roll || 0, u) };
  };

  function tipAt(pose, view, finger = 0) {
    const sk = skeleton(pose), P = viewer(view || {}, 0, 0, 1);
    return P(finger === 'thumb' ? sk.thumb[3] : sk.fingers[finger][3]);
  }
  function action(name, n) {
    const A = (F.hand3d.ACTIONS || {})[name]; if (!A) return null;
    const fr = A.frames, i = clamp(n - fr[0].n, 0, fr.length - 1), a = Math.floor(i), b = Math.min(fr.length - 1, a + 1), u = i - a;
    const mix = (p, q) => typeof p === 'number' ? lerp(p, q, u) : Array.isArray(p) ? p.map((v, k) => mix(v, q[k])) : p && typeof p === 'object' ? Object.fromEntries(Object.keys(p).map(k => [k, mix(p[k], q[k])])) : p;
    return Object.assign(mix(fr[a], fr[b]), A.draw);
  }
  F.hand3d = { action, tipAt, draw, POSES, get, solve, blend, blendView, bestView, PAL, SKEL, skeleton };
})(typeof window !== 'undefined' ? window : globalThis);
