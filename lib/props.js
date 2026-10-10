(function () {
  'use strict';
  const F = FILM, { TAU, clamp, lerp, hash, rng, hex, rgba, polyPath, easeOut } = F;
  const PR = {};

  const line = (x, a, b, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  PR.line = line;
  PR.smooth = (x, pts) => {
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]);
    x.beginPath(); x.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); x.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
    x.closePath();
  };

  PR.glow = (ctx, cx, cy, r, color, a, look) => {
    if (a <= 0) return;
    const add = look !== 'paper', tgt = F.route ? F.route(ctx, add ? 'glow' : 'glowsoft') : ctx; if (!tgt) return;
    tgt.save(); if (tgt !== ctx) { tgt.setTransform(ctx.getTransform()); tgt.globalAlpha = ctx.globalAlpha; }
    tgt.globalCompositeOperation = add ? 'lighter' : 'source-over';
    const g = tgt.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(hex(color), a)); g.addColorStop(1, rgba(hex(color), 0));
    tgt.fillStyle = g; tgt.fillRect(cx - r, cy - r, r * 2, r * 2); tgt.restore();
  };

  PR.bottle = (x, P, h = 100) => {
    const w = h * .42, sh = h * .6, nk = h * .15;
    x.save();
    x.beginPath();
    x.moveTo(-w / 2, -h * .05); x.lineTo(-w / 2, -sh); x.quadraticCurveTo(-w / 2, -h * .74, -nk / 2, -h * .78);
    x.lineTo(-nk / 2, -h * .93); x.lineTo(nk / 2, -h * .93); x.lineTo(nk / 2, -h * .78); x.quadraticCurveTo(w / 2, -h * .74, w / 2, -sh);
    x.lineTo(w / 2, -h * .05); x.quadraticCurveTo(w / 2, 0, w / 2 - h * .05, 0); x.lineTo(-w / 2 + h * .05, 0); x.quadraticCurveTo(-w / 2, 0, -w / 2, -h * .05); x.closePath();
    x.fillStyle = P.amber; x.fill();
    x.clip();
    x.fillStyle = P.amberDark; x.globalAlpha = .55; x.fillRect(w * .22, -h, w * .3, h); x.globalAlpha = 1;
    x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(-w * .36, -sh + h * .02, w * .1, sh * .78);
    x.restore();
    x.fillStyle = P.card; x.fillRect(-w * .42, -h * .47, w * .84, h * .26);
    x.fillStyle = P.red; x.fillRect(-w * .42, -h * .47, w * .84, h * .05);
    x.fillStyle = P.ink; for (let i = 0; i < 3; i++) x.fillRect(-w * .3, -h * .37 + i * h * .045, w * (i === 1 ? .6 : .45), h * .012);
    x.fillStyle = P.amberDark; x.fillRect(-nk * .62, -h * .95, nk * 1.24, h * .04);
    x.fillStyle = P.wood; x.beginPath(); x.roundRect(-nk * .42, -h, nk * .84, h * .06, h * .01); x.fill();
  };

  PR.miniBottle = (x, P, s = 13) => { x.fillStyle = P.amber; x.beginPath(); x.roundRect(-s * .2, -s * .7, s * .4, s * .7, s * .08); x.fill(); x.fillRect(-s * .08, -s, s * .16, s * .34); x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(-s * .12, -s * .6, s * .07, s * .4); };
  PR.miniBarrel = (x, P, s = 13) => {
    x.fillStyle = P.wood; x.beginPath(); x.ellipse(0, -s * .45, s * .38, s * .47, 0, 0, TAU); x.fill();
    x.fillStyle = P.woodDark; x.fillRect(-s * .38, -s * .72, s * .76, s * .07); x.fillRect(-s * .38, -s * .25, s * .76, s * .07);
  };
  PR.miniMug = (x, P, s = 13) => {
    x.fillStyle = P.amber; x.fillRect(-s * .3, -s * .8, s * .5, s * .8);
    x.fillStyle = P.cream; x.beginPath(); x.ellipse(-s * .05, -s * .82, s * .34, s * .14, 0, 0, TAU); x.fill();
    x.strokeStyle = P.amber; x.lineWidth = s * .1; x.beginPath(); x.arc(s * .24, -s * .42, s * .16, -1.2, 1.2); x.stroke();
  };

  PR.eraser = (x, P, w = 240) => {
    const h = w * .38;
    x.fillStyle = P.eraserDark; x.beginPath(); x.roundRect(-w / 2, -h / 2 + h * .06, w, h, h * .22); x.fill();
    x.fillStyle = P.eraser; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h * .94, h * .22); x.fill();
    x.fillStyle = P.sleeve; x.fillRect(-w * .08, -h / 2 - 2, w * .58, h + 4);
    x.fillStyle = P.cream; x.fillRect(-w * .08, -h * .08, w * .58, h * .16);
    x.fillStyle = P.red; x.fillRect(w * .1, -h * .08, w * .1, h * .16);
  };
  PR.card = (x, P, text, w, h, font, strike = 0) => {
    x.fillStyle = P.card; x.fillRect(-w / 2, -h / 2, w, h);
    x.strokeStyle = P.ink; x.lineWidth = 2.5; x.strokeRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18);
    x.fillStyle = P.ink; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 0, h * .04);
    if (strike > 0) {
      const a = [-w * .44, h * .1], b = [w * .44, -h * .12];
      x.strokeStyle = P.red; x.lineWidth = h * .11; x.lineCap = 'round';
      x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(lerp(a[0], b[0], clamp(strike)), lerp(a[1], b[1], clamp(strike))); x.stroke();
    }
  };

  PR.inkSprite = (text, w, h, color, font = 'NSC', seed = 77) => {
    const k = 2, [c, x] = F.canvas(w * k, h * k), r = rng(seed);
    x.scale(k, k); x.strokeStyle = x.fillStyle = '#000';
    x.lineWidth = Math.max(5, h * .056); x.strokeRect(h * .06, h * .06, w - h * .12, h - h * .12);
    x.lineWidth = Math.max(2, h * .019); x.strokeRect(h * .15, h * .15, w - h * .3, h - h * .3);
    let fs = h * .75; x.font = `900 ${fs}px ${font}`;
    fs *= Math.min(1, (w - h * .5) / x.measureText(text).width); x.font = `900 ${fs}px ${font}`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + fs * .04);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < w * h / 64; i++) { x.fillStyle = `rgba(0,0,0,${.3 + r() * .7})`; const s = .6 + r() * 2.2; x.fillRect(r() * w, r() * h, s, s); }
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(0,0,0,${.15 + r() * .3})`; x.fillRect(r() * w, r() * h, 20 + r() * 80, .8 + r() * 1.5); }
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, w, h);
    return c;
  };

  PR.rubberStamp = (x, P, w, h, look) => {
    x.fillStyle = P.rubber; x.beginPath(); x.roundRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 6); x.fill();
    if (look === 'flat') { const wg = x.createLinearGradient(0, -h / 2, 0, h / 2); wg.addColorStop(0, P.wood); wg.addColorStop(1, P.woodDark); x.fillStyle = wg; } else x.fillStyle = P.wood;
    x.beginPath(); x.roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { const y = -h / 2 + 14 + i * (h - 28) / 8; x.beginPath(); x.moveTo(-w / 2 + 12, y); x.bezierCurveTo(-60, y + 5, 60, y - 5, w / 2 - 12, y + 2); x.stroke(); }
    x.fillStyle = P.woodDark; x.beginPath(); x.arc(0, 0, h * .29, 0, TAU); x.fill();
    const kg = x.createRadialGradient(-12, -14, 4, 0, 0, h * .24); kg.addColorStop(0, look === 'lightbox' ? '#3a2c44' : '#b98a5e'); kg.addColorStop(1, P.wood);
    x.fillStyle = kg; x.beginPath(); x.arc(0, 0, h * .225, 0, TAU); x.fill();
  };

  PR.drunk = (x, P, ta) => {
    x.fillStyle = P.ink;
    polyPath(x, [[15, 0], [27, 0], [25, -6], [17, -6]]); x.fill();
    x.fillRect(19.6, -93, 2.8, 88); x.fillRect(12, -93, 10, 1.8);
    polyPath(x, [[9, -91], [15, -91], [16.5, -101], [7.5, -101]]); x.fillStyle = P.lampGlass; x.fill();
    polyPath(x, [[6.5, -101], [17.5, -101], [12, -106]]); x.fillStyle = P.ink; x.fill();
    const sway = Math.sin(ta * TAU * .42) * .085 + Math.sin(ta * TAU * 1.05 + 1) * .02;
    x.save(); x.rotate(sway);
    line(x, [-3.5, -24], [-6, -1], 6, P.trouser); line(x, [3.5, -24], [5, -1], 6, P.trouser);
    x.fillStyle = P.ink; x.beginPath(); x.ellipse(-7, -1, 5, 2.4, 0, 0, TAU); x.ellipse(6.5, -1, 5, 2.4, 0, 0, TAU); x.fill();
    polyPath(x, [[-9.5, -50], [9.5, -50], [12, -21], [-12, -21]]); x.fillStyle = P.coat2; x.fill();
    polyPath(x, [[-3, -50], [3, -50], [0, -43]]); x.fillStyle = P.ink; x.fill();
    const hx = 20 * Math.cos(-sway) - (-64) * Math.sin(-sway), hy = 20 * Math.sin(-sway) + (-64) * Math.cos(-sway);
    line(x, [7, -47], [hx, hy], 4.6, P.coat2);
    const bob = Math.sin(ta * TAU * .42 + 1.3) * 2;
    line(x, [-7, -47], [-13, -36 + bob * .3], 4.6, P.coat2); line(x, [-13, -36 + bob * .3], [-9, -29 + bob], 4.2, P.coat2);
    x.save(); x.translate(-9, -29 + bob); x.rotate(.5 + bob * .05);
    x.fillStyle = P.amber; x.fillRect(-2.2, -3, 4.4, 9); x.fillRect(-.9, -6.5, 1.8, 4); x.restore();
    x.save(); x.translate(0, -56); x.rotate(sway * 1.8 + .12);
    x.fillStyle = P.skin; x.beginPath(); x.arc(0, 0, 6.6, 0, TAU); x.fill();
    x.fillStyle = P.cap; x.beginPath(); x.ellipse(0, -2.5, 7.4, 4.6, 0, Math.PI, TAU); x.fill(); x.fillRect(-1, -3.2, 11, 2.2);
    x.restore();
    x.restore();
    return [12, -96];
  };

  const CRACK = [[0, -71], [-3, -60], [4, -49], [-2, -37], [5, -24], [-1, -12], [2, 0]];
  function houseBody(x, P) {
    polyPath(x, [[-32, 0], [-32, -44], [32, -44], [32, 0]]); x.fillStyle = P.wall; x.fill();
    polyPath(x, [[-38, -43], [0, -72], [38, -43]]); x.fillStyle = P.roof; x.fill();
    x.fillStyle = P.window; x.fillRect(-24, -34, 12, 12); x.fillRect(12, -34, 12, 12);
    x.fillStyle = P.ink; x.fillRect(-18.6, -34, 1.2, 12); x.fillRect(17.4, -34, 1.2, 12); x.fillRect(-24, -28.6, 12, 1.2); x.fillRect(12, -28.6, 12, 1.2);
    x.fillStyle = P.door; x.fillRect(-5, -20, 10, 20);
    x.fillStyle = P.ink; x.fillRect(22, -68, 6, 14);
  }
  PR.house = (x, P, crack, split) => {
    const sp = 2.4 * easeOut(split);
    if (sp <= 0) houseBody(x, P);
    else for (const side of [-1, 1]) {
      x.save(); x.translate(side * sp, 0); x.rotate(side * sp * .006);
      polyPath(x, [[side * 50, 5], [side * 50, -85], [0, -85], ...CRACK, [2, 5]]); x.clip(); houseBody(x, P); x.restore();
    }
    if (crack > 0 && sp <= 0) {
      const n = CRACK.length - 1, s = clamp(crack) * n, i = Math.floor(s), f = s - i;
      x.strokeStyle = P.ink; x.lineWidth = 1.8; x.lineJoin = 'round'; x.beginPath(); x.moveTo(CRACK[0][0], CRACK[0][1]);
      for (let k = 1; k <= i; k++) x.lineTo(CRACK[k][0], CRACK[k][1]);
      if (i < n) x.lineTo(lerp(CRACK[i][0], CRACK[i + 1][0], f), lerp(CRACK[i][1], CRACK[i + 1][1], f));
      x.stroke();
    }
  };

  const PANE = { x0: -30, y0: -36, x1: 10, y1: -8 }, PC = [-10, -22];
  const HOLE = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * TAU, r = (i % 2 ? .55 : .95) * (.8 + hash(i, 9) * .3); return [PC[0] + Math.cos(a) * 20 * r, PC[1] + Math.sin(a) * 14 * r]; });
  const SHARDS = Array.from({ length: 16 }, (_, i) => {
    const r = rng(300 + i * 13), a = r() * TAU, d = 4 + r() * 12, sz = 2.5 + r() * 4;
    return { x: Math.cos(a) * d * 1.6, y: Math.sin(a) * d * .8, vx: 40 + r() * 110, vy: -60 - r() * 90, w: (r() - .5) * 18, pts: [[0, -sz], [sz * .8, sz * .6], [-sz * .7, sz * .5 + r() * 2]] };
  });
  PR.shop = (x, P, brick, dt, look) => {
    polyPath(x, [[-36, 0], [-36, -62], [36, -62], [36, 0]]); x.fillStyle = P.facade; x.fill();
    x.fillStyle = P.ink; x.fillRect(-36, -62, 72, 9);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? P.awningB : P.awningA; polyPath(x, [[-38 + i * 9.5, -52], [-28.5 + i * 9.5, -52], [-27.5 + i * 9.5, -43], [-37 + i * 9.5, -43]]); x.fill(); }
    x.fillStyle = P.door; x.fillRect(15, -34, 14, 34);
    x.fillStyle = P.ink; x.fillRect(PANE.x0 - 2, PANE.y0 - 2, 44, 32);
    const broken = dt >= 0;
    x.save(); x.beginPath(); x.rect(PANE.x0, PANE.y0, 40, 28); x.clip();
    x.fillStyle = look === 'lightbox' ? '#2a1f3d' : '#2a2a33'; x.fillRect(PANE.x0, PANE.y0, 40, 28);
    if (!broken) { x.fillStyle = rgba(hex(P.glass), .85); x.fillRect(PANE.x0, PANE.y0, 40, 28); x.fillStyle = 'rgba(255,255,255,.35)'; polyPath(x, [[-26, -36], [-18, -36], [-30, -18], [-30, -26]]); x.fill(); }
    else { x.beginPath(); x.rect(PANE.x0, PANE.y0, 40, 28); polyPath(x, HOLE); x.fillStyle = rgba(hex(P.glass), .85); x.fill('evenodd'); }
    x.restore();
    if (brick > 0 && brick < 1) { const bx = lerp(-150, PC[0], brick), by = lerp(-40, PC[1], brick) - Math.sin(brick * Math.PI) * 30; x.save(); x.translate(bx, by); x.rotate(brick * 6); x.fillStyle = P.roof; x.fillRect(-5, -3, 10, 6); x.restore(); }
    if (broken) for (const s of SHARDS) {
      const G = 420, y0 = PC[1] + s.y, land = (-s.vy + Math.sqrt(s.vy * s.vy - 2 * G * (y0 - 3))) / G, tt = Math.min(dt, land);
      const sx = PC[0] + s.x + s.vx * tt * (s.x < 0 ? -.4 : 1), sy = y0 + s.vy * tt + .5 * G * tt * tt;
      x.save(); x.translate(sx, sy); x.rotate(s.w * tt); x.fillStyle = rgba(hex(P.glass), .9); polyPath(x, s.pts); x.fill(); x.restore();
    }
  };

  PR.quill = (x, P, len = 300) => {
    x.save(); x.rotate(-.62);
    polyPath(x, [[0, 0], [-4, -26], [4, -26]]); x.fillStyle = P.nib; x.fill();
    x.fillStyle = P.quillShade; x.fillRect(-2.2, -len * .98, 4.4, len * .9);
    x.beginPath(); x.moveTo(0, -len * .22);
    x.bezierCurveTo(-len * .16, -len * .45, -len * .14, -len * .8, -len * .02, -len);
    x.bezierCurveTo(len * .1, -len * .8, len * .12, -len * .5, 0, -len * .22); x.closePath();
    x.fillStyle = P.quill; x.fill();
    x.strokeStyle = P.quillShade; x.lineWidth = 1.4;
    for (let i = 0; i < 16; i++) { const y = -len * (.28 + i * .044), sgn = i % 2 ? 1 : -1; x.beginPath(); x.moveTo(0, y); x.lineTo(sgn * len * .1 * Math.sin((i + 2) / 18 * Math.PI), y - len * .05); x.stroke(); }
    x.fillStyle = P.quillShade; x.fillRect(-1.3, -len, 2.6, len * .8);
    x.restore();
  };

  PR.person = (x, P, o) => {
    const dk = o.dark || 0, ink = hex(P.ink);
    const c = col => rgba(F.mixc(hex(col), ink, dk));
    const look = o.look || 0, arm = o.arm || 0;
    const coat = c(o.coat || P.coat), low = c(o.kind === 'woman' ? (o.skirt || P.coat2) : (o.trouser || P.trouser)), skin = c(o.skin || P.skin), hatc = c(o.hatColor || P.cap);
    if (o.kind === 'woman') {
      polyPath(x, [[-8.5, -47], [8.5, -47], [15, 0], [-15, 0]]); x.fillStyle = low; x.fill();
      x.fillStyle = c(P.ink); x.beginPath(); x.ellipse(-5, -.5, 4, 1.8, 0, 0, TAU); x.ellipse(5, -.5, 4, 1.8, 0, 0, TAU); x.fill();
      polyPath(x, [[-8, -71], [8, -71], [9, -46], [-9, -46]]); x.fillStyle = coat; x.fill();
    } else {
      line(x, [-4, -45], [-5, -1], 6.5, low); line(x, [4, -45], [5, -1], 6.5, low);
      x.fillStyle = c(P.ink); x.beginPath(); x.ellipse(-6, -.8, 4.6, 2, 0, 0, TAU); x.ellipse(6, -.8, 4.6, 2, 0, 0, TAU); x.fill();
      polyPath(x, [[-10, -73], [10, -73], [12, -36], [-12, -36]]); x.fillStyle = coat; x.fill();
    }
    const sh = o.kind === 'woman' ? -68 : -70;
    if (o.arms) for (const [s, e, h] of o.arms) { line(x, s, e, 4.4, coat); line(x, e, h, 4.2, coat); }
    else {
      line(x, [-8, sh], [-11, sh + 21], 4.4, coat);
      line(x, [8, sh], [lerp(11, 15, arm), lerp(sh + 21, sh - 26, arm)], 4.4, coat);
    }
    if (o.ribbon) { x.fillStyle = '#fbf7ee'; polyPath(x, [[1, -64], [6, -67], [6, -61]]); x.fill(); polyPath(x, [[1, -64], [-4, -67], [-4, -61]]); x.fill(); polyPath(x, [[0, -64], [-2.5, -57], [0, -58.5], [2.5, -57]]); x.fill(); }
    x.fillStyle = skin; x.fillRect(-2, sh - 7, 4, 7);
    x.save(); x.translate(0, sh - 12); x.rotate(-.38 * look); x.translate(0, -1.5 * look);
    x.fillStyle = skin; x.beginPath(); x.arc(0, 0, 6.5, 0, TAU); x.fill();
    if (o.kind === 'woman') { x.fillStyle = hatc; x.beginPath(); x.arc(-5, -2, 3.2, 0, TAU); x.fill(); }
    x.fillStyle = hatc;
    if (o.hat === 'wide') { x.beginPath(); x.ellipse(0, -4.5, 13, 3, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, -6, 7, 5, 0, Math.PI, TAU); x.fill(); }
    else if (o.hat === 'bowler') { x.beginPath(); x.ellipse(0, -5, 10.5, 2.3, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, -5.5, 7, 6.5, 0, Math.PI, TAU); x.fill(); }
    else if (o.hat === 'cap') { x.beginPath(); x.ellipse(0, -2.5, 7.4, 4.6, 0, Math.PI, TAU); x.fill(); x.fillRect(-1, -3.2, 11, 2.2); }
    x.restore();
    if (o.arms) { x.fillStyle = skin; for (const [, , h] of o.arms) { x.beginPath(); x.arc(h[0], h[1], 2.8, 0, TAU); x.fill(); } }
  };

  PR.pulpit = (x, P, dark = 0) => {
    const c = col => rgba(F.mixc(hex(col), hex(P.ink), dark));
    x.fillStyle = c(P.woodDark); x.fillRect(-140, -40, 280, 40);
    x.fillStyle = c(P.wood); x.fillRect(-140, -44, 280, 8);
    polyPath(x, [[-46, -150], [46, -150], [32, -40], [-32, -40]]); x.fillStyle = c(P.wood); x.fill();
    polyPath(x, [[-40, -140], [40, -140], [30, -70], [-30, -70]]); x.fillStyle = c('#8b3a2e'); x.fill();
    x.fillStyle = c(P.amber); for (let i = 0; i < 9; i++) x.fillRect(-29 + i * 7, -70, 3, 6);
    polyPath(x, [[-52, -150], [52, -150], [48, -160], [-48, -160]]); x.fillStyle = c(P.woodDark); x.fill();
    polyPath(x, [[-26, -160], [22, -160], [26, -170], [-22, -172]]); x.fillStyle = c(P.ink); x.fill();
  };
  PR.preacher = (x, P, pump, dark = 0) => {
    const c = col => rgba(F.mixc(hex(col), hex(P.ink), dark)), coat = c('#262327');
    line(x, [-5, -46], [-6, -1], 7, coat); line(x, [5, -46], [6, -1], 7, coat);
    polyPath(x, [[-11, -76], [11, -76], [15, -24], [-15, -24]]); x.fillStyle = coat; x.fill();
    x.fillStyle = c('#f4efe4'); x.fillRect(-2.5, -76, 5, 4);
    line(x, [-9, -72], [-16, -52], 4.8, coat); line(x, [-16, -52], [-12, -40], 4.4, coat);
    const ex = lerp(16, 19, pump), ey = lerp(-86, -92, pump), hx = lerp(17, 20, pump), hy = lerp(-96, -108, pump);
    line(x, [9, -72], [ex, ey], 4.8, coat); line(x, [ex, ey], [hx, hy], 4.4, coat);
    x.fillStyle = c(P.skin); x.beginPath(); x.ellipse(hx, hy - 2, 2.6, 3.6, .2, 0, TAU); x.fill();
    x.fillRect(-2, -82, 4, 7); x.beginPath(); x.arc(0, -86, 7, 0, TAU); x.fill();
    x.fillStyle = c('#d9d4c8'); x.beginPath(); x.arc(-.5, -90, 6.8, Math.PI * 1.05, Math.PI * 1.95); x.fill();
    return [hx, hy];
  };

  PR.CARD_W = 300; PR.CARD_H = 220;
  const cardFrame = (x, P) => {
    x.fillStyle = P.card; x.fillRect(-150, -110, 300, 220);
    x.strokeStyle = P.ink; x.lineWidth = 2.2; x.strokeRect(-141, -101, 282, 202);
  };
  const clipCard = x => { x.beginPath(); x.rect(-140, -100, 280, 200); x.clip(); };
  PR.promisePrison = (x, P, k) => {
    cardFrame(x, P); x.save(); clipCard(x);
    x.fillStyle = '#e9dcc0'; x.fillRect(-140, -100, 280, 200);
    x.fillStyle = '#b3ada0'; x.fillRect(-115, -64, 230, 150);
    x.strokeStyle = 'rgba(40,36,30,.22)'; x.lineWidth = 1;
    for (let r = 0; r < 11; r++) { const y = -64 + r * 14; x.beginPath(); x.moveTo(-115, y); x.lineTo(115, y); x.stroke(); for (let j = 0; j < 9; j++) { const xx = -115 + j * 28 + (r % 2) * 14; x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 14); x.stroke(); } }
    x.fillStyle = '#8e877b'; x.fillRect(-124, -76, 248, 13);
    for (let r = 0; r < 2; r++) for (let j = 0; j < 4; j++) {
      const cx = -84 + j * 56, cy = -30 + r * 62, ki = clamp(k * 1.6 - (r * 4 + j) * .08);
      x.fillStyle = '#3b3632'; x.fillRect(cx - 19, cy - 23, 38, 46);
      const gone = clamp(ki * 1.4);
      if (gone < 1) { x.globalAlpha = 1 - gone; x.fillStyle = '#7a7166'; x.beginPath(); x.arc(cx, cy + 2, 6.5, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx, cy + 23, 13, 12, 0, Math.PI, TAU); x.fill(); x.globalAlpha = 1; }
      x.save(); x.translate(cx - 19, cy - 23); x.scale(1 - .82 * easeOut(ki), 1);
      x.strokeStyle = P.ink; x.lineWidth = 2.4; x.strokeRect(0, 0, 38, 46);
      for (let b = 1; b < 5; b++) { x.beginPath(); x.moveTo(b * 7.6, 0); x.lineTo(b * 7.6, 46); x.stroke(); }
      x.restore();
    }
    x.restore();
  };
  const shacks = (x, healed) => {
    for (let i = 0; i < 4; i++) {
      const hx = -105 + i * 70, rot = healed ? 0 : [-.07, .05, -.04, .08][i], w = 52, h = healed ? 58 : 50 - i % 2 * 6;
      x.save(); x.translate(hx, 70); x.rotate(rot);
      x.fillStyle = healed ? '#efe0bf' : '#7d7468'; x.fillRect(-w / 2, -h, w, h);
      polyPath(x, [[-w / 2 - 5, -h + 1], [0, -h - 24], [w / 2 + 5, -h + 1]]); x.fillStyle = healed ? '#9a5238' : '#5b5047'; x.fill();
      if (!healed) { x.fillStyle = '#9b8f7f'; x.fillRect(-10, -h - 12, 14, 8); }
      x.fillStyle = healed ? '#f3c264' : '#2e2a26'; x.fillRect(-17, -h + 12, 12, 12); x.fillRect(5, -h + 12, 12, 12);
      if (!healed) { x.strokeStyle = '#c9c3b5'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(5, -h + 12); x.lineTo(17, -h + 24); x.moveTo(17, -h + 12); x.lineTo(9, -h + 20); x.stroke(); }
      x.fillStyle = healed ? '#5a3e2c' : '#3a342e'; x.fillRect(-5, -18, 10, 18);
      x.restore();
    }
  };
  PR.promiseSlum = (x, P, k) => {
    cardFrame(x, P); x.save(); clipCard(x);
    x.fillStyle = '#c9c3b5'; x.fillRect(-140, -100, 280, 200);
    x.fillStyle = '#9c9480'; x.fillRect(-140, 70, 280, 40);
    shacks(x, false);
    x.fillStyle = '#4e463e'; for (let i = 0; i < 7; i++) x.fillRect(-120 + i * 37, 74 + (i % 3) * 5, 8, 4);
    const sx = lerp(-150, 150, easeOut(k, 2));
    if (k > 0) {
      x.save(); x.beginPath(); x.rect(-150, -110, sx + 150, 220); x.clip();
      x.fillStyle = '#f6e6c6'; x.fillRect(-140, -100, 280, 200);
      x.fillStyle = '#f3b35a'; x.beginPath(); x.arc(95, -62, 16, 0, TAU); x.fill();
      x.fillStyle = '#b8ab8c'; x.fillRect(-140, 70, 280, 40);
      shacks(x, true);
      x.fillStyle = '#6f8f5a'; x.beginPath(); x.arc(-128, 20, 18, 0, TAU); x.fill(); x.fillStyle = '#6b4a30'; x.fillRect(-131, 32, 6, 38);
      for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#b5372b' : '#e39e37'; x.beginPath(); x.arc(-120 + i * 21, 76 + (i % 2) * 4, 2.6, 0, TAU); x.fill(); }
      x.restore();
      if (k < 1) { x.fillStyle = 'rgba(255,248,225,.8)'; x.fillRect(sx - 2, -100, 4, 200); }
    }
    x.restore();
  };
  PR.promiseHome = (x, P, walk, door, ta) => {
    cardFrame(x, P); x.save(); clipCard(x);
    x.fillStyle = '#f2d3a6'; x.fillRect(-140, -100, 280, 200);
    x.fillStyle = '#b8ab8c'; x.fillRect(-140, 50, 280, 60);
    x.fillStyle = '#d9cba8'; polyPath(x, [[-140, 70], [60, 54], [80, 54], [-140, 100]]); x.fill();
    const hx = 78;
    x.fillStyle = '#efe0bf'; x.fillRect(hx - 45, -20, 90, 72);
    polyPath(x, [[hx - 52, -18], [hx, -60], [hx + 52, -18]]); x.fillStyle = '#9a5238'; x.fill();
    x.fillStyle = '#f3c264'; x.fillRect(hx - 36, -6, 20, 18); x.fillStyle = P.ink; x.fillRect(hx - 27, -6, 2, 18);
    const d = easeOut(clamp(door));
    x.fillStyle = '#ffd98a'; x.fillRect(hx + 4, 12, 22, 40);
    if (d > 0) {
      x.save(); x.translate(hx + 15, 52); x.scale(.42, .42); PR.person(x, P, { kind: 'woman', coat: '#8a6044', skirt: '#4d5b68', hat: 'none', dark: .2 }); x.restore();
      x.save(); x.translate(hx + 10 - 30 * d, 56); x.scale(.26, .26); PR.person(x, P, { kind: 'man', coat: '#b5372b', trouser: '#3a3a40', hat: 'none', arm: d }); x.restore();
    }
    x.fillStyle = '#5a3e2c'; x.fillRect(hx + 4 + 22 * .82 * d, 12, 22 * (1 - .82 * d), 40);
    const wx = lerp(-125, hx - 40, easeOut(clamp(walk), 1.6)), step = walk > 0 && walk < 1 ? Math.sin(ta * TAU * 2.2) : 0;
    x.save(); x.translate(wx, 64); x.scale(.52, .52); x.rotate(step * .04);
    PR.person(x, P, { kind: 'man', coat: '#4d5b68', trouser: '#3a3a40', hat: 'bowler', hatColor: '#2c2824' });
    x.restore();
    x.restore();
  };

  PR.CAPONE_CIGAR = [[-15.4, -50.2], [-29.4, -52]];
  PR.CAPONE_EMBER = PR.CAPONE_CIGAR[1];
  PR.CAPONE_MOUTH = [-17, -49.8];
  PR.cigar = (x, butt, tip, e = .6, { col = '#5e3f28', plain = false, inset = 0 } = {}) => {
    const dx = tip[0] - butt[0], dy = tip[1] - butt[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n;
    x.save(); x.lineCap = 'butt';
    x.strokeStyle = col; x.lineWidth = 2.3; x.beginPath(); x.moveTo(butt[0] - ux * inset, butt[1] - uy * inset); x.lineTo(tip[0] - ux * 1.4, tip[1] - uy * 1.4); x.stroke();
    if (!plain) { x.strokeStyle = 'rgba(255,230,190,.2)'; x.lineWidth = .6; x.beginPath(); x.moveTo(butt[0] + uy * .75, butt[1] - ux * .75); x.lineTo(tip[0] - ux * 1.6 + uy * .75, tip[1] - uy * 1.6 - ux * .75); x.stroke(); }
    x.strokeStyle = '#6e6862'; x.lineWidth = 2; x.beginPath(); x.moveTo(tip[0] - ux * 1.6, tip[1] - uy * 1.6); x.lineTo(tip[0] - ux * .4, tip[1] - uy * .4); x.stroke();
    const r = 1.2 + .3 * e, R = r * 2.6, g = x.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], R);
    g.addColorStop(0, `rgba(255,120,40,${.4 * e})`); g.addColorStop(1, 'rgba(255,100,30,0)'); x.fillStyle = g; x.fillRect(tip[0] - R, tip[1] - R, R * 2, R * 2);
    x.fillStyle = `rgb(${225 + 30 * e | 0},${70 + 60 * e | 0},${20 + 20 * e | 0})`; x.beginPath(); x.arc(tip[0], tip[1], r, 0, TAU); x.fill();
    x.fillStyle = `rgba(255,200,110,${.35 + .45 * e})`; x.beginPath(); x.arc(tip[0] - ux * .2, tip[1] - uy * .2, r * .4, 0, TAU); x.fill();
    x.restore();
  };
  PR.caponeProfile = (x, P, o = {}) => {
    const ink = '#0b0a14';
    x.fillStyle = ink;
    polyPath(x, [[-50, 2], [-48, -20], [-38, -31], [-16, -37], [-7, -40.5], [8, -42], [27, -38], [41, -30], [49, -17], [51, 2]]); x.fill();
    const [CB, CT] = PR.CAPONE_CIGAR, V = [CT[0] - CB[0], CT[1] - CB[1]], hand = o.hand, holding = hand && o.holding;
    if (!holding) PR.cigar(x, CB, CT, o.ember ?? .6, { col: '#1b1414', plain: true, inset: 3.5 });
    x.fillStyle = ink;
    x.beginPath(); x.moveTo(9, -43);
    x.quadraticCurveTo(12, -52, 12.5, -58); x.quadraticCurveTo(14, -64, 12, -69);
    x.lineTo(-11.5, -69); x.lineTo(-12, -66.5); x.lineTo(-14.2, -63.2); x.lineTo(-13.4, -60.8); x.lineTo(-14.6, -59.4);
    x.lineTo(-20.2, -54.8); x.lineTo(-18.2, -53.4); x.lineTo(-15.8, -53); x.lineTo(-16.8, -51.2); x.lineTo(-15.4, -50.2);
    x.lineTo(-16.3, -49.1); x.lineTo(-14.9, -48); x.lineTo(-16.4, -46.2); x.quadraticCurveTo(-16.4, -43.2, -12.5, -43);
    x.lineTo(-4, -44.4); x.lineTo(-6.5, -40); x.lineTo(9, -40); x.closePath(); x.fill();
    x.fillStyle = '#e8dcc2'; polyPath(x, [[-7.6, -41.6], [-3, -40.2], [-6.4, -37.4]]); x.fill();
    x.fillStyle = ink;
    x.beginPath(); x.moveTo(-26, -66.6); x.quadraticCurveTo(-4, -71.2, 23, -69.8); x.quadraticCurveTo(0, -66.4, -26, -66.6); x.fill();
    polyPath(x, [[-12.4, -69.4], [-11.6, -76.6], [-8.2, -80.2], [-3, -78.6], [2.2, -80.4], [9, -79], [12, -74.6], [12.6, -69.6]]); x.fill();
    x.fillStyle = '#26222c'; x.fillRect(-12.3, -72.2, 25, 2.2);
    const butt = holding ? [hand[0] + 7.5, hand[1] - 2.6] : CB, tip = holding ? [butt[0] + V[0], butt[1] + V[1]] : CT;
    if (holding) PR.cigar(x, butt, tip, o.ember ?? .6, { col: '#1b1414', plain: true });
    if (hand) {
      const [hx, hy] = hand;
      x.strokeStyle = ink; x.lineCap = 'round'; x.lineWidth = 10; x.beginPath(); x.moveTo(-40, 14); x.quadraticCurveTo(-36, hy + 14, hx + 5, hy + 6); x.stroke();
      x.strokeStyle = 'rgba(80,66,90,.8)'; x.lineWidth = .8; x.beginPath(); x.moveTo(-45, 14); x.quadraticCurveTo(-41, hy + 12, hx + 1, hy + 3); x.stroke();
      x.fillStyle = ink; x.beginPath(); x.ellipse(hx + 2.5, hy + 1.2, 5.2, 4.2, -.3, 0, TAU); x.fill();
      x.strokeStyle = ink; x.lineWidth = 2.4; x.beginPath(); x.moveTo(hx + 3, hy - 1.5); x.lineTo(hx - 1.5, hy - 3.4); x.stroke();
      x.lineWidth = 2; x.beginPath(); x.moveTo(hx + 5, hy - .5); x.lineTo(hx + 2, hy - 4.8); x.stroke();
    }
    const [ex, ey] = tip;
    if (o.face > 0) {
      x.save(); x.globalCompositeOperation = 'source-atop';
      const g = x.createRadialGradient(ex + 4, ey + 1, 0, ex + 6, ey - 2, 22); g.addColorStop(0, `rgba(255,140,60,${.55 * o.face})`); g.addColorStop(1, 'rgba(255,140,60,0)');
      x.fillStyle = g; x.fillRect(ex - 10, ey - 30, 50, 44); x.restore();
    }
    return [ex, ey];
  };
  PR.caponeLit = (x, P, o = {}) => {
    const lit = o.lit ?? 1;
    if (lit < 1) PR.caponeProfile(x, P, { ember: o.ember });
    if (lit <= 0) return PR.CAPONE_EMBER;
    x.save(); x.globalAlpha *= lit;
    const suit = '#3a3846', face = '#d9ae88', faceD = '#b88a66', hat = '#5a5048';
    x.fillStyle = suit; polyPath(x, [[-50, 2], [-48, -20], [-38, -31], [-16, -37], [-7, -40.5], [8, -42], [27, -38], [41, -30], [49, -17], [51, 2]]); x.fill();
    x.save(); polyPath(x, [[-50, 2], [-48, -20], [-38, -31], [-16, -37], [-7, -40.5], [8, -42], [27, -38], [41, -30], [49, -17], [51, 2]]); x.clip();
    x.strokeStyle = 'rgba(210,205,220,.18)'; x.lineWidth = .5; for (let k = -48; k < 52; k += 4) { x.beginPath(); x.moveTo(k, -44); x.lineTo(k - 2, 4); x.stroke(); }
    x.fillStyle = '#2a2834'; polyPath(x, [[-16, -37], [-7, -40.5], [-4, -30], [-10, 2], [-30, 2]]); x.fill();
    x.fillStyle = '#f0e8d8'; polyPath(x, [[-7.6, -41.6], [-2, -40], [-4.5, -32], [-8.5, -36]]); x.fill();
    x.fillStyle = '#1c2a44'; polyPath(x, [[-5.2, -39], [-3.4, -38.6], [-4.8, -28], [-6.8, -30]]); x.fill();
    x.restore();
    const [CB, CT] = PR.CAPONE_CIGAR; PR.cigar(x, CB, CT, o.ember ?? .6, { inset: 3.5 });
    x.beginPath(); x.moveTo(9, -43);
    x.quadraticCurveTo(12, -52, 12.5, -58); x.quadraticCurveTo(14, -64, 12, -69);
    x.lineTo(-11.5, -69); x.lineTo(-12, -66.5); x.lineTo(-14.2, -63.2); x.lineTo(-13.4, -60.8); x.lineTo(-14.6, -59.4);
    x.lineTo(-20.2, -54.8); x.lineTo(-18.2, -53.4); x.lineTo(-15.8, -53); x.lineTo(-16.8, -51.2); x.lineTo(-15.4, -50.2);
    x.lineTo(-16.3, -49.1); x.lineTo(-14.9, -48); x.lineTo(-16.4, -46.2); x.quadraticCurveTo(-16.4, -43.2, -12.5, -43);
    x.lineTo(-4, -44.4); x.lineTo(-6.5, -40); x.lineTo(9, -40); x.closePath(); x.fillStyle = face; x.fill();
    x.save(); x.clip();
    x.fillStyle = faceD; x.fillRect(0, -70, 16, 32);
    x.fillStyle = '#2a2420'; polyPath(x, [[3, -69], [13, -69], [13, -56], [8, -58], [5, -64]]); x.fill();
    x.fillStyle = faceD; x.beginPath(); x.ellipse(3.6, -56.5, 2.4, 3.4, .2, 0, TAU); x.fill();
    x.strokeStyle = '#9a6a52'; x.lineWidth = .7; for (const [a, b] of [[[-9.6, -57], [-5.4, -50.5]], [[-8.2, -58.2], [-4.2, -52.6]], [[-10.4, -53], [-7.6, -49.4]]]) { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
    x.fillStyle = '#2a2420'; x.beginPath(); x.ellipse(-11.6, -60.6, 1.6, .9, -.2, 0, TAU); x.fill();
    x.strokeStyle = '#2a2420'; x.lineWidth = .8; x.beginPath(); x.moveTo(-14, -62.6); x.lineTo(-9.4, -62.8); x.stroke();
    const g = o.grin || 0; x.beginPath(); x.moveTo(-15.4, -50.2); x.quadraticCurveTo(-13.2, -49.9 + .5 * g, -11, -50 - 1.3 * g); x.stroke();
    x.restore();
    x.fillStyle = hat;
    x.beginPath(); x.moveTo(-26, -66.6); x.quadraticCurveTo(-4, -71.2, 23, -69.8); x.quadraticCurveTo(0, -66.4, -26, -66.6); x.fill();
    polyPath(x, [[-12.4, -69.4], [-11.6, -76.6], [-8.2, -80.2], [-3, -78.6], [2.2, -80.4], [9, -79], [12, -74.6], [12.6, -69.6]]); x.fill();
    x.fillStyle = '#1c1814'; x.fillRect(-12.3, -72.2, 25, 2.2);
    x.fillStyle = 'rgba(255,240,210,.18)'; polyPath(x, [[-11.6, -76.6], [-8.2, -80.2], [-3, -78.6], [-6, -74]]); x.fill();
    x.restore();
    return PR.CAPONE_EMBER;
  };
  PR.exhale = (x, t, t0, len = .8) => {
    const d = t - t0; if (d <= 0 || d > len + 1.6) return;
    const [mx, my] = PR.CAPONE_MOUTH;
    for (let i = 0; i < 14; i++) {
      const born = i / 13 * len, age = d - born; if (age <= 0) continue;
      const a = Math.max(0, .62 * (1 - age / 1.6)) * Math.min(1, age * 8), r = 1.8 + age * 8.5;
      const px = mx - 3 - age * 13 - i * .3 + Math.sin(age * 3 + i) * 1.5, py = my - 1 - age * 7 - Math.sin(i * 1.7) * 1.2;
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(236,226,212,${a})`); g.addColorStop(1, 'rgba(236,226,212,0)');
      x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
  };
  PR.smoke = (x, t, puff = 0, scale = 1) => {
    x.save(); x.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const ph = t * .45 + i * .2, u = ph % 1, a = Math.sin(u * Math.PI) * (.22 + .25 * puff);
      x.strokeStyle = `rgba(235,225,210,${a})`; x.lineWidth = (1.2 + u * 3) * scale;
      x.beginPath(); x.moveTo(0, 0);
      for (let k = 1; k <= 12; k++) { const v = k / 12 * (u * 1.4 + .2); x.lineTo((Math.sin(v * 5 + i + t * .8) * 4 + v * 10) * scale, -v * 46 * scale); }
      x.stroke();
    }
    x.restore();
  };

  PR.eraVessel = (x, P, i) => {
    x.save();
    if (i === 0) {
      x.strokeStyle = '#d8b36a'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(-20, -300); x.lineTo(-120, -460); x.moveTo(15, -300); x.lineTo(90, -470); x.stroke();
      x.fillStyle = '#a0603a'; x.beginPath(); x.moveTo(-50, -290); x.quadraticCurveTo(-170, -250, -150, -120); x.quadraticCurveTo(-130, 0, 0, 0); x.quadraticCurveTo(130, 0, 150, -120); x.quadraticCurveTo(170, -250, 50, -290); x.closePath(); x.fill();
      x.fillStyle = '#7f4a2c'; x.fillRect(-55, -305, 110, 22); x.strokeStyle = 'rgba(60,30,15,.5)'; x.lineWidth = 4; for (const y of [-200, -170]) { x.beginPath(); x.moveTo(-150, y); x.quadraticCurveTo(0, y + 25, 150, y); x.stroke(); }
    } else if (i === 1) {
      const jar = () => { x.beginPath(); x.moveTo(-40, -380); x.quadraticCurveTo(-120, -300, -95, -140); x.quadraticCurveTo(-70, -20, 0, 0); x.quadraticCurveTo(70, -20, 95, -140); x.quadraticCurveTo(120, -300, 40, -380); x.closePath(); };
      x.fillStyle = '#c28a55'; jar(); x.fill();
      x.save(); jar(); x.clip(); x.fillStyle = '#9b3a2e'; for (const y of [-300, -250, -110]) x.fillRect(-130, y, 260, 14); x.restore();
      x.fillStyle = '#8a5a34'; x.fillRect(-48, -395, 96, 20);
    } else if (i === 2) {
      x.fillStyle = '#c56a3a'; x.beginPath(); x.moveTo(-45, -380); x.quadraticCurveTo(-150, -320, -120, -170); x.quadraticCurveTo(-80, -40, -30, -20); x.lineTo(-40, 0); x.lineTo(40, 0); x.lineTo(30, -20); x.quadraticCurveTo(80, -40, 120, -170); x.quadraticCurveTo(150, -320, 45, -380); x.closePath(); x.fill();
      x.fillStyle = '#1c1614'; x.fillRect(-126, -250, 252, 70); x.fillRect(-60, -400, 120, 22);
      x.strokeStyle = '#1c1614'; x.lineWidth = 12; x.beginPath(); x.moveTo(-45, -360); x.quadraticCurveTo(-120, -400, -115, -300); x.moveTo(45, -360); x.quadraticCurveTo(120, -400, 115, -300); x.stroke();
      x.fillStyle = '#c56a3a'; for (let k = 0; k < 9; k++) { const px = -110 + k * 27.5; polyPath(x, [[px, -184], [px + 13, -244], [px + 26, -184]]); x.fill(); }
    } else if (i === 3) {
      x.fillStyle = '#b0864a'; x.beginPath(); x.moveTo(-140, -300); x.quadraticCurveTo(-130, -170, 0, -150); x.quadraticCurveTo(130, -170, 140, -300); x.closePath(); x.fill();
      x.fillStyle = '#8a6636'; x.fillRect(-14, -155, 28, 125); x.beginPath(); x.ellipse(0, -18, 80, 18, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,240,200,.35)'; x.fillRect(-110, -290, 20, 110);
    } else if (i === 4) {
      x.fillStyle = '#8e9296'; x.fillRect(-150, -290, 170, 290); x.fillStyle = '#6f7478'; x.fillRect(-160, -300, 190, 26); x.beginPath(); x.ellipse(-65, -305, 95, 18, 0, Math.PI, TAU); x.fill();
      x.strokeStyle = '#6f7478'; x.lineWidth = 20; x.beginPath(); x.arc(30, -150, 70, -1.2, 1.2); x.stroke();
      x.fillStyle = '#7a5436'; x.fillRect(80, -170, 110, 170); x.fillStyle = '#5a3b25'; x.fillRect(80, -120, 110, 12); x.fillRect(80, -50, 110, 12);
    } else {
      x.fillStyle = '#6b4a30'; x.beginPath(); x.moveTo(-150, 0); x.quadraticCurveTo(-175, -135, -150, -270); x.lineTo(150, -270); x.quadraticCurveTo(175, -135, 150, 0); x.closePath(); x.fill();
      x.fillStyle = '#3a2a1c'; for (const y of [-240, -150, -40]) x.fillRect(-165, y, 330, 14);
      x.save(); x.translate(-40, -270); PR.bottle(x, P, 250); x.restore();
      PR.shotGlass(x, P, 70, -270, 1);
    }
    x.restore();
  };
  PR.shotGlass = (x, P, gx, gy, s = 1, fill = .7) => {
    x.save(); x.translate(gx, gy); x.scale(s, s);
    x.fillStyle = 'rgba(220,235,240,.75)'; polyPath(x, [[-22, 0], [22, 0], [28, -60], [-28, -60]]); x.fill();
    x.fillStyle = P.amber; polyPath(x, [[-20, -4], [20, -4], [20 + 8 * fill * .9, -4 - 52 * fill], [-20 - 8 * fill * .9, -4 - 52 * fill]]); x.fill();
    x.strokeStyle = 'rgba(40,40,40,.5)'; x.lineWidth = 2; polyPath(x, [[-22, 0], [22, 0], [28, -60], [-28, -60]]); x.stroke();
    x.restore();
  };

  F.props = PR;
})();
