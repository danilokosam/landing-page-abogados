import { describe, expect, it } from 'vitest';
import { construirEnlaceWhatsApp } from '@/lib/whatsapp';
import { negocio } from '@/lib/negocio';

describe('construirEnlaceWhatsApp', () => {
  it('usa el número de negocio.ts por defecto, limpiando el prefijo "+"', () => {
    const enlace = construirEnlaceWhatsApp('Hola');
    const numeroLimpio = negocio.telefonoWhatsapp.replace(/[^\d]/g, '');
    expect(enlace).toBe(`https://wa.me/${numeroLimpio}?text=Hola`);
  });

  it('codifica el mensaje para uso seguro en una URL', () => {
    const enlace = construirEnlaceWhatsApp('Hola, ¿cómo están? ¡Gracias!');
    const url = new URL(enlace);
    expect(url.searchParams.get('text')).toBe('Hola, ¿cómo están? ¡Gracias!');
  });

  it('elimina cualquier carácter no numérico del número proporcionado', () => {
    const enlace = construirEnlaceWhatsApp('Hola', '+34 (612) 345-678');
    expect(enlace).toBe('https://wa.me/34612345678?text=Hola');
  });

  it('produce una URL con el host wa.me', () => {
    const enlace = construirEnlaceWhatsApp('Hola');
    const url = new URL(enlace);
    expect(url.hostname).toBe('wa.me');
  });
});
