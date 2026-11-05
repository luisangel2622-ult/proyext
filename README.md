# Don Morell · sitio web

Sitio de **Don Morell**, barbería de caballeros en Plaza Marfil, Tuxtla Gutiérrez. HTML, CSS y JavaScript puros: sin dependencias ni paso de compilación.

## Qué incluye

| Sección | Qué hace |
|---|---|
| Portada | Mármol vivo (WebGL) cuyas vetas fluyen sin parar, con polvo suspendido en la luz. El logo es un medallón con bisel de reloj, órbita y brillo. Incluye los botones **Reservar cita** y **Llamar** y el estado «Abierto ahora / Cerrado» con el horario real. |
| El estudio | Texto que se ilumina palabra a palabra al hacer scroll. |
| La herramienta | Navaja en SVG, con el nombre grabado, que se abre con el scroll. |
| Horario en breve | Lunes a viernes, sábado, domingo y ubicación de un vistazo. |
| Servicios | Tarjetas tipo *bento* con escala de peines del fade, ángulo del afeitado y combo Corte + Barba. |
| El ritual | Los cinco pasos del servicio en un carrusel horizontal guiado por el scroll. |
| Reservas | Servicio → día → hora (agrupada en mañana, tarde y noche) → nombre y nota. Genera el mensaje y lo abre en WhatsApp. |
| Ubicación | Vista satelital real de Google Maps, dirección, horario con el día de hoy marcado y botones Cómo llegar, Llamar y WhatsApp. |
| Menú (móvil) | Panel lateral sobre mármol con el medallón, el estado de apertura, las secciones numeradas, los botones Reservar, Llamar y WhatsApp, y las redes. |
| Redes | Instagram, Facebook y WhatsApp. |

**Modo claro y oscuro.** La web abre en blanco, el estilo de la marca. El botón luna / sol de la barra cambia a oscuro y recuerda la elección. El cambio se hace con un revelado circular en navegadores compatibles. Los dos temas salen de los mismos tokens de color en `assets/css/base.css`: claro «Blanco» y oscuro «Ébano».

**Movimiento.** La página se mueve aunque nadie haga scroll:
- luces ambientales que recorren toda la web;
- una cinta de servicios en desplazamiento;
- tijeras que cortan, barras del fade que respiran y el rayo del afeitado que oscila;
- la navaja levita y su filo brilla sin parar;
- el grabado guilloché fluye y las rosetas giran;
- destellos en los textos dorados y en los botones.

Todo usa transformaciones ligeras, se pausa fuera de pantalla y se detiene si el dispositivo pide «reducir movimiento».

**Logo.** Está vectorizado en `assets/img/logo-don-morell.svg`, con las letras reconstruidas en Cinzel (de la misma familia romana que el original). Así se ve nítido a cualquier tamaño. También se generaron el favicon, el icono para iPhone y la imagen para compartir en redes.

**Atmósfera «Veta Noble».** Los fondos no son colores planos sino lugares:
- **Toda la página:** una losa de mármol continua y sin costuras (marfil en modo claro, Nero Marquina en oscuro), con grano de piedra.
- **Luz por sección:** lámpara cálida en modo oscuro, luz de ventana en modo claro.
- **La navaja:** flota sobre un damero de mármol en perspectiva, como el piso de una barbería clásica.
- **Reservas:** van sobre capitoné de cuero, como un sillón de barbero.
- **Grabado guilloché:** en el manifiesto, las bandas del horario y el footer.

La filosofía visual está en `docs/filosofia-visual.md` y la lámina de materiales en `docs/veta-noble-lamina.png`. Las texturas se regeneran con `python3 tools/gen_materials.py assets/img`.

Funciona en móvil, tableta y escritorio. Se puede usar con teclado y lector de pantalla, respeta la opción «reducir movimiento» y muestra todo el contenido aunque JavaScript esté desactivado.

## Estructura

```
index.html · manifest.webmanifest
assets/
  css/  base.css · hero.css · sections.css · booking.css · atmosphere.css · mobile.css
  js/   config.js · main.js · hero-canvas.js · booking.js · ornaments.js
  img/  logo, iconos y texturas (mármol, damero, capitoné, grano)
docs/   filosofía visual y lámina de materiales
tools/  generador de texturas
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
| Aviso «Precios y duraciones de ejemplo» | Borra las dos líneas `<p class="demo-note">` de `index.html` (Servicios y Reservas) cuando los precios sean los reales |

## Notas

- **Reservas:** no hay servidor. El cliente envía la solicitud por WhatsApp y la barbería la confirma. Los horarios ya pasados del día se desactivan solos.
- **Mapa satelital:** se carga desde Google Maps. Algunas vistas previas bloquean mapas de otros sitios; en ese caso se muestra un mapa ilustrado y el botón «Ver en Google Maps».
- **«Abierto ahora»:** se calcula con la hora del dispositivo de quien visita la web.
- **Tipografías:** Geist (texto), Cinzel (marca y etiquetas), Cormorant Garamond (acentos en cursiva) y Geist Mono (datos), desde Google Fonts.
