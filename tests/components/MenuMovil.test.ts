import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import MenuMovil from '@/components/interactive/MenuMovil.astro';

const enlaces = [
  { href: '#sobre-nosotros', texto: 'Sobre Nosotros' },
  { href: '#servicios', texto: 'Servicios' },
  { href: '#contacto', texto: 'Contacto' },
];

describe('MenuMovil (marcado estático)', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MenuMovil, { props: { enlaces } });
    dom = new JSDOM(html);
  });

  it('usa <details>/<summary> como mecanismo de apertura, sin depender de un div oculto por JS', () => {
    const detalles = dom.window.document.querySelector('#menu-movil');
    expect(detalles?.tagName).toBe('DETAILS');
    expect(detalles?.querySelector('summary#menu-movil-boton')).not.toBeNull();
  });

  it('el botón de apertura expone un aria-label para lectores de pantalla', () => {
    const boton = dom.window.document.querySelector('#menu-movil-boton');
    expect(boton?.getAttribute('aria-label')).toBe('Abrir menú de navegación');
  });

  it('el panel usa h-dvh (no inset-0) para evitar el bug de contención de backdrop-filter', () => {
    const nav = dom.window.document.querySelector('#menu-movil nav');
    expect(nav?.className).toContain('h-dvh');
    expect(nav?.className).toContain('top-0');
  });

  it('renderiza un enlace marcado con data-menu-movil-enlace por cada entrada, en orden', () => {
    const items = Array.from(
      dom.window.document.querySelectorAll('[data-menu-movil-enlace]'),
    );
    // enlaces.length de navegación + 1 (el CTA de WhatsApp al final)
    expect(items).toHaveLength(enlaces.length + 1);

    const hrefsDeNavegacion = items.slice(0, enlaces.length).map((el) => el.getAttribute('href'));
    expect(hrefsDeNavegacion).toEqual(enlaces.map((e) => e.href));
  });

  it('el último enlace marcado es el CTA de WhatsApp, seguro y en nueva pestaña', () => {
    const items = dom.window.document.querySelectorAll('[data-menu-movil-enlace]');
    const cta = items[items.length - 1];
    expect(cta.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('incluye el <script> de comportamiento (bloqueo de scroll, cierre por enlace/Escape)', () => {
    expect(dom.window.document.querySelector('script')).not.toBeNull();
  });
});
