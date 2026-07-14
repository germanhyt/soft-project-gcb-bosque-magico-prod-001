import type { Pedido } from './pedidos';
import { TURNO_LABEL } from '../constants/solicitudes';

export type PedidoProveedorEventoResumen = {
  id: string;
  clienteNombre: string;
  fechaEvento: string;
  turnoLabel: string;
  cumpleaneroEdad?: number | null;
  cantidadNinos?: number;
  tematica?: string | null;
};

export function buildPedidoProveedorEventoResumen(
  pedido: Pedido & {
    evento?: {
      id: string;
      fechaEvento: string;
      turno: string;
      cantidadNinos?: number;
      tematica?: string | null;
      cumpleanero?: { edad?: number | null };
      cliente?: { nombreCompleto: string };
    };
  },
  fallback?: {
    eventoId: string;
    clienteNombre: string;
    fechaEvento: string;
    turnoLabel?: string;
    cumpleaneroEdad?: number | null;
    cantidadNinos?: number;
    tematica?: string | null;
  },
): PedidoProveedorEventoResumen {
  const evento = pedido.evento;
  const turno = evento?.turno ?? '';
  return {
    id: evento?.id ?? fallback?.eventoId ?? pedido.eventoId,
    clienteNombre:
      evento?.cliente?.nombreCompleto ?? fallback?.clienteNombre ?? 'Cliente',
    fechaEvento: evento?.fechaEvento ?? fallback?.fechaEvento ?? '',
    turnoLabel:
      fallback?.turnoLabel ??
      (turno ? (TURNO_LABEL[turno] ?? turno) : ''),
    cumpleaneroEdad: evento?.cumpleanero?.edad ?? fallback?.cumpleaneroEdad,
    cantidadNinos: evento?.cantidadNinos ?? fallback?.cantidadNinos,
    tematica: evento?.tematica ?? fallback?.tematica,
  };
}
