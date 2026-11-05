# Don Morell · sitio web

Sitio de **Don Morell**, barbería de caballeros en Plaza Marfil, Tuxtla Gutiérrez. HTML, CSS y JavaScript puros: sin dependencias ni paso de compilación.

## Qué incluye

| Sección | Qué hace |
|---|---|
| Portada | El logo como medallón dentro de un bisel de reloj que gira; hebras de cabello animadas que se apartan con el cursor; botones **Reservar cita** y **Llamar**; estado «Abierto ahora / Cerrado» calculado con el horario real. |
| El estudio | Texto que se ilumina palabra a palabra al hacer scroll. |
| La herramienta | Navaja en SVG, con el nombre grabado, que se abre con el scroll. |
| Horario en breve | Lunes a viernes, sábado, domingo y ubicación de un vistazo. |
| Servicios | Tarjetas tipo *bento* con escala de peines del fade, ángulo del afeitado y combo Corte + Barba. |
| El ritual | Los cinco pasos del servicio en un carrusel horizontal guiado por el scroll. |
| Reservas | Servicio → día → hora (agrupada en mañana, tarde y noche) → nombre y nota. Genera el mensaje y lo abre en WhatsApp. |
| Ubicación | Dirección, horario con el día de hoy marcado y botones Cómo llegar, Llamar y WhatsApp. |
| Redes | Instagram, Facebook y WhatsApp. |

**Modo claro y oscuro.** La web sigue el modo del dispositivo y tiene un botón (luna / sol) en la barra que recuerda la elección. El cambio se hace con un revelado circular en navegadores compatibles. Los dos temas salen de los mismos tokens de color en `assets/css/base.css`: claro «Marfil» y oscuro «Ébano».

**Logo.** Está vectorizado en `assets/img/logo-don-morell.svg`, con las letras reconstruidas en Cinzel (de la misma familia romana que el original). Así se ve nítido a cualquier tamaño. También se generaron el favicon, el icono para iPhone y la imagen para compartir en redes.

Funciona en móvil, tableta y escritorio. Se puede usar con teclado y lector de pantalla, respeta la opción «reducir movimiento» y muestra todo el contenido aunque JavaScript esté desactivado.

## Estructura

```
index.html
assets/
  css/  base.css · hero.css · sections.css · booking.css
  js/   config.js · main.js · hero-canvas.js · booking.js
  img/  logo-don-morell.svg · favicon.svg · apple-touch-icon.png · og-don-morell.png
```

## Verla en tu computador

```bash
python3 -m http.server 8000
```

Luego entra en http://localhost:8000

## Publicarla gratis con GitHub Pages

1. Fusiona esta rama en `main`.
2. En GitHub: **Settings → Pages → Build and deployment**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. En un par de minutos estará en `https://luisangel2622-ult.github.io/proyext/`.

## Antes de publicar

| Qué | Dónde |
|---|---|
| **Precios y duraciones** (ahora son de ejemplo) | `assets/js/config.js` y las tarjetas de servicios en `index.html` |
| Número de WhatsApp (se usó el mismo que el de llamadas) | `assets/js/config.js` → `whatsapp` |
| Días festivos o vacaciones sin servicio | `assets/js/config.js` → `closedDates` |
| Horario | `assets/js/config.js` → `hours`, y los textos de horario en `index.html` |
| Aviso «Vista previa» | Borra la línea `<p class="demo-pill">` al final de `index.html` cuando los precios sean los reales |

## Notas

- **Reservas:** no hay servidor. El cliente envía la solicitud por WhatsApp y la barbería la confirma. Los horarios ya pasados del día se desactivan solos.
- **«Abierto ahora»:** se calcula con la hora del dispositivo de quien visita la web.
- **Tipografías:** Geist (texto), Cinzel (marca y etiquetas), Cormorant Garamond (acentos en cursiva) y Geist Mono (datos), desde Google Fonts.
