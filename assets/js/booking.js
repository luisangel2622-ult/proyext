/* ==========================================================================
   Reservas: servicio → barbero → día → hora → nombre, y envío por WhatsApp.
   La ocupación de horas es de ejemplo (no hay servidor); la confirmación
   real la hace el estudio al recibir el mensaje.
   También calcula el estado "Abierto ahora" de la sección Visítanos.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.GRAFITO || {};
  var hours = cfg.hours || {};
  var services = cfg.services || [];
  var barbers = cfg.barbers || [];
  var SLOT = cfg.slotMinutes || 30;
  var CUR = cfg.currency || '$';
  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(mins) { return pad(Math.floor(mins / 60)) + ':' + pad(Math.round(mins % 60)); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function byId(id) { return document.getElementById(id); }

  /* ---------- Estado de apertura ---------- */
  function openStatus() {
    var box = byId('open-status');
    if (!box) return;
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = hours[day];
    var open = false;
    var text = 'Consulta nuestro horario';
    if (today && mins >= today[0] * 60 && mins < today[1] * 60) {
      open = true;
      text = 'Abierto ahora · cierra a las ' + hm(today[1] * 60);
    } else if (today && mins < today[0] * 60) {
      text = 'Cerrado · abre hoy a las ' + hm(today[0] * 60);
    } else {
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7;
        if (hours[d]) {
          text = 'Cerrado · abre ' + (i === 1 ? 'mañana' : 'el ' + DAY_NAMES[d]) + ' a las ' + hm(hours[d][0] * 60);
          break;
        }
      }
    }
    box.classList.toggle('is-open', open);
    box.classList.toggle('is-closed', !open);
    box.querySelector('.status__text').textContent = text;
    Array.prototype.forEach.call(document.querySelectorAll('#hours li'), function (li) {
      li.classList.toggle('is-today', li.getAttribute('data-day') === String(day));
    });
  }
  openStatus();
  setInterval(openStatus, 60000);

  /* ---------- Reservas ---------- */
  var form = byId('booker');
  if (!form) return;

  var fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  var fmtWeek = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
  var fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'short' });

  var state = { service: null, barber: null, day: null, time: null };
  var dayMap = {};
  var errorBox = byId('bk-error');
  var nameInput = byId('bk-name');
  var summaryView = byId('bk-summary');
  var doneView = byId('bk-done');

  function getService() { for (var i = 0; i < services.length; i++) if (services[i].id === state.service) return services[i]; return null; }
  function getBarber() { for (var i = 0; i < barbers.length; i++) if (barbers[i].id === state.barber) return barbers[i]; return null; }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

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

  // Servicios y barberos
  var svcBox = byId('bk-services');
  services.forEach(function (s) {
    svcBox.appendChild(makeChip('service', s.id, function (face) {
      face.appendChild(document.createTextNode(s.name));
      addText(face, 'small', s.minutes + ' min · ' + CUR + s.price);
    }));
  });
  var barBox = byId('bk-barbers');
  barbers.forEach(function (b) {
    barBox.appendChild(makeChip('barber', b.id, function (face) {
      face.appendChild(document.createTextNode(b.name));
      if (b.note) addText(face, 'small', b.note);
    }));
  });

  // Próximos 7 días con horario
  function buildDays() {
    var box = byId('bk-days');
    box.textContent = '';
    dayMap = {};
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tomorrow = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    var count = 0;
    for (var i = 0; count < 7 && i < 21; i++) {
      var day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var h = hours[day.getDay()];
      if (!h) continue;
      if (i === 0 && now.getHours() * 60 + now.getMinutes() + 30 > h[1] * 60 - 30) continue;
      var key = day.getFullYear() + '-' + pad(day.getMonth() + 1) + '-' + pad(day.getDate());
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

  // Ocupación de ejemplo, estable por día, hora y barbero
  function isBusy(dayKey, m, barber) {
    var s = dayKey + '|' + m + '|' + (barber || 'any');
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (!barber || barber === 'any') ? h % 7 === 0 : h % 4 === 0;
  }

  function buildSlots() {
    var box = byId('bk-slots');
    var hint = byId('bk-slots-hint');
    var prev = state.time;
    box.textContent = '';
    state.time = null;
    if (!state.day || !dayMap[state.day]) {
      hint.textContent = 'Elige un día para ver las horas libres.';
      updateSummary();
      return;
    }
    var day = dayMap[state.day];
    var h = hours[day.getDay()];
    var svc = getService();
    var dur = svc ? svc.minutes : SLOT;
    var now = new Date();
    var minStart = sameDay(day, now) ? now.getHours() * 60 + now.getMinutes() + 30 : -1;
    var free = 0;
    for (var m = h[0] * 60; m + dur <= h[1] * 60; m += SLOT) {
      var off = m < minStart || isBusy(state.day, m, state.barber);
      if (!off) free++;
      var c = makeChip('time', String(m), (function (mm) {
        return function (face) { face.appendChild(document.createTextNode(hm(mm))); };
      })(m), off);
      if (off) c.title = m < minStart ? 'Ya pasó' : 'Ocupado';
      box.appendChild(c);
    }
    hint.textContent = free ? '' : 'No quedan horas libres este día. Prueba con otro.';
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
    var bar = getBarber();
    setText('sum-service', svc ? svc.name : '—');
    setText('sum-barber', bar ? bar.name : '—');
    setText('sum-day', state.day && dayMap[state.day] ? cap(fmtLong.format(dayMap[state.day])) : '—');
    setText('sum-time', state.time != null ? hm(state.time) : '—');
    setText('sum-total', CUR + (svc ? svc.price : 0));
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type !== 'radio') return;
    if (t.name === 'service') { state.service = t.value; buildSlots(); }
    else if (t.name === 'barber') { state.barber = t.value; buildSlots(); }
    else if (t.name === 'day') { state.day = t.value; buildSlots(); }
    else if (t.name === 'time') { state.time = parseInt(t.value, 10); updateSummary(); }
    errorBox.textContent = '';
  });
  nameInput.addEventListener('input', function () { errorBox.textContent = ''; });

  function focusGroup(id) {
    var box = byId(id);
    var target = box.querySelector('input:not(:disabled)') || box;
    target.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    if (!state.service) { errorBox.textContent = 'Elige un servicio para continuar.'; return focusGroup('bk-services'); }
    if (!state.barber) { errorBox.textContent = 'Elige un barbero o «Sin preferencia».'; return focusGroup('bk-barbers'); }
    if (!state.day) { errorBox.textContent = 'Elige un día para tu cita.'; return focusGroup('bk-days'); }
    if (state.time == null) { errorBox.textContent = 'Elige una hora libre.'; return focusGroup('bk-slots'); }
    if (!name) {
      errorBox.textContent = 'Escribe tu nombre para continuar.';
      nameInput.focus({ preventScroll: true });
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var svc = getService();
    var bar = getBarber();
    var dayText = fmtLong.format(dayMap[state.day]);
    var who = bar.id === 'any' ? 'el primer barbero libre' : bar.name;
    var msg = 'Hola, Grafito. Quiero reservar una cita:\n'
      + '• Servicio: ' + svc.name + ' (' + svc.minutes + ' min, ' + CUR + svc.price + ')\n'
      + '• Barbero: ' + bar.name + '\n'
      + '• Día: ' + dayText + '\n'
      + '• Hora: ' + hm(state.time) + '\n'
      + '• Nombre: ' + name;

    byId('bk-whatsapp').href = 'https://wa.me/' + (cfg.whatsapp || '') + '?text=' + encodeURIComponent(msg);
    byId('done-title').textContent = 'Casi listo, ' + name + '.';
    byId('done-text').textContent = 'Tu solicitud: ' + svc.name + ' con ' + who + ', el ' + dayText + ' a las ' + hm(state.time)
      + '. Envíala por WhatsApp y te confirmamos la cita en minutos.';
    summaryView.hidden = true;
    doneView.hidden = false;
    var titleEl = byId('done-title');
    titleEl.setAttribute('tabindex', '-1');
    titleEl.focus({ preventScroll: true });
  });

  byId('bk-edit').addEventListener('click', function () {
    doneView.hidden = true;
    summaryView.hidden = false;
    var submit = form.querySelector('button[type="submit"]');
    if (submit) submit.focus({ preventScroll: true });
  });

  // API para los enlaces "Reservar" de servicios y equipo
  window.GrafitoBooking = {
    pick: function (group, value) {
      var input = byId(group + '-' + value);
      if (!input || input.disabled) return;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (!doneView.hidden) { doneView.hidden = true; summaryView.hidden = false; }
    }
  };

  buildDays();
  // Estado inicial de ejemplo: el servicio más pedido y sin preferencia de barbero
  window.GrafitoBooking.pick('service', 'signature');
  window.GrafitoBooking.pick('barber', 'any');
})();
