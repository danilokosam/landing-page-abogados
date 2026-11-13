import { test, expect, type Page } from '@playwright/test';

// La intro se omite en navegadores automatizados (navigator.webdriver) para
// no interferir con el resto de la suite — aquí se simula un navegador
// "real" para poder probarla.
async function comoNavegadorReal(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
}

test.describe('Intro de carga', () => {
  // La intro se retira a los 3 s: si esta es la primera visita a un
  // servidor de desarrollo recién arrancado, la compilación en frío puede
  // comerse esa ventana. Se calienta antes con una visita sin intro
  // (webdriver real = true → se omite).
  test.beforeAll(async ({ browser }) => {
    const pagina = await browser.newPage();
    await pagina.goto('/');
    await pagina.close();
  });

  test('se muestra a pantalla completa en la primera visita y se retira sola en ~3 s', async ({
    page,
  }) => {
    await comoNavegadorReal(page);
    await page.goto('/');

    const intro = page.locator('#intro');
    await expect(page.locator('html')).toHaveClass(/intro-activa/);
    await expect(intro).toBeVisible();
    await expect(intro).toHaveCSS('position', 'fixed');

    // Se elimina del DOM y libera el scroll antes de los 3.5 s.
    await expect(intro).toHaveCount(0, { timeout: 3500 });
    await expect(page.locator('html')).not.toHaveClass(/intro-activa/);
    await expect(page.locator('[data-hero-anim="title"]')).toBeVisible();
  });

  test('no se repite al recargar dentro de la misma sesión', async ({ page }) => {
    await comoNavegadorReal(page);
    await page.goto('/');
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 3500 });

    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/intro-activa/);
    await expect(page.locator('#intro')).toBeHidden();
  });

  test('un clic la salta de inmediato', async ({ page }) => {
    await comoNavegadorReal(page);
    await page.goto('/');
    await expect(page.locator('#intro')).toBeVisible();

    await page.locator('#intro').click();
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 300 });
    await expect(page.locator('html')).not.toHaveClass(/intro/);
  });

  test('con prefers-reduced-motion no se muestra', async ({ page }) => {
    await comoNavegadorReal(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/intro-activa/);
    await expect(page.locator('#intro')).toBeHidden();
  });

  test('en navegadores automatizados (webdriver) se omite', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/intro-activa/);
    await expect(page.locator('#intro')).toBeHidden();
  });
});
