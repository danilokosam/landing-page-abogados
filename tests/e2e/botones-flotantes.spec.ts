import { expect, test } from '@playwright/test';

// Se ejecuta en escritorio (con ScrollSmoother) y en móvil (scroll nativo).
test.describe('Botones flotantes', () => {
  test('WhatsApp siempre visible; "volver arriba" oculto arriba, aparece al bajar y devuelve al inicio', async ({
    page,
  }) => {
    await page.goto('/');
    const whatsapp = page.locator('#botones-flotantes a[href^="https://wa.me/"]');
    const volver = page.locator('#volver-arriba');

    await expect(whatsapp).toBeVisible();
    await expect(volver).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(volver).toBeVisible();

    await volver.click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
    await expect(volver).toBeHidden();
  });

  test('al final de la página no tapan el aviso de datos ni el copyright del footer', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('#volver-arriba')).toBeVisible();
    await page.waitForTimeout(1500); // fin del suavizado de ScrollSmoother

    const botones = (await page.locator('#botones-flotantes').boundingBox())!;
    // Se mide el texto real (Range), no la caja del <p>: un bloque ocupa todo
    // el ancho aunque su texto sea corto (p. ej. el copyright).
    const cajasDeTexto = await page
      .locator('footer#contacto > div > div:last-child p')
      .evaluateAll((parrafos) =>
        parrafos.flatMap((parrafo) => {
          const rango = document.createRange();
          rango.selectNodeContents(parrafo);
          return Array.from(rango.getClientRects()).map(({ x, y, width, height }) => ({
            x,
            y,
            width,
            height,
          }));
        }),
      );
    expect(cajasDeTexto.length).toBeGreaterThan(0);
    for (const caja of cajasDeTexto) {
      const seSolapan =
        botones.x < caja.x + caja.width &&
        caja.x < botones.x + botones.width &&
        botones.y < caja.y + caja.height &&
        caja.y < botones.y + botones.height;
      expect(seSolapan).toBe(false);
    }
  });

  test('no hay desbordamiento horizontal por los botones', async ({ page }) => {
    await page.goto('/');
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(desborda).toBe(false);
  });
});
