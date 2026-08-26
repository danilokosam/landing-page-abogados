import { defineConfig, devices } from '@playwright/test';

// El comando `astro dev` de este proyecto se auto-demoniza en segundo plano
// (ver CLAUDE.md: `astro dev --background`/`astro dev stop`/`astro dev
// status`) — el proceso que lo lanza retorna de inmediato, lo que hace que
// el `webServer` integrado de Playwright lo dé por "caído" al instante. Por
// eso el servidor se administra a mano (ver package.json: pretest:e2e /
// posttest:e2e) y aquí solo se apunta a la URL ya disponible.
const PORT = process.env.PORT ?? 4325;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      // smooth-scroll.spec.ts asume la nav de escritorio (oculta bajo
      // md:flex en móvil) y un ScrollSmoother activo — un escenario que,
      // por diseño, no aplica en un viewport táctil (ver
      // reduced-motion-and-touch-bypass.spec.ts para el caso móvil).
      testIgnore: ['**/smooth-scroll.spec.ts'],
    },
  ],
});
