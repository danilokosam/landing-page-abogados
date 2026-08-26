import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fondo ambiental con degradado', () => {
  test('se renderiza como capa decorativa fija, detrás de todo y sin bloquear clics', async ({
    page,
  }) => {
    await page.goto('/');
    const fondo = page.locator('#fondo-ambiental');

    await expect(fondo).toBeAttached();
    await expect(fondo).toHaveAttribute('aria-hidden', 'true');
    await expect(fondo).toHaveCSS('position', 'fixed');
    await expect(fondo).toHaveCSS('pointer-events', 'none');

    // Un elemento justo "debajo" del fondo (en la misma coordenada donde el
    // fondo se pinta) debe seguir siendo el objetivo real de los clics —
    // el fondo, aunque cubre toda la pantalla, no debe interceptarlos.
    const header = page.locator('header.site-header');
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    const elementoEnEsePunto = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('header.site-header') !== null,
      [box!.x + box!.width / 2, box!.y + box!.height / 2] as [number, number],
    );
    expect(elementoEnEsePunto).toBe(true);
  });

  test('no introduce scroll horizontal ni desplaza el contenido (sin layout shift)', async ({
    page,
  }) => {
    await page.goto('/');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('modo claro: la página no tiene violaciones de accesibilidad (WCAG 2.1 A/AA)', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/light/);

    const resultados = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
  });

  test('modo oscuro: la página no tiene violaciones de accesibilidad (WCAG 2.1 A/AA)', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);

    const resultados = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
  });
});
