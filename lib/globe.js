(function () {
  'use strict';
  const F = FILM, S3 = F.stage3d, { clamp, smooth, lerp, TAU } = F;
  const GL = (F.globe = {});
  const D = Math.PI / 180;
  GL.at = (lon, lat, rot, r = 1) => { const l = (lon + rot) * D, p = lat * D; return [r * Math.cos(p) * Math.sin(l), r * Math.sin(p), -r * Math.cos(p) * Math.cos(l)]; };
  GL.frame = (lon, lat, rot) => { const l = (lon + rot) * D, p = lat * D; return { up: [Math.cos(p) * Math.sin(l), Math.sin(p), -Math.cos(p) * Math.cos(l)], east: [Math.cos(l), 0, Math.sin(l)], north: [-Math.sin(p) * Math.sin(l), Math.cos(p), Math.sin(p) * Math.cos(l)] }; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]), scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  GL.add = add; GL.scl = scl; GL.dot = dot;
  const seen = (cam, q) => dot(q, cam.pos) > dot(q, q);
  function toRim(cam, q) {
    const d = len(cam.pos), c = scl(cam.pos, 1 / d), r = len(q), qp = add(q, scl(c, -dot(q, c))), lp = len(qp) || 1e-9, rh = r * Math.sqrt(Math.max(0, 1 - r * r / (d * d)));
    return add(scl(c, r * r / d), scl(qp, rh / lp));
  }
  GL.seen = seen;
  function ringPath(x, cam, ring, rot, r = 1) {
    let any = false; const s = [];
    for (const [lo, la] of ring) { let q = GL.at(lo, la, rot, r); if (seen(cam, q)) any = true; else q = toRim(cam, q); const p = cam.proj(q); if (p) s.push(p); }
    if (!any || s.length < 3) return false;
    s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); return true;
  }
  GL.ringPath = ringPath;
  function rim(cam, r = 1, n = 96) {
    const d = len(cam.pos), c = scl(cam.pos, 1 / d), ref = Math.abs(c[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    const u = (() => { const v = [c[1] * ref[2] - c[2] * ref[1], c[2] * ref[0] - c[0] * ref[2], c[0] * ref[1] - c[1] * ref[0]]; return scl(v, 1 / len(v)); })(), v = [c[1] * u[2] - c[2] * u[1], c[2] * u[0] - c[0] * u[2], c[0] * u[1] - c[1] * u[0]];
    const rh = r * Math.sqrt(Math.max(0, 1 - r * r / (d * d))), o = scl(c, r * r / d), s = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, p = cam.proj(add(o, add(scl(u, rh * Math.cos(a)), scl(v, rh * Math.sin(a))))); if (p) s.push(p); }
    return s;
  }
  GL.rim = rim;
  GL.disc = cam => { const s = rim(cam, 1, 48); if (s.length < 3) return null; let cx = 0, cy = 0; for (const p of s) { cx += p[0]; cy += p[1]; } cx /= s.length; cy /= s.length; let r = 0; for (const p of s) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy)); return [cx, cy, r]; };

  const LAND = () => F.world.LAND, CH = () => F.china.RAW.CHINA, QN = () => F.china.RAW.QIN221;
  GL.draw = (x, cam, o) => {
    const rot = o.rot, d = len(cam.pos);
    const dc = GL.disc(cam); if (!dc) return;
    const [cx, cy, R] = dc;
    const ga = x.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.16); ga.addColorStop(0, 'rgba(150,190,240,.32)'); ga.addColorStop(1, 'rgba(150,190,240,0)');
    x.fillStyle = ga; x.beginPath(); x.arc(cx, cy, R * 1.17, 0, TAU); x.fill();
    const s = rim(cam); x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
    const gs = x.createRadialGradient(cx - .35 * R, cy - .4 * R, R * .1, cx, cy, R * 1.02); gs.addColorStop(0, '#2c4466'); gs.addColorStop(.7, '#1b2c48'); gs.addColorStop(1, '#101c32');
    x.fillStyle = gs; x.fill();
    x.save(); x.clip();
    x.beginPath(); for (const r of LAND()) ringPath(x, cam, r, rot);
    x.fillStyle = '#b9ab8c'; x.fill();
    x.beginPath(); let anyC = false; for (const r of CH()) anyC = ringPath(x, cam, r, rot, 1.0015) || anyC;
    if (anyC) {
      x.fillStyle = S3.mix('#e8dcbd', '#fff3d2', o.china || 0); x.fill();
      x.save(); x.clip();
      x.beginPath(); if (ringPath(x, cam, QN()[0], rot, 1.002)) { x.fillStyle = S3.mix('#c9952f', '#ffd36a', o.gold || 0); x.fill(); }
      x.restore();
      x.beginPath(); for (const r of CH()) ringPath(x, cam, r, rot, 1.0015);
      x.strokeStyle = S3.mix('#fff6df', '#ffffff', o.china || 0); x.lineWidth = Math.max(1.2, 2.2 * Math.min(1, R / 900)) * (1 + 1.5 * (o.china || 0)); x.lineJoin = 'round'; x.stroke();
    }
    const gd = x.createRadialGradient(cx - .3 * R, cy - .35 * R, R * .35, cx, cy, R * 1.01); gd.addColorStop(0, 'rgba(8,12,26,0)'); gd.addColorStop(.75, 'rgba(8,12,26,.18)'); gd.addColorStop(1, 'rgba(8,12,26,.55)');
    x.fillStyle = gd; x.fillRect(cx - R - 2, cy - R - 2, 2 * R + 4, 2 * R + 4);
    x.restore();
    x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.strokeStyle = 'rgba(200,225,255,.35)'; x.lineWidth = 1.5; x.stroke();
  };
  GL.letter = (x, cam, ch, lon, lat, rot, h, stand, col, o = {}) => {
    if (stand <= .002 || h <= 0) return;
    const fr = GL.frame(lon, lat, rot), base = GL.at(lon, lat, rot, 1.003), a = (1 - stand) * Math.PI / 2;
    const up = add(scl(fr.up, Math.cos(a)), scl(fr.north, Math.sin(a))), back0 = add(scl(fr.up, -Math.sin(a)), scl(fr.north, Math.cos(a)));
    if (!seen(cam, base)) return;
    const tr = o.turn || 0, ct = Math.cos(tr), st = Math.sin(tr);
    const east = tr ? add(scl(fr.east, ct), scl(back0, st)) : fr.east, back = tr ? add(scl(back0, ct), scl(fr.east, -st)) : back0;
    if (tr) col = S3.mix(col, '#2a1d0c', .35 * Math.abs(st));
    const font = `900 100px ${o.font || 'NSC'}`, k = h / 72;
    const draw = (b, fill) => {
      const P0 = cam.proj(b), Pe = cam.proj(add(b, scl(east, k))), Pu = cam.proj(add(b, scl(up, k))); if (!P0 || !Pe || !Pu) return;
      x.save(); x.transform(Pe[0] - P0[0], Pe[1] - P0[1], -(Pu[0] - P0[0]), -(Pu[1] - P0[1]), P0[0], P0[1]);
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = fill; x.fillText(ch, 0, 0); x.restore();
    };
    const dep = o.depth ?? h * .14, n = 7 + Math.round(28 * Math.abs(st));
    x.save(); x.globalAlpha *= Math.min(1, stand * 4) * (o.alpha ?? 1);
    for (let i = n; i >= 1; i--) draw(add(base, scl(back, dep * i / n)), S3.mix(col, '#2a1d0c', .55 - .2 * i / n));
    draw(base, tr && o.face ? S3.mix(o.face, '#2a1d0c', .35 * Math.abs(st)) : o.face || col);
    x.restore();
  };
})();
