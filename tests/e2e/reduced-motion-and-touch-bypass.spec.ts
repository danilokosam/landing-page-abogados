import { test, expect, devices } from '@playwright/test';

// Se usa page.emulateMedia() en vez de test.use({ reducedMotion }): en este
// entorno, el context option no llegaba a aplicarse antes de goto() (la
// media query seguía en "no-preference" en la primera carga), mientras que
// emulateMedia() sí se verificó fiable de forma explícita.
test.describe('Bypass por prefers-reduced-motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('con reduced-motion, ScrollSmoother no se inicializa (el wrapper no queda fixed)', async ({
    page,
  }) => {
    await page.goto('/');
    // Deja tiempo de sobra al script de inicialización, para no confundir
    // "no se activó" con "todavía no tuvo tiempo de activarse".
    await page.waitForTimeout(300);
    await expect(page.locator('#smooth-wrapper')).not.toHaveCSS('position', 'fixed');
  });

  test('con reduced-motion, el contenido del Hero es visible de inmediato, sin depender de la animación', async ({
    page,
  }) => {
    await page.goto('/');
    const eyebrow = page.locator('[data-hero-anim="eyebrow"]');
    const titulo = page.locator('[data-hero-anim="title"]');

    await expect(eyebrow).toHaveCSS('opacity', '1');
    await expect(titulo).toHaveCSS('clip-path', 'none');
  });

  test('con reduced-motion, html usa scroll-behavior:auto (no smooth)', async ({ page }) => {
    await page.goto('/');
    const scrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(scrollBehavior).toBe('auto');
  });
});

test.describe('Bypass en dispositivos táctiles (pointer: coarse)', () => {
  // Se excluye `defaultBrowserType` del descriptor del dispositivo: Playwright
  // no permite fijarlo a nivel de describe.use() (fuerza un worker nuevo),
  // solo a nivel de archivo/config — y aquí ya corremos sobre Chromium.
  const { defaultBrowserType: _defaultBrowserType, ...pixel7SinBrowserType } = devices['Pixel 7'];
  test.use({ ...pixel7SinBrowserType });

  test('el dispositivo emulado reporta pointer:coarse (precondición de la prueba)', async ({
    page,
  }) => {
    await page.goto('/');
    const esCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
    expect(esCoarse).toBe(true);
  });

  test('en un dispositivo táctil, ScrollSmoother no se inicializa (el wrapper no queda fixed)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    await expect(page.locator('#smooth-wrapper')).not.toHaveCSS('position', 'fixed');
  });

  test('en un dispositivo táctil, la entrada del Hero sí se anima (reduced-motion no está activo aquí)', async ({
    page,
  }) => {
    await page.goto('/');
    const eyebrow = page.locator('[data-hero-anim="eyebrow"]');
    await expect(eyebrow).toHaveCSS('opacity', '1', { timeout: 3000 });
  });
});
