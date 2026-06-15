import { api } from './api';
import type { ListQueryParams, PaginatedResponse } from './pagination';
import { DEFAULT_PAGE_SIZE } from './pagination';

export type EtapaCotizacion = 'borrador' | 'enviada' | 'aceptada' | 'cerrada';
export type CanalEnvio = 'whatsapp' | 'email';
export type TipoItem = 'show' | 'catering' | 'extra' | 'manual';

export type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima: number;
  etapa?: 'activo' | 'inactivo';
  descripcion?: string | null;
  imagenUrl?: string | null;
  origen?: 'propio' | 'proveedor';
  costoInterno?: number | null;
  proveedorId?: string | null;
};

export type ItemCotizacion = {
  id?: string;
  productoId?: string | null;
  tipo: TipoItem;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string | null;
};

export type Cotizacion = {
  id: string;
  codigo: string;
  solicitudId?: string | null;
  solicitud?: { id: string; nombreContacto: string; etapa: string; canal: string } | null;
  eventos?: Array<{ id: string; etapa: string }>;
  tokenPublico: string;
  fechaEvento: string;
  turno: string;
  cantidadNinos: number;
  tematica?: string | null;
  paquete?: string | null;
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  etapa: EtapaCotizacion;
  linkPublico: string;
  notas?: string | null;
  cliente: { nombreCompleto: string; celular: string; correo?: string | null };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: ItemCotizacion[];
  advertencia?: string;
};

export type ActualizarCotizacionPayload = {
  fechaEvento?: string;
  turno?: string;
  cantidadNinos?: number;
  tematica?: string;
  paquete?: string;
  notas?: string;
  items?: {
    productoId?: string;
    tipo: TipoItem;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }[];
};

export type CrearCotizacionPayload = {
  solicitudId?: string;
  cliente: { nombreCompleto: string; celular: string; correo?: string };
  cumpleanero: { nombre: string; edad?: number; tematicaFavorita?: string };
  fechaEvento: string;
  turno: string;
  cantidadNinos: number;
  tematica?: string;
  paquete?: string;
  notas?: string;
  items?: {
    productoId?: string;
    tipo: TipoItem;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }[];
};

export async function fetchCotizaciones(
  etapa?: EtapaCotizacion,
  query?: ListQueryParams & { q?: string },
) {
  const { data } = await api.get<PaginatedResponse<Cotizacion>>('/bosque-magico/cotizaciones', {
    params: {
      ...(etapa ? { etapa } : {}),
      ...(query?.q?.trim() ? { q: query.q.trim() } : {}),
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? DEFAULT_PAGE_SIZE,
    },
  });
  return data;
}

export async function fetchCotizacion(id: string) {
  const { data } = await api.get<Cotizacion>(`/bosque-magico/cotizaciones/${id}`);
  return data;
}

export async function fetchProductos() {
  const { data } = await api.get<Producto[]>('/bosque-magico/productos', {
    params: { soloActivos: true },
  });
  return data;
}

export async function crearCotizacion(payload: CrearCotizacionPayload) {
  const { data } = await api.post<Cotizacion>('/bosque-magico/cotizaciones', payload);
  return data;
}

export async function actualizarCotizacion(id: string, payload: ActualizarCotizacionPayload) {
  const { data } = await api.patch<Cotizacion>(`/bosque-magico/cotizaciones/${id}`, payload);
  return data;
}

export async function enviarCotizacion(
  id: string,
  payload: {
    canal: CanalEnvio;
    correoDestino?: string;
    celularDestino?: string;
    correoAsunto?: string;
    correoCuerpo?: string;
  },
) {
  const { data } = await api.post<
    Cotizacion & {
      mensajePrearmado?: string;
      linkPublico: string;
      enviadoPorSmtp?: boolean;
      correoAsunto?: string;
      correoCuerpo?: string;
    }
  >(`/bosque-magico/cotizaciones/${id}/enviar`, payload);
  return data;
}

export async function aceptarCotizacionPanel(id: string) {
  const { data } = await api.post(`/bosque-magico/cotizaciones/${id}/aceptar`);
  return data;
}

export function linkPublicoCompleto(tokenOrLink: string) {
  const base = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:5173';
  if (tokenOrLink.startsWith('http')) return tokenOrLink;
  const path = tokenOrLink.startsWith('/cotizacion/')
    ? tokenOrLink
    : `/cotizacion/${tokenOrLink}`;
  return `${base}${path}`;
}
