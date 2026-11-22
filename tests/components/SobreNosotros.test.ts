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

  it('marca encabezado y fichas para las animaciones de scroll (data-anim)', () => {
    const doc = dom.window.document;
    expect(doc.querySelector('.eyebrow[data-anim="linea"]')).not.toBeNull();
    expect(doc.querySelector('h2[data-anim="titulo"]')).not.toBeNull();
    for (const ficha of doc.querySelectorAll('article')) {
      expect(ficha.getAttribute('data-anim')).toBe('ficha');
      // Telón en el panel y asentamiento en un contenedor propio: la imagen
      // con el zoom de hover (.ficha-foto) no recibe ninguna animación.
      const telon = ficha.querySelector('figure[data-anim="telon"]');
      expect(telon?.querySelector('[data-anim="asentar"] img.ficha-foto')).not.toBeNull();
      expect(ficha.querySelector('img.ficha-foto')?.hasAttribute('data-anim')).toBe(false);
      expect(ficha.querySelector('.ficha-filete')?.getAttribute('data-anim')).toBe('filete');
      for (const lista of ficha.querySelectorAll('ol')) {
        expect(lista.getAttribute('data-anim')).toBe('hitos');
        // Dentro de un <ol> solo <li>: el trazo es un ::before.
        expect(Array.from(lista.children).every((hijo) => hijo.tagName === 'LI')).toBe(true);
      }
    }
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

  it('resume la experiencia de Natalia (9 años, sin listar instituciones) como una sola entrada limpia', () => {
    const experiencia = dom.window.document.querySelector(
      'section[aria-label="Experiencia de Natalia Muñoz Taborda"]',
    );
    const hitos = experiencia?.querySelectorAll('li') ?? [];
    expect(hitos).toHaveLength(1);
    const [titulo, detalle] = Array.from(hitos[0].querySelectorAll('p')).map((p) =>
      p.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(titulo).toBe('9 años de experiencia en entidades públicas y privadas');
    expect(detalle).toBe(
      'Lleva activamente procesos disciplinarios, penales, administrativos, de familia y civiles',
    );
    expect(experiencia?.textContent).not.toMatch(/MASBOSQUES|Aulas de Paz|Concejal/);
  });
});
