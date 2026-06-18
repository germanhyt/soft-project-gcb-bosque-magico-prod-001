import type { Cotizacion, ItemCotizacion } from './cotizaciones';
import type { Evento } from './eventos';
import type { Contrato } from './contratos';
import {
  contratoToPrintPayload as sharedContratoToPrintPayload,
  type ContratoFormDatos,
  type ContratoPrintPayload,
  type TipoComprobante,
} from '@bosque/shared';

export type { TipoComprobante, ContratoFormDatos, ContratoPrintPayload };

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
  return sharedContratoToPrintPayload(contrato, evento ?? undefined);
}
