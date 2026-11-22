import { test, expect, devices } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Menú móvil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('se abre a pantalla completa al pulsar el botón de menú', async ({ page }) => {
    const boton = page.locator('#menu-movil-boton');
    const detalles = page.locator('#menu-movil');
    const nav = page.locator('#menu-movil nav');

    await expect(detalles).not.toHaveJSProperty('open', true);
    await boton.click();
    await expect(detalles).toHaveJSProperty('open', true);
    await expect(nav).toBeVisible();

    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.width).toBeCloseTo(viewport!.width, 0);
    expect(box!.height).toBeGreaterThanOrEqual(viewport!.height - 1);
  });

  test('actualiza el aria-label del botón al abrir y cerrar', async ({ page }) => {
    const boton = page.locator('#menu-movil-boton');
    await expect(boton).toHaveAttribute('aria-label', 'Abrir menú de navegación');
    await boton.click();
    await expect(boton).toHaveAttribute('aria-label', 'Cerrar menú de navegación');
    await boton.click();
    await expect(boton).toHaveAttribute('aria-label', 'Abrir menú de navegación');
  });

  test('se cierra al pulsar el botón de nuevo (mismo control de apertura/cierre)', async ({
    page,
  }) => {
    const boton = page.locator('#menu-movil-boton');
    const detalles = page.locator('#menu-movil');

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', true);
    await boton.click();
    await expect(detalles).toHaveJSProperty('open', false);
  });

  test('se cierra al pulsar Escape', async ({ page }) => {
    const boton = page.locator('#menu-movil-boton');
    const detalles = page.locator('#menu-movil');

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', true);
    await page.keyboard.press('Escape');
    await expect(detalles).toHaveJSProperty('open', false);
  });

  test('se cierra al hacer clic en un enlace de navegación', async ({ page }) => {
    const boton = page.locator('#menu-movil-boton');
    const detalles = page.locator('#menu-movil');
    const enlaceServicios = page
      .locator('#menu-movil [data-menu-movil-enlace]')
      .filter({ hasText: 'Servicios' });

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', true);
    await enlaceServicios.click();
    await expect(detalles).toHaveJSProperty('open', false);
    await expect(page).toHaveURL(/#servicios$/);
  });

  test('el Header permanece "sticky" (slot fixed) incluso con el menú cerrado y tras hacer scroll', async ({
    page,
  }) => {
    const header = page.locator('header.site-header');
    await expect(header).toHaveCSS('position', 'sticky');

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(100);
    await expect(header).toBeInViewport();
  });
});

/**
 * Verifica que, tras navegar desde el menú móvil, el scroll transicione en
 * continuidad desde la posición previa hasta el destino — sin pasar
 * visiblemente por 0 (el bug: MenuMovil bloqueaba el scroll manipulando
 * document.body, lo cual, cuando ScrollSmoother está activo, colapsa su
 * altura scrolleable real y desincroniza su posición interna del scroll
 * real; la siguiente animación arrancaba entonces desde 0).
 *
 * Reutilizable porque el bug tiene DOS causas raíz distintas según el
 * dispositivo (ver MenuMovil.astro): sin ScrollSmoother (táctil/reduced-
 * motion) la restauración de scroll competía por el scroll con la
 * navegación; con ScrollSmoother activo (escritorio, sin reduced-motion)
 * era la manipulación de <body> la que corrompía su estado interno. Ambos
 * escenarios necesitan esta misma comprobación de principio a fin.
 */
