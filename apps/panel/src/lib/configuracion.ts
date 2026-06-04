import { api } from './api';
import type { Producto } from './cotizaciones';

export type ConfigItem = {
  id: string;
  clave: string;
  valor: unknown;
  descripcion: string | null;
  esPublico: boolean;
};

export type TurnoConfigValor = {
  etiqueta: string;
  horaInicio: string;
  horaFin: string;
  horario?: string;
};

export type SelectionMode = 'single' | 'multiple';

export type ConfigPanelResponse = {
  numericas: ConfigItem[];
  turnos: ConfigItem[];
  cotizador: ConfigItem[];
  smtp: ConfigItem[];
  otras: ConfigItem[];
  todas: ConfigItem[];
};

export async function fetchConfiguracionPanel() {
  const { data } = await api.get<ConfigPanelResponse>('/bosque-magico/configuracion');
  return data;
}

export async function guardarConfiguracion(
  actualizaciones: {
    clave: string;
    valor: number | string | boolean | TurnoConfigValor | SelectionMode;
  }[],
) {
  const { data } = await api.patch<ConfigItem[]>('/bosque-magico/configuracion', {
    actualizaciones,
  });
  return data;
}

export async function fetchProductosCatalogo(soloActivos?: boolean) {
  const { data } = await api.get<Producto[]>('/bosque-magico/productos', {
    params: soloActivos !== undefined ? { soloActivos } : {},
  });
  return data;
}

export async function crearProducto(payload: {
  codigo: string;
  nombre: string;
  categoria: string;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima?: number;
  descripcion?: string;
}) {
  const { data } = await api.post<Producto>('/bosque-magico/productos', payload);
  return data;
}

export async function actualizarProducto(
  id: string,
  payload: Partial<{
    nombre: string;
    categoria: string;
    precioLunesViernes: number;
    precioFinSemana: number;
    cantidadMinima: number;
    descripcion: string;
    etapa: 'activo' | 'inactivo';
  }>,
) {
  const { data } = await api.patch<Producto>(`/bosque-magico/productos/${id}`, payload);
  return data;
}

export async function subirImagenProducto(id: string, file: File) {
  const form = new FormData();
  form.append('imagen', file);
  const { data } = await api.post<Producto>(`/bosque-magico/productos/${id}/imagen`, form);
  return data;
}

export async function eliminarImagenProducto(id: string) {
  const { data } = await api.delete<Producto>(`/bosque-magico/productos/${id}/imagen`);
  return data;
}
