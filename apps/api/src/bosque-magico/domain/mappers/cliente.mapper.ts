import { fromDecimal } from '../utils/decimal';
import type { ResumenIdentidad } from '../services/identidad-contacto.service';

type ClienteListRow = {
  id: string;
  nombreCompleto: string;
  celular: string;
  correo: string | null;
  distrito: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  _count: { cotizaciones: number; eventos: number; cumpleaneros: number };
};

export function mapClienteListItem(
  cliente: ClienteListRow,
  identidad: ResumenIdentidad,
) {
  return {
    id: cliente.id,
    nombreCompleto: cliente.nombreCompleto,
    celular: cliente.celular,
    correo: cliente.correo,
    distrito: cliente.distrito,
    creadoEn: cliente.creadoEn,
    actualizadoEn: cliente.actualizadoEn,
    totalSolicitudes: identidad.totalSolicitudes,
    solicitudesRecientes24h: identidad.solicitudesRecientes24h,
    totalCotizaciones: cliente._count.cotizaciones,
    totalEventos: cliente._count.eventos,
    totalCumpleaneros: cliente._count.cumpleaneros,
  };
}

export function mapClienteDetalle(
  cliente: NonNullable<
    Awaited<
      ReturnType<
        import('../../infrastructure/repositories/clientes.repository').ClientesRepository['obtenerPorId']
      >
    >
  >,
  identidad: ResumenIdentidad,
  solicitudes: Array<{
    id: string;
    nombreContacto: string;
    canal: string;
    etapa: string;
    fechaTentativa: Date | null;
    creadoEn: Date;
  }>,
) {
  return {
    id: cliente.id,
    nombreCompleto: cliente.nombreCompleto,
    tipoDocumento: cliente.tipoDocumento,
    numeroDocumento: cliente.numeroDocumento,
    celular: cliente.celular,
    correo: cliente.correo,
    direccion: cliente.direccion,
    distrito: cliente.distrito,
    notas: cliente.notas,
    creadoEn: cliente.creadoEn,
    actualizadoEn: cliente.actualizadoEn,
    identidad: {
      celularNormalizado: identidad.celularNormalizado,
      correoNormalizado: identidad.correoNormalizado,
      solicitudesRecientes24h: identidad.solicitudesRecientes24h,
    },
    estadisticas: {
      totalSolicitudes: identidad.totalSolicitudes,
      primeraSolicitudEn: identidad.primeraSolicitudEn,
      ultimaSolicitudEn: identidad.ultimaSolicitudEn,
      totalCotizaciones: cliente.cotizaciones.length,
      totalEventos: cliente.eventos.length,
      totalCumpleaneros: cliente.cumpleaneros.length,
    },
    solicitudes,
    cotizaciones: cliente.cotizaciones.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      etapa: c.etapa,
      montoTotal: fromDecimal(c.montoTotal),
      fechaEvento: c.fechaEvento,
      creadoEn: c.creadoEn,
    })),
    cumpleaneros: cliente.cumpleaneros,
    eventos: cliente.eventos.map((e) => ({
      id: e.id,
      fechaEvento: e.fechaEvento,
      turno: e.turno,
      etapa: e.etapa,
      montoTotal: fromDecimal(e.montoTotal),
    })),
  };
}
