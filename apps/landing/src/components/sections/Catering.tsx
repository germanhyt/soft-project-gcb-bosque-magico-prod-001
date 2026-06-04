import { CATERING } from '../../constants/content';
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
  selectedCateringIds: string[];
  onToggleCatering: (cateringId: string, checked: boolean) => void;
};

export function Catering({ selectionMode, selectedCateringIds, onToggleCatering }: Props) {
  const { data } = useConfiguracion();
  const reduceMotion = useReducedMotion();
  const minimoGlobal =
    typeof data?.items.find((i) => i.clave === 'catering.minimo_unidades')?.valor === 'number'
      ? (data?.items.find((i) => i.clave === 'catering.minimo_unidades')?.valor as number)
      : 18;

  const catering =
    data?.productos.catering?.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      imagenUrl: item.imagenUrl,
      cantidadMinima: item.cantidadMinima,
      detalle:
        item.descripcion ||
        `Mínimo ${item.cantidadMinima} unidad${item.cantidadMinima > 1 ? 'es' : ''} por evento.`,
    })) ??
    CATERING.map((item) => ({
      id: '',
      imagenUrl: null as string | null,
      cantidadMinima: minimoGlobal,
      ...item,
    }));

  return (
    <SectionShell id="catering" tone="tinted">
      <SectionTitle
        pill="Catering"
        title="Snacks y dulces para complementar la fiesta"
        subtitle="El equipo confirma mínimos y disponibilidad al cotizar."
      />
      <SelectionHint>{selectionHint(selectionMode)}</SelectionHint>
      <div className={GRID_CATALOG}>
        {catering.map((item, index) => {
          const selected = item.id ? selectedCateringIds.includes(item.id) : false;
          return (
            <motion.article
              key={`${item.id || 'fallback'}-${item.nombre}`}
              role={item.id ? 'button' : undefined}
              tabIndex={item.id ? 0 : undefined}
              onClick={() => item.id && onToggleCatering(item.id, !selected)}
              onKeyDown={(event) => {
                if (!item.id) return;
                if (event.key === 'Enter' || event.key === ' ') onToggleCatering(item.id, !selected);
              }}
              className={`${CARD_CATALOG} ${cardCatalogState(selected)}`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <CatalogProductImage imagenUrl={item.imagenUrl} nombre={item.nombre} />
              <h3 className="font-display text-lg font-bold text-primary">{item.nombre}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">{item.detalle}</p>
              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-outline">Mín. {item.cantidadMinima} uds.</span>
                <StatusBadge selected={selected} />
              </div>
            </motion.article>
          );
        })}
      </div>
    </SectionShell>
  );
}
