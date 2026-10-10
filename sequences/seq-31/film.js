(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, QM = F.qinmap, CH = F.china, Mo = F.motion, Q = F.qin, { clamp, smooth, easeIO, lerp, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-31'), DUR = C.duration, GT0 = C.T.start;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const D2R = Math.PI / 180, PI = Math.PI, ID = { x: W / 2, y: H / 2, z: 1 }, RC = [W / 2, H / 2];
  const SH = () => F.SHIFT || { x: 0, y: 0 };
  const A15 = () => F.getScene('seq-15').api, A6 = () => F.getScene('seq-06').api, A10 = () => F.getScene('seq-10').api, A27 = () => F.getScene('seq-27').api, A28 = () => F.getScene('seq-28').api;
  const TOP = () => A15().TOPH();
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

  const T_FORGED = 0.53, T_EDICT = 1.45;
  const T_CAPABLE = 2.81, T_FUSU = 4.21, T_RECEIVED = 5.16, T_LETTER = 5.75, T_FATHER = 6.47, T_NAME = 6.93;
  const T_ORDER = 7.19, T_COMMIT = 8.05, T_SUICIDE = 8.44;
  const T_HE = 9.37, T_OBEYED = 9.51;
  const T_WEAK = 10.42, T_PLIABLE = 11.03, T_YOUNGER = 11.48, T_SON = 11.93, T_INSTALLED = 12.32, T_INSTEAD = 12.9;

  const SHQ = () => A28().SHQ, HD = PI;
  const LET0 = () => [SHQ()[0] - 5.4, SHQ()[1] + 6.6];
  const LANT0 = () => [SHQ()[0] - 9.5, SHQ()[1] + 4.2];
  const FUSU = [134.6, -127.0], FLANT = [136.3, -126.6], LET1 = [135.1, -124.3];
  const THR = () => { const [x, y] = A15().XY(); return [x - 8, y + 1.5]; };
  const THRONE_H = 15;

  const LW = 1.9, LH = 1.3, NC = 7, NR = 9;
  const GLYPH = (() => {
    const R = F.rng(3111), o = [];
    const part = (x0, y0, x1, y1, out) => {
      const n = 2 + Math.floor(R() * 2), W2 = x1 - x0, H2 = y1 - y0;
      for (let k = 0; k < n; k++) {
        const r = R(), X = u => x0 + W2 * u, Y = v => y0 + H2 * v;
        if (r < .3) { const v = .15 + .7 * R(); out.push([[X(.08), Y(v)], [X(.92), Y(v + .03)]]); }
        else if (r < .5) { const u = .25 + .5 * R(); out.push([[X(u), Y(.05)], [X(u), Y(.95)]]); }
        else if (r < .65) { const a = .2 + .2 * R(), b = .45 + .3 * R(); out.push([[X(.18), Y(a)], [X(.18), Y(b)], [X(.82), Y(b)], [X(.82), Y(a)], [X(.18), Y(a)]]); }
        else if (r < .8) out.push([[X(.75), Y(.15)], [X(.55), Y(.55)], [X(.12), Y(.9)]]);
        else if (r < .92) out.push([[X(.25), Y(.25)], [X(.5), Y(.6)], [X(.92), Y(.88)]]);
        else { const u = .3 + .4 * R(), v = .1 + .3 * R(); out.push([[X(u), Y(v)], [X(u + .12), Y(v + .14)]]); }
      }
    };
    for (let c = 0; c < NC; c++) for (let r = 0; r < NR; r++) {
      if (c === 0 && r > 5) continue;
      const st = [], k = R();
      if (k < .35) part(0, 0, 1, 1, st);
      else if (k < .7) { const m = .38 + .14 * R(); part(0, 0, m, 1, st); part(m, 0, 1, 1, st); }
      else { const m = .35 + .2 * R(); part(0, 0, 1, m, st); part(0, m, 1, 1, st); }
      o.push({ c, r, s: st });
    }
    return o;
  })();
  const inkAt = (t, c, r) => clamp((t - (T_FORGED - .02) - (NC - 1 - c) * .12 - r * .018) / .14);
  const onLetter = (L, u, v, h) => [L[0] - LW / 2 + LW * u, L[1] - LH / 2 + LH * v, h];
  function letter(x, cam, L, t, o = {}) {
    const h = TOP() + .03, at = (u, v) => cam.at(...onLetter(L, u, v, h));
    const quad = (u0, v0, u1, v1, col) => { const q = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]; if (q.some(p => !p)) return; x.fillStyle = col; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); };
    quad(-.18, -.2, 1.18, 1.22, '#6a5236');
    quad(0, 0, 1, 1, '#efe2c2');
    quad(-.03, 0, .02, 1, '#7a4a28'); quad(.98, 0, 1.03, 1, '#7a4a28');
    const cw = .86 / NC, ch = .82 / NR;
    x.strokeStyle = '#1e1714'; x.lineCap = 'round';
    for (const g of GLYPH) {
      const k = o.full ? 1 : inkAt(t, g.c, g.r); if (k <= 0) continue;
      const u0 = .07 + (NC - 1 - g.c) * cw * 0 + g.c * cw, v0 = .08 + g.r * ch;
      const p0 = at(u0, v0), p1 = at(u0 + cw, v0 + ch); if (!p0 || !p1) continue;
      x.lineWidth = Math.max(.6, .085 * Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 1.41); x.lineJoin = 'round';
      x.globalAlpha = k; x.beginPath();
      for (const pl of g.s) { let pen = false; for (const [a, b] of pl) { const A = at(u0 + cw * (.12 + .76 * a), v0 + ch * (.08 + .84 * b)); if (!A) { pen = false; continue; } if (pen) x.lineTo(A[0], A[1]); else { x.moveTo(A[0], A[1]); pen = true; } } }
      x.stroke(); x.globalAlpha = 1;
    }
    const sk = o.full ? 1 : ss(T_EDICT - .05, T_EDICT + .06, t);
    if (sk > 0) {
      const s = 1 + .35 * (1 - sk), cu = .1, cv = .86, hw = .075 * s, hv = .11 * s;
      quad(cu - hw, cv - hv, cu + hw, cv + hv, `rgba(178,38,28,${sk})`);
      x.strokeStyle = `rgba(250,226,206,${.8 * sk})`; x.lineWidth = 1; x.beginPath();
      for (const [a, b, c2, d] of [[-.5, -.2, .5, -.2], [0, -.6, 0, .6], [-.5, .3, .5, .3], [-.3, -.6, -.3, -.1], [.3, .1, .3, .6]]) { const A = at(cu + hw * a, cv + hv * b), B = at(cu + hw * c2, cv + hv * d); if (A && B) { x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); } }
      x.stroke();
    }
  }
  const printAt = L => onLetter(L, .1, .86, TOP() + .03);
  function sword(x, cam, L, gleam) {
    const h = TOP() + .05, a = -.5, d = [Math.cos(a), Math.sin(a)], c = [L[0] - .1, L[1] + .05];
    const P = s => cam.at(c[0] + d[0] * s, c[1] + d[1] * s, h);
    const seg = (s0, s1, wd, col) => { const A = P(s0), B = P(s1); if (!A || !B) return; x.strokeStyle = col; x.lineWidth = Math.max(1, wd * (A[3] + B[3]) / 2); x.lineCap = 'round'; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); };
    seg(-1.15, .95, .085, '#b9bfc6'); seg(-1.15, .95, .025, '#e8ecf0');
    seg(-1.22, -1.08, .22, '#8a6a34'); seg(-1.62, -1.22, .07, '#2a2220'); seg(-1.66, -1.62, .1, '#8a6a34');
    if (gleam > 0) { const s = lerp(-1.1, .9, gleam), A = P(s - .18), B = P(s + .18); if (A && B) { x.strokeStyle = `rgba(255,255,255,${.9 * Math.sin(PI * gleam)})`; x.lineWidth = Math.max(1.5, .05 * A[3]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); } }
  }
  const MEN = () => { const L = LET0(); return [[L[0] - 2.3, L[1] - 1.05], [L[0] - 2.75, L[1] - 1.75]]; };
  function manShadows(ctx, cam, t) {
    const lp = LANT0(), sh = SH(), h = TOP() + .04, L0 = LET0(), sk = ss(40, 12, Math.hypot(cam.pos[0] - L0[0], cam.pos[1] - TOP(), cam.pos[2] + L0[1])); if (sk <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'multiply';
    MEN().forEach((m, i) => {
      const d = [m[0] - lp[0], m[1] - lp[1]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L], n = [-u[1], u[0]], len = 4.4 + .7 * i;
      const at = (s, o) => cam.at(m[0] + u[0] * s + n[0] * o, m[1] + u[1] * s + n[1] * o, h);
      const prof = [[0, .12], [.3, .2], [.55, .34], [.7, .42], [.74, .3], [.78, .12], [.8, .16], [.88, .16], [.9, .07], [1.0, .07]];
      const shape = (k, grow) => { const pts = []; for (const [f, w] of prof) pts.push(at(len * f, -(w * k + grow))); for (let j = prof.length - 1; j >= 0; j--) pts.push(at(len * prof[j][0], prof[j][1] * k + grow)); return pts; };
      for (const [grow, a] of [[.07, .22], [0, .4], [-.04, .2]]) {
        const pts = shape(1.6, grow); if (pts.some(p => !p)) return;
        ctx.fillStyle = `rgba(40,34,60,${a * sk})`; ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
      }
    });
    ctx.restore();
  }

  const T_LIFT = T_EDICT + .5, T_RUN0 = T_EDICT + .85, T_ARR = T_FUSU - .25, T_LAND0 = T_RECEIVED - .05, T_LAND1 = T_RECEIVED + .45;
  let ROUTE = null;
  const route = () => { if (ROUTE) return ROUTE; const a = printAt(LET0()), b = LET1, m = [lerp(a[0], b[0], .5) + 4, lerp(a[1], b[1], .5) + 14]; const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * m[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * m[1] + u * u * b[1]]); } return (ROUTE = QM.road(pts)); };
  function lightAt(t) {
    const R = route(), a = printAt(LET0());
    if (t < T_LIFT) return null;
    if (t < T_RUN0) { const k = ss(T_LIFT, T_RUN0, t); return [a[0], a[1], TOP() + .05 + 2.4 * k, 0]; }
    if (t < T_ARR) { const u = easeIO((t - T_RUN0) / (T_ARR - T_RUN0)), q = QM.along(R, u * R.L); return [q[0], q[1], TOP() + 2.45 + 1.2 * Math.sin(PI * u), u]; }
    const k = ss(T_LAND0, T_LAND1, t), b = LET1; return [b[0], b[1], TOP() + lerp(2.45, .05, k) + .15 * Math.sin(t * 3) * (1 - k), 1];
  }
  const landK = t => ss(T_LAND0 + .2, T_LAND1, t);
  function trail(ctx, cam, t) {
    if (t < T_RUN0) return;
    const R = route(), u = t < T_ARR ? easeIO((t - T_RUN0) / (T_ARR - T_RUN0)) : 1, fade = 1 - .7 * ss(T_ARR + .3, T_ARR + 2, t) - .3 * ss(T_OBEYED, T_OBEYED + 1, t);
    const sh = SH(), h = TOP() + .06;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [wd, col] of [[7, `rgba(255,70,40,${.18 * fade})`], [2.5, `rgba(255,120,90,${.65 * fade})`]]) {
      ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); let pen = false;
      for (let s = 0; s <= u * R.L; s += 1.5) { const q = QM.along(R, s), p = cam.at(q[0], q[1], h); if (!p) { pen = false; continue; } if (pen) ctx.lineTo(p[0], p[1]); else { ctx.moveTo(p[0], p[1]); pen = true; } }
      ctx.stroke();
    }
    ctx.restore();
  }

  const FIGH = 6.2, INK = '#0d0c16', RIMC = '#ffc98a';
  const LK = { min: Q.silhouette('minister', INK), rim: Q.silhouette('minister', RIMC, RIMC) };
  const lantern = t => t < T_OBEYED - .05 ? 1 + .06 * Math.sin(t * 9) : Math.max(0, 1 - ss(T_OBEYED - .05, T_OBEYED + .4, t)) * (.6 + .4 * Math.abs(Math.sin(t * 37)));
  function figure(x, cam, mx, my, h, pose, rimK, o = {}) {
    const u = QM.up(cam, mx, my, TOP()); if (!u) return null;
    const s = h * u.k / 92; if (s * 92 < 3) return null;
    const tilt = clamp(1 - u.lev, 0, .5);
    const draw = (L, dx, dy) => { x.save(); x.translate(u.x + dx, u.y + dy); x.scale(s, s); Q.draw(x, FL.P, pose, L, { tilt, robe: 44, shadow: 0, beard: o.beard, over: o.over }); x.restore(); };
    if (rimK > .01) { const r = Math.max(.8, s * 1.3); x.save(); x.globalAlpha *= rimK; draw(LK.rim, (o.rimDx ?? 1) * r, -r * .5); x.restore(); }
    draw(LK.min, 0, 0); draw(LK.min, 0, 0);
    return { sx: u.x, sy: u.y - 112 * s, s };
  }
  const stand = (yaw, head = 0, lean = .02) => ({ hip: [0, Mo.HIP], lean, bend: 0, head, feet: [{ at: [-3, 0], ang: 0 }, { at: [3, 0], ang: 0 }], arms: [[.08, .15], [.12, .2]], hands: [{ pose: 'relaxed' }, { pose: 'relaxed' }], yaw, headYaw: yaw });
  const AT = {};
  const FIG = 92;
  const T_W0 = T_OBEYED + .2, T_W1 = T_INSTALLED + .35;
  const WALKS = () => { const T = THR(); return [
    { who: 'son', h: 4.6, from: [T[0] + 16, T[1] + 11], to: [T[0] + 1.2, T[1] + 1.6], step: 34 },
    { who: 'eunuch', h: 6.6, from: [T[0] + 19.5, T[1] + 13.5], to: [T[0] + 4.6, T[1] + 3.6], step: 38 },
  ]; };
  let WG = null;
  function walks() {
    if (WG) return WG;
    return (WG = WALKS().map(o => { const d = [o.to[0] - o.from[0], o.to[1] - o.from[1]], L = Math.hypot(d[0], d[1]), unit = o.h / 92; return { ...o, d: [d[0] / L, d[1] / L], L, G: Mo.gait({ from: 0, to: L / unit, t0: T_W0, gait: 'walk', style: { step: o.step, arms: .25, lean: o.who === 'son' ? .1 : .02 }, until: T_W1 }), unit }; }));
  }
  const centre = (p, dx) => ({ ...p, hip: [p.hip[0] - dx, p.hip[1]], feet: p.feet.map(f => ({ ...f, at: [f.at[0] - dx, f.at[1]], ax: f.ax != null ? f.ax - dx : f.ax })) });
  function walkerAt(o, cam, t) {
    const tp = Mo.pose(t), s = clamp(o.G.x(tp) * o.unit, 0, o.L), p = [o.from[0] + o.d[0] * s, o.from[1] + o.d[1] * s];
    const face = Math.atan2(-o.d[1], o.d[0]), yaw = cam.yawOf(face);
    return { p, pose: { ...centre(o.G(tp), o.G.x(tp)), yaw, headYaw: yaw + (o.who === 'son' ? .1 * Math.sin(t * 1.3) : 0), head: o.who === 'son' ? .18 : 0 } };
  }
  function beltSeal(xx, pj) {
    const c = Math.cos(pj.yaw), hx = (pj.hip[0] + 3) * c - 6.5 * Math.sin(pj.yaw), hy = pj.hip[1] - 4;
    xx.strokeStyle = '#a63a26'; xx.lineWidth = 1.6; xx.beginPath(); xx.moveTo(hx, hy); xx.lineTo(hx + 1, hy + 12); xx.stroke();
    xx.fillStyle = '#d8e2cc'; xx.fillRect(hx - 2.4, hy + 12, 4.8, 4.4);
  }
  const throneK = t => ss(T_YOUNGER, T_SON + .3, t);
  const flareK = t => bump(t, T_INSTALLED - .05, T_INSTALLED + .25, T_INSTEAD + .3, DUR + .8);
  function throne(x, cam, t, a = 1) {
    const T = THR(), u = QM.up(cam, T[0], T[1], TOP()); if (!u) return;
    const S = THRONE_H * u.k * (.45 + .55 * u.lev) / 59;
    QM.throne(x, u.x, u.y, S, { alpha: a });
  }

  function night(ctx, k = .9) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(34,44,84,${k})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,.45)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const nightK = cam => { const dd = p => Math.hypot(cam.pos[0] - p[0], cam.pos[1] - TOP(), cam.pos[2] + p[1]); return lerp(.9, .8, Math.max(ss(30, 8, dd(LET0())), ss(40, 14, dd(FUSU)))); };
  const SPR = new Map();
  function sglow(ctx, cx, cy, r, color, a) {
    if (a <= 0 || r <= 0) return;
    let c = SPR.get(color);
    if (!c) { const [cv, x] = F.canvas(128, 128), n = parseInt(color.slice(1), 16), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},1)`); g.addColorStop(1, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); SPR.set(color, c = cv); }
    const tgt = F.route ? F.route(ctx, 'glow') : ctx; if (!tgt) return;
    tgt.save(); if (tgt !== ctx) tgt.setTransform(ctx.getTransform()); tgt.globalCompositeOperation = 'lighter'; tgt.globalAlpha = Math.min(1, a) * (tgt === ctx ? ctx.globalAlpha : 1);
    tgt.drawImage(c, cx - r, cy - r, 2 * r, 2 * r); tgt.restore();
  }
  function townLights(ctx, cam, t, k = 1) {
    if (k <= 0) return;
    const sh = SH(), g = A10().geo(), S = SHQ();
    for (const l of g.lights) {
      const on = ss(14, 40, Math.hypot(l.x - S[0], l.y - S[1])) * k; if (on <= 0) continue;
      const u = QM.up(cam, l.x, l.y, g.top + l.h); if (!u) continue;
      const tw = .85 + .15 * Math.sin(t * 9 + l.seed * 2.3), r = Math.min(26, 16 + 8 * Math.min(1.5, u.k / 2));
      sglow(ctx, u.x - sh.x, u.y - sh.y, r, '#ffc977', .5 * on * tw);
      sglow(ctx, u.x - sh.x, u.y - sh.y, 3.5, '#fff3d6', .85 * on);
    }
    const xy = A15().XY(), u = QM.up(cam, xy[0], xy[1], g.top + 6);
    if (u) { PR.glow(ctx, u.x - sh.x, u.y - sh.y, Math.min(140, 60 + 2 * u.k), '#ffcf80', .45 * k, 'flat'); PR.glow(ctx, u.x - sh.x, u.y - sh.y, 8, '#fff4dc', .8 * k, 'flat'); }
  }
  function pool(ctx, cam, p, k, r = 7) {
    if (k <= .01) return; const sh = SH(), h = TOP() + .05, c = cam.at(p[0], p[1], h); if (!c) return;
    const d = Math.hypot(cam.pos[0] - p[0], cam.pos[1] - h, cam.pos[2] + p[1]), rx = r * c[3], ry = rx * Math.max(.05, (cam.pos[1] - h) / d);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    ctx.translate(c[0], c[1]); ctx.scale(1, Math.max(.05, ry / Math.max(1, rx)));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(255,190,110,${.42 * k})`); g.addColorStop(.5, `rgba(255,160,80,${.16 * k})`); g.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = g; ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx); ctx.restore();
  }
  function lanternPole(x, cam, p, lit) {
    const b = QM.up(cam, p[0], p[1], TOP()), tp = QM.up(cam, p[0], p[1], TOP() + 6.5); if (!b || !tp) return;
    x.strokeStyle = '#14131c'; x.lineWidth = Math.max(1, .25 * b.k); x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(tp.x, tp.y); x.stroke();
    x.fillStyle = lit > .05 ? S3.mix('#3a2a20', '#f0a850', clamp(lit)) : '#2a2026'; x.beginPath(); x.ellipse(tp.x, tp.y + .5 * tp.k, .55 * tp.k, .8 * tp.k, 0, 0, TAU); x.fill();
  }
  function guard(x, cam, gx, gy) {
    const S = SHQ(), u = QM.up(cam, S[0] + gx, S[1] + gy, TOP()); if (!u) return;
    const h = 5.0 * u.k * (.5 + .5 * u.lev); if (h < 1.2) return;
    QM.soldier(x, u.x, u.y, h, 0, gx < 0 ? -1 : 1, { ink: '#14131c', rim: 'rgba(190,206,240,.45)' });
  }
  function road(x, cam) {
    const S = SHQ(), h = TOP() + .03, pts = [[S[0] - 140, S[1] + 6], [S[0] - 40, S[1] + 1], [S[0] + 40, S[1] - .5], [S[0] + 140, S[1] - 10]];
    const R = QM.road(pts), L = [], Rr = [];
    for (let s = 0, done = false; !done; s += 2) { if (s >= R.L) { s = R.L; done = true; } const q = QM.along(R, s), nx = -Math.sin(q[2]), ny = Math.cos(q[2]), a = cam.at(q[0] + nx * 3.2, q[1] + ny * 3.2, h), b = cam.at(q[0] - nx * 3.2, q[1] - ny * 3.2, h); if (a && b) { L.push(a); Rr.push(b); } }
    if (L.length < 2) return;
    x.fillStyle = '#cdb98e'; x.beginPath(); L.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) x.lineTo(Rr[i][0], Rr[i][1]); x.closePath(); x.fill();
  }

  const NEAR = .004;
  function camera(c, f) {
    const yaw = c.yaw, ph = c.pitch, D = f / c.z, cp = Math.cos(ph), sp = Math.sin(ph);
    const fwd = [Math.sin(yaw) * cp, -sp, Math.cos(yaw) * cp], T = [c.x, c.lift, -c.y];
    const cam = S3.camera({ pos: [T[0] - fwd[0] * D, T[1] - fwd[1] * D, T[2] - fwd[2] * D], yaw, pitch: -ph, f, W, H, near: NEAR });
    cam.z = c.z; cam.ph = ph; cam.at = (x, y, h) => cam.proj([x, h, -y]);
    return cam;
  }
  const zf = pitch => M45 ? .66 + .24 * ss(40, 12, pitch) : 1;
  let SPL = null;
  function spl() {
    if (SPL) return SPL;
    const top = TOP(), L = LET0(), pr = printAt(L), T = THR(), R = route(), mid = u => { const q = QM.along(R, u * R.L); return q; };
    const K = [
      [-.6, L[0] + .7, L[1] - 1.7, 250, 25, 22, top], [0, L[0] + .68, L[1] - 1.66, 254, 25, 21.5, top], [T_EDICT + .2, L[0] + .45, L[1] - 1.1, 300, 30, 18, top],
      [T_LIFT + .1, pr[0] + .3, pr[1] - 1.2, 120, 54, 4, top + 1.6],
      [T_RUN0 + .35, mid(.12)[0], mid(.12)[1], 9, 52, -20, top], [T_RUN0 + .95, mid(.6)[0], mid(.6)[1], 3.6, 54, -28, top],
      [T_ARR, LET1[0] + 2, LET1[1] + 1, 6, 46, -34, top], [T_FUSU + .5, FUSU[0] + .8, FUSU[1] + .8, 26, 22, -38, top + 2.5],
      [T_RECEIVED + .3, FUSU[0] + .6, FUSU[1] + 1.6, 52, 18, -36, top + 2.0], [T_NAME, LET1[0] - .1, LET1[1] - .6, 90, 22, -34, top + 1.3],
      [T_SUICIDE + .3, LET1[0] - .2, LET1[1] - .8, 98, 23, -33, top + 1.5], [T_OBEYED + .3, FUSU[0] + .5, FUSU[1] + 1.2, 74, 19, -34, top + 2.2],
      [T_PLIABLE - .25, FUSU[0], FUSU[1] + 18, 4.2, 50, -14, top], [T_YOUNGER + .1, T[0] + 2, T[1] - 40, 3.4, 52, -6, top],
      [T_SON + .55, T[0] + 3, T[1] - 2, 16, 26, -12, top + 4], [T_INSTALLED + .45, T[0] + 2.6, T[1] + 1.2, 30, 16, -16, top + 6.5],
      [DUR, T[0] + 2.5, T[1] + 1.3, 32, 15, -17, top + 7], [DUR + 1.4, T[0] + 2.45, T[1] + 1.35, 33, 14.6, -17.4, top + 7.2],
    ];
    const ts = K.map(k => k[0]), mono = i => Mo.monotone(ts.map((t, j) => [t, i === 3 ? Math.log(K[j][3]) : K[j][i]]));
    return (SPL = [1, 2, 3, 4, 5, 6].map(mono));
  }
  function params(t) { const [sx, sy, sz, sp, sw, sl] = spl(); return { x: sx(t), y: sy(t), z: Math.exp(sz(t)), pitch: sp(t), yaw: sw(t), lift: sl(t) }; }
  const camOf = c => { const zk = lerp(zf(c.pitch), 1, smooth((Math.log(c.z) - Math.log(20)) / Math.log(3))); return camera({ x: c.x, y: c.y, z: c.z * zk, pitch: c.pitch * D2R, yaw: c.yaw * D2R, lift: c.lift }, A6().FLENS); };
  const camAt = t => camOf(params(t));

  const FAST = { land: 4, blocks: 5 };
  const veh = () => { const S = SHQ(), g = A27().GAP; return [[S[0] - g, S[1], 'chariot'], [S[0], S[1], 'closed'], [S[0] + g, S[1], 'closed']]; };
  function frame(ctx, t, cam, o = {}) {
    const S = SHQ(), lit = lantern(t), shq = 1 - (o.shq || 0), wk = o.walk ?? 1;
    QM.FAST = FAST; const sheet0 = FL.sheet; FL.sheet = (c, cm, p, R, fn, op = {}) => sheet0.call(FL, c, cm, p, R, fn, { ...op, shadow: false });
    try { A15().mapFrame(ctx, A27().TF, cam, false, {
      isle: { t: 60 + t, quiet: true, alpha: 1, glow: .3 },
      sky: A27().sky,
      onTop: x => { road(x, cam); if (shq < 1) { x.save(); x.globalAlpha *= shq; } letter(x, cam, LET0(), t); if (shq < 1) x.restore(); if (landK(t) > 0) { x.save(); x.globalAlpha *= landK(t); letter(x, cam, LET1, t, { full: true }); sword(x, cam, LET1, 0); x.restore(); } if (o.onTop) o.onTop(x); },
      uprights: put => {
        if (shq > 0) veh().forEach(([vx, vy, kind]) => put(vx, vy, TOP(), x => { if (shq < 1) { x.save(); x.globalAlpha *= shq; } A27().vehicle(x, cam, vx, vy, HD, kind, t, { go: 0, lit: false, aim: 0, lightK: 0, kick: 0, head: .7 }); if (shq < 1) x.restore(); }));
        if (shq > 0) [[-5.2, -7.5], [14.6, -8.2]].forEach(([gx, gy]) => put(S[0] + gx, S[1] + gy, TOP(), x => { if (shq < 1) { x.save(); x.globalAlpha *= shq; } guard(x, cam, gx, gy); if (shq < 1) x.restore(); }));
        if (shq > 0) [[-9.5, 4.2], [9.8, -4.0]].forEach(([lx, ly]) => put(S[0] + lx, S[1] + ly, TOP(), x => { if (shq < 1) { x.save(); x.globalAlpha *= shq; } lanternPole(x, cam, [S[0] + lx, S[1] + ly], 1); if (shq < 1) x.restore(); }));
        put(FLANT[0], FLANT[1], TOP(), x => lanternPole(x, cam, FLANT, lit));
        put(FUSU[0], FUSU[1], TOP(), x => { const yaw = cam.yawOf(PI * .92), head = .3 * ss(T_FATHER - .2, T_NAME, t) + .12 * ss(T_ORDER, T_SUICIDE, t);  AT.fusu = figure(x, cam, FUSU[0], FUSU[1], FIGH, stand(yaw, head, .02 + .04 * ss(T_SUICIDE, T_OBEYED, t)), .9 * clamp(lit), { rimDx: 1 }); });
        put(THR()[0], THR()[1], TOP(), x => throne(x, cam, t, o.throneAlpha ?? 1));
        if (wk > 0) for (const w8 of walks()) { const a = walkerAt(w8, cam, t), wk8 = w8; put(a.p[0], a.p[1], TOP(), x => { if (wk < 1) { x.save(); x.globalAlpha *= wk; } const r = figure(x, cam, a.p[0], a.p[1], wk8.h, a.pose, .5 + .5 * flareK(t), { rimDx: -1, over: wk8.who === 'eunuch' ? (xx, pj) => beltSeal(xx, pj) : null }); if (wk8.who === 'son') AT.son = r; if (wk < 1) x.restore(); }); }
        if (o.uprights) o.uprights(put);
      },
    }); } finally { QM.FAST = null; FL.sheet = sheet0; }
    night(ctx, nightK(cam));
    const sh = SH();
    pool(ctx, cam, LANT0(), shq, 9);
    pool(ctx, cam, FLANT, clamp(lit), 7);
    manShadows(ctx, cam, t);
    townLights(ctx, cam, t, o.lights ?? 1);
    if (shq > 0) for (const [lx, ly] of [[-9.5, 4.2], [9.8, -4.0]]) { const u = QM.up(cam, S[0] + lx, S[1] + ly, TOP() + 6.2); if (u) PR.glow(ctx, u.x - sh.x, u.y - sh.y, Math.min(90, Math.max(8, 2.2 * u.k)), '#ffb868', .55 * shq, 'flat'); }
    { const u = QM.up(cam, FLANT[0], FLANT[1], TOP() + 6.2); if (u && lit > .01) PR.glow(ctx, u.x - sh.x, u.y - sh.y, Math.min(110, Math.max(8, 2.4 * u.k)), '#ffb868', .6 * lit, 'flat'); }
    trail(ctx, cam, t);
    const pk = ss(T_EDICT - .05, T_EDICT + .1, t) * (1 - .6 * ss(T_LIFT, T_RUN0, t)), pr = cam.at(...printAt(LET0()));
    if (pk > 0 && pr) { PR.glow(ctx, pr[0] - sh.x, pr[1] - sh.y, Math.min(260, Math.max(10, .5 * pr[3])), '#ff5a3a', .55 * pk, 'flat'); ring(ctx, cam, t); }
    const lp = lightAt(t); if (lp && landK(t) < 1) { const q = cam.at(lp[0], lp[1], lp[2]); if (q) { const a = 1 - landK(t); PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.min(220, Math.max(18, 1.6 * q[3])), '#ff4a2a', .7 * a, 'flat'); PR.glow(ctx, q[0] - sh.x, q[1] - sh.y, Math.min(60, Math.max(5, .4 * q[3])), '#ffe2d0', .95 * a, 'flat'); } }
    const fk = bump(t, T_FATHER - .1, T_NAME, T_NAME + .6, T_ORDER + .4) * landK(t) + .5 * landK(t) * bump(t, T_SUICIDE - .1, T_SUICIDE + .2, T_OBEYED, T_OBEYED + .4), f1 = cam.at(...printAt(LET1));
    if (f1 && fk > 0) PR.glow(ctx, f1[0] - sh.x, f1[1] - sh.y, Math.min(160, Math.max(8, .5 * f1[3])), '#ff5a3a', .6 * fk, 'flat');
    const gl = clamp((t - T_SUICIDE + .05) / .7); if (gl > 0 && gl < 1 && landK(t) > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter'; sword(ctx, cam, LET1, gl); ctx.restore(); }
    const T = THR(), tu = QM.up(cam, T[0], T[1], TOP() + THRONE_H * .45);
    if (tu) { const k = (.35 * throneK(t) + .9 * flareK(t)) * (o.throneGlow ?? 1); if (k > 0) PR.glow(ctx, tu.x - sh.x, tu.y - sh.y, Math.min(W * .5, Math.max(30, 9 * tu.k)), '#ffcf70', .45 * k, 'flat'); }
    if (o.afterNight) o.afterNight(ctx);
    if (!o.noText) tags(ctx, t);
    if (o.beforeGrade) o.beforeGrade(ctx);
    FL.grade(ctx, GT0 + t);
  }
  function ring(ctx, cam, t) {
    const k = (t - T_EDICT) / 1.1; if (k <= 0 || k >= 1) return;
    const p = printAt(LET0()), sh = SH(), r = .4 + 9 * easeIO(k), pts = [];
    for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; pts.push(cam.at(p[0] + r * Math.cos(a), p[1] + r * Math.sin(a), TOP() + .05)); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,70,40,${.7 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); let pen = false; for (const q of pts) { if (!q) { pen = false; continue; } if (pen) ctx.lineTo(q[0], q[1]); else { ctx.moveTo(q[0], q[1]); pen = true; } } ctx.stroke(); ctx.restore();
  }
  function tags(ctx, t) {
    const a = ss(T_FUSU - .05, T_FUSU + .2, t) * (1 - ss(T_ORDER - .2, T_ORDER + .3, t)); if (a <= 0 || !AT.fusu) return;
    const sh = SH(), at = AT.fusu;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -sh.x, -sh.y);
    QM.tag(ctx, at.sx, Math.max(H * .14, at.sy - 6), 'FUSU', { alpha: a, size: M45 ? 36 : 40, stem: 30, card: '#f5ecd8', ink: '#1b2130' });
    ctx.restore();
  }
  const draw = (ctx, t) => frame(ctx, t, camAt(t));

  F.scene('seq-31', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-30', dur: .9, dir: 'right' },
    sfx: [
      { t: .9, type: 'lib', dur: T_LIFT, label: 'NIGHT ON AN EMPTY PLAIN: CRICKETS' },
      ...Array.from({ length: 7 }, (_, i) => ({ t: T_FORGED - .02 + i * .12, type: 'quill', dur: .14, g: .035 })),
      { t: T_EDICT, type: 'thud', g: .2, noSnap: true }, { t: T_EDICT + .05, type: 'hum', dur: 1.2, g: .06 },
      { t: T_LIFT, type: 'riser', dur: T_ARR - T_LIFT, f0: 500, f1: 1400, g: .05 },
      { t: T_RUN0 + .2, type: 'whoosh', f0: 160, f1: 70, dur: 1.6, g: .09 },
      { t: T_FUSU - .3, type: 'lib', dur: T_OBEYED + .9 - T_FUSU, label: 'WIND OVER A WALL AT NIGHT' },
      { t: T_LAND1 - .1, type: 'thud', g: .07, noSnap: true },
      { t: T_FATHER, type: 'shimmer', g: .07 },
      { t: T_SUICIDE + .05, type: 'clink', f: 2400, g: .08 },
      { t: T_OBEYED + .02, type: 'hiss', dur: .4, g: .05 },
      { t: T_OBEYED + .35, type: 'heartbeat', g: .16 },
      { t: T_PLIABLE - .3, type: 'whoosh', f0: 70, f1: 160, dur: 2.0, g: .09 },
      ...[0, 1, 2, 3].map(i => ({ t: T_SON + .1 + i * .32, type: 'footstep', g: .05 })),
      { t: T_INSTALLED, type: 'shimmer', g: .1 },
      { t: T_INSTALLED + .05, type: 'impact', size: .2, g: .12, noSnap: true },
    ],
    api: { DUR, camAt, params, camOf, frame, THR, THRONE_H, walks, walkerAt, sglow },
  });
})();
