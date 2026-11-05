/* ==========================================================================
   Portada: hebras de cabello generativas en canvas.
   Toman su color del tema activo (marfil sobre ébano / tinta sobre marfil),
   con alguna hebra champán, un brillo que recorre la melena y el cursor que
   la peina al pasar.
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.querySelector('.hero__canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, DPR = 1;
  var strands = [];
  var raf = 0;
  var visible = true;
  var t0 = performance.now();
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, k: 0, kt: 0 };
  var color = { base: '205,212,222', accent: '220,198,156', alpha: 1 };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function readTheme() {
    var cs = getComputedStyle(root);
    color.base = (cs.getPropertyValue('--strand') || '205,212,222').trim();
    color.accent = (cs.getPropertyValue('--strand-accent') || '220,198,156').trim();
    color.alpha = parseFloat(cs.getPropertyValue('--strand-alpha')) || 1;
  }

  function build() {
    var count = Math.round(Math.min(170, Math.max(56, W / 8.5)));
    strands = [];
    for (var i = 0; i < count; i++) {
      var u = i / (count - 1);
      strands.push({
        u: u,
        x: (-0.06 + u * 1.12) * W,
        phase: rand(0, Math.PI * 2),
        amp: rand(10, 26),
        freq: rand(0.0035, 0.0065),
        speed: rand(0.25, 0.55),
        width: Math.random() < 0.14 ? 1.15 : 0.6,
        gold: Math.random() < 0.07,
        base: rand(0.05, 0.16)
      });
    }
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
    draw(reduce ? t0 + 4000 : performance.now());
  }

  function draw(now) {
    var t = (now - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.09;
    mouse.y += (mouse.ty - mouse.y) * 0.09;
    mouse.k += (mouse.kt - mouse.k) * 0.06;

    ctx.clearRect(0, 0, W, H);
    var step = W < 600 ? 18 : 14;
    var sheen = ((t * 0.07) % 1.6) - 0.3;
    var R = Math.max(110, Math.min(W, H) * 0.22);
    var R2 = 2 * R * R;

    for (var i = 0; i < strands.length; i++) {
      var s = strands[i];
      var d = s.u - sheen;
      var alpha = (s.base + Math.exp(-(d * d) / 0.006) * 0.45) * color.alpha;

      ctx.beginPath();
      for (var y = -20; y <= H + 20; y += step) {
        var yy = y / H;
        var x = s.x
          + Math.sin(y * s.freq + t * s.speed + s.phase) * s.amp
          + Math.sin(y * 0.0022 + t * 0.35 + s.u * 4.2) * 46 * (0.4 + yy);
        if (mouse.k > 0.01) {
          var dx = x - mouse.x, dy = y - mouse.y;
          x += dx * 0.85 * mouse.k * Math.exp(-(dx * dx + dy * dy) / R2);
        }
        if (y === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth = s.width;
      ctx.strokeStyle = s.gold
        ? 'rgba(' + color.accent + ',' + Math.min(1, alpha * 1.8).toFixed(3) + ')'
        : 'rgba(' + color.base + ',' + alpha.toFixed(3) + ')';
      ctx.stroke();
    }
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function play() { if (!raf && !reduce && visible && !document.hidden) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - r.left;
    mouse.ty = e.clientY - r.top;
    if (mouse.kt === 0) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    mouse.kt = e.pointerType === 'mouse' ? 1 : 0.6;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.kt = 0; });
  window.addEventListener('blur', function () { mouse.kt = 0; });

  // Cambio de tema: botón de la página, preferencia del sistema o visor externo
  function onTheme() { readTheme(); if (!raf) draw(reduce ? t0 + 4000 : performance.now()); }
  window.addEventListener('dm:theme', onTheme);
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', onTheme);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else stop();
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });

  if ('ResizeObserver' in window) {
    var pending = 0;
    new ResizeObserver(function () {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = 0; resize(); });
    }).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  readTheme();
  resize();
  play();
})();
