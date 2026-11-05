/* ==========================================================================
   Don Morell — tema claro/oscuro, navegación, escenas de scroll e interacciones
   ========================================================================== */
(function () {
  'use strict';
  window.__dmReady = true;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cfg = window.DONMORELL || {};

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
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

  /* ---------- Tema claro / oscuro ---------- */
  var themeBtn = $('.theme-toggle');
  var themeMetas = $$('meta[name="theme-color"]');
  function isDark() { return getComputedStyle(root).getPropertyValue('--is-dark').trim() === '1'; }
  function syncTheme() {
    var dark = isDark();
    if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    if (root.hasAttribute('data-theme')) {
      var bg = getComputedStyle(document.body).backgroundColor;
      themeMetas.forEach(function (m) { m.setAttribute('content', bg); });
    }
    window.dispatchEvent(new CustomEvent('dm:theme', { detail: { dark: dark } }));
  }
  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('dm-theme', next); } catch (e) {}
    syncTheme();
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      if (!document.startViewTransition || reduce) { applyTheme(next); return; }
      var r = themeBtn.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.classList.add('theme-shift');
      var vt = document.startViewTransition(function () { applyTheme(next); });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
      vt.finished.finally(function () { root.classList.remove('theme-shift'); });
    });
  }
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  if (mqDark.addEventListener) mqDark.addEventListener('change', syncTheme);
  // Un visor externo (por ejemplo, la vista previa) también puede cambiar el tema
  new MutationObserver(function () { syncTheme(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  syncTheme();

  /* ---------- Datos dinámicos ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  var waBase = 'https://wa.me/' + (cfg.whatsapp || '');
  $$('[data-whatsapp]').forEach(function (a) {
    a.href = waBase + '?text=' + encodeURIComponent('Hola, Don Morell. Quiero información para agendar una cita.');
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
  if (desktop.addEventListener) desktop.addEventListener('change', function (m) { if (m.matches) setMenu(false); });

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

  // Fondo de la barra, marca de la barra y progreso de lectura
  var bar = $('.progress span');
  var medal = $('.medal');
  scenes.push(function () {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    nav.classList.toggle('is-scrolled', y > 24);
    var medalGone = medal ? medal.getBoundingClientRect().bottom < 72 : y > 300;
    nav.classList.toggle('show-brand', medalGone);
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

  /* ---------- Portada: la medalla se aleja con el scroll ---------- */
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
      rzShadow.style.setProperty('--o', (0.15 + o * 0.65).toFixed(3));
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

  /* ---------- «Reservar» en cada servicio preselecciona la reserva ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-pick-service]');
    if (a && window.DMBooking) window.DMBooking.pick('service', a.getAttribute('data-pick-service'));
  });

  /* ---------- Arranque ---------- */
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { measure(); request(); });
  window.addEventListener('load', function () { measure(); request(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); request(); });
  request();
})();
