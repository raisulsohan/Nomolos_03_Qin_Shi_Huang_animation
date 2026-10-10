(function () {
  'use strict';
  const F = (window.FILM = {});

  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const easeIO = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const easeOut = (x, p = 3) => 1 - Math.pow(1 - clamp(x), p);
  const easeIn = (x, p = 3) => Math.pow(clamp(x), p);
  const easeOutBack = (x, s = 1.7) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const env = (t, a, b, c = Infinity, d = Infinity) => { const up = smooth((t - a) / (b - a)); return c === Infinity ? up : Math.min(up, 1 - smooth((t - c) / (d - c))); };
  function keyed(t, keys, log = false, ease = easeIO) {
    const at = (v0, v1, k) => Array.isArray(v0) ? v0.map((a, i) => at(a, v1[i], k)) : log ? v0 * Math.pow(v1 / v0, k) : lerp(v0, v1, k);
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      return at(v0, v1, ease((t - t0) / (t1 - t0)));
    }
    return keys[keys.length - 1][1];
  }
  function hash(a, b = 0, c = 0) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise1(x, seed = 0) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1;
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return [c, c.getContext('2d')]; }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const tone = (a, b, k) => rgba(mixc(hex(a), hex(b), k));

  function polyPath(x, pts, close = true) {
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
    if (close) x.closePath();
  }
  function cutPoly(pts, step = 6, amp = 1, seed = 1) {
    const out = []; let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      const n = Math.max(1, Math.round(len / step));
      for (let k = 0; k < n; k++) {
        const u = k / n, d = noise1((s + u * len) / (step * 1.7), seed) * amp;
        out.push([a[0] + dx * u + nx * d, a[1] + dy * u + ny * d]);
      }
      s += len;
    }
    return out;
  }
  function bounds(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }

  function sheet(ctx, cam, p, W, H, R, shake = [0, 0]) {
    const sv = F.SHIFT, s = Math.pow(cam.z, p), cx = R[0] + p * (cam.x - R[0]), cy = R[1] + p * (cam.y - R[1]);
    ctx.setTransform(s, 0, 0, s, W / 2 - s * cx + shake[0] * p - (sv ? sv.x * p : 0), H / 2 - s * cy + shake[1] * p - (sv ? sv.y * p : 0));
    return s;
  }

  function fibreTile(seed = 7, size = 512) {
    const [c, x] = canvas(size, size), r = rng(seed);
    const dot = (px, py, rad, col) => { for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { x.beginPath(); x.arc(px + ox, py + oy, rad, 0, TAU); x.fillStyle = col; x.fill(); } };
    for (let i = 0; i < 140; i++) { const px = r() * size, py = r() * size, rad = 10 + r() * 40, light = r() < .5; for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rad); g.addColorStop(0, light ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.03)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px + ox - rad, py + oy - rad, rad * 2, rad * 2); } }
    x.lineCap = 'round';
    for (let i = 0; i < 1600; i++) {
      const px = r() * size, py = r() * size, a = r() * TAU, l = 3 + r() * 11, light = r() < .55;
      x.strokeStyle = light ? `rgba(255,255,255,${.06 + r() * .12})` : `rgba(0,0,0,${.05 + r() * .1})`;
      x.lineWidth = .5 + r() * .8;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
        x.beginPath(); x.moveTo(px + ox, py + oy); x.quadraticCurveTo(px + ox + Math.cos(a + 1) * l * .4, py + oy + Math.sin(a + 1) * l * .4, px + ox + Math.cos(a) * l, py + oy + Math.sin(a) * l); x.stroke();
      }
    }
    for (let i = 0; i < 2200; i++) { x.fillStyle = r() < .5 ? `rgba(0,0,0,${r() * .12})` : `rgba(255,255,255,${r() * .12})`; x.fillRect(r() * size, r() * size, 1, 1); }
    return c;
  }
  function mottledBackdrop(W, H, top, bottom, seed = 3, glow = 'rgba(255,230,190,.10)') {
    const [c, x] = canvas(W, H), r = rng(seed);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (const [n, rad, a] of [[70, 260, .05], [420, 60, .05]]) for (let i = 0; i < n; i++) {
      const px = r() * W, py = r() * H, rr = rad * (.4 + r()), gg = x.createRadialGradient(px, py, 0, px, py, rr), light = r() < .5;
      gg.addColorStop(0, light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gg; x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
    x.strokeStyle = 'rgba(0,0,0,.025)'; x.lineWidth = 1;
    for (let y = 0; y < H; y += 5) { x.beginPath(); x.moveTo(0, y + r()); x.lineTo(W, y + r()); x.stroke(); }
    for (let i = 0; i < 5000; i++) { x.fillStyle = r() < .5 ? `rgba(0,0,0,${r() * .15})` : `rgba(255,255,255,${r() * .12})`; x.fillRect(r() * W, r() * H, 1 + (r() < .1), 1); }
    const gl = x.createRadialGradient(W * .42, H * .38, 0, W * .5, H * .5, Math.max(W, H) * .75);
    gl.addColorStop(0, glow); gl.addColorStop(.55, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,.28)');
    x.fillStyle = gl; x.fillRect(0, 0, W, H);
    return c;
  }
  function vignette(W, H, strength = .4) {
    const [c, x] = canvas(W, H);
    const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
    x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
  }
  function grainTiles(n = 4, alpha = 9) {
    return Array.from({ length: n }, (_, i) => {
      const [c, x] = canvas(256, 256), id = x.createImageData(256, 256), r = rng(900 + i);
      for (let k = 0; k < id.data.length; k += 4) { const v = r() * 255; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = alpha; }
      x.putImageData(id, 0, 0); return c;
    });
  }

  const asset = p => (window.ROOT || "") + p;
  const FONT_SET = { NSC: { file: "fonts/NotoSans_Condensed-Black.ttf", weight: 900 }, NS: { file: "fonts/NotoSans-SemiBold.ttf", weight: 600 }, PB: { file: "fonts/Poppins-Black.ttf", weight: 900 } };
  const fonts = (...names) => loadFonts(names.map(n => ({ family: n, file: asset(FONT_SET[n].file), weight: FONT_SET[n].weight })));
  function loadFonts(list) {
    return Promise.all(list.map(f => new FontFace(f.family, `url("${f.file}")`, { weight: String(f.weight || 400) }).load()
      .then(face => { document.fonts.add(face); return face; })));
  }

  const FPS = 60;
  F.PASS = window.FILM_PASS || null; F.PAGE = null; F.PROXY = null; F.SHEET_N = 0; F.GLOW_N = 0; F.SHEET_LAST = 0; F.ROUTED = new Set();
  F.segEnd = () => {
    const src = F.PROXY, dst = F.PAGE; if (!F.PASS || !src) return;
    const name = `overlay-${F.SHEET_N}${F.GLOW_N ? '+' : ''}`, W = src.canvas.width, H = src.canvas.height;
    if (F.PASS === 'probe') { const d = src.getImageData(0, 0, W, H).data; for (let i = 3; i < d.length; i += 16) if (d[i]) { F.ROUTED.add(name); break; } }
    else if (F.PASS === name) { dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = 1; dst.globalCompositeOperation = 'source-over'; dst.filter = 'none'; dst.drawImage(src.canvas, 0, 0); dst.restore(); }
    if (/^(overlay|probe)/.test(F.PASS)) { src.save(); src.setTransform(1, 0, 0, 1, 0, 0); src.globalCompositeOperation = 'source-over'; src.clearRect(0, 0, W, H); src.restore(); }
  };
  F.route = (ctx, kind) => {
    if (!F.PASS || ctx !== F.PROXY) return ctx;
    if (kind === 'sheet') { F.segEnd(); F.SHEET_N++; F.GLOW_N = 0; }
    else if (kind === 'glow' || kind === 'glowsoft') { F.segEnd(); F.GLOW_N++; }
    const name = kind === 'sheet' ? `sheet-${F.SHEET_N}` : kind === 'bg' || kind === 'grade' || kind === 'grain' ? kind : `${kind}-${F.SHEET_N}`;
    F.ROUTED.add(name);
    return F.PASS === name ? F.PAGE : null;
  };
  function film(opts) {
    const { W, H, duration } = opts, fps = opts.fps || FPS;
    const cv = document.getElementById('c');
    cv.width = W; cv.height = H; cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext('2d');
    const GR = grainTiles(4, opts.grainAlpha || 9).map(c => ctx.createPattern(c, 'repeat'));
    const grainMode = window.FILM_GRAIN || opts.grain || 'frame';
    const clean = ctx.reset ? () => ctx.reset() : () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.lineWidth = 1; ctx.miterLimit = 10;
      ctx.font = '10px sans-serif'; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic'; ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
      ctx.imageSmoothingEnabled = true; ctx.clearRect(0, 0, W, H);
    };
    const [, hx] = canvas(W, H), cleanHidden = hx.reset ? () => hx.reset() : () => { hx.setTransform(1, 0, 0, 1, 0, 0); hx.globalAlpha = 1; hx.globalCompositeOperation = 'source-over'; hx.filter = 'none'; hx.clearRect(0, 0, W, H); };
    function seek(t) {
      t = clamp(t, 0, duration);
      clean(); F.SHEET_N = 0; F.GLOW_N = 0;
      const pass = F.PASS, target = pass ? hx : ctx;
      if (pass) { F.PAGE = ctx; F.PROXY = hx; cleanHidden(); if (pass === 'probe' && grainMode !== 'none') F.ROUTED.add('grain'); }
      opts.draw(target, t);
      if (pass) F.segEnd();
      F.SHEET_LAST = F.SHEET_N;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      if (grainMode !== 'none' && (!pass || pass === 'grain')) {
        const f = grainMode === 'pose' ? Math.floor(t * (opts.poseRate || 15) + 1e-6) : Math.round(t * fps);
        const gx = (f * 97) % 256, gy = (f * 57) % 256;
        ctx.setTransform(1, 0, 0, 1, gx, gy); ctx.fillStyle = GR[f % GR.length]; ctx.fillRect(-gx, -gy, W, H);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    window.__film = { duration, ready: false, seek, shots: opts.shots || [], marks: opts.marks || [], sheets: () => F.SHEET_LAST, routed: () => [...F.ROUTED] };
    Promise.resolve(opts.ready).then(() => { window.__film.ready = true; startPlayer(cv, seek, duration, fps, opts.label, opts.audio); })
      .catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f88;position:fixed;top:0;left:0">${e}</pre>`); });
    return { ctx, seek };
  }

  function startPlayer(cv, seek, duration, fps, label, audio) {
    const params = new URLSearchParams(location.search);
    const FIXED = params.has('t') ? parseFloat(params.get('t')) : null;
    if (params.has('capture')) return;
    if (FIXED !== null) { seek(FIXED); return; }
    const total = Math.round(duration * fps), SPEEDS = [.25, .5, .75, 1, 1.25, 1.5, 2];
    const bar = document.createElement('div');
    bar.innerHTML = `<button id="rs" title="Restart (Home)">⏮</button><button id="fb" title="One frame back (← or ,)">◀|</button><button id="pp" title="Play / pause (Space, K)">▶</button><button id="ff" title="One frame on (→ or .)">|▶</button>` +
      `<input id="sc" type="range" min="0" max="${duration}" step="${1 / fps}" value="0" title="Seek"><span id="tm"></span>` +
      `<select id="sp" title="Speed">${SPEEDS.map(v => `<option value="${v}"${v === 1 ? ' selected' : ''}>${v}×</option>`).join('')}</select>` +
      `<button id="lp" title="Loop (L)">⟲</button><button id="mu" title="Mute (M)">🔊</button><input id="vo" type="range" min="0" max="1" step="0.01" value="1" title="Volume"><button id="fs" title="Fullscreen (F)">⛶</button><span id="lb"></span>`;
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding:10px 14px;background:linear-gradient(transparent,rgba(0,0,0,.8));color:#ddd;font:13px/1 ui-monospace,Consolas,monospace;transition:opacity .4s;z-index:9';
    document.body.appendChild(bar);
    const $ = id => bar.querySelector('#' + id), pp = $('pp'), sc = $('sc'), tm = $('tm'), sp = $('sp'), lp = $('lp'), mu = $('mu'), vo = $('vo'), lb = $('lb');
    for (const b of bar.querySelectorAll('button')) b.style.cssText = 'background:none;border:1px solid #888;color:#eee;border-radius:4px;min-width:34px;height:26px;padding:0 6px;cursor:pointer;font:13px/1 ui-monospace,Consolas,monospace';
    sc.style.cssText = 'flex:1 1 240px;min-width:120px;accent-color:#e3a13a;cursor:pointer';
    vo.style.cssText = 'width:80px;accent-color:#e3a13a;cursor:pointer';
    sp.style.cssText = 'background:#111;color:#eee;border:1px solid #888;border-radius:4px;height:26px';
    let playing = false, t = 0, t0 = 0, p0 = 0, hideAt = 0, muted = false, looping = false, speed = 1, vol = 1;
    let ac = null, gain = null, bufs = null, srcs = [];
    if (audio && audio.length) {
      ac = new (window.AudioContext || window.webkitAudioContext)(); gain = ac.createGain(); gain.connect(ac.destination);
      Promise.all(audio.map(a => ac.decodeAudioData(Uint8Array.from(atob(a.b64), ch => ch.charCodeAt(0)).buffer).then(b => ({ t0: a.t0, b })))).then(r => { bufs = r; if (playing) startAudio(t); });
    }
    const level = () => { if (gain) gain.gain.value = muted ? 0 : vol; mu.textContent = muted || vol === 0 ? '🔇' : '🔊'; };
    const stopAudio = () => { for (const s of srcs) try { s.stop(); } catch {} srcs = []; };
    const startAudio = from => {
      stopAudio(); if (!ac || !bufs) return; ac.resume();
      const now = ac.currentTime + .02;
      for (const { t0: a0, b } of bufs) {
        if (from >= a0 + b.duration) continue;
        const s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = speed; s.connect(gain);
        s.start(now + Math.max(0, a0 - from) / speed, Math.max(0, from - a0)); s.at = [a0, Math.max(0, from - a0)]; srcs.push(s);
      }
    };
    const now = () => performance.now();
    const show = () => { bar.style.opacity = 1; hideAt = now() + 2500; };
    const cur = () => playing ? Math.min(duration, p0 + (now() - t0) / 1000 * speed) : t;
    const set = v => { t = clamp(v, 0, duration); if (playing) { t0 = now(); p0 = t; startAudio(t); } show(); };
    const play = () => { if (t >= duration - 1e-3) t = 0; playing = true; t0 = now(); p0 = t; startAudio(t); pp.textContent = '❚❚'; show(); };
    const pause = () => { t = cur(); playing = false; stopAudio(); pp.textContent = '▶'; show(); };
    const toggle = () => playing ? pause() : play();
    const step = n => { if (playing) pause(); set(Math.round(t * fps + n) / fps); };
    const setSpeed = v => { t = cur(); speed = v; sp.value = String(v); if (playing) { t0 = now(); p0 = t; startAudio(t); } show(); };
    const setLoop = v => { looping = v; lp.style.background = v ? 'rgba(227,161,58,.45)' : 'none'; show(); };
    const fullscreen = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    pp.onclick = toggle; cv.onclick = toggle;
    $('rs').onclick = () => set(0); $('fb').onclick = () => step(-1); $('ff').onclick = () => step(1);
    sc.oninput = () => set(parseFloat(sc.value));
    sp.onchange = () => { setSpeed(parseFloat(sp.value)); sp.blur(); };
    lp.onclick = () => setLoop(!looping);
    mu.onclick = () => { muted = !muted; level(); show(); };
    vo.oninput = () => { vol = parseFloat(vo.value); if (vol > 0) muted = false; level(); show(); };
    $('fs').onclick = fullscreen;
    addEventListener('mousemove', show);
    addEventListener('keydown', e => {
      const k = e.key, l = k.toLowerCase();
      if (k === ' ' || l === 'k') toggle();
      else if (k === 'ArrowRight') { if (e.shiftKey) set(cur() + 1); else step(1); }
      else if (k === 'ArrowLeft') { if (e.shiftKey) set(cur() - 1); else step(-1); }
      else if (k === '.' || k === '>') step(1);
      else if (k === ',' || k === '<') step(-1);
      else if (k === 'Home') set(0);
      else if (k === 'End') { if (playing) pause(); set(duration); }
      else if (l === 'm') { muted = !muted; level(); }
      else if (l === 'l') setLoop(!looping);
      else if (l === 'f') fullscreen();
      else return;
      e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); show();
    });
    level();
    let drawn = NaN, shown = '';
    const loop = () => {
      if (playing) {
        t = cur();
        if (t >= duration) { if (looping) { t = 0; t0 = now(); p0 = 0; startAudio(0); } else { t = duration; playing = false; stopAudio(); pp.textContent = '▶'; } }
      }
      const q = Math.round(t * fps) / fps;
      if (q !== drawn) { seek(q); drawn = q; sc.value = q; }
      const f = Math.round(q * fps);
      const text = `${q.toFixed(2)} / ${duration.toFixed(2)} s · frame ${f} / ${total}`;
      if (text !== shown) { tm.textContent = text; shown = text; }
      const lt = `${label ? label(q) : ''}${ac ? '' : ' · no sound'}`;
      if (lb.textContent !== lt) lb.textContent = lt;
      if (now() > hideAt && playing) bar.style.opacity = 0;
      next();
    };
    const next = () => document.hidden ? setTimeout(loop, 1000 / 30) : requestAnimationFrame(loop);
    window.__player = { play, pause, toggle, set, step, setSpeed, setLoop, state: () => ({ playing, t: cur(), speed, looping, muted, vol, sources: srcs.length, rate: srcs[0] ? srcs[0].playbackRate.value : null, gain: gain ? gain.gain.value : null,
      tracks: srcs.map(s => ({ t0: s.at[0], from: s.at[1], dur: s.buffer.duration, rate: s.playbackRate.value })), decoded: bufs ? bufs.map(x => ({ t0: x.t0, dur: x.b.duration })) : null }) };
    show(); next();
  }

  const FORMATS = { '16x9': [1920, 1080], '4x5': [1080, 1350], '9x16': [1080, 1920] };
  function format() { const id = window.FORMAT || '16x9', [W, H] = FORMATS[id]; return { id, W, H, portrait: H > W }; }

  function cues(seq) {
    const T = (window.TIMING || {})[seq];
    if (!T) throw new Error(`no timing for ${seq}: load sequences/${seq}/timing.js`);
    const byId = Object.fromEntries(T.sentences.map(s => [s.id, s]));
    const find = (id, word, n) => {
      const s = byId[id]; if (!s) throw new Error(`cue: no sentence ${id} in ${seq}`);
      let k = 0; for (const x of s.words) if (x[0].toLowerCase() === word.toLowerCase() && ++k === n) return x;
      throw new Error(`cue: no word "${word}" (${n}) in ${id}`);
    };
    return {
      T, duration: T.duration,
      s: id => byId[id],
      w: (id, word, n = 1) => find(id, word, n)[1],
      we: (id, word, n = 1) => find(id, word, n)[2],
      label: t => { const s = T.sentences.find(s => t >= s.t0 && t < s.t1) || T.sentences.at(-1); return s.id; },
    };
  }

  const MB = {};
  function motionBlur(ctx, t, shutter, samples, draw) {
    const W = ctx.canvas.width, H = ctx.canvas.height, pass = !!(F.PASS && ctx === F.PROXY);
    if (!MB.tmp || MB.tmp[0].width !== W || MB.tmp[0].height !== H) { MB.tmp = canvas(W, H); MB.acc = canvas(W, H); MB.lay = canvas(W, H); }
    const [tc, tx] = MB.tmp, [ac, ax] = MB.acc, [lc, lx] = MB.lay, page = F.PAGE, proxy = F.PROXY;
    ax.setTransform(1, 0, 0, 1, 0, 0); ax.globalAlpha = 1; ax.globalCompositeOperation = 'source-over'; ax.clearRect(0, 0, W, H);
    for (let i = 0; i < samples; i++) {
      tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalAlpha = 1; tx.globalCompositeOperation = 'source-over'; tx.filter = 'none'; tx.clearRect(0, 0, W, H);
      if (pass) { lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over'; lx.filter = 'none'; lx.clearRect(0, 0, W, H); F.PROXY = tx; F.PAGE = lx; F.SHEET_N = 0; F.GLOW_N = 0; }
      draw(tx, t + shutter * (samples > 1 ? i / (samples - 1) - .5 : 0));
      if (pass) { F.segEnd(); F.PROXY = proxy; F.PAGE = page; }
      if (pass) { ax.globalCompositeOperation = 'lighter'; ax.globalAlpha = 1 / samples; ax.drawImage(lc, 0, 0); }
      else { ax.globalAlpha = 1 / (i + 1); ax.drawImage(tc, 0, 0); }
    }
    const out = pass ? page : ctx;
    out.save(); out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.filter = 'none';
    out.drawImage(ac, 0, 0); out.restore();
  }

  const SCENES = {};
  function scene(id, opts) {
    if (opts.from) {
      const own = opts.draw, sp = opts.from, W = opts.W, H = opts.H;
      opts = { ...opts, draw: (ctx, t) => moveIn(ctx, t, own, sp, W, H), own,
        sfx: [{ t: .03, type: 'whoosh', f0: 150, f1: 330, dur: sp.dur * .85, g: sp.g ?? .07 }, ...(opts.sfx || [])] };
    }
    SCENES[id] = opts;
  }

  const MV = {};
  function moveIn(ctx, t, own, sp, W, H) {
    const A = SCENES[sp.id];
    if (!A || t >= sp.dur) return own(ctx, t);
    if (t <= 0) return A.draw(ctx, A.duration);
    const key = W + 'x' + H; if (!MV[key]) MV[key] = [canvas(W, H), canvas(W, H)];
    const [[ca, xa], [cb, xb]] = MV[key], dir = sp.dir || 'right', hz = dir === 'right' || dir === 'left', sg = dir === 'right' || dir === 'down' ? 1 : -1;
    const at = t => easeIO(t / sp.dur), u = at(t), L = hz ? W : H, span = L * (sp.travel ?? 1), fw = L * (sp.soft ?? .24);
    const clean = x => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; };
    const render = (x, draw, tt, off) => {
      if (x.reset) x.reset(); else { clean(x); x.clearRect(0, 0, W, H); }
      F.SHIFT = hz ? { x: off, y: 0 } : { x: 0, y: off };
      try { draw(x, tt); } finally { F.SHIFT = null; }
      clean(x);
    };
    render(xa, A.draw, A.duration + (sp.hold ? 0 : t), sg * u * span);
    render(xb, own, t, -sg * (1 - u) * span);
    const seam = sg > 0 ? lerp(L + fw / 2, -fw / 2, u) : lerp(-fw / 2, L + fw / 2, u);
    const g = hz ? xb.createLinearGradient(seam - fw / 2, 0, seam + fw / 2, 0) : xb.createLinearGradient(0, seam - fw / 2, 0, seam + fw / 2);
    for (let i = 0; i <= 10; i++) { const k = smooth(i / 10); g.addColorStop(i / 10, `rgba(0,0,0,${sg > 0 ? k : 1 - k})`); }
    xb.globalCompositeOperation = 'destination-in'; xb.fillStyle = g; xb.fillRect(0, 0, W, H); clean(xb);
    xa.drawImage(cb, 0, 0);
    const h = 1e-3, v = span * (at(t + h) - at(t - h)) / (2 * h), len = v * (sp.shutter ?? 1 / 30);
    let src = ca, dst = cb;
    if (len > 1.5) {
      const k = Math.ceil(Math.log2(len / 1.6)), s0 = len / (2 ** k - 1);
      for (let j = 0; j < k; j++) {
        const d = (j === k - 1 ? 1 : -1) * s0 * 2 ** j, x = dst.getContext('2d');
        clean(x); x.drawImage(src, 0, 0); x.globalAlpha = .5; x.drawImage(src, hz ? d : 0, hz ? 0 : d); clean(x);
        [src, dst] = [dst, src];
      }
    }
    ctx.save(); clean(ctx); ctx.drawImage(src, 0, 0); ctx.restore();
  }
  const voice = id => (window.FILM_AUDIO || {})[id];
  const tracks = (id, t0) => [voice(id)].filter(Boolean).map(b64 => ({ t0, b64 }));
  const getScene = id => SCENES[id];
  function play(id) { const a = tracks(id, 0); return film({ ...SCENES[id], audio: a.length ? a : null }); }
  function reel(ids, opts = {}) {
    const parts = []; let acc = 0;
    for (const id of ids) { parts.push({ id, s: SCENES[id], t0: acc }); acc += SCENES[id].duration; }
    const at = t => { let p = parts[0]; for (const q of parts) if (t >= q.t0 - 1e-9) p = q; return p; };
    return film({
      W: parts[0].s.W, H: parts[0].s.H, duration: acc, fps: parts[0].s.fps || FPS, grain: 'none',
      ready: Promise.all([...parts.map(p => p.s.ready), opts.ready]), audio: [...parts.flatMap(p => tracks(p.id, p.t0)), ...(window.FILM_BGM ? [{ t0: -(window.FILM_BGM_T0 || 0), b64: window.FILM_BGM }] : [])],
      draw: (ctx, t) => { const p = at(t); (opts.cutIn && p === parts[0] && p.s.own || p.s.draw)(ctx, Math.min(t - p.t0, p.s.duration)); if (opts.over) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; opts.over(ctx, t); ctx.restore(); } },
      shots: parts.map(p => ({ id: p.id, start: p.t0, end: p.t0 + p.s.duration })), marks: parts.map(p => p.t0),
      label: t => { const p = at(t); return `${p.id} · ${p.s.label ? p.s.label(t - p.t0) : ''}`; },
    });
  }

  Object.assign(F, {
    FPS, format, cues, motionBlur, scene, getScene, play, reel, asset, fonts,
    TAU, clamp, smooth, easeIO, easeOut, easeIn, easeOutBack, lerp, env, keyed, hash, rng, noise1, canvas,
    hex, mixc, rgba, tone, polyPath, cutPoly, bounds, sheet, fibreTile, mottledBackdrop, vignette, grainTiles, loadFonts, film,
  });
})();
