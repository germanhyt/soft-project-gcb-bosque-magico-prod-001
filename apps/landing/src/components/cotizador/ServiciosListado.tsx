import {
  filasTablaCotizacionPrint,
  type CotizacionPrintData,
  type FilaPrintCotizacion,
} from '@bosque/shared';

type Props = {
  cot: CotizacionPrintData;
  className?: string;
};

function Fila({ fila }: { fila: FilaPrintCotizacion }) {
  if (fila.clase === 'seccion') {
    return (
      <li className="pt-2">
        <p className="text-label-caps text-outline">{fila.nombre}</p>
      </li>
    );
  }

  if (fila.clase === 'paquete') {
    return (
      <li className="flex justify-between gap-3 border-b border-surface-variant py-2">
        <span>
          <span className="font-semibold text-primary">{fila.nombre}</span>
          {fila.descripcion ? (
            <span className="mt-0.5 block text-xs text-on-surface-variant">
              {fila.descripcion}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 font-semibold">{fila.subtotal}</span>
      </li>
    );
  }

  const incluido = fila.unitario === '—';
  const indent = fila.clase === 'subitem';
  return (
    <li className={`flex justify-between gap-3 py-1.5 ${indent ? 'pl-3' : ''}`}>
      <span className="min-w-0">
        <span className="font-medium">{fila.nombre}</span>
        {fila.cantidad ? (
          <span className="text-sm text-on-surface-variant"> × {fila.cantidad}</span>
        ) : null}
        {fila.descripcion ? (
          <span className="mt-0.5 block text-xs text-outline">{fila.descripcion}</span>
        ) : null}
      </span>
      <span className="shrink-0 font-semibold">
        {incluido ? 'Incluido' : fila.subtotal}
      </span>
    </li>
  );
}

export function ServiciosListado({ cot, className }: Props) {
  const filas = filasTablaCotizacionPrint(cot);
  if (!filas.length) return null;
  return (
    <div className={className}>
      <h3 className="font-bold text-primary">Detalle de servicios</h3>
      <ul className="mt-2 divide-y divide-surface-variant/50">
        {filas.map((f, idx) => (
          <Fila key={`${f.clase}-${idx}`} fila={f} />
        ))}
      </ul>
    </div>
  );
}
