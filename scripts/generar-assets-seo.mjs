/**
 * Genera los recursos gráficos de SEO y de la tarjeta al compartir:
 *   public/og.jpg              1200×630 — vista previa en WhatsApp, Facebook, LinkedIn, X
 *   public/apple-touch-icon.png 180×180 — icono en iOS al guardar en inicio
 *   public/icon-192.png / icon-512.png  — Web App Manifest (Android)
 *   public/favicon.ico          32×32   — navegadores que no usan el SVG
 *
 * Uso: `npm run assets:seo` (volver a ejecutarlo si cambia el nombre del
 * despacho, la ciudad o las áreas de práctica). Renderiza HTML con
 * Playwright (ya es dependencia de desarrollo) usando las mismas fuentes
 * autoservidas del sitio, así que el resultado es idéntico a la marca.
 *
 * Requiere Node ≥ 22.18 (importa negocio.ts directamente con type stripping).
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { negocio } from '../src/lib/negocio.ts';

const raiz = new URL('../', import.meta.url);
const pub = (archivo) => new URL(`public/${archivo}`, raiz);
// Las fuentes se incrustan como data: URL — una página creada con
// setContent() (origen about:blank) no puede cargar archivos file://.
const fuente = async (archivo) => {
  const datos = await readFile(new URL(`node_modules/@fontsource/${archivo}`, raiz));
  return `data:font/woff2;base64,${datos.toString('base64')}`;
};

// --- Datos ----------------------------------------------------------------
const nombre = negocio.nombreDespacho.replace(/\s+Abogados$/i, '');
const { ciudad } = negocio.direccion;

// Las tres primeras áreas de práctica (por `orden`) para el subtítulo.
const dirServicios = new URL('src/content/servicios/', raiz);
const servicios = [];
for (const archivo of await readdir(dirServicios)) {
  if (!archivo.endsWith('.md') || archivo.startsWith('_')) continue;
  const md = await readFile(new URL(archivo, dirServicios), 'utf8');
  const titulo = /^titulo:\s*'(.+)'$/m.exec(md)?.[1];
  const orden = Number(/^orden:\s*(\d+)$/m.exec(md)?.[1] ?? 99);
  if (titulo) servicios.push({ titulo, orden });
}
const areas = servicios
  .sort((a, b) => a.orden - b.orden)
  .slice(0, 3)
  .map((s) => s.titulo);

// --- Plantillas -----------------------------------------------------------
const estilosBase = `
  @font-face { font-family: 'Playfair Display'; font-weight: 500;
    src: url('${await fuente('playfair-display/files/playfair-display-latin-500-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Plus Jakarta Sans'; font-weight: 500;
    src: url('${await fuente('plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Plus Jakarta Sans'; font-weight: 600;
    src: url('${await fuente('plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2')}') format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
`;

const balanza = (trazo) => `
  <svg viewBox="0 0 120 120" fill="none" stroke="#cfae76" stroke-width="${trazo}"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M60 22 V102" /><path d="M42 104 H78" /><path d="M50 102 Q60 96 70 102" />
    <circle cx="60" cy="18" r="3" /><path d="M22 32 H98" />
    <path d="M24 32 L14 66 M24 32 L34 66" /><path d="M10 66 H38 Q36 76 24 76 Q12 76 10 66 Z" />
    <path d="M96 32 L86 66 M96 32 L106 66" /><path d="M82 66 H110 Q108 76 96 76 Q84 76 82 66 Z" />
  </svg>`;

// Composición centrada a propósito: algunas apps (WhatsApp en vista
// compacta) recortan la vista previa a un cuadrado central.
const htmlOg = `<!doctype html><html><head><meta charset="utf-8"><style>${estilosBase}
  body { background: radial-gradient(700px 420px at 50% 42%, rgb(207 174 118 / 0.13), transparent 70%), #0e1422;
         display: grid; place-items: center; font-family: 'Plus Jakarta Sans'; color: #f3ede1; }
  .marco { position: absolute; inset: 26px; border: 1px solid rgb(207 174 118 / 0.35); }
  .marco::after { content: ''; position: absolute; inset: 8px; border: 1px solid rgb(207 174 118 / 0.15); }
  .contenido { display: flex; flex-direction: column; align-items: center; text-align: center; }
  svg { width: 118px; height: 118px; }
  h1 { margin-top: 26px; font-family: 'Playfair Display'; font-weight: 500; font-size: 84px;
       letter-spacing: -0.01em; line-height: 1; }
  .linea { width: 84px; height: 1px; background: #cfae76; margin: 30px 0 24px; }
  .sub { font-weight: 600; font-size: 19px; letter-spacing: 0.42em; padding-left: 0.42em;
         text-transform: uppercase; color: #cfae76; }
  .areas { margin-top: 30px; font-weight: 500; font-size: 22px; color: #a9b0bc; letter-spacing: 0.01em; }
  .areas span { color: rgb(207 174 118 / 0.6); margin: 0 14px; }
</style></head><body>
  <div class="marco"></div>
  <div class="contenido">
    ${balanza(1.6)}
    <h1>${nombre}</h1>
    <div class="linea"></div>
    <p class="sub">Abogados · ${ciudad}</p>
    <p class="areas">${areas.join('<span>·</span>')}</p>
  </div>
</body></html>`;

// Icono a sangre completa (sin esquinas redondeadas): iOS y Android aplican
// su propia máscara, y un fondo transparente en las esquinas saldría negro.
const htmlIcono = `<!doctype html><html><head><meta charset="utf-8"><style>${estilosBase}
  body { background: #0e1422; display: grid; place-items: center; }
  svg { width: 64%; height: 64%; }
</style></head><body>${balanza(4)}</body></html>`;

// --- Render ---------------------------------------------------------------
const navegador = await chromium.launch();

async function capturar(html, ancho, alto, opciones) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  const buffer = await pagina.screenshot(opciones);
  await pagina.close();
  return buffer;
}

await writeFile(pub('og.jpg'), await capturar(htmlOg, 1200, 630, { type: 'jpeg', quality: 88 }));
for (const lado of [180, 192, 512]) {
  const archivo = lado === 180 ? 'apple-touch-icon.png' : `icon-${lado}.png`;
  await writeFile(pub(archivo), await capturar(htmlIcono, lado, lado, { type: 'png' }));
}

// favicon.ico: contenedor ICO con un único PNG de 32×32 embebido (formato
// válido desde Windows Vista; lo aceptan todos los navegadores actuales).
const svgFavicon = await readFile(pub('favicon.svg'), 'utf8');
const png32 = await capturar(
  `<!doctype html><html><head><style>*{margin:0}body{background:transparent}svg{width:32px;height:32px;display:block}</style></head><body>${svgFavicon}</body></html>`,
  32,
  32,
  { type: 'png', omitBackground: true },
);
const cabecera = Buffer.alloc(22);
cabecera.writeUInt16LE(0, 0); // reservado
cabecera.writeUInt16LE(1, 2); // tipo: icono
cabecera.writeUInt16LE(1, 4); // nº de imágenes
cabecera.writeUInt8(32, 6); // ancho
cabecera.writeUInt8(32, 7); // alto
cabecera.writeUInt8(0, 8); // paleta
cabecera.writeUInt8(0, 9); // reservado
cabecera.writeUInt16LE(1, 10); // planos
cabecera.writeUInt16LE(32, 12); // bits por píxel
cabecera.writeUInt32LE(png32.length, 14); // tamaño de los datos
cabecera.writeUInt32LE(22, 18); // desplazamiento de los datos
await writeFile(pub('favicon.ico'), Buffer.concat([cabecera, png32]));

await navegador.close();
console.log(`Assets SEO generados en public/ — áreas en la imagen: ${areas.join(', ')}`);
