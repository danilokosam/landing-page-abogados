import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import IndexPage from '@/pages/index.astro';
import { negocio } from '@/lib/negocio';

describe('Página de inicio (composición completa)', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(IndexPage, { partial: false });
    dom = new JSDOM(html);
  });

  it('declara idioma "es" y un <title> que incluye el nombre del despacho', () => {
    expect(dom.window.document.documentElement.getAttribute('lang')).toBe('es');
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
    const controlesSoloIcono = Array.from(
      dom.window.document.querySelectorAll('button, a'),
    ).filter((el) => (el.textContent ?? '').trim() === '' && el.querySelector('svg'));
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
});
