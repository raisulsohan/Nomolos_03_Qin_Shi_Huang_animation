(function () {
  'use strict';
  const F = FILM, { clamp, smooth, lerp, easeIO, TAU } = F;
  const { W, H, portrait: M45 } = F.format();
  const C = F.cues('seq-43'), DUR = C.duration;
  const FL = F.look('flat', W, H);
  const ss = (a, b, t) => smooth((t - a) / (b - a));
  const T_NEXT = 0.41;
  const BR = { ground: '#17302E', cream: '#EEE3CB', gold: '#C99147' };
  const A42 = () => F.getScene('seq-42').api;

  const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  let WM = null, CR = null;
  const ready = Promise.all([F.fonts('NSC'), img(window.NOMOLOS_WORDMARK).then(i => (WM = i)), img(window.NOMOLOS_CROWN).then(i => (CR = i))]);

  let BG = null;
  const ground = () => {
    if (BG) return BG;
    const [c, x] = F.canvas(W, H);
    x.fillStyle = BR.ground; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W / 2, H * .46, 0, W / 2, H / 2, Math.hypot(W, H) * .6);
    g.addColorStop(0, 'rgba(60,110,100,.16)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,10,8,.42)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const id = x.getImageData(0, 0, W, H), r = F.rng(17);
    for (let i = 0; i < id.data.length; i += 4) { const n = (r() - .5) * 5; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
    x.putImageData(id, 0, 0);
    return (BG = c);
  };

  const MAP = new Map();
  const mapAt = t => {
    const key = W + 'x' + H; if (!MAP.has(key)) MAP.set(key, F.canvas(W, H));
    const [c, x] = MAP.get(key), sv = F.SHIFT; F.SHIFT = null;
    if (x.reset) x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); }
    const a = A42(), tt = a.DUR + t; a.frame(x, tt, a.camAt(tt));
    F.SHIFT = sv; return c;
  };
  const SHR = .85;
  const shrink = t => { const u = clamp(t / SHR); return u * u * u * (u * (6 * u - 15) + 10); };

  const CRK = 533 / 460, CR_X = -533.8 - 175 * CRK, CR_Y = 71.3 - 175 * CRK;
  function lockup(x, t) {
    if (!WM || !CR) return;
    const k = ss(.15, .75, t), dy = 8 * (1 - easeIO(k)) + 4 * ss(.6, DUR, t);
    x.save(); x.globalAlpha = k;
    if (!M45) {
      const s = 820 / 2388 * (W / 1920), x0 = W / 2 - s * (-534 + 1854) / 2, y0 = H * .06 + dy;
      x.translate(x0, y0 - 71 * s); x.scale(s, s);
      x.drawImage(CR, CR_X, CR_Y, 800 * CRK, 800 * CRK); x.drawImage(WM, 0, 0, 2000, 420);
    } else {
      const s = .3 * (W / 1080), y0 = H * .05 + dy;
      x.save(); x.translate(W / 2, y0); x.scale(s, s); x.drawImage(CR, -267 - 175 * CRK + 0, -175 * CRK, 800 * CRK, 800 * CRK); x.restore();
      x.save(); x.translate(W / 2 - s * (139 + 1854) / 2, y0 + s * 500); x.scale(s, s); x.drawImage(WM, 0, 0, 2000, 420); x.restore();
    }
    x.restore();
  }

  function draw(ctx, t) {
    const cv = mapAt(t);
    ctx.drawImage(ground(), 0, 0);
    lockup(ctx, t);
    const cw = M45 ? W * .5 : W * .47, ch = cw * H / W, z = 1 + .035 * easeIO(clamp(t / DUR)), p = shrink(t);
    const s = lerp(1, cw * z / W, p), cx = W / 2, cy = lerp(H / 2, M45 ? H * .69 : H * .695, p), ww = W * s, hh = H * s, b = 4 * p;
    if (p > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0,8,6,${.55 * p})`; ctx.shadowBlur = 30 * (W / 1920) * p; ctx.shadowOffsetY = 10 * (W / 1920) * p;
      ctx.fillStyle = BR.cream; ctx.fillRect(cx - ww / 2 - b, cy - hh / 2 - b, ww + 2 * b, hh + 2 * b);
      ctx.restore();
    }
    ctx.drawImage(cv, cx - ww / 2, cy - hh / 2, ww, hh);
    F.impact(FL, ctx, t, { lines: [{ text: 'NEXT', t0: T_NEXT + .02, size: M45 ? 120 : 132, color: BR.cream }], x: .5, y: M45 ? .345 : .335, accent: BR.gold, minW: M45 ? 420 : 520 });
  }

  F.scene('seq-43', {
    W, H, duration: DUR, draw, label: C.label, ready, grain: 'none',
    sfx: [{ t: 0, type: 'whoosh', f0: 240, f1: 520, dur: SHR, g: .04 }, { t: T_NEXT + .02, type: 'impact', size: .2, g: .14, noSnap: true }],
    api: { DUR },
  });
})();
