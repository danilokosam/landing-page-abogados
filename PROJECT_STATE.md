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

- [x] **Fase 0 — Descubrimiento y contenido.** Bios, fotos, áreas de práctica, honorarios, número de WhatsApp reales. *(Bloqueado en insumo del cliente — ver "Estado actual".)*
- [x] **Fase 1 — Setup y arquitectura base.** Astro + TypeScript estricto, Tailwind, Content Collections, árbol de carpetas, `PROJECT_STATE.md`.
- [ ] **Fase 2 — Estructura estática.** Componentes `.astro` de `components/static/` con contenido real ya cargado en las colecciones; sitio completamente navegable sin una línea de GSAP.
- [ ] **Fase 3 — Sistema visual y diseño.** Tipografía, paleta, ritmo vertical, estados de componentes; revisión de contraste WCAG.
- [ ] **Fase 4 — Animación e interacción.** Implementación de GSAP/ScrollTrigger según la tabla de microinteracciones de la propuesta.
- [ ] **Fase 5 — SEO, Schema y accesibilidad.** JSON-LD `LegalService`, OpenGraph, auditoría de teclado/contraste/alt.
- [ ] **Fase 6 — Testing y QA.** Lighthouse, prueba de enlaces WhatsApp, `prefers-reduced-motion`, cross-browser (prioridad Safari iOS).
- [ ] **Fase 7 — Despliegue.** Hosting, dominio, analítica, Search Console.

## Estado actual

**Completado (24 de agosto de 2026):**

- Proyecto Astro inicializado con `tsconfig` en modo `strict`.
- Dependencias instaladas: `astro`, `@tailwindcss/vite` + `tailwindcss` (integración oficial), `gsap`, `astro-icon` + `@iconify-json/lucide`, `zod`, `@astrojs/check` + `typescript` (dev).
- `astro.config.mjs` con integraciones `tailwindcss()` e `icon()` registradas.
- Árbol de carpetas creado según la arquitectura acordada (`src/content/`, `src/components/{static,interactive,ui}/`, `src/layouts/`, `src/lib/{gsap,}`, `src/styles/`, `src/pages/`).
- `src/content.config.ts` — esquemas Zod para `servicios` y `socios`, usando la Content Layer API (`glob` loader) de Astro 7; formato `defineCollection` legacy descartado por incompatible con esta versión.
- Plantillas de referencia `_ejemplo.md` en `content/servicios/` y `content/socios/` (ignoradas por el loader — prefijo `_`).
- `src/lib/negocio.ts`, `src/lib/whatsapp.ts`, `src/lib/schema.ts`, `src/lib/gsap/setup.ts`, `src/lib/gsap/animations.ts` — esqueletos tipados, con datos de negocio en placeholder (`TODO(fase 0)`).
- `src/layouts/BaseLayout.astro` — documento base con metadata/OpenGraph mínimo, sin secciones de UI.
- `src/pages/index.astro` — usa `BaseLayout`, sin maquetación de secciones todavía.
- Verificado: `npx astro check` (0 errores) y `npx astro build` (build de producción exitoso).
- Git **no inicializado todavía** — pendiente de decisión del usuario.

**Pendiente para la próxima sesión (arranca en Fase 0 / Fase 2):**

1. Insumo real del cliente: bios de los dos socios, fotos, áreas de práctica definitivas, honorarios o política de primera consulta, número de WhatsApp de negocio, dirección/horario.
2. Completar `src/lib/negocio.ts` con esos datos reales (reemplaza los placeholders `TODO(fase 0)`).
3. Crear las entradas reales en `src/content/servicios/*.md` y `src/content/socios/*.md` (copiando `_ejemplo.md` sin el guion bajo).
4. Recién entonces: Fase 2 — construir los componentes de `components/static/` (Header, Hero, SobreNosotros, TarjetaServicio, Footer, SEO) y componer `index.astro`.

**No iniciado deliberadamente en esta sesión:** maquetación, componentes de UI, animaciones GSAP reales, contenido de marketing — por instrucción explícita de mantener esta sesión limitada a setup.
