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
		calle: string;
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

// TODO(fase 0): reemplazar con los datos reales provistos por los socios.
export const negocio: DatosNegocio = {
	nombreDespacho: 'Nombre del Despacho',
	descripcionCorta: 'Descripción breve pendiente de definir con el cliente.',
	telefonoWhatsapp: '+00000000000',
	email: 'contacto@example.com',
	direccion: {
		calle: 'Pendiente',
		ciudad: 'Pendiente',
		region: 'Pendiente',
		codigoPostal: '00000',
		pais: 'MX',
	},
	areaCobertura: [],
	horario: [{ dias: 'Lunes a Viernes', horas: '9:00 - 18:00' }],
	redesSociales: [],
	rangoHonorarios: '$$',
};
