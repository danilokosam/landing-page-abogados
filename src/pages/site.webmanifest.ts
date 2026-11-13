import type { APIRoute } from 'astro';
import { negocio } from '@/lib/negocio';
import { nombreCorto, seo } from '@/lib/seo';

/**
 * Web App Manifest — nombre e icono cuando se añade el sitio a la pantalla
 * de inicio (Android). Generado desde negocio.ts para no duplicar el nombre.
 * Los PNG los produce `npm run assets:seo`.
 */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: negocio.nombreDespacho,
        short_name: nombreCorto,
        description: seo.descripcion,
        lang: seo.idioma,
        start_url: '/',
        display: 'browser',
        background_color: '#0e1422',
        theme_color: '#0e1422',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
