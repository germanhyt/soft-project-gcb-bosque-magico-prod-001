import type { Pedido } from './pedidos';
import { TURNO_LABEL } from '../constants/solicitudes';

export type PedidoProveedorEventoResumen = {
  id: string;
  clienteNombre: string;
  fechaEvento: string;
  turnoLabel: string;
};

export function buildPedidoProveedorEventoResumen(
  pedido: Pedido & {
    evento?: {
      id: string;
      fechaEvento: string;
      turno: string;
      cliente?: { nombreCompleto: string };
    };
  },
  fallback?: {
    eventoId: string;
    clienteNombre: string;
    fechaEvento: string;
    turnoLabel?: string;
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
  };
}
