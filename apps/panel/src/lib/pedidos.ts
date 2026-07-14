export type TipoPedido = 'interno' | 'proveedor';

export type AreaPedido =
  | 'ventas'
  | 'operaciones'
  | 'decoracion'
  | 'catering'
  | 'shows'
  | 'administracion';

export type EtapaPedido =
  | 'pendiente'
  | 'solicitado'
  | 'confirmado'
  | 'entregado'
  | 'cancelado';

export type Pedido = {
  id: string;
  eventoId: string;
  productoId: string | null;
  proveedorId: string | null;
  tipo: TipoPedido;
  nombre: string;
  cantidad: number;
  area: AreaPedido;
  fechaRequerida: string | null;
  costo: number;
  etapa: EtapaPedido;
  notas: string | null;
  creadoEn?: string;
  tokenPublico?: string;
  linkPublico?: string;
  producto?: { id: string; codigo: string; nombre: string; categoria: string } | null;
  proveedor?: { id: string; nombre: string; celular: string | null; correo?: string | null } | null;
  evento?: {
    id: string;
    fechaEvento: string;
    turno: string;
    etapa?: string;
    cantidadNinos?: number;
    tematica?: string | null;
    cumpleanero?: { edad?: number | null };
    cliente?: { nombreCompleto: string };
  };
};
