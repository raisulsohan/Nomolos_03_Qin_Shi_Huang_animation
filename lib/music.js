(function () {
  'use strict';
  const F = window.FILM, SR = 48000, TAU = Math.PI * 2;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const KIND = { m: [0, 3, 7], M: [0, 4, 7], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], 7: [0, 4, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 14], p5: [0, 7, 12] };
  const chord = (root, kind = 'm') => KIND[kind].map(i => root + i);

  function impulse(ac, sec, decay, seed) {
    const n = Math.floor(SR * sec), b = ac.createBuffer(2, n, SR), r = F.rng(seed), k = 1 - Math.exp(-TAU * 2000 / SR);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let y = 0; for (let i = 0; i < n; i++) { y += k * ((r() * 2 - 1) - y); d[i] = y * 3 * Math.pow(1 - i / n, decay); } }
    return b;
  }
  function noiseBuf(ac, seed) { const b = ac.createBuffer(1, SR * 4, SR), d = b.getChannelData(0), r = F.rng(seed); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; return b; }

  function musician(ac, dur, tail) {
    const master = ac.createGain(); master.gain.value = 1;
    const shapeG = ac.createGain(); shapeG.gain.value = 1;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
    master.connect(shapeG).connect(comp).connect(ac.destination);
    const verb = ac.createConvolver(); verb.buffer = impulse(ac, 2.6, 2.4, 21); const verbIn = ac.createGain(); verbIn.gain.value = .28; verbIn.connect(verb).connect(master);
    const NOISE = noiseBuf(ac, 5);
    const r = F.rng(77);
    function voice(o, send = .3) {
      const g = ac.createGain(); g.gain.value = 0.0001; const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan || 0));
      g.connect(p); p.connect(master); if (send > 0) { const s = ac.createGain(); s.gain.value = send * (o.verb ?? 1); p.connect(s); s.connect(verbIn); }
      return g;
    }
    const osc = (type, f, t0, t1, detune = 0) => { const s = ac.createOscillator(); s.type = type; s.frequency.value = f; s.detune.value = detune; s.start(t0); s.stop(t1); return s; };
    const lp = (f, q = .7) => { const b = ac.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q; return b; };
    const hp = f => { const b = ac.createBiquadFilter(); b.type = 'highpass'; b.frequency.value = f; return b; };
    const env = (g, t, a, peak, dur, rel) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, Math.max(t + a, t + dur)); g.gain.exponentialRampToValueAtTime(0.0001, Math.max(t + a, t + dur) + rel); };

    const m = {
      rng: r, chord,
      drone(n, t, dur, o = {}) {
        const g = voice(o, .2), f = hz(n), a = o.a ?? 2.5, rel = o.r ?? 3;
        const mix = ac.createGain(); mix.gain.value = .5; mix.connect(g);
        osc('sine', f, t, t + dur + rel + .1).connect(mix); osc('sine', f, t, t + dur + rel + .1, 4).connect(mix);
        const sub = ac.createGain(); sub.gain.value = .5; osc('sine', f / 2, t, t + dur + rel + .1).connect(sub); sub.connect(mix);
        if (o.air) { const s = ac.createBufferSource(); s.buffer = NOISE; s.loop = true; s.start(t); s.stop(t + dur + rel); const fl = lp(o.airF || 320, .8), ag = ac.createGain(); ag.gain.value = o.air; s.connect(fl).connect(ag).connect(mix); }
        const lfo = osc('sine', o.breath ?? .09, t, t + dur + rel + .1), lg = ac.createGain(); lg.gain.value = .25; lfo.connect(lg).connect(mix.gain);
        env(g, t, a, o.g ?? .4, dur, rel);
      },
      pad(notes, t, dur, o = {}) {
        const g = voice(o, .4), a = o.a ?? 1.5, rel = o.r ?? 2.5, cut = lp(o.cut ?? 900, .6); cut.connect(g);
        const lfo = osc('sine', .07, t, t + dur + rel + .1), lg = ac.createGain(); lg.gain.value = (o.cut ?? 900) * .25; lfo.connect(lg).connect(cut.frequency);
        for (const n of notes) { const f = hz(n), ng = ac.createGain(); ng.gain.value = .5 / Math.sqrt(notes.length); ng.connect(cut); osc(o.type || 'sawtooth', f, t, t + dur + rel + .1, -6).connect(ng); osc(o.type || 'sawtooth', f, t, t + dur + rel + .1, 6).connect(ng); }
        env(g, t, a, o.g ?? .25, dur, rel);
      },
      strings(notes, t, dur, o = {}) {
        const g = voice(o, .45), a = o.a ?? 1.2, rel = o.r ?? 2, cut = lp(o.cut ?? 2200, .5), h = hp(o.hp ?? 140); h.connect(cut).connect(g);
        const vib = osc('sine', 5.2, t, t + dur + rel + .1), vg = ac.createGain(); vg.gain.value = 5;
        for (const n of notes) { const f = hz(n), ng = ac.createGain(); ng.gain.value = .4 / Math.sqrt(notes.length); ng.connect(h); for (const d of [-7, 0, 7]) { const s = osc('sawtooth', f, t, t + dur + rel + .1, d); vib.connect(vg).connect(s.detune); s.connect(ng); } }
        env(g, t, a, o.g ?? .2, dur, rel);
      },
      swell(notes, t, dur, o = {}) {
        const g = voice(o, .4), pk = t + dur * (o.peak ?? .7), cut = lp(o.f0 ?? 300, .8); cut.connect(g);
        cut.frequency.setValueAtTime(o.f0 ?? 300, t); cut.frequency.exponentialRampToValueAtTime(o.f1 ?? 2400, pk); cut.frequency.exponentialRampToValueAtTime(o.f0 ?? 300, t + dur + .5);
        for (const n of notes) { const f = hz(n), ng = ac.createGain(); ng.gain.value = .45 / Math.sqrt(notes.length); ng.connect(cut); osc('sawtooth', f, t, t + dur + 1, -5).connect(ng); osc('sawtooth', f, t, t + dur + 1, 5).connect(ng); }
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.g ?? .3, pk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (o.r ?? .8));
      },
      keys(n, t, o = {}) {
        const g = voice(o, .5), f = hz(n), d = (o.decay ?? 1) * (n < 52 ? 3.2 : n < 64 ? 2.4 : 1.7);
        const parts = [[1, 1, 1], [2.001, .32, .55], [3.004, .12, .35], [4.2, .05, .22]];
        for (const [k, a, dk] of parts) { const s = osc('sine', f * k, t, t + d * dk + .2), pg = ac.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(a, t + .008); pg.gain.exponentialRampToValueAtTime(0.0001, t + d * dk); s.connect(pg).connect(g); }
        if (o.knock) { const k = ac.createBufferSource(); k.buffer = NOISE; k.start(t); k.stop(t + .02); const kf = lp(1800), kg = ac.createGain(); kg.gain.setValueAtTime(.05, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + .018); k.connect(kf).connect(kg).connect(g); }
        g.gain.setValueAtTime(o.g ?? .3, t);
      },
      bass(n, t, dur, o = {}) {
        const g = voice(o, .1), f = hz(n), fl = lp(o.cut ?? 420); fl.connect(g);
        osc('triangle', f, t, t + dur + .6).connect(fl); const s = ac.createGain(); s.gain.value = .6; osc('sine', f, t, t + dur + .6).connect(s); s.connect(fl);
        env(g, t, o.a ?? .04, o.g ?? .3, dur, o.r ?? .35);
      },
      pulse(t, o = {}) {
        const g = voice(o, .15), f = o.f ?? 54, s = osc('sine', f, t, t + .5); s.frequency.exponentialRampToValueAtTime(f * .7, t + .3); s.connect(g);
        if (o.tick) { const k = ac.createBufferSource(); k.buffer = NOISE; k.start(t); k.stop(t + .07); const kf = lp(900), kg = ac.createGain(); kg.gain.setValueAtTime(.35, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + .06); k.connect(kf).connect(kg).connect(g); }
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g ?? .5, t + .006); g.gain.exponentialRampToValueAtTime(0.0001, t + (o.d ?? .38));
      },
      brush(t, o = {}) {
        const g = voice(o, .2), k = ac.createBufferSource(); k.buffer = NOISE; k.start(t); k.stop(t + .12); k.connect(hp(o.f ?? 3200)).connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g ?? .12, t + .004); g.gain.exponentialRampToValueAtTime(0.0001, t + (o.d ?? .09));
      },
      tick(t, o = {}) {
        const g = voice(o, .25), s = osc('sine', o.f ?? 880, t, t + .06); s.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g ?? .1, t + .002); g.gain.exponentialRampToValueAtTime(0.0001, t + .05);
      },
      shape(points) { shapeG.gain.setValueAtTime(points[0][1], 0); for (const [t, v] of points) shapeG.gain.linearRampToValueAtTime(Math.max(v, 0.0001), Math.max(0, t)); },
    };
    return m;
  }

  function wav24(buf) {
    const ch = buf.numberOfChannels, n = buf.length, bytes = 44 + n * ch * 3, dv = new DataView(new ArrayBuffer(bytes));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * ch * 3, true); dv.setUint16(32, ch * 3, true); dv.setUint16(34, 24, true); str(36, 'data'); dv.setUint32(40, n * ch * 3, true);
    const data = [...Array(ch)].map((_, c) => buf.getChannelData(c)); let p = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])) * 8388607 | 0; dv.setUint8(p++, v & 255); dv.setUint8(p++, (v >> 8) & 255); dv.setUint8(p++, (v >> 16) & 255); }
    const u8 = new Uint8Array(dv.buffer); let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    return btoa(s);
  }

  function render(dur, tail, score) {
    const ac = new OfflineAudioContext(2, Math.ceil((dur + tail) * SR), SR);
    score(musician(ac, dur, tail));
    return ac.startRendering().then(wav24);
  }
  F.music = { render, chord, hz };
})();
