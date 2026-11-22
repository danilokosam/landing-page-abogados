/**
 * Punto único de registro de GSAP y sus plugins.
 * Ver Propuesta de arquitectura, sección 03 — se importa una sola vez
 * desde BaseLayout.astro. No registrar plugins por componente.
 *
 * ScrollSmoother fue, hasta 2025, un plugin exclusivo de la membresía
 * de pago "Club GSAP" (requería un token de registro privado). Desde
 * la adquisición de GreenSock por Webflow se liberó junto con el resto
 * de plugins "bonus" bajo la licencia estándar sin coste — el propio
 * paquete `gsap` instalado (^3.15.0) ya lo incluye, sin token ni
 * registro adicional. Ver PROJECT_STATE.md para el detalle de esta
 * decisión frente a la alternativa (Lenis).
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
// SplitText también forma parte del paquete `gsap` estándar y gratuito
// desde la 3.13 — se usa para el revelado por líneas de los títulos.
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

// Instancia de matchMedia compartida: toda animación debe registrarse
// dentro de un bloque `respetaMovimiento.add(...)` para heredar el
// respeto a prefers-reduced-motion desde el primer commit de animación.
export const respetaMovimiento = gsap.matchMedia();

export { gsap, ScrollTrigger, ScrollSmoother, SplitText };
