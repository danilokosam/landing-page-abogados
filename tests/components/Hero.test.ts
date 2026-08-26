import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import Hero from '@/components/static/Hero.astro';
import { negocio } from '@/lib/negocio';

describe('Hero', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero);
    dom = new JSDOM(html);
  });

  it('marca cada bloque animado con su valor de data-hero-anim esperado', () => {
    const valoresEsperados = ['eyebrow', 'line', 'title', 'lead'];
    for (const valor of valoresEsperados) {
      expect(dom.window.document.querySelector(`[data-hero-anim="${valor}"]`)).not.toBeNull();
    }
  });

  it('marca ambos CTA con data-hero-anim="cta"', () => {
    expect(dom.window.document.querySelectorAll('[data-hero-anim="cta"]')).toHaveLength(2);
  });

  it('incluye la descripción corta del negocio como texto principal', () => {
    expect(dom.window.document.body.textContent).toContain(negocio.descripcionCorta);
  });

  it('el CTA principal de WhatsApp abre en una nueva pestaña de forma segura', () => {
    const cta = dom.window.document.querySelector('a[href^="https://wa.me/"]');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('target')).toBe('_blank');
    expect(cta?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('el segundo CTA enlaza a la sección de servicios en la misma página', () => {
    const enlaces = Array.from(dom.window.document.querySelectorAll('[data-hero-anim="cta"]'));
    const secundario = enlaces.find((a) => a.getAttribute('href') === '#servicios');
    expect(secundario).not.toBeUndefined();
  });
});
