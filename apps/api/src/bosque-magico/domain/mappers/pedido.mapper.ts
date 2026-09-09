import { EtapaPedido } from '@prisma/client';
import { costoReferencialPedido } from '../utils/costo-referencial-pedido';
import { fromDecimal } from '../utils/decimal';

const ETAPAS_RESPONDER: EtapaPedido[] = [
  EtapaPedido.pendiente,
  EtapaPedido.solicitado,
];

export function mapProveedorResponse<T extends Record<string, unknown>>(
  proveedor: T,
) {
  return { ...proveedor };
}

export function mapPedidoResponse<T extends Record<string, unknown>>(
  pedido: T,
) {
  const token = String(pedido.tokenPublico ?? '');
  const producto = pedido.producto as
    | { costoInterno?: unknown; precioLunesViernes?: unknown }
    | null
    | undefined;
  return {
    ...pedido,
    costo: costoReferencialPedido({
      costoGuardado: pedido.costo,
      cantidad: Number(pedido.cantidad) || 1,
      costoInterno: producto?.costoInterno,
      precioCatalogo: producto?.precioLunesViernes,
    }),
    costoEstimadoProveedor:
      pedido.costoEstimadoProveedor == null
        ? null
        : fromDecimal(pedido.costoEstimadoProveedor as never),
    linkPublico: token ? `/pedido-proveedor/${token}` : '',
  };
}

type PedidoPublicoRow = {
  id: string;
  nombre: string;
  cantidad: number;
  costo: unknown;
  costoEstimadoProveedor?: unknown;
  comentarioProveedor?: string | null;
  etapa: EtapaPedido;
  notas: string | null;
  tokenPublico: string;
  producto?: { costoInterno?: unknown; precioLunesViernes?: unknown } | null;
  proveedor?: { nombre: string } | null;
  evento: {
    fechaEvento: Date;
    turno: string;
    cantidadNinos: number;
    tematica: string | null;
    cumpleanero: { edad: number | null };
    cliente: { nombreCompleto: string };
  };
};

export function mapPedidoPublicoResponse(pedido: PedidoPublicoRow) {
  const token = pedido.tokenPublico;
  const puedeResponder = ETAPAS_RESPONDER.includes(pedido.etapa);
  return {
    servicio: pedido.nombre,
    cantidad: pedido.cantidad,
    costo: costoReferencialPedido({
      costoGuardado: pedido.costo,
      cantidad: pedido.cantidad,
      costoInterno: pedido.producto?.costoInterno,
      precioCatalogo: pedido.producto?.precioLunesViernes,
    }),
    costoEstimadoProveedor:
      pedido.costoEstimadoProveedor == null
        ? null
        : fromDecimal(pedido.costoEstimadoProveedor as never),
    comentarioProveedor: pedido.comentarioProveedor ?? null,
    etapa: pedido.etapa,
    notas: pedido.notas,
    proveedor: pedido.proveedor?.nombre ?? 'Proveedor',
    evento: {
      fechaEvento: pedido.evento.fechaEvento.toISOString().slice(0, 10),
      turno: pedido.evento.turno,
      clienteNombre: pedido.evento.cliente.nombreCompleto,
      cumpleaneroEdad: pedido.evento.cumpleanero.edad,
      cantidadNinos: pedido.evento.cantidadNinos,
      tematica: pedido.evento.tematica,
    },
    puedeProponerCosto: puedeResponder,
    puedeConfirmar: puedeResponder,
    puedeRechazar: puedeResponder,
    linkPublico: `/pedido-proveedor/${token}`,
  };
}
