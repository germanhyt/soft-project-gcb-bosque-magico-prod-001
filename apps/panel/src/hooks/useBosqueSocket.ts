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
  const { authRequired, user } = useAuth();
  const { pushNotification } = useNotifications();
  const { setStatus } = useSocketStatus();
  const qc = useQueryClient();

  useEffect(() => {
    let socket: Socket | undefined;
    let cancelled = false;

    const connect = () => {
      const token = getStoredToken();
      if (authRequired && !token) {
        setStatus('disconnected');
        return;
      }

      setStatus('connecting');

      socket = io(resolveSocketServerUrl(), {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 8,
        auth: token ? { token } : undefined,
      });

      socket.on('connect', () => {
        if (!cancelled) setStatus('connected');
      });
      socket.on('disconnect', () => {
        if (!cancelled) setStatus('disconnected');
      });
      socket.on('connect_error', () => {
        if (!cancelled) setStatus('disconnected');
      });

      socket.on('bosque:event', (event: BosquePanelEvent) => {
        pushNotification(event);
        invalidateForEvent(qc, event);
      });
    };

    connect();

    return () => {
      cancelled = true;
      setStatus('disconnected');
      socket?.disconnect();
    };
  }, [authRequired, user?.id, pushNotification, qc, setStatus]);
}
