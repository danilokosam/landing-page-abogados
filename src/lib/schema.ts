/**
 * Generadores de JSON-LD (Schema.org).
 * Ver Propuesta de arquitectura, sección 04 — LegalService como tipo
 * principal, con socios anidados como Person. Se alimenta de la misma
 * fuente de verdad que el HTML visible (negocio.ts + colección "socios")
 * para que el structured data nunca diga algo distinto a la página.
 */

import { negocio } from './negocio';
import type { CollectionEntry } from 'astro:content';

export function generarLegalServiceSchema(socios: CollectionEntry<'socios'>[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'LegalService',
		name: negocio.nombreDespacho,
		description: negocio.descripcionCorta,
		telephone: negocio.telefonoWhatsapp,
		email: negocio.email,
		priceRange: negocio.rangoHonorarios,
		address: {
			'@type': 'PostalAddress',
			streetAddress: negocio.direccion.calle,
			addressLocality: negocio.direccion.ciudad,
			addressRegion: negocio.direccion.region,
			postalCode: negocio.direccion.codigoPostal,
			addressCountry: negocio.direccion.pais,
		},
		areaServed: negocio.areaCobertura,
		openingHoursSpecification: negocio.horario.map((h) => ({
			'@type': 'OpeningHoursSpecification',
			dayOfWeek: h.dias,
			opens: h.horas.split('-')[0]?.trim(),
			closes: h.horas.split('-')[1]?.trim(),
		})),
		sameAs: negocio.redesSociales,
		employee: socios.map((socio) => generarPersonSchema(socio)),
	};
}

export function generarPersonSchema(socio: CollectionEntry<'socios'>) {
	return {
		'@type': 'Person',
		name: socio.data.nombre,
		jobTitle: socio.data.cargo,
		knowsAbout: socio.data.especialidades,
	};
}
