import type { Solicitud, TurnoInteres } from './api';
import type { EtapaCotizacion } from './cotizaciones';

export type CotizacionResumen = {
  id: string;
  codigo: string;
  etapa: EtapaCotizacion;
};

/** Cotización más reciente vinculada a la solicitud (p. ej. borrador desde landing). */
export function cotizacionActivaDeSolicitud(solicitud: Solicitud): CotizacionResumen | null {
  const list = solicitud.cotizaciones;
  if (!list?.length) return null;
  return list[0];
}

export function puedeCrearCotizacionManual(solicitud: Solicitud): boolean {
  return solicitud.etapa !== 'cerrada' && !cotizacionActivaDeSolicitud(solicitud);
}

type PayloadOrigen = {
  dto?: {
    cliente?: { nombre?: string; celular?: string; correo?: string };
    preferencias?: {
      origen?: string;
      seleccion?: {
        paquete?: string;
        showIds?: string[];
        cateringIds?: string[];
        cateringCantidades?: Record<string, number>;
        extraIds?: string[];
        extraCantidades?: Record<string, number>;
        snackId?: string;
        cajitasCantidad?: number;
        piqueos?: Array<{ productoId: string; cantidad: number }>;
      };
      items?: Array<{ productoId?: string; nombre?: string; cantidad?: number }>;
    };
    cumpleanero?: { nombre?: string; edad?: number };
    evento?: {
      fechaTentativa?: string;
      turno?: TurnoInteres;
      tematica?: string;
      paquete?: string;
      cantidadNinos?: number;
    };
  };
};

export type ItemPreferenciaLanding = {
  nombre: string;
  cantidad: number;
  productoId?: string;
  /** Cantidad expresada en packs (piqueos Premium). */
  esPack?: boolean;
};

export type ResumenPreferenciasLanding = {
  paquete: string | null;
  tematica: string | null;
  cumpleanero: string | null;
  items: ItemPreferenciaLanding[];
};

function parsePayload(solicitud: Solicitud): PayloadOrigen['dto'] | null {
  const raw = solicitud.payloadOrigen as PayloadOrigen | null | undefined;
  return raw?.dto ?? null;
}

/** Resumen legible de lo que eligió el cliente en el cotizador landing. */
export function resumenPreferenciasLanding(solicitud: Solicitud): ResumenPreferenciasLanding | null {
  const dto = parsePayload(solicitud);
  if (!dto?.preferencias && !dto?.evento?.paquete) return null;

  const pref = dto.preferencias;
  const paquete = dto.evento?.paquete ?? pref?.seleccion?.paquete ?? null;
  const items: ItemPreferenciaLanding[] = [];

  for (const item of pref?.items ?? []) {
    if (item.nombre) {
      items.push({
        nombre: item.nombre,
        cantidad: item.cantidad ?? 1,
      });
    }
  }

  const sel = pref?.seleccion;
  if (sel?.cajitasCantidad != null && sel.cajitasCantidad > 0) {
    items.push({
      nombre: 'Cajitas Bosque Mágico',
      cantidad: sel.cajitasCantidad,
    });
  }
  for (const p of sel?.piqueos ?? []) {
    items.push({
      nombre: 'Piqueo Premium',
      cantidad: Math.max(p.cantidad, 1),
      productoId: p.productoId,
      esPack: true,
    });
  }
  for (const id of sel?.showIds ?? []) {
    items.push({ nombre: 'Show', cantidad: 1, productoId: id });
  }
  for (const id of sel?.extraIds ?? []) {
    items.push({ nombre: 'Extra', cantidad: 1, productoId: id });
  }
  if (sel?.snackId) {
    items.push({ nombre: 'Snack Premium', cantidad: 1, productoId: sel.snackId });
  }
  if (sel?.cateringIds) {
    for (const id of sel.cateringIds) {
      const qty = Math.max(sel.cateringCantidades?.[id] ?? 1, 1);
      items.push({ nombre: 'Catering adicional', cantidad: qty, productoId: id });
    }
  }

  const cumpleanero =
    dto.cumpleanero?.nombre != null
      ? `${dto.cumpleanero.nombre}${dto.cumpleanero.edad != null ? ` (${dto.cumpleanero.edad} años)` : ''}`
      : null;

  if (!paquete && items.length === 0 && !cumpleanero && !dto.evento?.tematica) {
    return null;
  }

  return {
    paquete,
    tematica: dto.evento?.tematica ?? null,
    cumpleanero,
    items,
  };
}

