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
  | 'en_proceso'
  | 'entregado'
  | 'cerrado'
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
  producto?: { id: string; codigo: string; nombre: string; categoria: string } | null;
  proveedor?: { id: string; nombre: string; celular: string | null } | null;
};
