/** Catering adicional por porción (mínimo 18 uds/evento). Precio único L–V y fin de semana. */
export type CateringGeneralSeed = {
  codigo: string;
  nombre: string;
  precio: number;
  cantidadMinima?: number;
  unidad?: string;
};

export const CATERING_GENERAL: CateringGeneralSeed[] = [
  {
    codigo: 'CAT-POPCORN-CAT',
    nombre: 'Popcorn (catering)',
    precio: 10,
    cantidadMinima: 18,
    unidad: 'porción',
  },
  {
    codigo: 'CAT-ALGODON-CAT',
    nombre: 'Algodón de azúcar (catering)',
    precio: 10,
    cantidadMinima: 18,
    unidad: 'porción',
  },
  {
    codigo: 'CAT-MANZANAS',
    nombre: 'Manzanas acarameladas',
    precio: 10,
    cantidadMinima: 18,
    unidad: 'porción',
  },
  {
    codigo: 'CAT-MAZAMORRA',
    nombre: 'Mazamorra morada',
    precio: 6,
    cantidadMinima: 18,
    unidad: 'porción',
  },
  {
    codigo: 'CAT-GELATINA',
    nombre: 'Gelatina',
    precio: 5,
    cantidadMinima: 18,
    unidad: 'porción',
  },
  {
    codigo: 'CAT-ARROZ',
    nombre: 'Arroz con leche',
    precio: 6,
    cantidadMinima: 18,
    unidad: 'porción',
  },
];
