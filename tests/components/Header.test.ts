import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import Header from '@/components/static/Header.astro';
import { negocio } from '@/lib/negocio';

describe('Header', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Header);
    dom = new JSDOM(html);
  });

  it('renderiza un <header> con la clase que le da su comportamiento sticky', () => {
    const header = dom.window.document.querySelector('header.site-header');
    expect(header).not.toBeNull();
    expect(header?.className).toContain('sticky');
  });

  it('muestra el nombre del despacho', () => {
    expect(dom.window.document.body.textContent).toContain(negocio.nombreDespacho);
  });

  it('muestra el monograma SVG decorativo dentro del enlace de inicio, con nombre accesible', () => {
    const enlace = dom.window.document.querySelector('header a[href="#"]');
    expect(enlace?.getAttribute('aria-label')).toContain(negocio.nombreDespacho);
    const svg = enlace?.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 40 40');
    // Los colores salen de los tokens del tema vía currentColor, nunca hardcodeados.
    expect(svg?.querySelector('g.text-accent')?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.querySelector('g.text-foreground')?.getAttribute('fill')).toBe('currentColor');
  });

  it('incluye la navegación de escritorio con los tres anclajes esperados', () => {
    const nav = dom.window.document.querySelector('nav[aria-label="Navegación principal"]');
    expect(nav).not.toBeNull();
    const hrefs = Array.from(nav?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['#sobre-nosotros', '#servicios', '#contacto']);
  });

  it('incluye exactamente un ThemeToggle y un componente MenuMovil (con su <details>)', () => {
    expect(dom.window.document.querySelectorAll('#theme-toggle')).toHaveLength(1);
    expect(dom.window.document.querySelectorAll('#menu-movil')).toHaveLength(1);
  });

  it('el enlace de WhatsApp de escritorio abre en una nueva pestaña de forma segura', () => {
    const enlace = dom.window.document.querySelector('a[href^="https://wa.me/"]');
    expect(enlace).not.toBeNull();
    expect(enlace?.getAttribute('target')).toBe('_blank');
    expect(enlace?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
