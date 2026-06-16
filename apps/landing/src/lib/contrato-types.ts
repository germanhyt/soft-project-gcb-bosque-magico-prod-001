export type ContratoSnapshot = {
  codigoCotizacion: string;
  evento: {
    fechaEvento: string;
    cantidadNinos: number;
    tematica: string | null;
  };
  cliente: {
    nombreCompleto: string;
    celular: string;
    correo: string | null;
  };
  cumpleanero: { nombre: string; edad: number | null };
  cotizacion: {
    items: Array<{
      id: string;
      nombre: string;
      cantidad: number;
      subtotal: number;
    }>;
  };
};
