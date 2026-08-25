import { fromDecimal } from '../utils/decimal';
import {
  imagenesDesdeMedios,
  mapProductoMedios,
  videoDesdeMedios,
} from './producto-media.mapper';

export function mapProductoResponse<T extends Record<string, unknown>>(
  producto: T,
) {
  const mediosRaw = producto.medios as
    | Array<{
        id: string;
        tipo: 'imagen' | 'video';
        url: string;
        nombreOriginal: string | null;
        orden: number;
      }>
    | undefined;
  const medios = mapProductoMedios(
    mediosRaw,
    producto.imagenUrl as string | null,
  );
  return {
    ...producto,
    medios,
    imagenes: imagenesDesdeMedios(medios),
    videoUrl: videoDesdeMedios(medios),
    precioLunesViernes: fromDecimal(producto.precioLunesViernes as never),
    precioFinSemana: fromDecimal(producto.precioFinSemana as never),
    costoInterno:
      producto.costoInterno != null
        ? fromDecimal(producto.costoInterno as never)
        : null,
  };
}
