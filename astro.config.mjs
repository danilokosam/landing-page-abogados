// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';

/**
 * URL pública del sitio — base de las URLs absolutas que exige el SEO:
 * <link rel="canonical">, og:url/og:image (WhatsApp y redes NO aceptan
 * rutas relativas en la tarjeta de vista previa), sitemap y JSON-LD.
 * Prioridad:
 *   1. SITE_URL — fijarla explícitamente cuando haya dominio propio
 *      (ej. SITE_URL=https://www.duartemunozabogados.com).
 *   2. VERCEL_PROJECT_PRODUCTION_URL — la inyecta Vercel en cada build con
 *      el dominio de producción del proyecto (sin protocolo).
 *   3. localhost — desarrollo y tests.
 */
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [icon()],
});
