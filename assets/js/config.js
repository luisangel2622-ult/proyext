/* ==========================================================================
   Datos de Don Morell. Edita este archivo para cambiar teléfono, WhatsApp,
   horario, días cerrados y los servicios del sistema de reservas.
   ========================================================================== */
window.DONMORELL = {
  name: 'Don Morell',

  // Teléfono para mostrar y número de WhatsApp (formato internacional, solo dígitos).
  phone: '+52 961 283 2818',
  whatsapp: '529612832818',

  currency: '$',

  // Horario por día (0 = domingo … 6 = sábado): [apertura, cierre] en horas.
  // 10.5 = 10:30 a.m. · 20.5 = 8:30 p.m. · null = cerrado.
  hours: {
    0: null,
    1: [10.5, 20.5],
    2: [10.5, 20.5],
    3: [10.5, 20.5],
    4: [10.5, 20.5],
    5: [10.5, 20.5],
    6: [9, 20]
  },

  // Días que no se abre aunque toque por horario (festivos, vacaciones).
  // Formato 'AAAA-MM-DD', por ejemplo: ['2026-12-25', '2027-01-01']
  closedDates: [],

  // Cada cuántos minutos empieza una cita.
  slotMinutes: 30,

  // Precios y duraciones DE EJEMPLO: cámbialos por los reales.
  // Si cambias un precio aquí, cámbialo también en la tarjeta de index.html.
  services: [
    { id: 'corte', name: 'Corte de cabello', minutes: 45, price: 200 },
    { id: 'fade', name: 'Fade / Degradado', minutes: 45, price: 220 },
    { id: 'barba', name: 'Arreglo de barba', minutes: 30, price: 150 },
    { id: 'afeitado', name: 'Afeitado clásico', minutes: 35, price: 180 },
    { id: 'cejas', name: 'Cejas y detalles', minutes: 15, price: 60 },
    { id: 'nino', name: 'Corte niño', minutes: 30, price: 150 },
    { id: 'combo', name: 'Corte + Barba', minutes: 75, price: 320 }
  ]
};
