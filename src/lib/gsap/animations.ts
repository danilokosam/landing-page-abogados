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

// TODO(fase 4): stagger del hero, contador numérico de cifras de
// trayectoria, hover de tarjetas de servicio — ver tabla de
// microinteracciones de la propuesta.
