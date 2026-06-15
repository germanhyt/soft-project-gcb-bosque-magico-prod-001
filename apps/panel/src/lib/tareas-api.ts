import { api } from './api';
import type { EtapaTareaEvento, TareaEvento } from './tareas';
import type { AreaPedido } from './pedidos';

export async function fetchTareasEvento(eventoId: string) {
  const { data } = await api.get<TareaEvento[]>(`/bosque-magico/eventos/${eventoId}/tareas`);
  return data;
}

export async function generarTareasEvento(eventoId: string) {
  const { data } = await api.post<TareaEvento[]>(
    `/bosque-magico/eventos/${eventoId}/tareas/generar`,
  );
  return data;
}

export async function crearTareaEvento(
  eventoId: string,
  payload: {
    area: AreaPedido;
    nombre: string;
    responsable?: string;
    fechaVencimiento?: string;
    notas?: string;
  },
) {
  const { data } = await api.post<TareaEvento>(`/bosque-magico/eventos/${eventoId}/tareas`, payload);
  return data;
}

export async function actualizarTareaEvento(
  id: string,
  payload: Partial<{
    etapa: EtapaTareaEvento;
    area: AreaPedido;
    responsable: string;
    fechaVencimiento: string;
    notas: string;
  }>,
) {
  const { data } = await api.patch<TareaEvento>(`/bosque-magico/tareas/${id}`, payload);
  return data;
}

export async function fetchPedidosOperaciones(desde?: string, hasta?: string) {
  const { data } = await api.get<
    Array<
      import('./pedidos').Pedido & {
        evento: {
          id: string;
          fechaEvento: string;
          turno: string;
          etapa: string;
          cliente: { nombreCompleto: string };
        };
      }
    >
  >('/bosque-magico/pedidos', { params: { desde, hasta } });
  return data;
}
