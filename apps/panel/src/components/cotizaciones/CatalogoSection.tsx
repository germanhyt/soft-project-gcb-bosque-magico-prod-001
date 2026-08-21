import type { ReactNode } from 'react';
import type { Producto } from '../../lib/cotizaciones';
import { cantidadItemProducto } from '../../lib/producto-cotizacion';
import { descripcionPrecioProducto } from '../../lib/origen-item';
import { INPUT_CLASS } from '../../constants/design';

type Props = {
  titulo: string;
  productos: Producto[];
  selectedIds: string[];
  cantidades: Record<string, number>;
  onToggle: (id: string) => void;
  onCantidad: (id: string, cantidad: number) => void;
  onEditar?: (producto: Producto) => void;
  headerExtra?: ReactNode;
};

function esPiqueo(p: Producto) {
  return p.subtipo === 'piqueo';
}

function etiquetaCantidad(p: Producto): string {
  return esPiqueo(p) ? 'Nº de packs' : 'Cantidad';
}

export function CatalogoSection({
  titulo,
  productos,
  selectedIds,
  cantidades,
  onToggle,
  onCantidad,
  onEditar,
  headerExtra,
}: Props) {
  if (!productos.length && !headerExtra) return null;

  return (
    <div className="mt-4">
      {(titulo || headerExtra) ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {titulo ? <p className="text-label-caps text-outline">{titulo}</p> : <span />}
          {headerExtra}
        </div>
      ) : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {productos.map((p) => {
          const selected = selectedIds.includes(p.id);
          const permiteCantidad = p.categoria === 'catering' || p.categoria === 'extra';
          const qty = cantidades[p.id] ?? cantidadItemProducto(p, {});
          const udsPack = p.unidadesPack ?? 1;

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggle(p.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onToggle(p.id);
                }
              }}
              className={`cursor-pointer rounded-lg border p-3 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  readOnly
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none mt-0.5 shrink-0"
                />
                {p.imagenUrl && (
                  <img src={p.imagenUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{p.nombre}</span>
                  <span className="block text-xs text-on-surface-variant">
                    {p.categoria === 'catering'
                      ? `S/ ${p.precioLunesViernes}`
                      : `L-V S/ ${p.precioLunesViernes} · FDS S/ ${p.precioFinSemana}`}
                    {p.categoria === 'extra' ? ' · por 1 h' : ''}
                    {esPiqueo(p)
                      ? ` · pack ${udsPack} uds (${descripcionPrecioProducto(p)})`
                      : p.cantidadMinima > 1
                        ? ` · mín. ${p.cantidadMinima}`
                        : ''}
                  </span>
                </span>
                {onEditar && (
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-secondary hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(p);
                    }}
                  >
                    Editar
                  </button>
                )}
              </div>
              {selected && permiteCantidad && (
                <div
                  className="mt-2 flex items-center gap-2 text-body-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <span className="text-on-surface-variant">{etiquetaCantidad(p)}</span>
                  <input
                    type="number"
                    min={p.cantidadMinima}
                    className={`${INPUT_CLASS} max-w-24`}
                    value={qty}
                    onChange={(e) => onCantidad(p.id, Math.max(p.cantidadMinima, Number(e.target.value) || 0))}
                  />
                  {esPiqueo(p) && (
                    <span className="text-xs text-outline">
                      = {(qty * udsPack).toLocaleString('es-PE')} porciones
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
