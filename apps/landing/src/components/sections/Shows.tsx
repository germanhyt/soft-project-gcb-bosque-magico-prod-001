import { SHOWS } from '../../constants/content';
import { motion, useReducedMotion } from 'framer-motion';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { CARD_CATALOG, GRID_CATALOG, cardCatalogState } from '../../constants/design';
import { selectionHint, type SelectionMode } from '../../lib/selection-mode';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { SelectionHint } from '../ui/SelectionHint';
import { CatalogProductImage } from '../ui/CatalogProductImage';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selectionMode: SelectionMode;
  selectedShowIds: string[];
  onToggleShow: (showId: string, checked: boolean) => void;
};

export function Shows({ selectionMode, selectedShowIds, onToggleShow }: Props) {
  const { data } = useConfiguracion();
  const reduceMotion = useReducedMotion();
  const shows =
    data?.productos.shows?.map((show) => ({
      id: show.id,
      nombre: show.nombre,
      imagenUrl: show.imagenUrl,
      detalle: show.descripcion || 'Show disponible para complementar tu celebración.',
    })) ??
    SHOWS.map((show) => ({ id: '', imagenUrl: null as string | null, ...show }));

  return (
    <SectionShell id="shows">
      <SectionTitle pill="Shows" title="Entretenimiento para todas las edades" />
      <SelectionHint>{selectionHint(selectionMode)}</SelectionHint>
      <div className={GRID_CATALOG}>
        {shows.map((show, index) => {
          const selected = Boolean(show.id && selectedShowIds.includes(show.id));
          return (
            <motion.article
              key={`${show.id || 'fallback'}-${show.nombre}`}
              role={show.id ? 'button' : undefined}
              tabIndex={show.id ? 0 : undefined}
              onClick={() => show.id && onToggleShow(show.id, !selected)}
              onKeyDown={(event) => {
                if (!show.id) return;
                if (event.key === 'Enter' || event.key === ' ') onToggleShow(show.id, !selected);
              }}
              className={`${CARD_CATALOG} ${cardCatalogState(selected)}`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <CatalogProductImage imagenUrl={show.imagenUrl} nombre={show.nombre} />
              <h3 className="font-display text-lg font-bold text-primary">{show.nombre}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">{show.detalle}</p>
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
