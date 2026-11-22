import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import {
  generarGrafoSchema,
  generarLegalServiceSchema,
  generarPersonSchema,
  serializarJsonLd,
} from '@/lib/schema';
import { negocio } from '@/lib/negocio';

function crearSocioFicticio(
  overrides: Partial<CollectionEntry<'socios'>['data']> = {},
): CollectionEntry<'socios'> {
  return {
    id: 'socio-ficticio',
    collection: 'socios',
    data: {
      nombre: 'Ana Ejemplo',
      cargo: 'Socia fundadora',
      foto: '/foto.jpeg',
      formacion: ['Licenciada en Derecho'],
      especialidades: ['Derecho Civil', 'Derecho Laboral'],
      acreditaciones: [],
      orden: 0,
      ...overrides,
    },
  } as unknown as CollectionEntry<'socios'>;
}

describe('generarPersonSchema', () => {
  it('mapea nombre, cargo y especialidades de un socio a un nodo Person', () => {
    const socio = crearSocioFicticio();
    expect(generarPersonSchema(socio)).toEqual({
      '@type': 'Person',
      name: 'Ana Ejemplo',
      jobTitle: 'Socia fundadora',
      knowsAbout: ['Derecho Civil', 'Derecho Laboral'],
    });
  });
});

function crearServicioFicticio(titulo: string): CollectionEntry<'servicios'> {
  return {
    id: titulo.toLowerCase(),
    collection: 'servicios',
    data: { titulo, resumen: `Resumen de ${titulo}`, icono: 'scale', mensajeWhatsapp: 'Hola' },
  } as unknown as CollectionEntry<'servicios'>;
}

const URL_SITIO = 'https://ejemplo.test/';

describe('generarLegalServiceSchema', () => {
  it('genera un nodo LegalService con los datos de negocio.ts', () => {
    const resultado = generarLegalServiceSchema([]);

    expect(resultado['@type']).toBe('LegalService');
    expect(resultado.name).toBe(negocio.nombreDespacho);
    expect(resultado.telephone).toBe(negocio.telefonoWhatsapp);
    expect(resultado.email).toBe(negocio.email);
    expect(resultado.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: negocio.direccion.calle,
      addressLocality: negocio.direccion.ciudad,
      addressRegion: negocio.direccion.region,
      postalCode: negocio.direccion.codigoPostal,
      addressCountry: negocio.direccion.pais,
    });
  });

  it('incluye un empleado Person por cada socio recibido', () => {
    const socios = [
      crearSocioFicticio({ nombre: 'Ana Ejemplo' }),
      crearSocioFicticio({ nombre: 'Luis Ejemplo' }),
    ];

    const resultado = generarLegalServiceSchema(socios);

    expect(resultado.employee).toHaveLength(2);
    expect(resultado.employee.map((empleado) => empleado.name)).toEqual([
      'Ana Ejemplo',
      'Luis Ejemplo',
    ]);
  });

  it('omite los campos sin dato real en vez de enviarlos vacíos', () => {
    const resultado = generarLegalServiceSchema([]) as Record<string, unknown>;
    if (negocio.horario.length === 0)
      expect(resultado).not.toHaveProperty('openingHoursSpecification');
    if (negocio.redesSociales.length === 0) expect(resultado).not.toHaveProperty('sameAs');
    if (!negocio.direccion.calle) {
      expect(resultado.address).not.toHaveProperty('streetAddress');
    }
  });

  it('publica cada servicio como Offer → Service dentro de un OfferCatalog', () => {
    const resultado = generarLegalServiceSchema(
      [],
      [crearServicioFicticio('Derecho Penal'), crearServicioFicticio('Contratos')],
    );
    expect(resultado.hasOfferCatalog?.itemListElement).toEqual([
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Derecho Penal',
          description: 'Resumen de Derecho Penal',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Contratos', description: 'Resumen de Contratos' },
      },
    ]);
  });
});

describe('generarGrafoSchema', () => {
  const grafo = generarGrafoSchema({
    urlSitio: URL_SITIO,
    urlImagen: `${URL_SITIO}og.jpg`,
    socios: [crearSocioFicticio()],
    servicios: [crearServicioFicticio('Derecho Penal')],
  });
  const nodos = grafo['@graph'] as Array<Record<string, unknown>>;
  const porTipo = (tipo: string) => nodos.find((n) => n['@type'] === tipo)!;

  it('declara el contexto de schema.org y los nodos WebSite, WebPage, ImageObject y LegalService', () => {
    expect(grafo['@context']).toBe('https://schema.org');
    expect(nodos.map((n) => n['@type'])).toEqual([
      'WebSite',
      'WebPage',
      'ImageObject',
      'LegalService',
    ]);
  });

  it('enlaza los nodos entre sí por @id (sin referencias colgantes)', () => {
    const idsDeclarados = new Set(nodos.map((n) => n['@id']));
    const referencias = JSON.stringify(grafo).match(/\{"@id":"[^"]+"\}/g) ?? [];
    expect(referencias.length).toBeGreaterThan(0);
    for (const ref of referencias) {
      expect(idsDeclarados).toContain(JSON.parse(ref)['@id']);
    }
  });

  it('usa URLs absolutas para el sitio y la imagen', () => {
    expect(porTipo('WebSite').url).toBe(URL_SITIO);
    expect(porTipo('ImageObject').url).toBe(`${URL_SITIO}og.jpg`);
    expect(porTipo('LegalService').url).toBe(URL_SITIO);
  });
});

describe('serializarJsonLd', () => {
  it('escapa "<" para que el contenido no pueda cerrar el <script> antes de tiempo', () => {
    const salida = serializarJsonLd({ texto: '</script><script>alert(1)</script>' });
    expect(salida).not.toContain('</script>');
    expect(JSON.parse(salida)).toEqual({ texto: '</script><script>alert(1)</script>' });
  });
});
