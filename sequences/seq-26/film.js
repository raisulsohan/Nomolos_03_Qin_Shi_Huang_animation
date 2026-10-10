(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, QM = F.qinmap, { clamp, smooth, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-26'), DUR = C.duration, GT0 = C.T.start;
  const LP = F.look('paper', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const S25 = () => F.getScene('seq-25'), A25 = () => S25().api, A24 = () => F.getScene('seq-24').api;

  const T_HON = 0.52, T_CHAN = 3.14;
  const T_SIMA = 4.23, T_FULL = 5.33, T_CENT = 5.64, T_LATER = 6.19, T_DYN = 7.16, T_REPL = 7.76, T_QIN = 8.36;
  const T_REASON = 9.49, T_PAINT = 10.02, T_FIRST = 10.54, T_MON = 11.54;
  const T_NUM = 13.01, T_DET = 14.35, T_PAT = 16.41, T_VIOL = 19.09, T_ELIX = 19.86;
  const T_CONS = 21.57, T_SRC = 22.76;

  const DY = .36, PW = M45 ? .52 : .8, PH = PW * H / W, PC = [0, DY + .002, .42];
  const PX0 = PC[0] - PW / 2, PZ1 = PC[2] + PH / 2;
  const D = { x0: PX0 - 1.36, x1: 1.6, z0: PC[2] - .42, z1: PC[2] + .42 };
  const SLIP = { x0: PW / 2 + .1, x1: 1.44, n: 50, w: .0256 }, SLIPZ = [PC[2] - .13, PC[2] + .13];
  const SRC_B = { x0: PX0 - .52, x1: PX0 - .07 }, SRC_A = { x0: PX0 - 1.22, x1: PX0 - .6 };
  const SIMA = [2.32, 0, PC[2] + .02];
  const INK = '#2c2824', SILK = '#efe4c8', LACQ = '#5a2a1e';
  const P2W = (px, py) => [PX0 + px * PW / W, PC[1] + .001, PZ1 - py * PH / H];

  let PAINT = null;
  function paintings() {
    if (PAINT) return PAINT;
    const sv = F.SHIFT; F.SHIFT = null;
    const [c0, x0] = F.canvas(W, H); A25().frame(x0, A25().DUR, A25().camAt(A25().DUR), { noText: true });
    const [c1, x1] = F.canvas(W, H); x1.drawImage(c0, 0, 0);
    x1.globalCompositeOperation = 'saturation'; x1.fillStyle = '#808080'; x1.fillRect(0, 0, W, H);
    x1.globalCompositeOperation = 'screen'; x1.fillStyle = 'rgba(70,58,44,1)'; x1.fillRect(0, 0, W, H);
    x1.globalCompositeOperation = 'color'; x1.globalAlpha = .55; x1.fillStyle = '#7a5a3a'; x1.fillRect(0, 0, W, H); x1.globalAlpha = 1;
    x1.globalCompositeOperation = 'multiply'; x1.fillStyle = '#efe0c0'; x1.fillRect(0, 0, W, H);
    x1.globalCompositeOperation = 'source-over';
    const [c2, x2] = F.canvas(W, H); x2.fillStyle = '#e2d3b0'; x2.fillRect(0, 0, W, H); x2.filter = 'blur(9px)'; x2.drawImage(c1, 0, 0); x2.filter = 'none';
    F.SHIFT = sv;
    const cam = A25().camAt(A25().DUR), G = A24().giantAt(cam, 1, 1), b = cam.proj([G.x, G.base, G.z]);
    const N = A25().N460;
    return (PAINT = { c0, c1, c2, giant: b ? { x: b[0], y: b[1], s: G.m * b[3] } : null, N });
  }
  const drain = t => ss(.4, 3.2, t), blurK = t => ss(T_DET - .05, T_DET + .7, t);
  let MIX = null;
  function painting(ctx, cam, t) {
    const P = paintings(), sh = SH(), NX = 12, NY = 8, tw = W / NX, th = H / NY, dk = drain(t), bk = blurK(t), OV = 3;
    if (!MIX) MIX = F.canvas(W, H);
    const [mc, mx] = MIX; mx.setTransform(1, 0, 0, 1, 0, 0); mx.globalAlpha = 1; mx.globalCompositeOperation = 'source-over'; mx.filter = 'none';
    mx.drawImage(P.c0, 0, 0); if (dk > 0) { mx.globalAlpha = dk; mx.drawImage(P.c1, 0, 0); } if (bk > 0) { mx.globalAlpha = bk; mx.drawImage(P.c2, 0, 0); } mx.globalAlpha = 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    if (t < .02) S3.onPlane(ctx, cam, P2W(0, 0), [PW / W, 0, 0], [0, 0, -PH / H], x => x.drawImage(mc, 0, 0));
    else {
      const G = [];
      for (let j = 0; j <= NY; j++) { const row = []; for (let i = 0; i <= NX; i++) { const u = i * tw, v = j * th, p = cam.proj(P2W(u, v)); row.push(p ? [u, v, p[0] - 0, p[1]] : null); } G.push(row); }
      const tri = (A, B, Cc) => {
        if (!A || !B || !Cc) return;
        const du1 = B[0] - A[0], dv1 = B[1] - A[1], du2 = Cc[0] - A[0], dv2 = Cc[1] - A[1], det = du1 * dv2 - du2 * dv1; if (Math.abs(det) < 1e-9) return;
        const dx1 = B[2] - A[2], dy1 = B[3] - A[3], dx2 = Cc[2] - A[2], dy2 = Cc[3] - A[3];
        const a = (dx1 * dv2 - dx2 * dv1) / det, c = (dx2 * du1 - dx1 * du2) / det, b = (dy1 * dv2 - dy2 * dv1) / det, d = (dy2 * du1 - dy1 * du2) / det;
        const e = A[2] - a * A[0] - c * A[1], f = A[3] - b * A[0] - d * A[1];
        const cx = (A[2] + B[2] + Cc[2]) / 3, cy = (A[3] + B[3] + Cc[3]) / 3, grow = q => { const dx = q[2] - cx, dy = q[3] - cy, l = Math.hypot(dx, dy) || 1; return [q[2] + dx / l * 1.2, q[3] + dy / l * 1.2]; };
        const g = [grow(A), grow(B), grow(Cc)];
        ctx.save(); ctx.beginPath(); ctx.moveTo(g[0][0], g[0][1]); ctx.lineTo(g[1][0], g[1][1]); ctx.lineTo(g[2][0], g[2][1]); ctx.closePath(); ctx.clip();
        ctx.transform(a, b, c, d, e, f);
        const u0 = Math.max(0, Math.min(A[0], B[0], Cc[0]) - OV), v0 = Math.max(0, Math.min(A[1], B[1], Cc[1]) - OV), u1 = Math.min(W, Math.max(A[0], B[0], Cc[0]) + OV), v1 = Math.min(H, Math.max(A[1], B[1], Cc[1]) + OV);
        ctx.drawImage(mc, u0, v0, u1 - u0, v1 - v0, u0, v0, u1 - u0, v1 - v0); ctx.restore();
      };
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { tri(G[j][i], G[j][i + 1], G[j + 1][i + 1]); tri(G[j][i], G[j + 1][i + 1], G[j + 1][i]); }
    }
    ctx.restore();
  }
  function onPage(ctx, cam, px, py, fn) { const sh = SH(); ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); S3.onPlane(ctx, cam, P2W(px, py), [PW / W, 0, 0], [0, 0, -PH / H], x => { x.translate(-px, -py); fn(x); }); ctx.restore(); }
  function num(x, t) {
    const N = paintings().N, font = `900 ${N.size}px NSC`, inkK = ss(.4, 2.6, t);
    x.font = font; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    const ws = [...'460'].map(ch => x.measureText(ch).width), tr = N.size * .04, tw = ws.reduce((a, b) => a + b, 0) + tr * 2;
    const x0 = N.x * W - tw / 2, y = N.y * H + N.size * .36;
    let xx = x0;
    [...'460'].forEach((ch, i) => { x.fillStyle = `rgba(0,0,0,${.55 * (1 - inkK)})`; x.fillText(ch, xx + 4, y + 5); x.fillStyle = S3.mix(N.col, '#b5372b', inkK); x.fillText(ch, xx, y); xx += ws[i] + tr; });
    const q = ss(T_NUM + .05, T_NUM + .5, t); if (q <= 0) return;
    const qx = x0 + tw + tr * 2, qw = x.measureText('?').width;
    x.save(); x.beginPath(); x.rect(qx - 10, y - N.size * .9, qw + 20, N.size * 1.05 * q); x.clip(); x.fillStyle = '#2a1c16'; x.fillText('?', qx, y); x.restore();
  }
  const GIANT_INK = Q.silhouette('emperor', '#1a1210', '#1a1210'), EYE = '#f3e6c8';
  let HALO = null;
  function halo(g) {
    if (HALO) return HALO;
    const HP = A24().HPOSE, KO = A24().KOPT, k = g.s * 1.35, w = Math.ceil(120 * k), h = Math.ceil(130 * k), ox = w * .5, oy = h * .86;
    const [cv, x] = F.canvas(w, h);
    for (let i = 0; i < 6; i++) { x.save(); x.globalAlpha = .2; x.filter = `blur(${2 + i}px)`; x.translate(ox + (hash(i, 3) - .5) * 9 * g.s, oy + (hash(i, 4) - .7) * 6 * g.s); const s = g.s * (1 + .05 * (i + 1)); x.scale(s, s); Q.draw(x, LP.P, HP, GIANT_INK, KO); x.restore(); }
    return (HALO = { cv, ox, oy });
  }
  function monster(x, t) {
    const P = paintings(), g = P.giant; if (!g) return;
    const lit = bump(t, T_PAINT - .1, T_FIRST + .1, T_MON + .3, T_MON + 1.2), m = ss(T_MON - .1, T_MON + .7, t);
    const HP = A24().HPOSE, KO = A24().KOPT, J = Mo.joints(HP);
    if (lit > 0) { const r = g.s * 60; const gr = x.createRadialGradient(g.x, g.y - g.s * 32, 0, g.x, g.y - g.s * 32, r); gr.addColorStop(0, `rgba(255,214,150,${.45 * lit})`); gr.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = gr; x.fillRect(g.x - r, g.y - g.s * 32 - r, 2 * r, 2 * r); }
    if (m <= 0) return;
    const grow = 1 + .7 * m, one = (s, dx, dy, a, blur) => { x.save(); x.globalAlpha = a; if (blur) x.filter = `blur(${blur}px)`; x.translate(g.x + dx * g.s, g.y + dy * g.s); x.scale(g.s * s, g.s * s); Q.draw(x, LP.P, HP, GIANT_INK, KO); x.restore(); };
    const HL = halo(g); x.save(); x.globalAlpha = m; x.translate(g.x, g.y); x.scale(grow, grow); x.drawImage(HL.cv, -HL.ox, -HL.oy); x.restore();
    one(grow, 0, 0, Math.min(1, 1.5 * m), 0);
    const s = g.s * grow, hc = [J.head[0] + 2.5, J.head[1] + .5], e = ss(T_MON + .15, T_MON + .45, t);
    if (e > 0) for (const dx of [-3.4, 2.8]) { const ex = g.x + (hc[0] + dx) * s, ey = g.y + hc[1] * s; x.fillStyle = `rgba(255,240,200,${.35 * e})`; x.beginPath(); x.ellipse(ex, ey, 4.4 * s, 2 * s, -.15, 0, TAU); x.fill(); x.fillStyle = EYE; x.beginPath(); x.ellipse(ex, ey, 3 * s, .85 * s * e, -.15, 0, TAU); x.fill(); }
  }

  const quad = (x, cam, P, col) => { if (S3.poly(x, cam, P)) { x.fillStyle = col; x.fill(); return true; } return false; };
  const lines = (x, cam, segs, col, wpx) => { x.strokeStyle = col; x.lineWidth = wpx; x.beginPath(); for (const [a, b] of segs) S3.line(x, cam, a, b); x.stroke(); };
  const WIN = { x0: 2.0, x1: 3.9, y0: .5, y1: 2.05 }, BZ = 2.6;
  const LIGHT = [.35, .55, -.75];
  function room(x, cam, t) {
    quad(x, cam, [[-4, 0, -3], [4.5, 0, -3], [4.5, 0, BZ], [-4, 0, BZ]], '#cdb68c');
    const segs = []; for (let X = -4; X <= 4.5; X += .12) segs.push([[X, .001, -3], [X, .001, BZ]]);
    lines(x, cam, segs, 'rgba(120,96,60,.18)', 1);
    if (S3.poly(x, cam, [[WIN.x0 - .2, .002, BZ], [WIN.x1 + .2, .002, BZ], [WIN.x1 - .6, .002, .4], [WIN.x0 - 1.2, .002, .4]])) { x.fillStyle = 'rgba(255,246,220,.35)'; x.fill(); }
    const a = S3.clip(cam, [[-4, 0, BZ], [4.5, 0, BZ], [4.5, 3.2, BZ], [-4, 3.2, BZ]]), b = S3.clip(cam, [[WIN.x0, WIN.y0, BZ], [WIN.x0, WIN.y1, BZ], [WIN.x1, WIN.y1, BZ], [WIN.x1, WIN.y0, BZ]]);
    if (b.length > 2) {
      x.save(); x.beginPath(); b.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.clip();
      x.fillStyle = '#f8f0dc'; x.fill();
      for (let i = 0; i < 9; i++) { const X = WIN.x0 - .4 + i * .32 + .08 * Math.sin(i * 3.1), p0 = cam.proj([X, 0, BZ + 1.4]), p1 = cam.proj([X + .05, 3.4, BZ + 1.4]); if (!p0 || !p1) continue; x.strokeStyle = 'rgba(122,146,120,.55)'; x.lineWidth = Math.max(2, .045 * p0[3]); x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke(); }
      x.restore();
    }
    if (a.length > 2) { x.beginPath(); for (const s of [a, b]) if (s.length > 2) { s.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); } x.fillStyle = '#e4d6b8'; x.fill('evenodd'); }
    const lat = []; for (let X = WIN.x0; X <= WIN.x1 + 1e-6; X += .25) lat.push([[X, WIN.y0, BZ - .01], [X, WIN.y1, BZ - .01]]); for (let Y = WIN.y0; Y <= WIN.y1 + 1e-6; Y += .32) lat.push([[WIN.x0, Y, BZ - .01], [WIN.x1, Y, BZ - .01]]);
    lines(x, cam, lat, '#6a4a30', Math.max(1.5, cam.f / 900));
    for (const X of [-1.6, 1.7, 4.2]) S3.box(x, cam, { x0: X - .09, x1: X + .09, y0: 0, y1: 3.2, z0: BZ - .12, z1: BZ }, { col: '#7a5236', light: LIGHT, lo: .55, ink: INK });
    S3.box(x, cam, { x0: -1.45, x1: .55, y0: 0, y1: 1.5, z0: BZ - .45, z1: BZ - .12 }, { col: '#8a603f', light: LIGHT, lo: .55, ink: INK });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const X = -1.32 + i * .2, Y = .25 + r * .45, c = [X, Y, BZ - .5]; S3.bar(x, cam, [X, Y, BZ - .42], [X, Y, BZ - .14], .07, { col: S3.mix('#c8a868', '#9a7a48', hash(i, r)), light: [0, .3, -1], lo: .55, ink: INK, n: 8 }); }
  }
  function slips(x, cam, t, a = 1) {
    const run = ss(T_FULL - .05, T_LATER + .35, t), gold = 1 - ss(T_REPL - .1, T_QIN + .3, t), warm = ss(T_DYN, T_QIN + .3, t) * (1 - .6 * ss(T_REASON, T_MON, t));
    for (let i = 0; i < SLIP.n; i++) {
      const X0 = SLIP.x0 + i * SLIP.w, X1 = X0 + SLIP.w * .92, u = (i + .5) / SLIP.n, lit = bump(run * 1.15 - u, -.02, .02, .12, .3);
      let col = S3.mix('#d9bf86', '#b89a5e', hash(i, 1) * .6);
      if (i < 4) col = S3.mix(col, '#d9a443', .85 * gold);
      else col = S3.mix(col, '#f0c890', .35 * warm);
      col = S3.mix(col, '#fff2c8', .8 * lit);
      quad(x, cam, [[X0, DY + .004, SLIPZ[0]], [X1, DY + .004, SLIPZ[0]], [X1, DY + .004, SLIPZ[1]], [X0, DY + .004, SLIPZ[1]]], col);
      const segs = []; for (let k = 0; k < 9; k++) { const z = SLIPZ[1] - .02 - k * .026; if (hash(i, k + 3) < .2) continue; segs.push([[(X0 + X1) / 2, DY + .005, z], [(X0 + X1) / 2, DY + .005, z - .012]]); }
      lines(x, cam, segs, 'rgba(40,28,20,.7)', Math.max(1, cam.f / 1400));
    }
    lines(x, cam, [[[SLIP.x0, DY + .006, SLIPZ[0] + .05], [SLIP.x1, DY + .006, SLIPZ[0] + .05]], [[SLIP.x0, DY + .006, SLIPZ[1] - .05], [SLIP.x1, DY + .006, SLIPZ[1] - .05]]], '#6a4a2a', Math.max(1, cam.f / 1200));
    const br = ss(T_REPL, T_QIN + .2, t); if (br > 0) { const X = SLIP.x0 + 4 * SLIP.w - .003; quad(x, cam, [[X - .003, DY + .007, SLIPZ[0] - .01], [X + .003, DY + .007, SLIPZ[0] - .01], [X + .003, DY + .007, SLIPZ[1] + .01], [X - .003, DY + .007, SLIPZ[1] + .01]], `rgba(120,70,40,${.8 * br})`); }
  }
  function sources(x, cam, t) {
    const glow = i => bump(t, T_CONS + .3 * i, T_CONS + .3 * i + .3, DUR + 1, DUR + 2);
    const nA = 14, wA = (SRC_A.x1 - SRC_A.x0) / nA;
    for (let i = 0; i < nA; i++) { const X0 = SRC_A.x0 + i * wA; quad(x, cam, [[X0, DY + .004, PC[2] - .16], [X0 + wA * .93, DY + .004, PC[2] - .16], [X0 + wA * .93, DY + .004, PC[2] + .16], [X0, DY + .004, PC[2] + .16]], S3.mix(S3.mix('#9a7448', '#7a5a36', hash(i, 5)), '#ffe0a0', .4 * glow(0))); }
    const sA = []; for (let i = 0; i < nA; i++) for (let k = 0; k < 7; k++) { if (hash(i, k + 20) < .25) continue; const X = SRC_A.x0 + (i + .45) * wA, z = PC[2] + .13 - k * .04; sA.push([[X, DY + .005, z], [X, DY + .005, z - .018]]); }
    lines(x, cam, sA, 'rgba(30,20,14,.75)', Math.max(1, cam.f / 1300));
    lines(x, cam, [[[SRC_A.x0 - .03, DY + .006, PC[2] - .1], [SRC_A.x1 + .03, DY + .006, PC[2] - .1]], [[SRC_A.x0 - .03, DY + .006, PC[2] + .1], [SRC_A.x1 + .03, DY + .006, PC[2] + .1]]], '#4a3018', Math.max(1.2, cam.f / 900));
    S3.bar(x, cam, [SRC_A.x0 - .05, DY + .035, PC[2] - .17], [SRC_A.x0 - .05, DY + .035, PC[2] + .17], .035, { col: '#7a5a36', light: LIGHT, lo: .5, ink: INK });
    const B = [[SRC_B.x0, DY + .004, PC[2] - .2], [SRC_B.x1, DY + .004, PC[2] - .19], [SRC_B.x1 + .01, DY + .004, PC[2] + .2], [SRC_B.x0 - .01, DY + .004, PC[2] + .19]];
    quad(x, cam, B, S3.mix('#e8dcc0', '#fff0c8', .5 * glow(1)));
    const sB = []; for (let i = 0; i < 12; i++) { const X = SRC_B.x0 + .03 + i * .034; sB.push([[X, DY + .005, PC[2] - .17], [X, DY + .005, PC[2] + .17]]); }
    lines(x, cam, sB, 'rgba(110,70,50,.28)', 1);
    const tB = []; for (let i = 0; i < 11; i++) for (let k = 0; k < 9; k++) { if (hash(i, k + 40) < .3) continue; const X = SRC_B.x0 + .047 + i * .034, z = PC[2] + .15 - k * .035; tB.push([[X, DY + .005, z], [X, DY + .005, z - .014]]); }
    lines(x, cam, tB, 'rgba(40,28,22,.7)', Math.max(1, cam.f / 1500));
  }
  function desk(x, cam, t) {
    const o = { col: LACQ, light: LIGHT, lo: .45, ink: '#1a0e0a' };
    for (const [X, Z] of [[D.x0 + .08, D.z0 + .08], [D.x1 - .08, D.z0 + .08], [D.x0 + .08, D.z1 - .08], [D.x1 - .08, D.z1 - .08]].map(p => ({ p, d: cam.depth([p[0], .2, p[1]]) })).sort((a, b) => b.d - a.d).map(e => e.p)) S3.box(x, cam, { x0: X - .04, x1: X + .04, y0: 0, y1: DY - .03, z0: Z - .04, z1: Z + .04 }, o);
    S3.box(x, cam, { x0: D.x0, x1: D.x1, y0: DY - .03, y1: DY, z0: D.z0, z1: D.z1 }, { ...o, top: '#6a3424' });
    lines(x, cam, [[[D.x0, DY + .001, D.z0], [D.x1, DY + .001, D.z0]]], '#c99a52', Math.max(1, cam.f / 1100));
    quad(x, cam, [[PX0 - .045, DY + .001, PC[2] - PH / 2 - .035], [PX0 + PW + .045, DY + .001, PC[2] - PH / 2 - .035], [PX0 + PW + .045, DY + .001, PZ1 + .035], [PX0 - .045, DY + .001, PZ1 + .035]], SILK);
    for (const X of [PX0 - .06, PX0 + PW + .06]) S3.bar(x, cam, [X, DY + .022, PC[2] - PH / 2 - .06], [X, DY + .022, PZ1 + .06], .02, { col: '#8a5a32', light: LIGHT, lo: .45, ink: INK });
    sources(x, cam, t); slips(x, cam, t);
    const IS = [1.36, PC[2] + .27];
    S3.box(x, cam, { x0: IS[0] - .07, x1: IS[0] + .07, y0: DY, y1: DY + .03, z0: IS[1] - .1, z1: IS[1] + .1 }, { col: '#3a3634', light: LIGHT, lo: .45, ink: INK, top: '#1a1818' });
    const BR = [1.38, PC[2] - .24];
    for (const dx of [-.05, .05]) S3.box(x, cam, { x0: BR[0] + dx - .012, x1: BR[0] + dx + .012, y0: DY, y1: DY + .05, z0: BR[1] - .02, z1: BR[1] + .02 }, { col: '#6a4a2a', light: LIGHT, lo: .5, ink: INK });
    S3.bar(x, cam, [BR[0] - .14, DY + .056, BR[1]], [BR[0] + .09, DY + .056, BR[1]], .006, { col: '#c8a868', light: LIGHT, lo: .55, ink: INK });
    S3.bar(x, cam, [BR[0] + .09, DY + .056, BR[1]], [BR[0] + .14, DY + .056, BR[1]], .009, { col: '#1e1612', light: LIGHT, lo: .7, ink: INK });
  }
  const SPOSE = Q.kneel({ lean: -.03, head: .02, arms: [[.2, 2.75], [.25, 2.8]] }), SLOOK = Q.silhouette('minister', INK, INK);
  function sima(x, cam, t) {
    const fa = S3.figureAt(cam, SIMA, Math.PI); if (!fa || fa.depth < 1) return null;
    const hd = Math.hypot(cam.pos[0] - SIMA[0], cam.pos[2] - SIMA[2]), tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - .7, hd)), 0, .35);
    const pose = { ...SPOSE, lean: SPOSE.lean + .006 * Math.sin(t * 1.3), yaw: fa.yaw };
    for (let i = 0; i < 2; i++) { x.save(); x.translate(fa.sx, fa.sy); x.scale(fa.s, fa.s); Q.draw(x, LP.P, pose, SLOOK, { kneel: true, beard: true, profile: true, tilt, shadow: 0 }); x.restore(); }
    return { sx: fa.sx, sy: fa.sy - 82 * fa.s };
  }
  function near(x, cam, t) {
    const L = [-1.15, -.62], o = { col: '#6a5030', light: LIGHT, lo: .4, ink: INK };
    S3.cyl(x, cam, L, .16, 0, .05, o); S3.bar(x, cam, [L[0], .05, L[1]], [L[0], 1.25, L[1]], .025, o);
    S3.cyl(x, cam, L, .13, 1.25, 1.31, { ...o, col: '#8a6a3a' });
  }

  const LX0 = SRC_A.x0 + .08, LX1 = SLIP.x0 + .35, LZ = PC[2] - .02;
  const DROPS = [.34, .52, .7, .86].map((u, i) => ({ u, t: T_ELIX + .05 + i * .28 }));
  const lineY = (u, t) => DY + .04 + .13 * u + DROPS.reduce((a, d) => a + .045 * ss(d.t + .3, d.t + .45, t) * ss(d.u - .015, d.u + .015, u), 0);
  function risingLine(ctx, cam, t) {
    const k = ss(T_PAT - .05, T_VIOL + .45, t); if (k <= 0) return;
    const N = 70, pts = []; for (let i = 0; i <= N; i++) { const u = k * i / N, p = cam.proj([lerp(LX0, LX1, u), lineY(u, t), LZ]); if (!p) return; pts.push(p); }
    const sh = SH(), kE = pts[N][3], hw = Math.max(7, .018 * kE), hl = Math.max(16, .05 * kE), ww = i => Math.max(3.2, .0075 * pts[i][3]);
    let L = 0; const acc = [0]; for (let i = 1; i <= N; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(L); }
    let ib = N; while (ib > 1 && L - acc[ib - 1] < hl) ib--;
    const nrm = i => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    const left = [], right = []; for (let i = 0; i <= ib; i++) { const n = nrm(i), r = ww(i); left.push([pts[i][0] + n[0] * r, pts[i][1] + n[1] * r]); right.push([pts[i][0] - n[0] * r, pts[i][1] - n[1] * r]); }
    const nb = nrm(ib), tip = pts[N];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    ctx.beginPath(); left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineTo(pts[ib][0] + nb[0] * hw, pts[ib][1] + nb[1] * hw); ctx.lineTo(tip[0], tip[1]); ctx.lineTo(pts[ib][0] - nb[0] * hw, pts[ib][1] - nb[1] * hw); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath();
    ctx.fillStyle = 'rgba(40,20,14,.25)'; ctx.save(); ctx.translate(3, 5); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#a8322a'; ctx.fill(); ctx.strokeStyle = '#2c1a14'; ctx.lineWidth = Math.max(1.2, .0018 * kE); ctx.lineJoin = 'miter'; ctx.stroke();
    for (const d of DROPS) {
      const f = clamp((t - d.t) / .35); if (t < d.t || t > d.t + 1.2) continue;
      const X = lerp(LX0, LX1, d.u), y0 = lineY(d.u, t) + .02, p = cam.proj([X, y0 + .55 * (1 - f * f), LZ]); if (!p) continue;
      const r = Math.max(3, .012 * p[3]), a = 1 - ss(.5, 1.2, t - d.t);
      PR.glow(ctx, p[0], p[1], r * 3, '#dfe8ff', .5 * a, 'flat'); ctx.fillStyle = `rgba(236,242,250,${a})`; ctx.beginPath(); ctx.ellipse(p[0], p[1], r, r * (1 + .6 * (1 - f)), 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function sourceLight(ctx, cam, t) {
    const sh = SH(); ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    [(SRC_A.x0 + SRC_A.x1) / 2, (SRC_B.x0 + SRC_B.x1) / 2, PC[0], (SLIP.x0 + SLIP.x1) / 2].forEach((X, i) => {
      const a = bump(t, T_CONS + .28 * i - .05, T_CONS + .28 * i + .2, T_SRC + .6, DUR + 2); if (a <= 0) return;
      const p = cam.proj([X, DY, PC[2]]); if (p) PR.glow(ctx, p[0], p[1], .3 * p[3], '#ffd890', .16 * a, 'flat');
    });
    ctx.restore();
  }
  function tags(ctx, cam, t, at) {
    const sh = SH(), size = M45 ? 34 : 38;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    if (at) QM.tag(ctx, at.sx, at.sy, 'SIMA QIAN', { alpha: ss(T_SIMA - .05, T_SIMA + .2, t) * (1 - ss(T_REASON - .2, T_REASON + .2, t)), size, stem: 30 });
    const p = cam.proj([(SLIP.x0 + SLIP.x1) / 2, DY + .01, SLIPZ[0] - .02]);
    if (p) QM.tag(ctx, p[0], p[1], 'A CENTURY LATER', { alpha: ss(T_CENT - .05, T_CENT + .2, t) * (1 - ss(T_REASON, T_REASON + .4, t)), size, stem: M45 ? 60 : 40 });
    ctx.restore();
  }

  const F0 = 1500, HGT = F0 * PW / W;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const pz = PC[2], nx = paintings().N.x * PW + PX0, nz = PZ1 - paintings().N.y * PH, PY = PC[1] + .001;
    const G0 = paintings().giant || { x: W * .3, y: H * .4, s: 1 }, GW = P2W(G0.x, G0.y - G0.s * 30), gx = GW[0], gz = GW[2];
    const K = [
      [0, [0, PY + HGT, pz], [0, PY, pz + 1e-6], F0],
      [.6, [0, PY + HGT * 1.12, pz - .02], [0, PY, pz + .01], F0],
      [2.4, [.15, DY + .95, pz - .62], [.12, DY, pz + .12], F0],
      [T_SIMA, [.82, 1.5, pz - 3.1], [1.2, .78, pz + .3], 1400],
      [T_LATER, [1.0, 1.48, pz - 3.05], [1.32, .74, pz + .3], 1400],
      [T_REASON, [.7, 1.36, pz - 2.4], [.85, .5, pz + .2], 1440],
      [T_MON + .2, [gx, .95, gz - .5], [gx, DY, gz - .04], 1500],
      [T_NUM + .3, [nx - .02, .86, nz - .5], [nx, DY, nz - .02], 1500],
      [T_DET + .5, [.03, 1.02, pz - .55], [0, DY, pz + .04], 1500],
      [T_PAT + 1, [-.42, 1.5, pz - 1.85], [-.38, DY, pz + .1], 1420],
      [T_ELIX, [-.25, 1.56, pz - 1.95], [-.22, DY, pz + .1], 1420],
      [DUR, [-.05, 1.62, pz - 2.05], [-.05, DY, pz + .1], 1420],
      [DUR + 1, [.02, 1.64, pz - 2.08], [0, DY, pz + .1], 1420]];
    if (M45) K.forEach((k, i) => { if (i < 2) return; const d = k[1].map((v, j) => v - k[2][j]); k[1] = k[2].map((v, j) => v + d[j] * 1.22); });
    const ts = K.map(k => k[0]), mk = f => Mo.monotone(ts.map((tt, i) => [tt, f(K[i])]));
    return (SPL = { e: [0, 1, 2].map(j => mk(k => k[1][j])), g: [0, 1, 2].map(j => mk(k => k[2][j])), f: mk(k => Math.log(k[3])) });
  }
  function camAt(t) {
    const S = spl(), e = S.e.map(f => f(t)), g = S.g.map(f => f(t)), d = [g[0] - e[0], g[1] - e[1], g[2] - e[2]];
    const yaw = Math.atan2(d[0], d[2] || 1e-9);
    return S3.camera({ pos: e, yaw, pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f: Math.exp(S.f(t)), W, H, near: .02 });
  }

  let GB = null;
  function frame(ctx, t, cam) {
    paintings();
    LP.background(ctx);
    LP.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; room(x, cam, t); }, { rim: false, shadowAlpha: .5 });
    let at = null;
    LP.sheet(ctx, ID, 1, RC, x => { at = sima(x, cam, t); }, { rimColor: '#fff6df', rimShift: [-1, 1], rimAlpha: .6 });
    LP.sheet(ctx, ID, 1, RC, x => { x.lineCap = 'butt'; desk(x, cam, t); }, { paperShadow: [3, 5, 4, .3], fibre: .5 });
    painting(ctx, cam, t);
    { const P = paintings(); if (P.giant) onPage(ctx, cam, P.giant.x, P.giant.y, x => monster(x, t)); onPage(ctx, cam, P.N.x * W, P.N.y * H, x => num(x, t)); }
    LP.sheet(ctx, ID, 1, RC, x => near(x, cam, t), { blur: 4, rim: false, shadowAlpha: .4 });
    sourceLight(ctx, cam, t);
    risingLine(ctx, cam, t);
    tags(ctx, cam, t, at);
    const gk = ss(.15, 1.4, t);
    if (gk >= 1) LP.grade(ctx, GT0 + t);
    else if (gk > 0) { if (!GB) GB = F.canvas(W, H); const [gc, gx] = GB; if (gx.reset) gx.reset(); else { gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, W, H); } LP.grade(gx, GT0 + t); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = gk; ctx.drawImage(gc, 0, 0); ctx.restore(); }
  }
  function draw(ctx, t) {
    if (t <= 0) return S25().draw(ctx, A25().DUR);
    frame(ctx, t, camAt(t));
  }

  F.scene('seq-26', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .3, type: 'whoosh', f0: 120, f1: 320, dur: 2.2, g: .04 },
      { t: 2.2, type: 'rustle', dur: .6, g: .03 },
      { t: T_SIMA, type: 'tick', g: .06 }, { t: T_CENT, type: 'tick', g: .06 },
      ...Array.from({ length: 12 }, (_, i) => ({ t: T_FULL + i * .095, type: 'tap', g: .025 })),
      { t: T_MON - .1, type: 'riser', dur: .5, g: .04 }, { t: T_MON, type: 'splash', g: .035 },
      { t: T_NUM + .05, type: 'quill', dur: .4, g: .05 },
      { t: T_DET, type: 'whoosh', f0: 300, f1: 160, dur: .8, g: .03 },
      { t: T_PAT, type: 'slide', dur: 2.6, g: .03 },
      ...DROPS.map(d => ({ t: d.t + .33, type: 'drip', g: .05, noSnap: true })),
      { t: T_CONS, type: 'shimmer', dur: 1.2, g: .025 },
    ],
    api: { DUR, camAt },
  });
})();