async function verificarContinuidadDeScrollAlNavegar(page: import('@playwright/test').Page) {
  await page.goto('/');

  // 1. Baja hasta una sección inferior (Servicios) antes de abrir el menú.
  const yServicios = await page
    .locator('#servicios')
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), yServicios);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(yServicios, -1);

  // 2. Abre el menú (con ScrollSmoother inactivo, esto baja scrollY a 0
  // momentáneamente por el bloqueo manual de <body> — invisible para el
  // usuario porque el propio menú, a pantalla completa, cubre la página
  // por debajo; con ScrollSmoother activo, paused() no toca scrollY en
  // absoluto).
  await page.locator('#menu-movil-boton').click();
  await expect(page.locator('#menu-movil')).toHaveJSProperty('open', true);

  // 3. Empieza a muestrear window.scrollY junto con el estado open del
  // menú (con marca de tiempo) en cada frame, ANTES del clic que cierra el
  // menú y navega — así se captura la transición completa. Se registra
  // `abierto` porque, mientras el menú sigue abierto, scrollY puede valer 0
  // por diseño (bloqueo de scroll) y eso es invisible para el usuario,
  // tapado por el propio overlay a pantalla completa: lo único que importa
  // es lo que ocurre DESPUÉS de que `abierto` pasa a false y la página
  // queda a la vista de nuevo.
  await page.evaluate(() => {
    const muestras: Array<{ t: number; y: number; abierto: boolean }> = [];
    (window as unknown as { __muestrasScroll: typeof muestras }).__muestrasScroll = muestras;
    const detalles = document.getElementById('menu-movil') as HTMLDetailsElement;
    const inicio = performance.now();
    const registrar = () => {
      muestras.push({ t: performance.now() - inicio, y: window.scrollY, abierto: detalles.open });
      if (performance.now() - inicio < 1500) requestAnimationFrame(registrar);
    };
    requestAnimationFrame(registrar);
  });

  // 4. Clic en un enlace a OTRA sección, más abajo que Servicios.
  const enlaceContacto = page
    .locator('#menu-movil [data-menu-movil-enlace]')
    .filter({ hasText: 'Contacto' });
  await enlaceContacto.click();

  await page.waitForTimeout(1600);
  const muestras = await page.evaluate(
    () =>
      (
        window as unknown as {
          __muestrasScroll: Array<{ t: number; y: number; abierto: boolean }>;
        }
      ).__muestrasScroll,
  );

  const muestrasVisibles = muestras.filter((m) => !m.abierto);
  expect(
    muestrasVisibles.length,
    'no se registró ninguna muestra con el menú ya cerrado',
  ).toBeGreaterThan(0);

  // Desde el instante en que el menú se cierra (la página vuelve a estar
  // visible), el scroll no debe caer cerca de 0 en 2 o más frames SEGUIDOS
  // — eso es el salto al inicio de la página que reporta el bug (en todas
  // las reproducciones confirmadas dura varios frames — la animación de
  // scroll interrumpida tarda ese mínimo en despegar de 0). El umbral es en
  // cantidad de frames consecutivos, no en tiempo: así es inmune a que un
  // solo frame tarde más de lo normal bajo carga (CI, ejecución en
  // paralelo) — eso produciría como mucho UNA muestra aislada cerca de 0,
  // nunca dos seguidas, y no debe confundirse con el bug real.
  const framesConsecutivosMinimos = 2;
  let consecutivasCercaDeCero = 0;
  for (const { y } of muestrasVisibles) {
    consecutivasCercaDeCero = y < 50 ? consecutivasCercaDeCero + 1 : 0;
    if (consecutivasCercaDeCero >= framesConsecutivosMinimos) {
      throw new Error(
        `Con el menú ya cerrado, el scroll volvió a ${y}px (cerca de 0) durante ` +
          `${consecutivasCercaDeCero} frames seguidos — es el salto al inicio de la página que ` +
          `reporta el bug. Muestras: ${JSON.stringify(muestras)}`,
      );
    }
  }

  // Y debe terminar asentado en Contacto, no a medio camino ni en 0. Se usa
  // toBeInViewport() (no una comparación exacta de scrollY) porque el
  // <footer> tiene scroll-mt-20: el destino real de la animación deja ese
  // margen para el header sticky, no el offsetTop exacto del elemento.
  await expect(page.locator('footer#contacto')).toBeInViewport();
}

