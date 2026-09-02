export type ResumenEstimado = {
  total: number;
  base: number;
  extraNinos: number;
  items: number;
  esFinSemana: boolean;
  advertencia?: string;
  tienePaquete: boolean;
  cantidadItems: number;
  cargando: boolean;
  /** Hay un monto confirmado (preview API o fallback por error). Evita pintar 799/tarifas estáticas. */
  listo: boolean;
};
