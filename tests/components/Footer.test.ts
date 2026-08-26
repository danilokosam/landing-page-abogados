import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import Footer from '@/components/static/Footer.astro';
import { negocio } from '@/lib/negocio';

describe('Footer', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer);
    dom = new JSDOM(html);
  });

  it('renderiza un <footer> con el id "contacto" usado por la navegación', () => {
    expect(dom.window.document.querySelector('footer#contacto')).not.toBeNull();
  });

  it('incluye los datos de contacto reales de negocio.ts (teléfono y email)', () => {
    const textoCompleto = dom.window.document.body.textContent ?? '';
    expect(textoCompleto).toContain(negocio.telefonoWhatsapp);
    expect(textoCompleto).toContain(negocio.email);
  });

  it('los enlaces tel: y mailto: usan el mismo teléfono/email que el texto visible', () => {
    const enlaceTel = dom.window.document.querySelector('a[href^="tel:"]');
    const enlaceMail = dom.window.document.querySelector('a[href^="mailto:"]');
    expect(enlaceTel?.getAttribute('href')).toBe(`tel:${negocio.telefonoWhatsapp}`);
    expect(enlaceMail?.getAttribute('href')).toBe(`mailto:${negocio.email}`);
  });

  it('muestra el año actual en el aviso de copyright', () => {
    const anioActual = String(new Date().getFullYear());
    expect(dom.window.document.body.textContent).toContain(anioActual);
  });
});
