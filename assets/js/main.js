/* ==========================================================================
   Grafito Barber Studio — interacciones y escenas de scroll
   ========================================================================== */
(function () {
  'use strict';
  window.__grafitoReady = true;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cfg = window.GRAFITO || {};

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function inView(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; }

  // Progreso de una escena sticky: 0 cuando se fija arriba, 1 cuando se suelta.
  function sceneProgress(section, sticky) {
    var r = section.getBoundingClientRect();
    var range = r.height - sticky.offsetHeight;
    return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
  }

  var scenes = [];
  var measures = [];
  var ticking = false;
  function frame() { ticking = false; for (var i = 0; i < scenes.length; i++) scenes[i](); }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function measure() { for (var i = 0; i < measures.length; i++) measures[i](); }

  /* ---------- Datos dinámicos ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  function waLink(text) {
    return 'https://wa.me/' + (cfg.whatsapp || '') + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  $$('[data-whatsapp]').forEach(function (a) { a.href = waLink('Hola, Grafito. Quiero hacer una consulta.'); });
  $$('[data-plan]').forEach(function (a) {
    a.href = waLink('Hola, Grafito. Quiero unirme al Club, plan ' + a.getAttribute('data-plan') + '.');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Navegación ---------- */
  var nav = $('#nav');
  var toggle = $('.nav__toggle');
  var menu = $('#menu');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  var desktop = window.matchMedia('(min-width: 901px)');
  var onDesktop = function (m) { if (m.matches) setMenu(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);

  // Enlace activo según la sección visible
  var links = $$('.nav__links a');
  var linkFor = {};
  links.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var l = linkFor[en.target.id];
        if (l) l.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(function (s) { spy.observe(s); });
  }

  // Barra de progreso + fondo de la barra al hacer scroll
  var bar = $('.progress span');
  scenes.push(function () {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    nav.classList.toggle('is-scrolled', y > 24);
  });

  /* ---------- Revelado al hacer scroll ---------- */
  $$('[data-stagger]').forEach(function (parent) {
    Array.prototype.forEach.call(parent.children, function (child, i) {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--d', (i * 90) + 'ms');
    });
  });
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Hero ---------- */
  var heroWord = $('.hero__word');
  if (heroWord && !reduce) {
    var text = heroWord.textContent.trim();
    var title = $('#hero-title');
    if (title) title.setAttribute('aria-label', text);
    heroWord.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var ch = document.createElement('span');
      ch.className = 'ch';
      ch.setAttribute('aria-hidden', 'true');
      ch.style.setProperty('--i', String(i));
      var inner = document.createElement('span');
      inner.className = 'ch__in';
      inner.textContent = text.charAt(i);
      ch.appendChild(inner);
      heroWord.appendChild(ch);
    }
    heroWord.classList.add('is-split');
  }

  var hero = $('.hero');
  var heroContent = $('.hero__content');
  if (hero && heroContent && !reduce) {
    scenes.push(function () {
      var h = hero.offsetHeight;
      var y = window.scrollY;
      if (y > h * 1.1) return;
      var p = clamp(y / h, 0, 1);
      heroContent.style.transform = 'translate3d(0,' + (p * 140).toFixed(1) + 'px,0) scale(' + (1 - p * 0.08).toFixed(4) + ')';
      heroContent.style.opacity = clamp(1 - p * 1.3, 0, 1).toFixed(3);
    });
  }

  /* ---------- Manifiesto palabra a palabra ---------- */
  function splitWords(el) {
    var words = [];
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        });
      } else if (node.nodeType === 1) {
        node.classList.add('w');
        frag.appendChild(node);
        words.push(node);
      }
    });
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
    return words;
  }

  var stmt = $('.statement');
  var stmtText = $('[data-words]');
  if (stmt && stmtText && !reduce) {
    var words = splitWords(stmtText);
    var lastLit = -1;
    scenes.push(function () {
      if (!inView(stmt)) return;
      var r = stmt.getBoundingClientRect();
      var lead = window.innerHeight * 0.6;
      var range = r.height - window.innerHeight;
      var p = clamp((lead - r.top) / (lead + range), 0, 1);
      var lit = Math.round(words.length * clamp(p / 0.85, 0, 1));
      if (lit === lastLit) return;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-on', i < lit);
      lastLit = lit;
    });
  }

  /* ---------- Navaja que se abre con el scroll ---------- */
  var razor = $('.razor');
  if (razor) {
    var rzSticky = $('.razor__sticky');
    var rzBody = $('#razor-body');
    var rzBlade = $('#razor-blade');
    var rzSheen = $('#rz-sheen');
    var rzShadow = $('#razor-shadow');
    var rzHalo = $('.razor__halo');
    var rzSpecs = $$('.razor__specs li');
    var setRazor = function (p) {
      var o = easeInOut(clamp((p - 0.04) / 0.5, 0, 1));
      var a = 180 * (1 - o);
      var tx = -lerp(200, 18, o);
      var ty = 170 * Math.sin(a * Math.PI / 180);
      rzBody.setAttribute('transform',
        'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') rotate(' + lerp(-9, -2, o).toFixed(2) + ') scale(' + lerp(0.88, 1, o).toFixed(4) + ')');
      rzBlade.setAttribute('transform', 'rotate(' + a.toFixed(2) + ')');
      var sx = lerp(120, -560, clamp((p - 0.42) / 0.4, 0, 1));
      rzSheen.setAttribute('x1', sx.toFixed(1));
      rzSheen.setAttribute('x2', (sx - 170).toFixed(1));
      rzShadow.setAttribute('opacity', (0.15 + o * 0.65).toFixed(3));
      rzHalo.style.setProperty('--halo', o.toFixed(3));
      rzHalo.style.setProperty('--halo-s', (0.6 + o * 0.5).toFixed(3));
      rzSpecs.forEach(function (li, i) { li.classList.toggle('is-on', p > 0.52 + i * 0.07); });
    };
    if (reduce) {
      setRazor(1);
    } else {
      setRazor(0);
      scenes.push(function () { if (inView(razor)) setRazor(sceneProgress(razor, rzSticky)); });
    }
  }

  /* ---------- Contadores ---------- */
  function numberFormat(dec) {
    try { return new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    catch (e) { return { format: function (v) { return v.toFixed(dec); } }; }
  }
  if (!reduce && 'IntersectionObserver' in window) {
    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var fmt = numberFormat(dec);
      el.textContent = fmt.format(0);
      var obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        var start = performance.now();
        (function tick(now) {
          var k = clamp((now - start) / 1800, 0, 1);
          el.textContent = fmt.format(target * easeOut(k));
          if (k < 1) requestAnimationFrame(tick);
        })(start);
      }, { threshold: 0.6 });
      obs.observe(el);
    });
  }

  /* ---------- Ritual: scroll horizontal ---------- */
  var ritual = $('.ritual');
  if (ritual && !reduce) {
    var rSticky = $('.ritual__sticky');
    var track = $('.ritual__track');
    var steps = $$('.step', track);
    var rBar = $('.ritual__bar span');
    var rx = 0;
    ritual.classList.add('is-scrubbed');
    var measureRitual = function () {
      var last = steps[steps.length - 1];
      var pad = parseFloat(getComputedStyle(track).paddingRight) || 0;
      rx = Math.max(0, Math.round(last.offsetLeft + last.offsetWidth + pad - window.innerWidth));
      ritual.style.setProperty('--ritual-x', rx + 'px');
    };
    measureRitual();
    measures.push(measureRitual);
    scenes.push(function () {
      if (!inView(ritual)) return;
      var p = sceneProgress(ritual, rSticky);
      track.style.transform = 'translate3d(' + (-p * rx).toFixed(1) + 'px,0,0)';
      if (rBar) rBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var active = Math.round(p * (steps.length - 1));
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === active); });
    });
  }

  /* ---------- Reseñas en bucle ---------- */
  if (!reduce) {
    $$('.marquee').forEach(function (m) {
      var mTrack = $('.marquee__track', m);
      Array.prototype.slice.call(mTrack.children).forEach(function (c) {
        var clone = c.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        mTrack.appendChild(clone);
      });
      m.style.setProperty('--dur', (mTrack.children.length / 2) * 9 + 's');
      m.classList.add('is-running');
    });
  }

  /* ---------- Microinteracciones ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px');
        el.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }
  if (fine) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty('--x', x.toFixed(0) + 'px');
        card.style.setProperty('--y', y.toFixed(0) + 'px');
        if (!reduce) {
          card.style.setProperty('--ry', ((x / r.width - 0.5) * 6).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y / r.height) * 6).toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Club: mensual / anual ---------- */
  function tweenNumber(el, from, to) {
    if (reduce || from === to) { el.textContent = String(to); return; }
    var start = performance.now();
    (function tick(now) {
      var k = clamp((now - start) / 700, 0, 1);
      el.textContent = String(Math.round(lerp(from, to, easeOut(k))));
      if (k < 1) requestAnimationFrame(tick);
    })(start);
  }
  var billing = $('.billing');
  if (billing) {
    var bBtns = $$('button', billing);
    var mode = 'monthly';
    var placeThumb = function () {
      var b = $('[aria-pressed="true"]', billing);
      if (!b) return;
      billing.style.setProperty('--tw', b.offsetWidth + 'px');
      billing.style.setProperty('--tx', b.offsetLeft + 'px');
    };
    var setMode = function (m) {
      mode = m;
      bBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-billing') === m)); });
      placeThumb();
      $$('.plan').forEach(function (plan) {
        var price = $('[data-price]', plan);
        var note = $('.plan__note', plan);
        tweenNumber(price, parseFloat(price.textContent) || 0, parseFloat(price.getAttribute('data-' + m)));
        note.textContent = note.getAttribute(m === 'annual' ? 'data-note-annual' : 'data-note-monthly');
      });
    };
    bBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.getAttribute('data-billing');
        if (m !== mode) setMode(m);
      });
    });
    placeThumb();
    billing.classList.add('is-ready');
    measures.push(placeThumb);
  }

  /* ---------- Enlaces "Reservar" que preseleccionan ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-pick-service], [data-pick-barber]');
    if (!a || !window.GrafitoBooking) return;
    if (a.hasAttribute('data-pick-service')) window.GrafitoBooking.pick('service', a.getAttribute('data-pick-service'));
    if (a.hasAttribute('data-pick-barber')) window.GrafitoBooking.pick('barber', a.getAttribute('data-pick-barber'));
  });

  /* ---------- Arranque ---------- */
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { measure(); request(); });
  window.addEventListener('load', function () { measure(); request(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); request(); });
  request();
})();
