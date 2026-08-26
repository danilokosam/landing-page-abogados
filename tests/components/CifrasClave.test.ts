import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import CifrasClave from '@/components/static/CifrasClave.astro';

describe('CifrasClave', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CifrasClave);
    dom = new JSDOM(html);
  });

  it('renderiza 4 elementos [data-counter], cada uno con su valor final ya visible', () => {
    const contadores = Array.from(dom.window.document.querySelectorAll('[data-counter]'));
    expect(contadores).toHaveLength(4);

    for (const contador of contadores) {
      const valor = contador.getAttribute('data-counter');
      const sufijo = contador.getAttribute('data-suffix') ?? '';
      expect(contador.textContent).toBe(`${valor}${sufijo}`);
    }
  });

  it('usa una lista de definición (<dl>) como estructura semántica', () => {
    expect(dom.window.document.querySelector('dl')).not.toBeNull();
  });
});
