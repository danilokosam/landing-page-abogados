import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { generarLegalServiceSchema, generarPersonSchema } from '@/lib/schema';
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
      foto: { src: '/foto.svg', width: 1, height: 1, format: 'svg' },
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

describe('generarLegalServiceSchema', () => {
  it('genera un nodo LegalService con los datos de negocio.ts', () => {
    const resultado = generarLegalServiceSchema([]);

    expect(resultado['@context']).toBe('https://schema.org');
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

  it('divide el horario en "opens"/"closes" a partir del texto "9:00 - 19:00"', () => {
    const resultado = generarLegalServiceSchema([]);
    expect(resultado.openingHoursSpecification).toEqual(
      negocio.horario.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dias,
        opens: h.horas.split('-')[0]?.trim(),
        closes: h.horas.split('-')[1]?.trim(),
      })),
    );
  });
});
