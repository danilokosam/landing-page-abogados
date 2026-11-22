import { test, expect } from '@playwright/test';

test.describe('Navegación por anclajes con ScrollSmoother (escritorio, sin reduced-motion)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ScrollSmoother queda activo: fija #smooth-wrapper con position:fixed', async ({ page }) => {
    // Efecto colateral documentado de ScrollSmoother.create({ smooth: 1.2, ... }):
    // fuerza position:fixed/overflow:hidden en el wrapper. Es la señal más
    // fiable, sin instrumentar la app, de que el plugin sí se inicializó.
    await expect(page.locator('#smooth-wrapper')).toHaveCSS('position', 'fixed');
  });

  test('clic en un enlace del header actualiza el hash y desplaza hasta la sección, vía smoother.scrollTo()', async ({
    page,
  }) => {
    const enlace = page.locator('nav[aria-label="Navegación principal"] a[href="#servicios"]');
    const seccion = page.locator('section#servicios');

    const scrollInicial = await page.evaluate(() => window.scrollY);
    await enlace.click();

    await expect(page).toHaveURL(/#servicios$/);

    // La animación de scrollTo dura ~1.2s (smooth: 1.2); se espera a que
    // la sección quede efectivamente en el viewport tras completarse.
    await expect(seccion).toBeInViewport({ timeout: 3000 });
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollInicial);
  });

  test('la navegación por anclaje también dispara la animación de scroll de la sección destino', async ({
    page,
  }) => {
    const enlace = page.locator('nav[aria-label="Navegación principal"] a[href="#sobre-nosotros"]');
    const titular = page.locator('#sobre-nosotros [data-anim="subir"]').first();

    await expect(titular).toHaveCSS('opacity', '0');
    await enlace.click();
    await expect(titular).toHaveCSS('opacity', '1', { timeout: 3000 });
  });
});
