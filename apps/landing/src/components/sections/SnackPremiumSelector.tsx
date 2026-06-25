import { useConfiguracion } from '../../hooks/useConfiguracion';
import { esPaquetePremium, type QuoteBuilderSelection } from '../../types/quote-builder';
import { CARD_CATALOG, GRID_CATALOG } from '../../constants/design';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selection: QuoteBuilderSelection;
  onSelectSnack: (snackId: string) => void;
};

export function SnackPremiumSelector({ selection, onSelectSnack }: Props) {
  const { data } = useConfiguracion();
  const snacks = data?.productos.snacks ?? [];

  if (!selection.paquete || !esPaquetePremium(selection.paquete)) return null;

  return (
    <SectionShell id="snack-premium" tone="default">
      <SectionTitle
        pill="Snack Premium"
        title="Popcorn o algodón de azúcar"
        subtitle="Elige uno incluido en tu paquete Premium."
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
    </SectionShell>
  );
}
