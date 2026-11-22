# PROJECT_STATE.md

Fuente de verdad operativa del proyecto. Se actualiza al final de cada sesión de trabajo — no reemplaza a la propuesta de arquitectura, pero registra qué de esa propuesta ya existe en el código y qué sigue pendiente.

## Resumen del proyecto

- **Cliente:** despacho de abogados independiente, dos socios.
- **Objetivo:** landing page corporativa de una sola página, sobria, orientada a conversión de clientes potenciales vía WhatsApp.
- **Stack:** Astro 7 (TypeScript estricto) + Tailwind CSS 4 (integración oficial) + GSAP/ScrollTrigger + astro-icon (set Lucide) + Zod (esquemas de Content Collections).
- **No incluido en v1:** framework de UI (React/Vue/Svelte), formularios con backend, CMS headless.

## Decisiones clave de arquitectura

- **Enfoque 100% estático.** Cero hidratación innecesaria — ningún componente usa `client:*` porque no hay estado de aplicación real que lo justifique. La única interactividad prevista es JS vanilla (estado de scroll del header) y GSAP inicializado desde un `<script>` de página, no desde un componente de framework.
- **Animación como capa de acabado, no como motor de la experiencia.** GSAP se implementa al final (Fase 4), sobre contenido y estructura ya cerrados, y respeta `prefers-reduced-motion` mediante `gsap.matchMedia()` desde el primer commit de animación (`src/lib/gsap/setup.ts`).
- **Una sola fuente de verdad por dato.** `src/lib/negocio.ts` centraliza los datos de contacto/negocio; se reutiliza tanto en el HTML visible como en el JSON-LD (`src/lib/schema.ts`), para que nunca queden desincronizados.
- **Content Collections con Zod, no JSON suelto.** Servicios y socios tienen esquema validado en build time (`src/content.config.ts`, API de loaders de Astro 7 — no el formato `defineCollection` legacy). Un servicio o socio con un campo faltante rompe el build en vez de publicarse incompleto.
- **Conversión vía enlaces `wa.me`, no formularios.** `src/lib/whatsapp.ts` construye el enlace en build time a partir del mensaje precargado de cada servicio — sin backend propio.
- **Sin sobre-ingeniería.** El catálogo de microinteracciones y la estructura de carpetas de la propuesta son el alcance completo de la v1; cualquier adición se evalúa después de medir el sitio en producción.
- **Color como tokens semánticos, `global.css` como única fuente de verdad.** Ningún componente usa clases de color de la paleta cruda de Tailwind (`bg-slate-100`, `text-amber-800`...); todos consumen tokens (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`, `bg-whatsapp`...). Cambiar la identidad visual completa del sitio — incluida su versión oscura — es editar únicamente los valores hex en `global.css`. Detalle completo en "Sistema de diseño — paleta y tokens" abajo.

Contexto completo y justificación de cada decisión: ver la Propuesta de Arquitectura (documento externo, sección 01–04).

## Sistema de diseño — paleta y tokens

Implementado en `src/styles/global.css` mediante variables CSS + `@theme inline` de Tailwind v4 (patrón de tokens estilo shadcn: `background`/`foreground`, `card`/`card-foreground`, `primary`/`primary-foreground`, `accent`/`accent-foreground`, `muted`/`muted-foreground`, `border`, `ring`).

**Dirección de arte (rediseño premium, 13 nov 2026 — reemplaza a la paleta hueso/navy/bronce original):** marfil (`#f7f4ee`) + tinta navy casi negra como primario (`#111a2c`) + oro viejo como acento. El acento se divide en dos tokens: `--accent` (oro oscuro `#7a5c32`, apto para texto) y `--gold` (oro decorativo `#b8955c`, solo para líneas/adornos — no pasa contraste como texto). Modo oscuro en negro azulado (`#0c0e13`) con el primario en champán (`#d4b884`) para que el botón principal siga siendo el elemento de mayor contraste.

**Verificación de contraste:** los 18 pares texto/fondo de la paleta rediseñada (claro, oscuro y banda de tinta) se verificaron con la fórmula de luminancia relativa de WCAG — peor caso 5.11:1 (`--accent` sobre `--muted` en claro; el primer valor probado, `#86663a`, daba 4.37:1 y se oscureció). La suite e2e con axe (WCAG 2.1 AA) pasa en ambos temas.

**Dos decisiones que no estaban en el encargo explícito, documentadas aquí para que no sorprendan en el próximo diff:**

1. **Los CTA ya no usan el verde de WhatsApp (cambio del rediseño premium).** El verde saturado restaba sobriedad; los CTA son ahora `bg-primary` (tinta/champán) o `bg-ink-gold` en las bandas oscuras, y el icono de chat de Lucide comunica el canal. El token `--whatsapp`/`--whatsapp-foreground` se conserva en `global.css` (sin uso actual) por si se decide volver al verde.
2. **Banda de "tinta" fija (`--ink-*`), invariante entre tema claro y oscuro.** Sustituye a los antiguos tokens `--footer-*`; la usan tanto la banda de Cifras clave como el Footer, como anclas de marca siempre oscuras. Se definen una sola vez en `:root` y no se sobrescriben en los bloques de modo oscuro.

**Tipografía:** Playfair Display (`font-serif` — títulos, cifras destacadas, porte editorial; pesos 500, 500-italic y 600) + Plus Jakarta Sans (`font-sans` — cuerpo de texto; 400/500/600 — los pesos 700 se eliminaron en el rediseño por no usarse), autoservidas vía `@fontsource` (sin peticiones a Google Fonts en runtime; se verificó en el build que no queda ninguna referencia a `fonts.googleapis.com`/`fonts.gstatic.com`). Registradas en el mismo `@theme inline` que los colores, así que todo componente que ya usaba la utilidad `font-serif` de Tailwind heredó la fuente nueva sin tocar una sola clase — el cambio fue enteramente en `global.css`.

**Selector de tema (`ThemeToggle.astro`, en `components/interactive/`):** botón con iconos sol/luna (Lucide) en el Header, alterna una clase explícita `dark`/`light` en `<html>` y la persiste en `localStorage`. Anti-parpadeo (FOUC) resuelto con un `<script is:inline>` bloqueante como primer elemento de `<head>` en `BaseLayout.astro` — lee `localStorage` y, si no hay preferencia guardada, `prefers-color-scheme`, y aplica la clase antes del primer pintado; se verificó visualmente recargando con "oscuro" ya elegido y no hay flash de tema claro. El bloque `@media (prefers-color-scheme: dark)` de la paleta se conserva como red de seguridad para navegadores con JS desactivado. Se añadió `@custom-variant dark (&:where(.dark, .dark *));` a Tailwind (modo oscuro por clase en vez de por media query) — usado puntualmente para el propio ícono sol/luna del toggle; el resto del sistema de color sigue resolviéndose por CSS puro y no depende de esta variante.

**Borde inferior del Header — evaluación técnica (tres alternativas consideradas):**

1. _Barra de progreso de scroll_ — descartada: requiere JS (o la API moderna `animation-timeline: scroll()`, con soporte de navegador todavía desigual en Safari), y una barra que crece con el scroll lee más a "blog/SaaS" que a autoridad legal.
2. _Transición de opacidad del borde al hacer scroll_ — descartada: variante más sutil de la anterior, pero sigue exigiendo JS (listener de scroll u `IntersectionObserver`) para un beneficio marginal, y contradice la decisión ya tomada en este proyecto de reservar todo lo scroll-driven para GSAP en Fase 4.
3. **Gradiente de acento con resplandor sutil, estático — elegida.** Línea de 1px con degradado `border → accent → border` centrado, más un `box-shadow` muy suave en el color de acento vía `color-mix()`. Cero JS, cero coste de rendimiento, se adapta solo entre tema claro/oscuro porque referencia las variables de color existentes. Implementada como pseudo-elemento `.site-header::after` en `global.css` (no como utilidades Tailwind sueltas, por legibilidad de un detalle tan específico).

La razón de fondo para descartar 1 y 2: el proyecto ya tiene una decisión arquitectónica explícita de que todo lo animado/scroll-driven se implementa en Fase 4 con GSAP, como capa de acabado final sobre una base ya cerrada — traer un efecto scroll-driven a Fase 3 (aunque fuera CSS-only) habría contradicho esa disciplina de fases sin necesidad, ya que la opción estática cumple el pedido ("toque distintivo") igual de bien y con más sobriedad.

## Sección de cifras clave (`CifrasClave.astro`)

**Cambio estructural:** las 4 cifras vivían como un `<dl>` de 2 columnas dentro del propio `<section>` del Hero (compartiendo un grid `lg:grid-cols-[1.1fr_0.9fr]` con el titular). Se extrajeron a su propia sección — `src/components/static/CifrasClave.astro`, `id="cifras-clave"` — con un grid dedicado de 1/2/4 columnas. Esto obligó a simplificar `Hero.astro` de vuelta a una sola columna (`max-w-3xl`, sin grid) y a mover el fondo `bg-muted border-b` del Hero a la nueva sección. El ritmo de bandas alternas del sitio pasa de 4 a 5: Header → Hero (`bg-background`) → CifrasClave (`bg-muted`) → SobreNosotros (`bg-background`) → Servicios (`bg-muted`) → Footer (banda fija).

**Datos:** array `CifraClave[]` tipado (`valor: number`, `sufijo: string`, `etiqueta: string`) definido localmente en el frontmatter del componente — no se creó una Content Collection ni un archivo en `lib/` porque estos 4 valores no son contenido editorial (no los toca nadie fuera de una revisión de código) y no se reutilizan en ningún otro componente; un array tipado en el propio archivo es el nivel de indirección correcto para este caso, no menos.

**Por qué `CifrasClave.astro` vive en `components/static/` y no en `interactive/`:** el componente en sí no contiene ningún `<script>` — es marcado 100% estático con atributos `data-counter`/`data-suffix`. La animación la inicializa `inicializarContadores()` centralizadamente desde `BaseLayout.astro`, el mismo patrón ya previsto para `data-animate="fade-up"`. El criterio de esta carpeta (`static/` vs `interactive/`) es "¿el archivo tiene su propio script?", no "¿termina animado en pantalla?" — por eso vive junto a `Hero`/`Servicios`, no junto a `ThemeToggle`.

**Animación (`inicializarContadores()` en `src/lib/gsap/animations.ts`):** `gsap.to()` sobre un objeto proxy `{ valor: 0 }` interpolado hasta el valor final, `power2.out`, 1.75s, `ScrollTrigger` con `once: true` y `start: 'top 85%'` (mismo umbral que `inicializarRevealsDeScroll`, por consistencia). El sufijo (`+`, `h`) se reaplica en cada `onUpdate` para no perderlo. Envuelta en `respetaMovimiento.add('(prefers-reduced-motion: no-preference)', …)` — si el usuario pide movimiento reducido, el bloque nunca se registra y el texto se queda tal cual lo renderizó el servidor (el valor final completo), que es exactamente el fallback de accesibilidad/SEO pedido.

**Límite de verificación encontrado en esta sesión:** se confirmó el valor final correcto, el fallback SSR completo y cero errores de consola, pero no se pudo capturar un fotograma intermedio de la animación (p. ej. "7+" a mitad de camino) porque la latencia entre llamadas a herramientas de este entorno (varios segundos) supera la duración de la animación (1.75s) — para cuando el script de muestreo llega al navegador, la cuenta ya terminó. La corrección del mecanismo se sostiene en la revisión de código (patrón estándar de GSAP, ya usado con éxito en `inicializarRevealsDeScroll`), no en una captura en vivo del conteo progresivo. Recomendable confirmarlo a simple vista en un dispositivo real si surge alguna duda.

## Menú móvil a pantalla completa (`MenuMovil.astro`)

Extraído de `Header.astro` a `src/components/interactive/MenuMovil.astro` — al necesitar bloqueo de scroll y cierre automático, cruza el umbral `static/` vs `interactive/` del proyecto (¿tiene `<script>` propio?). Sigue usando `<details>/<summary>` nativo como mecanismo de apertura (no estado en JS): da gratis que un clic en zona vacía interna nunca lo cierre — solo el botón, un enlace, o Escape (añadido en JS).

**Dos bugs reales encontrados y corregidos, ninguno visible en la primera verificación de la sesión anterior porque se probó en un viewport de escritorio ancho (sin poder emular uno móvil angosto en este entorno):**

1. **Botón X invisible sobre el panel.** El panel fullscreen (`fixed`, `z-40`) es descendiente del `<summary>` dentro del mismo `<header>` (que tiene `z-50`) — pero al estar AMBOS dentro del contexto de apilamiento local que crea el propio `<header>` (por `position:sticky` + `z-index`), el panel, con z-index explícito y posterior en el DOM, tapaba al summary pese al z-50 "exterior" del header. Corregido con `relative z-50` directamente en el `<summary>`, ganándole al panel dentro de ese mismo contexto local.
2. **El salto siempre "reiniciaba" desde una posición vieja (el inicio, o la última sección visitada con scroll orgánico) en vez de partir de la posición real actual.** Causa: con `ScrollSmoother` activo, la función de bloqueo de scroll manipulaba `window.scrollTo()`/`body.style.position` directamente — ScrollSmoother mantiene su propia posición de scroll "suavizada" rastreada internamente, separada de `window.scrollY`, y una manipulación externa la desincroniza; la siguiente animación de `smoother.scrollTo()` arrancaba desde su último valor interno conocido, no desde la posición real. Se intentó corregir delegando el bloqueo en `smoother.paused()` (el mecanismo propio de ScrollSmoother, pensado explícitamente para esto según su código fuente) — pero se verificó en el navegador que `paused(true)` reinicia `window.scrollY` a 0 como efecto secundario no documentado en este montaje, así que se descartó. La solución final es la más simple: el patrón manual de bloqueo (guardar/restaurar `window.scrollY` con `body.style.position:fixed`) resultó correcto en realidad — el problema real de la sesión anterior era el cierre diferido con `setTimeout` (ver el punto siguiente), no ScrollSmoother. Verificado explícitamente con navegación secuencial real (Contacto → Sobre Nosotros → Servicios) vía el menú móvil, con pausas de ritmo humano entre pasos, no solo con un único salto desde el estado inicial de la página.
3. **(De la entrega anterior, para contexto)** el cierre del `<details>` al pulsar un enlace debe ser síncrono, no diferido: el evento `toggle` nativo se despacha como tarea diferida incluso al cambiar `.open` por script, así que si el desbloqueo de scroll depende solo de ese evento, `scrollSmoother.ts` ya intenta animar con el scroll todavía bloqueado. `restaurarScroll()` se llama de forma síncrona en el propio clic del enlace (protegida por un guard `bloqueado` para que la llamada diferida posterior, vía "toggle", sea un no-op seguro).

**Verificación en este entorno:** sin poder emular un viewport móvil real (herramienta de redimensionado sin efecto, igual que en sesiones anteriores), toda la verificación de comportamiento se hizo forzando `#menu-movil { display: block !important; }` vía CSS inyectada en tiempo de prueba — visible desde antes de cualquier interacción, para no introducir un salto de layout artificial que no ocurriría en un viewport angosto real (una primera pasada de pruebas SÍ tenía ese artefacto y produjo lecturas confusas). Recomendable una revisión visual manual en un dispositivo real antes de dar el menú por definitivamente cerrado.

## Rediseño premium (13 de noviembre de 2026)

Pedido: que la página se vea elegante y premium, y que cargue lo más rápido posible.

- **Hero a dos columnas:** titular grande con _claro_ en cursiva dorada, CTA principal en `bg-primary`, fila de garantías (`data-hero-anim="trust"`), y a la derecha una tarjeta de doble marco "Cómo empezamos" con 3 pasos + nota de secreto profesional (`data-hero-anim="aside"`).
- **Entrada del Hero migrada de GSAP a CSS puro** (`@keyframes hero-in/hero-line/hero-title` en `global.css`, `animation-fill-mode: backwards` para no dejar `clip-path` residual). Motivo: el titular es el elemento LCP y antes quedaba oculto hasta que el bundle de GSAP se descargaba y ejecutaba. `inicializarEntradaHero()` se eliminó de `animations.ts` y de `BaseLayout.astro`. Con `prefers-reduced-motion: reduce` no se declara ninguna animación.
- **Fondo ambiental** pasó de tres `div` con `blur-3xl` a `radial-gradient` sobre el propio `#fondo-ambiental` (mismo efecto, sin coste de filtro de desenfoque).
- **Cifras clave** sobre banda de tinta con cifras en oro; **Sobre nosotros** en layout 4/8 columnas con cita destacada; **Servicios** con tarjetas numeradas (prop opcional `indice` en `TarjetaServicio`), bloque de honorarios separado y hairline dorada en hover (se mantienen `duration-150` y el `div` del icono como primer hijo, que exige `ui-fixes.spec.ts`); **Footer** abre con la llamada a la acción final "¿Hablamos de su caso?".
- **Header:** monograma derivado de `negocio.nombreDespacho` ("D·I"), subrayado animado en los enlaces, CTA "Agendar consulta". Clase utilitaria `.eyebrow` nueva en `global.css` para todos los subtítulos de sección.
- **Bugs previos corregidos en el Footer:** faltaba un espacio en la dirección ("Madrid28009") y en el copyright ("© 2026Duarte").
- **Contenido nuevo inventado** (validar con el cliente junto al resto del contenido ficticio): los 3 pasos y las garantías del Hero, la cita de Sobre nosotros y el texto del bloque de cierre del Footer.
- Se descartó `lg:sticky` en la columna de Sobre nosotros: `position: sticky` no funciona dentro de `#smooth-content` (transformado por ScrollSmoother).
- Verificado: `astro check` (0 errores), `astro build`, 55/55 tests unitarios, 61/61 e2e (incluido axe WCAG AA en claro y oscuro, escritorio y Pixel 7), revisión visual en navegador (claro/oscuro, escritorio) y capturas de Playwright en Pixel 7 (el redimensionado del navegador sigue sin funcionar en este entorno).

## Intro de carga (13 de noviembre de 2026, rama `design/intro-animacion`)

Animación a pantalla completa de ~2.9 s antes de mostrar el contenido (`src/components/static/IntroCarga.astro`): telón de tinta, una balanza de la justicia se dibuja en trazo dorado (`stroke-dashoffset` con `pathLength="1"`), el brazo oscila y se equilibra con los platillos sincronizados, aparece el nombre del despacho con revelado desde abajo y el telón sube (`translateY(-100%)`) revelando la página. La entrada del Hero se desplaza con la variable CSS `--retraso-intro` (2.25 s bajo `html.intro`) para arrancar justo cuando sube el telón.

- **Coste:** SVG inline de ~1 KB y animaciones solo en CSS (transform/opacity/stroke). Sin GSAP, sin JS por fotograma y sin imágenes. Se añadió `<link rel="preload">` de Playfair 500 latin (misma URL con hash que usa el CSS, verificado en `dist/`), que también beneficia al titular del Hero.
- **Cuándo se muestra:** lo decide un script bloqueante en el `<head>` de `BaseLayout.astro`, que añade `intro intro-activa` a `<html>` antes del primer pintado. Solo ocurre en la primera visita de la sesión (`sessionStorage['intro-vista']`), sin `prefers-reduced-motion` y fuera de navegadores automatizados (`navigator.webdriver`, para no interferir con la suite e2e). Sin JS o sin la clase, el overlay es `display:none`.
- **Escape/clic la saltan.** Al saltarla también se quita `intro`, para que el Hero no espere. A los 3 s se elimina del DOM y se libera el scroll (`html.intro-activa { overflow: hidden }`).
- **Tests:** `tests/e2e/intro.spec.ts` (simula `webdriver=false`) cubre aparición y retirada en menos de 3.5 s, no repetición en la misma sesión, salto con clic, reduced-motion y omisión en webdriver.
- **Nota de verificación:** con `astro dev` en frío la intro puede no verse, porque Vite inyecta el CSS por JS y tarda más que los 3 s del temporizador. Hay que revisarla con `astro build && astro preview`. Se verificó con capturas fotograma a fotograma en escritorio y Pixel 7 sobre el build de producción.
- **Layout shift corregido (reportado por el usuario):** el `overflow: hidden` de `html.intro-activa` ocultaba la barra de desplazamiento. Al terminar la intro reaparecía, estrechaba el viewport ~15 px y el contenido saltaba (el titular, 7 px). Se resolvió con `scrollbar-gutter: stable` solo durante la intro, junto con fondo de tinta en `<html>` para que el hueco reservado no se vea como una franja clara junto al telón. No se aplica de forma global porque reservaría el hueco también fuera de la intro (rompía el ancho del panel del menú móvil en `mobile-menu.spec.ts`). Cubierto por `tests/e2e/intro-layout-shift.spec.ts`, que lanza Chromium sin `--hide-scrollbars`, la opción por defecto de Playwright que ocultaba justo este bug.
- **Compromiso conocido:** el contenido real se muestra unos 2.3 s más tarde en la primera visita. Es inherente a una intro de este tipo y se limita a una vez por sesión.

## Tests unitarios y caché de Content Collections (13 de noviembre de 2026)

**Problema:** los tests de componentes que usan `getCollection()` leían una caché vieja. Vitest arranca Vite en modo "serve", así que Astro lee el data store de desarrollo (`.astro/data-store.json`), pero `getViteConfig()` crea ese entorno con `sync: false` y nunca lo rellena. Solo `astro dev` escribía ese archivo; `astro sync` escribe el suyo en `cacheDir` (`node_modules/.astro/`). Consecuencia: colecciones vacías si nunca se había arrancado `astro dev`, o datos y esquema desactualizados tras editar contenido (se vio con el campo nuevo `experiencia`).

**Solución:** `tests/setup/sincronizar-contenido.ts`, `globalSetup` de Vitest que ejecuta el CLI `astro sync` y copia su data store a `.astro/data-store.json` antes de cada ejecución. Se lanza como proceso aparte porque Vite transforma el setup con la config de Astro y ahí `import { sync } from 'astro'` no resuelve a la API de Node. Guarda de regresión: `tests/unit/contenido-sincronizado.test.ts` compara las colecciones con los `.md` en disco; se comprobó que falla si se desactiva el setup. En `test:watch`, si se edita contenido, hay que relanzar Vitest.

## SEO y tarjeta al compartir (13 de noviembre de 2026)

- **Dominio (`site` en `astro.config.mjs`):** `SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` (la inyecta Vercel en cada build) → `http://localhost:4321`. Toda URL absoluta (canonical, og:url, og:image, sitemap, robots, JSON-LD) sale de aquí. **Cuando haya dominio propio, definir `SITE_URL` en Vercel.**
- **Textos (`src/lib/seo.ts`):** título "Abogados penalistas en Itagüí | Duarte & Muñoz Abogados" (55 caracteres, palabra clave primero), meta description de 135 caracteres y textos propios para la tarjeta al compartir. Las longitudes las vigila `tests/unit/seo.test.ts`.
- **`<head>` (`BaseLayout.astro`):** metadatos antes de los scripts en línea (el `<title>` queda en el byte ~164, para rastreadores que leen solo el principio), canonical, robots con `max-image-preview:large`, Open Graph completo (imagen absoluta 1200×630 con dimensiones, alt y locale `es_CO`), Twitter `summary_large_image`, favicon SVG/ICO, apple-touch-icon, manifest, `lang="es-CO"`. Props nuevas: `noindex` (además omite el canonical) e `intro` (marca `<html data-sin-intro>`, que el script de la intro respeta).
- **JSON-LD (`src/lib/schema.ts`):** ya conectado a la portada. `@graph` con WebSite, WebPage, ImageObject y LegalService (servicios como `OfferCatalog`, abogados como `Person` con `worksFor`), enlazados por `@id`. Omite los campos sin dato real (calle, horario, redes) y escapa `<` al serializar.
- **H1 con búsqueda local:** el subtítulo "Abogados en Itagüí" pasó a formar parte del `<h1>`, sin cambio visual. Los H2 ahora son "Nuestros abogados" y "Servicios jurídicos". Los datos de contacto del footer van en `<address>`.
- **Endpoints generados en el build:** `robots.txt`, `sitemap.xml` (sin dependencia @astrojs/sitemap: es una sola página indexable) y `site.webmanifest` (desde `negocio.ts`). Página `404.astro` con `noindex`, sin intro y con salida a inicio y WhatsApp.
- **Imágenes (`npm run assets:seo` → `scripts/generar-assets-seo.mjs`):** genera `og.jpg` (1200×630, ~44 KB, composición centrada para que el recorte cuadrado de WhatsApp siga legible), `apple-touch-icon.png`, `icon-192/512.png` y `favicon.ico` con Playwright y las fuentes del sitio incrustadas. **Volver a ejecutarlo si cambia el nombre, la ciudad o las áreas de práctica.** El favicon SVG (balanza de la intro simplificada) se edita a mano en `public/favicon.svg`.
- **Tests:** aserciones del `<head>` en `IndexPage.test.ts` (el Container API necesita `astroConfig: { site }`), grafo y serialización en `schema.test.ts`, y `tests/e2e/seo.spec.ts` (robots, sitemap, manifest, iconos, og.jpg servido como JPEG 1200×630 de menos de 300 KB, JSON-LD válido, 404 real con noindex).
- **Pendiente fuera del código:** dar de alta el sitio en Google Search Console y enviar el sitemap; crear un Perfil de Empresa de Google (lo que más pesa en el SEO local); añadir las redes sociales a `negocio.redesSociales` cuando existan (se publican como `sameAs`).

## Roadmap de fases

- [ ] **Fase 0 — Descubrimiento y contenido real.** Bios, fotos, áreas de práctica, honorarios, número de WhatsApp reales del cliente. _(Sigue bloqueada en insumo del cliente — ver aviso de contenido ficticio abajo. No confundir con la Fase 2, que ya avanzó usando datos de relleno.)_
- [x] **Fase 1 — Setup y arquitectura base.** Astro + TypeScript estricto, Tailwind, Content Collections, árbol de carpetas, `PROJECT_STATE.md`.
- [x] **Fase 2 — Estructura estática.** Componentes `.astro` de `components/static/` ensamblados en `index.astro`, sitio completamente navegable y responsive, sin una línea de GSAP. Construida sobre contenido ficticio (ver abajo), no sobre el insumo real de Fase 0.
- [x] **Fase 3 — Sistema visual y diseño (completa).** Sistema de color con variables CSS + `@theme inline`, modo oscuro automático (`prefers-color-scheme`) y forzable (`.dark`), todos los componentes en tokens semánticos, tipografía de marca (Playfair Display + Plus Jakarta Sans, autoservida vía `@fontsource`), `ThemeToggle.astro` con persistencia en `localStorage` y script bloqueante anti-parpadeo, y borde inferior de acento en el Header. Ejecutada en dos entregas — ver "Sistema de diseño" abajo para el detalle completo de ambas.
- [ ] **Fase 4 — Animación e interacción (avanzada; ver "Animaciones de scroll", 22 nov 2026).** Primera microinteracción implementada: contador numérico progresivo en la sección de cifras clave (`inicializarContadores()`). Pendientes de la tabla original: reveals de scroll (`data-animate="fade-up"`, función ya escrita en `animations.ts` pero sin usar en ningún componente todavía), stagger del Hero, hover de tarjetas de servicio, transición de header al hacer scroll.
- [ ] **Fase 5 — SEO, Schema y accesibilidad.** JSON-LD `LegalService` (generador ya existe en `schema.ts`, falta invocarlo desde una página), OpenGraph (imagen dedicada), auditoría de teclado/contraste/alt.
- [ ] **Fase 6 — Testing y QA.** Lighthouse, prueba de enlaces WhatsApp, `prefers-reduced-motion`, cross-browser (prioridad Safari iOS).
- [ ] **Fase 7 — Despliegue.** Hosting, dominio, analítica, Search Console.

## Contenido real (13 de noviembre de 2026) — reemplaza al contenido ficticio de desarrollo

El despacho ficticio de Madrid ("Duarte & Iglesias", Elena Duarte / Javier Iglesias, precios en €, RGPD) se reemplazó por los datos reales de los dos abogados, tomados de sus hojas de vida: **Natalia Muñoz Taborda** (abogada litigante, especialista en Derecho Penal y en Derecho Administrativo, docente de Derecho Penal) y **Fredy Humberto Duarte Mora** (abogado, especialista en Derecho Administrativo, Inspector del INPEC 1999–2022). Ubicación: Itagüí, Antioquia (Colombia).

- **Perfiles** (`src/content/socios/natalia-munoz.md`, `fredy-duarte.md`): solo información profesional. Se excluyeron a propósito cédula, fecha y lugar de nacimiento, estado civil, dirección de domicilio, teléfonos y correos personales, referencias de terceros, estudios primarios/secundarios y empleos no jurídicos. Campo nuevo `experiencia` en el esquema de `socios`; `acreditaciones` solo se muestra si tiene datos.
- **Áreas de práctica**: las 6 ficticias se sustituyeron por 5 respaldadas por los currículums: Derecho Penal, Asuntos penitenciarios, Derecho Administrativo, Tutelas y derechos de petición, y Contratos. `rangoHonorarios` pasó a ser opcional (no hay honorarios reales) y la tarjeta oculta el bloque si falta.
- **Cifras clave**: todas verificables. 2 abogados; años de ejercicio calculados en build desde 2017; 23 años en el INPEC; 3 especializaciones.
- **Footer**: aviso de tratamiento de datos según la Ley 1581 de 2012 y el Decreto 1377 de 2013 (antes RGPD). Teléfono en formato legible vía `formatearTelefono()` (`negocio.ts`). Sin dirección de calle (`calle` es opcional) y sin horario (`horario: []`), y los bloques se ocultan si faltan.
- **Pendiente de confirmar con el cliente:**
  1. Nombre comercial: se usa **"Duarte & Muñoz Abogados"** (apellidos de ambos, en el orden de su empresa existente "Transportadora y Distribuidora Duarte Muñoz") — es una suposición; se cambia en una sola línea de `negocio.ts`.
  2. Contacto: WhatsApp y email son los personales de Natalia (`+573124874581`, `naty11_02@hotmail.com`). Recomendable un correo con dominio propio.
  3. Cargo de cada uno ("Abogada litigante" / "Abogado") — ¿son socios fundadores?
  4. El diplomado de defensa penal figura como "Universidad UNISABANA" en el CV de Natalia y "UNISABANETA" en el de Fredy (mismo diplomado, mismas fechas) — posible errata; se dejó como está escrito.
  5. Textos de compromiso del sitio (no salen de los CV): los 3 pasos del Hero, "Atención directa de los abogados", la cita de Sobre nosotros, "le explicaremos los honorarios antes de empezar".
  6. Horario de atención y, si se desea publicar, una dirección de oficina (no la de domicilio).

## Estado actual

**Completado (24 de agosto de 2026, sesión de menú móvil a pantalla completa):**

- Menú móvil extraído a `src/components/interactive/MenuMovil.astro` — panel `fixed`/`h-dvh` a pantalla completa, bloqueo de scroll del body mientras está abierto, cierre automático al pulsar un enlace (integrado con `smoother.scrollTo()` de `scrollSmoother.ts`), cierre con Escape, `aria-label` dinámico. Ver "Menú móvil a pantalla completa" arriba para el detalle completo, incluidos dos bugs reales encontrados y corregidos (botón X tapado por el propio panel; el salto de sección partía siempre de una posición vieja en vez de la actual).
- Verificado: `npm run format`, `npx astro check` (0 errores), `npx astro build` (limpio), y una batería de pruebas de comportamiento en navegador (apertura/cierre, bloqueo de scroll, clic en zona vacía no cierra, cierre por enlace/botón/Escape, navegación secuencial entre tres secciones con pausas de ritmo humano, ambos temas claro/oscuro).

**Completado (24 de agosto de 2026, sesión de cifras clave — arranque de Fase 4):**

- Sección de cifras clave extraída de `Hero.astro` a su propio componente `src/components/static/CifrasClave.astro`, `id="cifras-clave"`, con las 4 métricas en un array `CifraClave[]` tipado. Copy del primer ítem actualizado a "Socios fundadores, dedicación directa en cada caso" (antes "disponibles en cada caso").
- Grid responsivo 1 columna (móvil) / 2 (tablet, `sm:`) / 4 (desktop, `lg:`), con divisores verticales sutiles entre columnas solo en desktop (`lg:divide-x lg:divide-border`) — deliberadamente ausentes en móvil/tablet para evitar el efecto de borde mal alineado que produce `divide-x` cuando una grid envuelve a varias filas.
- Tratamiento tipográfico: cifra en `font-serif` + `text-accent` (toque de bronce) a `text-4xl`/`lg:text-5xl`, etiqueta en `font-sans` (`text-muted-foreground`) — `tabular-nums` en el número para que los dígitos no salten de ancho durante el conteo.
- `inicializarContadores()` nuevo en `src/lib/gsap/animations.ts` — contador progresivo con GSAP + ScrollTrigger (`once: true`, `power2.out`, 1.75s), activado desde el `<script>` de página de `BaseLayout.astro`. Detalle completo del mecanismo y de sus límites de verificación en "Sección de cifras clave" arriba.
- `Hero.astro` simplificado de vuelta a una sola columna al perder el `<dl>` de cifras; el fondo `bg-muted` se trasladó a la nueva sección.
- Verificado: `npm run format`, `npx astro check` (0 errores), `npx astro build` (limpio), fallback SSR confirmado en `dist/index.html` (`data-counter="2/20/6/24"` con el texto completo ya renderizado), revisión visual en navegador (grid, divisores, tipografía) y cero errores de consola al cargar la página.

**Completado (24 de agosto de 2026, sesión de tipografía + theme toggle + header — cierre de Fase 3):**

- Fuentes autoservidas instaladas vía `@fontsource/playfair-display` y `@fontsource/plus-jakarta-sans` (pesos 400/500/600/700 según uso real); registradas como `--font-serif`/`--font-sans` en el `@theme inline` de `global.css`. Verificado en `dist/`: 24 archivos `.woff2` propios, cero referencias a `fonts.googleapis.com`/`fonts.gstatic.com`.
- `ThemeToggle.astro` nuevo en `src/components/interactive/` (primer componente real de esa carpeta) — botón sol/luna, persiste en `localStorage`, accesible por teclado (`<button>` nativo, `aria-label`/`aria-pressed` dinámicos, `focus-visible`).
- Script anti-FOUC bloqueante (`is:inline`) agregado como primer elemento de `<head>` en `BaseLayout.astro`.
- `@custom-variant dark (&:where(.dark, .dark *));` agregado a `global.css` — modo oscuro por clase para las utilidades `dark:` de Tailwind, usado en el ícono del toggle; el resto de la paleta sigue sin depender de esto.
- `Header.astro` reestructurado: `ThemeToggle` integrado junto al CTA de WhatsApp, tamaños de botón armonizados (toggle y hamburguesa ambos `h-9 w-9`), espaciado entre nav/toggle/CTA reorganizado en un clúster derecho explícito en vez de `justify-between` a 4 vías.
- Borde inferior del Header rediseñado como gradiente de acento con resplandor sutil (pseudo-elemento `.site-header::after`, CSS puro) — ver evaluación de las tres alternativas consideradas arriba.
- Verificado: `npm run format`, `npx astro check` (0 errores), `npx astro build` (limpio, 24 fuentes bundleadas), y revisión visual en navegador — toggle claro↔oscuro probado (incluida recarga con preferencia ya guardada, sin parpadeo), tipografía Playfair/Jakarta renderizando correctamente, borde de acento visible y sutil en ambos temas. La verificación del layout **móvil** del Header quedó solo a nivel de código (clases `md:flex`/`md:hidden`/`md:inline-flex` confirmadas en el CSS compilado) — la herramienta de redimensionado de ventana del navegador no respondió en este entorno; recomendable una revisión visual manual en un dispositivo o DevTools antes de dar el Header por definitivamente cerrado.

**Completado (24 de agosto de 2026, sesión de sistema de diseño):**

- Alias de importación `@/*` → `src/*` configurado en `tsconfig.json` (Astro lo resuelve de forma nativa, sin `vite-tsconfig-paths`); todos los imports que cruzaban directorios migrados a `@/...`.
- Prettier configurado (`.prettierrc.mjs`, `.prettierignore`) con `prettier-plugin-astro` y `prettier-plugin-tailwindcss`; scripts `format`/`format:check`; todo el proyecto reformateado.
- Sistema de color completo en `src/styles/global.css`: tokens `background`, `foreground`, `card`, `primary`, `accent`, `muted`, `border`, `ring`, `whatsapp` (+ `-foreground` de cada uno) para tema claro y oscuro, más una banda `footer` invariante entre temas. Ver "Sistema de diseño — paleta y tokens" arriba para el razonamiento completo.
- Los 6 componentes de `components/static/` (`Header`, `Hero`, `SobreNosotros`, `Servicios`, `TarjetaServicio`, `Footer`) migrados de clases de color hardcodeadas (`slate`/`amber`/`emerald`) a los tokens semánticos — verificado por grep que no queda ninguna clase de la paleta cruda de Tailwind en `src/`.
- Insignias de especialidad (SobreNosotros) y tarjetas de servicio destacadas (TarjetaServicio) usan el acento bronce como tratamiento de "prestigio" explícitamente pedido.
- Verificado: `npm run format` limpio, `npx astro check` (0 errores), `npx astro build` (build limpio), y revisión visual en navegador en modo claro y forzando `.dark` (mismos valores que la media query) — paleta, contraste e insignias se ven como se diseñaron en ambos temas.

**Completado (24 de agosto de 2026, sesión de contenido y estructura — Fase 2):**

- Proyecto Astro inicializado con `tsconfig` en modo `strict`.
- Dependencias instaladas: `astro`, `@tailwindcss/vite` + `tailwindcss` (integración oficial), `gsap`, `astro-icon` + `@iconify-json/lucide`, `zod`, `@astrojs/check` + `typescript` (dev).
- `astro.config.mjs` con integraciones `tailwindcss()` e `icon()` registradas.
- Árbol de carpetas creado según la arquitectura acordada (`src/content/`, `src/components/{static,interactive,ui}/`, `src/layouts/`, `src/lib/{gsap,}`, `src/styles/`, `src/pages/`).
- `src/content.config.ts` — esquemas Zod para `servicios` y `socios`, usando la Content Layer API (`glob` loader) de Astro 7; formato `defineCollection` legacy descartado por incompatible con esta versión.
- **Git inicializado**, commit inicial subido a `origin/master` (`git@github.com:danilokosam/landing-page-abogados.git`).
- **`negocio.ts` poblado** con datos ficticios de desarrollo (ver aviso arriba).
- **6 servicios** creados en `src/content/servicios/` (Civil, Laboral, Familia, Mercantil, Penal, Inmobiliario), cada uno con ícono Lucide, rango de honorarios y mensaje de WhatsApp específico.
- **2 socios** creados en `src/content/socios/` (Elena Duarte Ríos, Javier Iglesias Montes) con formación, especialidades, acreditaciones, bio en el cuerpo del Markdown y avatar SVG monograma colocado junto a cada entrada.
- **Componentes estáticos construidos** en `src/components/static/`: `Header` (nav sticky semitransparente + menú móvil vía `<details>/<summary>`, cero JS), `Hero`, `SobreNosotros` (lee la colección `socios`, renderiza bio vía `render()`), `Servicios` + `TarjetaServicio` (lee la colección `servicios`, botón WhatsApp por tarjeta vía `construirEnlaceWhatsApp`), `Footer` (datos de contacto + aviso legal/privacidad ficticio, `id="contacto"`).
- `src/pages/index.astro` ensambla Header → Hero → SobreNosotros → Servicios → Footer dentro de `BaseLayout`.
- `src/styles/global.css` — se agregó `scroll-behavior: smooth` con guarda `prefers-reduced-motion` para los anclajes de navegación (CSS puro, no GSAP).
- Verificado: `npx astro check` (0 errores), `npx astro build` (build de producción limpio, sin warnings), y revisión visual en navegador (desktop y viewport móvil 390×844) — nav, menú móvil, tarjetas de servicio y footer renderizan correctamente; los 10 enlaces `wa.me` del sitio generan el mensaje precargado esperado.

**Pendiente para la próxima sesión:**

0. Validar con el cliente los textos nuevos del rediseño premium (ver sección "Rediseño premium") y revisar el diseño en un iPhone real (Safari).

1. Insumo real del cliente (Fase 0, sigue abierta): bios, fotos reales, honorarios definitivos, número de WhatsApp real, dirección/horario — y reemplazo de todo el contenido ficticio listado arriba.
2. Revisión visual manual del Header en móvil real/DevTools (ver nota de verificación arriba) — el redimensionado de ventana no funcionó en este entorno de sesión.
3. Invocar `generarLegalServiceSchema()` (ya existe en `schema.ts`) desde `BaseLayout.astro` o `index.astro` e inyectarlo como `<script type="application/ld+json">` — quedó implementado pero no conectado.
4. Imagen OpenGraph dedicada (1200×630) — `BaseLayout.astro` ya emite las meta tags pero sin `og:image` todavía.
5. Fase 4 — resto del catálogo de microinteracciones: reveals de scroll (`data-animate="fade-up"`, activarlos en los componentes que corresponda), stagger del Hero, hover de tarjetas de servicio, transición de header al hacer scroll.
6. Confirmar a simple vista (dispositivo real o grabación) que el conteo progresivo de cifras clave se ve fluido — no se pudo verificar en vivo en este entorno de sesión (ver nota en "Sección de cifras clave").
7. Revisión visual manual del menú móvil en un dispositivo real o DevTools — toda su verificación en esta sesión se hizo forzando su visibilidad vía CSS inyectada en un viewport de escritorio, no en un viewport móvil genuino (misma limitación de entorno que el Header en su momento).

**No iniciado deliberadamente en esta sesión:** el resto del catálogo de microinteracciones de Fase 4 — solo se pidió el contador de cifras clave.

## Animaciones de scroll (22 de noviembre de 2026, rama `feat/animaciones-scroll-gsap`)

Sustituye el sistema `data-reveal` por atributos `data-anim` gestionados en `src/lib/gsap/animations.ts`:

- **Robustez:** los estados iniciales ocultos (global.css) solo aplican bajo `html.gsap-listo`, clase que añade el propio módulo de GSAP antes de crear las animaciones y solo sin `prefers-reduced-motion`. Se eliminó el mecanismo `no-js`: si el JS no carga, nada queda invisible. Al terminar, cada elemento recibe `data-anim-hecho` y se limpian sus estilos en línea.
- **Prioridad alta:** fichas de Sobre nosotros y tarjetas de servicio con `ScrollTrigger.batch` (en móvil cada una se dispara al entrar ella); telón `clip-path` del panel de la foto + asentamiento en un contenedor propio (no toca `.ficha-foto` ni el hover); filete dibujado con `clip-path`; línea de tiempo con trazo (`::before` + `--escala-trazo`) e hitos escalonados. CTA final: línea del antetítulo, título por líneas, botón con un único destello, columnas escalonadas.
- **Prioridad media:** antetítulos (`--escala-linea` en el `::before`), títulos con SplitText (`mask: 'lines'`, `autoSplit`, `aria-label` automático), cifras clave (separadores `::before` + `--escala-separador`, subida de cifras, contadores y etiquetas a mitad de cuenta).
- **Prioridad baja:** profundidad solo con `(pointer: fine) and (min-width: 1024px)` (panel del Hero −40 px, fondo ambiental −90 px, fotos ±3 %); header con fondo más opaco y sombra al pasar 80 px (`onEnter`/`onLeaveBack`; con `onToggle` se perdía al llegar al final de la página).
- **Coste:** +4,3 KB gzip de JS (SplitText y el módulo de animaciones), en el bundle diferido.
- **Tests:** `tests/unit/animaciones-contrato.test.ts` (estados ocultos siempre bajo `gsap-listo`, sin rebotes/elásticos/rotaciones/bucles, `.ficha-foto` nunca animada) y `tests/e2e/animaciones-scroll.spec.ts` (estado final, móvil por ficha, accesibilidad de títulos, header, movimiento reducido y sin JS).
