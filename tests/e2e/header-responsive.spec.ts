import { expect, test } from '@playwright/test';

// Regresión: a 768 px el nombre se cortaba con «…» y «Sobre Nosotros» /
// «Agendar consulta» se partían en dos líneas.
const anchos = [375, 768, 900, 1024, 1280];

for (const ancho of anchos) {
  test(`header limpio a ${ancho}px: sin «…», sin saltos de línea en enlaces/CTA y sin desbordar`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: ancho, height: 700 });
    await page.goto('/');

    const resultado = await page.evaluate(() => {
      const header = document.querySelector('header.site-header')!;
      const visible = (el: Element | null) => !!el && el.getClientRects().length > 0;
      // Nº de líneas del texto propio de un elemento (ignora iconos).
      const lineas = (el: Element) => {
        const rango = document.createRange();
        const tops = new Set<number>();
        for (const nodo of el.childNodes) {
          if (nodo.nodeType !== Node.TEXT_NODE || !nodo.textContent?.trim()) continue;
          rango.selectNodeContents(nodo);
          for (const r of rango.getClientRects()) tops.add(Math.round(r.top));
        }
        return tops.size;
      };
      const nombre = header.querySelector('a[href="#"] span')!;
      const enlaces = [
        ...header.querySelectorAll('nav[aria-label="Navegación principal"] a'),
        header.querySelector('a[href^="https://wa.me/"]'),
      ].filter(visible) as Element[];
      return {
        nombreRecortado: nombre.scrollWidth > nombre.clientWidth + 1,
        nombreLineas: lineas(nombre),
        enlacesMultilinea: enlaces.filter((e) => lineas(e) > 1).map((e) => e.textContent?.trim()),
        desbordaX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    expect(resultado.nombreRecortado).toBe(false);
    expect(resultado.nombreLineas).toBe(1);
    expect(resultado.enlacesMultilinea).toEqual([]);
    expect(resultado.desbordaX).toBe(false);
  });
}
