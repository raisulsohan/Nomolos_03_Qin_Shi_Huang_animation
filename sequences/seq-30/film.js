(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-30'), DUR = C.duration, GT0 = C.T.start;
  const PA = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const frac = v => v - Math.floor(v);
  const mix = S3.mix;

  const T_FEAR = 2.16, T_IMAG = 2.77;
  const T_HIS = 3.98, T_SECRET = 5.22, T_TWO = 6.09, T_DECIDED = 6.53, T_KEEP = 7.19;
  const T_ZHAO = 8.02, T_EUNUCH = 9.25, T_IMPS = 10.3, T_SEAL = 10.83, T_LI = 11.88, T_CHANC = 12.71;
  const T_SUMMER = 13.82, T_HEAT = 14.2, T_WORK = 14.83, T_BODY = 15.4, T_CRAWL = 16.35, T_HOME = 16.79;
  const T_LOADED = 17.79, T_CARTS = 18.35, T_AROUND = 18.66, T_CARRIAGE = 19.72, T_SALTED = 20.47, T_DROWN = 21.22, T_SMELL = 21.91;
  const T_MOST = 22.99, T_EARTH = 24.1, T_RETURN = 24.43, T_CAPITAL = 25.28, T_CARGO = 26.59, T_BEHIND = 26.92, T_WAGON = 27.64;

  const V = 1.15;
  const A_FRONT = -11.6;
  const T_IN = T_CARGO + .12;
  const XC0 = -A_FRONT + V * T_IN;
  const xc = t => XC0 - V * t;
  const WT = 6, WALLH = 9.2, GATE = { z0: -2.9, z1: 2.9, h: 5.4 }, ZN = 260, ZF = 46;

  const frameOf = (X, Z, d) => ({ X, Z, d, P: (f, l, u) => [X + f * d[0] + l * d[1], u, Z + f * d[1] - l * d[0]], N: (nf, nl, nu) => [nf * d[0] + nl * d[1], nu, nf * d[1] - nl * d[0]] });
  const WEST = [-1, 0];

  const LINE = [
    { kind: 'lead', slot: -17.5, horses: 4, seed: 1 },
    { kind: 'imperial', slot: 0, horses: 4, seed: 2 },
    { kind: 'rear', slot: 14.1, horses: 2, seed: 3 },
  ];
  const T_L0 = T_LOADED;
  const CARTS = [
    { id: 'A', slot: -7.95, z: 0, ex: [T_L0, T_L0 + 1.9], ez: [T_L0 + .35, T_L0 + 2.5], seed: 11 },
    { id: 'B', slot: -1.0, z: 3.75, ex: [T_AROUND + .75, T_AROUND + 2.6], ez: [T_AROUND + .95, T_AROUND + 2.9], seed: 12, drop: true },
  ];
  const T_DROP = T_MOST;
  const dropD = t => { const u = t - T_DROP, dv = V - .45, T1 = 1.6; return u <= 0 ? 0 : u < T1 ? dv * u * u / (2 * T1) : dv * (T1 / 2 + u - T1); };
  const PARKZ = 5.25;
  const cartAt = (c, t) => {
    const px = xc(c.ex[0]) + c.slot, sx = xc(t) + c.slot, ex = easeIO(clamp((t - c.ex[0]) / (c.ex[1] - c.ex[0]))), ez = easeIO(clamp((t - c.ez[0]) / (c.ez[1] - c.ez[0])));
    const X = (t <= c.ex[0] ? px : px + (sx - px) * ex) + (c.drop ? dropD(t) : 0), Z = lerp(PARKZ, c.z, ez);
    return { X, Z };
  };
  const cartPose = (c, t) => {
    const a = cartAt(c, t), b = cartAt(c, t + .05), dx = b.X - a.X, dz = b.Z - a.Z, L = Math.hypot(dx, dz);
    const d = L < 1e-5 ? WEST : [dx / L, dz / L];
    const s = t <= c.ex[0] ? 0 : Math.abs(a.X - (xc(c.ex[0]) + c.slot)) + Math.abs(a.Z - PARKZ) * .3;
    return { ...a, d, s, go: clamp(L / .05 / V) };
  };

  const FIG = S3.FIG, INK = '#1a1820', RIMC = '#fff3d6';
  const LK = { min: Q.silhouette('minister', INK), minR: Q.silhouette('minister', RIMC, RIMC), sol: Q.silhouette('worker', INK), solR: Q.silhouette('worker', RIMC, RIMC) };
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  function walker(slot, z, step, t0, opts = {}) {
    const span = 44, D0 = V * span / FIG;
    const mk = D => Mo.gait({ from: 0, to: D, t0, gait: 'walk', style: { step, arms: opts.arms ?? .28, lean: opts.lean ?? .03 }, until: t0 + span });
    let G = mk(D0); const v0 = FIG * (G.x(DUR) - G.x(0)) / DUR; G = mk(D0 * V / v0);
    const X0 = XC0 + slot + FIG * G.x(0);
    return { G, X: t => X0 - FIG * G.x(t), z, slot, ...opts };
  }
  const ZHAO = walker(-.35, -2.4, 37, -6.3, { beard: false, seal: true, h: 1 });
  const LISI = walker(1.15, -2.95, 39, -6.0, { beard: true, h: 1.03 });
  const SOLDIERS = [[-29.2, -1.05, 41, -6.4], [-29.5, 1.05, 40, -6.1], [-26.6, -1.05, 42, -6.25], [-26.9, 1.05, 40, -6.55],
    [18.2, -1.05, 40, -6.2], [18.0, 1.05, 41, -6.45], [20.8, -1.05, 39, -6.35], [20.6, 1.05, 42, -6.05]].map(([s, z, st, t0], i) => walker(s, z, st, t0, { soldier: true, h: .96 + .05 * hash(i, 3), seed: i }));
  const glance = t => bump(t, T_DECIDED - .1, T_DECIDED + .35, T_KEEP + .05, T_KEEP + .55);
  const sleeve = (t, k) => bump(t, T_BODY - .1 + .25 * k, T_BODY + .45 + .25 * k, T_DROWN + .3 + .2 * k, T_DROWN + .95 + .2 * k);

  const ell = (f, uc, hh, hw, n = 10) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [f, hw * Math.cos(a), uc + hh * Math.sin(a)]; });
  const HORSE = {
    front: [...ell(.68, 1.02, .24, .18), ...ell(.42, 1.04, .30, .25), ...ell(.08, 1.03, .31, .27), [.46, 0, 1.38]],
    rear: [...ell(.1, 1.03, .31, .27), ...ell(-.28, 1.05, .30, .27), ...ell(-.56, 1.08, .27, .24), ...ell(-.78, 1.07, .18, .17), [-.48, 0, 1.38]],
    neck: [...ell(.46, 1.12, .26, .17), ...ell(.76, 1.42, .16, .12), ...ell(.96, 1.62, .1, .085), [.62, 0, 1.52], [.86, 0, 1.72]],
    head: [...ell(.96, 1.63, .1, .09, 8), ...ell(1.06, 1.54, .12, .1, 8), ...ell(1.3, 1.25, .075, .07, 8)],
    pivot: [.5, 1.12], stride: 1.5, duty: .62, lift: [.15, .11],
    legs: [
      { f: .5, u: .86, a: .36, b: .34, bend: 1, n: .55, l: .13, ph: .25, fore: true }, { f: .5, u: .86, a: .36, b: .34, bend: 1, n: .55, l: -.13, ph: .75, fore: true },
      { f: -.44, u: .92, a: .42, b: .36, bend: -1, n: -.58, l: .14, ph: 0 }, { f: -.44, u: .92, a: .42, b: .36, bend: -1, n: -.58, l: -.14, ph: .5 }],
    width: [.16, .1, .075], hoof: .1, tail: 'knot', col: '#1c1a21',
  };
  const OX = {
    front: [...ell(.74, .96, .3, .26), ...ell(.42, 1.0, .38, .33), ...ell(.04, .97, .38, .35), [.5, 0, 1.47], [.3, 0, 1.42]],
    rear: [...ell(.04, .97, .38, .35), ...ell(-.42, 1.0, .36, .34), ...ell(-.74, 1.0, .29, .27), [-.55, 0, 1.36]],
    neck: [...ell(.72, 1.0, .3, .22), ...ell(.98, .95, .22, .17), [.86, 0, .62]],
    head: [...ell(1.0, .96, .17, .15, 8), ...ell(1.12, .9, .17, .14, 8), ...ell(1.32, .74, .12, .11, 8)],
    pivot: [.75, 1.0], stride: 1.2, duty: .64, lift: [.12, .1],
    legs: [
      { f: .55, u: .7, a: .3, b: .28, bend: 1, n: .58, l: .17, ph: .25, fore: true }, { f: .55, u: .7, a: .3, b: .28, bend: 1, n: .58, l: -.17, ph: .75, fore: true },
      { f: -.52, u: .78, a: .34, b: .3, bend: -1, n: -.58, l: .18, ph: 0 }, { f: -.52, u: .78, a: .34, b: .3, bend: -1, n: -.58, l: -.18, ph: .5 }],
    width: [.19, .13, .1], hoof: .12, tail: 'switch', horns: true, col: '#2a231f',
  };
  function hull2(q) {
    const p = q.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const v of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
    for (let i = p.length - 1; i >= 0; i--) { const v = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function fillHull(x, cam, pts, col) {
    const q = []; for (const p of pts) { const s = cam.proj(p); if (!s) return false; q.push(s); }
    const h = hull2(q); if (h.length < 3) return false;
    x.fillStyle = col; x.beginPath(); h.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.fill(); return true;
  }
  function seg(x, cam, a, b, wd, col) {
    let A = a, B = b; const da = cam.depth(A), db = cam.depth(B), DM = .3;
    if (da < DM && db < DM) return;
    if (da < DM || db < DM) { const k = (DM - da) / (db - da), m = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]; if (da < DM) A = m; else B = m; }
    const p = cam.proj(A), q = cam.proj(B); if (!p || !q) return;
    x.strokeStyle = col; x.lineWidth = Math.max(.7, Math.min(90, wd * (p[3] + q[3]) / 2)); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke();
  }
  function ik2(T, Ft, a, b, bend) {
    const dx = Ft[0] - T[0], dy = Ft[1] - T[1], L = Math.min(Math.hypot(dx, dy), a + b - 1e-4), base = Math.atan2(dy, dx), A = Math.acos(clamp((a * a + L * L - b * b) / (2 * a * L), -1, 1));
    const j1 = [T[0] + a * Math.cos(base + A), T[1] + a * Math.sin(base + A)], j2 = [T[0] + a * Math.cos(base - A), T[1] + a * Math.sin(base - A)];
    return (bend > 0 ? j1[0] > j2[0] : j1[0] < j2[0]) ? j1 : j2;
  }
  function beast(x, cam, Bd, fr, s, go, o = {}) {
    const P = (f, l, u) => fr.P(f, l, u);
    const camL = (cam.pos[0] - fr.X) * fr.d[1] - (cam.pos[2] - fr.Z) * fr.d[0];
    const ph0 = (o.seed || 0) * .137, cyc = s / Bd.stride + ph0, bob = .018 * go * Math.sin(cyc * TAU * 2);
    const nod = -(o.headDown || 0) + .045 * go * Math.sin(cyc * TAU * 2 + 1.2);
    const rotN = p => { const dx = p[0] - Bd.pivot[0], du = p[2] - Bd.pivot[1], c = Math.cos(nod), sn = Math.sin(nod); return [Bd.pivot[0] + dx * c - du * sn, p[1], Bd.pivot[1] + dx * sn + du * c]; };
    const body = pts => pts.map(([f, l, u]) => P(f, l, u + bob));
    const col = o.col || Bd.col, legCol = mix(col, '#000000', .1);
    const leg = L => {
      const p = frac(cyc + L.ph), D = Bd.duty, half = Bd.stride * D / 2;
      let ff, fu;
      if (p < D) { ff = L.n + half - (p / D) * 2 * half; fu = 0; }
      else { const q = (p - D) / (1 - D); ff = L.n - half + 2 * half * smooth(q); fu = (L.fore ? Bd.lift[0] : Bd.lift[1]) * Math.sin(PI * q); }
      ff = lerp(L.n, ff, go); fu *= go;
      const T = [L.f, L.u + bob], Fl = [ff, fu + .1], J = ik2(T, Fl, L.a, L.b, L.bend);
      x.lineCap = 'round'; x.lineJoin = 'round';
      seg(x, cam, P(T[0], L.l, T[1]), P(J[0], L.l, J[1]), Bd.width[0], legCol);
      seg(x, cam, P(J[0], L.l, J[1]), P(Fl[0], L.l, Fl[1]), Bd.width[1], legCol);
      seg(x, cam, P(Fl[0], L.l, Fl[1]), P(Fl[0] + .03, L.l, fu + .02), Bd.width[2], legCol);
      seg(x, cam, P(Fl[0] - .02, L.l, fu + .015), P(Fl[0] + .07, L.l, fu + .015), Bd.hoof, legCol);
    };
    const far = Bd.legs.filter(L => L.l * camL < 0), near = Bd.legs.filter(L => L.l * camL >= 0);
    far.forEach(leg);
    x.lineCap = 'round';
    if (Bd.tail === 'knot') { seg(x, cam, P(-.76, 0, 1.17 + bob), P(-.86, 0, 1.0 + bob), .09, col); const k = cam.proj(P(-.85, 0, 1.03 + bob)); if (k) { x.fillStyle = col; x.beginPath(); x.arc(k[0], k[1], Math.max(1, .075 * k[3]), 0, TAU); x.fill(); } seg(x, cam, P(-.86, 0, 1.0 + bob), P(-.9, 0, .86 + bob), .05, col); }
    else { const sw = .05 * Math.sin(cyc * TAU + 1); seg(x, cam, P(-.74, 0, 1.2 + bob), P(-.8 + sw, 0, .7 + bob), .035, col); seg(x, cam, P(-.8 + sw, 0, .74 + bob), P(-.8 + sw * 1.3, 0, .52 + bob), .08, col); }
    fillHull(x, cam, body(Bd.rear), col);
    fillHull(x, cam, body(Bd.front), col);
    fillHull(x, cam, body(Bd.neck.map(rotN)), col);
    fillHull(x, cam, body(Bd.head.map(rotN)), col);
    if (Bd.horns) {
      for (const sg of [1, -1]) { const a = rotN([1.02, .12 * sg, 1.08]), b = rotN([.98, .3 * sg, 1.2]), c = rotN([1.05, .4 * sg, 1.34]); seg(x, cam, P(a[0], a[1], a[2] + bob), P(b[0], b[1], b[2] + bob), .07, '#cfc4a8'); seg(x, cam, P(b[0], b[1], b[2] + bob), P(c[0], c[1], c[2] + bob), .045, '#e0d6bc'); }
    } else {
      for (const sg of [1, -1]) { const a = rotN([.93, .05 * sg, 1.68]), b = rotN([.92, .06 * sg, 1.84]), c = rotN([.99, .05 * sg, 1.7]); const q = [a, b, c].map(v => cam.proj(P(v[0], v[1], v[2] + bob))); if (q.every(Boolean)) { x.fillStyle = col; x.beginPath(); x.moveTo(q[0][0], q[0][1]); x.lineTo(q[1][0], q[1][1]); x.lineTo(q[2][0], q[2][1]); x.closePath(); x.fill(); } }
      const m = rotN([.95, 0, 1.73]), m2 = rotN([.9, 0, 1.68]); seg(x, cam, P(m2[0], 0, m2[2] + bob), P(m[0], 0, m[2] + bob), .05, col);
    }
    near.forEach(leg);
  }

  function wheel(x, cam, fr, l, r, n, rot, col, hub) {
    const rim = Array.from({ length: 28 }, (_, i) => { const q = i / 28 * TAU; return fr.P(r * Math.cos(q), l, r + r * Math.sin(q)); });
    const q = rim.map(p => cam.proj(p)); if (q.some(v => !v)) return;
    const k = cam.proj(fr.P(0, l, r))[3];
    x.strokeStyle = col; x.lineWidth = Math.max(1, .075 * k); x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1])); x.closePath(); x.stroke();
    x.lineWidth = Math.max(.6, .02 * k); x.beginPath();
    for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, p = cam.proj(fr.P(.09 * Math.cos(a), l, r + .09 * Math.sin(a))), e = cam.proj(fr.P(r * .96 * Math.cos(a), l, r + r * .96 * Math.sin(a))); if (p && e) { x.moveTo(p[0], p[1]); x.lineTo(e[0], e[1]); } }
    x.stroke();
    const hc = cam.proj(fr.P(0, l, r)); if (hc) { x.fillStyle = hub || col; x.beginPath(); x.arc(hc[0], hc[1], Math.max(1, .1 * k), 0, TAU); x.fill(); }
  }
  function lbox(x, cam, fr, f0, f1, l0, l1, u0, u1, col, o = {}) {
    const P = fr.P, faces = [
      [[[f0, l0, u1], [f1, l0, u1], [f1, l1, u1], [f0, l1, u1]], [0, 0, 1], o.top],
      [[[f1, l0, u0], [f1, l1, u0], [f1, l1, u1], [f1, l0, u1]], [1, 0, 0], o.front],
      [[[f0, l0, u0], [f0, l1, u0], [f0, l1, u1], [f0, l0, u1]], [-1, 0, 0], o.back],
      [[[f0, l1, u0], [f1, l1, u0], [f1, l1, u1], [f0, l1, u1]], [0, 1, 0], o.left],
      [[[f0, l0, u0], [f1, l0, u0], [f1, l0, u1], [f0, l0, u1]], [0, -1, 0], o.right],
    ];
    for (const [pts, n, c] of faces) { const N = fr.N(...n), W3 = pts.map(p => P(...p)); if (!S3.facing(cam, W3[0], N)) continue; if (S3.poly(x, cam, W3)) { x.fillStyle = c || S3.shade(col, N, SUNV, { lo: .55 }); x.fill(); } }
  }
  const SUNV = (() => { const v = [-.86, .33, .36], L = Math.hypot(...v); return v.map(c => c / L); })();
  const LAC = '#221f27', LAC2 = '#2d2932', GILT = '#b08a45';
  function carriageParts(parts, cam, v, X, t) {
    const fr = frameOf(X, 0, WEST), P = fr.P, run = V * t, rotW = -run / .62;
    const camL = (cam.pos[0] - X) * WEST[1] - (cam.pos[2] - 0) * WEST[0];
    const nearSide = camL >= 0 ? 1 : -1;
    const add = (f, l, u, draw, fa = f - .7, fb = f + .7) => { const d = cam.depth(P(f, l, u)); if (d > .2) parts.push({ d, draw, x0: X - fb, x1: X - fa, z: l }); };
    const wheelL = .98;
    add(0, -nearSide * wheelL, .62, x => wheel(x, cam, fr, -nearSide * wheelL, .62, 26, rotW, '#1a1720', GILT));
    add(0, nearSide * wheelL, .62, x => wheel(x, cam, fr, nearSide * wheelL, .62, 26, rotW, '#1a1720', GILT));
    const lanes = v.horses === 4 ? [-.93, -.31, .31, .93] : [-.31, .31];
    lanes.forEach((l, i) => {
      const hf = frameOf(X + -3.55, 0 + l, WEST);
      const ext = { ...hf, P: (f, ll, u) => hf.P(f, ll, u) };
      add(3.55, l, 1.0, x => beast(x, cam, HORSE, ext, run + .23 * i + v.seed * .41, 1, { seed: v.seed * 4 + i, headDown: heatHead(t) * (.8 + .3 * hash(i, v.seed)) }), 2.6, 4.95);
    });
    {
      const lead = v.kind === 'lead', fb = lead ? fr : frameOf(X + BODY_DX * WEST[0], 0, WEST), df = lead ? .05 : .52, hnd = handOf(lead ? 'stand' : 'kneel');
      const hand = fb.P(df + hnd[0], 0, .86 + hnd[1]);
      const mouths = lanes.map((l, i) => mouthOf(HORSE, frameOf(X - 3.55, l, WEST), run + .23 * i + v.seed * .41, 1, { seed: v.seed * 4 + i, headDown: heatHead(t) * (.8 + .3 * hash(i, v.seed)) }));
      const dR = Math.min(...lanes.map(l => cam.depth(P(3.55, l, 1.0)))) - .01;
      if (dR > .2) parts.push({ d: dR, x0: X - 4.9, x1: X - df, z: 0, draw: x => reins(x, cam, hand, mouths) });
    }
    add(1.6, 0, .9, x => {
      x.lineCap = 'round';
      seg(x, cam, P(.4, 0, .74), P(1.6, 0, .82), .09, LAC); seg(x, cam, P(1.6, 0, .82), P(2.5, 0, 1.0), .08, LAC); seg(x, cam, P(2.5, 0, 1.0), P(2.85, 0, 1.18), .07, LAC);
      seg(x, cam, P(2.8, -(lanes.length > 2 ? 1.05 : .5), 1.2), P(2.8, (lanes.length > 2 ? 1.05 : .5), 1.2), .07, LAC);
      for (const l of lanes) { seg(x, cam, P(2.8, l, 1.2), P(3.95, l, 1.28), .02, 'rgba(30,26,34,.8)'); }
    }, .4, 2.9);
    add(0, 0, 1.3, x => carriageBody(x, cam, fr, v, t, nearSide), -1.3, 1.3);
  }
  const BODY_DX = .37;
  function carriageBody(x, cam, fr, v, t, nearSide) {
    if (v.kind !== 'lead') fr = frameOf(fr.X + BODY_DX * fr.d[0], fr.Z + BODY_DX * fr.d[1], fr.d);
    const P = fr.P;
    if (v.kind === 'lead') {
      lbox(x, cam, fr, -.55, .55, -.62, .62, .74, .86, LAC);
      for (const l of [-.62, .62]) seg(x, cam, P(-.55, l, 1.22), P(.55, l, 1.22), .04, LAC);
      seg(x, cam, P(.55, -.62, 1.22), P(.55, .62, 1.22), .04, LAC);
      for (const [f, l] of [[-.55, -.62], [.55, -.62], [-.55, .62], [.55, .62]]) seg(x, cam, P(f, l, .86), P(f, l, 1.22), .035, LAC);
      figureIn(x, cam, fr, .05, 0, .86, 'stand', t, v.seed);
      seg(x, cam, P(-.1, 0, .86), P(-.1, 0, 2.5), .035, LAC);
      const rim = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * TAU; return P(-.1 + 1.02 * Math.cos(a), 1.02 * Math.sin(a), 2.42); });
      fillHull(x, cam, [...rim, P(-.1, 0, 2.62)], '#2a2630');
      const q = rim.map(p => cam.proj(p)); if (q.every(Boolean)) { x.strokeStyle = GILT; x.lineWidth = Math.max(.8, .02 * q[0][3]); x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke(); }
      return;
    }
    const big = v.kind === 'imperial', c0 = -1.0, c1 = .22, d1 = .78, top = big ? 1.86 : 1.76;
    lbox(x, cam, fr, c1, d1, -.62, .62, .74, .86, LAC);
    lbox(x, cam, fr, c0, c1, -.62, .62, .74, top, LAC, { left: LAC2, right: LAC2 });
    const fw = (f0, f1, l0, l1) => lbox(x, cam, fr, f0, f1, l0, l1, .86, 1.16, LAC);
    fw(c1, d1, -nearSide * .62, -nearSide * .58);
    figureIn(x, cam, fr, .52, 0, .86, 'kneel', t, v.seed);
    fw(c1, d1, nearSide * .58, nearSide * .62); fw(d1 - .04, d1, -.62, .62);
    for (const sg of [-1, 1]) {
      const l = sg * .625, N = fr.N(0, sg, 0), q = [[-.62, l, 1.2], [.02, l, 1.2], [.02, l, 1.6], [-.62, l, 1.6]].map(p => P(...p));
      if (!S3.facing(cam, q[0], N)) continue;
      if (S3.poly(x, cam, q)) { x.fillStyle = '#3a3440'; x.fill(); }
      x.strokeStyle = '#17141c'; x.lineWidth = 1.2; x.beginPath();
      for (let i = 1; i < 6; i++) S3.line(x, cam, P(-.62 + .64 * i / 6, l, 1.2), P(-.62 + .64 * i / 6, l, 1.6));
      for (let j = 1; j < 4; j++) S3.line(x, cam, P(-.62, l, 1.2 + .4 * j / 4), P(.02, l, 1.2 + .4 * j / 4));
      x.stroke();
      if (big) shutterSeal(x, cam, fr, l, sg, t);
    }
    x.lineCap = 'butt';
    for (const sg of [-1, 1]) seg(x, cam, P(c0, sg * .63, top - .05), P(c1, sg * .63, top - .05), .03, GILT);
    const cf = big ? -.36 : -.38, A = big ? 1.18 : 1.02, B = big ? .84 : .74, r0 = top + .08, r1 = top + (big ? .36 : .28);
    const rim = Array.from({ length: 28 }, (_, i) => { const a = i / 28 * TAU; return [cf + A * Math.cos(a), B * Math.sin(a), r0]; });
    for (const [f, l] of [[c0 + .05, -.55], [c0 + .05, .55], [c1 - .05, -.55], [c1 - .05, .55]]) seg(x, cam, P(f, l, top), P(f, l, r0), .035, LAC);
    fillHull(x, cam, [...rim.map(p => P(...p)), P(cf, 0, r1), ...rim.map(([f, l]) => P(cf + (f - cf) * .55, l * .55, r1 - .06))], big ? '#29252f' : '#2c2832');
    const qr = rim.map(p => cam.proj(P(...p))); if (qr.every(Boolean)) {
      x.strokeStyle = GILT; x.lineWidth = Math.max(.8, .025 * qr[0][3]); x.beginPath(); qr.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke();
    }
    if (big) {
      x.strokeStyle = 'rgba(176,138,69,.45)'; x.lineWidth = 1; x.beginPath();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, p0 = [cf + A * Math.cos(a), B * Math.sin(a), r0], p1 = [cf + A * .2 * Math.cos(a), B * .2 * Math.sin(a), r1 - .01]; if (S3.facing(cam, P(...p0), fr.N(Math.cos(a), Math.sin(a), .6))) S3.line(x, cam, P(...p0), P(...p1)); }
      x.stroke();
    }
  }
  function shutterSeal(x, cam, fr, l, sg, t) {
    const P = fr.P;
    x.strokeStyle = '#8a6a44'; x.lineWidth = Math.max(1, .012 * (cam.proj(P(-.3, l, 1.4)) || [0, 0, 0, 80])[3]); x.beginPath(); S3.line(x, cam, P(-.66, l + sg * .01, 1.5), P(.06, l + sg * .01, 1.3)); x.stroke();
    const c = cam.proj(P(-.3, l + sg * .015, 1.4)); if (!c) return;
    const r = .045 * c[3], lit = sealLit(t);
    x.fillStyle = mix('#9a2a1e', '#ff6a40', lit); x.beginPath(); x.ellipse(c[0], c[1], r * .8, r, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,220,180,.5)'; x.beginPath(); x.ellipse(c[0] - r * .25, c[1] - r * .3, r * .25, r * .3, 0, 0, TAU); x.fill();
  }
  const sealLit = t => .25 + .75 * bump(t, T_SECRET - .1, T_SECRET + .25, T_SECRET + 1.0, T_SECRET + 1.8);
  function figureIn(x, cam, fr, f, l, u, how, t, seed) {
    const p = fr.P(f, l, u), s = cam.proj(p); if (!s) return;
    const yaw = cam.yawOf(Math.atan2(fr.d[1], fr.d[0])), sc = s[3] * FIG;
    const pose = how === 'kneel' ? { ...Q.kneel({ arms: [[.55, 1.45], [.6, 1.5]] }), yaw, headYaw: yaw } : { hip: [0, Mo.HIP], lean: .02, bend: 0, head: .05, feet: [{ at: [-3, 0], ang: 0 }, { at: [3, 0], ang: 0 }], arms: [[.5, 1.2], [.55, 1.25]], hands: [{ pose: 'relaxed' }, { pose: 'relaxed' }], yaw, headYaw: yaw };
    x.save(); x.translate(s[0], s[1]); x.scale(sc, sc); Q.draw(x, PA.P, pose, LK.min, { kneel: how === 'kneel', tilt: .1, shadow: 0, robe: 42 }); x.restore();
  }
  const HANDS = {};
  function handOf(how) {
    if (HANDS[how]) return HANDS[how];
    const pose = how === 'kneel' ? Q.kneel({ arms: [[.55, 1.45], [.6, 1.5]] }) : { hip: [0, Mo.HIP], lean: .02, bend: 0, head: .05, feet: [{ at: [-3, 0], ang: 0 }, { at: [3, 0], ang: 0 }], arms: [[.5, 1.2], [.55, 1.25]] };
    const J = Mo.joints(pose), c = J.arms.map(a => { const dx = a.wr[0] - a.el[0], dy = a.wr[1] - a.el[1], L = Math.hypot(dx, dy) || 1; return [a.wr[0] + dx / L * Q.SLEEVE_EXT, a.wr[1] + dy / L * Q.SLEEVE_EXT]; });
    return (HANDS[how] = [(c[0][0] + c[1][0]) / 2 * FIG, -(c[0][1] + c[1][1]) / 2 * FIG]);
  }
  function mouthOf(Bd, fr, s, go, o = {}) {
    const ph0 = (o.seed || 0) * .137, cyc = s / Bd.stride + ph0, bob = .018 * go * Math.sin(cyc * TAU * 2);
    const nod = -(o.headDown || 0) + .045 * go * Math.sin(cyc * TAU * 2 + 1.2), dx = 1.24 - Bd.pivot[0], du = 1.21 - Bd.pivot[1], c = Math.cos(nod), sn = Math.sin(nod);
    return fr.P(Bd.pivot[0] + dx * c - du * sn, 0, Bd.pivot[1] + dx * sn + du * c + bob);
  }
  function reins(x, cam, hand, mouths) {
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#2a1e16';
    for (const m of mouths) {
      const mid = [(hand[0] + m[0]) / 2, (hand[1] + m[1]) / 2 - .16, (hand[2] + m[2]) / 2];
      let pen = false, k = 0; x.beginPath();
      for (let i = 0; i <= 14; i++) {
        const u = i / 14, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
        const q = cam.proj([w0 * hand[0] + w1 * mid[0] + w2 * m[0], w0 * hand[1] + w1 * mid[1] + w2 * m[1], w0 * hand[2] + w1 * mid[2] + w2 * m[2]]);
        if (!q) { pen = false; continue; } k = Math.max(k, q[3]);
        if (pen) x.lineTo(q[0], q[1]); else { x.moveTo(q[0], q[1]); pen = true; }
      }
      x.lineWidth = Math.max(.8, Math.min(6, .014 * k)); x.stroke();
    }
    x.restore();
  }
  const heatHead = t => .2 * ss(T_HEAT, T_BODY + .4, t) * (1 - .6 * ss(T_DROWN + .2, T_SMELL + .6, t));

  const HEAP = (() => {
    const o = [], R = F.rng(3011);
    for (let i = 0; i < 46; i++) {
      const u = R(), v = R(), f = lerp(-1.1, 1.15, u), l = lerp(-.62, .62, v), e = 1 - Math.pow((f - .03) / 1.25, 2) - Math.pow(l / .7, 2);
      if (e <= .05) { i--; continue; }
      const h = .84 + .78 * Math.pow(e, .55) + .03 * R();
      o.push({ f, l, u: h, a: R() * TAU, len: .3 + .14 * R(), tone: R(), tw: R() });
    }
    return o.sort((a, b) => a.u - b.u);
  })();
  const DOME = (() => { const o = []; for (let i = 0; i <= 8; i++) for (let j = 0; j <= 6; j++) { const f = lerp(-1.22, 1.2, i / 8), l = lerp(-.7, .7, j / 6), e = 1 - Math.pow((f + .01) / 1.25, 2) - Math.pow(l / .72, 2); o.push([f, l, .82 + (e > 0 ? .78 * Math.pow(e, .55) : 0)]); } return o; })();
  const fishLit = t => ss(T_SALTED - .1, T_SALTED + .3, t);
  function cartParts(parts, cam, c, t) {
    const q = cartPose(c, t), fr = frameOf(q.X, q.Z, q.d), P = fr.P, rotW = -q.s / .55;
    const camL = (cam.pos[0] - q.X) * q.d[1] - (cam.pos[2] - q.Z) * q.d[0], nearSide = camL >= 0 ? 1 : -1;
    const add = (f, l, u, draw, fa = f - .6, fb = f + .6) => { const d = cam.depth(P(f, l, u)); if (d > .2) parts.push({ d, draw, x0: q.X - fb, x1: q.X - fa, z: q.Z + l }); };
    add(0, -nearSide * .84, .55, x => wheel(x, cam, fr, -nearSide * .84, .55, 12, rotW, '#2a221c', '#6a5034'));
    add(0, nearSide * .84, .55, x => wheel(x, cam, fr, nearSide * .84, .55, 12, rotW, '#2a221c', '#6a5034'));
    add(0, 0, 1.1, x => {
      lbox(x, cam, fr, -1.25, 1.25, -.74, .74, .68, .8, '#5a4430');
      for (const sg of [-1, 1]) lbox(x, cam, fr, -1.25, 1.25, sg * .74 - .03, sg * .74 + .03, .8, 1.02, '#4e3a28');
      fishHeap(x, cam, fr, t);
    }, -1.3, 1.3);
    add(2.6, 0, .9, x => {
      x.lineCap = 'round';
      for (const sg of [-1, 1]) seg(x, cam, P(1.15, sg * .5, .8), P(3.15, sg * .36, 1.02), .05, '#4e3a28');
      const of = frameOf(...(() => { const p = P(2.42, 0, 0); return [p[0], p[2]]; })(), q.d);
      beast(x, cam, OX, of, q.s, q.go, { seed: c.seed, headDown: .05 });
    }, .9, 3.8);
    const cp = P(3.0, nearSide * 1.0, 0);
    add(3.0, nearSide * 1.0, .9, x => carter(x, cam, cp, q, t, c.seed));
  }
  function fishHeap(x, cam, fr, t) {
    const P = fr.P, lit = fishLit(t);
    fillHull(x, cam, DOME.map(p => P(...p)), '#7d838a');
    const camP = cam.pos;
    for (const fsh of HEAP) {
      const c = P(fsh.f, fsh.l, fsh.u), n = fr.N((fsh.f + .2) * .6, fsh.l * .9, .9);
      if (!S3.facing(cam, c, n)) continue;
      const ca = Math.cos(fsh.a), sa = Math.sin(fsh.a), h = fsh.len / 2;
      const a = cam.proj(P(fsh.f + ca * h, fsh.l + sa * h * .8, fsh.u + .02)), b = cam.proj(P(fsh.f - ca * h, fsh.l - sa * h * .8, fsh.u - .02)), m = cam.proj(c);
      if (!a || !b || !m) continue;
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), k = m[3], wdt = Math.max(1, .055 * k);
      if (L < 1.5) continue;
      x.save(); x.translate(a[0], a[1]); x.rotate(Math.atan2(dy, dx));
      x.fillStyle = mix('#8e969e', '#b9c0c6', fsh.tone); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(L * .4, -wdt * 1.1, L * .82, 0); x.quadraticCurveTo(L * .4, wdt * 1.1, 0, 0); x.fill();
      x.fillStyle = '#5d646c'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(L * .4, -wdt * 1.1, L * .82, 0); x.quadraticCurveTo(L * .4, -wdt * .35, 0, 0); x.fill();
      x.fillStyle = '#6f777f'; x.beginPath(); x.moveTo(L * .78, 0); x.lineTo(L, -wdt * .9); x.lineTo(L * .94, 0); x.lineTo(L, wdt * .9); x.closePath(); x.fill();
      x.fillStyle = 'rgba(250,250,246,.75)'; for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(L * (.2 + .2 * j), wdt * .25 * (hash(j, fsh.tone * 9) - .5), Math.max(.6, wdt * .18), 0, TAU); x.fill(); }
      const g = lit * Math.max(0, Math.sin(t * 5 + fsh.tw * 20)) ** 3;
      if (g > .05) { x.fillStyle = `rgba(255,255,255,${.9 * g})`; x.beginPath(); x.arc(L * .35, -wdt * .4, Math.max(1, wdt * .5), 0, TAU); x.fill(); }
      x.restore();
    }
  }
  function carter(x, cam, p, q, t, seed) {
    const s = cam.proj(p); if (!s) return;
    const sc = s[3] * FIG, yaw = cam.yawOf(Math.atan2(q.d[1], q.d[0]));
    const G = CARTER_G[seed], tp = Mo.pose(t), walking = t > G.t0;
    const base = walking ? centre(G.g(tp), G.g.x(tp)) : { hip: [0, Mo.HIP], lean: .03, bend: 0, head: .12, feet: [{ at: [-2.5, 0], ang: 0 }, { at: [2.5, 0], ang: 0 }], arms: [[.1, .2], [.15, .25]], hands: [{ pose: 'relaxed' }, { pose: 'relaxed' }] };
    const pose = { ...base, yaw, headYaw: yaw };
    x.save(); x.translate(s[0], s[1]); x.scale(sc, sc); Q.draw(x, PA.P, pose, LK.sol, { tilt: .1, shadow: 0 }); x.restore();
  }
  const CARTER_G = Object.fromEntries(CARTS.map(c => [c.seed, { t0: c.ex[0] + .1, g: Mo.gait({ from: 0, to: 2000, t0: c.ex[0] + .1, gait: 'walk', style: { step: 36, arms: .3, lean: .04 }, until: c.ex[0] + 34 }) }]));

  const AT = {};
  function walkerPart(parts, cam, Wk, t) {
    const X = Wk.X(t), p = [X, 0, Wk.z], d = cam.depth([X, 1, Wk.z]); if (d < .3) return;
    parts.push({ d, x0: X - .35, x1: X + .35, z: Wk.z, draw: x => { const at = drawWalker(x, cam, Wk, p, t); if (Wk === ZHAO) AT.zhao = at; if (Wk === LISI) AT.li = at; } });
  }
  function drawWalker(x, cam, Wk, p, t) {
    const s = cam.proj(p); if (!s) return null;
    const sc = s[3] * FIG * (Wk.h || 1), tp = Mo.pose(t), yaw0 = cam.yawOf(PI);
    let pose = centre(Wk.G(tp), Wk.G.x(tp));
    let hy = 0, raise = 0;
    if (Wk === ZHAO) { hy = .55 * glance(t); raise = sleeve(t, 0); }
    if (Wk === LISI) { hy = -.55 * glance(t); raise = sleeve(t, 1); }
    if (raise > 0) {
      const arms = pose.arms.map(a => a.slice());
      const i = 1, tgt = [1.62, 3.72];
      arms[i] = [lerp(arms[i][0], tgt[0], raise), lerp(arms[i][1], tgt[1], raise), arms[i][2] || 0];
      pose = { ...pose, arms, head: (pose.head || 0) + .12 * raise };
    }
    pose = { ...pose, yaw: yaw0, headYaw: yaw0 + hy };
    const eye = cam.pos, lev = Math.hypot(p[0] - eye[0], p[2] - eye[2]) / Math.hypot(p[0] - eye[0], 1 - eye[1], p[2] - eye[2]);
    const tilt = clamp(1 - lev, 0, .5);
    const L = Wk.soldier ? LK.sol : LK.min, LR = Wk.soldier ? LK.solR : LK.minR;
    const opts = { tilt, robe: Wk.soldier ? null : 44, shadow: 0, beard: Wk.beard ? true : false };
    if (Wk.soldier) opts.prop = (xx, pj) => { xx.strokeStyle = INK; xx.lineWidth = 1.6; xx.lineCap = 'round'; const a = pj.arms[1].wr; xx.beginPath(); xx.moveTo(a[0] + 6, a[1] + 14); xx.lineTo(a[0] - 18, a[1] - 74); xx.stroke(); xx.fillStyle = INK; xx.beginPath(); xx.moveTo(a[0] - 18, a[1] - 74); xx.lineTo(a[0] - 23, a[1] - 86); xx.lineTo(a[0] - 15, a[1] - 76); xx.fill(); };
    if (Wk.seal) opts.prop = (xx, pj) => beltSeal(xx, pj, t);
    const r = Math.max(.8, sc * 1.2), rimA = .55 + .35 * bump(t, T_TWO - .1, T_TWO + .2, T_TWO + .9, T_TWO + 1.5) + .15 * ss(T_HOME, T_HOME + 2, t);
    const draw = (Lk, dx, dy) => { x.save(); x.translate(s[0] + dx, s[1] + dy); x.scale(sc, sc); Q.draw(x, PA.P, pose, Lk, opts); x.restore(); };
    x.save(); x.globalAlpha *= rimA * (Wk.soldier ? .7 : 1); draw(LR, -r, -r * .6); x.restore();
    draw(L, 0, 0); draw(L, 0, 0);
    return { sx: s[0], sy: s[1] - 112 * sc, sc, belt: Wk.seal ? beltAt : null };
  }
  let beltAt = null;
  function beltSeal(x, pj, t) {
    const yaw = pj.yaw, c = Math.cos(yaw), sn = c >= 0 ? 6.5 : -6.5, hipX = (pj.hip[0] + 3) * c - sn * Math.sin(yaw), hipY = pj.hip[1] - 4;
    const sw = .22 * Math.sin(t * 4.6) * Math.sign(c || 1), L = 13, ex = hipX + L * Math.sin(sw), ey = hipY + L * Math.cos(sw);
    x.strokeStyle = '#a63a26'; x.lineWidth = 1.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(hipX, hipY); x.quadraticCurveTo(hipX + 1, hipY + L * .5, ex, ey); x.stroke();
    x.lineWidth = .9; x.beginPath(); x.moveTo(hipX, hipY); x.lineTo(hipX - 2, hipY + L * .9); x.stroke();
    const lit = bump(t, T_IMPS - .1, T_SEAL + .1, T_SEAL + .9, T_SEAL + 1.6);
    x.save(); x.translate(ex, ey); x.rotate(-sw);
    x.fillStyle = mix('#cfd8c4', '#ffffff', .6 * lit); x.fillRect(-2.6, 0, 5.2, 4.6);
    x.fillStyle = mix('#a9b89e', '#e8f0e0', lit); x.fillRect(-2.6, 3.4, 5.2, 1.2);
    x.fillStyle = '#b9c7ad'; x.beginPath(); x.moveTo(-1.8, 0); x.quadraticCurveTo(-1, -2.6, 1.6, -1.6); x.lineTo(1.8, 0); x.closePath(); x.fill();
    x.restore();
    beltAt = [ex, ey + 2.3];
  }

  const FLIES = Array.from({ length: 34 }, (_, i) => ({ i, r: .08 + .26 * hash(i, 1), w: (9 + 7 * hash(i, 2)) * (hash(i, 3) > .5 ? 1 : -1), c: [.07 + .6 * (hash(i, 4) - .5), -(.66 + .1 + .32 * hash(i, 5)), 1.4 + .5 * (hash(i, 6) - .5)], to: hash(i, 7) > .45 ? 'A' : 'B', in: T_WORK - .3 + .9 * hash(i, 8), out: T_DROWN + .1 + .5 * hash(i, 9) }));
  function flyAt(fl, t) {
    const fr = frameOf(xc(t), 0, WEST), a = t * fl.w + fl.i * 1.7, bz = .03 * Math.sin(t * 37 + fl.i * 5);
    const home = fr.P(fl.c[0] + fl.r * Math.cos(a), fl.c[1] + fl.r * .5 * Math.sin(a), fl.c[2] + fl.r * .6 * Math.sin(a * 1.3) + bz);
    const k1 = ss(fl.in, fl.in + .6, t), k2 = ss(fl.out, fl.out + .9, t);
    if (k1 <= 0) return null;
    const from = fr.P(fl.c[0] + 2.6 * Math.cos(fl.i * 2.1), fl.c[1] - .4 * hash(fl.i, 11), fl.c[2] + .9 * Math.sin(fl.i * 1.3) + .4);
    let p = [lerp(from[0], home[0], k1), lerp(from[1], home[1], k1), lerp(from[2], home[2], k1)];
    if (k2 > 0) {
      const c = CARTS.find(cc => cc.id === fl.to), q = cartPose(c, t), cf = frameOf(q.X, q.Z, q.d);
      const there = cf.P(fl.r * 3 * Math.cos(a), fl.r * 2.2 * Math.sin(a), 1.8 + .25 * Math.sin(a * 1.3) + bz);
      p = [lerp(p[0], there[0], k2), lerp(p[1], there[1], k2), lerp(p[2], there[2], k2)];
    }
    return p;
  }
  function flies(x, cam, t) {
    x.fillStyle = '#121014'; x.strokeStyle = 'rgba(20,18,22,.35)';
    for (const fl of FLIES) {
      const p = flyAt(fl, t); if (!p) continue; const q = cam.proj(p); if (!q) continue;
      const r = Math.max(1.6, .007 * q[3]);
      const p2 = flyAt(fl, t - .01), q2 = p2 && cam.proj(p2);
      if (q2) { x.lineWidth = r * .9; x.beginPath(); x.moveTo(q2[0], q2[1]); x.lineTo(q[0], q[1]); x.stroke(); }
      x.beginPath(); x.arc(q[0], q[1], r, 0, TAU); x.fill();
    }
  }

  const STRIPS = (() => { const o = []; let z = -600; for (let i = 0; z < 110; i++) { const d = 18 + 40 * hash(i, 7); if (Math.abs(z) > 9 || z + d < -9) o.push([z, z + d, ['#b6ad6a', '#a3a85e', '#c2b47a', '#97a35c', '#b4a96c'][i % 5]]); z += d; } return o; })();
  function ground(x, cam) {
    if (S3.poly(x, cam, [[-3000, 0, -2600], [3000, 0, -2600], [3000, 0, 2600], [-3000, 0, 2600]])) { x.fillStyle = '#b1a66c'; x.fill(); }
    for (const [a, b, col] of STRIPS) { const A = Math.max(a, -600), B = Math.min(b, 110); if (B <= A) continue; if (S3.poly(x, cam, [[0, 0, A], [900, 0, A], [900, 0, B], [0, 0, B]])) { x.fillStyle = col; x.fill(); } }
    if (S3.poly(x, cam, [[0, .01, -6.6], [1200, .01, -6.6], [1200, .01, 6.6], [0, .01, 6.6]])) { x.fillStyle = '#cdb48a'; x.fill(); }
    x.strokeStyle = 'rgba(120,92,58,.28)'; x.lineWidth = 2; x.beginPath();
    for (const z of [-.98, .98, -.84, .84, 3.9, 3.6]) S3.line(x, cam, [0, .02, z], [600, .02, z]);
    x.stroke();
  }
  const HOUSES = (() => { const R = F.rng(3021), o = []; for (let i = 0; i < 70; i++) { const X = -WT - 14 - 280 * Math.pow(R(), 1.2), Z = lerp(-ZN * .9, ZF - WT - 6, R()); if (Math.abs(Z) < 8) continue; o.push({ X, Z, w: 6 + 6 * R(), d: 5 + 5 * R(), h: 3.5 + 2.5 * R(), tone: R() }); } return o.sort((a, b) => a.X - b.X); })();
  const STREET = (() => { const o = []; for (let i = 0; i < 18; i++) for (const sg of [-1, 1]) o.push({ X: -WT - 12 - 10.5 * i - 2 * hash(i, sg), Z: sg * (11 + 2.5 * hash(i, sg + 4)), w: 8.5, d: 6, h: 4 + 1.4 * hash(i, sg + 2), tone: hash(i, sg + 6) }); return o; })();
  function city(x, cam) {
    if (S3.poly(x, cam, [[-WT, .005, -ZN], [-2200, .005, -ZN], [-2200, .005, ZF - WT], [-WT, .005, ZF - WT]])) { x.fillStyle = '#b9aa80'; x.fill(); }
    for (const [X, Z, w2, d2, h, hh] of [[-1300, -120, 160, 110, 14, 16], [-1450, 140, 120, 90, 10, 13], [-1700, 0, 220, 140, 20, 22]]) {
      S3.box(x, cam, { x0: X - w2 / 2, x1: X + w2 / 2, y0: 0, y1: h, z0: Z - d2 / 2, z1: Z + d2 / 2 }, { col: '#b49c74', light: SUNV, lo: .6 });
      S3.box(x, cam, { x0: X - w2 * .3, x1: X + w2 * .3, y0: h, y1: h + hh * .55, z0: Z - d2 * .25, z1: Z + d2 * .25 }, { col: '#b8a68a', light: SUNV, lo: .6 });
      roof(x, cam, X, Z, w2 * .36, d2 * .32, h + hh * .55, hh * .45, '#5e5a5c');
    }
    S3.box(x, cam, { x0: -232, x1: -196, y0: 0, y1: 5, z0: -26, z1: 26 }, { col: '#b8a074', light: SUNV, lo: .55 });
    S3.box(x, cam, { x0: -226, x1: -204, y0: 5, y1: 12, z0: -16, z1: 16 }, { col: '#c8b896', light: SUNV, lo: .55 });
    roof(x, cam, -215, 0, 14, 20, 12, 5.5, '#4e4a4e');
    const far = HOUSES.concat(STREET).filter(hh => cam.pos[0] > hh.X).sort((a, b) => a.X - b.X);
    for (const hs of far) { S3.box(x, cam, { x0: hs.X - hs.w / 2, x1: hs.X + hs.w / 2, y0: 0, y1: hs.h, z0: hs.Z - hs.d / 2, z1: hs.Z + hs.d / 2 }, { col: mix('#d8cbb0', '#c9b896', hs.tone), light: SUNV, lo: .62 }); roof(x, cam, hs.X, hs.Z, hs.w / 2 + .6, hs.d / 2 + .6, hs.h, 1.8, mix('#5a5658', '#6e6866', hs.tone)); }
  }
  function roof(x, cam, X, Z, a, b, y, h, col) {
    const face = (pts, n) => { if (!S3.facing(cam, pts[0], n)) return; if (S3.poly(x, cam, pts)) { x.fillStyle = S3.shade(col, n, SUNV, { lo: .5 }); x.fill(); } };
    const E = [[X - a, y, Z - b], [X + a, y, Z - b], [X + a, y, Z + b], [X - a, y, Z + b]];
    if (b > a) {
      const r = b - a, R0 = [X, y + h, Z - r], R1 = [X, y + h, Z + r], sl = Math.atan2(h, a);
      face([E[1], E[2], R1, R0], [Math.sin(sl), Math.cos(sl), 0]); face([E[3], E[0], R0, R1], [-Math.sin(sl), Math.cos(sl), 0]);
      face([E[0], E[1], R0], [0, Math.cos(sl), -Math.sin(sl)]); face([E[2], E[3], R1], [0, Math.cos(sl), Math.sin(sl)]);
      return;
    }
    const r = a - b, R0 = [X - r, y + h, Z], R1 = [X + r, y + h, Z];
    const sl = Math.atan2(h, b), sx = Math.atan2(h, Math.max(.1, a - r));
    face([E[0], E[1], R1, R0], [0, Math.cos(sl), -Math.sin(sl)]);
    face([E[2], E[3], R0, R1], [0, Math.cos(sl), Math.sin(sl)]);
    face([E[1], E[2], R1], [Math.sin(sx), Math.cos(sx), 0]);
    face([E[3], E[0], R0], [-Math.sin(sx), Math.cos(sx), 0]);
  }
  const TERR = Array.from({ length: 7 }, (_, i) => ({ z: 95 + 26 * i + 6 * hash(i, 1), h: 3.2 + 3.6 * i + 1.2 * hash(i, 2) }));
  const RIDGES = [{ z: 2900, h: 300, col: '#b6bcb2', s: 37 }, { z: 1700, h: 160, col: '#a9ad9c', s: 31 }, { z: -2400, h: 180, col: '#b2b6a8', s: 41 }];
  function far(x, cam) {
    for (const R of RIDGES) {
      const pts = []; for (let i = 0; i <= 60; i++) { const X = -6000 + 12000 * i / 60; pts.push([X, R.h * (.45 + .55 * Math.pow(Math.sin(i * .37 + R.s) * .5 + .5, 1.3)) + 40 * hash(i, R.s), R.z + 120 * Math.sin(i * .6)]); }
      if (S3.poly(x, cam, [[-6000, 0, R.z], ...pts, [6000, 0, R.z]])) { x.fillStyle = R.col; x.fill(); }
    }
    for (let i = TERR.length - 1; i >= 0; i--) {
      const T = TERR[i], prev = i ? TERR[i - 1] : { z: 60, h: 0 };
      if (S3.poly(x, cam, [[-2000, prev.h, T.z], [2000, prev.h, T.z], [2000, T.h, T.z], [-2000, T.h, T.z]])) { x.fillStyle = mix('#c4a46e', '#b39463', i / 7); x.fill(); }
      const z2 = i + 1 < TERR.length ? TERR[i + 1].z : T.z + 400;
      if (S3.poly(x, cam, [[-2000, T.h, T.z], [2000, T.h, T.z], [2000, T.h, z2], [-2000, T.h, z2]])) { x.fillStyle = mix('#9ea267', '#a8a874', i / 7); x.fill(); }
    }
  }
  const PINES = (() => { const o = []; for (const z of [-7.8, 7.8]) for (let i = 0; i < 70; i++) { if (z < 0 && (i % 2 || i < 2)) continue;  if (z > 0 && i < 1) continue; const X = 20.5 + 9 * i + 1.6 * (hash(i, z) - .5); o.push({ X, Z: z + .5 * (hash(i, z + 3) - .5), h: 6.5 + 2.2 * hash(i, z + 5), seed: i * 3 + (z > 0 ? 1 : 0), far: z > 0 }); } return o; })();
  function pine(x, cam, p, col) {
    const b = cam.proj([p.X, 0, p.Z]), tp = cam.proj([p.X, p.h, p.Z]); if (!b || !tp) return;
    const k = b[3], tw = Math.max(1, .3 * k);
    x.fillStyle = col.trunk; x.beginPath(); x.moveTo(b[0] - tw / 2, b[1]); x.lineTo(tp[0] - tw * .25, tp[1] + .2 * (b[1] - tp[1])); x.lineTo(tp[0] + tw * .25, tp[1] + .2 * (b[1] - tp[1])); x.lineTo(b[0] + tw / 2, b[1]); x.closePath(); x.fill();
    for (let j = 0; j < 4; j++) {
      const hy = p.h * (.55 + .13 * j), q = cam.proj([p.X + .8 * (hash(p.seed, j) - .5), hy, p.Z]); if (!q) continue;
      const rw = (2.2 - .35 * j + .6 * hash(p.seed, j + 9)) * q[3], rh = (.55 + .15 * hash(p.seed, j + 4)) * q[3];
      x.fillStyle = j % 2 ? col.crown : col.crown2; x.beginPath(); x.ellipse(q[0] + .3 * rw * (hash(p.seed, j + 2) - .5), q[1], rw, rh, 0, 0, TAU); x.fill();
    }
  }
  const PINE_FAR = { trunk: '#6a5a48', crown: '#5c6a48', crown2: '#667352' }, PINE_NEAR = { trunk: '#3a2e24', crown: '#2c3826', crown2: '#34402c' };

  const EARTH = '#b49a6a', EARTH_SH = '#8c7653';
  const wface = (x, cam, pts, n, col) => { if (!S3.facing(cam, pts[0], n)) return; if (S3.poly(x, cam, pts)) { x.fillStyle = col || S3.shade(EARTH, n, SUNV, { lo: .55 }); x.fill(); } };
  function passage(x, cam) {
    const face = (pts, n, col) => wface(x, cam, pts, n, col), g0 = GATE.z0, g1 = GATE.z1, gh = GATE.h;
    face([[-WT, 0, g0], [0, 0, g0], [0, gh, g0], [-WT, gh, g0]], [0, 0, 1], '#3a2e22');
    face([[0, 0, g1], [-WT, 0, g1], [-WT, gh, g1], [0, gh, g1]], [0, 0, -1], '#3a2e22');
    face([[-WT, gh, g0], [0, gh, g0], [0, gh, g1], [-WT, gh, g1]], [0, -1, 0], '#251d16');
    if (S3.poly(x, cam, [[-WT, .02, g0], [0, .02, g0], [0, .02, g1], [-WT, .02, g1]])) { x.fillStyle = '#4a3c2c'; x.fill(); }
    for (const [z, n] of [[g0 + .12, 1], [g1 - .12, -1]]) S3.box(x, cam, { x0: -1.6, x1: -.15, y0: 0, y1: gh - .1, z0: Math.min(z, z + n * .16), z1: Math.max(z, z + n * .16) }, { col: '#3e2c1e', light: SUNV, lo: .5 });
  }
  function wall(x, cam, t) {
    const face = (pts, n, col) => wface(x, cam, pts, n, col);
    const g0 = GATE.z0, g1 = GATE.z1, gh = GATE.h;
    face([[0, 0, -ZN], [0, 0, g0], [0, WALLH, g0], [0, WALLH, -ZN]], [1, 0, 0]);
    face([[0, 0, g1], [0, 0, ZF], [0, WALLH, ZF], [0, WALLH, g1]], [1, 0, 0]);
    face([[0, gh, g0], [0, gh, g1], [0, WALLH, g1], [0, WALLH, g0]], [1, 0, 0]);
    face([[-WT, 0, ZF - WT], [-WT, 0, g1], [-WT, WALLH, g1], [-WT, WALLH, ZF - WT]], [-1, 0, 0]);
    face([[-WT, 0, g0], [-WT, 0, -ZN], [-WT, WALLH, -ZN], [-WT, WALLH, g0]], [-1, 0, 0]);
    face([[-WT, gh, g1], [-WT, gh, g0], [-WT, WALLH, g0], [-WT, WALLH, g1]], [-1, 0, 0]);
    face([[0, WALLH, -ZN], [0, WALLH, ZF], [-WT, WALLH, ZF], [-WT, WALLH, -ZN]], [0, 1, 0], '#c2a878');
    face([[0, 0, ZF], [-700, 0, ZF], [-700, WALLH, ZF], [0, WALLH, ZF]], [0, 0, 1]);
    face([[0, WALLH, ZF - WT], [0, WALLH, ZF], [-700, WALLH, ZF], [-700, WALLH, ZF - WT]], [0, 1, 0], '#c2a878');
    S3.box(x, cam, { x0: -WT - 1.2, x1: 1.2, y0: 0, y1: WALLH + 2.6, z0: ZF - WT - 1.2, z1: ZF + 1.2 }, { col: EARTH, light: SUNV, lo: .55 });
    face([[-WT, 0, -ZN], [0, 0, -ZN], [0, WALLH, -ZN], [-WT, WALLH, -ZN]], [0, 0, -1]);
    if (cam.pos[0] > 0) {
      x.strokeStyle = 'rgba(90,70,44,.22)'; x.lineWidth = 1; x.beginPath();
      for (let y = .32; y < WALLH; y += .32) { if (y > gh) S3.line(x, cam, [.01, y, g0 - 60], [.01, y, g1 + 60]); else { S3.line(x, cam, [.01, y, g0 - 60], [.01, y, g0]); S3.line(x, cam, [.01, y, g1], [.01, y, g1 + 60]); } }
      x.stroke();
    }
    for (const z of [g0, g1]) S3.box(x, cam, { x0: -.35, x1: .05, y0: 0, y1: gh, z0: z - .28, z1: z + .28 }, { col: '#4a3324', light: SUNV, lo: .5 });
    S3.box(x, cam, { x0: -.35, x1: .05, y0: gh - .1, y1: gh + .45, z0: g0 - .6, z1: g1 + .6 }, { col: '#4a3324', light: SUNV, lo: .5 });
  }
  function parapet(x, cam) {
    for (let z = -60; z <= ZF - 2; z += 1.9) S3.box(x, cam, { x0: -.55, x1: 0, y0: WALLH, y1: WALLH + 1.05, z0: z - .5, z1: z + .5 }, { col: EARTH, light: SUNV, lo: .55, skip: ['0,-1,0'] });
    S3.box(x, cam, { x0: -WT, x1: -WT + .4, y0: WALLH, y1: WALLH + .55, z0: -60, z1: ZF - WT }, { col: EARTH, light: SUNV, lo: .55, skip: ['0,-1,0'] });
  }
  const TW = { x0: -WT + .5, x1: -1.8, z0: -7.4, z1: 7.4, y0: WALLH, y1: WALLH + 4.3 };
  function tower(x, cam, t) {
    S3.box(x, cam, { x0: TW.x0 - .3, x1: TW.x1 + .3, y0: WALLH, y1: WALLH + .45, z0: TW.z0 - .3, z1: TW.z1 + .3 }, { col: '#c8b48a', light: SUNV, lo: .55, skip: ['0,-1,0'] });
    const cxr = (TW.x0 + TW.x1) / 2, a = (TW.x1 - TW.x0) / 2 + 1.6, b = (TW.z1 - TW.z0) / 2 + 1.5;
    if (cam.pos[1] < TW.y1 && S3.poly(x, cam, [[cxr - a, TW.y1 - .05, -b], [cxr + a, TW.y1 - .05, -b], [cxr + a, TW.y1 - .05, b], [cxr - a, TW.y1 - .05, b]])) { x.fillStyle = '#20150f'; x.fill(); }
    S3.box(x, cam, { x0: TW.x0, x1: TW.x1, y0: WALLH + .45, y1: TW.y1, z0: TW.z0, z1: TW.z1 }, { col: '#ece4d2', light: SUNV, lo: .62, skip: ['0,-1,0'] });
    const posts = [];
    if (cam.pos[0] > TW.x1) for (const z of [TW.z0, -3.7, 0, 3.7, TW.z1]) posts.push([TW.x1, z]);
    if (cam.pos[0] < TW.x0) for (const z of [TW.z0, -3.7, 0, 3.7, TW.z1]) posts.push([TW.x0, z]);
    for (const Z of [TW.z0, TW.z1]) if ((Z < 0) === (cam.pos[2] < Z)) for (const X of [TW.x0, (TW.x0 + TW.x1) / 2, TW.x1]) posts.push([X, Z]);
    for (const [X, Z] of posts) S3.box(x, cam, { x0: X - .2, x1: X + .2, y0: WALLH + .45, y1: TW.y1, z0: Z - .2, z1: Z + .2 }, { col: '#8a2a18', light: SUNV, lo: .5 });
    x.strokeStyle = '#5a3a26'; x.lineWidth = 1.2;
    for (const [zA, zB] of [[-3.3, -.4], [.4, 3.3]]) {
      if (!S3.facing(cam, [TW.x1, WALLH + 2, zA], [1, 0, 0])) continue;
      if (S3.poly(x, cam, [[TW.x1 + .01, WALLH + 1.6, zA], [TW.x1 + .01, WALLH + 1.6, zB], [TW.x1 + .01, WALLH + 3.3, zB], [TW.x1 + .01, WALLH + 3.3, zA]])) { x.fillStyle = '#4a3428'; x.fill(); }
      x.beginPath(); for (let i = 1; i < 6; i++) S3.line(x, cam, [TW.x1 + .02, WALLH + 1.6, lerp(zA, zB, i / 6)], [TW.x1 + .02, WALLH + 3.3, lerp(zA, zB, i / 6)]); x.stroke();
    }
    S3.box(x, cam, { x0: TW.x0 - .25, x1: TW.x1 + .25, y0: TW.y1 - .5, y1: TW.y1, z0: TW.z0 - .25, z1: TW.z1 + .25 }, { col: '#4a2416', light: SUNV, lo: .5 });
    S3.box(x, cam, { x0: cxr - a, x1: cxr + a, y0: TW.y1 - .05, y1: TW.y1 + .22, z0: -b, z1: b }, { col: '#2e2c32', light: SUNV, lo: .5, skip: ['0,-1,0', '0,1,0'] });
    roof(x, cam, cxr, 0, a, b, TW.y1 + .22, 3.1, '#2e2d36');
    x.strokeStyle = 'rgba(20,18,22,.35)'; x.lineWidth = 1; x.beginPath();
    for (let i = -10; i <= 10; i++) { const z = i * .7; if (Math.abs(z) > b - .2) continue; for (const sg of [1, -1]) { const e = [cxr + sg * a, TW.y1, z], r = [cxr + sg * .3, TW.y1 + 3.1, z * .85]; if (S3.facing(cam, e, [sg * .6, .8, 0])) S3.line(x, cam, e, r); } }
    x.stroke();
  }
  const BANNERS = [-17, -11.5, 11.5, 17].map((z, i) => ({ z, i }));
  function banner(x, cam, b, t) {
    const X = -.35, y0 = WALLH, y1 = WALLH + 6.2, wv = .1 + .35 * ss(T_MOST, T_CAPITAL, t);
    const base = cam.proj([X, y0, b.z]), tp = cam.proj([X, y1, b.z]); if (!base || !tp) return;
    x.strokeStyle = '#2a2018'; x.lineWidth = Math.max(1, .09 * tp[3]); x.lineCap = 'round'; x.beginPath(); x.moveTo(base[0], base[1]); x.lineTo(tp[0], tp[1]); x.stroke();
    const pts = [];
    for (let i = 0; i <= 8; i++) { const v = i / 8, sway = wv * Math.sin(t * 2.2 + v * 3 + b.i) * v; pts.push([X + .2 + sway, y1 - .2 - 3.2 * v, b.z + .1]); }
    for (let i = 8; i >= 0; i--) { const v = i / 8, sway = wv * Math.sin(t * 2.2 + v * 3 + b.i + .4) * v; pts.push([X + .2 + sway, y1 - .2 - 3.2 * v, b.z + 1.25 + .15 * sway]); }
    if (S3.poly(x, cam, pts)) { x.fillStyle = '#18161c'; x.fill(); x.strokeStyle = '#8a2a1e'; x.lineWidth = Math.max(1, .05 * tp[3]); x.stroke(); }
  }
  const GUARDS = [[-.9, 9.6], [-.9, 13.2], [-.9, -9.6], [-.9, -13.2]];
  function guardOnWall(x, cam, g, t) {
    const p = [g[0], WALLH, g[1]], s = cam.proj(p); if (!s) return;
    const sc = s[3] * FIG, yaw = cam.yawOf(0);
    const pose = { hip: [0, Mo.HIP], lean: .02, bend: 0, head: .04, feet: [{ at: [-3, 0], ang: 0 }, { at: [3, 0], ang: 0 }], arms: [[.1, .15], [-.4, -.9]], hands: [{ pose: 'relaxed' }, { pose: 'relaxed' }], yaw, headYaw: yaw };
    x.save(); x.translate(s[0], s[1]); x.scale(sc, sc); Q.draw(x, PA.P, pose, LK.sol, { tilt: .2, shadow: 0, prop: (xx, pj) => { xx.strokeStyle = INK; xx.lineWidth = 1.6; xx.beginPath(); xx.moveTo(-6, 4); xx.lineTo(-10, -112); xx.stroke(); } }); x.restore();
  }

  const heatK = t => ss(T_SUMMER - .1, T_HEAT + .5, t) * (1 - .45 * ss(T_MOST, T_CAPITAL, t));
  const goldK = t => ss(T_SMELL, T_CAPITAL + .4, t);
  function sky(ctx, cam, t) {
    const sh = SH(), fh = [cam.fwd[0], 0, cam.fwd[2]], L = Math.hypot(fh[0], fh[2]) || 1, hz = cam.proj([cam.pos[0] + fh[0] / L * 1e5, cam.pos[1], cam.pos[2] + fh[2] / L * 1e5]);
    const hy = hz ? hz[1] : H / 2, hk = heatK(t), gk = goldK(t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    const g = ctx.createLinearGradient(0, hy - H * 1.1, 0, hy);
    g.addColorStop(0, mix(mix('#9fb6bd', '#d8dccf', hk), '#c9b48e', gk)); g.addColorStop(.7, mix(mix('#d3d8c8', '#efe9d6', hk), '#ecc890', gk)); g.addColorStop(1, mix(mix('#ece2c2', '#f8f1dc', hk), '#f6cf88', gk));
    ctx.fillStyle = g; ctx.fillRect(sh.x - 10, -10, W + 20, Math.max(0, Math.min(H + 20, hy + 12)));
    ctx.restore();
    const s = cam.proj([cam.pos[0] + SUNV[0] * 1e5, cam.pos[1] + SUNV[1] * 1e5, cam.pos[2] + SUNV[2] * 1e5]);
    if (s) { PR.glow(ctx, s[0] - sh.x, s[1] - sh.y, H * (.35 + .3 * hk), mix('#fff2cc', '#ffd890', gk), .55 + .3 * hk, 'paper'); PR.glow(ctx, s[0] - sh.x, s[1] - sh.y, H * .06, '#fffbea', .9, 'paper'); }
  }
  function heatGlare(ctx, cam, t) {
    const hk = heatK(t); if (hk <= 0) return;
    const sh = SH(), s = cam.proj([cam.pos[0] + SUNV[0] * 1e5, cam.pos[1] + SUNV[1] * 1e5, cam.pos[2] + SUNV[2] * 1e5]);
    const sx = s ? s[0] : (cam.toCam([cam.pos[0] + SUNV[0], cam.pos[1] + SUNV[1], cam.pos[2] + SUNV[2]])[0] < 0 ? -W * .3 : W * 1.3), sy = s ? s[1] : H * .1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    const r = Math.max(W, H) * 1.1, g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(255,250,232,${.42 * hk})`); g.addColorStop(.45, `rgba(255,246,222,${.16 * hk})`); g.addColorStop(1, 'rgba(255,246,222,0)');
    ctx.fillStyle = g; ctx.fillRect(sh.x - 10, -10, W + 20, H + 20);
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(60,52,30,${.16 * hk})`; ctx.fillRect(sh.x - 10, -10, W + 20, H + 20);
    ctx.restore();
  }
  function shimmer(x, cam, t) {
    const hk = heatK(t) * (1 - ss(T_MOST - .3, T_EARTH, t)); if (hk <= 0) return;
    x.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const X0 = xc(t) - 6 + 12 * hash(i, 1), Z = -3 + 6 * hash(i, 2), rise = frac(t * (.18 + .1 * hash(i, 3)) + hash(i, 4)), u = .15 + 2.6 * rise;
      const a = hk * Math.sin(PI * rise) * .26;
      x.strokeStyle = `rgba(255,252,240,${a})`; x.lineWidth = 1.4; x.beginPath(); let pen = false;
      for (let j = 0; j <= 12; j++) { const X = X0 + 1.6 * j / 12, q = cam.proj([X, u + .025 * Math.sin(j * 1.9 + t * 9 + i), Z]); if (!q) { pen = false; continue; } if (pen) x.lineTo(q[0], q[1]); else { x.moveTo(q[0], q[1]); pen = true; } }
      x.stroke();
    }
  }
  function goldWash(ctx, t) {
    const gk = goldK(t); if (gk <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,170,70,${.24 * gk})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  const REL = [
    [-.6, 2.9, 1.6, -17.4, 1.2, 1.6, 0, 2050], [0, 2.8, 1.6, -17.2, 1.1, 1.6, 0, 2050], [T_IMAG, 1.6, 1.58, -15.2, .7, 1.55, 0, 2100],
    [T_SECRET, .3, 1.55, -12.4, .3, 1.42, -.7, 2250], [T_DECIDED, .35, 1.52, -11.0, .4, 1.3, -1.6, 2350],
    [T_EUNUCH, .4, 1.5, -10.6, .45, 1.26, -1.9, 2450], [T_LI, .5, 1.5, -10.5, .55, 1.26, -1.9, 2450], [T_CHANC + .4, .45, 1.5, -10.4, .45, 1.3, -1.7, 2450],
    [T_HEAT + .2, .25, 1.55, -10.0, .2, 1.4, -1.2, 2550], [T_BODY + .3, .1, 1.6, -9.2, .15, 1.46, -.7, 2750], [T_CRAWL, .2, 1.65, -9.4, .0, 1.5, -.6, 2700],
    [T_HOME + .6, 4.5, 4.4, -22.0, -9.5, 5.2, 0, 1750], [T_CARTS, 4.3, 4.3, -21.6, -9.0, 4.8, .3, 1760], [T_CARRIAGE, 4.0, 4.2, -21.2, -8.5, 4.4, .5, 1770],
    [T_SMELL, 3.8, 4.2, -21.0, -8.5, 4.3, .5, 1780], [T_SMELL + .6, 3.7, 4.2, -20.9, -8.5, 4.3, .5, 1780],
  ];
  const ABS = () => [
    [T_SMELL + .6, xc(T_SMELL + .6) + 3.7, 4.2, -20.9, xc(T_SMELL + .6) - 8.5, 4.3, .5, 1780],
    [T_CAPITAL + .2, 24.0, 4.4, -14.5, 2.0, 6.6, .3, 1450],
    [T_CARGO - .2, 21.5, 3.4, -12.3, 3.0, 4.4, .5, 1520],
    [DUR, 16.5, 2.4, -9.6, 4.2, 2.7, .5, 1650], [DUR + 1.4, 15.6, 2.3, -9.3, 4.0, 2.6, .5, 1690],
  ];
  const TB0 = T_SMELL + .3, TB1 = T_SMELL + .9;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const mk = (K, j, lg) => Mo.monotone(K.map(k => [k[0], lg ? Math.log(k[j]) : k[j]]));
    const fix = (K, rel) => M45 ? K.map(k => [k[0], k[1], k[2] + .4, k[3] - 1.5, k[4] + (rel && k[0] > T_CRAWL ? 3 : !rel && k[0] < T_MOST ? 3 : 0), k[5], k[6], k[7] * .82]) : K;
    const R = fix(REL, true), A = fix(ABS(), false);
    SPL = { R: [1, 2, 3, 4, 5, 6].map(j => mk(R, j)).concat([mk(R, 7, true)]), A: [1, 2, 3, 4, 5, 6].map(j => mk(A, j)).concat([mk(A, 7, true)]) };
    return SPL;
  }
  function camAt(t) {
    const S = spl(), b = ss(TB0, TB1, t);
    let e, g, f;
    const rel = () => { const c = xc(t); return { e: [c + S.R[0](t), S.R[1](t), S.R[2](t)], g: [c + S.R[3](t), S.R[4](t), S.R[5](t)], f: Math.exp(S.R[6](t)) }; };
    const abs = () => ({ e: [S.A[0](t), S.A[1](t), S.A[2](t)], g: [S.A[3](t), S.A[4](t), S.A[5](t)], f: Math.exp(S.A[6](t)) });
    if (b <= 0) ({ e, g, f } = rel()); else if (b >= 1) ({ e, g, f } = abs()); else { const r = rel(), a = abs(); e = r.e.map((v, i) => lerp(v, a.e[i], b)); g = r.g.map((v, i) => lerp(v, a.g[i], b)); f = lerp(r.f, a.f, b); }
    const d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    return S3.camera({ pos: e, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, W, H, near: .05 });
  }

  function midParts(cam, t) {
    const parts = [];
    for (const v of LINE) carriageParts(parts, cam, v, xc(t) + v.slot, t);
    for (const c of CARTS) cartParts(parts, cam, c, t);
    for (const s of SOLDIERS) walkerPart(parts, cam, s, t);
    walkerPart(parts, cam, ZHAO, t); walkerPart(parts, cam, LISI, t);
    parts.sort((a, b) => b.d - a.d);
    return parts;
  }
  function outsideClip(x, cam, z) {
    const a = cam.proj([0, 0, z]), b = cam.proj([0, 6, z]), o = cam.proj([1.5, 2, z]); if (!a || !b || !o) return false;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, sg = (o[0] - a[0]) * nx + (o[1] - a[1]) * ny > 0 ? 1 : -1, R = 4 * (W + H);
    x.beginPath(); x.moveTo(a[0] - dx / L * R, a[1] - dy / L * R); x.lineTo(a[0] + dx / L * R, a[1] + dy / L * R);
    x.lineTo(a[0] + dx / L * R + sg * nx * R, a[1] + dy / L * R + sg * ny * R); x.lineTo(a[0] - dx / L * R + sg * nx * R, a[1] - dy / L * R + sg * ny * R); x.closePath();
    x.clip(); return true;
  }
  function frame(ctx, t, cam) {
    PA.background(ctx);
    sky(ctx, cam, t);
    PA.sheet(ctx, ID, 1, RC, x => { far(x, cam); }, { rim: false, shadow: false, fibre: .35 });
    const parts = midParts(cam, t);
    PA.sheet(ctx, ID, 1, RC, x => {
      ground(x, cam);
      city(x, cam);
      passage(x, cam);
      x.save();
      if (S3.poly(x, cam, [[0, 0, GATE.z0], [0, 0, GATE.z1], [0, GATE.h, GATE.z1], [0, GATE.h, GATE.z0]])) { x.clip(); for (const p of parts) if (p.x0 < 0) p.draw(x); }
      x.restore();
    }, { shadow: false, rimAlpha: .4 });
    PA.sheet(ctx, ID, 1, RC, x => { tower(x, cam, t); for (const b of BANNERS) banner(x, cam, b, t); }, { paperShadow: [4, 6, 6, .26], rimAlpha: .65 });
    PA.sheet(ctx, ID, 1, RC, x => {
      for (const g of GUARDS) guardOnWall(x, cam, g, t);
      wall(x, cam, t);
      parapet(x, cam);
      for (const p of PINES) if (p.far && cam.depth([p.X, 3, p.Z]) > 1) pine(x, cam, p, PINE_FAR);
    }, { paperShadow: [5, 7, 7, .34], rimAlpha: .55 });
    PA.sheet(ctx, ID, 1, RC, x => {
      for (const p of parts) {
        if (p.x1 <= 0) continue;
        if (p.x0 >= 0) { p.draw(x); continue; }
        x.save(); if (outsideClip(x, cam, p.z)) p.draw(x); x.restore();
      }
      flies(x, cam, t);
    }, { paperShadow: [3, 4, 4, .18], rimAlpha: .5 });
    const nearP = PINES.filter(p => !p.far && cam.pos[2] < p.Z - .4 && cam.depth([p.X, 3, p.Z]) > .5);
    if (nearP.length) {
      const dmin = Math.min(...nearP.map(p => cam.depth([p.X, 3, p.Z])));
      PA.sheet(ctx, ID, 1, RC, x => { for (const p of nearP) pine(x, cam, p, PINE_NEAR); }, { shadow: false, blur: clamp(14 / dmin - .4, 0, 3.5), rimAlpha: .3 });
    }
    PA.sheet(ctx, ID, 1, RC, x => shimmer(x, cam, t), { shadow: false, rim: false, fibre: 0 });
    heatGlare(ctx, cam, t);
    tags(ctx, t);
    goldWash(ctx, t);
    PA.grade(ctx, GT0 + t);
  }
  function tags(ctx, t) {
    const a1 = ss(T_ZHAO - .05, T_ZHAO + .2, t) * (1 - ss(T_SUMMER - .2, T_SUMMER + .3, t)), a2 = ss(T_LI - .05, T_LI + .2, t) * (1 - ss(T_SUMMER - .2, T_SUMMER + .3, t));
    if (a1 > 0 && AT.zhao) tag(ctx, AT.zhao, 'ZHAO GAO', a1, -1);
    if (a2 > 0 && AT.li) tag(ctx, AT.li, 'LI SI', a2, 1);
  }
  function tag(ctx, at, text, a, dx) {
    const size = M45 ? 34 : 38, padX = size * .42, padY = size * .26, sh = SH();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalAlpha = a; ctx.font = `900 ${size}px NSC`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const tw = ctx.measureText(text).width, asc = size * .74, bw = tw + 2 * padX, bh = asc + 2 * padY, rise = M45 ? 62 : 52;
    const cx = clamp(at.sx + dx * bw * .55, bw / 2 + W * .05, W * .95 - bw / 2), by = Math.max(H * .05, at.sy - rise - bh);
    ctx.strokeStyle = '#2c2824'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(at.sx, at.sy - 4); ctx.lineTo(at.sx, at.sy - rise * .45); ctx.lineTo(cx, by + bh); ctx.stroke();
    ctx.fillStyle = 'rgba(20,16,10,.3)'; ctx.fillRect(cx - bw / 2 + 3, by + 4, bw, bh);
    ctx.fillStyle = '#f5ecd8'; ctx.fillRect(cx - bw / 2, by, bw, bh);
    ctx.fillStyle = '#d9a443'; ctx.fillRect(cx - bw / 2, by + bh - 4, bw, 4);
    ctx.fillStyle = '#1b2130'; ctx.fillText(text, cx, by + padY + asc);
    ctx.restore();
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-30', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-29', dur: .9, dir: 'right' },
    sfx: [
      { t: .9, type: 'lib', dur: T_MOST, label: 'CARRIAGES ON A DIRT ROAD AT A WALK: HARNESS, HOOVES, WHEELS' },
      { t: .95, type: 'lib', dur: T_SMELL, label: 'CICADAS IN SUMMER HEAT' },
      { t: T_SECRET + .05, type: 'tick', g: .06 },
      { t: T_DECIDED, type: 'cloth', g: .05 },
      { t: T_SEAL, type: 'shimmer', g: .08 },
      { t: T_SUMMER, type: 'riser', dur: 1.4, f0: 300, f1: 700, g: .04 },
      { t: T_WORK - .1, type: 'lib', dur: T_SMELL - T_WORK + 1.2, label: 'FLIES BUZZING ROUND SOMETHING, CLOSE' },
      { t: T_BODY + .1, type: 'cloth', g: .05 },
      { t: T_LOADED, type: 'lib', dur: 3.2, label: 'CARTWHEELS ON EARTH, AN OX LOWING' },
      { t: T_SALTED + .05, type: 'shimmer', g: .08 },
      { t: T_DROWN + .3, type: 'cloth', g: .04 },
      { t: T_MOST - .1, type: 'whoosh', f0: 70, f1: 150, dur: 2.6, g: .09 },
      { t: T_EARTH, type: 'lib', dur: DUR - T_EARTH, label: 'BANNERS FLAPPING ON A CITY WALL, WIND' },
      { t: T_CARGO, type: 'rumble', dur: 1.8, g: .08 },
      { t: T_WAGON, type: 'impact', size: .25, g: .18, noSnap: true },
    ],
    api: { DUR, camAt, frame, xc },
  });
})();
