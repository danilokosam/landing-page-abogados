import { test, expect } from '@playwright/test';

// Recursos SEO servidos de verdad por el sitio (no solo declarados en el
// <head>): si alguno devuelve 404 o el tipo equivocado, buscadores y redes
// sociales los ignoran en silencio.

test.describe('Recursos SEO', () => {
  test('robots.txt permite rastrear y declara el sitemap con URL absoluta', async ({ request }) => {
    const respuesta = await request.get('/robots.txt');
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('text/plain');
    const texto = await respuesta.text();
    expect(texto).toContain('User-agent: *');
    expect(texto).toContain('Allow: /');
    expect(texto).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);
  });

  test('sitemap.xml es XML válido y lista la portada con URL absoluta', async ({ request }) => {
    const respuesta = await request.get('/sitemap.xml');
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('xml');
    const xml = await respuesta.text();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/);
  });

  test('site.webmanifest es JSON válido con nombre e iconos existentes', async ({ request }) => {
    const respuesta = await request.get('/site.webmanifest');
    expect(respuesta.status()).toBe(200);
    const manifest = await respuesta.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icono of manifest.icons) {
      expect((await request.get(icono.src)).status()).toBe(200);
    }
  });

  test('favicon (svg e ico) y apple-touch-icon existen', async ({ request }) => {
    for (const ruta of ['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png']) {
      expect((await request.get(ruta)).status(), ruta).toBe(200);
    }
  });

  test('la imagen para compartir es un JPEG de 1200×630 y pesa menos de 300 KB (límite de WhatsApp)', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const urlOg = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(urlOg).toMatch(/^https?:\/\//);
    // og:image es absoluta contra `site` (localhost:4321 en local); aquí se
    // pide la misma ruta al servidor de pruebas.
    const ruta = new URL(urlOg!).pathname;

    const respuesta = await request.get(ruta);
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('image/jpeg');
    expect((await respuesta.body()).length).toBeLessThan(300 * 1024);

    const dimensiones = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, ruta);
    expect(dimensiones).toEqual([1200, 630]);
  });

  test('el JSON-LD de la portada es JSON válido', async ({ page }) => {
    await page.goto('/');
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    expect(() => JSON.parse(json ?? '')).not.toThrow();
  });

  test('una URL inexistente devuelve 404 con página propia, noindex y sin intro', async ({
    page,
  }) => {
    const respuesta = await page.goto('/esta-pagina-no-existe');
    expect(respuesta?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Esta página no existe');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-sin-intro', '');
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });
});
