export type EtapaTareaEvento = 'pendiente' | 'en_proceso' | 'completado' | 'bloqueado';

export type TareaEvento = {
  id: string;
  eventoId: string;
  area: string;
  nombre: string;
  responsable: string | null;
  etapa: EtapaTareaEvento;
  fechaVencimiento: string | null;
  notas: string | null;
};
