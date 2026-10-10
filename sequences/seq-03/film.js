(function () {
  'use strict';
  const F = FILM, PR = F.props, Mo = F.motion, { clamp, smooth, easeIO, lerp, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-03'), DUR = C.duration;
  const LB = F.look('lightbox', W, H), P = LB.P;
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const shift = () => F.SHIFT || { x: 0, y: 0 };

  const T_HIM = 1.44;
  const T_IN = 2.02;
  const T_RUN = 4.26;
  const T_DRAW = 8.88, T_LONG = 8.35;

  const FLOOR = 230, P_BACK = .8, S_FIG = M45 ? 2.3 : 2.5;
  const cam = t => {
    const u = easeIO((t - T_IN) / 1.4), x = t < T_IN ? lerp(-2350, -1600, easeIO(t / T_IN)) : lerp(-1600, -150, u) + 60 * ss(T_RUN, DUR, t);
    const z = (M45 ? 1.12 : 1.25) * (t < T_IN ? 1 : lerp(1, 1.24, u) * lerp(1, 1.06, ss(T_RUN, T_DRAW, t)));
    return { x, y: lerp(-170, M45 ? -90 : -40, t < T_IN ? 0 : u), z };
  };
  const scr = (c, p, X, Y) => { const s = Math.pow(c.z, p), sv = shift(); return [W / 2 + s * (X - p * c.x) - sv.x * p, H / 2 + s * (Y - p * c.y) - sv.y * p, s]; };

  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  const KING = { coat: '#0b0a1f', trouser: '#0b0a1f', skin: '#0d0c22', head: 'bare', hair: '#08071a', headColor: '#08071a', shoe: '#08071a', shadow: .25 };
  const ASSN = { coat: '#09081b', trouser: '#09081b', skin: '#0c0b20', head: 'bare', hair: '#07061a', headColor: '#07061a', shoe: '#07061a', shadow: .25 };

  const SNEAK = Mo.gait({ from: 0, to: 330, t0: .05, gait: 'sneak', until: T_IN - .1 });
  const FIST = [{ pose: 'relaxed', k: .4 }, { pose: 'fist' }];
  const IN = Mo.gait({ from: 0, to: 240, t0: T_IN + .2, gait: 'brisk', until: T_RUN + .05 });
  const RUNK = Mo.gait({ from: 0, to: 4000, t0: T_RUN, gait: 'run' }), RUNA = Mo.gait({ from: 0, to: 4000, t0: T_RUN + .25, gait: 'run' });
  const RF = 120;
  const ang = (f, t, a0) => a0 + f.x(t) / RF;
  const KA0 = Math.PI * .98, AA0 = Math.PI * .98 - 1.15;
  function onCircle(f, t, a0) {
    const th = ang(f, t, a0), z = Math.sin(th);
    const yaw = Math.atan2(Math.cos(th), -Math.sin(th));
    return { x: RF * Math.cos(th) * S_FIG, z, yaw, k: S_FIG * (1 + .1 * z), y: FLOOR + 34 * z };
  }
  function king(t) {
    if (t < T_RUN) {
      const p = Mo.idle({ x: 0, seed: 3 })(t); return { pose: { ...p, yaw: 0.25 }, x: RF * Math.cos(KA0) * S_FIG, k: S_FIG * (1 + .1 * Math.sin(KA0)), y: FLOOR + 34 * Math.sin(KA0), z: Math.sin(KA0) };
    }
    const o = onCircle(RUNK, t, KA0), p = centre(RUNK(t), RUNK.x(t));
    return { pose: { ...p, yaw: o.yaw }, ...o };
  }
  function assassin(t) {
    if (t < T_RUN + .25) {
      const p = centre(IN(t), IN.x(t)), ax = lerp(900, RF * Math.cos(AA0) * S_FIG, IN.x(t) / 240);
      return { pose: { ...p, hands: FIST, yaw: Math.PI }, x: ax, k: S_FIG * (1 + .1 * Math.sin(AA0)), y: FLOOR + 34 * Math.sin(AA0), z: Math.sin(AA0) };
    }
    const o = onCircle(RUNA, t, AA0), p = centre(RUNA(t), RUNA.x(t));
    p.arms = [p.arms[0], [.72, 1.42]];
    return { pose: { ...p, hands: FIST, yaw: o.yaw }, ...o };
  }
  function crown(x, PJ) {
    const y = PJ.yaw, c = Math.cos(y), H = [PJ.head[0] * c, PJ.head[1] + (PJ.head[0] - PJ.hip[0]) * Math.sin(y) * .18];
    x.save(); x.translate(H[0], H[1] - 9.5); x.fillStyle = '#08071a';
    const hw = 6 + 6 * Math.abs(c);
    x.fillRect(-hw, -2, hw * 2, 3); x.fillRect(-2.5, 0, 5, 4);
    for (const e of [-hw + .8, hw - .8]) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(e, 3 + j * 2.4, .85, 0, TAU); x.fill(); }
    x.restore();
  }
  function dagger(x, PJ, fwd, ink = '#08071a') {
    const a = PJ.arms[1], d = [a.wr[0] - a.el[0], a.wr[1] - a.el[1]], L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    const at = (k, s = 0) => [a.wr[0] + u[0] * k + n[0] * s, a.wr[1] + u[1] * k + n[1] * s];
    const poly = pts => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); };
    x.fillStyle = ink; poly([at(-3.5, -1.1), at(5.5, -1.1), at(5.5, 1.1), at(-3.5, 1.1)]);
    poly([at(5, -3), at(6.6, -3), at(6.6, 3), at(5, 3)]);
    x.fillStyle = '#d8deff'; poly([at(6.6, -1.6), at(21, -.2), at(22, 0), at(6.6, 1.6)]);
    x.fillStyle = ink; x.beginPath(); x.ellipse(a.wr[0] + u[0] * 1, a.wr[1] + u[1] * 1, 3.6, 3.2, Math.atan2(u[1], u[0]), 0, TAU); x.fill();
  }
  function figure(x, f, opts, extra) {
    x.save(); x.translate(f.x, f.y); x.scale(f.k, f.k);
    Mo.draw(x, P, f.pose, { ...opts, ...extra });
    x.restore();
  }

  function back(x, t) {
    x.fillStyle = '#0c0b22'; x.fillRect(-3600, -1600, 6000, 1600 + FLOOR);
    for (let i = 0; i < 9; i++) {
      const sx = -3500 + i * 290;
      const g = x.createLinearGradient(0, -500, 0, FLOOR); g.addColorStop(0, '#5a3a3a'); g.addColorStop(.5, '#c48a4e'); g.addColorStop(1, '#7a5040');
      x.fillStyle = g; x.fillRect(sx, -520, 250, 520 + FLOOR - 40);
      x.strokeStyle = 'rgba(40,24,30,.75)'; x.lineWidth = 5;
      for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(sx + k * 62.5, -520); x.lineTo(sx + k * 62.5, FLOOR - 40); x.stroke(); }
      for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(sx, -520 + k * 120); x.lineTo(sx + 250, -520 + k * 120); x.stroke(); }
    }
    if (t < T_IN + .6) {
      const p = centre(SNEAK(t), SNEAK.x(t)), sx = -2900 + SNEAK.x(t) * 3.4, raise = ss(T_HIM - .3, T_HIM + .1, t);
      p.arms = [p.arms[0], [lerp(p.arms[1][0], 1.9, raise), lerp(p.arms[1][1], .4, raise)]];
      x.save(); x.beginPath(); x.rect(-3600, -560, 2620, 560 + FLOOR - 40); x.clip();
      x.globalAlpha = .9; x.translate(sx, FLOOR - 40); x.scale(3.6, 3.6);
      Mo.draw(x, { ...P, ink: '#1a0f18' }, { ...p, yaw: 0 }, { coat: '#22121c', trouser: '#22121c', skin: '#22121c', head: 'bare', hair: '#22121c', headColor: '#22121c', shoe: '#22121c', shadow: 0, over: (xx, PJ) => dagger(xx, PJ, 1, '#22121c') });
      x.restore();
    }
    x.fillStyle = '#100f2c'; x.fillRect(-900, -1600, 200, 1600 + FLOOR);
    for (const [lx, ly, r, a] of [[-480, -380, 900, .5], [480, -380, 900, .5], [0, 60, 1300, .35]]) {
      const g = x.createRadialGradient(lx, ly, 0, lx, ly, r); g.addColorStop(0, `rgba(200,130,80,${a})`); g.addColorStop(.5, `rgba(120,70,70,${a * .45})`); g.addColorStop(1, 'rgba(40,30,60,0)');
      x.fillStyle = g; x.fillRect(-700, -1600, 2700, 1600 + FLOOR);
    }
    x.strokeStyle = P.rim; x.globalAlpha = .25; x.lineWidth = 2;
    for (const i of [-2, -1, 1, 2]) x.strokeRect(i * 330 - 120, -900, 240, 860);
    x.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const cx = -560 + i * 220 + (i > 2 ? 120 : 0); x.save(); x.translate(cx, FLOOR - 30); x.scale(2.1, 2.1);
      const p = Mo.stand(0); Mo.draw(x, P, { ...p, yaw: Math.PI / 2 + (cx < 0 ? .5 : -.5) }, { coat: '#0d0c26', trouser: '#0d0c26', skin: '#0f0e28', head: 'bare', hair: '#0a0920', headColor: '#0a0920', hem: 1, shoe: '#0a0920', shadow: 0 });
      x.restore();
    }
    x.fillStyle = '#08071a'; x.fillRect(-3600, FLOOR - 40, 6000, 2000);
  }
  const PR_ = 125, SW = { top: -50, len: 270, tilt: .36 };
  function pillar(x, t, c) {
    const eye = c.y, ell = y => Math.max(-34, Math.min(34, (y - eye) * .075)), hl = clamp(.42 - (c.x / 2400), .2, .7);
    const g = x.createLinearGradient(-PR_, 0, PR_, 0); g.addColorStop(0, '#0d0c26'); g.addColorStop(hl, '#33337a'); g.addColorStop(Math.min(.95, hl + .3), '#1c1b4a'); g.addColorStop(1, '#0a0920');
    x.fillStyle = g; x.beginPath(); x.moveTo(-PR_, -2400); x.lineTo(PR_, -2400); x.lineTo(PR_, FLOOR - 36);
    x.ellipse(0, FLOOR - 36, PR_, Math.abs(ell(FLOOR - 36)), 0, 0, Math.PI); x.closePath(); x.fill();
    const BR = PR_ + 20, eb = Math.abs(ell(FLOOR));
    x.fillStyle = '#16153a'; x.beginPath(); x.moveTo(-BR, FLOOR - 36); x.lineTo(BR, FLOOR - 36); x.lineTo(BR, FLOOR); x.ellipse(0, FLOOR, BR, eb, 0, 0, Math.PI); x.closePath(); x.fill();
    x.fillStyle = '#2a2960'; x.beginPath(); x.ellipse(0, FLOOR - 36, BR, Math.abs(ell(FLOOR - 36)), 0, 0, TAU); x.fill();
    x.fillStyle = g; x.beginPath(); x.ellipse(0, FLOOR - 36, PR_, Math.abs(ell(FLOOR - 36)), 0, 0, TAU); x.fill();
    x.strokeStyle = P.rim; x.globalAlpha = .55; x.lineWidth = 7;
    for (const by of [-640, -618, FLOOR - 80, FLOOR - 62]) { const e = ell(by); x.beginPath(); x.ellipse(0, by, PR_ + 2, Math.abs(e) + .01, 0, e >= 0 ? 0 : Math.PI, e >= 0 ? Math.PI : TAU); x.stroke(); }
    x.globalAlpha = 1;
    const L = SW.len, y0 = SW.top, cx = 0;
    x.save(); x.translate(cx, y0 - 48); x.rotate(SW.tilt); x.translate(-cx, -(y0 - 48));
    x.strokeStyle = '#7a5a2a'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx, y0 - 46); x.lineTo(cx - 9, y0 - 8); x.moveTo(cx, y0 - 46); x.lineTo(cx + 9, y0 - 8); x.stroke();
    x.fillStyle = '#c8973f'; x.beginPath(); x.arc(cx, y0 - 48, 5, 0, TAU); x.fill();
    x.lineWidth = 3; x.strokeStyle = '#c8973f'; x.beginPath(); x.arc(cx, y0 - 6, 7, 0, TAU); x.stroke();
    x.fillStyle = '#120e14'; x.fillRect(cx - 4, y0, 8, 40);
    x.fillStyle = '#c8973f'; x.fillRect(cx - 17, y0 + 40, 34, 7);
    x.fillStyle = '#0b0a1a'; x.fillRect(cx - 7.5, y0 + 47, 15, L - 60);
    x.fillStyle = '#c8973f'; for (const k of [.12, .55]) x.fillRect(cx - 9, y0 + 47 + (L - 60) * k, 18, 6);
    x.beginPath(); x.moveTo(cx - 9, y0 + L - 13); x.lineTo(cx + 9, y0 + L - 13); x.lineTo(cx, y0 + L + 4); x.closePath(); x.fill();
    const u = (t - T_LONG) / .7;
    if (u > 0 && u < 1.3) {
      const yy = y0 - 50 + (L + 100) * u;
      x.save(); x.translate(cx, yy); x.scale(1, 3.2); x.globalCompositeOperation = 'lighter';
      const lg = x.createRadialGradient(0, 0, 0, 0, 0, 30); lg.addColorStop(0, 'rgba(255,240,200,.8)'); lg.addColorStop(.45, 'rgba(255,230,180,.35)'); lg.addColorStop(1, 'rgba(255,230,180,0)');
      x.fillStyle = lg; x.fillRect(-30, -30, 60, 60); x.restore();
    }
    x.restore();
  }

  function main(x, t) {
    x.fillStyle = '#0b0a1e'; x.fillRect(-4000, FLOOR - 40, 7000, 2000);
    if (t < T_IN - .4) return;
    const K = king(t), A = assassin(t), fwd = f => Math.cos(f.pose.yaw) >= 0 ? 1 : -1;
    const list = [[K, KING, { over: (xx, PJ) => crown(xx, PJ) }], [A, ASSN, { behind: (xx, PJ) => { if (!PJ.arms[1].near) dagger(xx, PJ); }, over: (xx, PJ) => { if (PJ.arms[1].near) dagger(xx, PJ); } }]].sort((a, b) => a[0].z - b[0].z);
    for (const [f, o, e] of list) if (f.z < 0) figure(x, f, o, e);
    pillar(x, t, cam(t));
    for (const [f, o, e] of list) if (f.z >= 0) figure(x, f, o, e);
  }
  function draw(ctx, t) {
    const c = cam(t), R = [0, 0];
    LB.background(ctx);
    LB.sheet(ctx, c, P_BACK, R, x => back(x, t), { glow: .5 });
    for (const lx of [-480, 480]) { const [gx, gy, s] = scr(c, P_BACK, lx, -380); PR.glow(ctx, gx, gy, 200 * s, '#ffb04a', .35 + .05 * noise1(t * 3, lx), 'lightbox'); }
    LB.sheet(ctx, c, 1, R, x => main(x, t), { glow: .6 });
    const gs = ss(T_LONG, T_LONG + .3, t) * (1 - .6 * ss(T_LONG + .7, T_LONG + 1.3, t));
    if (gs > 0) { const [gx, gy, s] = scr(c, 1, -Math.sin(SW.tilt) * SW.len / 2, SW.top - 48 + Math.cos(SW.tilt) * (SW.len / 2 + 48)); PR.glow(ctx, gx, gy, 260 * s, '#ffcf7a', .5 * gs, 'lightbox'); }
    LB.sheet(ctx, c, 1.45, R, x => { x.fillStyle = '#05051a'; for (const px of [-2900, -2100, -1250, -560, 980]) x.fillRect(px, -2400, 120, 5000); }, { blur: 10, rim: false, glow: .2 });
    LB.grade(ctx, t);
  }

  F.scene('seq-03', {
    W, H, duration: DUR, draw, label: C.label, ready: Promise.resolve(), grain: 'none',
    from: { id: 'seq-02', dur: .9, dir: 'right' },
    sfx: [
      { t: T_HIM - .1, type: 'whizz', g: .25 },
      { t: T_IN + .3, type: 'riser', dur: T_RUN - T_IN - .3, g: .35 },
      { t: T_RUN, type: 'swoosh', dur: .7, g: .4 },
      { t: T_LONG, type: 'swoosh', dur: .7, g: .2 },
      { t: T_RUN + .3, type: 'lib', dur: T_DRAW - T_RUN, label: 'RUNNING FOOTSTEPS ON A STONE FLOOR, two men' },
    ],
    api: { DUR },
  });
})();
