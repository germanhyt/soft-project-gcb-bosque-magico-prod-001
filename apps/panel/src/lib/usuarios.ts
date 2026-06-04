import { api } from './api';

export type UsuarioPanel = {
  id: string;
  email: string;
  nombre: string;
  permisos: string[];
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
};

export const PERMISOS_DISPONIBLES = [
  { id: 'bosque_magico:view', label: 'Ver (listados y detalle)' },
  { id: 'bosque_magico:manage', label: 'Gestionar (crear, editar, enviar)' },
  { id: 'bosque_magico:admin', label: 'Administrar (tarifas y usuarios)' },
] as const;

export async function fetchUsuarios() {
  const { data } = await api.get<UsuarioPanel[]>('/bosque-magico/usuarios');
  return data;
}

export async function crearUsuario(payload: {
  email: string;
  nombre: string;
  password: string;
  permisos: string[];
}) {
  const { data } = await api.post<UsuarioPanel>('/bosque-magico/usuarios', payload);
  return data;
}

export async function actualizarUsuario(
  id: string,
  payload: Partial<{
    nombre: string;
    password: string;
    permisos: string[];
    activo: boolean;
  }>,
) {
  const { data } = await api.patch<UsuarioPanel>(`/bosque-magico/usuarios/${id}`, payload);
  return data;
}
