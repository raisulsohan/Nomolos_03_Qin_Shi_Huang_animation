(function () {
  'use strict';
  const F = window.FILM, { clamp, lerp, easeIO } = F;
  const INK = '#3a1e12', LIGHT = '#fff1dc';
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, u, al = 1) => { const A = rgb(a), B = rgb(b); return `rgba(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')},${al})`; };

  const FING = [
    { w: 22, l: [58, 34, 26], y: -33, k: .02, sp: -.24, cs: -.015 },
    { w: 23, l: [63, 37, 27], y: -12, k: .07, sp: -.08, cs: .02 },
    { w: 21.5, l: [59, 35, 26], y: 8.75, k: .13, sp: .08, cs: .05 },
    { w: 18, l: [46, 27, 21], y: 27, k: .24, sp: .24, cs: .09 },
  ];
  const OPEN = [2.72, 2.84, 2.94];

  function frame(x, o) { const s = o.s || 1; x.save(); x.translate(o.h[0], o.h[1]); x.scale(s * o.side, s); }
  const radius = o => Math.max(o.r, 22);
  const armDir = o => [Math.cos(o.arm) * o.side, Math.sin(o.arm)];
  function wristLocal(o) { const a = armDir(o), R = radius(o) + 11; return { p: [R + 12 + a[0] * 26, 40 + a[1] * 26], w: 48 }; }

  function joints(f, R, u) {
    let th = f.k, px = R * Math.cos(th), pz = R * Math.sin(th), py = f.y;
    const pts = [[px, py, pz]];
    for (let k = 0; k < 3; k++) {
      const d = 2 * Math.asin(Math.min(1, f.l[k] / (2 * R))), phiC = th + d / 2 + Math.PI / 2; th += d;
      const uk = easeIO(clamp(u * 1.6 - k * .3)), phi = lerp(OPEN[k], phiC, uk);
      px += Math.cos(phi) * f.l[k]; pz += Math.sin(phi) * f.l[k]; py += f.l[k] * lerp(f.sp, f.cs, uk);
      pts.push([px, py, pz]);
    }
    for (let k = 1; k < pts.length; k++) if (pts[k][2] < 0) {
      const a = pts[k - 1], b = pts[k], m = a[2] / (a[2] - b[2]);
      pts.length = k; pts.push([lerp(a[0], b[0], m), lerp(a[1], b[1], m), 0]); break;
    }
    return pts;
  }

  function tube(x, P, wd) {
    const S = [];
    for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 5; k++) {
      const m = k / 5; S.push([lerp(P[i][0], P[i + 1][0], m), lerp(P[i][1], P[i + 1][1], m), lerp(wd[i], wd[i + 1], m) * (1 + .05 * Math.exp(-k * k))]);
    }
    S.push([P[P.length - 1][0], P[P.length - 1][1], wd[wd.length - 1]]);
    const N = S.map((p, i) => { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; });
    const e = S.length - 1, aEnd = Math.atan2(N[e][1], N[e][0]) - Math.PI / 2, a0 = Math.atan2(N[0][1], N[0][0]) - Math.PI / 2;
    x.beginPath();
    S.forEach((p, i) => x.lineTo(p[0] + N[i][0] * p[2] / 2, p[1] + N[i][1] * p[2] / 2));
    x.arc(S[e][0], S[e][1], S[e][2] / 2, aEnd + Math.PI / 2, aEnd - Math.PI / 2, true);
    for (let i = e; i >= 0; i--) x.lineTo(S[i][0] - N[i][0] * S[i][2] / 2, S[i][1] - N[i][1] * S[i][2] / 2);
    x.arc(S[0][0], S[0][1], S[0][2] / 2, a0 - Math.PI / 2, a0 + Math.PI / 2, true);
    x.closePath();
    return { S, N };
  }

  function finger(x, f, R, u, skin, plain, reach) {
    const J = joints(f, R, u);
    if (reach !== undefined) { const x0 = J[0][0], k = lerp(1, (x0 - reach) / Math.max(1, x0 - J[J.length - 1][0]), easeIO(u)); for (const p of J) p[0] = x0 + (p[0] - x0) * k; }
    const P = J.map(p => [p[0], p[1]]), wd = [1, .97, .9, .82].slice(0, P.length).map(k => f.w * k);
    x.save(); x.translate(0, 2.6); tube(x, P, wd); x.fillStyle = 'rgba(70,35,18,.3)'; x.fill(); x.restore();
    const { S, N } = tube(x, P, wd); x.fillStyle = skin; x.fill();
    if (plain) return;
    x.strokeStyle = mix(skin, LIGHT, .6, .35); x.lineWidth = 1.6; x.beginPath();
    for (let i = 1; i < S.length - 2; i++) x.lineTo(S[i][0] + N[i][0] * (S[i][2] / 2 - 1.8), S[i][1] + N[i][1] * (S[i][2] / 2 - 1.8));
    x.stroke();
    x.strokeStyle = mix(skin, INK, .55, .5); x.lineWidth = 1.5;
    for (let k = 1; k < Math.min(3, P.length - 1); k++) {
      const p = P[k], q = P[k + 1], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, tx = (q[0] - p[0]) / l, ty = (q[1] - p[1]) / l, h = wd[k] * .3;
      for (const o of k === 1 ? [-1.6, 1.6] : [0]) {
        x.beginPath(); x.moveTo(p[0] + o * tx - ty * h, p[1] + o * ty + tx * h);
        x.quadraticCurveTo(p[0] + (o + 2.5) * tx, p[1] + (o + 2.5) * ty, p[0] + o * tx + ty * h, p[1] + o * ty - tx * h); x.stroke();
      }
    }
    if (P.length === 4) {
      const a = P[2], b = P[3], z = J[3][2], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const face = clamp(z / (R * .6));
      if (len > 7 && face > .05) {
        x.save(); x.translate(lerp(a[0], b[0], .62), lerp(a[1], b[1], .62)); x.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
        x.fillStyle = mix(skin, LIGHT, .42, .9 * face); x.beginPath(); x.roundRect(-len * .28, -f.w * .27, len * .56, f.w * .54, f.w * .22); x.fill();
        x.restore();
      }
    }
  }

  function backOfHand(x, o, skin) {
    const R = radius(o) + 11, a = armDir(o), W = wristLocal(o), n = [a[1], -a[0]], hw = W.w / 2;
    const A = [R - 10, -45], B = [R + 16, -47], C = [R + 27, -14], G = [R - 8, 38];
    const D = [W.p[0] + n[0] * hw, W.p[1] + n[1] * hw], E = [W.p[0] - n[0] * hw, W.p[1] - n[1] * hw];
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], m0 = mid(G, A), m1 = mid(A, B), m2 = mid(B, C), m3 = mid(G, A);
    x.fillStyle = skin; x.beginPath(); x.moveTo(m0[0], m0[1]);
    x.quadraticCurveTo(A[0], A[1], m1[0], m1[1]); x.quadraticCurveTo(B[0], B[1], m2[0], m2[1]); x.quadraticCurveTo(C[0], C[1], D[0], D[1]);
    x.lineTo(D[0] + a[0] * 18, D[1] + a[1] * 18); x.lineTo(E[0] + a[0] * 18, E[1] + a[1] * 18); x.lineTo(E[0], E[1]);
    x.quadraticCurveTo(G[0], G[1], m3[0], m3[1]); x.closePath(); x.fill();
    for (const f of FING) { x.fillStyle = mix(skin, LIGHT, .5, .28); x.beginPath(); x.ellipse(R + 2 - f.k * 40, f.y - 2, 7, f.w * .32, 0, 0, Math.PI * 2); x.fill(); }
  }

  const THUMB = { l: [40, 30], w: [25, 20], root: [18, -40, -6],
    closed: [[-.5, -.62, -.6], [-.9, -.2, -.4]], open: [[-.28, -.9, .3], [-.42, -.86, .28]] };
  function thumb(x, o, skin) {
    const R = radius(o) + 11, u = o.grip; let p = [R + THUMB.root[0], THUMB.root[1], THUMB.root[2]];
    const P = [[p[0], p[1]]];
    for (let k = 0; k < 2; k++) {
      const uk = easeIO(clamp(u * 1.5 - k * .35)), d = THUMB.open[k].map((v, i) => lerp(v, THUMB.closed[k][i], uk)), l = Math.hypot(...d);
      p = p.map((v, i) => v + d[i] / l * THUMB.l[k]); P.push([p[0], p[1]]);
    }
    tube(x, P, [THUMB.w[0], THUMB.w[1], THUMB.w[1] * .85]); x.fillStyle = skin; x.fill();
    x.strokeStyle = mix(skin, INK, .55, .45); x.lineWidth = 1.5; const q = P[1];
    x.beginPath(); x.moveTo(q[0] - 6, q[1] - 5); x.quadraticCurveTo(q[0] - 1, q[1] + 1, q[0] + 5, q[1] + 6); x.stroke();
  }

  const FT = { w: 25, l: [26, 32, 27], y: -52, k: .3, sp: -.5, cs: .07 };

  F.hand = {
    back(x, o) {
      frame(x, o);
      if (o.style === 'thumb') { const R = radius(o); for (let j = 3; j >= 0; j--) finger(x, FING[j], R + FING[j].w / 2, o.grip, o.skin, true, -(o.r + FING[j].w * .45)); }
      else thumb(x, o, o.skin);
      x.restore();
    },
    front(x, o) {
      frame(x, o); backOfHand(x, o, o.skin);
      const R = radius(o);
      if (o.style === 'thumb') finger(x, FT, R + FT.w / 2, o.grip, o.skin);
      else for (let j = 3; j >= 0; j--) finger(x, FING[j], R + FING[j].w / 2, o.grip, o.skin);
      x.restore();
    },
    wrist(o) { const s = o.s || 1, W = wristLocal(o); return { p: [o.h[0] + W.p[0] * s * o.side, o.h[1] + W.p[1] * s], w: W.w * s }; },
    wristAt(o, turn = 0) {
      const w = F.hand.wrist({ ...o, arm: o.arm - turn }); if (!turn) return w;
      const c = Math.cos(turn), s = Math.sin(turn), rx = w.p[0] - o.h[0], ry = w.p[1] - o.h[1];
      return { p: [o.h[0] + rx * c - ry * s, o.h[1] + rx * s + ry * c], w: w.w };
    },
    turned(x, o, turn, draw) { x.save(); x.translate(o.h[0], o.h[1]); x.rotate(turn); x.translate(-o.h[0], -o.h[1]); draw({ ...o, arm: o.arm - turn }); x.restore(); },
    arm(x, w, elbow, st = {}) {
      const { sleeve = '#0c0b1a', cuff = null, link = null, cuffAt = 26, taper = 2 } = st, TAU = Math.PI * 2;
      const dx = w.p[0] - elbow[0], dy = w.p[1] - elbow[1], n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n, hw = w.w / 2;
      x.fillStyle = sleeve; x.beginPath(); x.moveTo(elbow[0] + nx * hw * taper, elbow[1] + ny * hw * taper); x.lineTo(w.p[0] + nx * hw * 1.25, w.p[1] + ny * hw * 1.25); x.lineTo(w.p[0] - nx * hw * 1.25, w.p[1] - ny * hw * 1.25); x.lineTo(elbow[0] - nx * hw * taper, elbow[1] - ny * hw * taper); x.closePath(); x.fill();
      if (cuff) {
        const cf = [w.p[0] - dx / n * cuffAt, w.p[1] - dy / n * cuffAt];
        x.fillStyle = cuff; x.beginPath(); x.arc(cf[0], cf[1], hw * 1.25, 0, TAU); x.fill();
        if (link) { x.fillStyle = link; x.beginPath(); x.arc(cf[0], cf[1], hw * .27, 0, TAU); x.fill(); }
      }
    },
  };
})();
