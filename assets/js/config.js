/* ==========================================================================
   Datos del negocio. Edita este archivo para cambiar WhatsApp, horario,
   servicios y barberos del sistema de reservas.
   ========================================================================== */
window.GRAFITO = {
  name: 'Grafito Barber Studio',

  // Número de WhatsApp en formato internacional, solo dígitos (sin +, espacios ni guiones).
  // Ejemplo México: 5215512345678 · Colombia: 573001234567 · España: 34600123456
  whatsapp: '15550142014',

  currency: '$',

  // Horario por día (0 = domingo … 6 = sábado): [apertura, cierre] en horas.
  // Usa decimales para medias horas (9.5 = 09:30). Pon null si ese día cierras.
  hours: {
    0: [10, 15],
    1: [10, 21],
    2: [10, 21],
    3: [10, 21],
    4: [10, 21],
    5: [10, 21],
    6: [9, 20]
  },

  // Cada cuántos minutos empieza una cita.
  slotMinutes: 30,

  services: [
    { id: 'signature', name: 'Corte Signature', minutes: 45, price: 35 },
    { id: 'fade', name: 'Fade de Precisión', minutes: 40, price: 30 },
    { id: 'barba', name: 'Barba Escultural', minutes: 30, price: 22 },
    { id: 'afeitado', name: 'Afeitado Clásico', minutes: 35, price: 25 },
    { id: 'color', name: 'Color & Canas', minutes: 50, price: 40 },
    { id: 'ritual', name: 'Ritual Grafito', minutes: 90, price: 65 },
    { id: 'ninos', name: 'Corte Niños', minutes: 30, price: 20 }
  ],

  barbers: [
    { id: 'any', name: 'Sin preferencia', note: 'El primero libre' },
    { id: 'andres', name: 'Andrés', note: 'Fundador' },
    { id: 'diego', name: 'Diego', note: 'Barbas' },
    { id: 'sofia', name: 'Sofía', note: 'Texturas y color' },
    { id: 'mateo', name: 'Mateo', note: 'Clásicos y niños' }
  ]
};
