import { test, expect } from '@playwright/test';

// Playwright lanza Chromium con --hide-scrollbars por defecto, lo que
// ocultaría justo el bug que se prueba aquí: la intro bloquea el scroll con
// overflow:hidden y, sin scrollbar-gutter: stable, la barra reaparecía al
// terminar y estrechaba el viewport (~15px) → todo el contenido saltaba.
// Opción worker-scoped: solo puede fijarse a nivel de archivo.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('al terminar la intro, la barra de desplazamiento no desplaza el contenido (sin layout shift)', async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto('/');
  await expect(page.locator('#intro')).toBeVisible();

  const titulo = page.locator('[data-hero-anim="title"]');
  const xDurante = await titulo.evaluate((el) => el.getBoundingClientRect().x);

  await expect(page.locator('#intro')).toHaveCount(0, { timeout: 3500 });
  const xDespues = await titulo.evaluate((el) => el.getBoundingClientRect().x);

  if (!isMobile) {
    // Precondición: en escritorio la barra clásica ocupa espacio real; si no,
    // la prueba no estaría midiendo nada.
    const anchoBarra = await page.evaluate(
      () => window.innerWidth - document.documentElement.clientWidth,
    );
    expect(anchoBarra).toBeGreaterThan(0);
  }
  expect(xDespues).toBe(xDurante);
});
