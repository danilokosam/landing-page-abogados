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
    const smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.2,
      effects: false,
    });
    // Nota: se probó forzar `scroll-behavior: auto` aquí para evitar que
    // compitiera con el CSS nativo, pero el propio ScrollSmoother
    // reafirma `scroll-behavior: smooth` en <html> de forma continua
    // (verificado en el navegador) — comportamiento propio del plugin,
    // sin relación con el manejo de anclajes (ver más abajo). Se deja
    // intacto a propósito.

    // Bug real detectado al probar los enlaces de navegación: sin esto,
    // un clic en <a href="#servicios"> deja que el navegador use su
    // salto nativo, que aquí desplaza el scrollTop INTERNO de
    // #smooth-wrapper (por ser el ancestro con overflow:hidden) en vez
    // del scroll real de la página — ScrollTrigger nunca se entera de
    // la nueva posición y sus animaciones (incluidos los reveals de
    // Sobre Nosotros/Servicios) dejan de disparar. ScrollSmoother NO
    // intercepta enlaces de anclaje por sí solo (no hay ninguna lógica
    // de eso en su código fuente) — hay que delegar explícitamente en
    // su propio scrollTo(), que sí mantiene sincronizado a ScrollTrigger.
    document.addEventListener('click', (evento) => {
      const objetivo = evento.target;
      if (!(objetivo instanceof Element)) return;

      const enlace = objetivo.closest<HTMLAnchorElement>('a[href^="#"]');
      const id = enlace?.getAttribute('href')?.slice(1);
      const destino = id ? document.getElementById(id) : null;
      if (!enlace || !destino) return;

      evento.preventDefault();
      smoother.scrollTo(destino, true, 'top top');
      history.pushState(null, '', `#${id}`);
    });

    // LIMITACIÓN CONOCIDA, sin resolver: cargar la página directamente
    // con un hash en la URL (ej. un enlace externo a .../#servicios)
    // tiene el mismo problema que el click — el navegador salta ahí de
    // forma nativa antes de que ScrollSmoother/ScrollTrigger terminen
    // de inicializarse, y la sección queda con su contenido oculto (el
    // reveal nunca llega a dispararse). Se intentó corregir aquí mismo
    // repitiendo smoother.scrollTo() tras el `create()` — tanto en el
    // mismo tick como diferido a requestAnimationFrame — con resultado
    // inconsistente entre intentos (a veces no se movía en absoluto),
    // así que se descarta el intento a falta de más tiempo para
    // investigarlo con calma, en vez de dejar un parche que funciona
    // "a veces". Pendiente para una sesión futura — ver PROJECT_STATE.md.
    // El caso realmente pedido en esta tarea (reveals al hacer scroll
    // orgánico y al navegar por los enlaces del menú durante la sesión)
    // sí quedó resuelto y verificado arriba.
  });
}
