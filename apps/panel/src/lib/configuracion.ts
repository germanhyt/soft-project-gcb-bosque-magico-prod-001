import { api } from './api';
import type { Producto } from './cotizaciones';
import type { SmtpEstadoPanel } from './smtp-config';

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
  calendario: ConfigItem[];
  smtp: ConfigItem[];
  postventa: ConfigItem[];
  pedidosProveedor: ConfigItem[];
  recordatorios: ConfigItem[];
  otras: ConfigItem[];
  todas: ConfigItem[];
  meta?: {
    smtp: SmtpEstadoPanel;
  };
};

export async function fetchConfiguracionPanel() {
  const { data } = await api.get<ConfigPanelResponse>('/bosque-magico/configuracion');
  return data;
}

export async function guardarConfiguracion(
  actualizaciones: {
    clave: string;
    valor: number | string | boolean | string[] | TurnoConfigValor | SelectionMode;
  }[],
) {
  const { data } = await api.patch<ConfigItem[]>('/bosque-magico/configuracion', {
    actualizaciones,
  });
  return data;
}

export async function probarSmtp(correoDestino: string) {
  const { data } = await api.post<{ ok: true; destino: string }>(
    '/bosque-magico/configuracion/smtp/probar',
    { correoDestino },
  );
  return data;
}

export async function fetchProductosCatalogo(soloActivos?: boolean) {
  const { data } = await api.get<Producto[]>('/bosque-magico/productos', {
    params: soloActivos !== undefined ? { soloActivos } : {},
  });
  return data;
}

export async function crearProducto(payload: {
  codigo?: string;
  nombre: string;
  categoria: string;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima?: number;
  subtipo?: 'general' | 'cajita' | 'piqueo' | 'snack';
  unidadesPack?: number;
  unidad?: string;
  descripcion?: string;
  origen?: 'propio' | 'proveedor';
  costoInterno?: number;
  proveedorId?: string;
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
    subtipo?: 'general' | 'cajita' | 'piqueo' | 'snack';
    unidadesPack?: number | null;
    unidad?: string;
    descripcion: string;
    etapa: 'activo' | 'inactivo';
    origen: 'propio' | 'proveedor';
    costoInterno: number;
    proveedorId: string | null;
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

export async function eliminarMediaProducto(productoId: string, mediaId: string) {
  const { data } = await api.delete<Producto>(
    `/bosque-magico/productos/${productoId}/medios/${mediaId}`,
  );
  return data;
}

export async function guardarVideoUrlProducto(productoId: string, url: string) {
  const { data } = await api.post<Producto>(
    `/bosque-magico/productos/${productoId}/video/url`,
    { url },
  );
  return data;
}

export async function subirVideoProducto(productoId: string, file: File) {
  const form = new FormData();
  form.append('video', file);
  const { data } = await api.post<Producto>(
    `/bosque-magico/productos/${productoId}/video`,
    form,
  );
  return data;
}

export async function eliminarVideoProducto(productoId: string) {
  const { data } = await api.delete<Producto>(`/bosque-magico/productos/${productoId}/video`);
  return data;
}