/** Solicitudes landing antiguas sin cotización pero con payload completo. */
export function puedeGenerarBorradorDesdePayload(solicitud: Solicitud): boolean {
  if (solicitud.etapa === 'cerrada' || cotizacionActivaDeSolicitud(solicitud)) {
    return false;
  }
  const dto = parsePayload(solicitud);
  if (!dto?.cliente?.nombre || !dto.cliente.celular) return false;
  const evento = dto.evento ?? {};
  const pseudoDto = {
    cliente: {
      nombre: dto.cliente.nombre ?? solicitud.nombreContacto,
      celular: dto.cliente.celular ?? solicitud.celular,
      correo: dto.cliente.correo ?? solicitud.correo ?? undefined,
    },
    cumpleanero: dto.cumpleanero,
    evento: {
      fechaTentativa:
        evento.fechaTentativa ??
        (solicitud.fechaTentativa ? solicitud.fechaTentativa.slice(0, 10) : undefined),
      turno: evento.turno ?? solicitud.turnoInteres ?? undefined,
      cantidadNinos: evento.cantidadNinos ?? solicitud.cantidadNinosEstimada ?? undefined,
      paquete: evento.paquete,
      tematica: evento.tematica,
    },
    preferencias: dto.preferencias,
    observaciones: undefined,
  };
  return puedeCrearCotizacionBorradorDesdeLandingPseudo(pseudoDto);
}

function puedeCrearCotizacionBorradorDesdeLandingPseudo(dto: {
  cliente: { nombre: string; celular: string };
  evento?: {
    fechaTentativa?: string;
    paquete?: string;
    cantidadNinos?: number;
  };
}): boolean {
  const paquete = dto.evento?.paquete?.trim();
  const ninos = dto.evento?.cantidadNinos;
  const fecha = dto.evento?.fechaTentativa?.trim();
  return Boolean(
    dto.cliente.nombre.trim() &&
      dto.cliente.celular.trim() &&
      paquete &&
      ninos != null &&
      ninos >= 1 &&
      fecha,
  );
}

/** IDs de productos guardados en payload de landing (fallback al crear cotización manual). */
export function productoIdsDesdePayloadLanding(solicitud: Solicitud): string[] {
  const pref = parsePayload(solicitud)?.preferencias;
  if (!pref) return [];

  const ids = new Set<string>();
  for (const item of pref.items ?? []) {
    if (item.productoId) ids.add(item.productoId);
  }
  const sel = pref.seleccion;
  if (sel) {
    for (const id of sel.showIds ?? []) ids.add(id);
    for (const id of sel.extraIds ?? []) ids.add(id);
    for (const id of sel.cateringIds ?? []) ids.add(id);
    if (sel.snackId) ids.add(sel.snackId);
    for (const p of sel.piqueos ?? []) ids.add(p.productoId);
  }
  return [...ids];
}

/** Cantidades por producto guardadas en el cotizador landing. */
export function cantidadesDesdePayloadLanding(solicitud: Solicitud): Record<string, number> {
  const pref = parsePayload(solicitud)?.preferencias;
  if (!pref) return {};

  const out: Record<string, number> = {};
  for (const item of pref.items ?? []) {
    if (item.productoId) {
      out[item.productoId] = Math.max(item.cantidad ?? 1, 1);
    }
  }
  const sel = pref.seleccion;
  if (sel?.cateringCantidades) {
    for (const [id, qty] of Object.entries(sel.cateringCantidades)) {
      out[id] = Math.max(qty, 1);
    }
  }
  if (sel?.piqueos) {
    for (const p of sel.piqueos) {
      out[p.productoId] = Math.max(p.cantidad, 1);
    }
  }
  if (sel?.extraCantidades) {
    for (const [id, qty] of Object.entries(sel.extraCantidades)) {
      out[id] = Math.max(qty, 1);
    }
  }
  return out;
}

export function esSolicitudDesdeLanding(solicitud: Solicitud): boolean {
  return solicitud.canal === 'landing' || parsePayload(solicitud)?.preferencias?.origen === 'landing_cotizador';
}

export function esPosibleDuplicadoLanding(solicitud: Solicitud): boolean {
  const raw = solicitud.payloadOrigen as { posibleDuplicado?: boolean } | null | undefined;
  return raw?.posibleDuplicado === true;
}

export function datosLandingDesdePayload(solicitud: Solicitud) {
  const dto = parsePayload(solicitud);
  return {
    cumpleaneroNombre: dto?.cumpleanero?.nombre ?? '',
    cumpleaneroEdad: dto?.cumpleanero?.edad != null ? String(dto.cumpleanero.edad) : '',
    tematica: dto?.evento?.tematica ?? '',
    paquete: dto?.evento?.paquete ?? '',
    seleccion: dto?.preferencias?.seleccion,
    productoIds: productoIdsDesdePayloadLanding(solicitud),
    cantidades: cantidadesDesdePayloadLanding(solicitud),
  };
}