test.describe('Menú móvil — continuidad del scroll al navegar, SIN ScrollSmoother (bug: salto a 0)', () => {
  // Perfil real de teléfono (touch + pointer:coarse): esDispositivoTactil()
  // en scrollSmoother.ts bypasea ScrollSmoother por completo, así que aquí
  // el bloqueo de scroll usa el patrón manual de position:fixed en <body>.
  const { defaultBrowserType: _defaultBrowserType, ...pixel7SinBrowserType } = devices['Pixel 7'];
  test.use({ ...pixel7SinBrowserType });

  test('el dispositivo emulado reporta pointer:coarse (precondición: confirma que ScrollSmoother está bypaseado)', async ({
    page,
  }) => {
    await page.goto('/');
    const esCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
    expect(esCoarse).toBe(true);
    await expect(page.locator('#smooth-wrapper')).not.toHaveCSS('position', 'fixed');
  });

  test('al navegar desde el menú, el scroll transiciona directo desde la posición previa, sin pasar visiblemente por 0', async ({
    page,
  }) => {
    await verificarContinuidadDeScrollAlNavegar(page);
  });

  test('bloquea el scroll fijando el body en su posición actual, y restaura esa posición al cerrar', async ({
    page,
  }) => {
    await page.goto('/');
    const boton = page.locator('#menu-movil-boton');
    const detalles = page.locator('#menu-movil');

    // Baja un poco por la página antes de abrir el menú, para verificar que
    // la posición de scroll se conserva (no se resetea a 0 al cerrar).
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForFunction(() => window.scrollY > 0);
    const scrollAntes = await page.evaluate(() => window.scrollY);

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', true);

    // El patrón de bloqueo fija el body con position:fixed y un `top`
    // negativo igual al scroll guardado — por eso, mientras está bloqueado,
    // window.scrollY pasa a valer 0 (el propio efecto de position:fixed);
    // lo que debe permanecer estable es ese `top` congelado, no scrollY.
    await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('fixed');
    expect(await page.evaluate(() => document.body.style.top)).toBe(`-${scrollAntes}px`);

    // Un intento de scroll no debe mover la página mientras está bloqueada.
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.body.style.top)).toBe(`-${scrollAntes}px`);

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', false);

    await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('');
    // Al cerrar, se restaura el scroll real a la posición guardada antes de
    // abrir el menú (no se queda en 0 ni salta a otro punto).
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollAntes);
  });
});

test.describe('Menú móvil — continuidad del scroll al navegar, CON ScrollSmoother activo (bug: salto a 0)', () => {
  // Viewport angosto (muestra el menú móvil vía el breakpoint lg:hidden)
  // pero SIN touch/pointer:coarse — el mismo escenario que reprodujo el
  // bug al probarlo a mano (ventana de escritorio angostada sin emulación
  // táctil): esDispositivoTactil() da false, así que ScrollSmoother SÍ se
  // inicializa. Forzado explícito de hasTouch/isMobile, no heredado del
  // proyecto, para que este test dé el mismo resultado corra bajo el
  // proyecto "chromium" o "mobile-chromium".
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: false, isMobile: false });

  test('ScrollSmoother está activo (precondición: confirma que se ejercita esta ruta, no el bypass táctil)', async ({
    page,
  }) => {
    await page.goto('/');
    const esCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
    expect(esCoarse).toBe(false);
    await expect(page.locator('#smooth-wrapper')).toHaveCSS('position', 'fixed');
  });

  test('al navegar desde el menú, el scroll transiciona directo desde la posición previa, sin pasar visiblemente por 0', async ({
    page,
  }) => {
    await verificarContinuidadDeScrollAlNavegar(page);
  });

  test('bloquea el scroll vía smoother.paused() (sin tocar el body), y la posición nunca se altera', async ({
    page,
  }) => {
    await page.goto('/');
    const boton = page.locator('#menu-movil-boton');
    const detalles = page.locator('#menu-movil');

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForFunction(() => window.scrollY > 0);
    const scrollAntes = await page.evaluate(() => window.scrollY);

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', true);

    // A diferencia del patrón manual (position:fixed), paused() no toca el
    // body en absoluto: ni su position, ni window.scrollY, que debe seguir
    // reflejando la posición real en todo momento (nunca cae a 0).
    expect(await page.evaluate(() => document.body.style.position)).toBe('');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollAntes, -1);

    // Un intento de scroll no debe mover la página mientras está bloqueada
    // (ScrollTrigger.observe con preventDefault, dentro de paused()).
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(150);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollAntes, -1);

    await boton.click();
    await expect(detalles).toHaveJSProperty('open', false);

    // Al cerrar, sigue exactamente donde estaba — nunca hubo nada que
    // restaurar, porque nunca se movió.
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollAntes, -1);
  });
});
