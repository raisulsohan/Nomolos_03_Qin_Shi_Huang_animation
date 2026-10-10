(function () {
  'use strict';
  const F = FILM, PR = F.props, { clamp, smooth, easeIO, lerp, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-02'), DUR = C.duration;
  const LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const shift = () => F.SHIFT || { x: 0, y: 0 };

  const T_FEAR = 0.45;
  const T_REB0 = 1.71, T_REB1 = 3.07 - .05;
  const T_INV0 = 3.07, T_INV1 = 4.59 + .1;
  const T_OUT = 4.89 + .12;

  const P_WALL = .72, FLOOR = 150;
  const CAND = [250, FLOOR - 92];
  const EMPX = 40, ES = 2.4;
  const cam = t => ({ x: (M45 ? 20 : -150) + lerp(-70, 50, easeIO(t / DUR)), y: M45 ? -260 : -120, z: (M45 ? 1.45 : 1.9) * lerp(1, 1.08, easeIO(t / DUR)) });
  const scr = (c, p, X, Y) => { const s = Math.pow(c.z, p), sv = shift(); return [W / 2 + s * (X - p * c.x) - sv.x * p, H / 2 + s * (Y - p * c.y) - sv.y * p, s]; };

  const light = t => {
    if (t >= T_OUT) return 0;
    const fl = .88 + .08 * noise1(t * 9, 3) + .05 * noise1(t * 23, 7);
    const gut = t > T_OUT - .45 ? (1 - ss(T_OUT - .45, T_OUT, t)) * (.6 + .4 * Math.abs(Math.sin((t - T_OUT) * 40))) : 1;
    return fl * gut;
  };
  const tremble = t => ss(T_FEAR, T_FEAR + .8, t) * (1 - ss(T_OUT - .3, T_OUT, t));

  function emperor(x, P, s, t) {
    x.save(); x.scale(s, s); x.fillStyle = P.ink;
    const tr = tremble(t) * .9 * noise1(t * 14, 5);
    x.beginPath();
    x.moveTo(-34, 0); x.quadraticCurveTo(-40, -30, -22, -52); x.quadraticCurveTo(-16, -64 + tr, -6, -66 + tr);
    x.lineTo(8, -64 + tr); x.quadraticCurveTo(16, -50, 14, -34);
    x.lineTo(34, -26); x.quadraticCurveTo(44, -20, 40, -8); x.lineTo(42, 0); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(2, -76 + tr, 9, 10.5, 0, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(9, -78 + tr); x.lineTo(13, -73 + tr); x.lineTo(9, -71 + tr); x.fill();
    x.save(); x.translate(2, -90 + tr); x.rotate(.06); x.fillRect(-18, -2.5, 38, 4); x.fillRect(-3, 0, 7, 5);
    for (let j = 0; j < 5; j++) { x.beginPath(); x.arc(19, 4 + j * 3.4, 1.2, 0, TAU); x.fill(); x.beginPath(); x.arc(-17, 4 + j * 3.4, 1.2, 0, TAU); x.fill(); }
    x.restore(); x.restore();
  }
  const SH = { x: M45 ? -150 : -300, base: FLOOR + 20, s: M45 ? 6.8 : 5.4 };
  function rebels(x, P, t) {
    const u = ss(T_REB0, T_REB0 + .45, t) * (1 - ss(T_REB1 - .4, T_REB1, t));
    if (u <= 0) return;
    x.save(); x.translate(0, (1 - u) * 420); x.translate(0, SH.base); x.scale(1.15, 1.15); x.translate(0, -SH.base);
    x.fillStyle = '#06061a';
    for (let i = 0; i < 15; i++) {
      const bx = -1500 + i * 210 + 40 * Math.sin(i * 2.3), h = 240 + (i * 37 % 90), sway = 9 * Math.sin(t * 5 + i);
      x.beginPath(); x.ellipse(bx, SH.base - h, 20, 24, 0, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(bx - 34, SH.base + 40); x.lineTo(bx - 24, SH.base - h + 20); x.lineTo(bx + 24, SH.base - h + 20); x.lineTo(bx + 34, SH.base + 40); x.fill();
      x.fillRect(bx + 26 + sway, SH.base - h - 150, 7, 260);
      x.strokeStyle = '#06061a'; x.lineWidth = 13; x.lineCap = 'round';
      x.beginPath(); x.moveTo(bx + 14, SH.base - h + 36); x.lineTo(bx + 30, SH.base - h + 18); x.lineTo(bx + 29.5 + sway, SH.base - h - 6); x.stroke(); x.lineCap = 'butt';
      x.beginPath(); x.ellipse(bx + 29.5 + sway, SH.base - h - 8, 10, 12, 0, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(bx + 29.5 + sway, SH.base - h - 190); x.lineTo(bx + 40 + sway, SH.base - h - 148); x.lineTo(bx + 19 + sway, SH.base - h - 148); x.fill();
    }
    x.restore();
  }
  function horsemen(x, P, t) {
    const u = (t - T_INV0) / (T_INV1 - T_INV0); if (u <= 0 || u >= 1) return;
    x.fillStyle = '#06061a'; x.strokeStyle = '#06061a'; x.lineCap = 'round'; x.lineJoin = 'round';
    const leg = (hip, ph, w) => {
      const st = Math.sin(ph), foot = [hip[0] + 24 * Math.cos(ph), st < 0 ? 0 : -18 * st];
      const dx = foot[0] - hip[0], dy = foot[1] - hip[1], d = Math.min(Math.hypot(dx, dy), 63), a = Math.atan2(dy, dx), b = Math.acos(Math.min(1, d / 64));
      const knee = [hip[0] + 32 * Math.cos(a + b * w), hip[1] + 32 * Math.sin(a + b * w)];
      x.lineWidth = 12; x.beginPath(); x.moveTo(hip[0], hip[1] - 6); x.lineTo(knee[0], knee[1]); x.stroke(); x.lineWidth = 8; x.beginPath(); x.moveTo(knee[0], knee[1]); x.lineTo(foot[0], foot[1]); x.stroke();
      x.lineWidth = 11; x.beginPath(); x.moveTo(foot[0] - 2, foot[1] - 2); x.lineTo(foot[0] + 3, foot[1] - 2); x.stroke();
    };
    for (let i = 0; i < 4; i++) {
      const hx = lerp(1300, -2400, u) + i * 400 + (i % 2) * 90, ph = (t * 2.6 + i * .37) * TAU, k = 1.6, bob = 3 * Math.sin(ph * 2);
      x.save(); x.translate(hx, SH.base); x.scale(-k, k);
      x.save(); x.translate(0, bob);
      leg([40, -62], ph, -1); leg([-40, -62], ph + 2.2, 1); leg([30, -62], ph + .5, -1); leg([-30, -62], ph + 2.7, 1);
      x.beginPath(); x.ellipse(0, -76, 60, 24, -.04, 0, TAU); x.fill();
      x.beginPath();
      x.moveTo(30, -92); x.quadraticCurveTo(46, -110, 62, -138); x.lineTo(74, -156); x.lineTo(78, -166); x.lineTo(84, -156);
      x.quadraticCurveTo(96, -150, 112, -126); x.quadraticCurveTo(116, -116, 106, -114); x.quadraticCurveTo(94, -118, 84, -126);
      x.quadraticCurveTo(76, -108, 62, -66); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-58, -84); x.quadraticCurveTo(-92, -76, -104, -46); x.lineTo(-96, -44); x.quadraticCurveTo(-82, -66, -56, -70); x.fill();
      x.lineWidth = 10; x.beginPath(); x.moveTo(0, -96); x.lineTo(10, -70); x.lineTo(4, -52); x.stroke();
      x.beginPath(); x.moveTo(-14, -96); x.lineTo(-6, -154); x.lineTo(16, -154); x.lineTo(20, -96); x.fill();
      x.beginPath(); x.arc(4, -168, 13, 0, TAU); x.fill();
      x.lineWidth = 9; x.beginPath(); x.moveTo(10, -146); x.lineTo(26, -124); x.lineTo(42, -126); x.stroke();
      x.lineWidth = 5; x.beginPath(); x.moveTo(-34, -104); x.lineTo(150, -168); x.stroke();
      x.beginPath(); x.moveTo(150, -168); x.lineTo(172, -178); x.lineTo(148, -160); x.fill();
      x.beginPath(); x.ellipse(44, -127, 8, 7, 0, 0, TAU); x.fill();
      x.restore(); x.restore();
    }
    x.lineCap = 'butt'; x.lineJoin = 'miter';
  }
  function wall(x, P, t) {
    const L = light(t);
    x.fillStyle = '#100f2a'; x.fillRect(-2600, -1800, 5200, 1800 + FLOOR);
    const [cx, cy] = [CAND[0] - 120, CAND[1] - 60], g = x.createRadialGradient(cx, cy, 0, cx, cy, 1500);
    g.addColorStop(0, `rgba(255,190,110,${.62 * L})`); g.addColorStop(.35, `rgba(220,140,80,${.32 * L})`); g.addColorStop(1, 'rgba(60,40,60,0)');
    x.fillStyle = g; x.fillRect(-2600, -1800, 5200, 1800 + FLOOR);
    x.strokeStyle = `rgba(20,16,40,${.35 + .2 * (1 - L)})`; x.lineWidth = 6;
    for (let i = -10; i <= 10; i++) { x.beginPath(); x.moveTo(i * 220, -1800); x.lineTo(i * 220, FLOOR); x.stroke(); }
    for (let j = 0; j < 7; j++) { x.beginPath(); x.moveTo(-2600, FLOOR - 40 - j * 260); x.lineTo(2600, FLOOR - 40 - j * 260); x.stroke(); }
    if (L > 0) {
      const tr = tremble(t), jx = 10 * tr * noise1(t * 11, 9) + 4 * noise1(t * 6, 2), sc = SH.s * (1 + .03 * (1 - L) + .02 * tr * noise1(t * 8, 4));
      x.save(); x.translate(SH.x + jx, SH.base); x.globalAlpha = Math.min(1, L * 1.1);
      const SP = { ...P, ink: '#08071c' }; emperor(x, SP, sc, t); x.restore();
      rebels(x, P, t); horsemen(x, P, t);
    }
    x.fillStyle = '#0a0919'; x.fillRect(-2600, FLOOR, 5200, 2000);
  }
  function near(x, P, t) {
    x.fillStyle = P.ink;
    x.fillRect(CAND[0] - 6, CAND[1] + 20, 12, FLOOR - CAND[1] - 20); x.fillRect(CAND[0] - 30, FLOOR - 9, 60, 9); x.fillRect(CAND[0] - 16, CAND[1] + 18, 32, 5);
    x.fillStyle = '#e8dcc0'; x.fillRect(CAND[0] - 7, CAND[1] + 2, 14, 17);
    const L = light(t);
    if (L > 0) {
      const fh = 24 * (.75 + .25 * L) * (1 + .1 * noise1(t * 15, 1));
      x.fillStyle = '#ffd27a'; x.beginPath(); x.moveTo(CAND[0], CAND[1] - fh); x.quadraticCurveTo(CAND[0] + 6, CAND[1] - 2, CAND[0], CAND[1] + 2); x.quadraticCurveTo(CAND[0] - 6, CAND[1] - 2, CAND[0], CAND[1] - fh); x.fill();
    } else {
      const d = t - T_OUT; x.strokeStyle = `rgba(160,150,190,${.4 * Math.max(0, 1 - d / 1.2)})`; x.lineWidth = 2.2; x.beginPath();
      for (let i = 0; i <= 20; i++) { const yy = CAND[1] - i * 5 * Math.min(1, d * 1.6), xx = CAND[0] + 6 * Math.sin(i * .5 + d * 3) * i / 20; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
    }
    x.save(); x.translate(EMPX, FLOOR); emperor(x, P, ES, t); x.restore();
    x.fillStyle = '#0a0919'; x.fillRect(-2600, FLOOR, 5200, 2000);
  }
  function draw(ctx, t) {
    const c = cam(t), R = [0, 0];
    LB.background(ctx);
    LB.sheet(ctx, c, P_WALL, R, x => wall(x, LB.P, t), { glow: .35 * light(t) + .05 });
    LB.sheet(ctx, c, 1, R, x => near(x, LB.P, t), { glow: .7 });
    LB.sheet(ctx, c, 1.45, R, x => { x.fillStyle = '#05051a'; x.fillRect(M45 ? 330 : 560, -2000, 150, 4000); x.beginPath(); x.moveTo(-1400, -1200); x.quadraticCurveTo(-700, -420, -1050, 400); x.lineTo(-1600, 400); x.closePath(); x.fill(); }, { blur: 9, rim: false, glow: .25 * light(t) });
    const L = light(t), [fx, fy, s] = scr(c, 1, CAND[0], CAND[1] - 6);
    if (L > 0) { PR.glow(ctx, fx, fy, 160 * s, '#ffb24d', .8 * L, 'lightbox'); PR.glow(ctx, fx, fy, 30 * s, '#fff0c0', .9 * L, 'lightbox'); }
    else PR.glow(ctx, fx, fy + 6 * s, 9 * s, '#ff7a2a', .9 * Math.max(.25, 1 - (t - T_OUT) * .5), 'lightbox');
    LB.grade(ctx, t);
  }

  F.scene('seq-02', {
    W, H, duration: DUR, draw, label: C.label, ready: Promise.resolve(), grain: 'none',
    from: { id: 'seq-01', dur: .9, dir: 'down' },
    sfx: [
      { t: T_FEAR + .1, type: 'heartbeat', g: .5 },
      { t: T_REB0 + .05, type: 'swoosh', dur: .8, g: .25 },
      { t: T_REB0, type: 'lib', dur: 1.3, label: 'DISTANT ANGRY CROWD, muffled' },
      { t: T_INV0, type: 'lib', dur: 1.5, label: 'GALLOPING HORSES passing, muffled' },
      { t: T_OUT - .02, type: 'whoosh', f0: 420, f1: 180, dur: .28, g: .12 },
    ],
    api: { DUR },
  });
})();
