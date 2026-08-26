import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection } from 'astro:content';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import SobreNosotros from '@/components/static/SobreNosotros.astro';

describe('SobreNosotros', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobreNosotros);
    dom = new JSDOM(html);
  });

  it('renderiza la sección con el id "sobre-nosotros" usado por la navegación', () => {
    expect(dom.window.document.querySelector('section#sobre-nosotros')).not.toBeNull();
  });

  it('marca el titular con data-reveal="left" y las tarjetas con data-reveal="right"', () => {
    expect(dom.window.document.querySelector('[data-reveal="left"]')).not.toBeNull();
    expect(dom.window.document.querySelector('[data-reveal="right"]')).not.toBeNull();
  });

  it('renderiza un <article> por cada socio de la colección "socios"', async () => {
    const socios = await getCollection('socios');
    const articulos = dom.window.document.querySelectorAll('article');
    expect(articulos).toHaveLength(socios.length);
  });

  it('incluye el nombre y cargo de cada socio, y una imagen con alt descriptivo', async () => {
    const socios = await getCollection('socios');
    for (const socio of socios) {
      expect(dom.window.document.body.textContent).toContain(socio.data.nombre);
      expect(dom.window.document.body.textContent).toContain(socio.data.cargo);
    }
    const imagenes = Array.from(dom.window.document.querySelectorAll('article img'));
    expect(imagenes).toHaveLength(socios.length);
    for (const img of imagenes) {
      expect(img.getAttribute('alt')).toMatch(/^Retrato de /);
    }
  });
});
