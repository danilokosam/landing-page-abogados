/**
 * Construcción determinista de enlaces wa.me con mensaje precargado.
 * Ver Propuesta de arquitectura, sección 04 — el enlace se resuelve en
 * build time a partir del número en negocio.ts y el mensaje definido
 * por cada entrada de la colección "servicios".
 */

import { negocio } from './negocio';

export function construirEnlaceWhatsApp(
  mensaje: string,
  numero: string = negocio.telefonoWhatsapp,
): string {
  const numeroLimpio = numero.replace(/[^\d]/g, '');
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
}

/**
 * Mensaje precargado del botón flotante de WhatsApp (BotonesFlotantes.astro).
 * Es el canal genérico, visible en toda la página: por eso no nombra un
 * área concreta (para eso están los mensajes de cada servicio). El número
 * destino sale de `negocio.telefonoWhatsapp` en src/lib/negocio.ts.
 */
export const mensajeWhatsappFlotante = `Hola, ${negocio.nombreDespacho}. Me gustaría agendar una consulta para exponerles mi caso. ¿Podrían indicarme su disponibilidad? Muchas gracias.`;
