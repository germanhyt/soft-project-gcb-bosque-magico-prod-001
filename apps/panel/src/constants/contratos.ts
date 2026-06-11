import type { EtapaContrato } from '../lib/contratos';

export const ETAPA_CONTRATO_LABEL: Record<EtapaContrato, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  firmado: 'Firmado',
  anulado: 'Anulado',
};

export const ETAPAS_CONTRATO_FILTRO: { value: '' | EtapaContrato; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'firmado', label: 'Firmado' },
  { value: 'anulado', label: 'Anulado' },
];
