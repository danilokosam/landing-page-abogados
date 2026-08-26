import { test, expect, devices } from '@playwright/test';

test.describe('Sin desbordamiento horizontal en móvil', () => {
  // Perfil real de teléfono (touch + pointer:coarse): esDispositivoTactil()
  // bypasea ScrollSmoother, así que #smooth-wrapper NUNCA recibe el
  // overflow:hidden que GSAP le pone cuando sí se inicializa — por eso el
  // bug solo es visible en móvil, no en escritorio.
  const { defaultBrowserType: _defaultBrowserType, ...pixel7SinBrowserType } = devices['Pixel 7'];
  test.use({ ...pixel7SinBrowserType });

  test('no hay scroll horizontal justo tras cargar la página (data-reveal="left"/"right" aún sin disparar)', async ({
    page,
  }) => {
    await page.goto('/');

    // Antes de que el usuario haga scroll, los bloques [data-reveal="left"]
    // (Sobre Nosotros) y [data-reveal="right"] siguen en su estado oculto
    // con transform: translateX(∓40px) — si nada los recorta, empujan el
    // ancho scrolleable del documento más allá del viewport.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('no hay scroll horizontal al hacer scroll hasta y a través de #cifras-clave', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#cifras-clave').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // El ancho efectivo del layout debe coincidir con el del viewport: no
    // debe existir ningún desplazamiento horizontal posible.
    await page.mouse.wheel(500, 0);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  });

  test('no hay scroll horizontal tras revelar Sobre Nosotros y Servicios (después de disparar sus animaciones)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#servicios').scrollIntoViewIfNeeded();
    // Deja tiempo de sobra a los reveals con transform en X para completar
    // su animación y asentarse en su posición final.
    await page.waitForTimeout(1000);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('Hover ágil en las tarjetas de Servicios', () => {
  // :hover no es un estado persistente real en dispositivos táctiles — se
  // fuerza un puntero fino (mouse) explícitamente para que esta prueba dé
  // el mismo resultado corra bajo "chromium" o "mobile-chromium".
  test.use({ hasTouch: false, isMobile: false });

  test('la tarjeta de servicio usa una transición corta (150ms) con ease-out, no la de 300ms anterior', async ({
    page,
  }) => {
    await page.goto('/');
    const tarjeta = page.locator('#servicios article').first();
    await expect(tarjeta).toHaveClass(/duration-150/);
    await expect(tarjeta).not.toHaveClass(/duration-300/);

    const transicion = await tarjeta.evaluate((el) => getComputedStyle(el).transitionDuration);
    // getComputedStyle expande transition-duration por cada propiedad
    // listada en transition-property (transition-all las expande todas) —
    // basta con que NINGUNA dure más de 150ms.
    const duraciones = transicion.split(',').map((s) => parseFloat(s) * 1000);
    for (const ms of duraciones) {
      expect(ms).toBeLessThanOrEqual(150);
    }
  });

  test('el hover de la tarjeta responde de inmediato: color de icono ya cambiado a los ~150ms', async ({
    page,
  }) => {
    await page.goto('/');
    const tarjeta = page.locator('#servicios article').first();
    const icono = tarjeta.locator('div').first();

    // Espera a que el reveal de entrada del grid (data-reveal-grid, disparado
    // por el propio scrollIntoView de hover()) termine de asentarse, para no
    // confundir esa animación con la del hover que se está probando aquí.
    await tarjeta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    const colorInicial = await icono.evaluate((el) => getComputedStyle(el).backgroundColor);
    await tarjeta.hover();

    // Sondeo acotado en vez de una única instantánea a los 200ms: evita que
    // una ejecución más lenta de lo normal (CI, carga en paralelo) confunda
    // "todavía no llegó" con "no cambió". El límite (bastante por debajo de
    // los 300ms anteriores) es lo que de verdad importa aquí.
    await expect
      .poll(() => icono.evaluate((el) => getComputedStyle(el).backgroundColor), {
        timeout: 250,
      })
      .not.toBe(colorInicial);
  });
});
