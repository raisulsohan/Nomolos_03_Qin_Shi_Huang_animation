(function () {
  'use strict';
  const F = FILM, { TAU, clamp, lerp, smooth } = F;
  const parse = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const mix = (F.city && F.city.mix) || ((a, b, k) => { const A = parse(a), B = parse(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); });
  const PE = (F.people = {});

  const cap = (x, a, b, r) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * r, ny = dx / l * r;
    x.beginPath(); x.moveTo(a[0] + nx, a[1] + ny); x.lineTo(b[0] + nx, b[1] + ny); x.arc(b[0], b[1], r, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
    x.lineTo(a[0] - nx, a[1] - ny); x.arc(a[0], a[1], r, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true); x.closePath(); x.fill();
  };
  const blob = (x, pts) => { F.props.smooth(x, pts); x.fill(); };
  function finger(x, base, lens, angs, r, col, nail, edge = null) {
    const pts = [base]; let p = base;
    lens.forEach((l, i) => { p = [p[0] + Math.cos(angs[i]) * l, p[1] + Math.sin(angs[i]) * l]; pts.push(p); });
    if (edge) { x.fillStyle = edge; for (let i = 0; i < lens.length; i++) cap(x, pts[i], pts[i + 1], r * (1 - i * .08) + .5); }
    x.fillStyle = col; for (let i = 0; i < lens.length; i++) cap(x, pts[i], pts[i + 1], r * (1 - i * .08));
    if (nail) {
      const a = angs[angs.length - 1], tip = pts[pts.length - 1], nr = r * .55;
      x.fillStyle = nail; x.beginPath(); x.ellipse(tip[0] - Math.cos(a) * r * .15 + Math.cos(a - Math.PI / 2) * r * .35, tip[1] - Math.sin(a) * r * .15 + Math.sin(a - Math.PI / 2) * r * .35, nr, nr * .7, a, 0, TAU); x.fill();
    }
    return pts;
  }
  const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
  const D = Math.PI / 180;

  function colours(P, o) {
    const skin = o.skin || P.skin;
    return { skin, shade: mix(skin, P.ink, .2), deep: mix(skin, P.ink, .32), light: mix(skin, P.rim || '#ffffff', .45) };
  }
  function forearm(x, P, o, C, y0, y1) {
    const L = o.arm ?? 70;
    x.fillStyle = C.skin; x.beginPath(); x.moveTo(-2, y0); x.lineTo(L * .35, y0 - 2); x.lineTo(L * .35, y1 + 2); x.lineTo(-2, y1); x.closePath(); x.fill();
    if (o.sleeve) { x.fillStyle = o.sleeve; x.beginPath(); x.moveTo(L * .3, y0 - 5); x.lineTo(L + 40, y0 - 9); x.lineTo(L + 40, y1 + 9); x.lineTo(L * .3, y1 + 5); x.closePath(); x.fill(); }
    if (o.cuff) { x.fillStyle = o.cuff; x.fillRect(L * .28, y0 - 6, 10, y1 - y0 + 12); }
  }

  const POSE = {
    pinch(x, P, o, C) {
      const k = smooth(o.k || 0);
      forearm(x, P, o, C, -10, 15);
      x.fillStyle = C.shade; const th = [[-14, 12], [lerp(-34, -30, k), lerp(22, 30, k)], [lerp(-52, -44, k), lerp(22, 34, k)]];
      cap(x, th[0], th[1], 7); cap(x, th[1], th[2], 6);
      x.fillStyle = C.light; x.beginPath(); x.ellipse(th[2][0] - 2.5, th[2][1] - 1.5, 3.4, 2.4, -.2, 0, TAU); x.fill();
      x.fillStyle = C.skin; blob(x, [[4, -10], [-20, -19], [-44, -21], [-56, -14], [-57, -2], [-42, 10], [-18, 16], [4, 15]]);
      x.fillStyle = C.shade; blob(x, [[-12, 14], [-36, 9], [-26, 17], [-8, 17]]);
      const F4 = [[-38, -16, .82, C.deep], [-45, -14, .9, C.shade], [-51, -11, .96, C.shade], [-56, -6, 1, C.skin]];
      F4.forEach(([bx, by, s, col], i) => {
        const angs = lerpA([150 * D, 102 * D, 62 * D], [165 * D, 150 * D, 140 * D], k);
        finger(x, [bx, by], [17 * s, 11 * s, 9 * s], angs, 7 * s, col, i === 3 ? C.light : null, C.deep);
      });
      x.strokeStyle = C.shade; x.lineWidth = 1.4; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-30, -18); x.quadraticCurveTo(-40, -14, -44, -4); x.stroke();
    },
    cup(x, P, o, C) {
      const k = smooth(o.k || 0), back = o.layer !== 'front', front = o.layer !== 'back';
      if (back) {
        forearm(x, P, o, C, -6, 14);
        finger(x, [-40, -3], [19, 12, 9], lerpA([186 * D, 194 * D, 204 * D], [240 * D, 300 * D, 355 * D], k), 5, C.deep, null);
        x.fillStyle = C.skin; blob(x, [[4, -6], [-20, -8], [-44, -7], [-48, 2], [-40, 12], [-18, 15], [4, 14]]);
        x.fillStyle = C.shade; blob(x, [[-6, -6], [-38, -7], [-40, -2], [-10, -1]]);
      }
      if (front) {
        finger(x, [-44, -.5], [20, 12.5, 9.5], lerpA([184 * D, 190 * D, 200 * D], [238 * D, 298 * D, 354 * D], k), 5, C.shade, null, C.deep);
        finger(x, [-43, 2.2], [21, 13, 10], lerpA([182 * D, 188 * D, 198 * D], [236 * D, 296 * D, 352 * D], k), 5.3, C.skin, C.light, C.deep);
        x.fillStyle = C.skin; cap(x, [-10, -2], [lerp(-24, -22, k), lerp(-14, -12, k)], 5.8); cap(x, [lerp(-24, -22, k), lerp(-14, -12, k)], [lerp(-33, -36, k), lerp(-22, -16, k)], 5);
        x.fillStyle = C.light; x.beginPath(); x.ellipse(lerp(-34, -37, k), lerp(-23, -17, k), 2.6, 1.9, -.8, 0, TAU); x.fill();
      }
    },
    grip(x, P, o, C) {
      forearm(x, P, o, C, -14, 16);
      x.fillStyle = C.skin; blob(x, [[4, -15], [-18, -20], [-34, -18], [-38, 0], [-34, 20], [-14, 22], [4, 17]]);
      for (let i = 0; i < 4; i++) {
        const y = -13 + i * 10.5, w = i === 3 ? 8 : 9.4;
        x.fillStyle = i % 2 ? C.skin : mix(C.skin, C.light, .25); cap(x, [-28, y], [-52, y + 1], w / 2 + .6);
        x.fillStyle = C.light; x.beginPath(); x.ellipse(-52, y + 1, 2.6, 2.2, 0, 0, TAU); x.fill();
      }
      x.strokeStyle = C.shade; x.lineWidth = 1.2; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(-30, -18 + i * 10.5); x.lineTo(-50, -17.5 + i * 10.5); x.stroke(); }
      x.fillStyle = C.skin; cap(x, [-10, -16], [-30, -24], 6.4); cap(x, [-30, -24], [-46, -22], 5.4);
      x.fillStyle = C.light; x.beginPath(); x.ellipse(-46, -24, 2.8, 2.1, 0, 0, TAU); x.fill();
    },
    write(x, P, o, C) {
      const k = o.k || 0, tip = PE.TIP.write, end = [16, -40], pen = o.pen || '#3a2e28';
      forearm(x, P, o, C, -10, 15);
      [[-26, 10, .8, C.deep], [-32, 8, .88, C.shade], [-38, 5, .94, C.shade]].forEach(([bx, by, sc, col]) =>
        finger(x, [bx, by], [15 * sc, 10 * sc, 8 * sc], [(150 - k * 4) * D, 96 * D, 38 * D], 5.4 * sc, col, C.light, C.deep));
      x.strokeStyle = pen; x.lineWidth = 5.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(tip[0] + 5.6, tip[1] - 5.2); x.lineTo(end[0], end[1]); x.stroke();
      x.strokeStyle = mix(pen, '#ffffff', .25); x.lineWidth = 1.4; x.beginPath(); x.moveTo(tip[0] + 9, tip[1] - 9.4); x.lineTo(end[0] - 3, end[1] + 1.5); x.stroke();
      x.fillStyle = mix(pen, P.ink, .5); x.beginPath(); x.moveTo(tip[0], tip[1]); x.lineTo(tip[0] + 7.6, tip[1] - 3.6); x.lineTo(tip[0] + 3.4, tip[1] - 7.6); x.closePath(); x.fill();
      x.lineCap = 'butt';
      x.fillStyle = C.skin; blob(x, [[4, -12], [-14, -20], [-32, -19], [-44, -10], [-44, 3], [-30, 11], [-10, 15], [4, 15]]);
      x.fillStyle = C.shade; blob(x, [[-6, 13], [-26, 9], [-18, 15], [-4, 15]]);
      finger(x, [-16, -6], [15, 12], [(158 - k * 3) * D, (128 - k * 4) * D], 5.8, C.skin, C.light, C.deep);
      finger(x, [-38, -14], [14, 12, 10], [(118 + k * 3) * D, (92 + k * 4) * D, (74 + k * 5) * D], 5.4, C.skin, C.light, C.deep);
      x.strokeStyle = C.shade; x.lineWidth = 1; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-24, -18); x.quadraticCurveTo(-34, -15, -40, -7); x.stroke(); x.lineCap = 'butt';
    },
  };

  PE.TIP = { write: [-60, 30] };
  PE.hand = (x, P, o) => { const C = colours(P, o); x.save(); POSE[o.pose](x, P, o, C); x.restore(); };
  PE.handAt = (x, P, o, at, angle, s = 1, flip = false) => {
    x.save(); x.translate(at[0], at[1]); x.rotate(angle + Math.PI); if (flip) x.scale(1, -1); x.scale(s, s);
    PE.hand(x, P, o); x.restore();
  };
  function taper(x, pts, ws, col) {
    const L = [], R = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      L.push([p[0] - dy / l * ws[i] / 2, p[1] + dx / l * ws[i] / 2]); R.push([p[0] + dy / l * ws[i] / 2, p[1] - dx / l * ws[i] / 2]);
    });
    x.fillStyle = col; x.beginPath(); L.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); x.fill();
    for (let i = 1; i < pts.length - 1; i++) { x.beginPath(); x.arc(pts[i][0], pts[i][1], ws[i] / 2, 0, TAU); x.fill(); }
    x.beginPath(); x.arc(pts[0][0], pts[0][1], ws[0] / 2, 0, TAU); x.fill();
  }
  PE.taper = taper;
  PE.hold = o => o.pose === 'pinch' ? [-61, 21 + 6 * smooth(o.k || 0)] : o.pose === 'cup' ? [-30, -12] : [-42, 0];
})();

