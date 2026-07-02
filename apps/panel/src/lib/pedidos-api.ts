import { api } from './api';
import type { AreaPedido, EtapaPedido, Pedido, TipoPedido } from './pedidos';

export type ActualizarPedidoResponse = Pedido & {
  notificacionProveedor?: { enviado: boolean; motivo?: string };
};

export type EnviarPedidoProveedorCorreoResponse = {
  pedido: Pedido;
  correoDestino: string;
  enviadoPorSmtp: boolean;
  correoAsunto: string;
  correoCuerpo: string;
  motivo?: string;
};

export async function fetchPedidosEvento(eventoId: string) {
  const { data } = await api.get<Pedido[]>(`/bosque-magico/eventos/${eventoId}/pedidos`);
  return data;
}

export async function crearPedido(
  eventoId: string,
  payload: {
    productoId?: string;
    proveedorId?: string;
    tipo: TipoPedido;
    nombre: string;
    cantidad: number;
    area: AreaPedido;
    fechaRequerida?: string;
    costo: number;
    notas?: string;
  },
) {
  const { data } = await api.post<Pedido>(`/bosque-magico/eventos/${eventoId}/pedidos`, payload);
  return data;
}

export async function generarPedidosEvento(eventoId: string) {
  const { data } = await api.post<Pedido[]>(
    `/bosque-magico/eventos/${eventoId}/pedidos/generar`,
  );
  return data;
}

export async function actualizarPedido(
  id: string,
  payload: Partial<{
    etapa: EtapaPedido;
    area: AreaPedido;
    cantidad: number;
    costo: number;
    fechaRequerida: string;
    notas: string;
  }>,
) {
  const { data } = await api.patch<ActualizarPedidoResponse>(`/bosque-magico/pedidos/${id}`, payload);
  return data;
}

export async function enviarPedidoProveedorCorreo(
  id: string,
  payload: { correoAsunto?: string; correoCuerpo?: string },
) {
  const { data } = await api.post<EnviarPedidoProveedorCorreoResponse>(
    `/bosque-magico/pedidos/${id}/enviar-correo`,
    payload,
  );
  return data;
}
