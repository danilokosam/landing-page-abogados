import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection } from 'astro:content';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import Servicios from '@/components/static/Servicios.astro';

describe('Servicios', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Servicios);
    dom = new JSDOM(html);
  });

  it('renderiza la sección con el id "servicios" usado por la navegación', () => {
    expect(dom.window.document.querySelector('section#servicios')).not.toBeNull();
  });

  it('marca el encabezado de la sección con data-reveal="up"', () => {
    const revelado = dom.window.document.querySelector('[data-reveal="up"]');
    expect(revelado).not.toBeNull();
  });

  it('marca el grid de tarjetas con data-reveal-grid para el stagger de entrada', () => {
    expect(dom.window.document.querySelector('[data-reveal-grid]')).not.toBeNull();
  });

  it('renderiza una TarjetaServicio por cada entrada de la colección "servicios"', async () => {
    const servicios = await getCollection('servicios');
    const grid = dom.window.document.querySelector('[data-reveal-grid]');
    expect(grid?.children).toHaveLength(servicios.length);
  });

  it('renderiza cada servicio en el orden definido por su campo "orden"', async () => {
    const servicios = (await getCollection('servicios')).sort(
      (a, b) => a.data.orden - b.data.orden,
    );
    const titulos = Array.from(dom.window.document.querySelectorAll('[data-reveal-grid] h3')).map(
      (el) => el.textContent,
    );
    expect(titulos).toEqual(servicios.map((s) => s.data.titulo));
  });
});
