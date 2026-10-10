(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Mo = F.motion, Q = F.qin, RV = F.reversal, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-35'), DUR = C.duration, GT0 = C.T.start;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const PI = Math.PI, FIG = S3.FIG, SH = RV.SH, G = RV.GRAVE, GX = (G.x0 + G.x1) / 2, GZ = (G.z0 + G.z1) / 2;
  const A34 = () => F.getScene('seq-34').api, D34 = () => A34().DUR, D33 = () => F.getScene('seq-33').api.DUR;
  const HIM = RV.HIM, CUPR = RV.CUPR;

  const T_SECOND = 0.17, T_PSY = 0.91;
  const T_FEAR = 2.17, T_DROVE = 2.44, T_MED1 = 3.34;
  const T_MED2 = 4.58, T_MERC = 5.21, T_MANUF = 6.17, T_PARA = 7.03;
  const T_PARA2 = 8.26, T_PROOF = 9.11, T_MORE = 9.9, T_MED3 = 10.14;
  const T_POIS1 = 11.84, T_BODY = 12.53;
  const T_POIS2 = 13.56, T_JUDG = 14.5, T_SEE = 15.56, T_WHAT = 15.74, T_DOING = 16.68;
  const T_TRAP = 17.74, T_KILL = 18.51, T_HIM = 18.74;
  const T_BLIND = 19.49, T_ITSELF = 20.38;

  const CUP_T = RV.fromRoom(CUPR);
  let CY = null;
  const cupY = t => (CY || (CY = Mo.monotone([[.4, A34().cupAt(D34() + .4)[1]], [.8, A34().cupAt(D34() + .8)[1]], [1.3, -7.6], [1.75, -9.2], [2.05, CUP_T[1]], [3, CUP_T[1]]])))(t);
  function cupAt(t) {
    if (t < .8) return A34().cupAt(D34() + t);
    const k = ss(.9, 2.0, t);
    return [lerp(GX, CUP_T[0], k), Math.max(CUP_T[1], cupY(Math.min(t, 3))), lerp(GZ, CUP_T[2], k)];
  }
  const landed = t => t >= 2.05;
  const cupFill = t => .55 + .4 * ss(T_MORE - .05, T_MED3 + .35, t) - .1 * ss(T_TRAP, T_BLIND, t);

  const fearK = t => 1.25 * (1 + .35 * ss(T_FEAR - .05, T_FEAR + .5, t) + .45 * ss(T_MANUF - .05, T_PARA + .5, t) + .25 * ss(T_WHAT - .1, T_DOING + .4, t) - .15 * ss(T_TRAP, T_KILL + .4, t));
  const reachK = t => .16 * bump(t, T_DROVE - .1, T_DROVE + .5, T_MED2 - .2, T_MED2 + .6) + .08 * bump(t, T_WHAT, T_WHAT + .5, T_TRAP - .3, T_TRAP + .3);
  const leanK = t => .07 * bump(t, T_DROVE, T_MED1 + .2, T_MED2, T_MERC + .4);
  const lightK = t => (.7 + .3 * ss(T_SECOND - .05, T_SECOND + .5, t)) * (1 - .5 * ss(T_KILL - .05, T_HIM + .3, t)) + .15 * Math.sin(t * 23) * bump(t, T_KILL, T_KILL + .1, T_HIM + .2, T_HIM + .8);

  function unproj(c, sx, sy, z) {
    const X = (sx - c.cx) / c.f, Y = -(sy - c.cy) / c.f, sp = Math.sin(c.pitch), cp = Math.cos(c.pitch), sw = Math.sin(c.yaw), cw = Math.cos(c.yaw);
    const dy = Y * cp + sp, zf = -Y * sp + cp, dx = X * cw + zf * sw, dz = -X * sw + zf * cw;
    const k = Math.abs(dz) < 1e-6 ? 0 : (z - c.pos[2]) / dz; return [c.pos[0] + dx * k, c.pos[1] + dy * k, z];
  }
  function anchors(c, st) {
    const fa = S3.figureAt(c, HIM, 0);
    if (!fa) { const J = Mo.joints(RV.HPOSE), worldP = p => [HIM[0] + p[0] * FIG, -p[1] * FIG, HIM[2]]; return { head: worldP(J.head), neck: worldP(J.neck), hip: worldP(J.hip), knee: worldP(J.legs[0].knee) }; }
    const pose = { ...RV.himPose(st), yaw: fa.yaw }, J = Mo.joints(pose), hd = Math.hypot(c.pos[0] - HIM[0], c.pos[2] - HIM[2]), tilt = clamp(Math.sin(Math.atan2(c.pos[1] - .7, hd)), 0, .6);
    const at = p => { const q = Q.project(pose, p, 0, tilt); return unproj(c, fa.sx + fa.s * q[0], fa.sy + fa.s * q[1], HIM[2]); };
    return { head: at(J.head), neck: at(J.neck), hip: at(J.hip), knee: at(J.legs[0].knee) };
  }
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const qb = (A, B, Cc, s) => { const a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s; return [A[0] * a + B[0] * b + Cc[0] * c, A[1] * a + B[1] * b + Cc[1] * c, A[2] * a + B[2] * b + Cc[2] * c]; };
  function arcs(st) {
    const A1a = [CUPR[0], CUPR[1] + .062, CUPR[2]], A1b = [HIM[0] + .14, .66, HIM[2]], A2a = [HIM[0] - .04, .98, HIM[2] - .04], A2b = RV.shPt(6, 38, st), A3a = RV.shPt(14, 58, st), A3b = [CUPR[0], CUPR[1] + .072, CUPR[2]];
    const mid = (a, b, d) => add3([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], d);
    return [[A1a, mid(A1a, A1b, [0, .42, .16]), A1b], [A2a, mid(A2a, A2b, [.05, .55, .3]), A2b], [A3a, mid(A3a, A3b, [.25, .75, .45]), A3b]];
  }
  const P_BODY = A => ({ cx: (A.hip[0] + A.neck[0]) / 2 + .03, cz: HIM[2], y0: A.knee[1] + .04, y1: A.neck[1] - .03, rx: .36, rz: .44, turns: 2.4 });
  const P_HEAD = A => ({ cx: A.head[0], cz: HIM[2], y0: A.head[1] - .1, y1: A.head[1] + .12, rx: .17, rz: .19, turns: 1.5 });
  const P_EYES = A => ({ cx: A.head[0], cz: HIM[2], y0: A.head[1] + .012, y1: A.head[1] + .012, rx: .14, rz: .155, turns: 1 });
  const P_RING = A => ({ cx: A.head[0], cz: HIM[2], y0: A.head[1] + .012, y1: A.head[1] + .012, rx: .29, rz: .31, turns: 1 });
  const mixP = (a, b, k) => Object.fromEntries(Object.keys(a).map(n => [n, lerp(a[n], b[n], k)]));
  function coilP(t, A) {
    let p = P_BODY(A);
    p = mixP(p, P_HEAD(A), ss(T_POIS2 + .2, T_JUDG + .35, t));
    p = mixP(p, P_EYES(A), ss(T_SEE - .3, T_SEE + .25, t));
    p = mixP(p, P_RING(A), ss(T_TRAP - .1, T_TRAP + .55, t));
    return p;
  }
  const morphK = t => ss(T_POIS1 - .15, T_BODY + .1, t);
  const N = 40;
  function lines(t, st, A) {
    const AR = arcs(st), k = morphK(t), p = coilP(t, A), out = [];
    for (let j = 0; j < 3; j++) {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N, L = qb(...AR[j], s);
        if (k <= 0) { pts.push(L); continue; }
        const u = (j + s) / 3, a = TAU * p.turns * u + .4, Cp = [p.cx + p.rx * Math.cos(a), lerp(p.y0, p.y1, u), p.cz + p.rz * Math.sin(a)];
        pts.push([lerp(L[0], Cp[0], k), lerp(L[1], Cp[1], k), lerp(L[2], Cp[2], k)]);
      }
      out.push(pts);
    }
    return out;
  }
  const drawnK = t => [ss(T_MERC - .08, T_MERC + .5, t), ss(T_MANUF - .05, T_MANUF + .55, t), ss(T_PROOF - .05, T_PROOF + .5, t)];
  function ribbon(x, cam, P3, u, headK, a, side, wM, isBehind) {
    const n = Math.max(1, Math.round((P3.length - 1) * u)); if (u <= 0) return;
    const pts = []; for (let i = 0; i <= n; i++) { const q = cam.proj(P3[i]); if (!q) return; pts.push(q); }
    const wd = i => Math.max(1.8, wM * pts[i][3]);
    const runs = []; let cur = null;
    for (let i = 0; i <= n; i++) {
      const behind = isBehind(P3[i]), ok = side === 0 || (side < 0) === behind;
      if (ok) { if (!cur) { cur = [Math.max(0, i - 1)]; runs.push(cur); } cur.push(i); } else if (cur) { cur.push(i); cur = null; }
    }
    for (const run of runs) run.core = run.slice();
    if (side > 0) for (const run of runs) { const a = Math.max(0, run[0] - 3), b = Math.min(n, run[run.length - 1] + 3); run.length = 0; for (let i = a; i <= b; i++) run.push(i); }
    const fadeB = a < .999, B = fadeB ? bandCanvas(x, runs, pts, wd) : x;
    B.lineCap = 'round'; B.lineJoin = 'round';
    const pass = (idx, col, extra) => {
      if (idx.length < 2) return; B.strokeStyle = col;
      for (let c = 0; c < idx.length - 1;) {
        const w0 = wd(idx[c]); let e = c + 1; while (e < idx.length - 1 && Math.abs(wd(idx[e + 1]) - w0) < .06 * w0) e++;
        B.lineWidth = 2 * wd(idx[(c + e) >> 1]) + extra; B.beginPath(); for (let j = c; j <= e; j++) j > c ? B.lineTo(pts[idx[j]][0], pts[idx[j]][1]) : B.moveTo(pts[idx[j]][0], pts[idx[j]][1]); B.stroke(); c = e;
      }
    };
    for (const run of runs) pass(run.core, '#1b2130', 2.8);
    for (const run of runs) pass(run, '#dfe6f0', 0);
    if (fadeB) layBand(x, a);
    x.save(); x.globalAlpha = a; x.lineJoin = 'round';
    if (headK > .02 && (side === 0 || side === 1)) {
      const tip = pts[n], b = pts[Math.max(0, n - 3)], dx = tip[0] - b[0], dy = tip[1] - b[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, hl = .09 * tip[3] * headK, hw = .036 * tip[3] * headK;
      x.beginPath(); x.moveTo(tip[0] + ux * hl * .35, tip[1] + uy * hl * .35); x.lineTo(tip[0] - ux * hl * .65 - uy * hw, tip[1] - uy * hl * .65 + ux * hw); x.lineTo(tip[0] - ux * hl * .65 + uy * hw, tip[1] - uy * hl * .65 - ux * hw); x.closePath();
      x.fillStyle = '#dfe6f0'; x.fill(); x.strokeStyle = '#1b2130'; x.lineWidth = 1.4; x.stroke();
    }
    x.restore();
  }
  let BLC = null;
  function behindLayer(x, c, st, fn) {
    const W = x.canvas.width, H = x.canvas.height; if (!BLC || BLC[0].width !== W || BLC[0].height !== H) BLC = F.canvas(W, H);
    const L = BLC[1]; L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.setTransform(x.getTransform());
    fn(L);
    L.globalCompositeOperation = 'destination-out'; L.globalAlpha = 1; RV.himShape(L, c, st); L.globalCompositeOperation = 'source-over';
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(BLC[0], 0, 0); x.restore();
  }
  let BCV = null, BBOX = null;
  function bandCanvas(x, runs, pts, wd) {
    const W = x.canvas.width, H = x.canvas.height; if (!BCV || BCV[0].width !== W || BCV[0].height !== H) BCV = F.canvas(W, H);
    const b = BCV[1], m = x.getTransform(); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const run of runs) for (const i of run) { const r = wd(i) + 4, p = m.transformPoint({ x: pts[i][0], y: pts[i][1] }); x0 = Math.min(x0, p.x - r); y0 = Math.min(y0, p.y - r); x1 = Math.max(x1, p.x + r); y1 = Math.max(y1, p.y + r); }
    BBOX = [Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0)), Math.min(W, Math.ceil(x1)), Math.min(H, Math.ceil(y1))];
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    if (BBOX[2] > BBOX[0] && BBOX[3] > BBOX[1]) b.clearRect(BBOX[0], BBOX[1], BBOX[2] - BBOX[0], BBOX[3] - BBOX[1]);
    b.setTransform(m); return b;
  }
  function layBand(x, a) {
    const [x0, y0, x1, y1] = BBOX; if (x1 <= x0 || y1 <= y0) return;
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = a; x.drawImage(BCV[0], x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); x.restore();
  }
  function loopDraw(x, cam, t, st, side, A) {
    const L = lines(t, st, A), dn = drawnK(t), k = morphK(t), headK = ss(T_POIS2 + .2, T_JUDG + .35, t);
    const wM = lerp(.0125, .018, k) * (1 - .35 * headK) * (1 + .25 * ss(T_SEE - .3, T_SEE + .25, t) - .2 * ss(T_TRAP - .1, T_TRAP + .55, t));
    const fade = 1 - ss(T_BLIND - .05, T_BLIND + .45, t);
    const dh = cam.depth(k > 0 ? [lerp(HIM[0], A.head[0], headK), lerp(.6, A.head[1], headK), HIM[2]] : [A.head[0], .6, HIM[2]]);
    const p = coilP(t, A), E = cam.pos, ex = (E[0] - p.cx) / p.rx, ez = (E[2] - p.cz) / p.rz, e2 = ex * ex + ez * ez;
    const back = P => { const u = (P[0] - p.cx) / p.rx, v = (P[2] - p.cz) / p.rz, r2 = u * u + v * v; return r2 >= .8 * e2 ? cam.depth(P) > dh : u * ex + v * ez < r2; };
    const sb = ss(.3, .7, k);
    const one = k >= 1 && dn.every(d => d >= 1) ? [L[0].concat(L[1].slice(1), L[2].slice(1))] : L;
    one.forEach((P, j) => {
      const u = one.length === 1 ? 1 : k > 0 ? Math.max(dn[j], k) : dn[j]; if (u <= 0) return;
      const hk = 1 - ss(.05, .5, k);
      if (sb <= 0) { if (side > 0) ribbon(x, cam, P, u, hk, fade, 0, wM, back); return; }
      if (side < 0) ribbon(x, cam, P, u, hk, fade * sb, -1, wM, back);
      else { ribbon(x, cam, P, u, hk, fade, 1, wM, back); if (sb < 1) ribbon(x, cam, P, u, 0, fade * (1 - sb), -1, wM, back); }
    });
  }
  function beads(ctx, cam, t, st, A) {
    const lk = ss(T_MORE - .1, T_MORE + .3, t) * (1 - ss(T_SEE, T_SEE + .5, t)); if (lk <= 0) return;
    const L = lines(t, st, A), ph = .6 * (t - T_MORE) + .5 * ss(T_MORE, T_BODY, t) * (t - T_MORE);
    for (let i = 0; i < 9; i++) {
      const v = (((ph + i / 9) % 1 + 1) % 1) * 3, j = Math.min(2, Math.floor(v)), s = v - j, idx = Math.min(N, Math.round(s * N)), q = cam.proj(L[j][idx]); if (!q) continue;
      RV.glow(ctx, q[0], q[1], Math.max(8, .03 * q[3]), '#dfe8ff', .7 * lk);
    }
  }

  const MN = 5, MR = .1;
  const mirAt = (i, t, A) => {
    const p = P_RING(A), a = (-120 + 150 * i / (MN - 1)) * Math.PI / 180 + .3 * (1 - ss(T_BLIND - .05, T_BLIND + .6, t));
    const c = [p.cx + p.rx * Math.cos(a), p.y0, p.cz + p.rz * Math.sin(a)], n = [p.cx - c[0], 0, p.cz - c[2]], l = Math.hypot(n[0], n[2]);
    return { c, n: [n[0] / l, 0, n[2] / l], r: MR * ss(T_BLIND, T_BLIND + .55, t) };
  };
  const REFL = Q.silhouette('emperor', '#2a3046', '#6a7290');
  let RSP = null;
  const reflSprite = () => {
    if (RSP) return RSP; const S = 256, [cv, x] = F.canvas(S, S), sv = F.SHIFT; F.SHIFT = null;
    x.translate(.5 * S, 1.62 * S); x.scale(-.0235 * S, .0235 * S); Q.draw(x, LB.P, { ...RV.HPOSE, yaw: 0 }, REFL, { kneel: true, crown: true, beard: true, profile: true, tilt: 0, shadow: 0 });
    F.SHIFT = sv; return (RSP = cv);
  };
  function disc(x, cam, m, t) {
    if (m.r < .005) return;
    const u = [m.n[2], 0, -m.n[0]], face = S3.facing(cam, m.c, m.n);
    const uu = face ? u : u.map(z => -z), oo = [m.c[0] - uu[0] * m.r, m.c[1] + m.r, m.c[2] - uu[2] * m.r];
    S3.onPlane(x, cam, oo, uu.map(z => z * 2 * m.r), [0, -2 * m.r, 0], xx => {
      xx.beginPath(); xx.arc(.5, .5, .5, 0, TAU);
      if (face) {
        const g = xx.createLinearGradient(0, 0, 1, 1); g.addColorStop(0, '#e8edf6'); g.addColorStop(.45, '#8d96ac'); g.addColorStop(1, '#3a4058');
        xx.fillStyle = g; xx.fill(); xx.save(); xx.clip();
        const rk = ss(T_ITSELF - .3, T_ITSELF + .25, t);
        if (rk > .01) { xx.globalAlpha = .92 * rk; xx.drawImage(reflSprite(), 0, 0, 1, 1); }
        xx.restore();
        xx.beginPath(); xx.arc(.5, .5, .5, 0, TAU); xx.strokeStyle = '#f4f7fc'; xx.lineWidth = .05; xx.stroke();
      } else {
        xx.fillStyle = '#3a2a1c'; xx.fill();
        xx.strokeStyle = '#8a6a3c'; xx.lineWidth = .06; xx.beginPath(); xx.arc(.5, .5, .34, 0, TAU); xx.stroke(); xx.beginPath(); xx.arc(.5, .5, .47, 0, TAU); xx.stroke();
        xx.fillStyle = '#9a7a44'; xx.beginPath(); xx.arc(.5, .5, .1, 0, TAU); xx.fill();
      }
    });
  }
  function mirrors(x, cam, t, A, near) {
    if (t < T_BLIND) return;
    const dh = cam.depth(A.head);
    Array.from({ length: MN }, (_, i) => mirAt(i, t, A)).map(m => ({ m, d: cam.depth(m.c) })).filter(e => (e.d < dh) === near).sort((a, b) => b.d - a.d).forEach(e => disc(x, cam, e.m, t));
  }

  const R = (e, g, f) => [RV.fromRoom(e), RV.fromRoom(g), f];
  const KEYS = () => {
    const k0 = A34().keyAt(D34() - .4), k1 = A34().keyAt(D34()), k2 = A34().keyAt(D34() + .5);
    const fk = M45 ? .8 : 1;
    return [
      [-.4, k0.e, k0.g, k0.f], [0, k1.e, k1.g, k1.f], [.5, k2.e, k2.g, k2.f],
      [1.35, [-.25, -8.65, -3.0 + .4 * (M45 ? -1 : 0)], [-.1, -9.15, 2.0], 1050 * fk],
      [2.25, ...R([.55, 1.5, 4.7], [-.12, 1.02, .85], 1080 * fk)],
      [T_DROVE + .35, ...R([.62, 1.55, 3.45], [-.15, 1.08, .6], 1100 * fk)],
      [T_MANUF, ...R([.78, 1.5, 3.56], [-.2, 1.3, .35], 1120 * fk)],
      [T_PROOF, ...R([.95, 1.55, 3.62], [-.2, 1.4, .3], 1150 * fk)],
      [T_MED3 + .5, ...R([1.0, 1.52, 3.6], [-.18, 1.3, .4], 1150 * fk)],
      [T_BODY + .2, ...R([.8, 1.3, 2.3], [-.45, .72, 1.12], 1150 * fk)],
      [T_JUDG + .2, ...R([.62, 1.36, 2.0], [-.5, 1.08, 1.12], 1200 * fk)],
      [T_DOING, ...R([.56, 1.42, 1.92], [-.52, 1.12, 1.12], 1200 * fk)],
      [T_TRAP + .5, ...R([-.25, 1.5, 2.55], [-.5, 1.05, 1.12], 1150 * fk)],
      [T_BLIND + .3, ...R([-1.45, 1.55, 2.3], [-.45, 1.05, 1.12], 1130 * fk)],
      [DUR, ...R([-1.72, 1.6, 2.15], [-.42, 1.02, 1.12], 1120 * fk)],
      [DUR + .8, ...R([-1.76, 1.61, 2.13], [-.41, 1.02, 1.12], 1120 * fk)],
    ];
  };
  let SPL = null;
  const spline = K => { const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(K[i])])); const e = [0, 1, 2].map(j => mk(k => k[1][j])), g = [0, 1, 2].map(j => mk(k => k[2][j])), f = mk(k => Math.log(k[3])); return t => ({ e: e.map(s => s(t)), g: g.map(s => s(t)), f: Math.exp(f(t)) }); };
  const keyAt = t => (SPL || (SPL = spline(KEYS())))(t);
  const camAt = t => { const k = keyAt(t); return RV.cam(k.e, k.g, k.f, W, H); };

  function stateAt(t) {
    const s0 = A34().stateAt(D34());
    const lit2 = s0.lit[1] + (1 - s0.lit[1]) * ss(T_SECOND - .1, T_SECOND + .6, t);
    const cp = cupAt(t), inRoom = cp[1] < RV.B2.y1 - .02;
    return {
      ...s0, t: D33() + D34() + t, lit: [s0.lit[0], lit2, s0.lit[2]],
      fear: fearK(t), reach: reachK(t), lean: leanK(t), light: lightK(t),
      himSilver: bump(t, T_MERC + .25, T_MERC + .6, T_MANUF, T_MANUF + .6) + .5 * bump(t, T_POIS1, T_BODY, T_JUDG, T_SEE),
      eyes: ss(T_PARA - .1, T_PARA + .5, t), rg: .5 * ss(T_PARA - .1, T_PARA + .4, t) + .3 * ss(T_WHAT, T_DOING, t), er: .25 * bump(t, T_FEAR - .05, T_FEAR + .2, T_DROVE, T_DROVE + .4),
      cupOn: inRoom ? 1 : 0, cupAt: inRoom ? RV.toRoom(cp) : null, cupFill: cupFill(t),
    };
  }

  function frame(ctx, t, cam, o = {}) {
    const st = { ...stateAt(t), ...(o.st || {}) }, cp = cupAt(t);
    const shaftCup = (x, c) => {
      if (cp[1] < RV.B2.y1 - .02) return; const P = c.proj(cp); if (!P) return;
      x.save(); x.translate(P[0], P[1]); x.rotate(.06 * Math.sin((D34() + t) * .9)); Q.cup(x, { s: P[3] * .01, elev: .25, fill: .85, beads: [[0, 0, 1.6]], k: .2, liquid: '#e2e8f2' }); x.restore();
    };
    RV.frame(ctx, LB, cam, {
      ...st,
      b1: (x, c) => { A34().b1(x, c, D34() + t); }, b4: (x, c) => shaftCup(x, c),
      b2him: (x, c, drawHim) => { const A = anchors(c, st); mirrors(x, c, t, A, false); drawHim(); if (ss(.3, .7, morphK(t)) > 0 && t < T_BLIND + .5) behindLayer(x, c, st, Lc => loopDraw(Lc, c, t, st, -1, A)); mirrors(x, c, t, A, true); },
      b2over: (x, c) => loopDraw(x, c, t, st, 1, anchors(c, st)),
      glows: (c, cm) => {
        const R2 = RV.roomCam(cm);
        const k34 = 1 - ss(.2, 1.1, t); if (k34 > 0) { c.save(); c.globalAlpha = k34; A34().glows(c, cm, D34() + t, { noCup: true }); c.restore(); }
        const q = cm.proj([cp[0], cp[1] + .06, cp[2]]);
        if (q) {
          const travel = 1 - ss(1.7, 2.3, t), r = clamp(.9 * q[3], 26, 160), d = Math.max(0, RV.B1.y0 - cp[1]), w = ss(0, .8, t);
          RV.glow(c, q[0], q[1], r * 1.5 * lerp(1 + .45 * d, 1, w), '#f0f4ff', lerp(.55 * (1 - .3 * ss(0, 1.5, d)), .55 * travel, w)); RV.glow(c, q[0], q[1], r * .45, '#ffffff', .8 * travel);
          const gl = bump(t, T_MED2 - .1, T_MED2 + .15, T_MERC, T_MERC + .5) + bump(t, T_MORE - .1, T_MED3, T_MED3 + .5, T_MED3 + 1.1) + 1.3 * bump(t, T_WHAT - .05, T_WHAT + .3, T_DOING + .2, T_DOING + .8);
          if (gl > .01 && landed(t)) RV.glow(c, q[0], q[1], Math.max(14, .25 * q[3]), '#eef4ff', .6 * gl);
        }
        const AN = anchors(R2, st), PR = P_RING(AN);
        beads(c, R2, t, st, AN);
        const kr = bump(t, T_KILL - .05, T_KILL + .1, T_HIM + .1, T_HIM + .6);
        if (kr > .01) for (let i = 0; i < 12; i++) { const a = TAU * i / 12 + 6 * (t - T_KILL), P = [PR.cx + PR.rx * Math.cos(a), PR.y0, PR.cz + PR.rz * Math.sin(a)], qq = R2.proj(P); if (qq) RV.glow(c, qq[0], qq[1], Math.max(10, .06 * qq[3]), '#eef2ff', .6 * kr * (.4 + .6 * Math.sin(a * 3 + t * 9) ** 2)); }
        if (o.glows) o.glows(c, cm);
      },
    });
    if (!o.noText) F.impact(LB, ctx, t, { lines: [{ text: '2 · PSYCHOLOGICAL', t0: T_SECOND, size: M45 ? 76 : 104, color: '#fff1dc' }], x: .5, y: M45 ? .13 : .15, out: T_FEAR + .55, accent: '#ffc27a' });
    if (!o.noGrade) LB.grade(ctx, GT0 + t);
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-35', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .1, type: 'whoosh', f0: 160, f1: 60, dur: 1.5, g: .07 },
      { t: T_SECOND, type: 'impact', size: .3, g: .22, noSnap: true },
      { t: T_SECOND + .1, type: 'lampOn', g: .05 },
      { t: 2.05, type: 'clink', f: 1800, g: .07, noSnap: true },
      { t: T_FEAR, type: 'rumble', dur: 1.2, g: .1 },
      { t: T_DROVE + .1, type: 'cloth', g: .04 },
      { t: T_MERC, type: 'shimmer', g: .07 },
      { t: T_MANUF, type: 'riser', dur: .9, g: .06 },
      { t: T_PARA, type: 'crackle', dur: .7, rate: 30, g: .06 }, { t: T_PARA + .05, type: 'rumble', dur: 1.0, g: .1 },
      { t: T_PROOF, type: 'shimmer', g: .06 },
      { t: T_MED3 - .1, type: 'clink', f: 2200, g: .06, noSnap: true },
      { t: T_MORE, type: 'riser', dur: 1.6, f0: 300, f1: 900, g: .05 },
      { t: T_POIS1, type: 'whoosh', f0: 600, f1: 300, dur: .9, g: .05 },
      { t: T_BODY, type: 'clunk', g: .06 },
      { t: T_JUDG - .1, type: 'whoosh', f0: 500, f1: 900, dur: .7, g: .04 },
      { t: T_SEE, type: 'shimmer', g: .08 },
      { t: T_WHAT, type: 'rumble', dur: 1.4, g: .1 },
      { t: T_TRAP, type: 'whoosh', f0: 400, f1: 120, dur: .8, g: .06 },
      { t: T_KILL, type: 'clunk', g: .16 }, { t: T_KILL + .05, type: 'clink', f: 3000, g: .08, noSnap: true },
      { t: T_HIM, type: 'exhale', dur: .6, g: .05 },
      { t: T_BLIND - .05, type: 'riser', dur: .9, f0: 700, f1: 1600, g: .06 },
      { t: T_ITSELF, type: 'shimmer', g: .09 },
    ],
    api: { DUR, camAt, keyAt, stateAt, cupAt, frame },
  });
})();
