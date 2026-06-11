import { BADGE_BASE, ETAPA_CONTRATO_BADGE } from '../../constants/design';
import { ETAPA_CONTRATO_LABEL } from '../../constants/contratos';
import type { EtapaContrato } from '../../lib/contratos';

export function ContratoBadge({ etapa }: { etapa: EtapaContrato }) {
  return (
    <span className={`${BADGE_BASE} ${ETAPA_CONTRATO_BADGE[etapa]}`}>
      {ETAPA_CONTRATO_LABEL[etapa]}
    </span>
  );
}
