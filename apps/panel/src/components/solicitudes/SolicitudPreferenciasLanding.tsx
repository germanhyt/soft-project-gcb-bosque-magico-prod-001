import type { Solicitud } from '../../lib/api';
import { resumenPreferenciasLanding } from '../../lib/solicitud-cotizacion';

type Props = {
  solicitud: Solicitud;
};

export function SolicitudPreferenciasLanding({ solicitud }: Props) {
  const resumen = resumenPreferenciasLanding(solicitud);
  if (!resumen) return null;

  return (
    <div className="mt-4 rounded-lg border border-surface-variant bg-surface-container-low p-3">
      <p className="text-label-caps text-outline">Selección del cotizador</p>
      {resumen.paquete && (
        <p className="mt-2 text-body-sm">
          <span className="text-on-surface-variant">Paquete: </span>
          <span className="font-semibold text-on-surface">{resumen.paquete}</span>
        </p>
      )}
      {resumen.cumpleanero && (
        <p className="mt-1 text-body-sm">
          <span className="text-on-surface-variant">Cumpleañero: </span>
          {resumen.cumpleanero}
        </p>
      )}
      {resumen.tematica && (
        <p className="mt-1 text-body-sm">
          <span className="text-on-surface-variant">Temática: </span>
          {resumen.tematica}
        </p>
      )}
      {resumen.items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {resumen.items.map((item, i) => (
            <li
              key={`${item.nombre}-${i}`}
              className="flex justify-between gap-2 rounded-md bg-surface px-2 py-1.5 text-body-sm"
            >
              <span className="text-on-surface">{item.nombre}</span>
              <span className="shrink-0 font-medium text-on-surface-variant">×{item.cantidad}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
