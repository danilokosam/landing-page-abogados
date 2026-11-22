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

  it('cada ficha muestra especialidades, biografía y trayectoria con título, entidad y periodo', async () => {
    const socios = (await getCollection('socios')).sort((a, b) => a.data.orden - b.data.orden);
    const articulos = Array.from(dom.window.document.querySelectorAll('article'));
    socios.forEach((socio, i) => {
      const ficha = articulos[i];
      const especialidades = ficha.querySelector(
        `ul[aria-label="Especialidades de ${socio.data.nombre}"]`,
      );
      expect(especialidades?.querySelectorAll('li')).toHaveLength(socio.data.especialidades.length);

      const formacion = ficha.querySelector(
        `section[aria-label="Formación de ${socio.data.nombre}"] ol`,
      );
      expect(formacion?.querySelectorAll('li')).toHaveLength(socio.data.formacion.length);
      // El primer título de formación aparece separado de su entidad/periodo.
      const primero = formacion?.querySelector('li p');
      expect(socio.data.formacion[0].startsWith(primero?.textContent?.trim() ?? '∅')).toBe(true);
    });
  });

  it('muestra cada retrato grande, sin recorte circular, anclado abajo y sin cortar la cabeza', () => {
    for (const img of dom.window.document.querySelectorAll('article img')) {
      // Dentro del panel editorial a todo el ancho de la ficha, no en un círculo.
      expect(img.closest('figure.ficha-panel')).not.toBeNull();
      expect(img.closest('.rounded-full')).toBeNull();
      // object-contain + anclado abajo: la foto entera, nunca se recorta la cabeza.
      expect(img.className).toContain('object-contain');
      expect(img.className).toContain('object-bottom');
      expect(img.className).not.toContain('object-cover');
      expect(img.getAttribute('src')).toMatch(/\.webp$/);
    }
  });

  it('cada ficha incluye las capas del efecto hover (halo, filete y foto)', () => {
    for (const ficha of dom.window.document.querySelectorAll('article')) {
      expect(ficha.classList.contains('ficha')).toBe(true);
      expect(ficha.querySelector(':scope > .ficha-halo[aria-hidden="true"]')).not.toBeNull();
      expect(ficha.querySelector(':scope > .ficha-filete[aria-hidden="true"]')).not.toBeNull();
      expect(ficha.querySelector('.ficha-panel img.ficha-foto')).not.toBeNull();
    }
  });
});
