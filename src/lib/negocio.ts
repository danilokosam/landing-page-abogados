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

// CONTENIDO FICTICIO PARA DESARROLLO (Fase 2) — despacho, dirección y
// contactos son inventados pero verosímiles para el sector legal español.
// TODO(fase 0): reemplazar con los datos reales provistos por los socios.
export const negocio: DatosNegocio = {
	nombreDespacho: 'Duarte & Iglesias Abogados',
	descripcionCorta:
		'Despacho de abogados en Madrid especializado en derecho civil, de familia, laboral y mercantil, con más de 20 años de experiencia combinada al servicio de particulares y empresas.',
	telefonoWhatsapp: '+34612345678',
	email: 'info@duarteiglesiasabogados.es',
	direccion: {
		calle: 'Calle de Alcalá, 123, 3º Izquierda',
		ciudad: 'Madrid',
		region: 'Comunidad de Madrid',
		codigoPostal: '28009',
		pais: 'ES',
	},
	areaCobertura: ['Madrid capital', 'Comunidad de Madrid'],
	horario: [{ dias: 'Lunes a Viernes', horas: '9:00 - 19:00' }],
	redesSociales: [],
	rangoHonorarios: '€€',
};
