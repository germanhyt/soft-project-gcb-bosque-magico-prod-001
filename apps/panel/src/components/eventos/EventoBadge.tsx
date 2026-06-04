import { BADGE_BASE, ETAPA_EVENTO_BADGE } from '../../constants/design';
import { ETAPA_EVENTO_LABEL } from '../../constants/eventos';
import type { EtapaEvento } from '../../lib/eventos';

export function EventoBadge({ etapa }: { etapa: EtapaEvento }) {
  return (
    <span className={`${BADGE_BASE} ${ETAPA_EVENTO_BADGE[etapa]}`}>
      {ETAPA_EVENTO_LABEL[etapa]}
    </span>
  );
}
