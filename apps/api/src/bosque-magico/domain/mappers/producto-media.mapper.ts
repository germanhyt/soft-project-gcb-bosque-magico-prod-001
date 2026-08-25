import { TipoMediaProducto } from '@prisma/client';

export type ProductoMediaResponse = {
  id: string;
  tipo: TipoMediaProducto;
  url: string;
  nombreOriginal: string | null;
  orden: number;
};

export function mapProductoMedios(
  medios:
    | Array<{
        id: string;
        tipo: TipoMediaProducto;
        url: string;
        nombreOriginal: string | null;
        orden: number;
      }>
    | undefined,
  imagenUrlLegacy?: string | null,
): ProductoMediaResponse[] {
  const rows = medios ?? [];
  if (rows.length > 0) {
    return rows.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      url: m.url,
      nombreOriginal: m.nombreOriginal,
      orden: m.orden,
    }));
  }
  if (imagenUrlLegacy?.trim()) {
    return [
      {
        id: 'legacy',
        tipo: TipoMediaProducto.imagen,
        url: imagenUrlLegacy,
        nombreOriginal: null,
        orden: 0,
      },
    ];
  }
  return [];
}

export function imagenesDesdeMedios(medios: ProductoMediaResponse[]): string[] {
  return medios.filter((m) => m.tipo === 'imagen').map((m) => m.url);
}

export function videoDesdeMedios(
  medios: ProductoMediaResponse[],
): string | null {
  return medios.find((m) => m.tipo === 'video')?.url ?? null;
}
