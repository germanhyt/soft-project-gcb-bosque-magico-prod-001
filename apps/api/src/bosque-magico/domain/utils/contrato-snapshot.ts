import { fromDecimal } from './decimal';

type EventoConRelaciones = {
  id: string;
  fechaEvento: Date;
  turno: string;
  zona: string;
  cantidadNinos: number;
  tematica: string | null;
  montoTotal: unknown;
  cliente: {
    nombreCompleto: string;
    celular: string;
    correo: string | null;
    numeroDocumento: string | null;
    tipoDocumento: string | null;
  };
  cumpleanero: { nombre: string; edad: number | null };
  cotizacion: {
    id: string;
    codigo: string;
    paquete: string | null;
    tematica: string | null;
    montoBase: unknown;
    montoNinosExtra: unknown;
    montoItems: unknown;
    montoTotal: unknown;
    items: Array<{
      id: string;
      tipo: string;
      nombre: string;
      cantidad: number;
      precioUnitario: unknown;
      subtotal: unknown;
    }>;
  };
};

export function buildContratoSnapshot(evento: EventoConRelaciones) {
  const cot = evento.cotizacion;
  return {
    codigoCotizacion: cot.codigo,
    evento: {
      id: evento.id,
      fechaEvento: evento.fechaEvento.toISOString().slice(0, 10),
      turno: evento.turno,
      zona: evento.zona,
      cantidadNinos: evento.cantidadNinos,
      tematica: evento.tematica,
      montoTotal: fromDecimal(evento.montoTotal as never),
    },
    cliente: {
      nombreCompleto: evento.cliente.nombreCompleto,
      celular: evento.cliente.celular,
      correo: evento.cliente.correo,
      numeroDocumento: evento.cliente.numeroDocumento,
      tipoDocumento: evento.cliente.tipoDocumento,
    },
    cumpleanero: {
      nombre: evento.cumpleanero.nombre,
      edad: evento.cumpleanero.edad,
    },
    cotizacion: {
      id: cot.id,
      codigo: cot.codigo,
      paquete: cot.paquete,
      tematica: cot.tematica,
      montoBase: fromDecimal(cot.montoBase as never),
      montoNinosExtra: fromDecimal(cot.montoNinosExtra as never),
      montoItems: fromDecimal(cot.montoItems as never),
      montoTotal: fromDecimal(cot.montoTotal as never),
      items: cot.items.map((i) => ({
        id: i.id,
        tipo: i.tipo,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precioUnitario: fromDecimal(i.precioUnitario as never),
        subtotal: fromDecimal(i.subtotal as never),
      })),
    },
  };
}