(function () {
  'use strict';
  const F = FILM, { TAU, clamp, lerp } = F;
  const H = (F.hands = {});
  const parse = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const mix = (a, b, k) => { const A = parse(a), B = parse(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

  function capsule(x, a, b, r0, r1 = r0) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6, nx = -dy / l, ny = dx / l, an = Math.atan2(ny, nx);
    x.beginPath();
    x.moveTo(a[0] + nx * r0, a[1] + ny * r0); x.lineTo(b[0] + nx * r1, b[1] + ny * r1);
    x.arc(b[0], b[1], r1, an, an + Math.PI, true);
    x.lineTo(a[0] - nx * r0, a[1] - ny * r0);
    x.arc(a[0], a[1], r0, an + Math.PI, an, true);
    x.closePath(); x.fill();
  }
  function finger(x, C, base, dir, lens, bends, w, col = C.skin, tip) {
    let p = base, a = dir;
    const pts = [p], tc = tip === undefined ? C.lift(col) : tip;
    lens.forEach((l, i) => { a += bends[i] || 0; p = [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; pts.push(p); });
    for (let i = 0; i < lens.length; i++) { x.fillStyle = i === lens.length - 1 && tc ? tc : col; capsule(x, pts[i], pts[i + 1], w * (1 - i * .07) / 2, w * (1 - (i + 1) * .07) / 2); }
    return pts;
  }
  const blob = (x, pts) => {
    const n = pts.length, mid = i => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
    x.beginPath(); const m0 = mid(n - 1); x.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i); x.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    x.closePath(); x.fill();
  };
  function colours(P, o) {
    let skin = o.skin || P.skin;
    if (o.far) skin = mix(skin, P.ink, .2);
    const rim = P.rim || '#fff6df';
    return { skin, rim, shade: mix(skin, P.ink, .16), deep: mix(skin, P.ink, .3), cuff: o.cuff, lift: c => mix(c, rim, .28),
      tone: i => mix(skin, P.ink, .07 * i) };
  }
  const D = Math.PI / 180;
  const KN = [[2.35, 4.7], [.8, 5.05], [-.75, 4.95], [-2.2, 4.5]];
  const W = [1.7, 1.75, 1.62, 1.4];
  const LEN = [[2.0, 1.4, 1.05], [2.15, 1.55, 1.15], [2.0, 1.45, 1.05], [1.6, 1.15, .9]];
  function palm(x, C, bulk = 0) {
    x.fillStyle = C.skin;
    blob(x, [[-2.3, -.6], [2.3, -.6], [3.0, 2.4], [2.9 + bulk * .2, 4.9 + bulk * .3], [.8, 5.45 + bulk * .3], [-1.3, 5.3 + bulk * .25], [-2.7, 4.4], [-2.75, 1.8]]);
  }
  function cuff(x, C) {
    if (!C.cuff) return;
    x.fillStyle = C.cuff; x.beginPath(); x.moveTo(-3.1, -2.2); x.lineTo(3.1, -2.2); x.lineTo(2.95, .2); x.lineTo(-2.95, .2); x.closePath(); x.fill();
  }
  function thumb(x, C, ang, bend, lens = [2.3, 2.0], col = C.skin) { finger(x, C, [2.55, 1.15], ang, lens, [0, bend], 1.9, col); }
  function fingers(x, C, kf, spread = 0, from = 0) {
    for (let i = 3; i >= from; i--) {
      const k = clamp(kf[i] ?? kf), L = LEN[i], dir = (1.4 - i) * spread + (i - 1.4) * .06 * k;
      finger(x, C, KN[i], dir, [L[0] * (1 - .35 * k), L[1] * (1 - .6 * k), L[2] * (1 - .75 * k)], [0, 3 * D * k, 5 * D * k], W[i] * (1 + .06 * k), C.tone(i));
    }
  }
  function pen(x, C, tip, end, col) {
    x.strokeStyle = col; x.lineWidth = .85; x.lineCap = 'round'; x.beginPath(); x.moveTo(tip[0] + .6, tip[1] - .8); x.lineTo(end[0], end[1]); x.stroke(); x.lineCap = 'butt';
    x.fillStyle = mix(col, '#000000', .3); x.beginPath(); x.moveTo(tip[0], tip[1]); x.lineTo(tip[0] + 1.2, tip[1] - .25); x.lineTo(tip[0] + .5, tip[1] - 1.25); x.closePath(); x.fill();
  }
  const sm = (k, a, b) => smoothstep(clamp((k - a) / (b - a)));
  const smoothstep = t => t * t * (3 - 2 * t);

  const POSES = {
    relaxed(x, C, o) {
      const k = clamp(o.k ?? .35);
      thumb(x, C, (24 - 8 * k) * D, -(16 + 20 * k) * D);
      palm(x, C);
      fingers(x, C, k * .55, -1.2 * D);
      cuff(x, C);
    },
    fist(x, C, o) {
      palm(x, C, .8);
      fingers(x, C, 1);
      thumb(x, C, 12 * D, -78 * D, [2.4, 1.9]);
      cuff(x, C);
    },
    open(x, C, o) {
      const k = clamp(o.k ?? .4);
      thumb(x, C, (32 + 26 * k) * D, -6 * D, [2.4, 2.1]);
      palm(x, C);
      fingers(x, C, 0, (1.5 + 7 * k) * D);
      cuff(x, C);
    },
    point(x, C, o) {
      palm(x, C, .5);
      fingers(x, C, [0, 1, 1, 1], 1.5 * D);
      thumb(x, C, 14 * D, -70 * D, [2.3, 1.8]);
      cuff(x, C);
    },
    grip(x, C, o) {
      palm(x, C, .8);
      fingers(x, C, .92);
      thumb(x, C, 8 * D, -84 * D, [2.4, 2.0]);
      cuff(x, C);
    },
    pinch(x, C, o) {
      const k = clamp(o.k ?? 1), kA = sm(k, 0, .65), kB = sm(k, .12, .78), kC = sm(k, .24, .88), kD = sm(k, .36, 1);
      fingers(x, C, [0, kB, kC, kD], (1.5 + 7 * (1 - kA)) * D, 1);
      palm(x, C, .3 * kA);
      thumb(x, C, lerp(46, 12, kA) * D, lerp(-6, -4, kA) * D, [2.4, 2.1]);
      const L = LEN[0];
      finger(x, C, KN[0], lerp(10, -20, kA) * D, [L[0], L[1] * lerp(1, .95, kA), L[2]], [0, 95 * D * kA, 75 * D * kA], W[0]);
      cuff(x, C);
    },
    press(x, C, o) {
      const k = clamp(o.k ?? 1), L = LEN[0];
      palm(x, C, .5);
      fingers(x, C, [0, 1, 1, 1], 1.5 * D, 1);
      finger(x, C, KN[0], 0, [L[0], L[1], L[2] * (1 - .18 * k)], [0, -14 * D * (1 - k), -20 * D * (1 - k)], W[0] * (1 + .2 * k));
      thumb(x, C, 14 * D, -70 * D, [2.3, 1.8]);
      cuff(x, C);
    },
    rest(x, C, o) {
      const d = clamp(o.k ?? .5);
      finger(x, C, [-.45, 4.4], -4 * D, [1.8, 1.35, 1.0], [0, -12 * D * d, -26 * D * d], 1.5, C.deep);
      finger(x, C, [.15, 4.65], -2 * D, [2.15, 1.55, 1.15], [0, -12 * D * d, -26 * D * d], 1.6, C.shade);
      x.fillStyle = C.skin; blob(x, [[-1.7, -.6], [1.7, -.6], [2.1, 2.4], [1.9, 4.7], [-.2, 5.2], [-1.6, 4.4], [-2.2, 2.2]]);
      finger(x, C, [.72, 4.45], 0, [2.0, 1.45, 1.1], [0, -9 * D * d, -20 * D * d], 1.65);
      finger(x, C, [-.75, 1.4], 7 * D, [2.2, 1.8], [0, 8 * D * (1 - d)], 1.85);
      cuff(x, C);
    },
    write(x, C, o) {
      const k = clamp(o.k || 0), col = o.pen || '#3a2e28', tip = H.TIP.write;
      finger(x, C, [-1.2, 3.8], -14 * D, [1.6, 1.3], [0, -75 * D], 1.4, C.deep);
      finger(x, C, [-.55, 4.2], -8 * D, [1.9, 1.45], [0, -70 * D], 1.55, C.shade);
      pen(x, C, tip, [5.0, -.8], col);
      x.fillStyle = C.skin; blob(x, [[-1.7, -.6], [1.7, -.6], [2.2, 2.4], [1.9, 4.6], [-.2, 5.2], [-1.7, 4.5], [-2.3, 2.2]]);
      finger(x, C, [.6, 4.5], -8 * D, [2.0, 1.45, 1.1], [0, (-16 - 4 * k) * D, (-24 - 4 * k) * D], 1.65);
      finger(x, C, [-.5, 1.7], -6 * D, [2.2, 1.9], [0, -18 * D], 1.8);
      cuff(x, C);
    },
  };
  H.POSES = Object.keys(POSES);
  H.TIP = { write: [-2.0, 8.4] };
  H.WRIST = { write: .35 };
  H.draw = (x, P, o = {}) => { const C = colours(P, o); x.save(); (POSES[o.pose] || POSES.relaxed)(x, C, o); x.restore(); };
  H.bend = (o, sx = 1) => (o.wrist ?? H.WRIST[o.pose] ?? 0) * (sx < 0 ? -1 : 1);
  H.at = (x, P, wrist, fore, o = {}, s = 1, sx = 1) => { x.save(); x.translate(wrist[0], wrist[1]); x.rotate(-fore + H.bend(o, sx)); x.scale(s * sx, s); H.draw(x, P, o); x.restore(); };
  H.hold = o => o.pose === 'grip' ? [.4, 5.7] : o.pose === 'pinch' ? [3.5, 5.8] : [.4, 5.4];

})();

(function () {
  'use strict';
  const F = FILM, PE = F.people, { TAU, clamp, lerp, smooth } = F;
  const parse = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const mix = (a, b, k) => { const A = parse(a), B = parse(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const M = (F.motion = {});

  const THIGH = 22.5, SHIN = 22.5, REACH = 44.4, WAIST = 13, CHEST = 11, NECK = 3.2, SKULL = 11;
  const UPPER = 16, FORE = 15;
  const SOLE = 3, HEEL = -4, BALL = 10;
  M.HIP = -46.8; M.REACH = REACH; M.HANDS = .16;
  M.RATE = 30;
  M.pose = (t, rate = M.RATE) => Math.floor(t * rate + 1e-6) / rate;
  function ik(h, a, l1, l2) {
    const dx = a[0] - h[0], dy = a[1] - h[1], L = Math.hypot(dx, dy) || 1e-6, d = Math.min(L, l1 + l2 - 1e-3);
    const base = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const k1 = [h[0] + Math.cos(base - A) * l1, h[1] + Math.sin(base - A) * l1], k2 = [h[0] + Math.cos(base + A) * l1, h[1] + Math.sin(base + A) * l1];
    return [k1[0] > k2[0] ? k1 : k2, L > d ? [h[0] + dx / L * d, h[1] + dy / L * d] : a];
  }
  function shoe(x, at, ang, col, sole) {
    x.save(); x.translate(at[0], at[1]); x.rotate(ang);
    x.fillStyle = col; x.beginPath(); x.moveTo(-3.8, -1.8); x.lineTo(-4, 2.6); x.lineTo(10, 2.8); x.quadraticCurveTo(10.8, .8, 8.6, -.8); x.lineTo(2.6, -2.8); x.lineTo(-1.6, -3.4); x.closePath(); x.fill();
    if (sole) { x.fillStyle = sole; x.fillRect(-4, 1.6, 14, 1.4); }
    x.restore();
  }
  function headwear(x, o, hx, hy, col) {
    x.fillStyle = col;
    if (o.head === 'turban') { x.beginPath(); x.ellipse(hx - .6, hy - 4.2, 8.3, 5.6, 0, Math.PI, 0); x.fill(); x.beginPath(); x.ellipse(hx, hy - 3.6, 8.7, 2.7, -.12, 0, TAU); x.fill(); }
    else if (o.head === 'cap') { x.beginPath(); x.ellipse(hx - .6, hy - 5, 7.1, 3.7, 0, Math.PI, 0); x.fill(); }
    else if (o.head === 'topi') { x.beginPath(); x.ellipse(hx, hy - 4.5, 8.5, 7.6, 0, Math.PI, 0); x.fill(); x.beginPath(); x.ellipse(hx, hy - 4, 12.8, 2.7, 0, 0, TAU); x.fill(); }
    else if (o.head === 'drape') { x.beginPath(); x.moveTo(hx - 8.4, hy + 2); x.quadraticCurveTo(hx - 8.8, hy - 9.6, hx + 1, hy - 8.8); x.quadraticCurveTo(hx + 7.6, hy - 7.8, hx + 7.6, hy - 2.2); x.lineTo(hx + 1.6, hy - 3); x.quadraticCurveTo(hx - 3, hy - 3.2, hx - 3.8, hy + 4); x.lineTo(hx - 10.5, hy + 24); x.lineTo(hx - 12.5, hy + 12); x.closePath(); x.fill(); }
    else if (o.head === 'bare') { x.fillStyle = o.hair || '#2a211c'; x.beginPath(); x.arc(hx - .6, hy - .6, 7.3, Math.PI * .8, Math.PI * 1.72); x.closePath(); x.fill(); }
  }

  M.foot = (ax, ang = 0, lift = 0) => {
    const px = ang < 0 ? HEEL : BALL, c = Math.cos(ang), s = Math.sin(ang);
    return { at: [ax + px - (c * px - s * SOLE), -lift - (s * px + c * SOLE)], ang, ax, lift };
  };

  M.stand = (x0 = 0) => ({
    hip: [x0, M.HIP], lean: .02, bend: 0, head: 0,
    feet: [M.foot(x0 - 1.5), M.foot(x0 + 1.5)],
    arms: [[.08, .22], [.1, .26]], hands: [{ pose: 'relaxed', k: .45 }, { pose: 'relaxed', k: .45 }],
  });

  const lerpV = (a, b, k) => Array.isArray(a) ? a.map((v, i) => lerpV(v, b[i], k)) : typeof a === 'number' ? lerp(a, b, k) : k < .5 ? a : b;
  M.mixPose = (a, b, k) => {
    if (k <= 0) return a; if (k >= 1) return b;
    const o = {};
    for (const key of ['hip', 'lean', 'bend', 'head']) o[key] = lerpV(a[key] ?? 0, b[key] ?? 0, k);
    const arm3 = v => [v[0], v[1], v[2] || 0];
    o.arms = a.arms.map((v, i) => lerpV(arm3(v), arm3(b.arms[i]), k));
    for (const key of ['yaw', 'headYaw']) if (a[key] != null || b[key] != null) o[key] = lerp(a[key] ?? b[key], b[key] ?? a[key], k);
    if (a.root || b.root) o.root = lerpV(a.root || b.root, b.root || a.root, k);
    o.feet = a.feet.map((f, i) => { const g = b.feet[i];
      return f.ax != null && g.ax != null ? M.foot(lerp(f.ax, g.ax, k), lerp(f.ang, g.ang, k), lerp(f.lift || 0, g.lift || 0, k)) : { at: lerpV(f.at, g.at, k), ang: lerp(f.ang, g.ang, k) }; });
    o.hands = (k < .5 ? a : b).hands;
    return o;
  };
  M.keys = (keys, o = {}) => {
    for (let i = 1; i < keys.length; i++) if (!(keys[i][0] >= keys[i - 1][0])) throw new Error(`F.motion.keys: key ${i} at ${keys[i][0]} comes before key ${i - 1} at ${keys[i - 1][0]}`);
    const at = t => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
        const [t0, p0] = keys[i - 1], [t1, p1, e] = keys[i];
        return M.mixPose(p0, p1, (e || smooth)((t - t0) / (t1 - t0)));
      }
      return keys[keys.length - 1][1];
    };
    return t => {
      const p = { ...at(t) }, lag = o.lag || {};
      if (lag.arms) p.arms = at(t - lag.arms).arms;
      if (lag.head) p.head = at(t - lag.head).head;
      return p;
    };
  };

  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  M.joints = pose => {
    const hip = pose.hip, a1 = pose.lean || 0, a2 = a1 + (pose.bend || 0);
    const waist = add(hip, rot([0, -WAIST], a1)), sh = add(waist, rot([1.2, -CHEST], a2));
    const neck = add(sh, rot([.3, -NECK], a2)), head = add(neck, rot([.4, -SKULL], a2 + (pose.head || 0) * .5));
    const legs = pose.feet.map(f => { const [knee, ank] = ik(hip, f.at, THIGH, SHIN); return { knee, ank, ang: f.ang }; });
    const arms = pose.arms.map(([u, f, out = 0]) => {
      const co = Math.cos(out), so = Math.sin(out), ey = Math.cos(u) * UPPER, wy = Math.cos(f) * FORE;
      const el = add(sh, [Math.sin(u) * UPPER, ey * co]), wr = add(el, [Math.sin(f) * FORE, wy * co]);
      return { el, wr, fore: f, sEl: ey * so, sWr: (ey + wy) * so };
    });
    return { hip, waist, sh, neck, head, legs, arms, a1, a2 };
  };

  const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const HIPW = 4.4, SHW = 9.2;
  let PROJ_F = 0, TILT = .18;
  const proj = (p, s, yaw) => [p[0] * Math.cos(yaw) - s * Math.sin(yaw), p[1] + (p[0] - PROJ_F) * Math.sin(yaw) * TILT];
  const depthOf = (p, s, yaw) => (p[0] - PROJ_F) * Math.sin(yaw) + s * Math.cos(yaw);
  const COAT = [['U', -16, -3.6, 4, 8.6], ['U', -12, -7.8, 8.6, 10], ['U', -6, -8.2, 9.1, 10.2], ['L', -11, -8.4, 9, 10.4], ['L', -5, -9, 9.3, 10.7],
    ['L', 1, -9.8, 9.6, 11], ['S', 7, -8, 10, 11.5], ['S', 21, -10.2, 10.4, 12.2]];
  const SHOE = [[-3.8, -1.8], [-4, 2.6], [10, 2.8], [10.6, 1.4], [10.2, .1], [8.6, -.8], [2.6, -2.8], [-1.6, -3.4]];
  function shoeAt(x, at, ang, yaw, col, sole) {
    const c = Math.cos(yaw), sn = Math.sin(yaw), ca = Math.cos(ang), sa = Math.sin(ang), W2 = 2.3;
    const pt = (p, s) => { const u = p[0] * ca - p[1] * sa, v = p[0] * sa + p[1] * ca; return [at[0] + u * c - s * sn, at[1] + v]; };
    const poly = ps => { x.beginPath(); ps.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
    x.fillStyle = col;
    for (const s of [-W2, W2]) poly(SHOE.map(p => pt(p, s)));
    if (Math.abs(sn) > .02) SHOE.forEach((a, i) => { const b = SHOE[(i + 1) % SHOE.length]; poly([pt(a, -W2), pt(b, -W2), pt(b, W2), pt(a, W2)]); });
    if (sole) { x.fillStyle = sole; const near = sn > 0 ? -W2 : W2, sp = [[-4, 1.6], [10, 1.6], [10, 3], [-4, 3]]; poly(sp.map(p => pt(p, near))); if (Math.abs(sn) > .02) poly([pt([-4, 3], -W2), pt([10, 3], -W2), pt([10, 3], W2), pt([-4, 3], W2)]); }
  }
  function headwearView(x, o, hx, hy, col, view, flip) {
    x.save(); x.translate(hx, hy); if (flip) x.scale(-1, 1); x.fillStyle = col;
    if (view === 'side') headwear(x, o, 0, 0, col);
    else if (o.head === 'turban') { x.beginPath(); x.ellipse(0, -4.2, 8.4, 5.8, 0, Math.PI, 0); x.fill(); x.beginPath(); x.ellipse(0, -3.6, 8.9, 2.7, 0, 0, TAU); x.fill(); }
    else if (o.head === 'cap') { x.beginPath(); x.ellipse(0, -5, 7.2, 3.8, 0, Math.PI, 0); x.fill(); }
    else if (o.head === 'topi') { x.beginPath(); x.ellipse(0, -4.5, 8.5, 7.6, 0, Math.PI, 0); x.fill(); x.beginPath(); x.ellipse(0, -4, 12.8, 2.7, 0, 0, TAU); x.fill(); }
    else if (o.head === 'drape') { x.beginPath(); x.arc(0, 0, 8, Math.PI * 1.02, Math.PI * 1.98); x.lineTo(9, 17); x.lineTo(6.8, 15); if (view === 'front') { x.lineTo(5.8, 2); x.quadraticCurveTo(0, -5, -5.8, 2); } else { x.lineTo(6, 8); x.lineTo(-6, 8); } x.lineTo(-6.8, 15); x.lineTo(-9, 17); x.closePath(); x.fill(); }
    else if (o.head === 'bare') { x.fillStyle = o.hair || '#2a211c'; x.beginPath(); x.arc(0, -1.5, 7.1, Math.PI * (view === 'back' ? .9 : 1.05), Math.PI * (view === 'back' ? 2.1 : 1.95)); x.closePath(); x.fill(); }
    x.restore();
  }
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (c, a, b) => (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]), lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function faceTurn(x, P, o, hyaw, skin) {
    const hc = Math.cos(hyaw), at = (r, a, y) => [r * Math.cos(hyaw + a), y];
    const poly = ps => { x.beginPath(); ps.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
    const nose = hull([at(6.1, -.12, -2.1), at(6.1, .12, -2.1), at(9.3, 0, 1.5), at(6, -.19, 2.4), at(6, .19, 2.4)]);
    x.fillStyle = skin; poly(nose);
    x.save(); x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.clip(); x.fillStyle = mix(skin, P.ink, .16 * smooth((.97 - Math.abs(hc)) / .3)); poly(nose); x.restore();
    if (o.beard) { x.fillStyle = o.beard; x.beginPath(); if (Math.abs(hc) > .5) { x.save(); x.scale(Math.sign(hc), 1); x.moveTo(5.8, 3); x.quadraticCurveTo(3.5, 13, -3, 6); x.lineTo(-1, 2.5); x.closePath(); x.fill(); x.restore(); } else { x.moveTo(-5 + hc * 3, 3); x.quadraticCurveTo(hc * 3, 16, 5 + hc * 3, 3); x.closePath(); x.fill(); } }
    const mk = o.moustache ? smooth((Math.abs(hc) - .86) / .12) : 0;
    if (mk > 0) { x.fillStyle = o.moustache; x.beginPath(); x.ellipse(hc * 5.9, 3.3, 1.9 * Math.abs(hc) * mk, .75 * mk, -.15 * hc, 0, TAU); x.fill(); }
  }
  function headwearTurn(x, o, hx, hy, col, hc) {
    const k = Math.abs(hc);
    x.save(); x.translate(hx, hy); x.fillStyle = col;
    if (o.head === 'turban') { x.beginPath(); x.ellipse(-.6 * hc, -4.2, 8.35, 5.7, 0, Math.PI, 0); x.fill(); x.beginPath(); x.ellipse(0, -3.6, 8.8, 2.7, -.12 * hc, 0, TAU); x.fill(); }
    else if (o.head === 'cap') { x.beginPath(); x.ellipse(-.6 * hc, -5, 7.15, 3.75, 0, Math.PI, 0); x.fill(); }
    else if (o.head === 'topi') { x.beginPath(); x.ellipse(0, -4.5, 8.5, 7.6, 0, Math.PI, 0); x.fill(); x.beginPath(); x.ellipse(0, -4, 12.8, 2.7, 0, 0, TAU); x.fill(); }
    else if (o.head === 'bare') {
      x.fillStyle = o.hair || '#2a211c'; x.beginPath();
      x.arc(-.6 * hc, lerp(-1.5, -.6, k), lerp(7.1, 7.3, k), Math.PI * (1.05 - (hc > 0 ? .25 : .23) * hc), Math.PI * (1.95 - (hc > 0 ? .23 : .25) * hc)); x.closePath(); x.fill();
    }
    x.restore();
  }
  M.draw = (x, P, pose, o = {}) => {
    const J = M.joints(pose), woman = o.kind === 'woman', yaw = (pose.yaw ?? 0) + (o.dir === -1 ? Math.PI : 0);
    const BODY = !o.part || o.part === 'body', FAR = !o.part || o.part === 'far', NEAR = !o.part || o.part === 'near';
    PROJ_F = pose.hip[0]; TILT = o.tilt ?? .18;
    const root = pose.root || [0, 0];
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const skin = o.skin || P.skin, coat = o.coat || P.coat, trou = o.trouser || P.trouser, far = c => mix(c, P.ink, .22);
    const shoeC = o.shoe || mix(P.wood, P.ink, .45), sole = mix(shoeC, P.ink, .5);
    const L1 = v => add(J.hip, rot(v, J.a1)), U = v => add(J.waist, rot(v, J.a2));
    const shade = d => d < 0;
    x.save(); x.translate(root[0], 0);
    if (BODY && o.shadow !== 0) {
      const up = clamp((M.HIP - J.hip[1]) / 40), k = 1 - .45 * up, hx = proj(J.hip, 0, yaw)[0];
      x.fillStyle = F.rgba(F.hex(P.ink), (o.shadow ?? .2) * k); x.beginPath(); x.ellipse(hx + 2 * cy, .5, (17 * Math.abs(cy) + 12 * Math.abs(sy)) * k, 2.6 * k, 0, 0, TAU); x.fill();
    }
    const arms = J.arms.map((a, i) => {
      const sg = i ? 1 : -1, s = sg * SHW, sh = proj(J.sh, s, yaw), el = proj(a.el, s + sg * (1.8 + a.sEl), yaw), wr = proj(a.wr, s + sg * (3.2 + a.sWr), yaw);
      return { i, s, d: depthOf(J.sh, s, yaw) + .01 * i, sh, el, wr };
    });
    const PJ = { ...J, sh: proj(J.sh, SHW, yaw), arms: arms.map(a => ({ el: a.el, wr: a.wr, near: a.d >= 0 })), yaw };
    if (BODY && o.behind) o.behind(x, PJ);
    const legs = J.legs.map((l, i) => {
      const s = (i ? 1 : -1) * HIPW, fy = pose.feet[i].yaw ?? yaw;
      return { i, s, fy, d: depthOf(l.knee, s, yaw), hip: proj(J.hip, s, yaw), knee: proj(l.knee, s * 1.05, yaw), ank: proj(l.ank, s * 1.1, fy), ang: l.ang };
    }).sort((a, b) => a.d - b.d);
    const drawArm = a => {
      const back = shade(a.d), col = back ? far(coat) : coat, sk = back ? far(skin) : skin, hand = (pose.hands || [])[a.i] || { pose: 'relaxed', k: .35 };
      if (!back && o.armEdge !== false) PE.taper(x, [a.sh, a.el, a.wr], [7.8, 6.8, 6], mix(coat, P.ink, .3));
      PE.taper(x, [a.sh, a.el, a.wr], [6.4, 5.4, 4.6], col);
      const fore = Math.atan2(a.wr[0] - a.el[0], a.wr[1] - a.el[1]), flip = cy < 0 ? -1 : 1;
      if (hand.pose === 'none') return;
      if (F.hands.POSES.includes(hand.pose)) F.hands.at(x, P, a.wr, fore, { k: .35, ...hand, skin: sk, cuff: mix(col, P.ink, .28) }, 1, lerp(1, .6, Math.abs(sy)) * flip);
      else { x.save(); x.translate(a.wr[0], a.wr[1]); x.rotate(Math.atan2(Math.cos(fore), Math.sin(fore))); x.scale(-M.HANDS, M.HANDS * flip); PE.hand(x, P, { ...hand, skin: sk, arm: 0 }); x.restore(); }
    };
    if (FAR) arms.filter(a => a.d < 0).forEach(drawArm);
    for (const l of BODY ? legs : []) {
      const col = shade(l.d) ? far(trou) : trou;
      PE.taper(x, [l.hip, [lerp(l.hip[0], l.knee[0], .5), lerp(l.hip[1], l.knee[1], .5)], l.knee, [lerp(l.knee[0], l.ank[0], .3), lerp(l.knee[1], l.ank[1], .3)], l.ank], [9.6, 8.6, 7.2, 7.6, 5.2], col);
      shoeAt(x, l.ank, l.ang, l.fy, shade(l.d) ? far(shoeC) : shoeC, sole);
    }
    if (!BODY) { if (NEAR) arms.filter(a => a.d >= 0).forEach(drawArm); x.restore(); return PJ; }
    const th = norm(J.legs.reduce((s, l) => [s[0] + l.knee[0] - J.hip[0], s[1] + l.knee[1] - J.hip[1]], [0, 0]));
    const kd = .85 * smooth(((th[1] < 0 ? 1 : th[0]) - .25) / .55), dvec = norm([lerp(0, th[0], kd), lerp(1, th[1], kd)]), sway = pose.sway ?? o.sway ?? 0;
    const outline = secs => {
      const E = secs.map(([B, Fr, b]) => {
        const C = [(B[0] + Fr[0]) / 2, (B[1] + Fr[1]) / 2], A = [(Fr[0] - B[0]) / 2, (Fr[1] - B[1]) / 2], ph = Math.atan2(-b * sy, A[0] * cy);
        const at = p => [C[0] * cy + A[0] * cy * Math.cos(p) - b * sy * Math.sin(p), C[1] + A[1] * Math.cos(p)];
        return [at(ph), at(ph + Math.PI)];
      });
      x.beginPath();
      for (let i = 1; i < E.length; i++) { const q = hull([...E[i - 1], ...E[i]]); if (q.length < 3) continue; q.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); }
      x.fill();
    };
    const nrm = [dvec[1], -dvec[0]], up = smooth(-th[1] / .5);
    const sec = ([fr, y, back, front, b]) => {
      if (fr === 'S') {
        const yy = y * lerp(1, .78, up), bk = lerp(back, Math.max(back, -5.5), up);
        const m = add(J.hip, [dvec[0] * yy + (y > 15 ? sway : 0), dvec[1] * yy]); return [add(m, [nrm[0] * bk, nrm[1] * bk]), add(m, [nrm[0] * front, nrm[1] * front]), b];
      }
      const f = fr === 'U' ? U : L1, yl = fr === 'L' && y > 0 ? y + 4.5 * up : y; return [f([back, yl]), f([front, yl]), b];
    };
    if (woman) {
      const ax = J.legs.map(l => l.ank[0]), front = Math.max(...ax) * .55 + J.hip[0] * .45 + 7, back = Math.min(...ax) * .55 + J.hip[0] * .45 - 6;
      x.fillStyle = trou; outline([sec(['L', -4, -8.5, 8.5, 8.6]), [[back, -1.5], [front, -1.5], 13.5]]);
      x.fillStyle = coat; outline([sec(['U', -14, -6.8, 7.4, 8.6]), sec(['L', -3, -8.4, 8.4, 8.6])]);
    } else {
      const secs = o.robe ? [...COAT.slice(0, -1), ['S', 21, -10.6, 10.8, 12.6], ['S', o.robe, -12.6, 13, 14.2]] : o.hem === 0 ? COAT.filter(c => c[0] !== 'S') : COAT;
      x.fillStyle = coat; outline(secs.map(sec));
    }
    const hy = pose.headYaw ?? yaw, hc = Math.cos(hy), hs = Math.sin(hy), H = proj(J.head, 0, yaw), N = proj(J.neck, 0, yaw);
    x.fillStyle = skin; x.save(); x.translate(N[0], N[1]); x.rotate(J.a2 * hc); x.fillRect(-2.4, -6, 4.8, 8); x.restore();
    const ear = s => { const d = -2.8 * hs + s * hc; return { d, X: H[0] - 2.8 * hc - s * hs }; }, ears = [ear(7), ear(-7)];
    const drawEar = e => { x.fillStyle = mix(skin, P.ink, .12); x.beginPath(); x.ellipse(e.X, H[1] + .8, 1.3 + .5 * Math.abs(hs), 1.9, 0, 0, TAU); x.fill(); };
    ears.filter(e => e.d < 0).forEach(drawEar);
    const view = Math.abs(hc) > .62 ? 'side' : hs > 0 ? 'front' : 'back';
    x.save(); x.translate(H[0], H[1]); x.rotate((J.a2 + (pose.head || 0)) * hc);
    x.fillStyle = skin; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.fill();
    if (o.hair && o.head !== 'bare' && view === 'back') { x.fillStyle = o.hair; x.beginPath(); x.arc(0, -.5, 7.1, Math.PI * .85, Math.PI * 2.15); x.fill(); }
    const turning = !!o.headTurn && hs > -.05 && o.head !== 'drape';
    if (turning) faceTurn(x, P, o, hy, skin);
    else if (hs > -.3) {
      x.fillStyle = skin;
      if (Math.abs(hc) > .3) { x.save(); x.scale(hc, 1); x.beginPath(); x.moveTo(6.2, -2.4); x.lineTo(9.3, 1.4); x.lineTo(6, 2.4); x.closePath(); x.fill(); x.restore(); }
      else { x.fillStyle = mix(skin, P.ink, .16); x.beginPath(); x.moveTo(hc * 6 - .9, -1.2); x.lineTo(hc * 6 + .9, -1.2); x.lineTo(hc * 6 + 1.1, 2.2); x.lineTo(hc * 6 - 1.1, 2.2); x.closePath(); x.fill(); }
      if (o.beard) { x.fillStyle = o.beard; x.beginPath(); if (Math.abs(hc) > .5) { x.save(); x.scale(Math.sign(hc), 1); x.moveTo(5.8, 3); x.quadraticCurveTo(3.5, 13, -3, 6); x.lineTo(-1, 2.5); x.closePath(); x.fill(); x.restore(); } else { x.moveTo(-5 + hc * 3, 3); x.quadraticCurveTo(hc * 3, 16, 5 + hc * 3, 3); x.closePath(); x.fill(); } }
      if (o.moustache) { x.fillStyle = o.moustache; x.beginPath(); x.ellipse(hc * 5.9, 3.3, 1.9 * Math.max(.6, Math.abs(hc)) + 1.2 * Math.abs(hs), .75, -.15 * hc, 0, TAU); x.fill(); }
    }
    x.restore();
    ears.filter(e => e.d >= 0 && view !== 'back').forEach(drawEar);
    if (turning) headwearTurn(x, o, H[0], H[1], o.headColor || mix(P.cream, P.sheet, .3), hc);
    else headwearView(x, o, H[0], H[1], o.headColor || mix(P.cream, P.sheet, .3), view, hc < 0);
    if (o.prop) o.prop(x, PJ);
    if (NEAR) arms.filter(a => a.d >= 0).forEach(drawArm);
    if (NEAR && o.over) o.over(x, PJ);
    x.restore();
    return PJ;
  };

  M.GAITS = {
    stroll: { step: 32, T: .62, stance: 1.18, bob: 1.5, low: 0, lean: .04, bend: 0, head: .05, arms: .3, lift: 3, roll: .7, strike: -.26 },
    walk: { step: 36, T: .52, stance: 1.16, bob: 1.9, low: .3, lean: .07, bend: 0, head: .03, arms: .42, lift: 3.6, roll: .75, strike: -.3 },
    brisk: { step: 40, T: .44, stance: 1.13, bob: 2.2, low: .6, lean: .11, bend: 0, head: .02, arms: .56, lift: 4.4, roll: .8, strike: -.32 },
    sneak: { step: 30, T: 1.2, stance: 1.3, bob: .8, low: 3.5, tall: 0, lean: .12, bend: .1, head: -.05, arms: .12, lift: 5, roll: .9, strike: .25, rock: .16 },
    tired: { step: 24, T: .84, stance: 1.24, bob: .9, low: 2.4, lean: .16, bend: .14, head: .28, arms: .1, lift: 1.6, roll: .45, strike: -.12 },
    jog: { step: 44, T: .33, stance: .74, bob: 2.4, low: 1.6, lean: .2, bend: .02, head: -.12, arms: .75, lift: 13, roll: .95, strike: -.1, run: true },
    run: { step: 56, T: .27, stance: .64, bob: 2.9, low: 2, lean: .3, bend: .03, head: -.2, arms: .95, lift: 19, roll: 1.05, strike: -.08, run: true },
    sprint: { step: 66, T: .22, stance: .56, bob: 3.1, low: 2.6, lean: .42, bend: .04, head: -.3, arms: 1.1, lift: 23, roll: 1.15, strike: -.04, run: true },
  };
  function monotone(keys) {
    const n = keys.length, t = keys.map(k => k[0]), y = keys.map(k => k[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (t[i + 1] - t[i]));
    for (let i = 0; i < n; i++) m.push(i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]));
    return tt => {
      if (tt <= t[0]) return y[0]; if (tt >= t[n - 1]) return y[n - 1];
      let i = 0; while (tt > t[i + 1]) i++;
      const h = t[i + 1] - t[i], s = (tt - t[i]) / h, s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1];
    };
  }
  M.monotone = monotone;
  const sstep = (a, b, x) => smooth((x - a) / (b - a));
  const FISTS = [{ pose: 'fist' }, { pose: 'fist' }], LOOSE = [{ pose: 'relaxed', k: .3 }, { pose: 'relaxed', k: .3 }];
  M.gait = o => {
    const g = { ...(M.GAITS[typeof o.gait === 'string' ? o.gait : 'walk']), ...(typeof o.gait === 'object' ? o.gait : {}), ...(o.style || {}) };
    const from = o.from ?? 0, to = o.to ?? from + 200, t0 = o.t0 ?? 0, D = Math.max(1, to - from);
    const run = !!g.run, lead = o.lead === 'far' ? 0 : 1;
    const ACC = run ? [.5, .72, .9] : [1], DEC = run ? [.62, .85] : [1], TACC = run ? [1.4, 1.18, 1.06] : [1], TDEC = run ? [1.3, 1.1] : [1];
    const mulOf = (k, n) => Math.min(ACC[k] ?? 1, DEC[n - 1 - k] ?? 1), tOf = (k, n) => Math.max(TACC[k] ?? 1, TDEC[n - 1 - k] ?? 1);
    let n = Math.max(run ? 2 : 1, Math.round(D / g.step)), sum = 0;
    for (let k = 0; k < n; k++) sum += mulOf(k, n);
    while (run && n > 2 && D / sum < g.step * .8) { n--; sum = 0; for (let k = 0; k < n; k++) sum += mulOf(k, n); }
    const S = D / sum;
    let sumT = 0; for (let k = 0; k < n; k++) sumT += tOf(k, n);
    const settle = run ? .5 : .45, closeMul = run ? 1.6 : 1.35;
    const T = o.until != null ? Math.max(.12, (o.until - t0 - settle) / (sumT + closeMul)) : g.T;
    const falls = [];
    for (let k = 0, x = from, tt = t0; k < n; k++) { x += S * mulOf(k, n); tt += T * tOf(k, n); falls.push({ foot: (lead + k) % 2, x, t: tt, len: S * mulOf(k, n) }); }
    const closeT = falls[n - 1].t + closeMul * T;
    falls.push({ foot: (lead + n) % 2, x: to, t: closeT, close: true });
    const plants = [0, 1].map(f => {
      const list = [{ x: from + (f ? 1.5 : -1.5), tc: -1e9, first: true }];
      for (const fl of falls) if (fl.foot === f) list.push({ x: fl.x + (fl.close || fl === falls[falls.length - 2] ? (f ? 1.5 : -1.5) : 0), tc: fl.t, close: fl.close });
      list.forEach((p, i) => {
        const nx = list[i + 1];
        p.tl = !nx ? 1e9 : p.first ? (f === lead ? t0 + .3 * T : t0 + g.stance * T) : Math.min(p.tc + g.stance * T, nx.tc - .12 * T);
      });
      return list;
    });
    const end = closeT + settle;
    const hipKeys = [[t0 - .001, from], ...falls.map(fl => [fl.t, fl.close ? to : fl.x - (run ? .3 : .5) * fl.len]), [end, to]];
    const hipX = monotone(hipKeys);
    const moving = t => sstep(t0, t0 + T * (run ? 1.3 : 1), t) * (1 - sstep(falls[n - 1].t, closeT + settle * .5, t));
    const liftAng = (p, f) => p.first && f === lead ? .35 : g.roll;
    const footAt = (f, t) => {
      const L = plants[f];
      let i = 0; while (i < L.length - 1 && t >= L[i + 1].tc) i++;
      const p = L[i], nx = L[i + 1];
      if (t < p.tl || !nx) {
        const rin = run ? .06 * T : .16 * T, H = p.first && f === lead ? .3 * T : run ? .35 * T : .55 * T;
        let ang = p.first ? 0 : lerp(p.close ? 0 : g.strike, 0, smooth((t - p.tc) / (g.strike > 0 ? rin * 3 : rin)));
        if (nx) ang += liftAng(p, f) * smooth((t - (p.tl - H)) / H);
        return { ...M.foot(p.x, ang), down: true };
      }
      const w = clamp((t - p.tl) / (nx.tc - p.tl)), a0 = liftAng(p, f), start = M.foot(p.x, a0).at;
      const endAng = nx.close ? 0 : g.strike, stop = M.foot(nx.x, endAng).at, hang = run ? .7 : .38;
      const e = Math.min(1, (smooth(w) * .6 + w * w * .4) / (nx.close ? .88 : 1)), lift = (nx.close || p.first ? .6 : 1) * g.lift * Math.pow(Math.sin(Math.PI * Math.pow(w, run ? .7 : 1)), run ? 1.2 : 1.5);
      const ang = w < .45 ? lerp(a0, hang, smooth(w / .45)) : lerp(hang, endAng, smooth((w - .45) / .55));
      return { at: [lerp(start[0], stop[0], e), lerp(start[1], stop[1], w) - lift], ang, down: false };
    };
    const contacts = [0, 1].map(f => [t0 - (f === lead ? T : 0), ...plants[f].filter(p => !p.first).map(p => p.tc)]);
    const phase = (f, t) => {
      const c = contacts[f];
      let i = 0; while (i < c.length - 2 && t >= c[i + 1]) i++;
      return clamp((t - c[i]) / (c[i + 1] - c[i] || 1), 0, 1.5);
    };
    const REST = M.stand(from);
    const f = t => {
      const m = moving(t), feet = [footAt(0, t), footAt(1, t)];
      let k = 0; while (k < falls.length && t >= falls[k].t) k++;
      const ta = k ? falls[k - 1].t : t0, tb = k < falls.length ? falls[k].t : ta + T, s = clamp((t - ta) / (tb - ta || 1));
      const bob = g.bob * m * (run ? Math.cos(TAU * (s - .16)) : Math.sin(TAU * s));
      const hx = hipX(t);
      let hy = lerp(M.HIP, -45 + g.low - (run ? 0 : g.tall ?? 1.6), m) + bob;
      if (t > closeT) hy += 1.2 * Math.sin(Math.PI * clamp((t - closeT) / settle));
      for (const ft of feet) {
        const dx = ft.at[0] - hx, r = REACH * REACH - dx * dx;
        hy = Math.max(hy, r > 0 ? ft.at[1] - Math.sqrt(r) : ft.at[1]);
      }
      const A = g.arms * m, arms = [0, 1].map(i => {
        const held = o.arms && o.arms[i]; if (held) return [held[0] + .02 * bob, held[1] + .03 * bob, held[2] || 0];
        const ph = phase(1 - i, t), a0 = A * Math.cos(TAU * (ph - .1)), a0l = A * Math.cos(TAU * (ph - .16)), rest = REST.arms[i];
        return run ? [rest[0] * (1 - m) + a0, rest[1] * (1 - m) + (a0l + 1.45 + .3 * Math.max(0, a0l)) * m]
          : [rest[0] + a0, rest[1] + a0l + .08 * m + .5 * Math.max(0, a0l)];
      });
      const rock = (g.rock || 0) * m * Math.cos(TAU * s);
      return {
        hip: [hx, hy], lean: .02 + g.lean * m + rock, bend: g.bend * m, head: g.head * m + .03 * m * Math.sin(TAU * (s - .35)),
        feet: feet.map(ft => ({ at: ft.at, ang: ft.ang })), arms, hands: [0, 1].map(i => (o.hands && o.hands[i]) || (run && m > .3 ? FISTS : LOOSE)[i]),
        ...(o.yaw != null ? { yaw: o.yaw } : {}),
        sway: (run ? 2.4 : 1.6) * m * Math.sin(TAU * (s - .1)) * (k % 2 ? 1 : -1),
      };
    };
    f.end = end; f.x = hipX; f.falls = falls; f.from = from; f.to = to;
    return f;
  };

  M.reach = (pose, i, to) => {
    const sh = M.joints(pose).sh, dx = to[0] - sh[0], dy = to[1] - sh[1], L = Math.min(Math.hypot(dx, dy) || 1e-6, UPPER + FORE - .01);
    const base = Math.atan2(dy, dx), A = Math.acos(clamp((UPPER * UPPER + L * L - FORE * FORE) / (2 * UPPER * L), -1, 1));
    const e1 = add(sh, [Math.cos(base - A) * UPPER, Math.sin(base - A) * UPPER]), e2 = add(sh, [Math.cos(base + A) * UPPER, Math.sin(base + A) * UPPER]);
    const el = e1[0] < e2[0] ? e1 : e2, wr = add(el, [Math.cos(Math.atan2(to[1] - el[1], to[0] - el[0])) * FORE, Math.sin(Math.atan2(to[1] - el[1], to[0] - el[0])) * FORE]);
    pose.arms = pose.arms.map((a, j) => j === i ? [Math.atan2(el[0] - sh[0], el[1] - sh[1]), Math.atan2(wr[0] - el[0], wr[1] - el[1])] : a);
    return pose;
  };
  M.reachTool = (pose, i, tip, hand) => {
    const fig = F.hands.POSES.includes(hand.pose), tl = (fig ? F.hands.TIP : PE.TIP)[hand.pose] || [0, 0], hs = M.HANDS;
    let wr = [tip[0] + 8, tip[1] - 4];
    for (let it = 0; it < 14; it++) {
      M.reach(pose, i, wr);
      const f = pose.arms[i][1];
      if (fig) { const r = -f + F.hands.bend(hand), c = Math.cos(r), sn = Math.sin(r); wr = [tip[0] - (tl[0] * c - tl[1] * sn), tip[1] - (tl[0] * sn + tl[1] * c)]; }
      else { const g = Math.atan2(Math.cos(f), Math.sin(f)), c = Math.cos(g), sn = Math.sin(g), px = -tl[0] * hs, py = tl[1] * hs; wr = [tip[0] - (px * c - py * sn), tip[1] - (px * sn + py * c)]; }
    }
    M.reach(pose, i, wr);
    pose.hands = (pose.hands || [null, null]).map((h, j) => j === i ? hand : h);
    return pose;
  };
  const P0 = (o = {}) => ({ ...M.stand(0), ...o });
  const withArms = (p, a) => ({ ...p, arms: a });

  const blinkAt = (t, seed) => { const p = 3.1 + (seed % 5) * .37, u = ((t + seed * .71) % p + p) % p; return u < .13; };
  M.idle = (o = {}) => {
    const seed = o.seed ?? 1, base = o.base || M.stand(o.x ?? 0), seated = !!o.base, t0 = o.t0 ?? -1e9, t1 = o.t1 ?? 1e9;
    return t => {
      const on = smooth((t - t0) / .6) * (1 - smooth((t - (t1 - .6)) / .6));
      const b = Math.sin(TAU * (t + seed * .4) / 3.6) * on, w = seated ? 0 : F.noise1(t / 4.2, seed * 13) * 1.15 * on;
      const p = { ...base, hip: [base.hip[0] + 1.3 * w, base.hip[1] - .3 * b + .4 * Math.abs(w)], bend: (base.bend || 0) + .014 * b,
        head: (base.head || 0) + .05 * F.noise1(t / 2.7, seed * 7 + 3) * on, arms: base.arms.map(a => [a[0] + .012 * b, a[1] + .015 * b]) };
      if (!seated) p.feet = base.feet.map((f, i) => M.foot(f.at[0], .16 * smooth(i ? -w : w)));
      p.blink = blinkAt(t, seed);
      return p;
    };
  };

  M.seatedPose = (fx, seat = 24) => {
    const p = P0({ hip: [fx - 20, -(seat + 4)], lean: -.04, bend: .03, head: .06, feet: [M.foot(fx - 1.5), M.foot(fx + 1.5)] });
    M.reach(p, 1, [fx - 7, -(seat + 9)]); M.reach(p, 0, [fx - 9, -(seat + 10)]);
    p.hands = [{ pose: 'rest', k: .7 }, { pose: 'rest', k: .7 }];
    return p;
  };
  const standAt = fx => M.stand(fx);
  M.sit = o => {
    const fx = o.x ?? 0, seat = o.seat ?? 24, t0 = o.t0 ?? 0, k = (o.dur ?? 1.15) / 1.15, ST = standAt(fx), SE = M.seatedPose(fx, seat);
    const at = u => t0 + u * k;
    const down = seat < 16 ? { ...ST, hip: [fx - 8, -(seat + 19)], lean: .66, bend: .16, head: .16, arms: [[.7, .95], [.8, 1.05]] }
      : { ...ST, hip: [fx - 9, -37.5], lean: .52, bend: .12, head: .12, arms: [[.5, .75], [.6, .85]] };
    const touch = { ...SE, hip: [fx - 19, -(seat + 4) + 1.4], lean: .4, bend: .07, head: .02 };
    M.reach(touch, 1, [fx - 1, -(seat + 11)]); M.reach(touch, 0, [fx - 4, -(seat + 12)]);
    const glance = { ...ST, head: .28, hip: [fx - .5, M.HIP - .2], arms: [[.14, .3], [.18, .35]] };
    const f = M.keys([[at(0), ST], [at(.14), glance], [at(.46), down], [at(.72), touch, seat < 16 ? smooth : x => x * x], [at(.9), { ...SE, lean: .12, hip: [fx - 20, -(seat + 4) + .5] }], [at(1.15), SE]], { lag: { arms: .06 * k, head: .04 * k } });
    f.end = at(1.15); f.seated = SE; return f;
  };
  M.rise = o => {
    const fx = o.x ?? 0, seat = o.seat ?? 24, t0 = o.t0 ?? 0, k = (o.dur ?? 1.25) / 1.25, ST = standAt(fx), SE = M.seatedPose(fx, seat);
    const at = u => t0 + u * k;
    const back = { ...SE, lean: -.15, head: -.06, hip: [fx - 20.5, -(seat + 4)] };
    const over = { ...SE, lean: .74, bend: .12, head: -.38, hip: [fx - 16.5, -(seat + 4.5)] };
    M.reach(over, 1, [fx + 1, -(seat + 6)]); M.reach(over, 0, [fx - 1, -(seat + 6)]);
    const lift = { ...ST, hip: [fx - 7, -38.8], lean: .42, bend: .06, head: -.16, arms: [[.35, .6], [.45, .7]] };
    const up = { ...ST, hip: [fx + .6, M.HIP - .3], lean: -.03, head: .02 };
    const squat = { ...ST, hip: [fx - 8, -(seat + 19)], lean: .66, bend: .14, head: -.24, arms: [[.6, .85], [.7, .95]] };
    const f = seat < 16
      ? M.keys([[at(0), SE], [at(.18), back], [at(.42), over], [at(.66), squat], [at(.86), lift], [at(1.05), up], [at(1.25), ST]], { lag: { arms: .07 * k, head: .05 * k } })
      : M.keys([[at(0), SE], [at(.2), back], [at(.52), over], [at(.8), lift], [at(1.03), up], [at(1.25), ST]], { lag: { arms: .07 * k, head: .05 * k } });
    f.end = at(1.25); return f;
  };

  const G = 580;
  M.jump = o => {
    const x = o.x ?? 0, to = o.to ?? x, H = o.height ?? 22, t0 = o.t0 ?? 0;
    const tC = t0 + .12, tL = t0 + .42, tO = t0 + .55, air = Math.sqrt(8 * H / G), tD = tO + air, tR = tD + .14, tU = tR + .3, tE = tU + .22;
    const ST = standAt(x), EN = standAt(to);
    const crouch = { ...ST, hip: [x - 5, -31], lean: .56, bend: .16, head: -.28, arms: [[-.9, -.5], [-.95, -.55]] };
    const launch = { ...ST, hip: [x + 3, -46.6], lean: .12, bend: 0, head: -.05, arms: [[2.3, 2.5], [2.45, 2.65]], hands: [{ pose: 'open', k: .5 }, { pose: 'open', k: .5 }], feet: [M.foot(x - 1.5, 1.05), M.foot(x + 1.5, 1.05)] };
    const land = [M.foot(to - 1.5, .35), M.foot(to + 1.5, .35)];
    const recoil = { ...EN, hip: [to - 6, -30.5], lean: .56, bend: .13, head: .08, arms: [[.8, 1.15], [.9, 1.25]] };
    const up = { ...EN, hip: [to + .6, M.HIP - .8], lean: -.02 };
    const ground = M.keys([[t0, ST], [tC, { ...ST, hip: [x, M.HIP - .4] }], [tL, crouch, x => smooth(x) * .7 + x * x * .3], [tO, launch, x => 1 - (1 - x) * (1 - x)]]);
    const after = M.keys([[tD, { ...recoil, feet: land, hip: [to - 1.5, -44.2], lean: .22, bend: .04, arms: [[1.2, 1.5], [1.3, 1.6]] }], [tD + .05, { ...recoil, hip: [to - 3, -39.5], lean: .36, bend: .08, arms: [[1.05, 1.35], [1.15, 1.45]] }], [tR, recoil, x => 1 - (1 - x) * (1 - x)], [tU, up], [tE, EN]], { lag: { arms: .05, head: .04 } });
    const hipT = launch.hip, hipL = [to - 1.5, -44.2];
    const f = t => {
      if (t < tO) return ground(t);
      if (t >= tD) return after(t);
      const u = (t - tO) / air, hip = [lerp(hipT[0], hipL[0], u), lerp(hipT[1], hipL[1], u) - 4 * H * u * (1 - u)];
      const tuck = Math.sin(Math.PI * clamp(u / .9)), off = launch.feet.map(ft => [ft.at[0] - hipT[0], ft.at[1] - hipT[1]]);
      const feet = [0, 1].map(i => {
        const rel0 = off[i], rel1 = [land[i].at[0] - hipL[0], land[i].at[1] - hipL[1]], rel = [lerp(rel0[0], rel1[0], smooth(u)) - 4 * tuck + (i ? 3 : 0) * tuck, lerp(rel0[1], rel1[1], smooth(u)) - 13 * tuck];
        return { at: [hip[0] + rel[0], hip[1] + rel[1]], ang: lerp(1.05, .35, smooth(u)) - .35 * tuck };
      });
      const arms = launch.arms.map((a, i) => [lerp(a[0], 1.2 + .1 * i, smooth(u)), lerp(a[1], 1.5 + .1 * i, smooth(u))]);
      return { ...launch, hip, feet, arms, lean: lerp(.12, .22, u) - .12 * tuck, bend: .05 * tuck, head: lerp(-.05, .05, u) };
    };
    f.end = tE; f.land = tD; return f;
  };

  M.turn = o => {
    const x0 = o.x ?? 0, t0 = o.t0 ?? 0, a0 = o.from ?? 0, a1 = o.to ?? a0 + Math.PI, span = Math.abs(a1 - a0), dir = Math.sign(a1 - a0) || 1;
    const N = Math.max(2, Math.ceil(span / (Math.PI / 3) - 1e-6) + 1), dur = o.dur ?? (.5 + .6 * span / Math.PI), CAP = .6;
    const ST = M.stand(x0), u = t => clamp((t - t0) / dur);
    const body = t => lerp(a0, a1, smooth(u(t) * N / (N - .5))), head = t => lerp(a0, a1, smooth((u(t) + .1) * N / (N - .5)));
    const ant = t => -.06 * dir * Math.sin(Math.PI * clamp((t - t0 + .12) / .2));
    const T = j => lerp(a0, a1, Math.min(1, (j + 1) / (N - 1)));
    const first = dir > 0 ? 1 : 0, owner = j => j % 2 ? 1 - first : first;
    const swivel = (L, b) => { const lag = (b - L) * dir; return { yaw: lag > CAP ? b - dir * CAP : L, heel: .08 * clamp((lag - CAP * .6) / (CAP * .4)) }; };
    const tw = j => t0 + dur * j / N;
    const f = t => {
      const k = u(t), w = Math.min(N - 1e-9, k * N), seg = Math.floor(w), wi = w - seg;
      const feet = [0, 1].map(i => {
        const own = [...Array(N).keys()].filter(j => owner(j) === i), done = own.filter(j => j < seg), L = done.length ? T(done[done.length - 1]) : a0;
        let yaw, ang, lift = 0;
        if (k >= 1) { yaw = a1; ang = 0; }
        else if (owner(seg) === i) {
          const sw = swivel(L, body(tw(seg))), e = smooth(wi);
          yaw = lerp(sw.yaw, T(seg), e); ang = sw.heel * (1 - e) + .16 * Math.sin(Math.PI * wi); lift = 1.7 * Math.sin(Math.PI * wi);
        } else { const sw = swivel(L, body(t)); yaw = sw.yaw; ang = sw.heel; }
        return { ...M.foot(ST.feet[i].ax, ang, lift), yaw };
      });
      const dip = .6 * Math.sin(Math.PI * wi) * (k < 1 ? 1 : 0);
      return { ...ST, hip: [x0, M.HIP + dip], yaw: body(t), headYaw: head(t) + ant(t), feet,
        blink: Math.abs(head(t) - body(t)) > .08 && k > .15 && k < .6,
        arms: ST.arms.map(a => [a[0] + .12 * Math.sin(Math.PI * k), a[1] + .1 * Math.sin(Math.PI * k)]) };
    };
    f.end = t0 + dur; f.yaw = a1;
    return f;
  };

  M.perform = (plan, o = {}) => {
    let x = o.x ?? 0, z = o.z ?? 0, yaw = o.yaw ?? 0, t = o.t0 ?? 0, seat = null;
    const parts = [], seed = o.seed ?? 1;
    for (const s of plan) {
      let fn, t1; const root = [x, z], yw = yaw;
      if (s.do === 'wait') { const base = seat != null ? M.seatedPose(0, seat) : null; t1 = s.until ?? t + (s.for ?? 1); fn = M.idle({ x: 0, seed, base, t0: t, t1 }); }
      else if (s.do === 'walk' || s.do === 'run') {
        const D = s.dist ?? Math.abs((s.to ?? x + 200) - x) / Math.max(.2, Math.abs(Math.cos(yaw)));
        fn = M.gait({ from: 0, to: D, t0: t, gait: s.gait || s.do, style: s.style, lead: s.lead, hands: s.hands, arms: s.arms, until: s.until }); t1 = fn.end;
        x += D * Math.cos(yaw); z += D * Math.sin(yaw);
      }
      else if (s.do === 'turn') {
        let to = s.to ?? yaw + (s.by ?? Math.PI);
        if (s.to != null) {
          let d = ((to - yaw) % TAU + TAU + Math.PI) % TAU - Math.PI;
          if (Math.abs(Math.abs(d) - Math.PI) < 1e-6) d = (Math.sin(yaw + Math.PI / 2) >= Math.sin(yaw - Math.PI / 2)) === !s.back ? Math.PI : -Math.PI;
          to = yaw + d;
        }
        fn = M.turn({ x: 0, t0: t, from: yaw, to, dur: s.dur }); t1 = fn.end; yaw = to;
      }
      else if (s.do === 'sit') { seat = s.seat ?? 24; fn = M.sit({ x: 0, seat, t0: t, dur: s.dur }); t1 = fn.end; }
      else if (s.do === 'rise') { fn = M.rise({ x: 0, seat: seat ?? 24, t0: t, dur: s.dur }); t1 = fn.end; seat = null; }
      else if (s.do === 'jump') { const D = s.dist ?? (s.to != null ? Math.abs(s.to - x) : 0); fn = M.jump({ x: 0, to: D, height: s.height, t0: t }); t1 = fn.end; x += D * Math.cos(yaw); z += D * Math.sin(yaw); }
      else throw new Error(`F.motion.perform: unknown action ${s.do}`);
      parts.push({ do: s.do, t0: t, t1, fn, root, yaw: yw, label: s.label || s.do });
      t = t1;
    }
    const partAt = tt => { let i = 0; while (i < parts.length - 1 && tt >= parts[i].t1) i++; return parts[i]; };
    const f = tt => {
      const p = partAt(tt), pose = p.fn(tt);
      const arms = o.arms ? pose.arms.map((a, i) => o.arms[i] || a) : pose.arms, hands = o.hands ? (pose.hands || [null, null]).map((h, i) => o.hands[i] || h) : pose.hands;
      return { ...pose, arms, hands, root: p.root, yaw: pose.yaw ?? p.yaw };
    };
    f.end = t; f.parts = parts;
    f.at = tt => { const p = f(tt), c = Math.cos(p.yaw), sn = Math.sin(p.yaw); return { x: p.root[0] + p.hip[0] * c, z: p.root[1] + p.hip[0] * sn, yaw: p.yaw }; };
    return f;
  };
})();
