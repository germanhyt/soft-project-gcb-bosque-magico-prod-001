import { AreaPedido } from '@prisma/client';

export const TAREAS_DEFECTO_EVENTO: { area: AreaPedido; nombre: string }[] = [
  { area: AreaPedido.operaciones, nombre: 'Revisar cotización y logística del evento' },
  { area: AreaPedido.decoracion, nombre: 'Preparar espacio y temática' },
  { area: AreaPedido.catering, nombre: 'Confirmar menú y cantidades' },
  { area: AreaPedido.shows, nombre: 'Coordinar show / animación' },
  { area: AreaPedido.administracion, nombre: 'Verificar contrato y adelanto' },
];
