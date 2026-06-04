import { api } from './api';
import type { ListQueryParams, PaginatedResponse } from './pagination';

export type ClienteListItem = {
  id: string;
  nombreCompleto: string;
  celular: string;
  correo: string | null;
  distrito: string | null;
  creadoEn: string;
  actualizadoEn: string;
  totalSolicitudes: number;
  solicitudesRecientes24h: boolean;
  totalCotizaciones: number;
  totalEventos: number;
  totalCumpleaneros: number;
};

export type ClienteDetalle = {
  id: string;
  nombreCompleto: string;
  tipoDocumento: 'dni' | 'ruc' | 'otro' | null;
  numeroDocumento: string | null;
  celular: string;
  correo: string | null;
  direccion: string | null;
  distrito: string | null;
  notas: string | null;
  creadoEn: string;
  actualizadoEn: string;
  identidad: {
    celularNormalizado: string;
    correoNormalizado: string | null;
    solicitudesRecientes24h: boolean;
  };
  estadisticas: {
    totalSolicitudes: number;
    primeraSolicitudEn: string | null;
    ultimaSolicitudEn: string | null;
    totalCotizaciones: number;
    totalEventos: number;
    totalCumpleaneros: number;
  };
  solicitudes: Array<{
    id: string;
    nombreContacto: string;
    canal: string;
    etapa: string;
    fechaTentativa: string | null;
    creadoEn: string;
  }>;
  cotizaciones: Array<{
    id: string;
    codigo: string;
    etapa: string;
    montoTotal: number;
    fechaEvento: string;
    creadoEn: string;
  }>;
  cumpleaneros: Array<{ id: string; nombre: string; edad: number | null }>;
  eventos: Array<{
    id: string;
    fechaEvento: string;
    turno: string;
    etapa: string;
    montoTotal: number;
  }>;
};

export async function fetchClientes(
  params?: ListQueryParams & { q?: string },
): Promise<PaginatedResponse<ClienteListItem>> {
  const { data } = await api.get<PaginatedResponse<ClienteListItem>>(
    '/bosque-magico/clientes',
    { params },
  );
  return data;
}

export async function fetchCliente(id: string): Promise<ClienteDetalle> {
  const { data } = await api.get<ClienteDetalle>(`/bosque-magico/clientes/${id}`);
  return data;
}

export type ActualizarClientePayload = {
  nombreCompleto?: string;
  celular?: string;
  tipoDocumento?: 'dni' | 'ruc' | 'otro';
  numeroDocumento?: string;
  correo?: string;
  direccion?: string;
  distrito?: string;
  notas?: string;
};

export async function actualizarCliente(id: string, payload: ActualizarClientePayload) {
  const { data } = await api.patch<ClienteDetalle>(`/bosque-magico/clientes/${id}`, payload);
  return data;
}
