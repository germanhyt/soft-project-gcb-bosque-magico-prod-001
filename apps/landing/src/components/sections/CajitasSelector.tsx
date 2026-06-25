import { useMemo } from 'react';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { paquetesConfigDesdeItems } from '../../lib/paquetes-config';
import { type QuoteBuilderSelection } from '../../types/quote-builder';
import { formatSoles } from '../../lib/pricing';
import { INPUT_CLASS } from '../../constants/design';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';

type Props = {
  selection: QuoteBuilderSelection;
  onChange: (cantidad: number) => void;
};

export function CajitasSelector({ selection, onChange }: Props) {
  const { data } = useConfiguracion();
  const paquetesConfig = useMemo(
    () => paquetesConfigDesdeItems(data?.items),
    [data?.items],
  );
  const incluidas = paquetesConfig.cajitasIncluidas;
  const precioExcedente = paquetesConfig.cajitasPrecioExcedente;

  const excedente = Math.max(0, selection.cajitasCantidad - incluidas);
  const costoExcedente = excedente * precioExcedente;

  if (!selection.paquete) return null;

  return (
    <SectionShell id="cajitas" tone="default">
      <SectionTitle
        pill="Cajitas"
        title="Cajitas Bosque Mágico"
        subtitle={`Tu paquete incluye ${incluidas} cajitas. Puedes solicitar más a ${formatSoles(precioExcedente)} c/u.`}
      />
      <div className="mx-auto max-w-md rounded-2xl border border-surface-variant bg-surface-container-low/80 p-6">
        <label className="block">
          <span className="text-sm font-medium">Cantidad de cajitas</span>
          <input
            type="number"
            min={incluidas}
            max={200}
            className={`${INPUT_CLASS} mt-2`}
            value={selection.cajitasCantidad}
            onChange={(e) => onChange(Math.max(incluidas, Number(e.target.value) || incluidas))}
          />
        </label>
        <dl className="mt-4 space-y-2 text-sm text-on-surface-variant">
          <div className="flex justify-between">
            <dt>Incluidas en paquete</dt>
            <dd>{incluidas}</dd>
          </div>
          {excedente > 0 && (
            <div className="flex justify-between font-semibold text-primary">
              <dt>Adicionales ({excedente} × {formatSoles(precioExcedente)})</dt>
              <dd>{formatSoles(costoExcedente)}</dd>
            </div>
          )}
        </dl>
      </div>
    </SectionShell>
  );
}
