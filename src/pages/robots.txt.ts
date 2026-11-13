import type { APIRoute } from 'astro';
import { urlAbsoluta } from '@/lib/seo';

/**
 * robots.txt generado en build: permite rastrear todo y declara la URL
 * absoluta del sitemap (que depende del dominio configurado en `site`).
 */
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${urlAbsoluta('/sitemap.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
