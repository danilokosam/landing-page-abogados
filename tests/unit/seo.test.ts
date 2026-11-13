import { describe, expect, it } from 'vitest';
import { nombreCorto, seo, urlAbsoluta } from '@/lib/seo';
import { negocio } from '@/lib/negocio';

describe('Metadatos SEO', () => {
  it('el <title> cabe en el resultado de Google sin truncarse (≤ 60 caracteres)', () => {
    expect(seo.titulo.length).toBeLessThanOrEqual(60);
  });

  it('el título incluye la ciudad (búsqueda local) y el nombre del despacho', () => {
    expect(seo.titulo).toContain(negocio.direccion.ciudad);
    expect(seo.titulo).toContain(negocio.nombreDespacho);
  });

  it('la meta description cabe sin truncarse (≤ 155 caracteres) y no es demasiado corta', () => {
    expect(seo.descripcion.length).toBeLessThanOrEqual(155);
    expect(seo.descripcion.length).toBeGreaterThanOrEqual(70);
  });

  it('el título de la tarjeta para redes no se corta en WhatsApp/Facebook (≤ 65 caracteres)', () => {
    expect(seo.og.titulo.length).toBeLessThanOrEqual(65);
  });

  it('la imagen para compartir usa el tamaño recomendado 1200×630', () => {
    expect([seo.og.imagenAncho, seo.og.imagenAlto]).toEqual([1200, 630]);
  });

  it('nombreCorto quita el sufijo "Abogados" del nombre comercial', () => {
    expect(nombreCorto).not.toMatch(/Abogados$/);
    expect(negocio.nombreDespacho.startsWith(nombreCorto)).toBe(true);
  });

  it('urlAbsoluta resuelve rutas contra el dominio del sitio', () => {
    expect(urlAbsoluta('/og.jpg', new URL('https://ejemplo.test'))).toBe(
      'https://ejemplo.test/og.jpg',
    );
    expect(() => urlAbsoluta('/og.jpg', undefined)).toThrow();
  });
});
