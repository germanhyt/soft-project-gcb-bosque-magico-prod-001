import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useSocketStatus } from '../contexts/SocketStatusContext';
import { getStoredToken } from '../lib/auth-storage';
import { resolveSocketServerUrl } from '../lib/socket-url';
import type { BosquePanelEvent } from '../types/bosque-panel-event';

function invalidateForEvent(qc: ReturnType<typeof useQueryClient>, event: BosquePanelEvent) {
  if (event.type.startsWith('solicitud.')) {
    void qc.invalidateQueries({ queryKey: ['solicitudes'] });
    void qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] });
    void qc.invalidateQueries({ queryKey: ['solicitudes-recientes-dashboard'] });
    if (event.entidad?.tipo === 'solicitud') {
      void qc.invalidateQueries({ queryKey: ['solicitud', event.entidad.id] });
    }
  }
  if (event.type.startsWith('cotizacion.') || event.type === 'evento.actualizado') {
    void qc.invalidateQueries({ queryKey: ['cotizaciones'] });
    void qc.invalidateQueries({ queryKey: ['agenda'] });
    void qc.invalidateQueries({ queryKey: ['eventos-resumen'] });
    void qc.invalidateQueries({ queryKey: ['eventos'] });
    if (event.entidad?.tipo === 'cotizacion') {
      void qc.invalidateQueries({ queryKey: ['cotizacion', event.entidad.id] });
    }
  }
}

export function useBosqueSocket() {
  const { authRequired } = useAuth();
  const { pushNotification } = useNotifications();
  const { setStatus } = useSocketStatus();
  const qc = useQueryClient();

  useEffect(() => {
    let socket: Socket | undefined;

    const connect = () => {
      setStatus('connecting');
      const auth =
        authRequired && getStoredToken() ? { token: getStoredToken()! } : undefined;

      socket = io(resolveSocketServerUrl(), {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth,
      });

      socket.on('connect', () => setStatus('connected'));
      socket.on('disconnect', () => setStatus('disconnected'));
      socket.on('connect_error', () => setStatus('disconnected'));

      socket.on('bosque:event', (event: BosquePanelEvent) => {
        pushNotification(event);
        invalidateForEvent(qc, event);
      });
    };

    connect();

    return () => {
      setStatus('disconnected');
      socket?.disconnect();
    };
  }, [authRequired, pushNotification, qc, setStatus]);
}
