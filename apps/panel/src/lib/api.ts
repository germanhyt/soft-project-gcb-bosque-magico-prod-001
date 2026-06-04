import axios from 'axios';
import { clearSession, getStoredToken } from './auth-storage';
import type { ListQueryParams, PaginatedResponse } from './pagination';
import { DEFAULT_PAGE_SIZE } from './pagination';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export type EtapaSolicitud = 'nueva' | 'en_atencion' | 'cotizada' | 'cerrada';
export type MotivoCierre = 'ganada' | 'perdida' | 'duplicada' | 'sin_respuesta' | 'otro';
export type CanalSolicitud =
  | 'landing'
  | 'whatsapp'
  | 'meta'
  | 'referido'
  | 'manual'
  | 'otro';
export type TurnoInteres = 'turno_1' | 'turno_2' | 'turno_3';

export type CotizacionResumenSolicitud = {
  id: string;
  codigo: string;
  etapa: string;
  creadoEn: string;
};

export type Solicitud = {
  id: string;
  fechaIngreso: string;
  nombreContacto: string;
  celular: string;
  correo: string | null;
  canal: CanalSolicitud;
  detalleOrigen: string | null;
  fechaTentativa: string | null;
  turnoInteres: TurnoInteres | null;
  cantidadNinosEstimada: number | null;
  etapa: EtapaSolicitud;
  motivoCierre: MotivoCierre | null;
  usuarioAsignadoId: string | null;
  ultimoContactoEn: string | null;
  proximoSeguimientoEn: string | null;
  notas: string | null;
  payloadOrigen?: unknown;
  cotizaciones?: CotizacionResumenSolicitud[];
  creadoEn: string;
  actualizadoEn: string;
};

export type ResumenEtapa = { etapa: EtapaSolicitud; _count: { _all: number } };

export type CrearSolicitudManualPayload = {
  nombreContacto: string;
  celular: string;
  correo?: string;
  canal?: CanalSolicitud;
  fechaTentativa?: string;
  turnoInteres?: TurnoInteres;
  cantidadNinosEstimada?: number;
  notas?: string;
  etapaInicial?: 'nueva' | 'en_atencion';
};

export async function fetchSolicitudes(
  etapa?: EtapaSolicitud,
  query?: ListQueryParams & { q?: string },
) {
  const { data } = await api.get<PaginatedResponse<Solicitud>>('/bosque-magico/solicitudes', {
    params: {
      ...(etapa ? { etapa } : {}),
      ...(query?.q?.trim() ? { q: query.q.trim() } : {}),
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? DEFAULT_PAGE_SIZE,
    },
  });
  return data;
}

export async function fetchSolicitud(id: string) {
  const { data } = await api.get<Solicitud>(`/bosque-magico/solicitudes/${id}`);
  return data;
}

export async function fetchResumenSolicitudes() {
  const { data } = await api.get<ResumenEtapa[]>('/bosque-magico/solicitudes/resumen');
  return data;
}

export async function crearSolicitudManual(payload: CrearSolicitudManualPayload) {
  const { data } = await api.post<Solicitud>('/bosque-magico/solicitudes', payload);
  return data;
}

export async function tomarSolicitud(id: string) {
  const { data } = await api.post<Solicitud>(`/bosque-magico/solicitudes/${id}/tomar`);
  return data;
}

export async function generarCotizacionBorradorSolicitud(id: string) {
  const { data } = await api.post<{
    solicitud: Solicitud;
    cotizacion: { id: string; codigo: string; etapa: string };
  }>(`/bosque-magico/solicitudes/${id}/generar-cotizacion-borrador`);
  return data;
}

export type CerrarSolicitudResponse = Solicitud & {
  cotizacionesCerradas?: Array<{ id: string; codigo: string; etapa: string }>;
};

export async function cerrarSolicitud(
  id: string,
  payload: { motivoCierre: MotivoCierre; notas?: string },
) {
  const { data } = await api.post<CerrarSolicitudResponse>(
    `/bosque-magico/solicitudes/${id}/cerrar`,
    payload,
  );
  return data;
}

export async function actualizarSeguimiento(
  id: string,
  payload: { notas?: string; proximoSeguimientoEn?: string },
) {
  const { data } = await api.patch<Solicitud>(`/bosque-magico/solicitudes/${id}`, payload);
  return data;
}
