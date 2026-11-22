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

  it('marca el encabezado de la sección para las animaciones de scroll', () => {
    expect(dom.window.document.querySelector('.eyebrow[data-anim="linea"]')).not.toBeNull();
    const revelado = dom.window.document.querySelector('h2[data-anim="titulo"]');
    expect(revelado).not.toBeNull();
  });

  it('marca cada tarjeta (con su icono y número) para la entrada por lotes', () => {
    const tarjetas = dom.window.document.querySelectorAll('[data-servicios-grid] > article');
    expect(tarjetas.length).toBeGreaterThan(0);
    for (const tarjeta of tarjetas) {
      expect(tarjeta.getAttribute('data-anim')).toBe('servicio');
      // El icono sigue siendo el primer <div> (lo usa el e2e del hover).
      expect(tarjeta.querySelector('div')?.hasAttribute('data-anim-icono')).toBe(true);
    }
  });

  it('renderiza una TarjetaServicio por cada entrada de la colección "servicios"', async () => {
    const servicios = await getCollection('servicios');
    const grid = dom.window.document.querySelector('[data-servicios-grid]');
    expect(grid?.children).toHaveLength(servicios.length);
  });

  it('renderiza cada servicio en el orden definido por su campo "orden"', async () => {
    const servicios = (await getCollection('servicios')).sort(
      (a, b) => a.data.orden - b.data.orden,
    );
    const titulos = Array.from(
      dom.window.document.querySelectorAll('[data-servicios-grid] h3'),
    ).map((el) => el.textContent);
    expect(titulos).toEqual(servicios.map((s) => s.data.titulo));
  });

  it('numera las tarjetas de forma correlativa (01, 02, …) y cada una con su icono', () => {
    const tarjetas = Array.from(
      dom.window.document.querySelectorAll('[data-servicios-grid] > article'),
    );
    tarjetas.forEach((tarjeta, i) => {
      expect(tarjeta.querySelector('[data-anim-numero]')?.textContent?.trim()).toBe(
        String(i + 1).padStart(2, '0'),
      );
      expect(tarjeta.querySelector('[data-anim-icono] svg')).not.toBeNull();
    });
  });

  it('cada servicio tiene un "orden" distinto (sin empates que desordenen la numeración)', async () => {
    const ordenes = (await getCollection('servicios')).map((s) => s.data.orden);
    expect(new Set(ordenes).size).toBe(ordenes.length);
  });

  it('incluye Derecho Disciplinario con su propio enlace de WhatsApp', () => {
    const tarjeta = Array.from(
      dom.window.document.querySelectorAll('[data-servicios-grid] > article'),
    ).find((a) => a.querySelector('h3')?.textContent?.trim() === 'Derecho Disciplinario');
    expect(tarjeta).toBeDefined();
    const enlace = tarjeta?.querySelector('a[href^="https://wa.me/"]');
    expect(decodeURIComponent(enlace?.getAttribute('href') ?? '')).toContain('disciplinario');
  });
});
