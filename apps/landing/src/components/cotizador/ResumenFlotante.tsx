import { useEffect, useRef, useState } from 'react';
import { formatSoles } from '../../lib/pricing';
import type { ResumenEstimado } from '../../types/resumen';

type Props = {
  estimado: ResumenEstimado | null;
};

export function ResumenFlotante({ estimado }: Props) {
  const [expandido, setExpandido] = useState(false);
  const [ocultoPorForm, setOcultoPorForm] = useState(false);
  const cotizarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = document.getElementById('cotizar');
    if (!target) return;
    cotizarRef.current = target;
    const observer = new IntersectionObserver(
      ([entry]) => setOcultoPorForm(entry.isIntersecting),
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const visible = estimado?.tienePaquete && !ocultoPorForm;
  if (!visible || !estimado) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="region"
      aria-label="Resumen referencial de tu cotización"
    >
      <div className="mx-auto max-w-(--width-container) px-4 pb-4">
        <div className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest/95 shadow-ambient backdrop-blur">
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={expandido}
            aria-controls="resumen-flotante-detalle"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-outline">
                Total estimado {estimado.cargando && estimado.listo ? '…' : ''}
              </span>
              <span className="block font-display text-lg font-bold text-primary">
                {estimado.listo ? formatSoles(estimado.total) : 'Calculando…'}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">
                {estimado.cantidadItems > 0
                  ? `${estimado.cantidadItems} ítem${estimado.cantidadItems > 1 ? 's' : ''}`
                  : 'Paquete'}
              </span>
              <svg
                className={`h-5 w-5 shrink-0 text-primary transition-transform ${expandido ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>

          {expandido && estimado.listo && (
            <dl
              id="resumen-flotante-detalle"
              className="space-y-2 border-t border-surface-variant px-4 py-3 text-sm"
            >
              <div className="flex justify-between">
                <dt>Paquete / tarifa base ({estimado.esFinSemana ? 'fin de semana' : 'L-V'})</dt>
                <dd className="font-semibold">{formatSoles(estimado.base)}</dd>
              </div>
              {estimado.extraNinos > 0 && (
                <div className="flex justify-between">
                  <dt>Cargos por capacidad</dt>
                  <dd className="font-semibold">{formatSoles(estimado.extraNinos)}</dd>
                </div>
              )}
              {estimado.items > 0 && (
                <div className="flex justify-between">
                  <dt>Complementos</dt>
                  <dd className="font-semibold">{formatSoles(estimado.items)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-surface-variant pt-2 text-base">
                <dt className="font-bold text-primary">Total estimado</dt>
                <dd className="font-bold text-primary">{formatSoles(estimado.total)}</dd>
              </div>
              {estimado.advertencia && (
                <p className="rounded-lg bg-tertiary-fixed/40 px-3 py-2 text-xs text-tertiary">
                  {estimado.advertencia}
                </p>
              )}
              <p className="text-xs text-outline">
                La cotización definitiva la confirma el equipo según disponibilidad.
              </p>
            </dl>
          )}

          <div className="px-4 pb-3">
            <a
              href="#cotizar"
              className="inline-flex w-full items-center justify-center rounded-xl bg-tertiary-fixed-dim px-6 py-3 font-display text-sm font-bold text-on-tertiary-fixed shadow-ambient transition hover:bg-secondary-container hover:text-on-secondary-container active:scale-[0.98]"
            >
              {estimado.cargando ? 'Cargando…' : 'Cotizar'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
