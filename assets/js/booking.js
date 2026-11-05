/* ==========================================================================
   Reservas de Don Morell: servicio → día → hora → datos, y envío por WhatsApp.
   No hay servidor: la barbería confirma la cita al recibir el mensaje.
   También calcula el estado «Abierto ahora / Cerrado» de la portada y de Ubicación.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.DONMORELL || {};
  var hours = cfg.hours || {};
  var services = cfg.services || [];
  var closed = cfg.closedDates || [];
  var SLOT = cfg.slotMinutes || 30;
  var CUR = cfg.currency || '$';
  var PHONE = cfg.phone || '';
  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function byId(id) { return document.getElementById(id); }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function sameDay(a, b) { return keyOf(a) === keyOf(b); }

  // 630 → "10:30" · 1050 → "5:30"
  function clock(mins) {
    var h = Math.floor(mins / 60) % 24;
    var m = Math.round(mins % 60);
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + pad(m);
  }
  function ampm(mins) { return Math.floor(mins / 60) % 24 < 12 ? 'a.m.' : 'p.m.'; }
  function time12(mins) { return clock(mins) + ' ' + ampm(mins); }

  function rangeFor(date) {
    if (closed.indexOf(keyOf(date)) !== -1) return null;
    return hours[date.getDay()] || null;
  }

  /* ---------- Estado de apertura ---------- */
  function openStatus() {
    var boxes = document.querySelectorAll('[data-status]');
    if (!boxes.length) return;
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = rangeFor(now);
    var open = false;
    var text = 'Lunes a sábado';
    if (today && mins >= today[0] * 60 && mins < today[1] * 60) {
      open = true;
      text = 'Abierto ahora · cierra a las ' + time12(today[1] * 60);
    } else if (today && mins < today[0] * 60) {
      text = 'Cerrado · abre hoy a las ' + time12(today[0] * 60);
    } else {
      for (var i = 1; i <= 14; i++) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        var r = rangeFor(d);
        if (r) {
          text = 'Cerrado · abre ' + (i === 1 ? 'mañana' : 'el ' + DAY_NAMES[d.getDay()]) + ' a las ' + time12(r[0] * 60);
          break;
        }
      }
    }
    Array.prototype.forEach.call(boxes, function (box) {
      box.classList.toggle('is-open', open);
      box.classList.toggle('is-closed', !open);
      var t = box.querySelector('.status__text');
      if (t) t.textContent = text;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#hours li'), function (li) {
      li.classList.toggle('is-today', li.getAttribute('data-day') === String(now.getDay()));
    });
  }
  openStatus();
  setInterval(openStatus, 60000);

  /* ---------- Reservas ---------- */
  var form = byId('booker');
  if (!form) return;

  var fmtLong = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  var fmtWeek = new Intl.DateTimeFormat('es-MX', { weekday: 'short' });
  var fmtMonth = new Intl.DateTimeFormat('es-MX', { month: 'short' });

  var state = { service: null, day: null, time: null };
  var dayMap = {};
  var errorBox = byId('bk-error');
  var nameInput = byId('bk-name');
  var noteInput = byId('bk-note');
  var summaryView = byId('bk-summary');
  var doneView = byId('bk-done');
  var summaryBox = form.querySelector('.summary');
  var bar = byId('bk-bar');
  var barTitle = byId('bar-title');
  var barSub = byId('bar-sub');
  var narrow = window.matchMedia('(max-width: 960px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getService() {
    for (var i = 0; i < services.length; i++) if (services[i].id === state.service) return services[i];
    return null;
  }
  function longDay(d) { return fmtLong.format(d).replace(',', ''); }
  function shortDay(d) { return cap(fmtWeek.format(d).replace('.', '')) + ' ' + d.getDate() + ' ' + fmtMonth.format(d).replace('.', ''); }

  function makeChip(group, value, build, disabled) {
    var label = document.createElement('label');
    label.className = 'chip';
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = group;
    input.value = value;
    input.id = group + '-' + value;
    if (disabled) input.disabled = true;
    var face = document.createElement('span');
    face.className = 'chip__face';
    build(face);
    label.appendChild(input);
    label.appendChild(face);
    return label;
  }
  function addText(parent, tag, text) {
    var e = document.createElement(tag);
    e.textContent = text;
    parent.appendChild(e);
    return e;
  }

  // Servicios
  var svcBox = byId('bk-services');
  services.forEach(function (s) {
    svcBox.appendChild(makeChip('service', s.id, function (face) {
      face.appendChild(document.createTextNode(s.name));
      addText(face, 'small', s.minutes + ' min · ' + CUR + s.price);
    }));
  });

  // Próximos 7 días con servicio
  function buildDays() {
    var box = byId('bk-days');
    box.textContent = '';
    dayMap = {};
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tomorrow = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    var count = 0;
    for (var i = 0; count < 7 && i < 28; i++) {
      var day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var h = rangeFor(day);
      if (!h) continue;
      if (i === 0 && now.getHours() * 60 + now.getMinutes() + 30 > h[1] * 60 - 30) continue;
      var key = keyOf(day);
      dayMap[key] = day;
      count++;
      box.appendChild(makeChip('day', key, (function (d) {
        return function (face) {
          var top = sameDay(d, now) ? 'Hoy' : sameDay(d, tomorrow) ? 'Mañana' : cap(fmtWeek.format(d).replace('.', ''));
          addText(face, 'small', top);
          addText(face, 'b', String(d.getDate()));
          addText(face, 'small', fmtMonth.format(d).replace('.', ''));
        };
      })(day)));
    }
  }

  // Horas del día elegido, agrupadas en mañana, tarde y noche
  function buildSlots() {
    var box = byId('bk-slots');
    var hint = byId('bk-slots-hint');
    var prev = state.time;
    box.textContent = '';
    state.time = null;
    if (!state.day || !dayMap[state.day]) {
      hint.textContent = 'Elige un día para ver los horarios.';
      updateSummary();
      return;
    }
    var day = dayMap[state.day];
    var h = rangeFor(day);
    var svc = getService();
    var dur = svc ? svc.minutes : SLOT;
    var now = new Date();
    var minStart = sameDay(day, now) ? now.getHours() * 60 + now.getMinutes() + 30 : -1;
    var groups = [
      { label: 'Mañana', from: 0, to: 12 * 60, items: [] },
      { label: 'Tarde', from: 12 * 60, to: 18 * 60, items: [] },
      { label: 'Noche', from: 18 * 60, to: 24 * 60, items: [] }
    ];
    var free = 0;
    for (var m = h[0] * 60; m + dur <= h[1] * 60; m += SLOT) {
      var past = m < minStart;
      if (!past) free++;
      var chip = makeChip('time', String(m), (function (mm) {
        return function (face) { face.appendChild(document.createTextNode(clock(mm))); };
      })(m), past);
      chip.querySelector('input').setAttribute('aria-label', time12(m));
      if (past) chip.title = 'Ya pasó';
      for (var g = 0; g < groups.length; g++) if (m >= groups[g].from && m < groups[g].to) groups[g].items.push(chip);
    }
    groups.forEach(function (g) {
      if (!g.items.length) return;
      var wrap = document.createElement('div');
      wrap.className = 'slot-group';
      addText(wrap, 'p', g.label).className = 'slot-group__label';
      var grid = document.createElement('div');
      grid.className = 'slot-group__grid';
      g.items.forEach(function (c) { grid.appendChild(c); });
      wrap.appendChild(grid);
      box.appendChild(wrap);
    });
    hint.textContent = free ? '' : 'Ya no quedan horarios hoy. Elige otro día.';
    if (prev != null) {
      var keep = byId('time-' + prev);
      if (keep && !keep.disabled) { keep.checked = true; state.time = prev; }
    }
    updateSummary();
  }

  function setText(id, value) {
    var e = byId(id);
    if (e.textContent === value) return;
    e.textContent = value;
    e.classList.remove('is-set');
    void e.offsetWidth;
    if (value !== '—') e.classList.add('is-set');
  }
  function updateSummary() {
    var svc = getService();
    setText('sum-service', svc ? svc.name : '—');
    setText('sum-day', state.day && dayMap[state.day] ? cap(longDay(dayMap[state.day])) : '—');
    setText('sum-time', state.time != null ? time12(state.time) : '—');
    setText('sum-length', svc ? svc.minutes + ' min' : '—');
    setText('sum-total', CUR + (svc ? svc.price : 0));
    if (bar) {
      barTitle.textContent = svc ? svc.name : 'Elige un servicio';
      var when = state.day && dayMap[state.day] ? shortDay(dayMap[state.day]) : '';
      var parts = [];
      if (svc) parts.push(CUR + svc.price);
      if (when) parts.push(when);
      parts.push(state.time != null ? time12(state.time) : when ? 'elige la hora' : 'elige día y hora');
      barSub.textContent = parts.join(' · ');
      barSub.classList.remove('is-error');
    }
  }

  // Barra fija en móvil: visible mientras eliges y el resumen no está a la vista
  var stepsOn = false;
  var summaryOn = false;
  function syncBar() {
    if (!bar) return;
    var on = narrow.matches && stepsOn && !summaryOn && doneView.hidden;
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', String(!on));
    if (on) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
    document.documentElement.classList.toggle('bar-on', on);
  }
  if (bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { stepsOn = en[0].isIntersecting; syncBar(); }).observe(form.querySelector('.booker__steps'));
    new IntersectionObserver(function (en) { summaryOn = en[0].isIntersecting; syncBar(); }, { threshold: 0.35 }).observe(summaryBox);
    if (narrow.addEventListener) narrow.addEventListener('change', syncBar);
    byId('bar-go').addEventListener('click', function () {
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
  }
  function fail(msg, focusId) {
    errorBox.textContent = msg;
    if (bar) { barSub.textContent = msg; barSub.classList.add('is-error'); }
    if (focusId) focusGroup(focusId);
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type !== 'radio') return;
    if (t.name === 'service') { state.service = t.value; buildSlots(); }
    else if (t.name === 'day') { state.day = t.value; buildSlots(); }
    else if (t.name === 'time') { state.time = parseInt(t.value, 10); updateSummary(); }
    errorBox.textContent = '';
  });
  nameInput.addEventListener('input', function () { errorBox.textContent = ''; if (barSub.classList.contains('is-error')) updateSummary(); });

  function focusGroup(id) {
    var box = byId(id);
    var target = box.querySelector('input:not(:disabled)') || box;
    target.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var note = noteInput ? noteInput.value.trim() : '';
    if (!state.service) return fail('Elige un servicio para continuar.', 'bk-services');
    if (!state.day) return fail('Elige el día de tu cita.', 'bk-days');
    if (state.time == null) return fail('Elige un horario.', 'bk-slots');
    if (!name) {
      fail('Escribe tu nombre para continuar.');
      nameInput.focus({ preventScroll: true });
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var svc = getService();
    var dayText = longDay(dayMap[state.day]);
    var lines = [
      'Hola, Don Morell. Quiero agendar una cita:',
      '• Servicio: ' + svc.name + ' (' + svc.minutes + ' min, ' + CUR + svc.price + ')',
      '• Día: ' + dayText,
      '• Hora: ' + time12(state.time),
      '• Nombre: ' + name
    ];
    if (note) lines.push('• Nota: ' + note);

    byId('bk-whatsapp').href = 'https://wa.me/' + (cfg.whatsapp || '') + '?text=' + encodeURIComponent(lines.join('\n'));
    byId('done-title').textContent = 'Casi listo, ' + name + '.';
    // time12 ya termina en «a.m.» / «p.m.», que cierra la frase
    byId('done-text').textContent = 'Tu solicitud: ' + svc.name + ', el ' + dayText + ' a las ' + time12(state.time)
      + ' Envíala por WhatsApp y te confirmamos la cita.';
    summaryView.hidden = true;
    doneView.hidden = false;
    var titleEl = byId('done-title');
    titleEl.setAttribute('tabindex', '-1');
    titleEl.focus({ preventScroll: true });
    syncBar();
    if (narrow.matches) summaryBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  byId('bk-edit').addEventListener('click', function () {
    doneView.hidden = true;
    summaryView.hidden = false;
    syncBar();
    var submit = form.querySelector('button[type="submit"]');
    if (submit) submit.focus({ preventScroll: true });
  });

  // API para los enlaces «Reservar» de cada servicio
  window.DMBooking = {
    pick: function (group, value) {
      var input = byId(group + '-' + value);
      if (!input || input.disabled) return;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (!doneView.hidden) { doneView.hidden = true; summaryView.hidden = false; }
    }
  };

  buildDays();
  window.DMBooking.pick('service', 'corte');
  if (PHONE) form.setAttribute('data-phone', PHONE);
})();
