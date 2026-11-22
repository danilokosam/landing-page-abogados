import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import { describe, expect, it } from 'vitest';

// Las fotos de los socios son recortes sin fondo: WebP con canal alfa en
// public/. Se comprueba en la cabecera del archivo (contenedor RIFF/WEBP,
// chunk extendido VP8X con el bit de alfa activo), sin dependencias.
describe('fotos de los socios', () => {
  it('existen en public/ y son WebP con transparencia real (canal alfa)', async () => {
    const socios = await getCollection('socios');
    expect(socios.length).toBeGreaterThan(0);
    for (const socio of socios) {
      const ruta = join(process.cwd(), 'public', socio.data.foto);
      expect(existsSync(ruta), `${socio.data.foto} no existe en public/`).toBe(true);

      const cabecera = readFileSync(ruta).subarray(0, 21);
      expect(cabecera.toString('ascii', 0, 4)).toBe('RIFF');
      expect(cabecera.toString('ascii', 8, 12)).toBe('WEBP');
      expect(cabecera.toString('ascii', 12, 16)).toBe('VP8X');
      const ALFA = 0x10;
      expect(cabecera[20] & ALFA, `${socio.data.foto} no tiene canal alfa`).toBe(ALFA);
    }
  });
});
