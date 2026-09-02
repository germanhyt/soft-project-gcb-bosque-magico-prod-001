import { useConfiguracion } from '../../hooks/useConfiguracion';
import { esPaquetePremium, type QuoteBuilderSelection } from '../../types/quote-builder';
import { CARD_CATALOG, GRID_CATALOG } from '../../constants/design';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { StatusBadge } from '../ui/StatusBadge';
import { paquetesConfigDesdeItems } from '../../lib/paquetes-config';

type Props = {
  selection: QuoteBuilderSelection;
  onSelectSnack: (snackId: string) => void;
  onSnackCantidad: (cantidad: number) => void;
};

export function SnackPremiumSelector({
  selection,
  onSelectSnack,
  onSnackCantidad,
}: Props) {
  const { data } = useConfiguracion();
  const snacks = data?.productos.snacks ?? [];
  const paquetesConfig = paquetesConfigDesdeItems(data?.items);
  const unidadesIncluidas = paquetesConfig.snackPremiumUnidadesIncluidas;
  const precioExcedente = paquetesConfig.snackPremiumPrecioExcedente;

  if (!selection.paquete || !esPaquetePremium(selection.paquete)) return null;

  return (
    <SectionShell id="snack-premium" tone="default">
      <SectionTitle
        pill="Snack Premium"
        title="Popcorn o algodón de azúcar"
        subtitle={`Incluye ${unidadesIncluidas} unidades del carrito snack. Unidades adicionales: S/ ${precioExcedente} c/u.`}
      />
      <div className={GRID_CATALOG}>
        {snacks.map((s) => {
          const selected = selection.snackId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSnack(selected ? '' : s.id)}
              className={`${CARD_CATALOG} text-left ${selected ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{s.nombre}</p>
                {selected && <StatusBadge selected selectedLabel="Incluido" />}
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">Incluido en Premium</p>
            </button>
          );
        })}
      </div>
      {selection.snackId && (
        <label className="mt-3 block max-w-xs">
          <span className="text-sm font-medium text-on-surface">Unidades de snack</span>
          <input
            type="number"
            min={0}
            placeholder={`Ej. ${unidadesIncluidas} incluidas`}
            value={selection.snackCantidad || ''}
            onChange={(e) =>
              onSnackCantidad(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0))
            }
            className="mt-1 w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
          <span className="mt-1 block text-xs text-on-surface-variant">
            {unidadesIncluidas} unidades incluidas en Premium; cada unidad adicional cuesta S/ {precioExcedente}.
          </span>
        </label>
      )}
    </SectionShell>
  );
}
