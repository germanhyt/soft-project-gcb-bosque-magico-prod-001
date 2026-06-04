import { BADGE_BASE, ETAPA_BADGE } from '../../constants/design';
import { ETAPA_LABEL } from '../../constants/solicitudes';
import type { EtapaSolicitud } from '../../lib/api';

export function EtapaBadge({ etapa }: { etapa: EtapaSolicitud }) {
  return (
    <span className={`${BADGE_BASE} ${ETAPA_BADGE[etapa]}`}>
      {ETAPA_LABEL[etapa]}
    </span>
  );
}
