export type BosquePanelEventType =
  | 'solicitud.nueva'
  | 'solicitud.actualizada'
  | 'cotizacion.borrador'
  | 'cotizacion.actualizada'
  | 'cotizacion.enviada'
  | 'cotizacion.aceptada'
  | 'evento.actualizado';

export type BosquePanelEvent = {
  id: string;
  type: BosquePanelEventType;
  titulo: string;
  mensaje: string;
  entidad?: { tipo: string; id: string };
  creadoEn: string;
};

export type PanelNotification = BosquePanelEvent & {
  leida: boolean;
};
