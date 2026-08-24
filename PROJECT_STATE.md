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

**Dirección de arte:** hueso cálido (no blanco puro) + navy corporativo como color primario (autoridad, seriedad) + bronce/cognac apagado como acento decorativo, reservado para eyebrows, insignias de especialidad y detalles de prestigio — nunca para grandes superficies. Modo oscuro en pizarra profunda (no negro puro) con el mismo navy aclarado para que primary siga funcionando como color de botón con buen contraste.

**Verificación de contraste:** todos los pares texto/fondo de la paleta (12 combinaciones, claro y oscuro) se verificaron programáticamente contra la fórmula de luminancia relativa de WCAG antes de fijarlos — el peor caso da 5.25:1 (AA) y la mayoría supera 7:1 (AAA). El único par que falló en el primer intento (texto blanco sobre el verde de WhatsApp en modo oscuro, 3.24:1) se corrigió usando texto oscuro sobre ese verde en vez de aclarar el verde, dando 5.25:1.

**Dos decisiones que no estaban en el encargo explícito, documentadas aquí para que no sorprendan en el próximo diff:**

1. **`--whatsapp`/`--whatsapp-foreground` es un token de acción funcional, separado de `accent`.** El verde de WhatsApp existe por reconocibilidad de marca (el usuario debe identificar de un vistazo "este botón abre WhatsApp"), no por decisión estética del despacho — mezclarlo con el acento bronce le haría perder ese reconocimiento inmediato.
2. **El Footer usa una banda de color fija (`--footer-*`), invariante entre tema claro y oscuro.** Es una decisión de dirección de arte (un ancla de marca siempre en navy oscuro, como un pie de página impreso), no un error de la implementación de modo oscuro — por eso esos cuatro tokens se definen una sola vez en `:root` y no se sobrescriben en los bloques de modo oscuro.

**Tipografía:** Playfair Display (`font-serif` — títulos, cifras destacadas, porte editorial) + Plus Jakarta Sans (`font-sans` — cuerpo de texto), autoservidas vía `@fontsource` (sin peticiones a Google Fonts en runtime; se verificó en el build que no queda ninguna referencia a `fonts.googleapis.com`/`fonts.gstatic.com`). Registradas en el mismo `@theme inline` que los colores, así que todo componente que ya usaba la utilidad `font-serif` de Tailwind heredó la fuente nueva sin tocar una sola clase — el cambio fue enteramente en `global.css`.

**Selector de tema (`ThemeToggle.astro`, en `components/interactive/`):** botón con iconos sol/luna (Lucide) en el Header, alterna una clase explícita `dark`/`light` en `<html>` y la persiste en `localStorage`. Anti-parpadeo (FOUC) resuelto con un `<script is:inline>` bloqueante como primer elemento de `<head>` en `BaseLayout.astro` — lee `localStorage` y, si no hay preferencia guardada, `prefers-color-scheme`, y aplica la clase antes del primer pintado; se verificó visualmente recargando con "oscuro" ya elegido y no hay flash de tema claro. El bloque `@media (prefers-color-scheme: dark)` de la paleta se conserva como red de seguridad para navegadores con JS desactivado. Se añadió `@custom-variant dark (&:where(.dark, .dark *));` a Tailwind (modo oscuro por clase en vez de por media query) — usado puntualmente para el propio ícono sol/luna del toggle; el resto del sistema de color sigue resolviéndose por CSS puro y no depende de esta variante.

**Borde inferior del Header — evaluación técnica (tres alternativas consideradas):**

1. _Barra de progreso de scroll_ — descartada: requiere JS (o la API moderna `animation-timeline: scroll()`, con soporte de navegador todavía desigual en Safari), y una barra que crece con el scroll lee más a "blog/SaaS" que a autoridad legal.
2. _Transición de opacidad del borde al hacer scroll_ — descartada: variante más sutil de la anterior, pero sigue exigiendo JS (listener de scroll u `IntersectionObserver`) para un beneficio marginal, y contradice la decisión ya tomada en este proyecto de reservar todo lo scroll-driven para GSAP en Fase 4.
3. **Gradiente de acento con resplandor sutil, estático — elegida.** Línea de 1px con degradado `border → accent → border` centrado, más un `box-shadow` muy suave en el color de acento vía `color-mix()`. Cero JS, cero coste de rendimiento, se adapta solo entre tema claro/oscuro porque referencia las variables de color existentes. Implementada como pseudo-elemento `.site-header::after` en `global.css` (no como utilidades Tailwind sueltas, por legibilidad de un detalle tan específico).

