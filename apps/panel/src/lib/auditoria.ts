import { api } from './api';

export type RegistroAuditoria = {
  id: string;
  tipoEntidad: string;
  entidadId: string;
  accion: string;
  actorTipo: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  creadoEn: string;
};

export async function fetchAuditoria(tipoEntidad: string, entidadId: string, limite = 30) {
  const { data } = await api.get<RegistroAuditoria[]>('/bosque-magico/auditoria', {
    params: { tipoEntidad, entidadId, limite },
  });
  return data;
}
