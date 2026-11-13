# Duarte & Muñoz Abogados — Landing page

Landing page corporativa de una sola página para un despacho de abogados de **Itagüí (Antioquia, Colombia)**, especializado en derecho penal, derecho administrativo y asuntos penitenciarios.

Su objetivo es **convertir visitas en consultas por WhatsApp**, transmitiendo confianza y calidad: diseño editorial "premium", carga muy rápida, accesible (WCAG 2.1 AA) y optimizada para buscadores y para compartir el enlace en redes.

> **Estado:** en producción con los datos reales de los dos abogados. Algunos datos están pendientes de confirmar con el cliente (nombre comercial, correo, cargos…) — ver [Contenido pendiente de confirmar](#contenido-pendiente-de-confirmar).

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Puesta en marcha](#puesta-en-marcha)
3. [Scripts disponibles](#scripts-disponibles)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Cómo editar el contenido](#cómo-editar-el-contenido)
6. [Secciones de la página](#secciones-de-la-página)
7. [Sistema de diseño](#sistema-de-diseño)
8. [Animaciones](#animaciones)
9. [SEO y tarjeta al compartir](#seo-y-tarjeta-al-compartir)
10. [Rendimiento y accesibilidad](#rendimiento-y-accesibilidad)
11. [Tests](#tests)
12. [Despliegue](#despliegue)
13. [Documentación interna y flujo de trabajo](#documentación-interna-y-flujo-de-trabajo)
14. [Problemas conocidos y consejos](#problemas-conocidos-y-consejos)

---

## Stack tecnológico

| Herramienta                                               | Uso                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Astro 7](https://docs.astro.build)                       | Framework. Sitio **100 % estático**, sin hidratación de componentes (ningún `client:*`).    |
| TypeScript (modo estricto)                                | Todo el código y los esquemas de contenido.                                                 |
| [Tailwind CSS 4](https://tailwindcss.com)                 | Estilos, sobre un sistema de **tokens de color semánticos** (`bg-primary`, `text-accent`…). |
| [GSAP](https://gsap.com) + ScrollTrigger + ScrollSmoother | Scroll suave, apariciones al hacer scroll y contadores.                                     |
| Content Collections + [Zod](https://zod.dev)              | Abogados y áreas de práctica en Markdown, validados en build.                               |
| [astro-icon](https://www.astroicon.dev) + Lucide          | Iconos SVG en línea.                                                                        |
| `@fontsource`                                             | Fuentes autoservidas (Playfair Display + Plus Jakarta Sans), sin peticiones a Google Fonts. |
| [Vitest](https://vitest.dev) + Container API de Astro     | Tests unitarios y de componentes.                                                           |
| [Playwright](https://playwright.dev) + axe-core           | Tests end-to-end, de accesibilidad y SEO.                                                   |
| Prettier                                                  | Formato (con plugins de Astro y Tailwind).                                                  |

No hay backend, base de datos ni formularios: la conversión se hace con enlaces `wa.me` con mensaje precargado.

---

## Puesta en marcha

**Requisitos:** Node.js **≥ 22.12** (≥ 22.18 para `npm run assets:seo`) y npm.

```sh
npm install
npx playwright install chromium   # solo para tests e2e y para generar imágenes SEO
```

Servidor de desarrollo (en segundo plano, como indica `CLAUDE.md`/`AGENTS.md`):

```sh
npx astro dev --background        # http://localhost:4321
npx astro dev status              # estado
npx astro dev logs                # registros
npx astro dev stop                # detener
```

Build de producción y previsualización:

```sh
npm run build                     # genera dist/
npm run preview                   # sirve dist/ en local
```

> Para ver la **intro de carga** usa `npm run build && npm run preview` en una ventana de incógnito (solo se muestra una vez por sesión). Con `astro dev` en frío puede no verse — ver [Problemas conocidos](#problemas-conocidos-y-consejos).

---

## Scripts disponibles

| Script                            | Qué hace                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo (primer plano).                                                  |
| `npm run build`                   | Build estático de producción en `dist/`.                                                |
| `npm run preview`                 | Sirve el build de `dist/`.                                                              |
| `npm run format` / `format:check` | Formatea / comprueba el formato con Prettier.                                           |
| `npm test`                        | Tests unitarios y de componentes (Vitest). Sincroniza antes el contenido.               |
| `npm run test:watch` / `test:ui`  | Vitest en modo observador / con interfaz web.                                           |
| `npm run test:coverage`           | Tests con informe de cobertura.                                                         |
| `npm run test:e2e`                | Tests end-to-end con Playwright (arranca y detiene solo un servidor en el puerto 4325). |
| `npm run assets:seo`              | Regenera la imagen para compartir (`og.jpg`) y los iconos PNG/ICO.                      |

Verificación completa antes de un commit:

```sh
npm run format:check && npx astro check && npm test && npm run test:e2e && npm run build
```

---

## Estructura del proyecto

```text
/
├── astro.config.mjs            # Config de Astro: dominio del sitio (SEO), Tailwind, iconos
├── vitest.config.ts            # Tests unitarios/componentes (+ globalSetup de contenido)
├── playwright.config.ts        # Tests e2e: escritorio (Chrome) y móvil (Pixel 7)
├── scripts/
│   └── generar-assets-seo.mjs  # Genera og.jpg, apple-touch-icon, icon-192/512, favicon.ico
├── public/                     # Archivos estáticos servidos tal cual
│   ├── og.jpg                  # Imagen de la tarjeta al compartir (1200×630)
│   ├── favicon.svg / .ico      # Favicon (balanza de la justicia)
│   └── apple-touch-icon.png, icon-192.png, icon-512.png
├── src/
│   ├── pages/
│   │   ├── index.astro         # Portada: compone las secciones + JSON-LD
│   │   ├── 404.astro           # Página de error (noindex, sin intro)
│   │   ├── robots.txt.ts       # robots.txt generado en build
│   │   ├── sitemap.xml.ts      # sitemap.xml generado en build
│   │   └── site.webmanifest.ts # Manifest web generado desde negocio.ts
│   ├── layouts/
│   │   └── BaseLayout.astro    # <head> completo (SEO, OG, iconos), scripts bloqueantes, estructura de ScrollSmoother
│   ├── components/
│   │   ├── static/             # Componentes SIN <script> propio
│   │   │   ├── Header.astro        # Cabecera fija: logo-monograma, navegación, CTA
│   │   │   ├── IntroCarga.astro    # Animación de entrada a pantalla completa
│   │   │   ├── Hero.astro          # Titular, CTAs, garantías y tarjeta "Cómo empezamos"
│   │   │   ├── CifrasClave.astro   # Banda oscura con cifras animadas
│   │   │   ├── SobreNosotros.astro # Perfiles de los abogados
│   │   │   ├── Servicios.astro     # Grid de áreas de práctica
│   │   │   ├── TarjetaServicio.astro
│   │   │   └── Footer.astro        # Llamada a la acción final, contacto y aviso de datos
│   │   └── interactive/        # Componentes CON <script> propio
│   │       ├── MenuMovil.astro     # Menú móvil a pantalla completa
│   │       └── ThemeToggle.astro   # Selector claro/oscuro
│   ├── content/                # Contenido editable en Markdown
│   │   ├── socios/             # Un .md (+ avatar) por abogado
│   │   └── servicios/          # Un .md por área de práctica
│   ├── content.config.ts       # Esquemas Zod de las colecciones
│   ├── lib/
│   │   ├── negocio.ts          # ★ Datos del despacho: nombre, contacto, ciudad…
│   │   ├── seo.ts              # ★ Título, descripción y textos de la tarjeta al compartir
│   │   ├── schema.ts           # Generador de datos estructurados (JSON-LD)
│   │   ├── whatsapp.ts         # Construcción de enlaces wa.me
│   │   └── gsap/               # Registro de GSAP, ScrollSmoother y animaciones
│   └── styles/
│       └── global.css          # ★ Paleta de colores, tipografía y animaciones CSS
└── tests/
    ├── setup/                  # globalSetup de Vitest (sincroniza el contenido)
    ├── unit/                   # Lógica pura: SEO, schema, WhatsApp, negocio
    ├── components/             # Render de componentes con el Container API
    └── e2e/                    # Navegador real: accesibilidad, menú, intro, SEO…
```

**Convención `static/` vs `interactive/`:** el criterio es si el archivo tiene su propio `<script>`, no si termina animado en pantalla. Las animaciones de GSAP se inicializan centralizadamente desde `BaseLayout.astro` a partir de atributos `data-*`.

---

## Cómo editar el contenido

Casi todo el contenido se cambia **sin tocar componentes**. Los archivos marcados con ★ en la estructura son los habituales.

### Datos del despacho — `src/lib/negocio.ts`

Fuente única de verdad para el nombre comercial, la descripción, el WhatsApp (formato E.164, ej. `+573124874581`), el correo, la dirección, el área de cobertura, el horario y las redes sociales. Se reutiliza en el HTML visible, en los datos estructurados y en el manifest, así que nunca quedan desincronizados.

- `direccion.calle` y `horario` son **opcionales**: si se dejan vacíos, el footer y el JSON-LD los omiten.
- Al añadir redes sociales a `redesSociales`, se publican automáticamente como `sameAs`.

### Abogados — `src/content/socios/*.md`

Un archivo por abogado (ver la plantilla `_ejemplo.md`; los archivos que empiezan por `_` se ignoran):

```yaml
---
nombre: 'Nombre Apellido'
cargo: 'Abogada litigante'
foto: './nombre-apellido.svg' # imagen junto al .md (svg, jpg, png…)
formacion: ['Título — Universidad (Año)']
experiencia: ['Cargo — Entidad (Año – Año)']
especialidades: ['Derecho Penal']
acreditaciones: [] # opcional: el bloque se oculta si está vacío
orden: 0 # posición en la página
---
Biografía en Markdown (se muestra en la ficha).
```

### Áreas de práctica — `src/content/servicios/*.md`

```yaml
---
titulo: 'Derecho Penal'
resumen: 'Descripción breve, 1–2 frases.'
icono: 'gavel' # nombre de un icono de Lucide (https://lucide.dev/icons)
mensajeWhatsapp: 'Hola, quisiera una consulta sobre…'
rangoHonorarios: 'Consulta inicial: …' # opcional: si falta, no se muestra
orden: 0
---
```

Si un campo falta o tiene un tipo incorrecto, **el build falla** en lugar de publicar una ficha incompleta.

### Textos SEO — `src/lib/seo.ts`

Título de la página, meta description y textos de la tarjeta al compartir. Los tests vigilan que no superen la longitud que muestra Google (título ≤ 60 caracteres, descripción ≤ 155).

### Imagen para compartir e iconos

`public/og.jpg` y los iconos PNG/ICO se generan con:

```sh
npm run assets:seo
```

**Vuelve a ejecutarlo siempre que cambie el nombre del despacho, la ciudad o las áreas de práctica** (la imagen muestra las tres primeras por `orden`). El favicon vectorial se edita a mano en `public/favicon.svg`.

### Textos fijos de la interfaz

Algunos textos viven en los propios componentes: los pasos y garantías del Hero (`Hero.astro`), las cifras clave (`CifrasClave.astro`), la cita de "Nuestros abogados" (`SobreNosotros.astro`) y la llamada a la acción final y el aviso de datos (`Footer.astro`).

---

## Secciones de la página

| #   | Sección                                           | Componente                                  | Ancla             |
| --- | ------------------------------------------------- | ------------------------------------------- | ----------------- |
| —   | Intro de carga (primera visita de la sesión)      | `IntroCarga.astro`                          | —                 |
| —   | Cabecera fija                                     | `Header.astro`                              | —                 |
| 1   | Hero: titular, CTAs, garantías, "Cómo empezamos"  | `Hero.astro`                                | —                 |
| 2   | Cifras clave (banda oscura)                       | `CifrasClave.astro`                         | `#cifras-clave`   |
| 3   | Nuestros abogados                                 | `SobreNosotros.astro`                       | `#sobre-nosotros` |
| 4   | Servicios jurídicos                               | `Servicios.astro` + `TarjetaServicio.astro` | `#servicios`      |
| 5   | Llamada a la acción final, contacto y aviso legal | `Footer.astro`                              | `#contacto`       |

Todos los botones de contacto abren WhatsApp con un mensaje precargado específico (el de cada área de práctica en sus tarjetas).

---

## Sistema de diseño

Dirección de arte **editorial premium**: marfil cálido, tinta azul casi negra y oro viejo reservado para detalles (subtítulos, líneas finas, cifras). Todo el color vive en `src/styles/global.css` como **variables CSS** registradas en Tailwind; los componentes nunca usan colores crudos (`bg-slate-100`…), solo tokens semánticos. Cambiar la identidad visual —incluido el modo oscuro— es editar solo esos valores.

| Token                        | Claro                     | Oscuro                | Uso                                         |
| ---------------------------- | ------------------------- | --------------------- | ------------------------------------------- |
| `background`                 | `#f7f4ee`                 | `#0c0e13`             | Fondo de página                             |
| `foreground`                 | `#14171e`                 | `#ece6d8`             | Texto principal                             |
| `primary`                    | `#111a2c`                 | `#d4b884`             | Botones principales                         |
| `accent`                     | `#7a5c32`                 | `#cfae76`             | Texto de acento (oro apto para texto)       |
| `gold`                       | `#b8955c`                 | `#a88a58`             | Solo líneas y adornos, nunca texto          |
| `muted` / `muted-foreground` | `#efe9de` / `#5a5f69`     | `#171b23` / `#9da3ad` | Superficies alternas / texto secundario     |
| `ink-*`                      | `#0e1422` + oro `#cfae76` | (igual)               | Bandas oscuras invariantes: cifras y footer |

- **Contraste:** todos los pares texto/fondo se verificaron con la fórmula WCAG; el peor caso es 5.11:1 (AA). Los tests de axe lo comprueban en ambos temas.
- **Tipografía:** Playfair Display (titulares, 500/500 cursiva/600) + Plus Jakarta Sans (texto, 400/500/600).
- **Modo oscuro:** automático según el sistema y forzable con el botón sol/luna (se recuerda en `localStorage`). Un script bloqueante evita el parpadeo de tema al cargar.

---

## Animaciones

Toda animación respeta **`prefers-reduced-motion`**: si el usuario pide menos movimiento, el contenido aparece directamente en su estado final.

| Animación                   | Tecnología          | Detalle                                                                                                                                                                                               |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro de carga (~2.9 s)     | CSS + SVG (~1 KB)   | Balanza de la justicia dibujada en oro que se equilibra, nombre del despacho y telón que sube. **Una vez por sesión**; clic o Escape la saltan; no aparece en navegadores automatizados ni en la 404. |
| Entrada del Hero            | CSS puro            | No espera a JavaScript: el titular (elemento LCP) se revela desde el primer pintado. Se retrasa automáticamente para empezar cuando sube el telón de la intro.                                        |
| Scroll suave                | GSAP ScrollSmoother | Desactivado en pantallas táctiles (el scroll nativo es mejor ahí).                                                                                                                                    |
| Apariciones al hacer scroll | GSAP ScrollTrigger  | Atributos `data-reveal="left                                                                                                                                                                          | right | up"`y`data-reveal-grid`. |
| Contadores de cifras        | GSAP                | `data-counter`; el HTML ya trae el valor final (sin JS se ve completo).                                                                                                                               |
| Hovers                      | CSS                 | Tarjetas de servicio (150 ms), botones, subrayado de la navegación.                                                                                                                                   |

---

## SEO y tarjeta al compartir

- **Dominio canónico** (`astro.config.mjs` → `site`): `SITE_URL` si está definida; si no, `VERCEL_PROJECT_PRODUCTION_URL` (la inyecta Vercel en cada build); en local, `http://localhost:4321`. De ahí salen todas las URLs absolutas.
- **`<head>` completo** (`BaseLayout.astro`): título y descripción optimizados, canonical, `robots` con `max-image-preview:large`, Open Graph completo (imagen absoluta 1200×630 con alt y dimensiones, locale `es_CO`), Twitter `summary_large_image`, favicon, apple-touch-icon y manifest. Los metadatos van antes de los scripts para los rastreadores que solo leen el principio del HTML.
- **Datos estructurados (JSON-LD)**: un `@graph` con `WebSite`, `WebPage`, `ImageObject` y `LegalService` (servicios como `OfferCatalog`, abogados como `Person`), enlazados por `@id`. Omite los campos sin dato real.
- **Semántica:** el `<h1>` incluye la búsqueda local "Abogados en Itagüí"; los datos de contacto van en `<address>`; `lang="es-CO"`.
- **Archivos para buscadores:** `/robots.txt`, `/sitemap.xml` y `/site.webmanifest`, generados en el build.
- **Página 404** propia con `noindex`.
- **Tarjeta al compartir (WhatsApp, Facebook, LinkedIn, X):** `public/og.jpg`, 1200×630, ~44 KB (WhatsApp descarta imágenes de más de ~300 KB). La composición es centrada para que funcione también cuando WhatsApp la recorta en cuadrado.

Tras cada despliegue con cambios en la tarjeta, se puede forzar su actualización en el [Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/) (WhatsApp usa los mismos datos).

---

## Rendimiento y accesibilidad

**Rendimiento**

- HTML estático, sin frameworks de UI ni hidratación.
- Fuentes autoservidas; la de los titulares se **precarga**. Solo se incluyen los pesos usados.
- La entrada del Hero es CSS (no depende del bundle de GSAP).
- El fondo ambiental usa `radial-gradient` en lugar de filtros de desenfoque.
- La intro reserva el hueco de la barra de desplazamiento (`scrollbar-gutter`) para no provocar _layout shift_ al terminar.

**Accesibilidad**

- Contraste WCAG AA verificado en claro y oscuro (tests con axe-core).
- Navegación completa por teclado con foco visible; menú móvil cerrable con Escape.
- Iconos decorativos con `aria-hidden`; botones de solo icono con `aria-label`.
- Un único `<h1>` y jerarquía de encabezados correcta.
- Sin JavaScript, todo el contenido sigue siendo visible.

---

## Tests

| Tipo        | Ubicación           | Herramienta                              | Qué cubre                                                                                                              |
| ----------- | ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Unitarios   | `tests/unit/`       | Vitest                                   | SEO (longitudes), JSON-LD, enlaces de WhatsApp, formato de teléfono, sincronía del contenido                           |
| Componentes | `tests/components/` | Vitest + Container API                   | Render y estructura de cada componente y de la portada (incluido el `<head>` SEO)                                      |
| End-to-end  | `tests/e2e/`        | Playwright (Chrome escritorio + Pixel 7) | Accesibilidad (axe), menú móvil, scroll suave, movimiento reducido, intro y _layout shift_, recursos SEO servidos, 404 |

```sh
npm test            # unitarios + componentes
npm run test:e2e    # end-to-end (gestiona su propio servidor)
```

Detalles importantes:

- **Sincronización de contenido:** antes de los tests de Vitest, `tests/setup/sincronizar-contenido.ts` ejecuta `astro sync` y deja el contenido donde Vitest lo lee. Sin esto, los tests leían una caché antigua de `astro dev`. Un test de guarda (`contenido-sincronizado.test.ts`) falla si las colecciones no coinciden con los `.md` del disco.
- **La intro no aparece en los tests e2e** (se omite cuando `navigator.webdriver` es verdadero) para no tapar la página; `intro.spec.ts` la prueba simulando un navegador real.
- **Barras de desplazamiento:** `intro-layout-shift.spec.ts` lanza Chromium sin `--hide-scrollbars` (la opción por defecto de Playwright ocultaba justo el fallo que prueba).

---

## Despliegue

Pensado para **Vercel** (el build es estático, `dist/`):

1. Conectar el repositorio en Vercel (framework detectado: Astro).
2. Comando de build `npm run build`, directorio de salida `dist`.
3. Cuando haya dominio propio, definir la variable de entorno **`SITE_URL`** (ej. `https://www.dominio.com`) y redeployar. Sin ella se usa el dominio de producción `.vercel.app`.

Después del primer despliegue: dar de alta el sitio en **Google Search Console** y enviar `/sitemap.xml`, y crear un **Perfil de Empresa de Google** para el SEO local.

---

## Documentación interna y flujo de trabajo

| Archivo                   | Contenido                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_STATE.md`        | **Fuente de verdad operativa**: decisiones de arquitectura y su porqué, historial de cada sesión de trabajo, bugs encontrados y pendientes. Se actualiza al final de cada sesión. |
| `CLAUDE.md` / `AGENTS.md` | Instrucciones para asistentes de IA (servidor en segundo plano, guías de Astro).                                                                                                  |
| `TAREAS.md`               | Lista local de tareas pendientes (no se sube a GitHub: excluida vía `.git/info/exclude`).                                                                                         |

**Flujo git:** los cambios grandes se desarrollan en ramas (`design/…`, `seo/…`, `contenido/…`) y se integran en `master` con _fast-forward_:

```sh
git checkout master && git merge --ff-only <rama> && git push origin master
```

Los mensajes de commit siguen [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `style:`, `test:`…).

---

## Contenido pendiente de confirmar

Los datos de los abogados provienen de sus hojas de vida (solo la información profesional; se excluyeron a propósito datos personales como cédula, fecha de nacimiento, domicilio o referencias). Quedan por confirmar con el cliente:

- Nombre comercial ("Duarte & Muñoz Abogados") — al cambiarlo, ejecutar `npm run assets:seo`.
- Correo y WhatsApp definitivos del despacho.
- Cargos de cada abogado y una posible errata (UNISABANA / UNISABANETA).
- Textos de compromiso de la interfaz (pasos del Hero, cita, honorarios).
- Horario, dirección de oficina, honorarios y fotos reales (opcionales).

---

## Problemas conocidos y consejos

- **La intro no se ve con `astro dev` recién arrancado:** en desarrollo, Vite inyecta el CSS con JavaScript y la compilación en frío puede durar más que los 3 s de la intro. Revísala con `npm run build && npm run preview` (en incógnito, porque solo se muestra una vez por sesión).
- **`npm run test:watch` y contenido:** la sincronización se hace al arrancar Vitest; si editas un `.md` con el modo observador activo, relánzalo.
- **Enlaces externos con ancla** (ej. `…/#servicios`): con ScrollSmoother activo, cargar la página directamente con un hash puede no desplazar a la sección. Limitación documentada en `src/lib/gsap/scrollSmoother.ts`.
- **`position: sticky` no funciona dentro de `#smooth-content`** (ScrollSmoother lo transforma). Los elementos fijos, como la cabecera, viven fuera de ese contenedor (slot `fixed` del layout).
