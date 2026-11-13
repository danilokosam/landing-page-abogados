/**
 * Generadores de JSON-LD (Schema.org).
 * Un único @graph con nodos enlazados por @id (WebSite → WebPage →
 * LegalService → Person/Service), el formato que Google recomienda para
 * que entienda la página como una entidad coherente. Se alimenta de la
 * misma fuente de verdad que el HTML visible (negocio.ts, seo.ts y las
 * colecciones "socios"/"servicios") para que el structured data nunca diga
 * algo distinto a la página.
 *
 * Los campos sin dato real se OMITEN (no se envían vacíos): dirección de
 * calle, horario y redes sociales.
 */

import type { CollectionEntry } from 'astro:content';
import { negocio } from './negocio';
import { seo } from './seo';

type Socio = CollectionEntry<'socios'>;
type Servicio = CollectionEntry<'servicios'>;

function ids(urlSitio: string) {
  return {
    website: `${urlSitio}#website`,
    webpage: `${urlSitio}#webpage`,
    despacho: `${urlSitio}#despacho`,
    imagen: `${urlSitio}#imagen-principal`,
  };
}

export function generarPersonSchema(socio: Socio, idDespacho?: string) {
  return {
    '@type': 'Person',
    name: socio.data.nombre,
    jobTitle: socio.data.cargo,
    knowsAbout: socio.data.especialidades,
    ...(idDespacho && { worksFor: { '@id': idDespacho } }),
  };
}

export function generarLegalServiceSchema(
  socios: Socio[],
  servicios: Servicio[] = [],
  urlSitio?: string,
) {
  const id = urlSitio ? ids(urlSitio) : undefined;
  const { direccion } = negocio;

  return {
    '@type': 'LegalService',
    ...(id && { '@id': id.despacho, url: urlSitio, image: { '@id': id.imagen } }),
    name: negocio.nombreDespacho,
    description: negocio.descripcionCorta,
    telephone: negocio.telefonoWhatsapp,
    email: negocio.email,
    priceRange: negocio.rangoHonorarios,
    address: {
      '@type': 'PostalAddress',
      ...(direccion.calle && { streetAddress: direccion.calle }),
      addressLocality: direccion.ciudad,
      addressRegion: direccion.region,
      postalCode: direccion.codigoPostal,
      addressCountry: direccion.pais,
    },
    areaServed: negocio.areaCobertura.map((zona) => ({
      '@type': 'AdministrativeArea',
      name: zona,
    })),
    knowsAbout: servicios.map((s) => s.data.titulo),
    ...(negocio.horario.length > 0 && {
      openingHoursSpecification: negocio.horario.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dias,
        opens: h.horas.split('-')[0]?.trim(),
        closes: h.horas.split('-')[1]?.trim(),
      })),
    }),
    ...(negocio.redesSociales.length > 0 && { sameAs: negocio.redesSociales }),
    ...(servicios.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Áreas de práctica',
        itemListElement: servicios.map((s) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: s.data.titulo,
            description: s.data.resumen,
          },
        })),
      },
    }),
    employee: socios.map((socio) => generarPersonSchema(socio, id?.despacho)),
  };
}

/** Grafo completo de la página de inicio, listo para JSON.stringify. */
export function generarGrafoSchema(opciones: {
  urlSitio: string;
  urlImagen: string;
  socios: Socio[];
  servicios: Servicio[];
}) {
  const { urlSitio, urlImagen, socios, servicios } = opciones;
  const id = ids(urlSitio);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': id.website,
        url: urlSitio,
        name: negocio.nombreDespacho,
        inLanguage: seo.idioma,
        publisher: { '@id': id.despacho },
      },
      {
        '@type': 'WebPage',
        '@id': id.webpage,
        url: urlSitio,
        name: seo.titulo,
        description: seo.descripcion,
        inLanguage: seo.idioma,
        isPartOf: { '@id': id.website },
        about: { '@id': id.despacho },
        primaryImageOfPage: { '@id': id.imagen },
      },
      {
        '@type': 'ImageObject',
        '@id': id.imagen,
        url: urlImagen,
        width: seo.og.imagenAncho,
        height: seo.og.imagenAlto,
        caption: seo.og.imagenAlt,
      },
      generarLegalServiceSchema(socios, servicios, urlSitio),
    ],
  };
}

/**
 * Serializa JSON-LD para incrustarlo en <script type="application/ld+json">
 * de forma segura: escapa "<" para que ningún texto de contenido pueda
 * cerrar la etiqueta </script> antes de tiempo.
 */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c');
}
