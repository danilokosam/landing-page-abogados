import { expect, test, type Page } from '@playwright/test';

// Animaciones de scroll (src/lib/gsap/animations.ts). Se ejecuta en
// escritorio (con ScrollSmoother) y en móvil (scroll nativo).

async function recorrerPagina(page: Page) {
  // Scroll gradual, como un visitante: dispara cada ScrollTrigger en orden.
  for (let i = 0; i < 70; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2500);
}

const estadoFinal = (page: Page) =>
  page.evaluate(() => {
    const animados = Array.from(document.querySelectorAll<HTMLElement>('[data-anim]'));
    return {
      total: animados.length,
      pendientes: animados
        .filter((el) => !el.hasAttribute('data-anim-hecho'))
        .map((el) => el.dataset.anim),
      invisibles: animados
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.opacity !== '1' || cs.visibility !== 'visible';
        })
        .map((el) => el.dataset.anim),
      // Sin estilos en línea residuales que pisen hovers o transiciones propias.
      transformEnLinea: animados.filter((el) => el.style.transform || el.style.opacity).length,
      desbordaX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

test.describe('Animaciones de scroll', () => {
  test('tras recorrer la página todo termina visible, marcado y sin estilos en línea residuales', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/gsap-listo/);
    // Estado inicial: las fichas (debajo del pliegue) arrancan ocultas.
    await expect(page.locator('[data-anim="ficha"]').first()).toHaveCSS('opacity', '0');

    await recorrerPagina(page);
    const estado = await estadoFinal(page);
    expect(estado.total).toBeGreaterThan(20);
    expect(estado.pendientes).toEqual([]);
    expect(estado.invisibles).toEqual([]);
    expect(estado.transformEnLinea).toBe(0);
    expect(estado.desbordaX).toBe(false);

    // Cifras: los contadores terminan en su valor final.
    for (const cifra of await page.locator('[data-counter]').all()) {
      await expect(cifra).toHaveText(
        `${await cifra.getAttribute('data-counter')}${(await cifra.getAttribute('data-suffix')) ?? ''}`,
      );
    }
    // El destello del botón final se ejecuta una sola vez y queda apagado.
    await expect(page.locator('[data-anim-destello]')).toHaveCSS('opacity', '0');
  });

  test('en móvil cada ficha se anima al entrar ella en pantalla, no la segunda fuera de vista', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'El caso del contenedor que disparaba todo a la vez es el de móvil.');
    await page.goto('/');
    const fichas = page.locator('[data-anim="ficha"]');
    await fichas.first().evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 200);
    });
    await expect(fichas.first()).toHaveCSS('opacity', '1', { timeout: 3000 });
    await expect(fichas.nth(1)).toHaveCSS('opacity', '0');

    await fichas.nth(1).evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 200);
    });
    await expect(fichas.nth(1)).toHaveCSS('opacity', '1', { timeout: 3000 });
  });

  test('los títulos partidos por líneas conservan su texto accesible completo', async ({
    page,
  }) => {
    await page.goto('/');
    await recorrerPagina(page);
    for (const titulo of await page.locator('[data-anim="titulo"]').all()) {
      const texto = (await titulo.textContent())?.replace(/\s+/g, ' ').trim();
      await expect(titulo).toHaveAttribute('aria-label', texto ?? '');
      await expect(titulo).toBeVisible();
    }
  });

  test('el header gana fondo y sombra al desplazarse y lo pierde al volver arriba', async ({
    page,
  }) => {
    await page.goto('/');
    const header = page.locator('header.site-header');
    await expect(header).not.toHaveClass(/header-desplazado/);
    await recorrerPagina(page);
    await expect(header).toHaveClass(/header-desplazado/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveClass(/header-desplazado/, { timeout: 4000 });
  });
});

test.describe('Animaciones de scroll — sin animación', () => {
  test('con prefers-reduced-motion no se oculta nada y no se activa gsap-listo', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(500);
    await expect(page.locator('html')).not.toHaveClass(/gsap-listo/);
    const invisibles = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-anim]'))
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.opacity !== '1' || cs.visibility !== 'visible' || cs.clipPath !== 'none';
        })
        .map((el) => el.dataset.anim),
    );
    expect(invisibles).toEqual([]);
  });

  test('si el JavaScript no se ejecuta, todo el contenido animable se ve igualmente', async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    await page.goto('/');
    const invisibles = await page.locator('[data-anim]').evaluateAll((els) =>
      els
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.opacity !== '1' || cs.visibility !== 'visible' || cs.clipPath !== 'none';
        })
        .map((el) => (el as HTMLElement).dataset.anim),
    );
    expect(invisibles).toEqual([]);
    await contexto.close();
  });
});
