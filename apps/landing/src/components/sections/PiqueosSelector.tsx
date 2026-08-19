import { useMemo } from 'react';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { calcularResumenPiqueosCredito } from '../../lib/piqueos-credito';
import { paquetesConfigDesdeItems } from '../../lib/paquetes-config';
import { formatSoles, isWeekend } from '../../lib/pricing';
import {
  esPaquetePremium,
  type QuoteBuilderSelection,
} from '../../types/quote-builder';
import { CARD_CATALOG, GRID_CATALOG, INPUT_CLASS, cardCatalogState } from '../../constants/design';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selection: QuoteBuilderSelection;
  fechaReferencia?: string;
  onTogglePiqueo: (productoId: string, checked: boolean) => void;
  onCantidadPiqueo: (productoId: string, cantidad: number) => void;
};

export function PiqueosSelector({
  selection,
  fechaReferencia,
  onTogglePiqueo,
  onCantidadPiqueo,
}: Props) {
  const { data } = useConfiguracion();
  const piqueos = data?.productos.piqueos ?? [];
  const feriados = data?.feriados ?? [];
  const paquetesConfig = useMemo(
    () => paquetesConfigDesdeItems(data?.items),
    [data?.items],
  );
  const credito = esPaquetePremium(selection.paquete) ? paquetesConfig.piqueosCreditoPremium : 0;
  const conCredito = credito > 0;

  const esFds = isWeekend(fechaReferencia ?? '', feriados);

  const { creditoUsado, excedente } = useMemo(() => {
    const entradas = selection.piqueoIds.map((id) => {
      const p = piqueos.find((x) => x.id === id);
      if (!p) return null;
      const precio = esFds ? p.precioFinSemana : p.precioLunesViernes;
      return {
        precioPack: precio,
        cantidadPacks: Math.max(selection.piqueosCantidades[id] ?? 1, 1),
      };
    }).filter(Boolean) as Array<{ precioPack: number; cantidadPacks: number }>;

    const r = calcularResumenPiqueosCredito(entradas, credito);
    return { creditoUsado: r.creditoUsado, excedente: r.excedente };
  }, [selection.piqueoIds, selection.piqueosCantidades, piqueos, esFds, credito]);

  if (!selection.paquete) return null;

  return (
    <SectionShell id="piqueos" tone="alt">
      <SectionTitle
        pill={conCredito ? 'Piqueos Premium' : 'Piqueos'}
        title="Arma tu bandeja de piqueos"
        subtitle={
          conCredito
            ? `Elige packs de la carta. Crédito incluido: ${formatSoles(credito)} (precio por pack completo).`
            : 'Piqueos a precio de carta. El crédito de S/ 200 aplica solo en paquete Premium (configurable en el panel).'
        }
      />    
      {conCredito && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary-fixed/15 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              Crédito usado: <strong>{formatSoles(creditoUsado)}</strong> / {formatSoles(credito)}
            </span>
            {excedente > 0 && (
              <span className="font-semibold text-tertiary">
                + {formatSoles(excedente)} adicional
              </span>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-variant">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (creditoUsado / credito) * 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className={GRID_CATALOG}>
        {piqueos.map((p) => {
          const selected = selection.piqueoIds.includes(p.id);
          const precio = esFds ? p.precioFinSemana : p.precioLunesViernes;
          const uds = p.unidadesPack ?? 1;
          const qty = Math.max(selection.piqueosCantidades[p.id] ?? 1, 1);

          return (
            <article
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onTogglePiqueo(p.id, !selected)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onTogglePiqueo(p.id, !selected);
                }
              }}
              className={`${CARD_CATALOG} cursor-pointer ${cardCatalogState(selected)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface">{p.nombre}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Pack {uds} uds · {formatSoles(precio)} / pack
                  </p>
                </div>
                <StatusBadge selected={selected} selectedLabel="Elegido" />
              </div>
              {selected && (
                <div
                  className="mt-3 flex items-center gap-2 border-t border-surface-variant pt-3 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <span className="text-on-surface-variant">Packs</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={`${INPUT_CLASS} max-w-20`}
                    value={qty}
                    onChange={(e) =>
                      onCantidadPiqueo(p.id, Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                  <span className="text-xs text-outline">= {qty * uds} porciones</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
