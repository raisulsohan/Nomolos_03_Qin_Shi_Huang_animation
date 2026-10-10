(function () {
  'use strict';
  const F = FILM, M = F.motion, { TAU, clamp, lerp, smooth } = F;
  const Q = (F.qin = {});
  const parse = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const mix = (a, b, k) => { const A = parse(a), B = parse(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  Q.mix = mix;
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

  const CAST = {
    emperor: { coat: '#1d191c', trim: '#8f2b20', inner: '#efe6d2', skin: '#d9b08a', hair: '#171213', beard: '#1d1615', shoe: '#1d191c' },
    minister: { coat: '#36505a', trim: '#1f2f36', inner: '#efe6d2', skin: '#d4a984', hair: '#1d1716', beard: '#2a211d', shoe: '#1f1a18', hat: 'guan' },
    alchemist: { coat: '#4a3f5e', trim: '#2c2438', inner: '#e9e0cc', skin: '#cfa47e', hair: '#1d1716', beard: '#3a3230', shoe: '#1f1a18', hat: 'alch' },
    physician: { coat: '#7a5b3c', trim: '#4e3925', inner: '#ece2cc', skin: '#d6ab86', hair: '#1d1716', beard: '#2a211d', shoe: '#2a2018', hat: 'guan' },
    worker: { coat: '#8c6d4b', trim: '#5e4630', inner: '#d9cdb2', skin: '#c99a72', hair: '#1d1716', shoe: '#3a2d22', trouser: '#5b4a3a', hat: 'wrap', short: true },
  };
  Q.silhouette = (who, ink, beads = '#3a3530') => ({ who, coat: ink, trim: mix(ink, '#000000', .2), inner: ink, skin: ink, hair: ink, beard: ink, shoe: ink, trouser: ink, hat: CAST[who].hat, short: CAST[who].short, ink, k: 1, bead: beads });
  Q.look = (who, P, k = 0, over = {}) => {
    const c = { ...CAST[who], ...over }, sil = '#0b0a1d', m = v => v && k > 0 ? mix(v, sil, k) : v;
    return { who, coat: m(c.coat), trim: m(c.trim), inner: m(c.inner), skin: m(c.skin), hair: m(c.hair), beard: m(c.beard), shoe: m(c.shoe), trouser: m(c.trouser || c.coat), hat: c.hat, short: c.short, ink: m('#1a1514'), k };
  };

  Q.KNEE = [18.3, -5.9];
  Q.kneel = (o = {}) => {
    const bow = o.bow || 0;
    return { hip: [0, -19 + 1.5 * bow], lean: .04 + (o.lean ?? 0) + .55 * bow, bend: .1 * bow, head: (o.head ?? 0) + .25 * bow,
      feet: [{ at: [-4.2, -4.6], ang: Math.PI }, { at: [-3.8, -4.6], ang: Math.PI }],
      arms: o.arms || [[.35 + .4 * bow, .9 + .5 * bow], [.4 + .4 * bow, 1.0 + .5 * bow]],
      hands: o.hands || [{ pose: 'relaxed', k: .5 }, { pose: 'relaxed', k: .5 }], yaw: o.yaw ?? 0 };
  };
  Q.bowStand = (o = {}) => {
    const bow = o.bow || 0, p = M.stand(o.x || 0);
    return { ...p, lean: .02 + .5 * bow, bend: .12 * bow, head: .2 * bow, arms: [[.55 + .5 * bow, 1.75 + .3 * bow, -.72], [.6 + .5 * bow, 1.8 + .3 * bow, -.72]],
      hands: [{ pose: 'none' }, { pose: 'none' }], yaw: o.yaw ?? 0 };
  };

  Q.project = (pose, p, s = 0, tilt = .18) => {
    const yaw = pose.yaw ?? 0, c = Math.cos(yaw), sn = Math.sin(yaw);
    return [p[0] * c - s * sn, p[1] + (p[0] - pose.hip[0]) * sn * tilt];
  };
  Q.depth = (pose, p, s = 0) => { const yaw = pose.yaw ?? 0; return (p[0] - pose.hip[0]) * Math.sin(yaw) + s * Math.cos(yaw); };
  Q.headFrame = (pose, J) => ({ c: J.head, a: J.a2 + (pose.head || 0) });

  const CROWN = { L: 9.5, w: 5, up: -14.2, tilt: .09, strings: 7, beads: 5, gap: 2.0 };
  function crownPts(pose, J, tilt) {
    const { c, a } = Q.headFrame(pose, J), hy = (pose.headYaw ?? pose.yaw ?? 0) - (pose.yaw ?? 0);
    const at = (f, y, s) => { const r = rot([f, y], a), ch = Math.cos(hy), sh = Math.sin(hy); return { p: [c[0] + r[0] * ch - s * sh, c[1] + r[1]], s: s * ch + r[0] * sh }; };
    return { at, scr: q => Q.project(pose, q.p, q.s, tilt), dep: q => Q.depth(pose, q.p, q.s) };
  }
  Q.crown = (x, pose, J, L, part, tilt = .18) => {
    const { at, scr, dep } = crownPts(pose, J, tilt), K = CROWN, head = Q.depth(pose, J.head);
    const ink = L.ink, bead = L.bead || (L.k > .5 ? '#3a3560' : '#efe6c8'), bead2 = L.bead || (L.k > .5 ? '#2a2650' : '#c9a24a');
    const string = (f, s) => {
      const yb = K.up + f * K.tilt, top = at(f, yb + 1.5, s), d = dep(top) - head;
      if ((part === 'far') !== (d < -1.5)) return;
      const sw = Math.sin((pose.swing || 0)) * 1.2;
      for (let j = 0; j < K.beads; j++) {
        const q = scr(at(f + sw * j / K.beads, yb + 2.4 + j * K.gap, s));
        x.fillStyle = j % 2 ? bead2 : bead; x.beginPath(); x.arc(q[0], q[1], .62, 0, TAU); x.fill();
      }
      const a0 = scr(at(f, yb + 1, s)), a1 = scr(at(f + sw, yb + 2.4 + (K.beads - 1) * K.gap, s));
      x.strokeStyle = mix(ink, bead, .3); x.lineWidth = .35; x.beginPath(); x.moveTo(a0[0], a0[1]); x.lineTo(a1[0], a1[1]); x.stroke();
    };
    const sides = []; for (let i = 0; i < K.strings; i++) sides.push(-K.w + 1.2 + (2 * K.w - 2.4) * i / (K.strings - 1));
    for (const f of [-K.L + .6, K.L - .6]) for (const s of sides) string(f, s);
    if (part !== 'near') return;
    const capPts = []; for (const [f, y, w] of [[-6.4, -5, 5.6], [5.6, -6.6, 5.6], [-5, -10, 4.4], [4.2, -10.8, 4.4], [-3, -14, 3], [2.6, -14.5, 3]]) for (const s of [-w, w]) capPts.push(scr(at(f, y, s)));
    x.fillStyle = ink; x.beginPath(); convex(capPts).forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill();
    const pin = [scr(at(.5, -8.6, -8.2)), scr(at(.5, -8.6, 8.2))];
    x.strokeStyle = L.bead || (L.k > .5 ? '#2a2650' : '#c9a24a'); x.lineWidth = 1.1; x.beginPath(); x.moveTo(pin[0][0], pin[0][1]); x.lineTo(pin[1][0], pin[1][1]); x.stroke();
    const th = 1.0, corners = [[-K.L, -K.w], [K.L, -K.w], [K.L, K.w], [-K.L, K.w]];
    const top = corners.map(([f, s]) => scr(at(f, K.up + f * K.tilt - th, s))), bot = corners.map(([f, s]) => scr(at(f, K.up + f * K.tilt, s)));
    x.fillStyle = ink;
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; x.beginPath(); x.moveTo(top[i][0], top[i][1]); x.lineTo(top[j][0], top[j][1]); x.lineTo(bot[j][0], bot[j][1]); x.lineTo(bot[i][0], bot[i][1]); x.closePath(); x.fill(); }
    x.fillStyle = L.boardTop || (L.k > .5 ? '#14132e' : '#2a2224'); x.beginPath(); top.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill();
    if (tilt < .12 && !L.boardTop) { x.strokeStyle = L.k > .5 ? '#1c1638' : '#8f2b20'; x.lineWidth = .9; x.beginPath(); x.moveTo(bot[0][0], bot[0][1]); x.lineTo(bot[1][0], bot[1][1]); x.stroke(); }
  };

  Q.hair = (x, pose, J, L, tilt = .18) => {
    const hy = pose.headYaw ?? pose.yaw ?? 0, hc = Math.cos(hy), hs = Math.sin(hy);
    const C = Q.project(pose, J.head, 0, tilt), a = (J.a2 + (pose.head || 0)) * hc;
    x.save(); x.translate(C[0], C[1]); x.rotate(a);
    x.beginPath(); x.arc(0, 0, 7.05, 0, TAU); x.clip();
    x.fillStyle = L.hair; x.fillRect(-8, -8, 16, 16);
    const v = smooth((hs + .62) / .5);
    if (v > 0) {
      const xf = 4.2 * hc * (1 - .25 * Math.max(0, hs)), rx = (3.2 + 4.2 * Math.max(0, hs) + 1.4 * (1 - Math.abs(hs))) * (.35 + .65 * v);
      x.fillStyle = L.skin; x.beginPath(); x.ellipse(xf, 2.8, rx, 6.6, 0, 0, TAU); x.fill();
      for (const sd of [7, -7]) { const d = -2.8 * hs + sd * hc, X = -2.8 * hc - sd * hs; if (d < 0 || v < .3) continue; x.fillStyle = mix(L.skin, '#000000', .14); x.beginPath(); x.ellipse(X, 1.2, 1.3 + .5 * Math.abs(hs), 1.9, 0, 0, TAU); x.fill(); }
    }
    x.restore();
  };

  Q.profile = (x, pose, J, L, tilt = .18) => {
    const hy = pose.headYaw ?? pose.yaw ?? 0, hc = Math.cos(hy), k = smooth((Math.abs(hc) - .72) / .2); if (k <= 0) return;
    const { at, scr } = crownPts(pose, J, tilt), side = hc >= 0 ? 1 : -1;
    const F = [[2, -6.6], [5.6, -4.6], [6.6, -2.6], [6.7, -1.6], [7.4, -.4], [9.3, 1.6], [8.9, 2.2], [7, 2.6], [7.3, 3.4], [6.9, 3.9], [7.1, 4.6], [6.8, 5.2], [6.7, 6.4], [5.4, 7.4], [2.6, 7.8], [-1, 6.2]];
    x.fillStyle = L.skin; x.beginPath();
    F.forEach(([f, y], i) => { const q = scr(at(lerp(f * .8, f, k), y, 0)); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); });
    x.closePath(); x.fill();
  };

  Q.beard = (x, pose, J, L, tilt = .18, o = {}) => {
    const hy = pose.headYaw ?? pose.yaw ?? 0; if (Math.sin(hy) < -.4) return;
    const { at, scr } = crownPts(pose, J, tilt), col = L.beard || L.hair, fill = pts => { x.beginPath(); convex(pts.map(scr)).forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
    x.fillStyle = col;
    if (o.tuft !== false) fill([at(3.8, 5, -2), at(3.8, 5, 2), at(6.2, 4.6, -1.6), at(6.2, 4.6, 1.6), at(5.2, 10.5, 0), at(4.4, 9, 0)]);
    for (const s of [-1, 1]) fill([at(6.9, 2.6, s * .4), at(6.6, 2.9, s * 2.8), at(5.6, 5.8, s * 3.6), at(5.4, 6.3, s * 3.2), at(6.1, 3.4, s * .3)]);
  };

  Q.hat = (x, pose, J, L, tilt = .18) => {
    if (!L.hat) return;
    const { at, scr } = crownPts(pose, J, tilt), ink = L.ink, poly = pts => { x.beginPath(); pts.map(scr).forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
    x.fillStyle = ink;
    if (L.hat === 'guan') {
      poly([at(-6.5, -3, 0), at(-7, -8.5, 0), at(-2, -11.5, 0), at(5, -10.5, 0), at(6.2, -5, 0), at(6, -3, 0)]);
      poly([at(-1, -3, -6.8), at(-1, -10.5, -6.8), at(-1, -10.5, 6.8), at(-1, -3, 6.8)]);
      poly([at(-7.5, -9, 0), at(-9.5, -18, 0), at(-5.5, -19, 0), at(-2.5, -11, 0)]);
      poly([at(-6, -9, -3.5), at(-7.5, -18.5, -3.5), at(-7.5, -18.5, 3.5), at(-6, -9, 3.5)]);
      const tie = [scr(at(4.5, -6, 0)), scr(at(5.5, 4, 0))]; x.strokeStyle = ink; x.lineWidth = .8; x.beginPath(); x.moveTo(tie[0][0], tie[0][1]); x.lineTo(tie[1][0], tie[1][1]); x.stroke();
    } else if (L.hat === 'alch') {
      poly([at(-6.8, -2.5, 0), at(-9, -17, 0), at(-3, -20.5, 0), at(4.5, -16, 0), at(6.6, -4, 0)]);
      poly([at(-1, -2.5, -6.9), at(-3, -18, -5), at(-3, -18, 5), at(-1, -2.5, 6.9)]);
      x.fillStyle = L.k > .5 ? '#1a1838' : '#b08a3c';
      poly([at(-7, -4.2, 0), at(-7.2, -6, 0), at(6.6, -6, 0), at(6.6, -4.2, 0)]);
    } else if (L.hat === 'wrap') {
      poly([at(-6.8, -1.5, 0), at(-7.3, -7.5, 0), at(-2.5, -10.8, 0), at(3.5, -10, 0), at(6.6, -5, 0), at(6.4, -2, 0)]);
      poly([at(-.5, -1.5, -6.9), at(-.5, -9.8, -6.6), at(-.5, -9.8, 6.6), at(-.5, -1.5, 6.9)]);
      poly([at(-3.5, -9.5, 0), at(-5.5, -14, 0), at(-1.5, -14.5, 0), at(.5, -10.5, 0)]);
    }
  };

  Q.kneelSkirt = (x, pose, J, col, trim, tilt = .18) => {
    const yaw = pose.yaw ?? 0, kx = J.legs.reduce((m, l) => Math.max(m, l.knee[0]), -99), h = pose.hip;
    const out = [[h[0] - 9, h[1] - 10], [h[0] - 12.5, h[1] + 3], [h[0] - 14.5, 0], [kx + 7.5, 0], [kx + 9, -4], [kx + 4.5, -11], [h[0] + 9.5, h[1] - 8]];
    const pts = []; for (const p of out) for (const s of [-13.5, 13.5]) pts.push(Q.project(pose, p, s, tilt));
    const hull = convex(pts), n = hull.length, mid = i => [(hull[i][0] + hull[(i + 1) % n][0]) / 2, (hull[i][1] + hull[(i + 1) % n][1]) / 2];
    x.fillStyle = col; x.beginPath(); const m0 = mid(n - 1); x.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i), flat = Math.abs(hull[i][1]) < 1.2 && Math.abs(hull[(i + 1) % n][1]) < 1.2; flat ? (x.lineTo(hull[i][0], hull[i][1]), x.lineTo(m[0], m[1])) : x.quadraticCurveTo(hull[i][0], hull[i][1], m[0], m[1]); }
    x.closePath(); x.fill();
    const front = [kx + 6.5, 0], back = [h[0] - 13.5, 0];
    const a = Q.project(pose, back, Math.cos(yaw) > 0 ? 13.5 : -13.5, tilt), b = Q.project(pose, front, Math.cos(yaw) > 0 ? 13.5 : -13.5, tilt);
    x.strokeStyle = trim; x.lineWidth = 2.2; x.beginPath(); x.moveTo(a[0], a[1] - 1); x.lineTo(b[0], b[1] - 1); x.stroke();
  };
  function convex(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  Q.convex = convex;
  Q.SLEEVE_EXT = 6.6;
  Q.sleeve = (x, PJ, i, col, trim, sh, ext = 0) => {
    const a = PJ.arms[i], el = a.el, wr0 = a.wr, s0 = sh || PJ.sh;
    const d = [wr0[0] - el[0], wr0[1] - el[1]], L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    const wr = [wr0[0] + u[0] * ext, wr0[1] + u[1] * ext];
    const hang = 7 * (.45 + .55 * Math.max(0, Math.abs(u[0])));
    const up = n[1] < 0 ? n : [-n[0], -n[1]], dn = [-up[0], -up[1]];
    const mouthTop = [wr[0] - u[0] * 1.5 + up[0] * 5.6, wr[1] - u[1] * 1.5 + up[1] * 5.6];
    const mouthBot = [wr[0] - u[0] * 3 + dn[0] * 5.5, wr[1] - u[1] * 3 + dn[1] * 5.5 + hang];
    const elTop = [el[0] + up[0] * 3.4, el[1] + up[1] * 3.4], elBot = [el[0] + dn[0] * 3.8, el[1] + dn[1] * 3.8];
    const ctl = [wr[0] + u[0] * 1.2 + dn[0] * 2, wr[1] + u[1] * 1.2 + dn[1] * 2 + hang * .5];
    x.fillStyle = col; x.beginPath();
    x.moveTo(elTop[0], elTop[1]); x.lineTo(mouthTop[0], mouthTop[1]);
    x.quadraticCurveTo(ctl[0], ctl[1], mouthBot[0], mouthBot[1]);
    x.quadraticCurveTo(lerp(elBot[0], mouthBot[0], .55) + dn[0] * 2, lerp(elBot[1], mouthBot[1], .55) + 4 + hang * .4, elBot[0], elBot[1]);
    x.closePath(); x.fill();
    const ua = [el[0] - s0[0], el[1] - s0[1]], ul = Math.hypot(ua[0], ua[1]) || 1, un = [-ua[1] / ul * 3.3, ua[0] / ul * 3.3];
    x.beginPath(); x.moveTo(s0[0] + un[0], s0[1] + un[1]); x.lineTo(el[0] + un[0], el[1] + un[1]); x.lineTo(el[0] - un[0], el[1] - un[1]); x.lineTo(s0[0] - un[0], s0[1] - un[1]); x.closePath(); x.fill();
    if (ext > 0) {
      const mid = [(mouthTop[0] + 2 * ctl[0] + mouthBot[0]) / 4, (mouthTop[1] + 2 * ctl[1] + mouthBot[1]) / 4];
      const c = [(mouthTop[0] + mid[0]) / 2 - u[0] * .4, (mouthTop[1] + mid[1]) / 2 - u[1] * .4], ax = [mid[0] - mouthTop[0], mid[1] - mouthTop[1]];
      x.fillStyle = mix(col, '#000000', .55); x.beginPath(); x.ellipse(c[0], c[1], Math.hypot(ax[0], ax[1]) / 2 + .6, 1.5, Math.atan2(ax[1], ax[0]), 0, TAU); x.fill();
    }
    if (trim) { x.strokeStyle = trim; x.lineWidth = 1.6; x.beginPath(); x.moveTo(mouthTop[0], mouthTop[1]); x.quadraticCurveTo(ctl[0], ctl[1], mouthBot[0], mouthBot[1]); x.stroke(); }
  };
  Q.collar = (x, pose, J, L, tilt = .18) => {
    const yaw = pose.yaw ?? 0, sn = Math.sin(yaw);
    if (sn < -.35) return;
    const P = (p, s) => Q.project(pose, p, s, tilt), sh = J.sh, wa = J.waist, nk = J.neck;
    const a2 = J.a2, fwd = rot([1, 0], a2);
    const f0 = [nk[0] + fwd[0] * 2.5, nk[1] + fwd[1] * 2.5 + 2.5], f1 = [wa[0] + fwd[0] * 9, wa[1] + fwd[1] * 9 - 1];
    x.strokeStyle = L.inner; x.lineWidth = 2.6; x.lineCap = 'round';
    const A = P(f0, -2.5), B = P(f1, 3.5); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
    x.strokeStyle = L.trim; x.lineWidth = 2;
    const A2 = P([f0[0] - .5, f0[1] + .4], -3.6), B2 = P([f1[0] - .5, f1[1] + .4], 2.4); x.beginPath(); x.moveTo(A2[0] + 1, A2[1]); x.lineTo(B2[0] + 1, B2[1]); x.stroke();
    x.lineCap = 'butt'; x.lineWidth = 2.4; x.strokeStyle = L.trim;
    const s0 = P([wa[0] - 8, wa[1] + 2], 0), s1 = P([wa[0] + 9.4, wa[1] + 2], 0);
    x.beginPath(); x.moveTo(s0[0], s0[1]); x.lineTo(s1[0], s1[1]); x.stroke();
  };

  Q.reach3 = (pose, i, to, side) => {
    const J = M.joints(pose), sh = J.sh;
    let out = 0;
    for (let it = 0; it < 4; it++) {
      const co = Math.max(.25, Math.cos(out));
      M.reach(pose, i, [to[0], sh[1] + (to[1] - sh[1]) / co]);
      const [u, fo] = pose.arms[i], reachDown = Math.cos(u) * 16 + Math.cos(fo) * 15;
      out = Math.asin(clamp((side - 12.4) / Math.max(2, reachDown), -1, 1));
    }
    pose.arms = pose.arms.map((a, j) => j === i ? [a[0], a[1], out] : a);
    return pose;
  };
  Q.grip = (a, k = 4.6) => { const d = [a.wr[0] - a.el[0], a.wr[1] - a.el[1]], L = Math.hypot(d[0], d[1]) || 1; return [a.wr[0] + d[0] / L * k, a.wr[1] + d[1] / L * k]; };

  Q.cup = (x, o) => {
    const s = o.s, se = Math.max(.1, Math.sin(o.elev || .3)), ce = Math.cos(o.elev || .3), k = o.k || 0, dk = c => k ? mix(c, '#100e26', k * .85) : c;
    const R = 6.2 * s, ry = R * se, foot = 3.4 * s, fy = foot * se, footH = .5 * s * ce, stemTop = -(.5 + 1.5) * s * ce, bowlB = stemTop - .3 * s * ce, rimY = bowlB - 4.6 * s * ce;
    const g = x.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, dk('#5e3d1c')); g.addColorStop(.35, dk('#c48a42')); g.addColorStop(.55, dk('#e6b366')); g.addColorStop(1, dk('#4a2e14'));
    x.fillStyle = dk('#6b4622'); x.beginPath(); x.ellipse(0, 0, foot, fy, 0, 0, Math.PI); x.lineTo(-foot, -footH); x.ellipse(0, -footH, foot, fy, 0, Math.PI, 0, true); x.closePath(); x.fill();
    x.fillStyle = g; x.beginPath(); x.ellipse(0, -footH, foot, fy, 0, 0, TAU); x.fill();
    const neck = bowlB - .3 * s * ce;
    x.fillStyle = g; x.fillRect(-.75 * s, neck, 1.5 * s, -footH - neck);
    const bowl = new Path2D(); bowl.moveTo(-1.1 * s, bowlB);
    bowl.bezierCurveTo(-3.8 * s, bowlB - .2 * s * ce, -R, rimY + 2.2 * s * ce, -R, rimY);
    bowl.ellipse(0, rimY, R, ry, 0, Math.PI, 0, true);
    bowl.bezierCurveTo(R, rimY + 2.2 * s * ce, 3.8 * s, bowlB - .2 * s * ce, 1.1 * s, bowlB); bowl.closePath(); x.fill(bowl);
    x.save(); x.clip(bowl); x.strokeStyle = dk('#7a5226'); x.lineWidth = .35 * s; x.beginPath(); x.ellipse(0, rimY + 1.2 * s * ce, R * .97, ry * .97, 0, 0, Math.PI); x.stroke(); x.restore();
    x.fillStyle = dk('#3a2410'); x.beginPath(); x.ellipse(0, rimY, R, ry, 0, 0, TAU); x.fill();
    const fill = o.fill ?? .6;
    if (fill > 0) {
      const lr = R * .93 * Math.sqrt(fill), ly = rimY + (1 - fill) * 4.4 * s * ce, lry = lr * se;
      x.save(); x.beginPath(); x.ellipse(0, rimY, R * .97, ry * .97, 0, 0, TAU); x.clip();
      const lg = x.createRadialGradient(-lr * .3, ly - lry * .4, 0, 0, ly, lr * 1.1);
      const liq = o.liquid || '#5a3020';
      lg.addColorStop(0, dk(mix(liq, '#ffffff', .25))); lg.addColorStop(1, dk(liq));
      x.fillStyle = lg; x.beginPath(); x.ellipse(0, ly, lr, lry, 0, 0, TAU); x.fill();
      for (const [u, v, r] of o.beads || []) {
        const bx = u * lr * .8, by = ly + v * lry * .8, br = r * s, bry = br * (.55 + .45 * se);
        x.fillStyle = 'rgba(10,8,6,.35)'; x.beginPath(); x.ellipse(bx + br * .15, by + bry * .5, br, bry * .45, 0, 0, TAU); x.fill();
        const bg = x.createRadialGradient(bx - br * .35, by - bry * .45, 0, bx, by, br * 1.05);
        bg.addColorStop(0, dk('#ffffff')); bg.addColorStop(.35, dk('#dfe4ea')); bg.addColorStop(.8, dk('#8d949e')); bg.addColorStop(1, dk('#5d636c'));
        x.fillStyle = bg; x.beginPath(); x.ellipse(bx, by, br, bry, 0, 0, TAU); x.fill();
      }
      x.restore();
    }
    x.strokeStyle = dk('#f0c77c'); x.lineWidth = .3 * s; x.beginPath(); x.ellipse(0, rimY, R, ry, 0, 0, Math.PI); x.stroke();
    return { rimY, R };
  };
  Q.gourd = (x, s, k = 0) => {
    const dk = c => k ? mix(c, '#100e26', k * .85) : c, g = x.createLinearGradient(-5 * s, 0, 5 * s, 0);
    g.addColorStop(0, dk('#5a3e1c')); g.addColorStop(.4, dk('#9a7234')); g.addColorStop(1, dk('#4a3214'));
    x.fillStyle = g; x.beginPath(); x.ellipse(0, -4 * s, 4.4 * s, 4.2 * s, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(0, -10.4 * s, 2.7 * s, 2.8 * s, 0, 0, TAU); x.fill();
    x.fillRect(-1.2 * s, -8.5 * s, 2.4 * s, 2.4 * s);
    x.fillStyle = dk('#8f2b20'); x.fillRect(-.9 * s, -14.4 * s, 1.8 * s, 1.6 * s);
    x.strokeStyle = dk('#8f2b20'); x.lineWidth = .5 * s; x.beginPath(); x.moveTo(-1.6 * s, -7.6 * s); x.lineTo(1.6 * s, -7.6 * s); x.stroke();
  };

  Q.draw = (x, P, pose0, L, o = {}) => {
    const tilt = o.tilt ?? .18, long = !L.short, ext = long && o.cover !== false ? Q.SLEEVE_EXT : 0;
    const pose = ext ? { ...pose0, hands: [{ pose: 'none' }, { pose: 'none' }] } : pose0, J = M.joints(pose);
    const hide = { coat: L.coat, trouser: o.kneel ? L.coat : L.trouser, shoe: L.shoe, skin: L.skin, hair: L.hair, headColor: L.hair, head: 'bare', beard: null, moustache: null };
    let PJ0 = null;
    const PJ = M.draw(x, P, pose, {
      ...hide, kind: 'man', robe: long && !o.kneel ? (o.robe ?? 42) : null, shadow: o.shadow ?? (o.kneel ? 0 : .2), tilt, headTurn: false,
      behind: (xx, pj) => { PJ0 = pj; if (o.crown) Q.crown(xx, pose, J, L, 'far', tilt); if (long) for (const a of [0, 1]) if (!pj.arms[a].near) Q.sleeve(xx, pj, a, mix(L.coat, '#000000', .2), L.trim, Q.project(pose, J.sh, (a ? 1 : -1) * 9.2, tilt), ext); if (o.behind) o.behind(xx, pj); },
      prop: (xx, pj) => {
        Q.hair(xx, pose, J, L, tilt);
        if (o.profile) Q.profile(xx, pose, J, L, tilt);
        if (o.kneel) Q.kneelSkirt(xx, pose, J, L.coat, L.trim, tilt);
        Q.collar(xx, pose, J, L, tilt);
        if (o.beard) Q.beard(xx, pose, J, L, tilt, o.beard === true ? {} : o.beard);
        if (o.crown) Q.crown(xx, pose, J, L, 'near', tilt); else Q.hat(xx, pose, J, L, tilt);
        if (o.prop) o.prop(xx, pj);
      },
      over: (xx, pj) => { if (long) for (const a of [0, 1]) if (pj.arms[a].near) Q.sleeve(xx, pj, a, L.coat, L.trim, Q.project(pose, J.sh, (a ? 1 : -1) * 9.2, tilt), ext); if (o.over) o.over(xx, pj); },
    });
    return PJ;
  };
})();
