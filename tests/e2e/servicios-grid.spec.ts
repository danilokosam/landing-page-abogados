import { expect, test } from '@playwright/test';

// La cuadrícula de servicios queda equilibrada: todas las filas completas
// (sin una tarjeta huérfana en la última) en móvil, tablet y escritorio.
const anchos = [
  { ancho: 375, columnas: 1 },
  { ancho: 768, columnas: 2 },
  { ancho: 1280, columnas: 3 },
];

for (const { ancho, columnas } of anchos) {
  test(`servicios a ${ancho}px: ${columnas} por fila y sin filas incompletas`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto('/');

    const filas = await page.locator('#servicios article').evaluateAll((tarjetas) => {
      const porFila = new Map<number, number>();
      for (const t of tarjetas) {
        const y = Math.round(t.getBoundingClientRect().top);
        porFila.set(y, (porFila.get(y) ?? 0) + 1);
      }
      return Array.from(porFila.values());
    });

    expect(filas.every((n) => n === columnas)).toBe(true);
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(desborda).toBe(false);
  });
}
