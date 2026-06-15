import { api } from './api';
import type { Proveedor } from './proveedores';

export async function fetchProveedores(soloActivos?: boolean) {
  const { data } = await api.get<Proveedor[]>('/bosque-magico/proveedores', {
    params: soloActivos ? { soloActivos: true } : undefined,
  });
  return data;
}

export async function crearProveedor(payload: {
  nombre: string;
  contacto?: string;
  celular?: string;
  correo?: string;
  categorias?: string[];
  notas?: string;
}) {
  const { data } = await api.post<Proveedor>('/bosque-magico/proveedores', payload);
  return data;
}

export async function actualizarProveedor(
  id: string,
  payload: Partial<{
    nombre: string;
    contacto: string;
    celular: string;
    correo: string;
    categorias: string[];
    notas: string;
    etapa: 'activo' | 'inactivo';
  }>,
) {
  const { data } = await api.patch<Proveedor>(`/bosque-magico/proveedores/${id}`, payload);
  return data;
}
