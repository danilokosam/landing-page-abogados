import { expect, test } from '@playwright/test';

// Retratos sin fondo de «Sobre nosotros»: cargan, no se deforman y quedan
// enteros dentro del panel (la cabeza nunca sale por arriba).
test('las fotos de los socios cargan sin deformarse y caben enteras en su panel', async ({
  page,
}) => {
  await page.goto('/');
  const fotos = page.locator('#sobre-nosotros figure.ficha-panel img');
  await expect(fotos).toHaveCount(2);

  for (const foto of await fotos.all()) {
    await foto.scrollIntoViewIfNeeded();
    await expect
      .poll(() => foto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);

    const medida = await foto.evaluate((img: HTMLImageElement) => {
      const caja = img.getBoundingClientRect();
      const panel = img.closest('figure')!.getBoundingClientRect();
      return {
        proporcionArchivo: img.naturalWidth / img.naturalHeight,
        proporcionCaja: caja.width / caja.height,
        margenSuperior: caja.top - panel.top,
        dentroHorizontal: caja.left >= panel.left - 0.5 && caja.right <= panel.right + 0.5,
        alturaPx: caja.height,
      };
    });
    expect(Math.abs(medida.proporcionCaja - medida.proporcionArchivo)).toBeLessThan(0.01);
    expect(medida.margenSuperior).toBeGreaterThanOrEqual(0);
    expect(medida.dentroHorizontal).toBe(true);
    expect(medida.alturaPx).toBeGreaterThan(200); // bastante mayor que el antiguo círculo de 112 px
  }

  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desborda).toBe(false);
});
