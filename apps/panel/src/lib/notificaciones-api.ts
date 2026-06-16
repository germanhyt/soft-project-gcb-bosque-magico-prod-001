import { api } from './api';
import type { PanelNotification } from '../types/bosque-panel-event';

export async function fetchNotificacionesPanel() {
  const { data } = await api.get<PanelNotification[]>('/bosque-magico/notificaciones');
  return data;
}

export async function marcarNotificacionLeida(id: string) {
  await api.patch(`/bosque-magico/notificaciones/${id}/leida`);
}

export async function marcarTodasNotificacionesLeidas() {
  await api.post('/bosque-magico/notificaciones/marcar-leidas');
}

export async function ocultarTodasNotificaciones() {
  await api.post('/bosque-magico/notificaciones/ocultar-todas');
}
