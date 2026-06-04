import { BADGE_BASE, ETAPA_COT_BADGE } from '../../constants/design';
import { ETAPA_COT_LABEL } from '../../constants/cotizaciones';
import type { EtapaCotizacion } from '../../lib/cotizaciones';

export function CotizacionBadge({ etapa }: { etapa: EtapaCotizacion }) {
  return (
    <span className={`${BADGE_BASE} ${ETAPA_COT_BADGE[etapa]}`}>
      {ETAPA_COT_LABEL[etapa]}
    </span>
  );
}
