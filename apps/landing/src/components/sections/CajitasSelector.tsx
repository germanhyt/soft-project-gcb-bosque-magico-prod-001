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
  onChange: (payload: { clasica: number; saludable: number; total: number }) => void;
};

export function CajitasSelector({ selection, onChange }: Props) {
  const { data } = useConfiguracion();
  const paquetesConfig = useMemo(
    () => paquetesConfigDesdeItems(data?.items),
    [data?.items],
  );
  const incluidas = paquetesConfig.cajitasIncluidas;
  const precioExcedente = paquetesConfig.cajitasPrecioExcedente;

  const total = Math.max(
    selection.cajitasCantidad,
    (selection.cajitasClasica ?? 0) + (selection.cajitasSaludable ?? 0),
  );
  const excedente = Math.max(0, total - incluidas);
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
          <span className="text-sm font-medium">Cajitas clásicas</span>
          <input
            type="number"
            min={0}
            max={200}
            className={`${INPUT_CLASS} mt-2`}
            placeholder={`Ej. ${incluidas} incluidas`}
            value={selection.cajitasClasica || ''}
            onChange={(e) => {
              const clasica = Math.max(0, Number(e.target.value) || 0);
              const saludable = selection.cajitasSaludable;
              onChange({
                clasica,
                saludable,
                total: Math.max(incluidas, clasica + saludable),
              });
            }}
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm font-medium">Cajitas saludables</span>
          <input
            type="number"
            min={0}
            max={200}
            className={`${INPUT_CLASS} mt-2`}
            placeholder="Ej. 0"
            value={selection.cajitasSaludable || ''}
            onChange={(e) => {
              const saludable = Math.max(0, Number(e.target.value) || 0);
              const clasica = selection.cajitasClasica;
              onChange({
                clasica,
                saludable,
                total: Math.max(incluidas, clasica + saludable),
              });
            }}
          />
        </label>
        <dl className="mt-4 space-y-2 text-sm text-on-surface-variant">
          <div className="flex justify-between">
            <dt>Total cajitas</dt>
            <dd>{total}</dd>
          </div>
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
