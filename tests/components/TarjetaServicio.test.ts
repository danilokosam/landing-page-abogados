import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection } from 'astro:content';
import { beforeAll, describe, expect, it } from 'vitest';
import TarjetaServicio from '@/components/static/TarjetaServicio.astro';

describe('TarjetaServicio', () => {
  let html: string;

  beforeAll(async () => {
    const [servicio] = await getCollection('servicios');
    const container = await AstroContainer.create();
    html = await container.renderToString(TarjetaServicio, { props: { servicio } });
  });

  it('renderiza el título y el resumen del servicio', async () => {
    const [servicio] = await getCollection('servicios');
    expect(html).toContain(servicio.data.titulo);
    expect(html).toContain(servicio.data.resumen);
  });

  it('incluye un enlace de WhatsApp que abre en una nueva pestaña de forma segura', () => {
    expect(html).toContain('href="https://wa.me/');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('etiqueta el enlace de WhatsApp con un aria-label descriptivo del servicio', async () => {
    const [servicio] = await getCollection('servicios');
    expect(html).toContain(`aria-label="Consultar por ${servicio.data.titulo} vía WhatsApp"`);
  });
});
