import { motion, useReducedMotion } from 'framer-motion';
import { GRID_CATALOG, CARD_CATALOG, cardCatalogState } from '../../constants/design';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { selectionHint, type SelectionMode } from '../../lib/selection-mode';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { SelectionHint } from '../ui/SelectionHint';
import { CatalogProductMedia } from '../ui/CatalogProductMedia';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selectionMode: SelectionMode;
  selectedExtraIds: string[];
  onToggleExtra: (extraId: string, checked: boolean) => void;
};

export function Extras({ selectionMode, selectedExtraIds, onToggleExtra }: Props) {
  const { data } = useConfiguracion();
  const reduceMotion = useReducedMotion();
  const extras = data?.productos.extras ?? [];

  if (!extras.length) return null;

  return (
    <SectionShell id="extras" tone="alt">
      <SectionTitle
        pill="Extras"
        title="Complementa la experiencia"
        subtitle="El primer extra va incluido en todos los paquetes. El precio de catálogo es por 1 hora."
      />
      <SelectionHint>{selectionHint(selectionMode)}</SelectionHint>
      <div className={`${GRID_CATALOG} lg:grid-cols-3`}>
        {extras.map((extra, index) => {
          const selected = selectedExtraIds.includes(extra.id);
          return (
            <motion.article
              key={extra.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggleExtra(extra.id, !selected)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onToggleExtra(extra.id, !selected);
              }}
              className={`${CARD_CATALOG} ${cardCatalogState(selected)}`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <CatalogProductMedia
                imagenes={extra.imagenes}
                imagenUrl={extra.imagenUrl}
                videoUrl={extra.videoUrl}
                nombre={extra.nombre}
              />
              <h3 className="font-display text-lg font-bold text-primary">{extra.nombre}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                {extra.descripcion || 'Servicio adicional configurable para tu evento.'}
              </p>
              <div className="mt-5 flex justify-end">
                <StatusBadge selected={selected} />
              </div>
            </motion.article>
          );
        })}
      </div>
    </SectionShell>
  );
}
