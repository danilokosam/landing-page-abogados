import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Contrato de las animaciones de scroll: reglas de robustez y sobriedad que
// no dependen de ejecutar GSAP (eso lo cubre tests/e2e/animaciones-scroll).
const leer = (ruta: string) => readFileSync(join(process.cwd(), ruta), 'utf8');
const css = leer('src/styles/global.css');
const animaciones = leer('src/lib/gsap/animations.ts');
const sinComentarios = animaciones.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

/** Bloques `selector { cuerpo }` (de primer nivel o anidados en @media). */
function reglas(texto: string) {
  const limpio = texto.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...limpio.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, cuerpo]) => ({
    selector: selector.trim(),
    cuerpo,
  }));
}

describe('contrato de las animaciones de scroll', () => {
  it('todo estado inicial oculto de [data-anim] depende de html.gsap-listo (nunca invisible si falla el JS)', () => {
    const ocultan = reglas(css).filter(
      ({ selector, cuerpo }) =>
        selector.includes('data-anim') &&
        /opacity:\s*0|visibility:\s*hidden|clip-path:\s*inset|--escala-[a-z]+:\s*0|translate/.test(
          cuerpo,
        ),
    );
    expect(ocultan.length).toBeGreaterThan(5);
    for (const { selector } of ocultan) {
      expect(selector, selector).toMatch(/^html\.gsap-listo/);
    }
  });

  it('la clase gsap-listo la añade el módulo de GSAP solo sin prefers-reduced-motion', () => {
    expect(sinComentarios).toMatch(
      /respetaMovimiento\.add\(SIN_PREFERENCIA,[\s\S]*?classList\.add\('gsap-listo'\)/,
    );
    expect(sinComentarios).toContain(
      "const SIN_PREFERENCIA = '(prefers-reduced-motion: no-preference)'",
    );
    expect(leer('src/layouts/BaseLayout.astro')).not.toContain('no-js');
  });

  it('sin rebotes, elásticos, rotaciones ni bucles', () => {
    expect(sinComentarios).not.toMatch(/elastic|bounce|back\.|rotat|yoyo|repeat\s*:/i);
  });

  it('la imagen con zoom de hover (.ficha-foto) nunca es objetivo de una animación', () => {
    expect(sinComentarios).not.toContain('ficha-foto');
  });
});
