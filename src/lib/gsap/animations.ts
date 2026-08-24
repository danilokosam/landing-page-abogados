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

/**
 * Entrada del bloque principal del Hero — "revelado con línea de firma"
 * (Propuesta 02 del estudio de animación). El estado inicial oculto de
 * [data-hero-anim] vive en global.css, bajo html:not(.no-js) y solo con
 * `prefers-reduced-motion: no-preference` — esta función únicamente
 * anima HACIA el estado visible; nunca declara el "from", para que CSS
 * siga siendo la única fuente de verdad de ese estado inicial (ver
 * BaseLayout.astro para el script que quita "no-js" antes del primer
 * pintado).
 */
export function inicializarEntradaHero(): void {
  respetaMovimiento.add('(prefers-reduced-motion: no-preference)', () => {
    const eyebrow = document.querySelector<HTMLElement>('[data-hero-anim="eyebrow"]');
    const linea = document.querySelector<HTMLElement>('[data-hero-anim="line"]');
    const titulo = document.querySelector<HTMLElement>('[data-hero-anim="title"]');
    const parrafo = document.querySelector<HTMLElement>('[data-hero-anim="lead"]');
    const ctas = gsap.utils.toArray<HTMLElement>('[data-hero-anim="cta"]');

    if (!eyebrow || !linea || !titulo || !parrafo || ctas.length === 0) return;

    gsap
      .timeline({ defaults: { ease: 'power2.out' } })
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.4 })
      .to(linea, { scaleX: 1, duration: 0.5, ease: 'power3.out' }, '<')
      .to(titulo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.out' }, '-=0.1')
      .to(parrafo, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .to(ctas, { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08 }, '-=0.2');
  });
}

// TODO(fase 4): hover de tarjetas de servicio — ver tabla de
// microinteracciones de la propuesta.
