# Grafito Barber Studio · sitio web

Landing de barbería premium con estética Apple: fondo grafito, acentos de latón y escenas que se animan con el scroll. HTML, CSS y JavaScript puros, sin dependencias ni paso de compilación.

## Qué incluye

| Sección | Qué hace |
|---|---|
| Hero | Hebras de cabello generativas en canvas que se apartan al pasar el cursor; título con gradiente de acero que entra letra a letra. |
| Manifiesto | El texto se ilumina palabra a palabra mientras haces scroll. |
| La herramienta | Una navaja en SVG se abre con el scroll y revela los datos del protocolo (hoja nueva, 30°, 45 °C, 0,1 mm). |
| Cifras | Contadores animados. |
| Servicios | Cuadrícula tipo *bento* con foco de luz y leve inclinación 3D al pasar el ratón; escala de peines del fade, ángulo del afeitado y tonos de color. |
| Ritual | Los cinco pasos del servicio en un carrusel horizontal guiado por el scroll. |
| Equipo, Reseñas, Club | Tarjetas del equipo, reseñas en bucle y planes con interruptor mensual/anual. |
| Reservas | Servicio, barbero, día y hora, con resumen en vivo; genera el mensaje y lo abre en WhatsApp. |
| Visítanos | Mapa estilizado, horario con el día de hoy marcado y estado «Abierto ahora / Cerrado». |

Funciona en móvil, tableta y escritorio; se puede usar con teclado y lector de pantalla; respeta la opción del sistema «reducir movimiento» y muestra todo el contenido aunque JavaScript esté desactivado.

## Estructura

```
index.html
assets/
  css/  base.css · hero.css · sections.css · booking.css
  js/   config.js · main.js · hero-canvas.js · booking.js
  img/  favicon.svg
```

## Verla en tu computador

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8000
```

Luego entra en http://localhost:8000

## Publicarla gratis con GitHub Pages

1. Fusiona esta rama en `main`.
2. En GitHub: **Settings → Pages → Build and deployment**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. En un par de minutos estará en `https://luisangel2622-ult.github.io/proyext/`.

## Antes de publicar: cambia los datos de ejemplo

Los textos, precios, nombres, cifras y reseñas son **de ejemplo**. No publiques reseñas o cifras inventadas: usa las reales de tu negocio.

| Qué | Dónde |
|---|---|
| Número de WhatsApp, horario, servicios, precios y barberos del sistema de reservas | `assets/js/config.js` |
| Nombre, textos, precios de las tarjetas, dirección, teléfono y email | `index.html` |
| Cifras (años, cortes, valoración, reseñas) | `index.html`, bloque `CIFRAS` y título de `RESEÑAS` |
| Reseñas | `index.html`, bloque `RESEÑAS` (copia tus reseñas reales de Google) |
| Fotos del equipo | Dentro de cada `.barber__portrait` añade `<img src="assets/img/andres.jpg" alt="Andrés Molina">`; el estilo ya está preparado |
| Instagram y redes | `index.html`, bloque `footer__social` |
| Enlace del mapa | Los enlaces a `google.com/maps` en `index.html` |
| Colores y tipografías | `assets/css/base.css`, bloque `:root` |
| Aviso «Demo» | Borra la línea `<p class="demo-pill">` al final de `index.html` cuando todo sea real |

Los precios aparecen en dos sitios (tarjetas en `index.html` y reservas en `config.js`); mantenlos iguales.

## Notas

- **Reservas:** la disponibilidad de horas es simulada, porque no hay servidor. El cliente envía la solicitud por WhatsApp y el estudio la confirma. Para disponibilidad real se puede conectar después una agenda como Booksy, Fresha o Calendly, o un backend propio.
- **Horario «Abierto ahora»:** se calcula con la hora del dispositivo de quien visita la web.
- **Tipografías:** Geist, Geist Mono e Instrument Serif, cargadas desde Google Fonts.
