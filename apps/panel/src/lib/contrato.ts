import type { Cotizacion, ItemCotizacion } from './cotizaciones';
import type { Evento } from './eventos';
import type { Contrato } from './contratos';

export type TipoComprobante = 'boleta' | 'factura';

export type ContratoFormDatos = {
  numeroDocumento: string;
  tipoComprobante: TipoComprobante;
  documentoTributario: string;
  horarioInicio: string;
  horarioFin: string;
  adelanto1Monto: number;
  adelanto1Fecha: string;
  adelanto2Monto: number;
  adelanto2Fecha: string;
  montoGarantia: number;
};

export type ContratoPrintPayload = {
  cotizacion: Cotizacion;
  evento?: Evento | null;
  form: ContratoFormDatos;
  fechaEmision: string;
};

export type ClienteContrato = {
  nombreCompleto: string;
  celular: string;
  correo?: string | null;
  numeroDocumento?: string | null;
  tipoDocumento?: string | null;
};

/** Cliente en respuesta completa de cotización (campos extra del API). */
export type CotizacionClienteExtendido = Cotizacion['cliente'] & {
  numeroDocumento?: string | null;
  tipoDocumento?: string | null;
};

export function buildContratoContext(payload: ContratoPrintPayload) {
  const { cotizacion: cot, evento, form } = payload;
  const cliente = cot.cliente as CotizacionClienteExtendido;

  return {
    codigoCotizacion: cot.codigo,
    fechaEvento: evento?.fechaEvento ?? cot.fechaEvento,
    turno: evento?.turno ?? cot.turno,
    zona: evento?.zona ?? 'Bosque Mágico',
    cantidadNinos: evento?.cantidadNinos ?? cot.cantidadNinos,
    tematica: evento?.tematica ?? cot.tematica ?? null,
    paquete: cot.paquete ?? null,
    montoBase: cot.montoBase,
    montoNinosExtra: cot.montoNinosExtra,
    montoItems: cot.montoItems,
    montoTotal: evento?.montoTotal ?? cot.montoTotal,
    cliente: {
      nombreCompleto: cliente.nombreCompleto,
      celular: cliente.celular,
      correo: cliente.correo,
      numeroDocumento: form.numeroDocumento.trim(),
    },
    cumpleanero: cot.cumpleanero,
    items: (cot.items ?? []) as ItemCotizacion[],
    form,
    fechaEmision: payload.fechaEmision,
  };
}

export function configNumero(items: { clave: string; valor: unknown }[], clave: string, def: number) {
  const item = items.find((i) => i.clave === clave);
  return typeof item?.valor === 'number' ? item.valor : def;
}

/** Convierte contrato persistido en payload para imprimir (usa snapshot congelado). */
export function contratoToPrintPayload(contrato: Contrato, evento?: Evento | null): ContratoPrintPayload {
  const snap = contrato.snapshotJson;
  const cotizacion: Cotizacion = {
    id: snap.cotizacion.id,
    codigo: snap.codigoCotizacion,
    fechaEvento: snap.evento.fechaEvento,
    turno: snap.evento.turno,
    cantidadNinos: snap.evento.cantidadNinos,
    tematica: snap.cotizacion.tematica,
    paquete: snap.cotizacion.paquete,
    montoBase: snap.cotizacion.montoBase,
    montoNinosExtra: snap.cotizacion.montoNinosExtra,
    montoItems: snap.cotizacion.montoItems,
    montoTotal: snap.cotizacion.montoTotal,
    etapa: 'aceptada',
    tokenPublico: '',
    linkPublico: '',
    cliente: {
      nombreCompleto: snap.cliente.nombreCompleto,
      celular: snap.cliente.celular,
      correo: snap.cliente.correo,
    } as Cotizacion['cliente'],
    cumpleanero: {
      nombre: snap.cumpleanero.nombre,
      edad: snap.cumpleanero.edad,
    },
    items: snap.cotizacion.items as ItemCotizacion[],
  };

  return {
    cotizacion,
    evento: evento ?? {
      id: snap.evento.id,
      cotizacionId: snap.cotizacion.id,
      fechaEvento: snap.evento.fechaEvento,
      turno: snap.evento.turno,
      zona: snap.evento.zona,
      tematica: snap.evento.tematica,
      cantidadNinos: snap.evento.cantidadNinos,
      montoTotal: snap.evento.montoTotal,
      etapa: 'por_confirmar',
      notas: null,
      confirmadoEn: null,
      realizadoEn: null,
      canceladoEn: null,
      cliente: {
        nombreCompleto: snap.cliente.nombreCompleto,
        celular: snap.cliente.celular,
        correo: snap.cliente.correo,
      },
      cumpleanero: snap.cumpleanero,
    },
    form: {
      numeroDocumento: contrato.numeroDocumento,
      tipoComprobante: contrato.tipoComprobante,
      documentoTributario: contrato.documentoTributario,
      horarioInicio: contrato.horarioInicio,
      horarioFin: contrato.horarioFin,
      adelanto1Monto: contrato.adelanto1Monto,
      adelanto1Fecha: contrato.adelanto1Fecha ?? '',
      adelanto2Monto: contrato.adelanto2Monto ?? 0,
      adelanto2Fecha: contrato.adelanto2Fecha ?? '',
      montoGarantia: contrato.montoGarantia,
    },
    fechaEmision: contrato.fechaEmision,
  };
}
