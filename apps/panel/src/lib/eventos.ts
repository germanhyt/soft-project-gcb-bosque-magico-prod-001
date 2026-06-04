import { api } from './api';

export type EtapaEvento = 'por_confirmar' | 'confirmado' | 'realizado' | 'cancelado';

export type Evento = {
  id: string;
  cotizacionId: string;
  fechaEvento: string;
  turno: string;
  zona: string;
  tematica: string | null;
  cantidadNinos: number;
  montoTotal: number;
  etapa: EtapaEvento;
  notas: string | null;
  confirmadoEn: string | null;
  realizadoEn: string | null;
  canceladoEn: string | null;
  cliente: { nombreCompleto: string; celular: string; correo?: string | null };
  cumpleanero: { nombre: string; edad?: number | null };
  cotizacion?: { id: string; codigo: string; paquete?: string | null };
};

export type AgendaResponse = {
  agenda: { fecha: string; eventos: Evento[] }[];
  resumen: Record<EtapaEvento, number>;
  proximos: Evento[];
  total: number;
};

export async function fetchAgenda(desde?: string, hasta?: string) {
  const { data } = await api.get<AgendaResponse>('/bosque-magico/eventos/agenda', {
    params: { desde, hasta },
  });
  return data;
}

export async function fetchEventosResumen() {
  const { data } = await api.get<{
    porEtapa: Record<string, number>;
    proximos: Evento[];
  }>('/bosque-magico/eventos/resumen');
  return data;
}

export async function confirmarEvento(id: string) {
  const { data } = await api.post<Evento>(`/bosque-magico/eventos/${id}/confirmar`);
  return data;
}

export async function realizarEvento(id: string) {
  const { data } = await api.post<Evento>(`/bosque-magico/eventos/${id}/realizar`);
  return data;
}

export async function cancelarEvento(id: string, motivo?: string) {
  const { data } = await api.post<Evento>(`/bosque-magico/eventos/${id}/cancelar`, { motivo });
  return data;
}
