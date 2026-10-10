(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, Q = F.qin, PR = F.props, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-21'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const RC = [W / 2, H / 2];
  const SEQS = ['seq-06', 'seq-07', 'seq-08', 'seq-09', 'seq-10', 'seq-11', 'seq-12', 'seq-13', 'seq-14', 'seq-15', 'seq-16', 'seq-17', 'seq-18', 'seq-19', 'seq-20'];
  const T0 = () => SEQS.reduce((s, id) => s + F.getScene(id).duration, 0);
  const S20 = () => F.getScene('seq-20'), A20 = () => S20().api, D20 = () => A20().DUR;
  let BUF = null;
  const buf = () => BUF || (BUF = F.canvas(W, H));
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };

  const T_DIS = 0.66;
  const XF = .5;
  const T_CRACK = T_DIS + .02, T_SPLIT = T_CRACK + .18, T_FALL = T_SPLIT + .26;

  const INK = '#1b2130', CARD = '#efe4c8', CHART_COL = '#7a5e40';
  const spread = t => easeIO(clamp(t / XF));
  function cardRect(cam, D, u) {
    const m = M45 ? .06 : .07, my = M45 ? .05 : .06, R1 = [W * m, H * my, W * (1 - m), H * (1 - my)];
    if (u >= 1) return R1;
    const c = [[-1, D.CHART.y1], [1, D.CHART.y1], [1, D.CHART.y0], [-1, D.CHART.y0]].map(([s, y]) => cam.proj([D.CHART.x + s * D.CHART.w / 2, y, 4.99]));
    if (c.some(p => !p)) return R1;
    const R0 = [Math.min(c[0][0], c[3][0]), Math.min(c[0][1], c[1][1]), Math.max(c[1][0], c[2][0]), Math.max(c[2][1], c[3][1])];
    return R0.map((v, i) => lerp(v, R1[i], u));
  }
  function cardSheet(x, cam, t, D, R, u) {
    x.fillStyle = S3.mix(CHART_COL, CARD, u); x.fillRect(R[0], R[1], R[2] - R[0], R[3] - R[1]);
    x.save(); x.globalAlpha = u;
    x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(R[0] + 14, R[1] + 14, R[2] - R[0] - 28, R[3] - R[1] - 28);
    x.lineWidth = 1.2; x.strokeRect(R[0] + 22, R[1] + 22, R[2] - R[0] - 44, R[3] - R[1] - 44);
    x.restore();
    const T20 = D20() + t, e = Math.atan2(cam.pos[1] - (D.CUPP[1] + .05), Math.hypot(cam.pos[0] - D.CUPP[0], cam.pos[2] - D.CUPP[2]));
    S3.onPlane(x, cam, D.CUPP, [Math.cos(cam.yaw) * D.CUP_M, 0, -Math.sin(cam.yaw) * D.CUP_M], [0, -D.CUP_M, 0], xx => Q.cup(xx, { s: 1, elev: Math.max(.12, e), fill: D.cupFill(T20), liquid: '#b8bec8', beads: [] }));
    const Hh = D.CHART.y1 - D.CHART.y0;
    S3.onPlane(x, cam, D.chartAt(0, 0), [D.CHART.w, 0, 0], [0, Hh, 0], xx => {
      const body = () => { xx.beginPath(); D.BODY.forEach(([a, b], i) => i ? xx.lineTo(a, b) : xx.moveTo(a, b)); xx.closePath(); xx.moveTo(.055, .875); xx.ellipse(0, .875, .055, .062, 0, 0, TAU); };
      const g = xx.createLinearGradient(-.2, 0, .2, 0); g.addColorStop(0, '#7a8292'); g.addColorStop(.45, '#e6ebf2'); g.addColorStop(.55, '#ffffff'); g.addColorStop(1, '#8a92a0');
      body(); xx.fillStyle = g; xx.fill('nonzero');
      if (u < 1) {
        xx.save(); xx.globalAlpha = 1 - u;
        xx.strokeStyle = 'rgba(52,70,96,.85)'; xx.lineWidth = .004;
        for (const dx of [-.05, 0, .05]) { xx.beginPath(); xx.moveTo(dx * .5, .8); xx.quadraticCurveTo(dx * 1.4, .5, dx * 1.5, .1); xx.stroke(); }
        xx.fillStyle = '#9a2a20'; for (const [a, b] of D.PTS) { xx.beginPath(); xx.arc(a, b, .011, 0, TAU); xx.fill(); }
        xx.fillStyle = 'rgba(40,26,20,.7)'; for (let i = 0; i < 12; i++) xx.fillRect(-.42 + (i % 2) * .74, .9 - Math.floor(i / 2) * .055, .1, .012);
        xx.restore();
      }
      xx.strokeStyle = INK; xx.lineWidth = .007; xx.lineJoin = 'round'; body(); xx.stroke();
    });
  }

  const thick = t => 1 + .5 * ss(XF, XF + .25, t);
  function shaft(cam, D, t) {
    const pa = cam.proj(D.LA), pe = cam.proj(D.LBn); if (!pa || !pe) return null;
    const dx = pe[0] - pa[0], dy = pe[1] - pa[1], l = Math.hypot(dx, dy) || 1, k = pe[3] * thick(t);
    return { pa, pe, ux: dx / l, uy: dy / l, nx: -dy / l, ny: dx / l, l, w: .011 * k, hl: .075 * k, hw: .032 * k, k };
  }
  const SHARDS = [[-1, 210, 300, 7, 1.15, 0], [1, 260, 360, -9, 1.0, 1], [-1, 120, 420, -5, .8, 2], [1, 150, 250, 8, .75, 0], [1, 330, 200, 11, .6, 2]];
  const SHAPES = [[[-1, -.6], [1, -.3], [.2, .9]], [[-.9, -.5], [.8, -.7], [1, .4], [-.4, .8]], [[-1, 0], [.4, -.8], [.9, .5]]];
  function lineSheet(x, cam, t, D, R) {
    const s = shaft(cam, D, t); if (!s) return;
    x.save(); x.beginPath(); x.rect(R[0] + 3, R[1] + 3, R[2] - R[0] - 6, R[3] - R[1] - 6); x.clip();
    try { lineOnCard(x, t, s); } finally { x.restore(); }
  }
  function lineOnCard(x, t, s) {
    const { pa, pe, ux, uy, nx, ny, l, w: hw0, hl, hw, k } = s, cx = pa[0] + ux * l * .5, cy = pa[1] + uy * l * .5;
    const bx = pe[0] - ux * hl, by = pe[1] - uy * hl, lw = Math.max(2, .004 * k);
    const at = (a, v) => [pa[0] + ux * a + nx * v, pa[1] + uy * a + ny * v];
    const JAG = [[0, -1], [.55, -.6], [-.45, -.2], [.5, .2], [-.4, .6], [.25, 1]].map(([da, v]) => [l * .5 + da * hw0, v * hw0]);
    const style = () => { x.fillStyle = '#d9dee7'; x.fill(); x.strokeStyle = INK; x.lineWidth = lw; x.lineJoin = 'miter'; x.stroke(); };
    const lowerPath = () => { x.beginPath(); x.moveTo(...at(0, -hw0)); for (const [a, v] of JAG) x.lineTo(...at(a, v)); x.lineTo(...at(0, hw0)); x.closePath(); };
    const upperPath = () => { x.beginPath(); JAG.forEach(([a, v], i) => i ? x.lineTo(...at(a, v)) : x.moveTo(...at(a, v))); x.lineTo(bx + nx * hw0, by + ny * hw0); x.lineTo(bx + nx * hw, by + ny * hw); x.lineTo(pe[0], pe[1]); x.lineTo(bx - nx * hw, by - ny * hw); x.lineTo(bx - nx * hw0, by - ny * hw0); x.closePath(); };
    if (t < T_SPLIT) {
      x.beginPath(); x.moveTo(...at(0, -hw0)); x.lineTo(bx - nx * hw0, by - ny * hw0); x.lineTo(bx - nx * hw, by - ny * hw); x.lineTo(pe[0], pe[1]); x.lineTo(bx + nx * hw, by + ny * hw); x.lineTo(bx + nx * hw0, by + ny * hw0); x.lineTo(...at(0, hw0)); x.closePath(); style();
      const kc = clamp((t - T_CRACK) / .1);
      if (kc > 0) {
        const n = kc * (JAG.length - 1), i = Math.floor(n);
        x.strokeStyle = INK; x.lineWidth = lw * .9; x.beginPath(); x.moveTo(...at(...JAG[0]));
        for (let j = 1; j <= i; j++) x.lineTo(...at(...JAG[j]));
        if (i < JAG.length - 1) { const f = n - i, A = JAG[i], B = JAG[i + 1]; x.lineTo(...at(lerp(A[0], B[0], f), lerp(A[1], B[1], f))); }
        x.stroke();
      }
      return;
    }
    const g = easeIO(clamp((t - T_SPLIT) / .14)), gap = .45 * hw0 * g;
    x.save(); x.translate(pa[0], pa[1]); x.rotate(-.05 * g); x.translate(-pa[0], -pa[1]); x.translate(-ux * gap, -uy * gap); lowerPath(); style(); x.restore();
    const f = Math.max(0, t - T_FALL), dropX = (90 + 330 * f) * f * (M45 ? .75 : 1), dropY = .5 * 2600 * f * f;
    x.save(); x.translate(cx + ux * gap + dropX, cy + uy * gap + dropY); x.rotate(.09 * g + 3.2 * f * f + .6 * f); x.translate(-cx, -cy); upperPath(); style(); x.restore();
    const a = t - T_SPLIT;
    SHARDS.forEach(([side, vo, vu, spin, sz, sh], i) => {
      const px = cx + nx * side * vo * a + ux * 30 * a, py = cy + ny * side * vo * a - vu * a + 1300 * a * a, r = hw0 * sz;
      if (py > H + 40) return;
      x.save(); x.translate(px, py); x.rotate(spin * a + i); x.beginPath(); SHAPES[sh].forEach(([p, q], j) => j ? x.lineTo(p * r, q * r) : x.moveTo(p * r, q * r)); x.closePath();
      x.fillStyle = '#d9dee7'; x.fill(); x.strokeStyle = INK; x.lineWidth = Math.max(1.5, lw * .7); x.stroke(); x.restore();
    });
  }
  function flash(ctx, cam, D, t) {
    const s = shaft(cam, D, t), a = t < T_SPLIT ? 0 : Math.exp(-Math.pow((t - T_SPLIT) / .06, 2)); if (!s || a < .02) return;
    PR.glow(ctx, s.pa[0] + s.ux * s.l * .5, s.pa[1] + s.uy * s.l * .5, 2.6 * s.w, '#ffffff', .7 * a, 'flat');
  }

  function lean(t) {
    const cam = A20().camAt(D20() + t), D = A20().diag(), s = shaft(cam, D, t), z = ss(XF, DUR + .3, t);
    return { cam, D, s, mx: s ? s.pa[0] + s.ux * s.l * .5 : W / 2, my: s ? s.pa[1] + s.uy * s.l * .5 : H / 2, zz: 1 + (M45 ? .3 : .1) * z };
  }
  function cardFrame(ctx, t, R, u, ex) {
    const { cam, D, mx, my, zz } = lean(t);
    const CZ = (ex && ex.CZ) || { x: mx - (mx - W / 2) / zz, y: my - (my - H / 2) / zz, z: zz }, RR = R || cardRect(cam, D, u);
    FL.background(ctx);
    FL.sheet(ctx, CZ, 1, RC, x => { x.lineCap = 'butt'; x.lineJoin = 'miter'; cardSheet(x, cam, t, D, RR, u); }, { flatShadow: [14, 18, 16, .45] });
    FL.sheet(ctx, CZ, 1, RC, x => { x.lineCap = 'butt'; lineSheet(x, cam, t, D, RR); }, { flatShadow: [5, 8, 6, .3] });
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); flash(ctx, cam, D, t); ctx.restore();
    if (!(ex && ex.noGrade)) FL.grade(ctx, T0() + t);
  }
  function draw(ctx, t) {
    if (t <= 0) return S20().draw(ctx, D20());
    const u = spread(t);
    if (u >= 1) return cardFrame(ctx, t, null, 1);
    S20().draw(ctx, D20() + t);
    const cam = A20().camAt(D20() + t), D = A20().diag(), R = cardRect(cam, D, u);
    const [cv, x] = buf(); clean(x); cardFrame(x, t, R, u);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = u * u; ctx.drawImage(cv, 0, 0);
    ctx.globalAlpha = ss(0, .14, t); ctx.beginPath(); ctx.rect(R[0] - 30, R[1] - 30, R[2] - R[0] + 60, R[3] - R[1] + 60); ctx.clip(); ctx.drawImage(cv, 0, 0);
    ctx.restore();
  }

  F.scene('seq-21', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    sfx: [
      { t: .03, type: 'slide', dur: .45, g: .05 },
      { t: T_CRACK, type: 'crack', g: .3, noSnap: true },
      { t: T_SPLIT, type: 'glass', g: .1, noSnap: true },
      { t: T_FALL, type: 'whoosh', f0: 260, f1: 90, dur: .5, g: .05 },
    ],
    api: { DUR, lean, card: (ctx, t, ex) => cardFrame(ctx, t, null, 1, ex), T0 },
  });
})();
