import { readdirSync } from 'node:fs';
import { getCollection } from 'astro:content';
import { describe, expect, it } from 'vitest';

// Guarda contra el data store desactualizado (ver
// tests/setup/sincronizar-contenido.ts): las colecciones que ven los tests
// deben corresponder exactamente a los .md que hay hoy en disco. Si este
// test falla, getCollection() está leyendo una caché vieja y el resto de
// tests de componentes no son fiables.
function idsEnDisco(carpeta: string): string[] {
  return readdirSync(new URL(`../../src/content/${carpeta}/`, import.meta.url))
    .filter((archivo) => archivo.endsWith('.md') && !archivo.startsWith('_'))
    .map((archivo) => archivo.replace(/\.md$/, ''))
    .sort();
}

describe('Content Collections sincronizadas con el disco', () => {
  it.each(['servicios', 'socios'] as const)('"%s" refleja los .md actuales', async (coleccion) => {
    const ids = (await getCollection(coleccion)).map((entrada) => entrada.id).sort();
    expect(ids).toEqual(idsEnDisco(coleccion));
  });
});
