/**
 * Funciones de animación reutilizables, aplicadas por atributo
 * (data-animate="...") en vez de por clase de estilo, para que el
 * diseño visual pueda cambiar sin romper la animación.
 * Ver Propuesta de arquitectura, sección 03 — catálogo de
 * microinteracciones. Implementación pendiente de Fase 4.
 */

// Importar desde ./setup (en vez de 'gsap' directo) garantiza que
// ScrollTrigger ya esté registrado antes de usar la opción `scrollTrigger`.
import { gsap, respetaMovimiento } from './setup';

/**
 * Revelados de scroll para las secciones que aún no tenían animación
 * propia (Sobre Nosotros, Servicios). Igual que la entrada del Hero,
 * el estado inicial oculto vive solo en global.css — esta función
 * únicamente anima HACIA el estado visible (gsap.to), nunca declara el
 * "from", para no duplicar valores entre CSS y JS.
 *
 * Dos convenciones de atributo, desacopladas de clases de utilidad:
 *   - data-reveal="left" | "right" | "up" — bloque único que entra
 *     desde un lado u desde abajo.
 *   - data-reveal-grid — el elemento en sí no se anima; se anima cada
 *     uno de sus hijos directos con stagger (grid de TarjetaServicio).
 * Cada trigger dispara una única vez (`once: true`) al entrar en el
 * viewport, con el mismo umbral (`top 85%`) que el resto de
 * animaciones del sitio.
 */
export function inicializarRevealsDeScroll(): void {
  respetaMovimiento.add('(prefers-reduced-motion: no-preference)', () => {
    const ejeDireccion: Record<'left' | 'right' | 'up', 'x' | 'y'> = {
      left: 'x',
      right: 'x',
      up: 'y',
    };

    (Object.keys(ejeDireccion) as Array<keyof typeof ejeDireccion>).forEach((direccion) => {
      const eje = ejeDireccion[direccion];
      const elementos = gsap.utils.toArray<HTMLElement>(`[data-reveal="${direccion}"]`);

      elementos.forEach((el) => {
        gsap.to(el, {
          [eje]: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });
    });

    const grids = gsap.utils.toArray<HTMLElement>('[data-reveal-grid]');
    grids.forEach((grid) => {
      const items = gsap.utils.toArray<HTMLElement>(grid.children);
      if (items.length === 0) return;

      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true,
        },
      });
    });
  });
}

/**
 * Cuenta progresiva de 0 al valor final para elementos [data-counter].
 * El HTML ya renderiza el valor final (ver CifrasClave.astro) como
 * fallback de accesibilidad/SEO; esta animación solo lo sobrescribe
 * temporalmente si el usuario no pidió `prefers-reduced-motion`. Se
 * dispara una única vez al entrar en el viewport (`once: true`).
 */
export function inicializarContadores(): void {
  respetaMovimiento.add('(prefers-reduced-motion: no-preference)', () => {
    const elementos = gsap.utils.toArray<HTMLElement>('[data-counter]');

    elementos.forEach((el) => {
      const valorFinal = Number(el.dataset.counter);
      const sufijo = el.dataset.suffix ?? '';
      if (Number.isNaN(valorFinal)) return;

      const contador = { valor: 0 };
      gsap.to(contador, {
        valor: valorFinal,
        duration: 1.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${Math.round(contador.valor)}${sufijo}`;
        },
      });
    });
  });
}

// TODO(fase 4): hover de tarjetas de servicio — ver tabla de
// microinteracciones de la propuesta.
