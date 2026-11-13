import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import BaseLayout from '@/layouts/BaseLayout.astro';

describe('BaseLayout', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    // `site` es necesario para las URLs absolutas (canonical, og:url, og:image).
    const container = await AstroContainer.create({
      astroConfig: { site: 'https://ejemplo.test' },
    });
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'Título de prueba', description: 'Descripción de prueba' },
      slots: {
        fixed: '<header id="header-stub">Header fijo</header>',
        default: '<main id="main-stub">Contenido</main>',
      },
      partial: false,
    });
    dom = new JSDOM(html);
  });

  it('renderiza el título y la descripción recibidos por props', () => {
    expect(dom.window.document.querySelector('title')?.textContent).toBe('Título de prueba');
    expect(
      dom.window.document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe('Descripción de prueba');
  });

  it('coloca el slot "fixed" fuera de #smooth-content, como hermano previo de #smooth-wrapper', () => {
    const body = dom.window.document.body;
    const header = body.querySelector('#header-stub');
    const smoothWrapper = body.querySelector('#smooth-wrapper');
    const smoothContent = body.querySelector('#smooth-content');

    expect(header).not.toBeNull();
    expect(smoothWrapper).not.toBeNull();
    expect(smoothContent).not.toBeNull();

    // El header no debe ser descendiente de #smooth-content: un ancestro
    // transformado por ScrollSmoother rompería su position:sticky.
    expect(smoothContent?.contains(header)).toBe(false);
    expect(smoothWrapper?.contains(header)).toBe(false);

    // Debe preceder al wrapper en el documento (hermano anterior), no solo
    // "estar fuera" en cualquier punto del árbol.
    expect(header?.compareDocumentPosition(smoothWrapper!)! & 4).toBe(4); // Node.DOCUMENT_POSITION_FOLLOWING
  });

  it('coloca el contenido del slot por defecto dentro de #smooth-content', () => {
    const smoothContent = dom.window.document.querySelector('#smooth-content');
    expect(smoothContent?.querySelector('#main-stub')).not.toBeNull();
  });

  it('renderiza el fondo ambiental como decorativo, fuera del flujo y sin interceptar clics', () => {
    const fondo = dom.window.document.querySelector('#fondo-ambiental');
    expect(fondo).not.toBeNull();

    // Puramente decorativo: no debe aportar nada al árbol de accesibilidad
    // ni interceptar interacciones con el contenido real.
    expect(fondo?.getAttribute('aria-hidden')).toBe('true');
    expect(fondo?.className).toContain('pointer-events-none');

    // fixed + -z-10: no debe afectar el flujo del documento (sin layout
    // shift) y debe quedar siempre detrás de Header/MenuMovil (z-50/z-40)
    // y del contenido normal.
    expect(fondo?.className).toContain('fixed');
    expect(fondo?.className).toContain('-z-10');
  });

  it('el fondo ambiental es hermano de #smooth-wrapper, no su descendiente (no lo transforma ScrollSmoother)', () => {
    const smoothContent = dom.window.document.querySelector('#smooth-content');
    const smoothWrapper = dom.window.document.querySelector('#smooth-wrapper');
    const fondo = dom.window.document.querySelector('#fondo-ambiental');

    expect(smoothContent?.contains(fondo)).toBe(false);
    expect(smoothWrapper?.contains(fondo)).toBe(false);
  });
});
