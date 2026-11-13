import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection } from 'astro:content';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import IndexPage from '@/pages/index.astro';
import { negocio } from '@/lib/negocio';
import { seo } from '@/lib/seo';

const SITIO = 'https://ejemplo.test';

describe('Página de inicio (composición completa)', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    // `site` es necesario para las URLs absolutas (canonical, og:url, og:image).
    const container = await AstroContainer.create({ astroConfig: { site: SITIO } });
    const html = await container.renderToString(IndexPage, { partial: false });
    dom = new JSDOM(html);
  });

  it('declara idioma "es-CO" y un <title> que incluye el nombre del despacho', () => {
    expect(dom.window.document.documentElement.getAttribute('lang')).toBe('es-CO');
    expect(dom.window.document.querySelector('title')?.textContent).toContain(
      negocio.nombreDespacho,
    );
  });

  it('incluye exactamente una etiqueta <h1>, para una jerarquía de encabezados correcta', () => {
    expect(dom.window.document.querySelectorAll('h1')).toHaveLength(1);
  });

  it('compone las secciones en el orden esperado dentro de <main>', () => {
    const main = dom.window.document.querySelector('main');
    expect(main).not.toBeNull();
    // El Hero es la primera <section> pero no lleva id (no es un destino de
    // anclaje de navegación); se filtra para comparar solo las que sí lo son.
    const idsDeSeccion = Array.from(main?.querySelectorAll('section') ?? [])
      .map((s) => s.id)
      .filter(Boolean);
    expect(idsDeSeccion).toEqual(['cifras-clave', 'sobre-nosotros', 'servicios']);
  });

  it('el Header (slot "fixed") queda fuera de <main> y de #smooth-content', () => {
    const header = dom.window.document.querySelector('header.site-header');
    const smoothContent = dom.window.document.querySelector('#smooth-content');
    expect(header).not.toBeNull();
    expect(smoothContent?.contains(header)).toBe(false);
  });

  it('el <footer id="contacto"> vive dentro de #smooth-content, junto a <main>', () => {
    const smoothContent = dom.window.document.querySelector('#smooth-content');
    expect(smoothContent?.querySelector('footer#contacto')).not.toBeNull();
  });

  it('accesibilidad básica: toda <img> tiene alt, y todo botón/enlace de icono tiene texto accesible', () => {
    const imagenes = Array.from(dom.window.document.querySelectorAll('img'));
    expect(imagenes.length).toBeGreaterThan(0);
    for (const img of imagenes) {
      expect(img.hasAttribute('alt')).toBe(true);
      expect(img.getAttribute('alt')).not.toBe('');
    }

    // Botones/enlaces que sólo contienen un icono decorativo (sin texto visible)
    // deben exponer un nombre accesible vía aria-label.
    const controlesSoloIcono = Array.from(dom.window.document.querySelectorAll('button, a')).filter(
      (el) => (el.textContent ?? '').trim() === '' && el.querySelector('svg'),
    );
    for (const control of controlesSoloIcono) {
      expect(control.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('accesibilidad básica: los iconos decorativos están marcados aria-hidden', () => {
    const iconos = Array.from(dom.window.document.querySelectorAll('svg'));
    expect(iconos.length).toBeGreaterThan(0);
    for (const icono of iconos) {
      expect(icono.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('accesibilidad básica: existe al menos un landmark <nav> con aria-label', () => {
    const navs = Array.from(dom.window.document.querySelectorAll('nav'));
    expect(navs.length).toBeGreaterThan(0);
    for (const nav of navs) {
      expect(nav.getAttribute('aria-label')).toBeTruthy();
    }
  });

  describe('SEO del <head>', () => {
    const meta = (selector: string) =>
      dom.window.document.querySelector(selector)?.getAttribute('content');

    it('usa el título y la descripción optimizados de seo.ts', () => {
      expect(dom.window.document.title).toBe(seo.titulo);
      expect(meta('meta[name="description"]')).toBe(seo.descripcion);
    });

    it('declara una URL canónica absoluta y permite indexar con vista previa grande', () => {
      expect(dom.window.document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
        `${SITIO}/`,
      );
      expect(meta('meta[name="robots"]')).toContain('index, follow');
      expect(meta('meta[name="robots"]')).toContain('max-image-preview:large');
    });

    it('incluye la tarjeta Open Graph completa con imagen absoluta de 1200×630', () => {
      expect(meta('meta[property="og:type"]')).toBe('website');
      expect(meta('meta[property="og:url"]')).toBe(`${SITIO}/`);
      expect(meta('meta[property="og:title"]')).toBe(seo.og.titulo);
      expect(meta('meta[property="og:description"]')).toBe(seo.og.descripcion);
      expect(meta('meta[property="og:image"]')).toBe(`${SITIO}${seo.og.imagen}`);
      expect(meta('meta[property="og:image:width"]')).toBe('1200');
      expect(meta('meta[property="og:image:height"]')).toBe('630');
      expect(meta('meta[property="og:image:alt"]')).toBeTruthy();
      expect(meta('meta[property="og:locale"]')).toBe('es_CO');
      expect(meta('meta[property="og:site_name"]')).toBe(negocio.nombreDespacho);
    });

    it('incluye la tarjeta grande de Twitter/X', () => {
      expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
      expect(meta('meta[name="twitter:image"]')).toBe(`${SITIO}${seo.og.imagen}`);
    });

    it('enlaza favicon, apple-touch-icon y manifest', () => {
      const href = (sel: string) => dom.window.document.querySelector(sel)?.getAttribute('href');
      expect(href('link[rel="icon"][type="image/svg+xml"]')).toBe('/favicon.svg');
      expect(href('link[rel="apple-touch-icon"]')).toBe('/apple-touch-icon.png');
      expect(href('link[rel="manifest"]')).toBe('/site.webmanifest');
    });

    it('emite un JSON-LD válido con LegalService, sus abogados y sus servicios', async () => {
      const script = dom.window.document.querySelector('script[type="application/ld+json"]');
      expect(script).not.toBeNull();
      const grafo = JSON.parse(script!.textContent ?? '');
      const despacho = grafo['@graph'].find(
        (n: { '@type': string }) => n['@type'] === 'LegalService',
      );
      expect(despacho.name).toBe(negocio.nombreDespacho);
      expect(despacho.url).toBe(`${SITIO}/`);
      expect(despacho.employee).toHaveLength((await getCollection('socios')).length);
      expect(despacho.hasOfferCatalog.itemListElement).toHaveLength(
        (await getCollection('servicios')).length,
      );
    });

    it('el <h1> contiene la búsqueda local clave ("Abogados en <ciudad>")', () => {
      expect(dom.window.document.querySelector('h1')?.textContent).toContain(
        `Abogados en ${negocio.direccion.ciudad}`,
      );
    });
  });
});
