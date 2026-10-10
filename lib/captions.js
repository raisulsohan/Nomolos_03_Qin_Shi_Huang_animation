(function () {
  'use strict';
  const F = window.FILM;
  const ease = u => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
  F.captions = (cues, o = {}) => {
    const W = o.W, H = o.H, size0 = o.size || Math.round(W * .07), lead = o.lead ?? 1.06, font = o.font || 'PB', cy = o.y ?? H * .78;
    const cols = o.colors || [['#fff0d6', '#c8bca4'], ['#e42323', '#6e0000']];
    return (ctx, t) => {
      const c = cues.find(q => t >= q.t0 && t < q.t1); if (!c) return;
      const u = (t - c.t0) / .22, k = ease(u), s = 1.16 - .16 * k, blur = 5 * (1 - k);
      ctx.save(); ctx.translate(W / 2, cy); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, .25 + u * 1.5);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let size = size0, w = 0; ctx.font = `900 ${size}px ${font}`;
      for (const L of c.lines) w = Math.max(w, ctx.measureText(L).width);
      if (w > W * .88) { size = Math.floor(size * W * .88 / w); ctx.font = `900 ${size}px ${font}`; w = 0; for (const L of c.lines) w = Math.max(w, ctx.measureText(L).width); }
      const n = c.lines.length, top = -((n - 1) * size * lead) / 2;
      ctx.save(); ctx.filter = 'blur(20px)'; ctx.fillStyle = 'rgba(0,0,0,.7)';
      ctx.beginPath(); ctx.roundRect(-w / 2 - size * .5, top - size * .66, w + size, (n - 1) * size * lead + size * 1.32, size * .4); ctx.fill(); ctx.restore();
      if (blur > .3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      c.lines.forEach((L, i) => {
        const y = top + i * size * lead, [a, b] = cols[Math.min(i, cols.length - 1)];
        const g = ctx.createLinearGradient(0, y - size * .45, 0, y + size * .45); g.addColorStop(0, a); g.addColorStop(1, b);
        ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; ctx.fillStyle = g; ctx.fillText(L, 0, y);
      });
      ctx.restore();
    };
  };
  const SUB = (W, H) => { const portrait = H > W, size = portrait ? 44 : 46; return { size, lh: size * 1.42, px: size * .42, py: size * .2, foot: { b: portrait ? H - 130 : H - 62, l: portrait ? H - 56 : H - 16 }, head: { t: portrait ? 70 : 54, u: Math.round(H * (portrait ? .18 : .2)) } }; };
  const subFont = (ctx, s) => { ctx.font = `600 ${s.size}px NS`; ctx.letterSpacing = '0.3px'; };
  function subLayout(ctx, lines, pos, W, H) {
    const s = SUB(W, H), n = lines.length, y0 = pos === 't' || pos === 'u' ? s.head[pos] + s.lh / 2 : s.foot[pos === 'l' ? 'l' : 'b'] - (n - .5) * s.lh;
    return lines.map((L, i) => { const y = y0 + i * s.lh, w = ctx.measureText(L).width; return { L, y, box: [W / 2 - w / 2 - s.px, y - s.size * .62 - s.py / 2, W / 2 + w / 2 + s.px, y + s.size * .62 + s.py / 2] }; });
  }
  F.subtitleBoxes = (ctx, lines, pos, W, H) => { ctx.save(); subFont(ctx, SUB(W, H)); const r = subLayout(ctx, lines, pos, W, H).map(l => l.box); ctx.restore(); return r; };
  F.subtitles = (cues, o = {}) => {
    const W = o.W, H = o.H, s = SUB(W, H);
    return (ctx, t) => {
      if (window.SUBS_OFF) return;
      const c = cues.find(q => t >= q.t0 && t < q.t1); if (!c) return;
      const a = Math.min(1, (t - c.t0) / .15, (c.t1 - t) / .15), rise = 8 * (1 - Math.min(1, (t - c.t0) / .2));
      window.__SUBS_DRAWING = true;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); subFont(ctx, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const { L, y, box } of subLayout(ctx, c.lines, c.pos, W, H)) {
        ctx.fillStyle = 'rgba(12,10,24,.6)'; ctx.beginPath(); ctx.roundRect(box[0], box[1] + rise, box[2] - box[0], box[3] - box[1], s.size * .22); ctx.fill();
        ctx.fillStyle = '#f6efe2'; ctx.fillText(L, W / 2, y + rise + s.size * .04);
      }
      ctx.restore(); window.__SUBS_DRAWING = false;
    };
  };
  F.parseSrt = text => text.replace(/\r/g, '').replace(/^﻿/, '').split(/\n\n+/).map(b => b.trim()).filter(Boolean).map(b => {
    const ls = b.split('\n'), m = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/.exec(ls[1] || ls[0]); if (!m) return null;
    const s = (h, mi, se, ms) => +h * 3600 + +mi * 60 + +se + +ms / 1000;
    return { t0: s(m[1], m[2], m[3], m[4]), t1: s(m[5], m[6], m[7], m[8]), lines: ls.slice(ls[1] && /-->/.test(ls[1]) ? 2 : 1).map(x => x.trim()).filter(Boolean) };
  }).filter(Boolean);
})();
