import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

// Fuente de verdad de las áreas de práctica ofrecidas por el despacho.
// Cada entrada alimenta tanto la tarjeta de servicio como el mensaje
// precargado del CTA de WhatsApp asociado (ver src/lib/whatsapp.ts).
// El glob excluye archivos "_*" (plantillas de referencia, ver
// src/content/servicios/_ejemplo.md).
const servicios = defineCollection({
  loader: glob({ pattern: '[^_]*.md', base: './src/content/servicios' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      resumen: z.string(),
      icono: z.string(), // nombre del icono Lucide, ej. "scale"
      rangoHonorarios: z.string().optional(), // texto libre; si se omite, la tarjeta no muestra honorarios
      mensajeWhatsapp: z.string(), // mensaje precargado específico del servicio
      orden: z.number().int().default(0),
      destacado: z.boolean().default(false),
      imagen: image().optional(),
    }),
});

// Perfiles profesionales de los socios del despacho.
const socios = defineCollection({
  loader: glob({ pattern: '[^_]*.md', base: './src/content/socios' }),
  schema: () =>
    z.object({
      nombre: z.string(),
      cargo: z.string(), // ej. "Socio fundador"
      // Ruta absoluta a una foto servida desde public/, ej. "/abogada-duarte.jpeg".
      // Se muestra recortada en círculo y anclada arriba (ver SobreNosotros.astro).
      foto: z.string().regex(/^\/[^/]/, 'La foto debe ser una ruta de public/, ej. "/foto.jpeg"'),
      formacion: z.array(z.string()), // títulos, universidades
      especialidades: z.array(z.string()), // áreas de práctica que domina
      experiencia: z.array(z.string()).default([]), // cargos relevantes, del más reciente al más antiguo
      acreditaciones: z.array(z.string()).default([]), // colegiaturas, certificaciones
      numeroWhatsapp: z.string().optional(), // si atiende un canal propio; si no, usa el de negocio.ts
      orden: z.number().int().default(0),
    }),
});

export const collections = { servicios, socios };
