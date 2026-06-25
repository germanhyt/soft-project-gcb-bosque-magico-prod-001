import { api } from './api';
import type { PaginatedResponse } from './pagination';
import type { TipoComprobante } from './contrato';

export type EtapaContrato = 'borrador' | 'enviado' | 'firmado' | 'anulado';

export type TipoAdjuntoContrato = 'comprobante_pago' | 'documento_contabilidad';

export type ContratoAdjunto = {
  id: string;
  tipo: TipoAdjuntoContrato;
  nombreOriginal: string;
  url: string;
  mimeType: string | null;
  tamanoBytes: number;
  creadoEn: string;
};

export type ContratoSnapshot = {
  codigoCotizacion: string;
  evento: {
    id: string;
    fechaEvento: string;
    turno: string;
    zona: string;
    cantidadNinos: number;
    tematica: string | null;
    montoTotal: number;
  };
  cliente: {
    nombreCompleto: string;
    celular: string;
    correo: string | null;
    numeroDocumento: string | null;
    tipoDocumento: string | null;
  };
  cumpleanero: { nombre: string; edad: number | null };
  cotizacion: {
    id: string;
    codigo: string;
    paquete: string | null;
    tematica: string | null;
    montoBase: number;
    montoNinosExtra: number;
    montoItems: number;
    montoTotal: number;
    items: Array<{
      id: string;
      tipo: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>;
  };
};

export type Contrato = {
  id: string;
  eventoId: string;
  cotizacionId: string;
  numero: string;
  tokenPublico: string;
  linkPublico: string;
  linkPdfPublico?: string;
  fechaEmision: string;
  montoTotal: number;
  montoAdelanto: number;
  montoPendiente: number;
  montoGarantia: number;
  adelanto1Monto: number;
  adelanto1Fecha: string | null;
  adelanto2Monto: number | null;
  adelanto2Fecha: string | null;
  tipoComprobante: TipoComprobante;
  documentoTributario: string;
  numeroDocumento: string;
  horarioInicio: string;
  horarioFin: string;
  terminosVersion: string;
  snapshotJson: ContratoSnapshot;
  etapa: EtapaContrato;
  enviadoEn: string | null;
  firmadoEn: string | null;
  reimpresion?: boolean;
  creadoEn: string;
  actualizadoEn: string;
  evento?: {
    id: string;
    fechaEvento: string;
    turno: string;
    etapa: string;
    cliente: { nombreCompleto: string; celular: string };
  };
  cotizacion?: { id: string; codigo: string };
  adjuntos?: ContratoAdjunto[];
};

export type GenerarContratoPayload = {
  numeroDocumento: string;
  tipoComprobante: TipoComprobante;
  documentoTributario: string;
  horarioInicio: string;
  horarioFin: string;
  adelanto1Monto: number;
  adelanto1Fecha?: string;
  adelanto2Monto?: number;
  adelanto2Fecha?: string;
  montoGarantia?: number;
};

export async function fetchContratoEvento(eventoId: string) {
  const { data } = await api.get<Contrato | null>(
    `/bosque-magico/eventos/${eventoId}/contrato`,
  );
  return data;
}

export async function generarContratoEvento(eventoId: string, payload: GenerarContratoPayload) {
  const { data } = await api.post<Contrato>(
    `/bosque-magico/eventos/${eventoId}/contrato`,
    payload,
  );
  return data;
}

export async function marcarContratoEnviado(id: string) {
  const { data } = await api.post<Contrato>(`/bosque-magico/contratos/${id}/enviar`);
  return data;
}

export async function marcarContratoFirmado(id: string) {
  const { data } = await api.post<Contrato>(`/bosque-magico/contratos/${id}/firmar`);
  return data;
}

export async function fetchContrato(id: string) {
  const { data } = await api.get<Contrato>(`/bosque-magico/contratos/${id}`);
  return data;
}

export async function fetchContratos(
  etapa?: EtapaContrato,
  query?: { page?: number; pageSize?: number; q?: string },
) {
  const { data } = await api.get<PaginatedResponse<Contrato>>('/bosque-magico/contratos', {
    params: {
      ...(etapa ? { etapa } : {}),
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? 20,
      ...(query?.q?.trim() ? { q: query.q.trim() } : {}),
    },
  });
  return data;
}

export function linkPublicoContratoCompleto(tokenOrLink: string) {
  const base = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:5173';
  if (tokenOrLink.startsWith('http')) return tokenOrLink;
  const path = tokenOrLink.startsWith('/contrato/')
    ? tokenOrLink
    : `/contrato/${tokenOrLink}`;
  return `${base}${path}`;
}

export function linkPdfPublicoContratoCompleto(tokenOrLink: string) {
  const base = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:5173';
  if (tokenOrLink.startsWith('http')) {
    return tokenOrLink.includes('/pdf') ? tokenOrLink : `${tokenOrLink}/pdf`;
  }
  const path = tokenOrLink.startsWith('/contrato/')
    ? tokenOrLink.includes('/pdf')
      ? tokenOrLink
      : `${tokenOrLink}/pdf`
    : `/contrato/${tokenOrLink}/pdf`;
  return `${base}${path}`;
}

export async function subirAdjuntoContrato(
  contratoId: string,
  tipo: TipoAdjuntoContrato,
  file: File,
) {
  const form = new FormData();
  form.append('archivo', file);
  const { data } = await api.post<ContratoAdjunto>(
    `/bosque-magico/contratos/${contratoId}/adjuntos/${tipo}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function eliminarAdjuntoContrato(contratoId: string, tipo: TipoAdjuntoContrato) {
  await api.delete(`/bosque-magico/contratos/${contratoId}/adjuntos/${tipo}`);
}
