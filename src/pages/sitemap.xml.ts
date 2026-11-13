import type { APIRoute } from 'astro';
import { urlAbsoluta } from '@/lib/seo';

/**
 * Sitemap XML generado en build. El sitio es de una sola página indexable
 * (la 404 lleva noindex y no se incluye), así que basta un endpoint propio
 * en vez de añadir la dependencia @astrojs/sitemap. Si se añaden páginas,
 * agregarlas a `rutas`.
 */
const rutas = ['/'];

export const GET: APIRoute = ({ site }) => {
  const urls = rutas
    .map((ruta) => `  <url>\n    <loc>${urlAbsoluta(ruta, site)}</loc>\n  </url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
