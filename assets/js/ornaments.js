/* ==========================================================================
   Guilloché: rosetas y bandas de grabado dibujadas en canvas con el color
   del tema. Se redibujan al cambiar de tamaño o de tema; nunca por fotograma.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var canvases = Array.prototype.slice.call(document.querySelectorAll('canvas[data-guilloche]'));
  if (!canvases.length) return;

  function token(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }

  function rosette(ctx, w, h, rgb, a) {
    var S = Math.min(w, h);
    var cx = w / 2, cy = h / 2;
    var R = 0.33 * S, r = R / 7.2, d = 0.125 * S;   // R/r = 36/5: la curva cierra en 5 vueltas
    var curves = 36, steps = 900;
    ctx.lineWidth = Math.max(0.6, S / 1300);
    for (var k = 0; k < curves; k++) {
      var rot = 2 * Math.PI * k / curves, cr = Math.cos(rot), sr = Math.sin(rot);
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (k % 6 === 0 ? a : a * 0.55).toFixed(3) + ')';
      ctx.beginPath();
      for (var i = 0; i <= steps; i++) {
        var t = 10 * Math.PI * i / steps;
        var x = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
        var y = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
        var px = cx + x * cr - y * sr, py = cy + x * sr + y * cr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
    [0.455, 0.47].forEach(function (f) {
      ctx.beginPath(); ctx.arc(cx, cy, f * S, 0, 2 * Math.PI); ctx.stroke();
    });
  }

  function band(ctx, w, h, rgb, a) {
    var cy = h / 2, amp = h * 0.36, lambda = 44, lines = 6;
    ctx.lineWidth = 0.8;
    for (var k = 0; k < lines; k++) {
      var ph = (k / lines) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (k === 0 ? a : a * 0.6).toFixed(3) + ')';
      ctx.beginPath();
      for (var x = 0; x <= w + 2; x += 2) {
        var env = 0.72 + 0.28 * Math.sin(2 * Math.PI * x / (lambda * 9));
        var y = cy + amp * env * Math.sin(2 * Math.PI * x / lambda + ph);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function draw(c) {
    var r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    var rgb = token('--guilloche', '126, 94, 47');
    var a = parseFloat(token('--guilloche-a', '0.3')) || 0.3;
    if (c.getAttribute('data-guilloche') === 'rosette') rosette(ctx, r.width, r.height, rgb, a);
    else band(ctx, r.width, r.height, rgb, a);
  }
  function drawAll() { canvases.forEach(draw); }

  if ('ResizeObserver' in window) {
    var pending = 0;
    var ro = new ResizeObserver(function () {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = 0; drawAll(); });
    });
    canvases.forEach(function (c) { ro.observe(c); });
  } else {
    window.addEventListener('resize', drawAll);
  }
  window.addEventListener('dm:theme', drawAll);
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', drawAll);
  drawAll();
})();
