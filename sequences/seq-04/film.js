(function () {
  'use strict';
  const F = FILM, PR = F.props, S3 = F.stage3d, Mo = F.motion, Q = F.qin, CH = F.china, { clamp, smooth, easeIO, lerp, noise1, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-04'), DUR = C.duration;
  const PA = F.look('paper', W, H), FL = F.look('flat', W, H), LB = F.look('lightbox', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const FIG = S3.FIG, PI = Math.PI;
  const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  const T_ELSE = 2.16, T_LIFE = 3.27;
  const T_RES = 4.43, T_MAN = 5.91, T_IMP = 7.43, T_SEAL = 7.95;
  const T_ORD = 9.04, T_ALC = 10.8, T_BRING = 11.58, T_LIFE2 = 13.27;
  const T_DEL = 14.11, T_KEY = 15.19, T_MERC = 17.54;
  const T_EVERY = 19.61, T_BEGINS = 20.19, T_DRINK = 22.17, T_INTO = 22.91, T_GRAVE = 23.33;
  const DOSES = [20.74 + .08, 21.27 + .08, T_DRINK + .08];
  const T_H2M0 = 3.05, T_H2M1 = 3.65;
  const T_IRIS0 = 14.3, T_IRIS1 = 15.0;
  const T_RI0 = 18.95, T_HO = 19.6;

  const E = [0, 1.05, -1.0];
  const TABLE = { x0: -.42, x1: .42, z0: -.36, z1: -.06, y: 1.38 };
  const CUP0 = [.08, TABLE.y + .014, -.2];
  const SCR = { x0: -2.7, x1: 2.7, y0: 1.25, y1: 4.95, z: -2.0 };
  const MK = .0049, MXC = 205, MYC = 15, SYC = 3.15;
  const mapToScreen = (X, Y) => [(MXC - X) * MK, SYC + (MYC - Y) * MK, SCR.z + .002];
  const XY = CH.proj(108.7, 34.35);
  const COL = {
    paper: { floor: '#d6cbb0', floorLine: '#bfb18f', wall: '#7e2f24', wallGold: '#c8973f', pillar: '#5a2a22', gold: '#c8973f', stone: '#d9cfb6', stoneTop: '#e6dcc4',
      lacquer: '#2e2427', lacquerRed: '#7e2f24', silk: '#ebdfc2', frame: '#3b2420', land: '#cdbf9c', china: '#e9dcbd', qin: '#d9a443', qinLine: '#a8782a', ceiling: '#3a2622', earth: '#b89a68', earthTop: '#c9ad7a', mount: '#87a39c', mount2: '#a9bdb4', field: '#9fae8a', window: '#f6ead0', lattice: '#6a3a2c' },
    lightbox: { floor: '#17173b', floorLine: '#101030', wall: '#1a1032', wallGold: '#4a4060', pillar: '#0d0c22', gold: '#4a4060', stone: '#201f4a', stoneTop: '#24234f',
      lacquer: '#0c0b20', lacquerRed: '#1a1032', silk: '#1c1b44', frame: '#0a0a1a', land: '#16163a', china: '#1d1c48', qin: '#2a2650', qinLine: '#1f1c40', ceiling: '#08081a', earth: '#1a1944', earthTop: '#2c2b66', mount: '#22235a', mount2: '#2a2b64', field: '#16163a', window: '#232352', lattice: '#0d0c22' },
  };

  const FLENS = M45 ? 1180 : 1500;
  const D_SCR = M45 ? 1.75 : 2.05, EYE_SCR = [0, SYC, SCR.z + D_SCR];
  const KH = [
    [-1.2, [.7, 2.25, 10.2], [0, 1.85, -1.2]],
    [0, [.62, 2.27, 9.6], [0, 1.88, -1.2]],
    [1.7, [.3, 2.4, 6.0], [0, 2.0, -1.4]],
    [2.45, [.08, 3.35, 3.0], [0, 3.15, -2.0]],
    [T_H2M0, EYE_SCR, [0, SYC, SCR.z]],
    [T_H2M1 + .5, EYE_SCR, [0, SYC, SCR.z]],
  ];
  const spline = keys => {
    const ts = keys.map(k => k[0]), mk = f => Mo.monotone(ts.map((t, i) => [t, f(keys[i])]));
    const ex = [0, 1, 2].map(j => mk(k => k[1][j])), tg = [0, 1, 2].map(j => mk(k => k[2][j]));
    return t => ({ eye: ex.map(f => f(t)), tgt: tg.map(f => f(t)) });
  };
  const camOf = (eye, tgt) => {
    const d = [eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]];
    return S3.camera({ pos: eye, yaw: Math.atan2(-d[0], -d[2]), pitch: Math.atan2(-d[1], Math.hypot(d[0], d[2])), f: FLENS, W, H });
  };
  const splH = spline(KH);
  const camHall = t => { if (window.__cam4) return S3.camera({ ...window.__cam4, f: FLENS, W, H }); const { eye, tgt } = splH(t); return camOf(eye, tgt); };

  let SINKY = 0;
  const dn = p => [p[0], p[1] - SINKY, p[2]];
  const B = b => ({ ...b, y0: b.y0 - SINKY, y1: b.y1 - SINKY });
  function floor(x, cam, K) {
    x.fillStyle = K.floor; S3.poly(x, cam, [dn([-11, 0, -6]), dn([11, 0, -6]), dn([11, 0, 16]), dn([-11, 0, 16])]) && x.fill();
    x.strokeStyle = K.floorLine; x.lineWidth = 1; x.beginPath();
    for (let z = -6; z <= 16; z += 1.1) S3.line(x, cam, dn([-11, 0, z]), dn([11, 0, z]));
    for (let X = -11; X <= 11; X += 1.1) S3.line(x, cam, dn([X, 0, -6]), dn([X, 0, 16]));
    x.stroke();
    x.fillStyle = K.lacquerRed; S3.poly(x, cam, [dn([-.9, .004, 1.6]), dn([.9, .004, 1.6]), dn([.9, .004, 16]), dn([-.9, .004, 16])]) && x.fill();
  }
  function wall(x, cam, K) {
    S3.box(x, cam, B({ x0: -11, x1: 11, y0: 0, y1: 7.2, z0: -6.4, z1: -6 }), { col: K.wall });
    x.strokeStyle = K.wallGold; x.lineWidth = 2; x.beginPath();
    for (let X = -9; X <= 9; X += 3) S3.line(x, cam, dn([X, .5, -6]), dn([X, 6.6, -6]));
    S3.line(x, cam, dn([-11, 6.6, -6]), dn([11, 6.6, -6])); S3.line(x, cam, dn([-11, .5, -6]), dn([11, .5, -6]));
    x.stroke();
    for (const sx of [-1, 1]) {
      if (!S3.facing(cam, [sx * 11, 3, 0], [-sx, 0, 0])) continue;
      S3.box(x, cam, B({ x0: sx > 0 ? 11 : -11.4, x1: sx > 0 ? 11.4 : -11, y0: 0, y1: 7.2, z0: -6.4, z1: 16 }), { col: K.wall });
      for (let z0 = -5.4; z0 < 15; z0 += 3.4) {
        const X = sx * 10.99, pts = [[X, .9, z0], [X, .9, z0 + 2.6], [X, 6.0, z0 + 2.6], [X, 6.0, z0]].map(dn);
        if (!S3.poly(x, cam, pts)) continue; x.fillStyle = K.window; x.fill();
        x.strokeStyle = K.lattice; x.lineWidth = 1.4; x.beginPath();
        for (let k = 1; k < 6; k++) S3.line(x, cam, dn([X, .9, z0 + 2.6 * k / 6]), dn([X, 6.0, z0 + 2.6 * k / 6]));
        for (let k = 1; k < 10; k++) S3.line(x, cam, dn([X, .9 + 5.1 * k / 10, z0]), dn([X, .9 + 5.1 * k / 10, z0 + 2.6]));
        x.stroke();
      }
    }
    x.fillStyle = K.ceiling; S3.poly(x, cam, [dn([-11, 7.2, -6.4]), dn([11, 7.2, -6.4]), dn([11, 7.2, 16]), dn([-11, 7.2, 16])]) && x.fill();
    for (let z = -4.5; z < 16; z += 4) S3.box(x, cam, B({ x0: -11, x1: 11, y0: 6.9, y1: 7.2, z0: z - .2, z1: z + .2 }), { col: K.pillar });
  }
  const PILLARS = []; for (const X of [-3.7, 3.7, -7.4, 7.4]) for (const Z of [-3.6, .6, 4.8, 9.0, 13.2]) PILLARS.push([X, Z]);
  function pillar(x, cam, K, [X, Z]) {
    S3.box(x, cam, B({ x0: X - .5, x1: X + .5, y0: 0, y1: .3, z0: Z - .5, z1: Z + .5 }), { col: K.stone });
    S3.cyl(x, cam, [X, Z], .33, .3 - SINKY, 6.9 - SINKY, { col: K.pillar, cap: false, lo: .35 });
    for (const y of [.55, 6.4, 6.6]) S3.ring(x, cam, [X, Z], .345, y - SINKY, y + .08 - SINKY, K.gold);
  }
  const TIERS = [{ h: .3, x: 3.0, zf: 1.6 }, { h: .6, x: 2.2, zf: 1.0 }, { h: .9, x: 1.5, zf: .4 }];
  function dais(x, cam, K) {
    let y0 = 0;
    for (const T of TIERS) { S3.box(x, cam, B({ x0: -T.x, x1: T.x, y0, y1: T.h, z0: -4.2, z1: T.zf }), { col: K.stone, top: K.stoneTop, skip: ['0,-1,0'] }); y0 = T.h; }
    x.strokeStyle = K.gold; x.lineWidth = 1.5; x.beginPath(); for (const T of TIERS) S3.line(x, cam, dn([-T.x, T.h, T.zf]), dn([T.x, T.h, T.zf])); x.stroke();
  }
  function throne(x, cam, K) {
    S3.box(x, cam, B({ x0: -.85, x1: .85, y0: .9, y1: 1.05, z0: -1.6, z1: -.35 }), { col: K.lacquer, top: S3.mix(K.lacquer, K.lacquerRed, .3) });
    x.strokeStyle = K.gold; x.lineWidth = 1.2; x.beginPath(); S3.line(x, cam, dn([-.85, 1.05, -.35]), dn([.85, 1.05, -.35])); x.stroke();
    S3.box(x, cam, B({ x0: -.85, x1: .85, y0: 1.05, y1: 1.55, z0: -1.6, z1: -1.5 }), { col: K.lacquer });
    for (const sx of [-1, 1]) S3.box(x, cam, B({ x0: sx * .85 - .05, x1: sx * .85 + .05, y0: 1.05, y1: 1.32, z0: -1.6, z1: -.8 }), { col: K.lacquer });
  }
  function table(x, cam, K) {
    for (const ex of [TABLE.x0 + .04, TABLE.x1 - .08]) S3.box(x, cam, B({ x0: ex, x1: ex + .04, y0: 1.05, y1: TABLE.y - .03, z0: TABLE.z0 + .03, z1: TABLE.z1 - .03 }), { col: K.lacquer });
    S3.box(x, cam, B({ x0: TABLE.x0, x1: TABLE.x1, y0: TABLE.y - .03, y1: TABLE.y, z0: TABLE.z0, z1: TABLE.z1 }), { col: K.lacquer, top: S3.mix(K.lacquer, K.lacquerRed, .25) });
  }
  function paintMap(xx, K) {
    xx.fillStyle = K.silk; xx.fillRect(-2000, -2000, 4000, 4000);
    xx.fillStyle = K.land; xx.beginPath(); CH.path(xx, CH.LAND); xx.fill();
    xx.fillStyle = K.china; xx.beginPath(); CH.path(xx, CH.CHINA); xx.fill();
    xx.save(); xx.beginPath(); CH.path(xx, CH.CHINA); xx.clip(); xx.fillStyle = K.qin; xx.beginPath(); CH.path(xx, CH.QIN221); xx.fill(); xx.restore();
    xx.strokeStyle = K.qinLine; xx.lineWidth = 1.6; xx.beginPath(); CH.path(xx, CH.CHINA); xx.stroke();
    xx.fillStyle = K.lacquerRed; xx.beginPath(); xx.arc(XY[0], XY[1], 6, 0, TAU); xx.fill();
  }
  function screen(x, cam, K) {
    S3.box(x, cam, B({ x0: SCR.x0 - .12, x1: SCR.x1 + .12, y0: SCR.y0 - .12, y1: SCR.y1 + .12, z0: SCR.z - .1, z1: SCR.z }), { col: K.frame });
    S3.box(x, cam, B({ x0: SCR.x0 - .3, x1: SCR.x1 + .3, y0: .9, y1: SCR.y0 - .12, z0: SCR.z - .25, z1: SCR.z + .15 }), { col: K.frame });
    for (const sx of [-1, 1]) S3.box(x, cam, B({ x0: sx * (SCR.x1 + .1) - .1, x1: sx * (SCR.x1 + .1) + .1, y0: .9, y1: SCR.y1 + .3, z0: SCR.z - .2, z1: SCR.z + .05 }), { col: K.frame });
    if (!S3.facing(cam, [0, 2, SCR.z], [0, 0, 1])) return;
    const n = 1, m = 1, X0 = MXC + SCR.x0 / -MK, X1 = MXC + SCR.x1 / -MK, Y0 = MYC + (SYC - SCR.y1) / MK, Y1 = MYC + (SYC - SCR.y0) / MK;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const ax = lerp(X1, X0, i / n), bx = lerp(X1, X0, (i + 1) / n), ay = lerp(Y0, Y1, j / m), by = lerp(Y0, Y1, (j + 1) / m);
      const o = dn(mapToScreen(ax, ay)), U = [-(bx - ax) * MK, 0, 0], V = [0, -(by - ay) * MK, 0];
      S3.onPlane(x, cam, o, U, V, xx => { xx.save(); xx.beginPath(); xx.rect(-.002, -.002, 1.004, 1.004); xx.clip(); xx.scale(1 / (bx - ax), 1 / (by - ay)); xx.translate(-ax, -ay); paintMap(xx, K); xx.restore(); });
    }
  }

  function frameOf(cam, foot, phi) {
    const fa = S3.figureAt(cam, foot, phi); if (!fa) return null;
    const ch = [foot[0], foot[1] + .9, foot[2]], hd = Math.hypot(cam.pos[0] - ch[0], cam.pos[2] - ch[2]);
    fa.tilt = clamp(Math.sin(Math.atan2(cam.pos[1] - ch[1], hd)), 0, .8);
    fa.foot = foot; fa.phi = phi; fa.cam = cam;
    return fa;
  }
  const NEAR = 1.15;
  let FADE = null;
  function figure(x, cam, P, who, foot, phi, poseFn, o, Kk) {
    const fa = frameOf(cam, dn(foot), phi); if (!fa || fa.depth < .3) return null;
    const ch = dn([foot[0], foot[1] + .9, foot[2]]), dist = Math.hypot(ch[0] - cam.pos[0], ch[1] - cam.pos[1], ch[2] - cam.pos[2]);
    const alpha = Math.max(smooth((dist - NEAR + .2) / .35), smooth((.3 - Math.abs(Math.sin(fa.yaw))) / .15) * smooth((.78 - fa.tilt) / .2));
    if (alpha <= 0) return null;
    const pose = { ...poseFn(fa) }; pose.yaw = fa.yaw;
    const L = Q.look(who, P, Math.max(Kk, o.backlit || 0));
    let y = x;
    if (alpha < 1) { const cw = x.canvas.width, chh = x.canvas.height; if (!FADE || FADE[0].width !== cw || FADE[0].height !== chh) FADE = F.canvas(cw, chh); y = FADE[1]; clean(y); y.setTransform(x.getTransform()); }
    y.save(); y.translate(fa.sx, fa.sy); y.scale(fa.s, fa.s);
    const PJ = Q.draw(y, P, pose, L, { ...o, tilt: fa.tilt });
    y.restore();
    if (y !== x) { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha *= alpha; x.drawImage(FADE[0], 0, 0); x.restore(); }
    return { fa, pose, PJ };
  }
  function emperorPose() {
    const p = Q.kneel({ lean: .02, head: .04 });
    p.arms = [[.3, 1.42, -.78], [.3, 1.42, -.78]];
    p.breath = .3;
    return p;
  }
  function emperor(x, cam, P, t, Kk) {
    figure(x, cam, P, 'emperor', E, PI / 2, () => emperorPose(), { kneel: true, crown: true, beard: true, profile: true }, Kk);
  }

  const FT = M45 ? 1500 : 1700;
  const Z0 = MK * FLENS / D_SCR, ZE = M45 ? .62 : 1;
  const P = (lon, lat) => CH.proj(lon, lat);
  const LUO = [112.45, 34.62], DAL = [114.3, 34.8], LZ = [118.3, 36.8], HD = [114.5, 36.6], JI = [116.4, 39.9], CHEN = [114.9, 33.7], SC = [116.8, 32.6];
  const NY = [112.5, 33.0], WG = [110.9, 33.6], YING = [112.2, 30.4], HZ = [107.0, 33.1];
  const ROAD = pts => { const p = [...pts.map(q => P(q[0], q[1])), XY], acc = [0]; for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, acc, L: acc[acc.length - 1] }; };
  const along = (r, s) => {
    const d = r.L - clamp(s, 0, r.L); let i = 1; while (i < r.p.length - 1 && r.acc[i] < d) i++;
    const a = r.p[i - 1], b = r.p[i], u = (d - r.acc[i - 1]) / Math.max(1e-6, r.acc[i] - r.acc[i - 1]);
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  };
  const SITES = [
    { name: 'Langya', r: ROAD([[119.5, 35.6], LZ, DAL, LUO]) }, { name: 'Zhifu', r: ROAD([[121.4, 37.5], LZ, DAL, LUO]) },
    { name: 'Jieshi', r: ROAD([[119.6, 39.9], JI, HD, LUO]) }, { name: 'Kuaiji', r: ROAD([[120.6, 30.0], [120.6, 31.3], SC, CHEN, LUO]) },
    { name: 'Taishan', r: ROAD([[117.1, 36.25], DAL, LUO]) }, { name: 'Songshan', r: ROAD([[113.0, 34.5], LUO]) },
    { name: 'Huashan', r: ROAD([[110.1, 34.5]]) }, { name: 'Chengdu', r: ROAD([[104.1, 30.7], HZ]) },
    { name: 'Ying', r: ROAD([YING, NY, WG]) }, { name: 'Handan', r: ROAD([HD, LUO]) },
    { name: 'Shouchun', r: ROAD([SC, CHEN, LUO]) }, { name: 'Changsha', r: ROAD([[113.0, 28.2], YING, NY, WG]) },
  ];
  const FLOWS = [SITES[0].r, SITES[2].r, SITES[3].r, SITES[7].r, SITES[11].r, ROAD([[109.8, 40.6], [108.9, 36.6]]), ROAD([[104.6, 35.0]])];
  const ROADS = [...SITES.map(s => s.r), FLOWS[5], FLOWS[6]];
  const RING_V = 330, litAt = s => T_SEAL + .15 + s.r.L / RING_V * .92;
  const T_THR0 = T_BRING, T_THR1 = T_DEL - .05, thrAt = (s, t) => s.r.L * (1 - easeIO(clamp((t - T_THR0 - .04 * SITES.indexOf(s)) / (T_THR1 - T_THR0 - .5))));

  const KM = [
    [T_H2M0 - .6, MXC, MYC, Z0, 0], [T_H2M1, MXC + 4, MYC + 2, Z0 * .93, 0],
    [4.7, 232, 34, 2.15, .64], [5.7, 238, 30, 2.05, .66], [7.0, 214, 24, 2.2, .68],
    [7.75, XY[0] + 6, XY[1] + 8, 5.6, .52], [8.35, XY[0] + 2, XY[1] + 6, 5.2, .52],
    [9.7, 226, 24, 2.0, .62], [11.5, 240, 18, 1.95, .66], [13.3, 205, 20, 2.3, .6],
    [13.95, XY[0] + 10, XY[1] + 4, 4.0, .4], [T_IRIS0 + .3, XY[0], XY[1], 60, 0],
  ];
  const splM = (() => {
    const ts = KM.map(k => k[0]), mono = f => Mo.monotone(ts.map((t, i) => [t, f(KM[i])]));
    const fx = mono(k => k[1]), fy = mono(k => k[2]), fz = mono(k => Math.log(k[3])), fth = mono(k => k[4]);
    return t => ({ x: fx(t), y: fy(t) - TOPH(t), z: Math.exp(fz(t)) * (t > T_H2M1 + .4 ? ZE : lerp(1, ZE, ss(T_H2M1 - .2, T_H2M1 + .4, t))), th: Math.max(0, fth(t)) });
  })();
  const STAND = t => t < T_RI0 ? ss(T_H2M1 - .1, 4.9, t) * (1 - ss(13.9, T_IRIS0 + .2, t)) : ss(T_HO, 20.6, t);
  const LS = P(109.254, 34.381);
  const Z_HO = 7.5;
  const splM2 = (() => {
    let f = null;
    const make = () => {
      const K = [
        [T_RI0, XY[0], XY[1], Z_HO * 2.6, 0], [T_HO, XY[0], XY[1], Z_HO, 0],
        [20.55, 226, 23, 2.05, .58], [21.9, XY[0] + 36, XY[1] + 5, 2.55, .56],
        [23.1, LS[0] + 6, LS[1] + 3, 3.4, .54], [26.4, LS[0], LS[1] - 3, 4.4, .58],
      ];
      const ts = K.map(k => k[0]), mono = g => Mo.monotone(ts.map((t, i) => [t, g(K[i])]));
      return [mono(k => k[1]), mono(k => k[2]), mono(k => Math.log(k[3])), mono(k => k[4])];
    };
    return t => {
      f = f || make();
      const [fx, fy, fz, fth] = f;
      return { x: fx(t), y: fy(t) - TOPH(t), z: Math.exp(fz(t)) * lerp(1, ZE, ss(T_HO, 20.55, t)), th: Math.max(0, fth(t)) * (M45 ? .8 : 1) };
    };
  })();
  const camM = t => t < T_RI0 ? splM(t) : splM2(t);
  const TOPH = t => (24 + 64) * STAND(t);
  function leanPt(m, X, Y, t) {
    const dx = m.z * (X - m.x), dy = m.z * (Y - TOPH(t) - m.y);
    if (!(m.th > 0)) return [W / 2 + dx, H / 2 + dy, 1];
    const d = FT - dy * Math.sin(m.th), k = FT / d;
    return [W / 2 + dx * k, H / 2 + dy * FT * Math.cos(m.th) / d, k];
  }
  const V_IN = 95;
  const items = (r, n, seed, t, t0, t1) => {
    const out = [], R = F.rng(seed), a = ss(t0 - .35, t0 + .15, t) * (1 - ss(t1, t1 + .6, t));
    if (a <= 0) return out;
    for (let i = 0; i < n; i++) {
      const s0 = (i + R() * .6) / n * (r.L + 60) + 30, s = s0 - V_IN * (t - t0 + .35);
      const sm = ((s % (r.L + 60)) + (r.L + 60)) % (r.L + 60);
      if (sm < 6 || sm > r.L) continue;
      out.push({ s: sm, at: along(r, sm), k: R(), a: a * ss(0, 24, sm) * (1 - ss(r.L - 30, r.L, sm)) });
    }
    return out;
  };
  const T_COIN0 = T_RES - .3, T_COIN1 = T_SEAL - .3, T_MEN0 = T_MAN - .3, T_MEN1 = T_SEAL + .6;
  function mapTop(x, t, PL) {
    const rr = (t - T_SEAL) * RING_V, lw = 2.2 / x.getTransform().a;
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = `rgba(120,80,20,${.55 * ss(T_H2M1, T_H2M1 + .7, t)})`; x.lineWidth = Math.max(1.2, 1.6 * lw);
    for (const r of ROADS) { x.beginPath(); r.p.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); }
    if (rr > 0) {
      x.save(); x.beginPath(); x.arc(XY[0], XY[1], rr, 0, TAU); x.clip();
      x.strokeStyle = `rgba(190,40,30,${.85 * (1 - ss(T_ORD + 1.2, T_BRING, t))})`; x.lineWidth = Math.max(2, 2.6 * lw);
      for (const r of ROADS) { x.beginPath(); r.p.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); }
      x.restore();
    }
    for (let f = 0; f < FLOWS.length; f++) for (const it of items(FLOWS[f], 22, 100 + f, t, T_COIN0, T_COIN1)) {
      const [X, Y] = it.at, sz = 5.4;
      x.globalAlpha = it.a;
      if (it.k < .7) { x.fillStyle = '#b9832a'; x.beginPath(); x.arc(X, Y + 1, sz, 0, TAU); x.fill(); x.fillStyle = '#f0c766'; x.beginPath(); x.arc(X, Y, sz, 0, TAU); x.fill(); x.fillStyle = '#8a5a18'; x.fillRect(X - 1.2, Y - 1.2, 2.4, 2.4); }
      else { x.fillStyle = '#7a4a22'; x.fillRect(X - 5, Y - 1.5, 10, 4); x.fillStyle = '#c98a4a'; x.fillRect(X - 5, Y - 3, 10, 3); }
    }
    x.globalAlpha = 1;
    if (t >= T_SEAL) {
      const h = 15; x.globalAlpha = 1 - ss(T_THR1 - .7, T_THR1 - .1, t); x.fillStyle = '#b3261c'; x.fillRect(XY[0] - h, XY[1] - h, 2 * h, 2 * h);
      x.strokeStyle = '#f3e3c0'; x.lineWidth = 1.6; x.strokeRect(XY[0] - h + 3, XY[1] - h + 3, 2 * h - 6, 2 * h - 6);
      x.beginPath(); for (let i = 1; i < 4; i++) { x.moveTo(XY[0] - h + 6, XY[1] - h + i * 7.5); x.lineTo(XY[0] + h - 6, XY[1] - h + i * 7.5); } x.moveTo(XY[0], XY[1] - h + 5); x.lineTo(XY[0], XY[1] + h - 5); x.stroke();
      x.globalAlpha = 1;
      if (rr > 0 && rr < 900) {
        x.save(); x.beginPath(); CH.path(x, CH.CHINA); x.clip();
        const a = (1 - ss(500, 900, rr)) * .75;
        for (const [dw, aa] of [[26, .18], [12, .35], [4, 1]]) { x.strokeStyle = `rgba(200,40,30,${a * aa})`; x.lineWidth = dw; x.beginPath(); x.arc(XY[0], XY[1], rr, 0, TAU); x.stroke(); }
        x.restore();
      }
    } else { x.fillStyle = '#9a2a20'; x.beginPath(); x.arc(XY[0], XY[1], 6, 0, TAU); x.fill(); }
    if (t >= T_RI0) { poisonTop(x, t); return; }
    if (t > T_THR0) for (const s of SITES) {
      const head = thrAt(s, t), pts = [];
      for (let d = s.r.L; d >= head - 1e-6; d -= 6) pts.push(along(s.r, Math.max(head, d)));
      pts.push(along(s.r, head));
      if (pts.length < 2) continue;
      for (const [dw, col] of [[12, 'rgba(255,236,170,.18)'], [5, 'rgba(255,244,210,.55)'], [1.8, 'rgba(255,255,245,.95)']]) {
        x.strokeStyle = col; x.lineWidth = dw; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke();
      }
    }
  }
  function mapFlat(ctx, t, L, m) {
    const S = STAND(t), hC = 24 * S, hQ = 64 * S, N = 12;
    L.sheet(ctx, { x: m.x, y: m.y, z: m.z }, 1, [0, 0], x => {
      const path = rings => { x.beginPath(); CH.path(x, rings); };
      x.fillStyle = F.tone(L.P.sheet2, L.P.sheet, .16); path(CH.LAND); x.fill();
      for (let i = 0; i <= N; i++) {
        x.save(); x.translate(0, -hC * i / N); x.fillStyle = i < N ? F.tone(L.P.sheet, L.P.ink, .5 - .2 * i / N) : L.P.sheet; path(CH.CHINA); x.fill(); x.restore();
        if (hC < .5 && i === 0) i = N - 1;
      }
      x.save(); x.translate(0, -hC); x.strokeStyle = F.tone(L.P.sheet, L.P.ink, .45); x.lineWidth = 2 / x.getTransform().a; path(CH.CHINA); x.stroke(); x.restore();
      for (let i = 0; i <= N; i++) {
        x.save(); x.translate(0, -hC - hQ * i / N); path(CH.CHINA); x.clip(); path(CH.QIN221); x.fillStyle = i < N ? F.tone('#d9a443', '#3a2408', .45 - .25 * i / N) : '#d9a443'; x.fill(); x.restore();
        if (hQ < .5) { if (i === 0) i = N - 1; }
      }
      x.save(); x.translate(0, -hC - hQ); mapTop(x, t, L.P); x.restore();
    }, { flatShadow: [10, 14, 12, .4] });
  }
  function standee(x, sx, sy, h, col, robe) {
    x.fillStyle = robe || col; x.beginPath(); x.moveTo(sx - .17 * h, sy - .72 * h); x.lineTo(sx + .17 * h, sy - .72 * h); x.lineTo(sx + .26 * h, sy); x.lineTo(sx - .26 * h, sy); x.closePath(); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(sx, sy - .84 * h, .13 * h, 0, TAU); x.fill();
  }
  function seal(x, sx, sy, s, PL) {
    const w2 = 34 * s, h2 = 30 * s, dp = 10 * s;
    x.fillStyle = '#8fa48a'; x.beginPath(); x.moveTo(sx - w2, sy - h2); x.lineTo(sx - w2 + dp, sy - h2 - dp); x.lineTo(sx + w2 + dp, sy - h2 - dp); x.lineTo(sx + w2, sy - h2); x.closePath(); x.fill();
    x.fillStyle = '#9fb59a'; x.beginPath(); x.moveTo(sx + w2, sy); x.lineTo(sx + w2 + dp, sy - dp); x.lineTo(sx + w2 + dp, sy - h2 - dp); x.lineTo(sx + w2, sy - h2); x.closePath(); x.fill();
    x.fillStyle = '#cfdcc4'; x.fillRect(sx - w2, sy - h2, 2 * w2, h2);
    x.fillStyle = '#b3261c'; x.fillRect(sx - w2, sy - 3 * s, 2 * w2, 3 * s);
    x.fillStyle = '#b9c9b0'; x.beginPath();
    x.moveTo(sx - 22 * s, sy - h2 - dp * .5); x.quadraticCurveTo(sx - 20 * s, sy - h2 - 22 * s, sx - 4 * s, sy - h2 - 20 * s);
    x.quadraticCurveTo(sx + 10 * s, sy - h2 - 19 * s, sx + 16 * s, sy - h2 - 26 * s); x.lineTo(sx + 19 * s, sy - h2 - 31 * s); x.lineTo(sx + 21 * s, sy - h2 - 25 * s);
    x.quadraticCurveTo(sx + 28 * s, sy - h2 - 22 * s, sx + 26 * s, sy - h2 - 12 * s); x.lineTo(sx + 24 * s, sy - h2 - dp * .5); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(60,80,60,.5)'; x.lineWidth = 1; x.strokeRect(sx - w2, sy - h2, 2 * w2, h2);
  }
  function furnace(x, sx, sy, s, lit, t, seed) {
    x.fillStyle = '#7a3b26'; x.beginPath(); x.moveTo(sx - 13 * s, sy); x.lineTo(sx - 11 * s, sy - 16 * s); x.quadraticCurveTo(sx, sy - 24 * s, sx + 11 * s, sy - 16 * s); x.lineTo(sx + 13 * s, sy); x.closePath(); x.fill();
    x.fillRect(sx + 2 * s, sy - 30 * s, 5 * s, 10 * s);
    x.fillStyle = lit > 0 ? `rgb(${Math.round(lerp(40, 255, lit))},${Math.round(lerp(25, 150, lit))},${Math.round(lerp(20, 50, lit))})` : '#281812';
    x.beginPath(); x.moveTo(sx - 5 * s, sy); x.lineTo(sx - 5 * s, sy - 7 * s); x.arc(sx, sy - 7 * s, 5 * s, PI, 0); x.lineTo(sx + 5 * s, sy); x.closePath(); x.fill();
    if (lit > 0) for (let i = 0; i < 4; i++) {
      const u = ((t * .5 + i / 4 + seed * .13) % 1), r = (3 + 6 * u) * s;
      x.fillStyle = `rgba(110,100,95,${.45 * (1 - u) * lit})`; x.beginPath(); x.arc(sx + 4.5 * s + 4 * s * Math.sin(u * 4 + seed), sy - 32 * s - u * 26 * s, r, 0, TAU); x.fill();
    }
  }
  function mapUpright(ctx, t, m) {
    const list = [];
    for (let f = 0; f < FLOWS.length; f++) for (const it of items(FLOWS[f], 46, 200 + f, t, T_MEN0, T_MEN1)) {
      const [sx, sy, k] = leanPt(m, it.at[0], it.at[1], t); list.push({ y: sy, draw: x => { x.globalAlpha = it.a; standee(x, sx, sy, (15 + 4 * it.k) * k * m.z / 2.1, '#2a2a33', it.k < .25 ? '#6b4f3a' : '#3d4150'); x.globalAlpha = 1; } });
    }
    for (const s of SITES) {
      const a = ss(litAt(s) - .25, litAt(s), t); if (a <= 0 || t > T_IRIS0) continue;
      const end = along(s.r, s.r.L), [sx, sy, k] = leanPt(m, end[0], end[1], t), sc = k * m.z / 2.1 * 1.6 * (.4 + .6 * a), lit = ss(litAt(s), litAt(s) + .3, t);
      list.push({ y: sy, draw: x => { furnace(x, sx, sy, sc, lit, t, SITES.indexOf(s)); standee(x, sx - 20 * sc, sy + 2 * sc, 22 * sc, '#2a2a33', '#5a4a72'); } });
    }
    list.sort((a, b) => a.y - b.y);
    FL.sheet(ctx, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => { list.forEach(o => o.draw(x)); }, { flatShadow: [4, 6, 5, .45] });
    const T0 = T_SEAL - .45, T1 = T_SEAL + .55;
    if (t > T0 && t < T1 + .7) {
      const [sx, sy, k] = leanPt(m, XY[0], XY[1], t), s = k * m.z / 2.1 * 1.25;
      const down = t < T_SEAL ? -H * .7 * Math.pow(1 - (t - T0) / (T_SEAL - T0), 2) : t < T1 ? 0 : -H * .8 * Math.pow((t - T1) / .7, 2);
      const sq = t >= T_SEAL && t < T_SEAL + .3 ? 1 + .1 * Math.exp(-(t - T_SEAL) * 12) * Math.cos((t - T_SEAL) * 40) : 1;
      FL.sheet(ctx, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => { x.save(); x.translate(sx, sy + down); x.scale(1 / sq, sq); seal(x, 0, 0, s); x.restore(); }, { flatShadow: [8, 12, 10, .5] });
    }
    if (t > T_THR0 && t < T_RI0) {
      for (const s of SITES) { const q = along(s.r, thrAt(s, t)), [sx, sy, k] = leanPt(m, q[0], q[1], t); if (thrAt(s, t) > 2) PR.glow(ctx, sx, sy, 16 * k * m.z / 2, '#fff1c8', .9, 'flat'); }
      const g = ss(T_THR1 - .6, T_THR1 + .1, t), [cx, cy, k] = leanPt(m, XY[0], XY[1], t);
      if (g > 0) { PR.glow(ctx, cx, cy, (30 + 50 * g) * Math.min(3, k * m.z / 2), '#fff4d6', g, 'flat'); PR.glow(ctx, cx, cy, (8 + 10 * g) * Math.min(3, k * m.z / 2), '#ffffff', g, 'flat'); }
    }
  }
  function mapFrame(ctx, t) {
    const m = camM(t);
    FL.background(ctx);
    F.tilt(ctx, FL, m.th, FT, (x, L) => mapFlat(x, t, L, m));
    mapUpright(ctx, t, m);
    return m;
  }

  function beads(t) {
    const out = [], g = ss(T_MERC - .7, T_MERC + .1, t);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + .5 * Math.sin(t * .9 + i), r0 = .45 + .1 * Math.sin(i * 2.1), roll = (t - T_KEY) * (.5 + .1 * i);
      const u = r0 * Math.cos(a + roll), v = r0 * Math.sin(a + roll), tu = .12 * Math.sin(t * 1.4), tv = .1 * Math.cos(t * 1.1);
      out.push([lerp(u, tu, g), lerp(v, tv, g), lerp(.35 + .12 * (i % 3), i ? .2 : 1.05, g) * ss(T_IRIS1 + .3 + i * .15, T_IRIS1 + .7 + i * .15, t)]);
    }
    return out.filter(b => b[2] > .02);
  }
  const cupScale = cam => { const P = cam.proj(CUP0); return P ? P[3] * .01 : 1; };
  const cupElev = cam => Math.max(.08, Math.atan2(cam.pos[1] - CUP0[1], Math.hypot(cam.pos[0] - CUP0[0], cam.pos[2] - CUP0[2])));
  let NOCUP = false;
  function cup3d(x, cam, t, Kk) {
    const P = cam.proj(CUP0); if (!P || NOCUP) return;
    x.save(); x.translate(P[0], P[1]);
    Q.cup(x, { s: P[3] * .01, elev: cupElev(cam), fill: .55, beads: beads(t), k: Kk, liquid: '#4a2a1a' });
    x.restore();
  }
  function tray(x, cam, K) {
    const c = [CUP0[0], CUP0[1], CUP0[2]], r = .15, top = [], bot = [];
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; top.push(dn([c[0] + r * Math.cos(a), c[1] + .02, c[2] + r * Math.sin(a)])); bot.push(dn([c[0] + r * .93 * Math.cos(a), c[1], c[2] + r * .93 * Math.sin(a)])); }
    const hull = [...top, ...bot].map(p => cam.proj(p)).filter(Boolean);
    if (hull.length > 3) { x.fillStyle = K.lacquer; x.beginPath(); Q.convex(hull).forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); }
    const fl = top.map(p => [c[0] + (p[0] - c[0]) * .84, p[1] - .006, c[2] + (p[2] - c[2]) * .84]);
    if (S3.poly(x, cam, fl)) { x.fillStyle = K.lacquerRed; x.fill(); x.strokeStyle = K.gold; x.lineWidth = 1.2; x.stroke(); }
  }

  const CUPTOP = [CUP0[0], CUP0[1] + .07, CUP0[2]];
  const KC = [
    [T_IRIS0 - .4, [CUP0[0], CUP0[1] + .8, CUP0[2] + .11], CUPTOP],
    [T_IRIS1, [CUP0[0], CUP0[1] + .62, CUP0[2] + .09], CUPTOP],
    [17.3, [CUP0[0] + .01, CUP0[1] + .52, CUP0[2] + .08], CUPTOP],
    [18.45, [CUP0[0] + .03, CUP0[1] + .5, CUP0[2] + .08], CUPTOP],
    [T_HO, [CUP0[0] + .03, CUP0[1] + 1.05, CUP0[2] + .08], CUPTOP],
  ];
  const splC = spline(KC);
  function camCup(t) {
    if (window.__cam4) return S3.camera({ ...window.__cam4, f: FLENS, W, H });
    const { eye, tgt } = splC(Math.min(t, T_HO)); return camOf(eye, tgt);
  }

  let CUP_HO = 0;
  const cupMap = t => { CUP_HO = CUP_HO || cupScale(camCup(T_HO)) / Z_HO; return Math.exp(lerp(Math.log(CUP_HO), Math.log(4.6), ss(T_HO, 20.55, t))); };
  const doseK = t => DOSES.reduce((s, d) => s + ss(d, d + .75, t), 0) / DOSES.length;
  const drain = t => 1 - ss(T_INTO - .1, T_GRAVE + .15, t);
  const sinkK = t => ss(T_INTO - .05, T_GRAVE - .05, t);
  const vein = (r, s) => { const out = []; for (let d = 0; d < s; d += 6) out.push(along(r, d)); if (s > 0) out.push(along(r, s)); return out; };
  const strokePts = (x, pts) => { x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); };
  function poisonTop(x, t) {
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.save(); x.beginPath(); CH.path(x, CH.CHINA); x.clip();
    for (const d of DOSES) {
      const u = (t - d) / 1.3; if (u <= 0 || u >= 1) continue;
      const rr = 10 + 160 * (1 - (1 - u) * (1 - u)), a = (1 - u) * .85;
      for (const [dw, aa] of [[18, .16], [7, .4], [2.4, 1]]) { x.strokeStyle = `rgba(228,234,246,${a * aa})`; x.lineWidth = dw; x.beginPath(); x.arc(XY[0], XY[1], rr, 0, TAU); x.stroke(); }
    }
    x.restore();
    const reach = doseK(t); if (reach <= 0) return;
    x.save(); x.beginPath(); CH.path(x, CH.QIN221); x.clip();
    x.globalCompositeOperation = 'saturation';
    x.strokeStyle = 'rgba(128,128,128,.8)'; x.lineWidth = 16 + 50 * reach;
    for (const r of ROADS) { const pts = vein(r, r.L * reach); if (pts.length > 1) strokePts(x, pts); }
    const all = .85 * ss(DOSES[2] - .1, DOSES[2] + .9, t);
    if (all > 0) { x.fillStyle = `rgba(128,128,128,${all})`; x.fillRect(-4000, -4000, 8000, 8000); }
    x.globalCompositeOperation = 'source-over';
    x.restore();
    const f = reach * drain(t);
    for (const r of ROADS) {
      const pts = vein(r, r.L * f); if (pts.length < 2) continue;
      for (const [dw, col] of [[11, 'rgba(220,228,245,.2)'], [4.4, 'rgba(232,238,250,.7)'], [1.7, 'rgba(255,255,255,.95)']]) { x.strokeStyle = col; x.lineWidth = dw; strokePts(x, pts); }
    }
  }
  function cupPlace(t, m) {
    const cam = camCup(t), P = cam.proj(CUP0), sH = P[3] * .01, eH = cupElev(cam);
    const [sx, sy, k] = leanPt(m, XY[0], XY[1], t), sM = cupMap(t) * m.z * k, eM = Math.max(.42, PI / 2 - .06 - 1.8 * m.th);
    const b = ss(T_HO, T_HO + .45, t);
    return { x: lerp(P[0], sx, b), y: lerp(P[1], sy, b), s: Math.exp(lerp(Math.log(sH), Math.log(sM), b)), elev: lerp(eH, eM, b), b };
  }
  const cupFill = t => .55 - .14 * DOSES.reduce((s, d) => s + ss(d - .1, d + .3, t), 0);
  function cupOnMap(x, t, m) {
    const c = cupPlace(t, m), sk = sinkK(t); if (sk >= 1) return;
    const H0 = 9 * c.s;
    x.save(); x.translate(c.x, c.y);
    if (sk > 0) { x.beginPath(); x.rect(-30 * c.s, -60 * c.s, 60 * c.s, 60 * c.s); x.clip(); x.translate(0, sk * H0 * 1.1); }
    if (c.b > 0) x.filter = `drop-shadow(0px 0px 1.6px rgba(36,20,8,${c.b})) drop-shadow(0px 0px 1.6px rgba(36,20,8,${c.b}))`;
    const o = Q.cup(x, { s: c.s, elev: c.elev, fill: cupFill(t), beads: beads(t), k: .32 * c.b, liquid: '#4a2a1a' });
    x.filter = 'none';
    for (const d of DOSES) {
      const u = (t - d + .3) / .5; if (u <= 0 || u >= 1) continue;
      const ry = o.R * Math.max(.1, Math.sin(c.elev)), y = lerp(o.rimY + ry * .92, -.3 * c.s, u * u), r = .75 * c.s * (1 - .3 * u);
      const g = x.createRadialGradient(o.R * .1 - r * .35, y - r * .4, 0, o.R * .1, y, r * 1.1);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.4, '#dfe4ea'); g.addColorStop(1, '#6d737c');
      x.fillStyle = g; x.beginPath(); x.ellipse(o.R * .1, y, r, r * 1.25, 0, 0, TAU); x.fill();
    }
    x.restore();
  }
  const MOUND_A = Math.max(34, Math.max(Math.abs(XY[0] - LS[0]), Math.abs(XY[1] - LS[1])) + 12), TIERS_M = 4;
  const moundH = t => { const g = ss(T_INTO - .05, T_GRAVE + .02, t), d = t - T_GRAVE - .02; return 8.5 * g * (d > 0 ? 1 + .06 * Math.exp(-d * 9) * Math.cos(d * 32) : 1); };
  function leanBox(m, t, X, Y, a, y0, y1) {
    const up = (q, y) => { const [sx, sy, k] = leanPt(m, q[0], q[1], t); return [sx, sy - y * k * m.z]; };
    const B = [[X - a, Y - a], [X + a, Y - a], [X + a, Y + a], [X - a, Y + a]];
    return { lo: B.map(q => up(q, y0)), hi: B.map(q => up(q, y1)) };
  }
  const quad = (x, p, col) => { x.fillStyle = col; x.beginPath(); p.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
  const moundTiers = (m, t) => { const h = moundH(t), out = []; for (let i = 0; i < TIERS_M; i++) out.push(leanBox(m, t, LS[0], LS[1], MOUND_A * (1 - .2 * i), h * i, h * (i + 1))); return out; };
  function moundOnMap(x, t, m) {
    if (moundH(t) <= .05) return;
    const nk = clamp(NIGHT(t) / .76, 0, 1), c = (d, n) => S3.mix(d, n, nk);
    const gl = ss(T_INTO + .1, T_GRAVE + .5, t) * (.85 + .15 * Math.sin(t * 5));
    for (const { lo, hi } of moundTiers(m, t)) {
      quad(x, [lo[0], lo[3], hi[3], hi[0]], c('#6b5236', '#24223a')); quad(x, [lo[1], lo[2], hi[2], hi[1]], c('#6b5236', '#24223a'));
      quad(x, [lo[3], lo[2], hi[2], hi[3]], c('#82663f', '#302d4c')); quad(x, hi, c('#a98c5c', '#56557e'));
      if (gl > 0) {
        x.save(); x.lineJoin = 'round'; x.shadowColor = `rgba(196,212,255,${.9 * gl})`; x.shadowBlur = 22;
        x.strokeStyle = `rgba(236,242,255,${.85 * gl})`; x.lineWidth = 2.2; x.beginPath(); hi.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.stroke();
        x.restore();
      }
    }
    const d = t - T_GRAVE; if (d > -.1 && d < 1.4) {
      const [cx, cy, k] = leanPt(m, LS[0], LS[1] + MOUND_A, t), R = F.rng(9), u = clamp((d + .1) / 1.5, 0, 1);
      for (let i = 0; i < 14; i++) {
        const a = PI + R() * PI, rr = (MOUND_A * 1.1 + 26 * u * (.6 + R() * .6)) * k * m.z, sz = (5 + 9 * u) * k * m.z * (.6 + R() * .6);
        x.fillStyle = `rgba(${Math.round(lerp(150, 70, nk))},${Math.round(lerp(128, 72, nk))},${Math.round(lerp(96, 110, nk))},${.4 * (1 - u)})`; x.beginPath(); x.arc(cx + Math.cos(a) * rr, cy - MOUND_A * k * m.z * .4 + Math.sin(a) * rr * .35 - 4 * u * k * m.z, sz, 0, TAU); x.fill();
      }
    }
  }
  const NIGHT = t => .2 * ss(DOSES[0], DOSES[0] + .5, t) + .17 * ss(DOSES[1], DOSES[1] + .5, t) + .17 * ss(DOSES[2], DOSES[2] + .5, t) + .22 * ss(T_INTO, T_GRAVE + .3, t);
  function night(ctx, t) {
    const a = NIGHT(t); if (a <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(52,58,130,${a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(8,10,32,${a * .5})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function veinGlow(ctx, t, m) {
    const sx0 = F.SHIFT ? F.SHIFT.x : 0, sy0 = F.SHIFT ? F.SHIFT.y : 0, nk = NIGHT(t) / .76, f = doseK(t) * drain(t); if (f <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of ROADS) {
      const pts = vein(r, r.L * f).map(q => { const p = leanPt(m, q[0], q[1], t); return [p[0] - sx0, p[1] - sy0]; }); if (pts.length < 2) continue;
      for (const [dw, a] of [[9, .1], [3, .3]]) { ctx.strokeStyle = `rgba(200,212,255,${a * (.35 + .65 * nk)})`; ctx.lineWidth = dw * Math.min(1.6, m.z / 2.2); strokePts(ctx, pts); }
    }
    ctx.restore();
  }
  function poisonGlow(ctx, t, m) {
    const sx0 = F.SHIFT ? F.SHIFT.x : 0, sy0 = F.SHIFT ? F.SHIFT.y : 0, nk = NIGHT(t) / .76, reach = doseK(t), f = reach * drain(t);
    const S = (X, Y) => { const q = leanPt(m, X, Y, t); return [q[0] - sx0, q[1] - sy0, q[2]]; };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tiers = moundH(t) > .05 ? moundTiers(m, t) : [], gl = ss(T_INTO + .1, T_GRAVE + .5, t);
    ctx.restore();
    const k = m.z / 2.2;
    const seen = new Set();
    if (f > 0) for (const r of ROADS) {
      const s = r.L * f; if (s < 8 || s > r.L - 1 || reach >= .999) continue;
      const q = along(r, s), key = Math.round(q[0] / 6) + ',' + Math.round(q[1] / 6); if (seen.has(key)) continue; seen.add(key);
      const p = S(q[0], q[1]); PR.glow(ctx, p[0], p[1], 11 * p[2] * k, '#eef2ff', .7, 'flat');
    }
    const c = cupPlace(t, m), sk = sinkK(t);
    if (sk < 1) PR.glow(ctx, c.x - sx0, c.y - 6 * c.s - sy0 + sk * 9 * c.s, 8 * c.s, '#dfe6ff', .55 * nk * (1 - sk), 'flat');
    if (gl > 0 && tiers.length) { const q = tiers[TIERS_M - 1].hi, cx = (q[0][0] + q[2][0]) / 2 - sx0, cy = (q[0][1] + q[2][1]) / 2 - sy0; PR.glow(ctx, cx, cy, 38 * k, '#cfd9ff', .35 * gl, 'flat'); }
  }

  function hallFrame(ctx, t, L, Kk, cam) {
    const K = Kk > .5 ? COL.lightbox : COL.paper, P = L.P, id = { x: W / 2, y: H / 2, z: 1 }, R = [W / 2, H / 2];
    SINKY = 0;
    L.background(ctx);
    const world = [], top = [];
    for (const p of PILLARS) world.push({ d: cam.depth(dn([p[0], 3, p[1]])), draw: x => pillar(x, cam, K, p) });
    world.push({ d: cam.depth(dn([0, 2.5, SCR.z])), draw: x => screen(x, cam, K) });
    top.push({ d: cam.depth([0, .5, -1.5]) + 3, draw: x => dais(x, cam, K) });
    top.push({ d: cam.depth([0, 1.1, -1.0]) + .6, draw: x => throne(x, cam, K) });
    const dE = cam.depth([E[0], 1.9, E[2]]), dT = cam.depth([0, 1.2, -.2]);
    top.push({ d: dE, draw: x => emperor(x, cam, P, t, Kk) });
    top.push({ d: dT, draw: x => table(x, cam, K) });
    if (t > T_IRIS0 - .2) { top.push({ d: dT - .02, draw: x => tray(x, cam, K) }); top.push({ d: Math.min(dE, dT, cam.depth(CUP0)) - .05, draw: x => cup3d(x, cam, t, Kk) }); }
    L.sheet(ctx, id, 1, R, x => {
      wall(x, cam, K); floor(x, cam, K);
      [...world, ...top].sort((a, b) => b.d - a.d).forEach(o => o.draw(x));
    }, { glow: .5 });
  }
  function words(ctx, t, L) {
    if (t < T_MERC - .05 || t > T_MERC + 2.3) return;
    F.impact(L, ctx, t, { lines: [{ text: 'MERCURY', t0: T_MERC, size: M45 ? 118 : 150, color: '#f3ebda' }], x: .5, y: .2, out: T_MERC + 1.85, accent: '#c9ced6' });
  }

  let BUF = null;
  const buf = () => BUF || (BUF = [F.canvas(W, H), F.canvas(W, H)]);
  const clean = x => { if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); } };
  function blend(ctx, t, A, Bf, b, LA, LB2) {
    const [[ca, xa], [cb, xb]] = buf(); clean(xa); clean(xb);
    A(xa); LA.grade(xa, t); Bf(xb); LB2.grade(xb, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ca, 0, 0); ctx.globalAlpha = b; ctx.drawImage(cb, 0, 0); ctx.restore();
  }
  function iris(ctx, t) {
    const u = ss(T_IRIS0, T_IRIS1, t), r = lerp(24, Math.hypot(W, H) / 2 + 80, u * u);
    mapFrame(ctx, t);
    const [cb, xb] = buf()[1]; clean(xb); hallFrame(xb, t, PA, 0, camCup(t));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.clip(); ctx.drawImage(cb, 0, 0); ctx.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = `rgba(255,246,220,${.85 * (1 - u)})`; ctx.lineWidth = 3 + 10 * (1 - u); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); ctx.restore();
    (u < .5 ? FL : PA).grade(ctx, t);
  }
  function irisBack(ctx, t) {
    const cam = camCup(t), u = clamp((t - T_RI0) / (T_HO - T_RI0), 0, 1), k = 1 - (1 - u) * (1 - u);
    const r = lerp(Math.hypot(W, H) / 2 + 80, 6.2 * cupScale(cam) * .9, k);
    const m = mapFrame(ctx, t);
    const [cb, xb] = buf()[1]; clean(xb); NOCUP = true; hallFrame(xb, t, PA, 0, cam); NOCUP = false;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.clip(); ctx.drawImage(cb, 0, 0); ctx.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = `rgba(255,246,220,${.7 * (1 - ss(.75, 1, u))})`; ctx.lineWidth = 3 + 8 * u; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); ctx.restore();
    cupSheets(ctx, t, m);
    words(ctx, t, PA);
    (u < .5 ? PA : FL).grade(ctx, t);
  }
  function cupSheets(ctx, t, m) {
    const c = ss(T_HO - .25, T_HO + .1, t), id = { x: W / 2, y: H / 2, z: 1 }, R = [W / 2, H / 2];
    if (c < 1) PA.sheet(ctx, id, 1, R, x => cupOnMap(x, t, m), { alpha: 1 - c, glow: .5 });
    if (c > 0) FL.sheet(ctx, id, 1, R, x => cupOnMap(x, t, m), { alpha: c, flatShadow: [8, 12, 10, .45] });
  }
  function poisonFrame(ctx, t) {
    const m = mapFrame(ctx, t);
    cupSheets(ctx, t, m);
    night(ctx, t);
    veinGlow(ctx, t, m);
    FL.sheet(ctx, { x: W / 2, y: H / 2, z: 1 }, 1, [W / 2, H / 2], x => moundOnMap(x, t, m), { flatShadow: [8, 12, 10, .5] });
    poisonGlow(ctx, t, m);
    words(ctx, t, PA);
    FL.grade(ctx, t);
  }
  function draw(ctx, t) {
    if (t < T_H2M0) { hallFrame(ctx, t, PA, 0, camHall(t)); PA.grade(ctx, t); return; }
    if (t < T_H2M1) { blend(ctx, t, x => hallFrame(x, t, PA, 0, camHall(t)), x => mapFrame(x, t), ss(T_H2M0, T_H2M1, t), PA, FL); return; }
    if (t < T_IRIS0) { mapFrame(ctx, t); FL.grade(ctx, t); return; }
    if (t < T_IRIS1) { iris(ctx, t); return; }
    if (t < T_RI0) { hallFrame(ctx, t, PA, 0, camCup(t)); words(ctx, t, PA); PA.grade(ctx, t); return; }
    if (t < T_HO) { irisBack(ctx, t); return; }
    poisonFrame(ctx, t);
  }

  F.scene('seq-04', {
    W, H, duration: DUR, draw, label: C.label, ready: F.fonts('NSC'), grain: 'none',
    from: { id: 'seq-03', dur: .9, dir: 'right' },
    sfx: [
      { t: T_ELSE + .2, type: 'shimmer', dur: 1.2, g: .1 },
      { t: T_H2M0, type: 'swoosh', dur: .8, g: .22 },
      ...[0, .3, .55, .85, 1.1].map((d, i) => ({ t: T_RES - .2 + d, type: 'clink', f: 2400 + 300 * i, g: .1 })),
      { t: T_RES - .25, type: 'lib', dur: 1.6, label: 'COINS POURING AND CHINKING, many, soft' },
      { t: T_MAN - .15, type: 'lib', dur: 1.5, label: "A CROWD'S FEET ON EARTH, many, marching" },
      { t: T_SEAL - .02, type: 'impact', size: .55, g: .5 },
      { t: T_SEAL + .05, type: 'whoosh', f0: 160, f1: 60, dur: 1.4, g: .2 },
      ...[0, 3, 6, 9].map(i => ({ t: litAt(SITES[i]), type: 'hiss', dur: .4, g: .07 })),
      { t: T_THR0, type: 'shimmer', dur: 2.2, g: .14 },
      { t: T_IRIS0 - .1, type: 'swoosh', dur: .7, g: .22 },
      { t: T_IRIS0 + .35, type: 'clink', f: 3400, g: .16 },
      { t: T_MERC, type: 'impact', size: .5, g: .45, noSnap: true },
      { t: T_RI0, type: 'swoosh', dur: .8, g: .2 },
      { t: T_EVERY + .1, type: 'shimmer', dur: 1.2, g: .1 },
      ...DOSES.map((d, i) => ({ t: d - .25, type: 'clink', f: 3600 - 300 * i, g: .12 })),
      ...DOSES.map((d, i) => ({ t: d, type: 'heartbeat', g: .32 + .06 * i })),
      ...DOSES.map((d, i) => ({ t: d + .02, type: 'whoosh', f0: 900, f1: 300, dur: .9, g: .07 + .02 * i })),
      { t: T_INTO - .1, type: 'rumble', dur: 1.7, g: .25 },
      { t: T_INTO - .1, type: 'lib', dur: 1.7, label: 'EARTH MOVING, a deep low rumble' },
      { t: T_GRAVE - .55, type: 'riser', dur: .55, g: .22 },
      { t: T_GRAVE + .02, type: 'impact', size: .6, g: .45 },
    ],
    api: { DUR },
  });
})();
