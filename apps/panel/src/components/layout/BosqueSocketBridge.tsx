import { useBosqueSocket } from '../../hooks/useBosqueSocket';

/** Monta la conexión Socket.IO solo dentro del layout autenticado del panel. */
export function BosqueSocketBridge() {
  useBosqueSocket();
  return null;
}
