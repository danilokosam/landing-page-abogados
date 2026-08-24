/**
 * Punto único de registro de GSAP y sus plugins.
 * Ver Propuesta de arquitectura, sección 03 — se importa una sola vez
 * desde BaseLayout.astro. No registrar plugins por componente.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Instancia de matchMedia compartida: toda animación debe registrarse
// dentro de un bloque `respetaMovimiento.add(...)` para heredar el
// respeto a prefers-reduced-motion desde el primer commit de animación.
export const respetaMovimiento = gsap.matchMedia();

export { gsap, ScrollTrigger };
