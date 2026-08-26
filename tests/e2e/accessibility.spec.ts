import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accesibilidad básica (axe-core) sobre el HTML compilado', () => {
  test('la página de inicio no tiene violaciones de las reglas WCAG 2.1 A/AA', async ({ page }) => {
    await page.goto('/');

    const resultados = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
  });

  test('el menú móvil abierto no introduce violaciones de accesibilidad', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#menu-movil-boton').click();
    await expect(page.locator('#menu-movil')).toHaveJSProperty('open', true);

    const resultados = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
  });
});
