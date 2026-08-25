export type EtapaProveedor = 'activo' | 'inactivo';

export const CATEGORIA_PROVEEDOR_OPTIONS = [
  { value: 'show', label: 'Show' },
  { value: 'catering', label: 'Catering' },
  { value: 'inflables', label: 'Inflables' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'animacion', label: 'Animación' },
  { value: 'fotografia-video', label: 'Fotografía / Video' },
] as const;

export function etiquetaCategoriaProveedor(value: string) {
  return (
    CATEGORIA_PROVEEDOR_OPTIONS.find((categoria) => categoria.value === value)?.label ?? value
  );
}

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
