import { api } from './api';
import type { AreaPedido, EtapaPedido, Pedido, TipoPedido } from './pedidos';

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
  const { data } = await api.patch<Pedido>(`/bosque-magico/pedidos/${id}`, payload);
  return data;
}
