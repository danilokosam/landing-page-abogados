/**
 * Fuente única de verdad para los datos del despacho.
 * Se reutiliza en Footer, Header y el generador de JSON-LD (schema.ts)
 * para evitar que la misma dirección/teléfono queden desincronizados
 * entre el HTML visible y el structured data.
 */

export interface HorarioAtencion {
  dias: string; // ej. "Lunes a Viernes"
  horas: string; // ej. "9:00 - 18:00"
}

export interface DatosNegocio {
  nombreDespacho: string;
  descripcionCorta: string;
  telefonoWhatsapp: string; // formato E.164, ej. "+521234567890"
  email: string;
  direccion: {
    calle?: string; // opcional — si se omite, solo se publica ciudad/región
    ciudad: string;
    region: string;
    codigoPostal: string;
    pais: string; // código ISO 3166-1 alpha-2, ej. "MX"
  };
  areaCobertura: string[]; // ciudades/regiones donde el despacho atiende
  horario: HorarioAtencion[];
  redesSociales: string[]; // URLs completas, para sameAs en JSON-LD
  rangoHonorarios: string; // ej. "$$" — usado en priceRange de LegalService
}

// Datos reales del despacho (13 nov 2026), tomados de las hojas de vida
// de los dos abogados. Deliberadamente NO se publica la dirección de
// domicilio (solo ciudad, región y código postal) ni el horario de
// atención (no se ha facilitado) — ver PROJECT_STATE.md.
// PENDIENTE DE CONFIRMAR con el cliente: el nombre comercial del despacho.
export const negocio: DatosNegocio = {
  nombreDespacho: 'Duarte & Muñoz Abogados',
  descripcionCorta:
    'Despacho de abogados en Itagüí especializado en derecho penal y administrativo, con experiencia en litigio, docencia en Derecho Penal y más de dos décadas dentro del sistema penitenciario.',
  telefonoWhatsapp: '+573124874581',
  email: 'naty11_02@hotmail.com',
  direccion: {
    ciudad: 'Itagüí',
    region: 'Antioquia',
    codigoPostal: '055413',
    pais: 'CO',
  },
  areaCobertura: ['Itagüí', 'Antioquia'],
  horario: [],
  redesSociales: [],
  rangoHonorarios: '$$',
};

/**
 * Formato legible de un número E.164 colombiano para mostrarlo en pantalla
 * ("+573124874581" → "+57 312 487 4581"). Los enlaces (tel:, wa.me)
 * siguen usando el valor E.164 sin espacios. Cualquier otro formato se
 * devuelve tal cual.
 */
export function formatearTelefono(e164: string): string {
  const m = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : e164;
}
