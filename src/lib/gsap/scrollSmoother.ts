/**
 * ScrollSmoother — desplazamiento suave para toda la página.
 * Requiere la estructura #smooth-wrapper > #smooth-content definida en
 * BaseLayout.astro. El Header vive fuera de esa jerarquía (a propósito,
 * vía el slot "fixed") porque un ancestro transformado rompe
 * position: sticky/fixed en sus descendientes — así el Header sigue
 * siendo sticky de forma nativa, sin necesitar ningún tratamiento
 * especial adicional.
 *
 * Se desactiva por completo (no solo se omite la animación, no se
 * llega a inicializar el plugin) en dos casos, evaluados antes que
 * nada de GSAP:
 *   1. Dispositivos táctiles (`pointer: coarse`) — el scroll nativo
 *      del sistema operativo ya es fluido y predecible ahí; un scroll
 *      "suavizado" por JS solo añade latencia percibida al gesto de
 *      arrastre táctil.
 *   2. `prefers-reduced-motion: reduce` — vía el `respetaMovimiento`
 *      compartido, igual que el resto de animaciones del sitio.
 * En ambos casos el scroll nativo del navegador sigue funcionando sin
 * ningún cambio: #smooth-wrapper/#smooth-content quedan como simples
 * <div> sin estilo, invisibles para el layout.
 */
import { ScrollSmoother, respetaMovimiento } from './setup';

function esDispositivoTactil(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

export function inicializarScrollSmoother(): void {
  if (esDispositivoTactil()) return;

  respetaMovimiento.add('(prefers-reduced-motion: no-preference)', () => {
    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.2,
      effects: false,
    });
    // Nota: se probó forzar `scroll-behavior: auto` aquí para evitar que
    // compitiera con el CSS nativo, pero el propio ScrollSmoother
    // reafirma `scroll-behavior: smooth` en <html> de forma continua
    // (verificado en el navegador) — es parte de cómo gestiona sus
    // propios saltos a anclajes, no un conflicto real con el suavizado
    // por transform. Se deja intacto a propósito.
  });
}
