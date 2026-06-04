import { TurnoInteres, TipoItemCotizacion } from '@prisma/client';
import { CrearSolicitudPublicaDto } from '../../application/dto/crear-solicitud-publica.dto';
import { CrearCotizacionDto } from '../../application/dto/crear-cotizacion.dto';
import { ItemCotizacionDto } from '../../application/dto/item-cotizacion.dto';

type PreferenciasLanding = {
  origen?: string;
  items?: Array<{ productoId?: string; cantidad?: number }>;
  seleccion?: {
    showIds?: string[];
    cateringIds?: string[];
    cateringCantidades?: Record<string, number>;
    extraIds?: string[];
    extraCantidades?: Record<string, number>;
  };
};

/** Datos mínimos del cotizador landing para generar borrador en panel. */
export function puedeCrearCotizacionBorradorDesdeLanding(
  dto: CrearSolicitudPublicaDto,
): boolean {
  const paquete = dto.evento?.paquete?.trim();
  const ninos = dto.evento?.cantidadNinos;
  const fecha = dto.evento?.fechaTentativa?.trim();
  return Boolean(
    dto.cliente?.nombre?.trim() &&
    dto.cliente?.celular?.trim() &&
    paquete &&
    ninos != null &&
    ninos >= 1 &&
    fecha,
  );
}

function extraerItemsDesdePreferencias(
  preferencias?: Record<string, unknown>,
): Array<{ productoId: string; cantidad: number }> {
  if (!preferencias || typeof preferencias !== 'object') return [];
  const pref = preferencias as PreferenciasLanding;

  const desdeLista = (pref.items ?? [])
    .filter((i): i is { productoId: string; cantidad: number } =>
      Boolean(i?.productoId && i.cantidad != null && i.cantidad >= 1),
    )
    .map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));

  if (desdeLista.length) return desdeLista;

  const sel = pref.seleccion;
  if (!sel) return [];

  const out: Array<{ productoId: string; cantidad: number }> = [];
  for (const id of sel.showIds ?? []) {
    out.push({ productoId: id, cantidad: 1 });
  }
  for (const id of sel.cateringIds ?? []) {
    out.push({
      productoId: id,
      cantidad: Math.max(sel.cateringCantidades?.[id] ?? 1, 1),
    });
  }
  for (const id of sel.extraIds ?? []) {
    out.push({
      productoId: id,
      cantidad: Math.max(sel.extraCantidades?.[id] ?? 1, 1),
    });
  }
  return out;
}

function aItemCotizacionDto(
  productoId: string,
  cantidad: number,
): ItemCotizacionDto {
  return {
    productoId,
    tipo: TipoItemCotizacion.extra,
    nombre: 'Item',
    cantidad,
    precioUnitario: 0,
  };
}

export function mapearSolicitudLandingACotizacion(
  solicitudId: string,
  dto: CrearSolicitudPublicaDto,
): CrearCotizacionDto {
  const itemsRaw = extraerItemsDesdePreferencias(dto.preferencias);
  const items = itemsRaw.map((i) =>
    aItemCotizacionDto(i.productoId, i.cantidad),
  );

  const notasPartes: string[] = [];
  if (dto.observaciones) notasPartes.push(dto.observaciones);
  notasPartes.push(
    'Borrador generado automáticamente desde cotizador landing.',
  );

  return {
    solicitudId,
    cliente: {
      nombreCompleto: dto.cliente.nombre.trim(),
      celular: dto.cliente.celular.trim(),
      correo: dto.cliente.correo,
    },
    cumpleanero: {
      nombre: dto.cumpleanero?.nombre?.trim() || 'Por confirmar',
      edad: dto.cumpleanero?.edad,
      tematicaFavorita: dto.evento?.tematica,
    },
    fechaEvento: dto.evento!.fechaTentativa!,
    turno: dto.evento?.turno ?? 'turno_1',
    cantidadNinos: dto.evento!.cantidadNinos!,
    tematica: dto.evento?.tematica,
    paquete: dto.evento?.paquete,
    notas: notasPartes.join('\n'),
    items: items.length ? items : undefined,
  };
}
