import { TurnoInteres } from '@prisma/client';
import { CrearSolicitudPublicaDto } from '../../application/dto/crear-solicitud-publica.dto';
import { CrearCotizacionDto } from '../../application/dto/crear-cotizacion.dto';
import type { SeleccionPaqueteDto } from '../../application/dto/seleccion-paquete.dto';

type PreferenciasLanding = {
  origen?: string;
  items?: Array<{ productoId?: string; cantidad?: number }>;
  seleccion?: {
    paquete?: string;
    showIds?: string[];
    showCantidades?: Record<string, number>;
    cateringIds?: string[];
    cateringCantidades?: Record<string, number>;
    extraIds?: string[];
    extraCantidades?: Record<string, number>;
    snackId?: string;
    snackCantidad?: number;
    cajitasCantidad?: number;
    cajitasClasica?: number;
    cajitasSaludable?: number;
    piqueos?: Array<{ productoId: string; cantidad: number }>;
    piqueosCantidades?: Record<string, number>;
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

function extraerSeleccion(
  preferencias?: Record<string, unknown>,
): SeleccionPaqueteDto | undefined {
  if (!preferencias || typeof preferencias !== 'object') return undefined;
  const pref = preferencias as PreferenciasLanding;
  const sel = pref.seleccion;
  if (!sel) return undefined;

  const piqueosDesdeIds = (sel.cateringIds ?? [])
    .filter((id) => sel.piqueos?.some((p) => p.productoId === id))
    .map((id) => ({
      productoId: id,
      cantidad: Math.max(sel.cateringCantidades?.[id] ?? 1, 1),
    }));

  return {
    showIds: sel.showIds,
    extraIds: sel.extraIds,
    snackId: sel.snackId,
    snackCantidad: sel.snackCantidad,
    cajitasCantidad: sel.cajitasCantidad,
    cajitasClasica: sel.cajitasClasica,
    cajitasSaludable: sel.cajitasSaludable,
    piqueos:
      sel.piqueos ??
      (piqueosDesdeIds.length ? piqueosDesdeIds : undefined),
  };
}

export function mapearSolicitudLandingACotizacion(
  solicitudId: string,
  dto: CrearSolicitudPublicaDto,
): CrearCotizacionDto {
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
    turno: dto.evento?.turno ?? TurnoInteres.turno_1,
    cantidadNinos: dto.evento!.cantidadNinos!,
    tematica: dto.evento?.tematica,
    paquete: dto.evento!.paquete!.trim(),
    seleccion: extraerSeleccion(dto.preferencias),
    notas: notasPartes.join('\n'),
  };
}
