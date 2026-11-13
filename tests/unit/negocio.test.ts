import { describe, expect, it } from 'vitest';
import { formatearTelefono } from '@/lib/negocio';

describe('formatearTelefono', () => {
  it('agrupa un móvil colombiano en formato E.164 como +57 XXX XXX XXXX', () => {
    expect(formatearTelefono('+573124874581')).toBe('+57 312 487 4581');
  });

  it('devuelve sin cambios cualquier formato que no reconoce', () => {
    expect(formatearTelefono('+34612345678')).toBe('+34612345678');
    expect(formatearTelefono('6011144')).toBe('6011144');
  });
});