La razón de fondo para descartar 1 y 2: el proyecto ya tiene una decisión arquitectónica explícita de que todo lo animado/scroll-driven se implementa en Fase 4 con GSAP, como capa de acabado final sobre una base ya cerrada — traer un efecto scroll-driven a Fase 3 (aunque fuera CSS-only) habría contradicho esa disciplina de fases sin necesidad, ya que la opción estática cumple el pedido ("toque distintivo") igual de bien y con más sobriedad.

## Roadmap de fases

- [ ] **Fase 0 — Descubrimiento y contenido real.** Bios, fotos, áreas de práctica, honorarios, número de WhatsApp reales del cliente. _(Sigue bloqueada en insumo del cliente — ver aviso de contenido ficticio abajo. No confundir con la Fase 2, que ya avanzó usando datos de relleno.)_
- [x] **Fase 1 — Setup y arquitectura base.** Astro + TypeScript estricto, Tailwind, Content Collections, árbol de carpetas, `PROJECT_STATE.md`.
- [x] **Fase 2 — Estructura estática.** Componentes `.astro` de `components/static/` ensamblados en `index.astro`, sitio completamente navegable y responsive, sin una línea de GSAP. Construida sobre contenido ficticio (ver abajo), no sobre el insumo real de Fase 0.
- [x] **Fase 3 — Sistema visual y diseño (completa).** Sistema de color con variables CSS + `@theme inline`, modo oscuro automático (`prefers-color-scheme`) y forzable (`.dark`), todos los componentes en tokens semánticos, tipografía de marca (Playfair Display + Plus Jakarta Sans, autoservida vía `@fontsource`), `ThemeToggle.astro` con persistencia en `localStorage` y script bloqueante anti-parpadeo, y borde inferior de acento en el Header. Ejecutada en dos entregas — ver "Sistema de diseño" abajo para el detalle completo de ambas.
- [ ] **Fase 4 — Animación e interacción.** Implementación de GSAP/ScrollTrigger según la tabla de microinteracciones de la propuesta.
- [ ] **Fase 5 — SEO, Schema y accesibilidad.** JSON-LD `LegalService` (generador ya existe en `schema.ts`, falta invocarlo desde una página), OpenGraph (imagen dedicada), auditoría de teclado/contraste/alt.
- [ ] **Fase 6 — Testing y QA.** Lighthouse, prueba de enlaces WhatsApp, `prefers-reduced-motion`, cross-browser (prioridad Safari iOS).
- [ ] **Fase 7 — Despliegue.** Hosting, dominio, analítica, Search Console.

## ⚠️ Contenido ficticio — no confundir con datos reales del cliente

Para no bloquear el avance estructural mientras el cliente recopila su material (Fase 0), esta sesión pobló `negocio.ts` y las colecciones de contenido con un despacho, socios y honorarios **inventados pero verosímiles**: "Duarte & Iglesias Abogados", Elena Duarte Ríos y Javier Iglesias Montes, dirección en Calle de Alcalá (Madrid), teléfono `+34612345678`, email `info@duarteiglesiasabogados.es`. Las fotos de los socios son avatares SVG con monograma (iniciales sobre un círculo), no fotografías — se evitó deliberadamente usar imágenes de stock de personas reales (p. ej. Unsplash) como retrato de un abogado ficticio.

**Antes de desplegar a producción o compartir una vista previa con el cliente**, todo esto debe reemplazarse por datos reales (Fase 0). Buscar `Duarte & Iglesias`, `duarteiglesiasabogados.es` y `+34612345678` en el repo para localizar cada punto de reemplazo.

## Estado actual

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

1. Insumo real del cliente (Fase 0, sigue abierta): bios, fotos reales, honorarios definitivos, número de WhatsApp real, dirección/horario — y reemplazo de todo el contenido ficticio listado arriba.
2. Revisión visual manual del Header en móvil real/DevTools (ver nota de verificación arriba) — el redimensionado de ventana no funcionó en este entorno de sesión.
3. Invocar `generarLegalServiceSchema()` (ya existe en `schema.ts`) desde `BaseLayout.astro` o `index.astro` e inyectarlo como `<script type="application/ld+json">` — quedó implementado pero no conectado.
4. Imagen OpenGraph dedicada (1200×630) — `BaseLayout.astro` ya emite las meta tags pero sin `og:image` todavía.
5. Fase 4 — animaciones GSAP/ScrollTrigger reales, según la tabla de microinteracciones de la propuesta. Fase 3 queda completamente cerrada: paleta, tokens, tipografía y theme toggle.

**No iniciado deliberadamente en esta sesión:** animaciones GSAP (Fase 4) — por instrucción explícita de mantener esta sesión limitada al Header, la tipografía y el selector de tema.
