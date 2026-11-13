/**
 * globalSetup de Vitest: sincroniza las Content Collections antes de
 * ejecutar cualquier test.
 *
 * Por qué hace falta: Vitest arranca Vite en modo "serve", así que el
 * plugin de contenido de Astro se comporta como en desarrollo y lee el
 * data store de `.astro/data-store.json` — pero `getViteConfig()` crea ese
 * entorno con `sync: false` y nunca lo rellena. Solo `astro dev` escribe
 * ese archivo, y `astro sync` escribe el suyo en otra ruta (`cacheDir`,
 * por defecto `node_modules/.astro/`). Resultado sin este setup: los tests
 * leían lo que dejó la última ejecución de `astro dev` — colecciones vacías
 * si nunca se arrancó, o datos y campos de esquema desactualizados tras
 * editar el contenido (fallos falsos, o peor, aciertos falsos).
 *
 * Solución: ejecutar `astro sync` y copiar su data store a la ruta que
 * lee el modo dev. Se lanza el CLI como proceso aparte (no `import { sync }
 * from 'astro'`): este archivo lo transforma Vite con la config de Astro,
 * y ahí el especificador 'astro' no resuelve a la API de Node.
 * Corre una vez por ejecución de Vitest; en `test:watch`, si se edita
 * contenido, hay que relanzar Vitest para resincronizar.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../../', import.meta.url);
// cacheDir por defecto de Astro (astro.config.mjs no lo cambia).
const storeDeSync = new URL('node_modules/.astro/data-store.json', raiz);
const storeDeDev = new URL('.astro/data-store.json', raiz);

export default async function sincronizarContenido(): Promise<void> {
  // Ruta del ejecutable declarada en el campo "bin" de astro/package.json
  // (no está en "exports", así que no se puede resolver con require.resolve).
  const cliAstro = fileURLToPath(new URL('node_modules/astro/bin/astro.mjs', raiz));
  try {
    await promisify(execFile)(process.execPath, [cliAstro, 'sync'], { cwd: fileURLToPath(raiz) });
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };
    throw new Error(`astro sync falló antes de los tests:\n${stdout}${stderr}`);
  }

  if (!existsSync(storeDeSync)) {
    throw new Error(
      `astro sync no generó ${fileURLToPath(storeDeSync)}. ¿Cambió cacheDir en ` +
        'astro.config.mjs o la ubicación del data store en esta versión de Astro? ' +
        'Actualiza tests/setup/sincronizar-contenido.ts.',
    );
  }

  await mkdir(new URL('.astro/', raiz), { recursive: true });
  await copyFile(storeDeSync, storeDeDev);
}
