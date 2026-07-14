import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export type ConfiguracionItem = {
  id: string;
  clave: string;
  valor: unknown;
  descripcion: string | null;
  esPublico: boolean;
};

export type ProductoCatalogo = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'show' | 'catering' | 'extra' | 'paquete' | 'espacio';
  subtipo?: 'general' | 'cajita' | 'piqueo' | 'snack';
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima: number;
  unidadesPack?: number | null;
  descripcion: string | null;
  imagenUrl: string | null;
  imagenes?: string[];
  videoUrl?: string | null;
  etapa: 'activo' | 'inactivo';
};

export type CatalogoPublicoResponse = {
  configuracion: ConfiguracionItem[];
  productos: {
    paquetes: ProductoCatalogo[];
    shows: ProductoCatalogo[];
    catering: ProductoCatalogo[];
    piqueos: ProductoCatalogo[];
    cajitas: ProductoCatalogo[];
    snacks: ProductoCatalogo[];
    extras: ProductoCatalogo[];
    espacios: ProductoCatalogo[];
  };
};

export type CrearSolicitudPayload = {
  cliente: {
    nombre: string;
    celular: string;
    correo?: string;
  };
  cumpleanero?: {
    nombre?: string;
    edad?: number;
  };
  evento?: {
    fechaTentativa?: string;
    turno?: 'turno_1' | 'turno_2' | 'turno_3';
    cantidadNinos?: number;
    tematica?: string;
    paquete?: string;
  };
  observaciones?: string;
  preferencias?: Record<string, unknown>;
};

export type CrearSolicitudResponse = {
  mensaje: string;
  id: string;
  etapa: string;
  posibleDuplicado: boolean;
  identidad?: {
    totalSolicitudes: number;
    clienteConocido: boolean;
    clienteId: string | null;
  };
  cotizacion?: { id: string; codigo: string; etapa: string };
};

export type PreviewCotizacionItemPayload = {
  productoId: string;
  cantidad: number;
};

export type SeleccionPaquetePayload = {
  showIds?: string[];
  extraIds?: string[];
  snackId?: string;
  snackCantidad?: number;
  cajitasCantidad?: number;
  cajitasClasica?: number;
  cajitasSaludable?: number;
  piqueos?: PreviewCotizacionItemPayload[];
  adicionales?: PreviewCotizacionItemPayload[];
};

export type PreviewCotizacionPayload = {
  fechaEvento: string;
  cantidadNinos: number;
  paquete: string;
  seleccion?: SeleccionPaquetePayload;
  /** @deprecated usar seleccion.adicionales */
  items?: PreviewCotizacionItemPayload[];
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
    cantidadMinima: number;
    precioUnitario: number;
    precioCatalogo?: number;
    subtotal: number;
    origenItem?: string;
    creditoAplicado?: number;
    notas?: string;
  }>;
};

export async function fetchConfiguracionPublica() {
  const { data } = await api.get<ConfiguracionItem[]>('/public/bosque-magico/configuracion');
  return data;
}

export async function fetchCatalogoPublico() {
  const { data } = await api.get<CatalogoPublicoResponse>('/public/bosque-magico/catalogo');
  return data;
}

export async function previewCotizacionPublica(payload: PreviewCotizacionPayload) {
  const { data } = await api.post<PreviewCotizacionResponse>(
    '/public/bosque-magico/cotizaciones/preview',
    payload,
  );
  return data;
}

export async function crearSolicitudPublica(payload: CrearSolicitudPayload) {
  const { data } = await api.post<CrearSolicitudResponse>(
    '/public/bosque-magico/solicitudes',
    payload,
  );
  return data;
}
