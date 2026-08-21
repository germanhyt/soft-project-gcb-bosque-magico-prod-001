import { motion, useReducedMotion } from 'framer-motion';
import {
  CARD_CATALOG,
  GRID_CATALOG,
  INPUT_CLASS,
  cardCatalogState,
} from '../../constants/design';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { formatSoles } from '../../lib/pricing';
import { selectionHint, type SelectionMode } from '../../lib/selection-mode';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { SelectionHint } from '../ui/SelectionHint';
import { CatalogProductMedia } from '../ui/CatalogProductMedia';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selectionMode: SelectionMode;
  selectedExtraIds: string[];
  extraCantidades: Record<string, number>;
  onToggleExtra: (extraId: string, checked: boolean) => void;
  onCantidadExtra: (extraId: string, cantidad: number) => void;
};

export function Extras({
  selectionMode,
  selectedExtraIds,
  extraCantidades,
  onToggleExtra,
  onCantidadExtra,
}: Props) {
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
          const qty = Math.max(extraCantidades[extra.id] ?? 1, 1);
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
              <p className="mt-2 text-xs text-on-surface-variant">
                desde {formatSoles(extra.precioLunesViernes)} / hora
              </p>
              <div className="mt-5 flex items-center justify-between gap-2">
                {selected ? (
                  <div
                    className="flex items-center gap-2 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <span className="text-on-surface-variant">Horas</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className={`${INPUT_CLASS} max-w-20`}
                      value={qty}
                      onChange={(e) =>
                        onCantidadExtra(extra.id, Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </div>
                ) : (
                  <span />
                )}
                <StatusBadge selected={selected} />
              </div>
            </motion.article>
          );
        })}
      </div>
    </SectionShell>
  );
}
