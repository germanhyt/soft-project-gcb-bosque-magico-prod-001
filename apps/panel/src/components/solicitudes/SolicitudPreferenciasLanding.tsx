import type { Solicitud } from '../../lib/api';
import { CARD_CLASS } from '../../constants/design';
import { resumenPreferenciasLanding } from '../../lib/solicitud-cotizacion';

type Props = {
  solicitud: Solicitud;
};

export function SolicitudPreferenciasLanding({ solicitud }: Props) {
  const resumen = resumenPreferenciasLanding(solicitud);
  if (!resumen) return null;

  return (
    <section className={`p-4 ${CARD_CLASS}`}>
      <h3 className="text-label-caps text-outline">Selección del cotizador</h3>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        {resumen.paquete && (
          <div>
            <dt className="text-label-caps text-outline">Paquete</dt>
            <dd className="mt-0.5 font-semibold text-on-surface">{resumen.paquete}</dd>
          </div>
        )}
        {resumen.cumpleanero && (
          <div>
            <dt className="text-label-caps text-outline">Cumpleañero</dt>
            <dd className="mt-0.5 font-medium text-on-surface">{resumen.cumpleanero}</dd>
          </div>
        )}
        {resumen.tematica && (
          <div className="sm:col-span-2">
            <dt className="text-label-caps text-outline">Temática</dt>
            <dd className="mt-0.5 font-medium text-on-surface">{resumen.tematica}</dd>
          </div>
        )}
      </dl>
      {resumen.items.length > 0 && (
        <ul className="mt-4 divide-y divide-surface-variant rounded-lg border border-surface-variant bg-surface-container-lowest">
          {resumen.items.map((item, i) => (
            <li
              key={`${item.nombre}-${i}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-body-sm"
            >
              <span className="text-on-surface">{item.nombre}</span>
              <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                ×{item.cantidad}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
