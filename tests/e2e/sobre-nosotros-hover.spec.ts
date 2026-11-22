import { expect, test, type Page } from '@playwright/test';

// Efecto hover de las fichas de «Sobre nosotros» (ver <style> en
// SobreNosotros.astro): capas que se encienden solo con opacity, luz que
// sigue al cursor y nada de hover "pegado" en táctil.

async function irAFicha(page: Page) {
  await page.goto('/');
  const ficha = page.locator('#sobre-nosotros .ficha').first();
  await ficha.evaluate((el) =>
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140),
  );
  await page.waitForTimeout(2000); // reveal + suavizado de ScrollSmoother
  return ficha;
}

const estado = (ficha: ReturnType<Page['locator']>) =>
  ficha.evaluate((el) => ({
    borde: getComputedStyle(el, '::after').opacity,
    interior: getComputedStyle(el, '::before').opacity,
    halo: getComputedStyle(el.querySelector('.ficha-halo')!).opacity,
    filete: getComputedStyle(el.querySelector('.ficha-filete')!).transform,
    x: el.style.getPropertyValue('--x'),
    textoTransformado: getComputedStyle(el.querySelector('h3')!).transform !== 'none',
  }));

test.describe('Fichas de Sobre nosotros — hover', () => {
  test('con ratón: se encienden borde, resplandor y halo, la luz sigue al cursor y el texto no se transforma', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Sin hover en táctil (cubierto en el test siguiente).');
    const ficha = await irAFicha(page);

    const reposo = await estado(ficha);
    expect([reposo.borde, reposo.interior, reposo.halo]).toEqual(['0', '0', '0']);

    const caja = (await ficha.boundingBox())!;
    await page.mouse.move(caja.x + caja.width - 40, caja.y + 40, { steps: 5 });
    await expect.poll(async () => (await estado(ficha)).borde).toBe('1');

    const activo = await estado(ficha);
    expect(activo.interior).toBe('1');
    expect(activo.halo).toBe('1');
    expect(activo.filete).toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(parseFloat(activo.x)).toBeGreaterThan(caja.width / 2);
    expect(activo.textoTransformado).toBe(false);
  });

  test('en táctil el toque no deja el efecto encendido', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica a dispositivos táctiles.');
    const ficha = await irAFicha(page);
    await ficha.locator('h3').tap();
    await page.waitForTimeout(700);
    const tras = await estado(ficha);
    expect([tras.borde, tras.halo]).toEqual(['0', '0']);
  });

  test('con prefers-reduced-motion no hay transición ni seguimiento del cursor', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Sin hover en táctil.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const ficha = await irAFicha(page);
    const duracion = await ficha.evaluate(
      (el) => getComputedStyle(el, '::after').transitionDuration,
    );
    expect(duracion).toBe('0s');

    const caja = (await ficha.boundingBox())!;
    await page.mouse.move(caja.x + caja.width - 40, caja.y + 40, { steps: 5 });
    const activo = await estado(ficha);
    expect(activo.borde).toBe('1'); // el estado cambia, pero al instante
    expect(activo.x).toBe(''); // la luz no sigue al cursor
  });
});
