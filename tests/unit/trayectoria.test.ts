import { describe, expect, it } from 'vitest';
import { getCollection } from 'astro:content';
import { descomponerItemTrayectoria } from '@/lib/trayectoria';

describe('descomponerItemTrayectoria', () => {
  it('separa título, entidad y periodo', () => {
    expect(descomponerItemTrayectoria('Abogado — UNISABANETA (2013 – 2017)')).toEqual({
      titulo: 'Abogado',
      entidad: 'UNISABANETA',
      periodo: '2013 – 2017',
    });
  });

  it('admite líneas sin entidad', () => {
    expect(descomponerItemTrayectoria('Abogada litigante (2017 – actualidad)')).toEqual({
      titulo: 'Abogada litigante',
      periodo: '2017 – actualidad',
    });
  });

  it('conserva los paréntesis internos de la entidad y toma solo el último como periodo', () => {
    expect(
      descomponerItemTrayectoria(
        'Inspector — Instituto Nacional Penitenciario y Carcelario, INPEC (1999 – 2022)',
      ),
    ).toEqual({
      titulo: 'Inspector',
      entidad: 'Instituto Nacional Penitenciario y Carcelario, INPEC',
      periodo: '1999 – 2022',
    });
  });

  it('devuelve la línea entera como título si no sigue el formato', () => {
    expect(descomponerItemTrayectoria('Colegiatura vigente')).toEqual({
      titulo: 'Colegiatura vigente',
      periodo: undefined,
    });
  });

  it('no pierde texto con los datos reales de los socios', async () => {
    for (const socio of await getCollection('socios')) {
      for (const linea of [...socio.data.formacion, ...socio.data.experiencia]) {
        const { titulo, entidad, periodo } = descomponerItemTrayectoria(linea);
        const reconstruida = [titulo, entidad && ` — ${entidad}`, periodo && ` (${periodo})`]
          .filter(Boolean)
          .join('');
        expect(reconstruida.replace(/\s+/g, ' ')).toBe(linea.replace(/\s+/g, ' ').trim());
      }
    }
  });

  it('admite el formato "Título — Detalle" sin periodo (resumen de experiencia)', () => {
    expect(
      descomponerItemTrayectoria(
        '9 años de experiencia en entidades públicas y privadas — Lleva activamente procesos disciplinarios, penales, administrativos, de familia y civiles',
      ),
    ).toEqual({
      titulo: '9 años de experiencia en entidades públicas y privadas',
      entidad:
        'Lleva activamente procesos disciplinarios, penales, administrativos, de familia y civiles',
      periodo: undefined,
    });
  });
});
