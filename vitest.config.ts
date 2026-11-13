/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// environment: 'node' (no jsdom) a propósito — el Container API de Astro
// renderiza componentes en el entorno "ssr" de Vite; con 'jsdom'/'happy-dom'
// Vitest transforma el grafo de módulos como entorno "client", donde
// astro:content (y las propias .astro) se stubean y fallan al importarse
// desde getCollection(). Las pruebas que necesitan parsear el HTML
// resultante usan la clase JSDOM explícitamente en vez de globals de DOM.
export default getViteConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.ts'],
    // Rellena el data store de Content Collections antes de los tests —
    // sin esto, getCollection() lee lo que dejó el último `astro dev`
    // (ver el comentario de cabecera del propio archivo).
    globalSetup: ['tests/setup/sincronizar-contenido.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/components/**/*.astro'],
      // src/lib/gsap/** solo se ejecuta en el navegador (GSAP animando DOM
      // real, timers, ScrollTrigger) — su comportamiento se verifica con
      // Playwright (tests/e2e), no aquí; instrumentarlo con v8/Node no
      // ejecutaría ese código en absoluto y solo ensuciaría el % agregado.
      exclude: ['src/lib/gsap/**'],
    },
  },
});
