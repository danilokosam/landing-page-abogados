/**
 * Descompone una línea de trayectoria de la colección "socios" (formación o
 * experiencia) para mostrarla con jerarquía en la ficha del abogado:
 *
 *   'Abogado — UNISABANETA (2013 – 2017)'
 *     → { titulo: 'Abogado', entidad: 'UNISABANETA', periodo: '2013 – 2017' }
 *   'Abogada litigante (2017 – actualidad)'
 *     → { titulo: 'Abogada litigante', periodo: '2017 – actualidad' }
 *
 * El formato es el que documenta _ejemplo.md ('Título — Entidad (Año – Año)').
 * Si una línea no lo sigue, se devuelve entera como título: nunca se pierde texto.
 */
export interface ItemTrayectoria {
  titulo: string;
  entidad?: string;
  periodo?: string;
}

export function descomponerItemTrayectoria(linea: string): ItemTrayectoria {
  let resto = linea.trim();
  let periodo: string | undefined;

  const conPeriodo = /^(.*\S)\s*\(([^()]+)\)$/.exec(resto);
  if (conPeriodo) {
    resto = conPeriodo[1];
    periodo = conPeriodo[2].trim();
  }

  const separador = resto.indexOf(' — ');
  if (separador === -1) return { titulo: resto, periodo };

  return {
    titulo: resto.slice(0, separador).trim(),
    entidad: resto.slice(separador + 3).trim() || undefined,
    periodo,
  };
}
