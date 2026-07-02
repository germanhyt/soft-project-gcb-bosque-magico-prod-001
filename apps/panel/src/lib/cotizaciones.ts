import { api } from './api';
import type { ListQueryParams, PaginatedResponse } from './pagination';
import { DEFAULT_PAGE_SIZE } from './pagination';

export type EtapaCotizacion = 'borrador' | 'enviada' | 'aceptada' | 'cerrada';
export type CanalEnvio = 'whatsapp' | 'email';
export type TipoItem = 'show' | 'catering' | 'extra' | 'manual';

export type ProductoMedia = {
  id: string;
  tipo: 'imagen' | 'video';
  url: string;
  nombreOriginal: string | null;
  orden: number;
};

export type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  creadoEn?: string;
  categoria: string;
  subtipo?: 'general' | 'cajita' | 'piqueo' | 'snack';
  unidadesPack?: number | null;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima: number;
  etapa?: 'activo' | 'inactivo';
  descripcion?: string | null;
  imagenUrl?: string | null;
  imagenes?: string[];
  videoUrl?: string | null;
  medios?: ProductoMedia[];
  origen?: 'propio' | 'proveedor';
  costoInterno?: number | null;
  proveedorId?: string | null;
};

export type OrigenItemCotizacion =
  | 'incluido_paquete'
  | 'excedente_paquete'
  | 'adicional'
  | 'manual';

export type ItemCotizacion = {
  id?: string;
  productoId?: string | null;
  tipo: TipoItem;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string | null;
  origenItem?: OrigenItemCotizacion;
  creditoAplicado?: number | null;
};

export type SeleccionPaquetePayload = {
  showIds?: string[];
  extraIds?: string[];
  snackId?: string;
  snackCantidad?: number;
  cajitasCantidad?: number;
  piqueos?: Array<{ productoId: string; cantidad: number }>;
  adicionales?: Array<{ productoId: string; cantidad: number }>;
};

export type PreviewCotizacionResponse = {
  paquete: string | null;
  fechaEvento: string;
  cantidadNinos: number;
  esFinSemana: boolean;
  montos: {
    base: number;
    ninosExtra: number;
    items: number;
    total: number;
  };
  advertencia?: string;
  resumenPaquete?: {
    cajitasIncluidas: number;
    cajitasSolicitadas: number;
    cajitasExcedente: number;
    snackUnidadesIncluidas: number;
    snackUnidadesSolicitadas: number;
    snackUnidadesExcedente: number;
    snackMontoExcedente: number;
    piqueosCreditoIncluido: number;
    piqueosValorSeleccionado: number;
    piqueosExcedente: number;
  };
  items: Array<{
    productoId?: string;
    nombre: string;
    categoria: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    origenItem?: OrigenItemCotizacion;
    notas?: string;
  }>;
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
  linkPdfPublico?: string;
  notas?: string | null;
  creadoEn?: string;
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
  seleccion?: SeleccionPaquetePayload;
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
  paquete: string;
  notas?: string;
  seleccion?: SeleccionPaquetePayload;
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

export async function previewCotizacion(payload: {
  fechaEvento: string;
  cantidadNinos: number;
  paquete: string;
  seleccion?: SeleccionPaquetePayload;
}) {
  const { data } = await api.post<PreviewCotizacionResponse>(
    '/public/bosque-magico/cotizaciones/preview',
    payload,
  );
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
      linkPdfPublico?: string;
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

export function linkPdfPublicoCompleto(tokenOrLink: string) {
  const base = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:5173';
  if (tokenOrLink.startsWith('http')) return tokenOrLink;
  const path = tokenOrLink.includes('/pdf')
    ? tokenOrLink.startsWith('/')
      ? tokenOrLink
      : `/cotizacion/${tokenOrLink}`
    : tokenOrLink.startsWith('/cotizacion/')
      ? `${tokenOrLink}/pdf`
      : `/cotizacion/${tokenOrLink}/pdf`;
  return `${base}${path}`;
}
