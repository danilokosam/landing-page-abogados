import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import BotonesFlotantes from '@/components/interactive/BotonesFlotantes.astro';
import { negocio } from '@/lib/negocio';
import { mensajeWhatsappFlotante } from '@/lib/whatsapp';

describe('BotonesFlotantes', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BotonesFlotantes);
    dom = new JSDOM(html);
  });

  it('es un contenedor fijo en la esquina inferior derecha, por debajo del Header y del menú móvil', () => {
    const contenedor = dom.window.document.querySelector('#botones-flotantes');
    expect(contenedor?.className).toContain('fixed');
    expect(contenedor?.className).toContain('z-30');
  });

  it('el enlace de WhatsApp apunta al número de negocio.ts con el mensaje precargado codificado', () => {
    const enlace = dom.window.document.querySelector<HTMLAnchorElement>(
      '#botones-flotantes a[href^="https://wa.me/"]',
    );
    expect(enlace).not.toBeNull();
    const url = new URL(enlace!.getAttribute('href')!);
    expect(url.pathname).toBe(`/${negocio.telefonoWhatsapp.replace(/\D/g, '')}`);
    expect(url.searchParams.get('text')).toBe(mensajeWhatsappFlotante);
    expect(enlace!.getAttribute('target')).toBe('_blank');
    expect(enlace!.getAttribute('rel')).toBe('noopener noreferrer');
    expect(enlace!.getAttribute('aria-label')).toMatch(/WhatsApp/);
  });

  it('el botón "volver arriba" tiene aria-label y arranca oculto', () => {
    const boton = dom.window.document.querySelector('#volver-arriba');
    expect(boton?.tagName).toBe('BUTTON');
    expect(boton?.getAttribute('aria-label')).toBe('Volver al inicio de la página');
    expect(boton?.getAttribute('data-visible')).toBe('false');
    expect(boton?.className).toContain('invisible');
  });
});
