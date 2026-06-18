export type EtapaProveedor = 'activo' | 'inactivo';

export type Proveedor = {
  id: string;
  creadoEn?: string;
  nombre: string;
  contacto: string | null;
  celular: string | null;
  correo: string | null;
  categorias: string[];
  notas: string | null;
  etapa: EtapaProveedor;
};
