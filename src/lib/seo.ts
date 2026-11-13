/**
 * Metadatos SEO del sitio — fuente única para <title>, meta description,
 * Open Graph/Twitter y JSON-LD. Los datos del despacho siguen viniendo de
 * negocio.ts; aquí solo vive la redacción orientada a buscadores y a la
 * tarjeta de vista previa al compartir el enlace.
 *
 * Límites aproximados de lo que Google muestra sin truncar (cubiertos por
 * tests/unit/seo.test.ts):
 *   - título: ~60 caracteres
 *   - descripción: ~155 caracteres
 */
import { negocio } from './negocio';

/** Nombre comercial sin el sufijo "Abogados" ("Duarte & Muñoz"). */
export const nombreCorto = negocio.nombreDespacho.replace(/\s+Abogados$/i, '');

export const seo = {
  /** Palabra clave principal al inicio; marca al final. */
  titulo: `Abogados penalistas en ${negocio.direccion.ciudad} | ${negocio.nombreDespacho}`,
  descripcion: `Abogados en ${negocio.direccion.ciudad} especialistas en derecho penal, administrativo y asuntos penitenciarios. Atención directa y consulta por WhatsApp.`,

  /** Tarjeta al compartir (WhatsApp, Facebook, LinkedIn, X…). */
  og: {
    titulo: `${negocio.nombreDespacho} · Abogados en ${negocio.direccion.ciudad}`,
    descripcion:
      'Derecho penal, administrativo y asuntos penitenciarios. Hable directamente con un abogado por WhatsApp.',
    imagen: '/og.jpg',
    imagenAncho: 1200,
    imagenAlto: 630,
    imagenAlt: `${negocio.nombreDespacho} — Abogados en ${negocio.direccion.ciudad}, ${negocio.direccion.region}`,
  },

  /** Locale de Open Graph (formato idioma_PAÍS) y de <html lang> (BCP 47). */
  locale: 'es_CO',
  idioma: 'es-CO',
} as const;

/** Convierte una ruta del sitio en URL absoluta usando `site` de astro.config. */
export function urlAbsoluta(ruta: string, site: URL | undefined): string {
  if (!site)
    throw new Error('Falta `site` en astro.config.mjs: no se pueden generar URLs absolutas.');
  return new URL(ruta, site).href;
}
