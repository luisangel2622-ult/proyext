/* ==========================================================================
   Portada viva: mármol que fluye (WebGL) y polvo suspendido en la luz.
   - Las vetas se mueven despacio con ruido fractal deformado en el tiempo.
   - Colores tomados del tema activo (blanco Calacatta / Nero Marquina).
   - Resolución reducida, 30 fps, pausa fuera de pantalla y con la pestaña oculta.
   - Sin WebGL, o con «reducir movimiento», queda el mármol estático de la página.
   ========================================================================== */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  var canvas = document.querySelector('.hero__canvas');
  var dustCanvas = document.querySelector('.hero__dust');
  if (!hero || !canvas) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;
  var raf = 0;
  var last = 0;
  var t0 = performance.now();

  function token(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }
  function rgb(name, fallback) {
    return token(name, fallback).split(',').map(function (n) { return parseFloat(n) / 255; });
  }

  /* ---------- Mármol vivo ---------- */
  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes; uniform float uTime; uniform float uVeinA;',
    'uniform vec3 uBase; uniform vec3 uBase2; uniform vec3 uVein; uniform vec3 uGold;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);',
    '  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes.y;',
    '  float t = uTime * 0.022;',
    '  vec2 q = vec2(fbm(uv * 1.3 + vec2(0.0, t)), fbm(uv * 1.3 + vec2(5.2, -t)));',
    '  vec2 r = vec2(fbm(uv * 1.5 + 3.0 * q + vec2(1.7, 9.2) + t * 0.7), fbm(uv * 1.5 + 3.0 * q + vec2(8.3, 2.8) - t * 0.5));',
    '  float f = fbm(uv * 1.7 + 2.6 * r);',
    '  float s = sin((uv.x + uv.y) * 3.0 + f * 7.5);',
    '  float vein = exp(-pow(s / 0.045, 2.0));',
    '  float halo = exp(-pow(s / 0.3, 2.0)) * 0.2;',
    '  float s2 = sin((uv.x * 1.4 - uv.y) * 6.5 + f * 11.0);',
    '  float fine = exp(-pow(s2 / 0.022, 2.0)) * 0.3 * smoothstep(0.35, 0.75, f);',
    '  float cloud = smoothstep(0.2, 0.9, f);',
    '  vec3 col = mix(uBase, uBase2, cloud);',
    '  col = mix(col, mix(uBase2, uVein, 0.35), halo * uVeinA);',
    '  col = mix(col, uVein, clamp((vein * 0.6 + fine) * uVeinA, 0.0, 1.0));',
    '  float gold = smoothstep(0.6, 0.82, fbm(uv * 0.9 + 7.0 + t));',
    '  col = mix(col, uGold, vein * gold * 0.4 * uVeinA);',
    '  float band = uv.x - uv.y * 0.45 - mod(uTime * 0.045, 4.0) + 1.2;',
    '  col += exp(-pow(band / 0.22, 2.0)) * 0.045;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var gl = null, prog = null, loc = {};
  if (!reduce) {
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
  }
  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  if (gl) {
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      var aP = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(aP);
      gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uTime', 'uVeinA', 'uBase', 'uBase2', 'uVein', 'uGold'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
      root.classList.add('has-live-marble');
    } catch (e) {
      gl = null;
    }
  }
  if (!gl) canvas.style.display = 'none';

  function readMarble() {
    if (!gl) return;
    gl.uniform3fv(loc.uBase, rgb('--mb-base', '254,254,252'));
    gl.uniform3fv(loc.uBase2, rgb('--mb-base2', '236,235,231'));
    gl.uniform3fv(loc.uVein, rgb('--mb-vein', '150,153,158'));
    gl.uniform3fv(loc.uGold, rgb('--mb-gold', '198,166,106'));
    gl.uniform1f(loc.uVeinA, parseFloat(token('--mb-vein-a', '0.8')) || 0.8);
  }

  /* ---------- Polvo en la luz ---------- */
  var dctx = dustCanvas && dustCanvas.getContext ? dustCanvas.getContext('2d') : null;
  var motes = [];
  var dust = { color: '190,158,100', alpha: 0.5 };
  function readDust() {
    dust.color = token('--dust', '190,158,100');
    dust.alpha = parseFloat(token('--dust-a', '0.5')) || 0.5;
  }
  function buildMotes(w, h) {
    var n = Math.round(Math.min(70, Math.max(28, w / 22)));
    motes = [];
    for (var i = 0; i < n; i++) {
      motes.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8,
        vy: 6 + Math.random() * 16,
        sway: 6 + Math.random() * 18,
        ph: Math.random() * Math.PI * 2,
        tw: 0.4 + Math.random() * 1.2
      });
    }
  }

  var W = 0, H = 0, DW = 0, DH = 0, DPR = 1;
  function resize() {
    var r = hero.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    if (gl) {
      var scale = Math.min(window.devicePixelRatio || 1, 1.5) * (W < 700 ? 0.6 : 0.5);
      canvas.width = Math.max(1, Math.round(W * scale));
      canvas.height = Math.max(1, Math.round(H * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    }
    if (dctx) {
      dustCanvas.width = Math.round(W * DPR); dustCanvas.height = Math.round(H * DPR);
      dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      DW = W; DH = H;
      buildMotes(W, H);
    }
    frame(performance.now(), true);
  }

  var prevT = 0;
  function drawDust(t, dt) {
    if (!dctx) return;
    dctx.clearRect(0, 0, DW, DH);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y -= m.vy * dt;
      if (m.y < -10) { m.y = DH + 10; m.x = Math.random() * DW; }
      var x = m.x + Math.sin(t * 0.4 + m.ph) * m.sway;
      var a = dust.alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * m.tw + m.ph)));
      dctx.beginPath();
      dctx.fillStyle = 'rgba(' + dust.color + ',' + (a * 0.25).toFixed(3) + ')';
      dctx.arc(x, m.y, m.r * 3.2, 0, 6.2832);
      dctx.fill();
      dctx.beginPath();
      dctx.fillStyle = 'rgba(' + dust.color + ',' + a.toFixed(3) + ')';
      dctx.arc(x, m.y, m.r, 0, 6.2832);
      dctx.fill();
    }
  }

  function frame(now, force) {
    var t = (now - t0) / 1000;
    var dt = prevT ? Math.min(0.1, t - prevT) : 0;
    prevT = t;
    if (gl) {
      gl.uniform1f(loc.uTime, reduce ? 40 : t + 40);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    if (!reduce || force) drawDust(t, reduce ? 0 : dt);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (now - last >= 33) { last = now; frame(now); }
    raf = requestAnimationFrame(loop);
  }
  function play() { if (!raf && !reduce && visible && !document.hidden) { prevT = 0; raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function onTheme() { readMarble(); readDust(); frame(performance.now(), true); }
  window.addEventListener('dm:theme', onTheme);
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', onTheme);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else stop();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
  if ('ResizeObserver' in window) {
    var pending = 0;
    new ResizeObserver(function () {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = 0; resize(); });
    }).observe(hero);
  } else {
    window.addEventListener('resize', resize);
  }

  readMarble();
  readDust();
  resize();
  play();
})();
