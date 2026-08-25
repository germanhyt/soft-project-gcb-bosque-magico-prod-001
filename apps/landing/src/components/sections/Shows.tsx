import { motion, useReducedMotion } from 'framer-motion';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { CatalogConnectionAlert } from '../ui/CatalogConnectionAlert';
import { CARD_CATALOG, GRID_CATALOG, cardCatalogState } from '../../constants/design';
import { selectionHint, type SelectionMode } from '../../lib/selection-mode';
import { esPaquetePersonalizado, esShowPersonalizado } from '../../types/quote-builder';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { SelectionHint } from '../ui/SelectionHint';
import { CatalogProductMedia } from '../ui/CatalogProductMedia';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selectionMode: SelectionMode;
  selectedShowIds: string[];
  paquete?: string;
  onToggleShow: (showId: string, checked: boolean) => void;
};

export function Shows({ selectionMode, selectedShowIds, paquete, onToggleShow }: Props) {
  const { data, isError, isLoading } = useConfiguracion();
  const reduceMotion = useReducedMotion();
  const personalizado = esPaquetePersonalizado(paquete ?? '');
  const shows =
    (data?.productos.shows ?? [])
      .filter((show) => !personalizado || esShowPersonalizado(show))
      .map((show) => ({
        id: show.id,
        nombre: show.nombre,
        imagenUrl: show.imagenUrl,
        imagenes: show.imagenes,
        videoUrl: show.videoUrl,
        detalle: show.descripcion || 'Show disponible para complementar tu celebración.',
      }));

  return (
    <SectionShell id="shows">
      <SectionTitle pill="Shows" title="Entretenimiento para todas las edades" />
      <SelectionHint>{selectionHint(selectionMode)}</SelectionHint>
      <CatalogConnectionAlert className="mb-6" />
      {isLoading && (
        <p className="mb-6 text-sm text-on-surface-variant">Cargando shows disponibles…</p>
      )}
      {!isLoading && !isError && shows.length === 0 && (
        <p className="mb-6 text-sm text-on-surface-variant">
          No hay shows activos en el catálogo por el momento.
        </p>
      )}
      <div className={GRID_CATALOG}>
        {shows.map((show, index) => {
          const selected = Boolean(show.id && selectedShowIds.includes(show.id));
          return (
            <motion.article
              key={`${show.id || 'fallback'}-${show.nombre}`}
              role={show.id ? 'button' : undefined}
              tabIndex={show.id ? 0 : undefined}
              onClick={() => {
                if (!show.id) return;
                if (personalizado && selected) return;
                onToggleShow(show.id, !selected);
              }}
              onKeyDown={(event) => {
                if (!show.id) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                if (personalizado && selected) return;
                onToggleShow(show.id, !selected);
              }}
              className={`${CARD_CATALOG} ${cardCatalogState(selected)}`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <CatalogProductMedia
                imagenes={show.imagenes}
                imagenUrl={show.imagenUrl}
                videoUrl={show.videoUrl}
                nombre={show.nombre}
              />
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
