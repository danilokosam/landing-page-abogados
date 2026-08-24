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

export function inicializarRevealsDeScroll(): void {
  respetaMovimiento.add('(prefers-reduced-motion: no-preference)', () => {
    const elementos = gsap.utils.toArray<HTMLElement>('[data-animate="fade-up"]');

    elementos.forEach((el) => {
      gsap.from(el, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
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

// TODO(fase 4): stagger del hero, hover de tarjetas de servicio — ver
// tabla de microinteracciones de la propuesta.
