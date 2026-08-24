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

Contexto completo y justificación de cada decisión: ver la Propuesta de Arquitectura (documento externo, sección 01–04).

## Roadmap de fases

- [ ] **Fase 0 — Descubrimiento y contenido real.** Bios, fotos, áreas de práctica, honorarios, número de WhatsApp reales del cliente. _(Sigue bloqueada en insumo del cliente — ver aviso de contenido ficticio abajo. No confundir con la Fase 2, que ya avanzó usando datos de relleno.)_
- [x] **Fase 1 — Setup y arquitectura base.** Astro + TypeScript estricto, Tailwind, Content Collections, árbol de carpetas, `PROJECT_STATE.md`.
- [x] **Fase 2 — Estructura estática.** Componentes `.astro` de `components/static/` ensamblados en `index.astro`, sitio completamente navegable y responsive, sin una línea de GSAP. Construida sobre contenido ficticio (ver abajo), no sobre el insumo real de Fase 0.
- [ ] **Fase 3 — Sistema visual y diseño.** Tipografía propia (par de fuentes), paleta de marca vía `@theme` de Tailwind, ritmo vertical, estados de componentes; revisión de contraste WCAG. La Fase 2 usó la paleta y tipografía por defecto de Tailwind (`slate`/`amber`/`emerald`, fuentes del sistema) deliberadamente, para no anticipar decisiones de marca que le corresponden a esta fase.
- [ ] **Fase 4 — Animación e interacción.** Implementación de GSAP/ScrollTrigger según la tabla de microinteracciones de la propuesta.
- [ ] **Fase 5 — SEO, Schema y accesibilidad.** JSON-LD `LegalService` (generador ya existe en `schema.ts`, falta invocarlo desde una página), OpenGraph (imagen dedicada), auditoría de teclado/contraste/alt.
- [ ] **Fase 6 — Testing y QA.** Lighthouse, prueba de enlaces WhatsApp, `prefers-reduced-motion`, cross-browser (prioridad Safari iOS).
- [ ] **Fase 7 — Despliegue.** Hosting, dominio, analítica, Search Console.

## ⚠️ Contenido ficticio — no confundir con datos reales del cliente

Para no bloquear el avance estructural mientras el cliente recopila su material (Fase 0), esta sesión pobló `negocio.ts` y las colecciones de contenido con un despacho, socios y honorarios **inventados pero verosímiles**: "Duarte & Iglesias Abogados", Elena Duarte Ríos y Javier Iglesias Montes, dirección en Calle de Alcalá (Madrid), teléfono `+34612345678`, email `info@duarteiglesiasabogados.es`. Las fotos de los socios son avatares SVG con monograma (iniciales sobre un círculo), no fotografías — se evitó deliberadamente usar imágenes de stock de personas reales (p. ej. Unsplash) como retrato de un abogado ficticio.

**Antes de desplegar a producción o compartir una vista previa con el cliente**, todo esto debe reemplazarse por datos reales (Fase 0). Buscar `Duarte & Iglesias`, `duarteiglesiasabogados.es` y `+34612345678` en el repo para localizar cada punto de reemplazo.

## Estado actual

**Completado (24 de agosto de 2026):**

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
2. Fase 3 — sistema visual: definir tipografía de marca y tokens de color propios (hoy la Fase 2 usa la paleta/tipografía por defecto de Tailwind a propósito, para no adelantar esta decisión).
3. Invocar `generarLegalServiceSchema()` (ya existe en `schema.ts`) desde `BaseLayout.astro` o `index.astro` e inyectarlo como `<script type="application/ld+json">` — quedó implementado pero no conectado.
4. Imagen OpenGraph dedicada (1200×630) — `BaseLayout.astro` ya emite las meta tags pero sin `og:image` todavía.

**No iniciado deliberadamente en esta sesión:** animaciones GSAP reales (Fase 4), tokens de marca/paleta definitiva (Fase 3) — por instrucción explícita de mantener esta sesión limitada a estructura estática.
