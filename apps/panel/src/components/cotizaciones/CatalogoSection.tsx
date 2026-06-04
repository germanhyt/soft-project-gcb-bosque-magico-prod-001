import type { Producto } from '../../lib/cotizaciones';
import { cantidadItemProducto } from '../../lib/producto-cotizacion';
import { INPUT_CLASS } from '../../constants/design';

type Props = {
  titulo: string;
  productos: Producto[];
  selectedIds: string[];
  cantidades: Record<string, number>;
  onToggle: (id: string) => void;
  onCantidad: (id: string, cantidad: number) => void;
};

export function CatalogoSection({
  titulo,
  productos,
  selectedIds,
  cantidades,
  onToggle,
  onCantidad,
}: Props) {
  if (!productos.length) return null;

  return (
    <div className="mt-4">
      <p className="text-label-caps text-outline">{titulo}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {productos.map((p) => {
          const selected = selectedIds.includes(p.id);
          const permiteCantidad = p.categoria === 'catering' || p.categoria === 'extra';
          const qty = cantidades[p.id] ?? cantidadItemProducto(p, {});

          return (
            <div
              key={p.id}
              className={`rounded-lg border p-3 ${
                selected ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant'
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={selected} onChange={() => onToggle(p.id)} />
                {p.imagenUrl && (
                  <img src={p.imagenUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{p.nombre}</span>
                  <span className="block text-xs text-on-surface-variant">
                    L-V S/ {p.precioLunesViernes} · FDS S/ {p.precioFinSemana}
                    {p.cantidadMinima > 1 ? ` · mín. ${p.cantidadMinima}` : ''}
                  </span>
                </span>
              </label>
              {selected && permiteCantidad && (
                <label className="mt-2 flex items-center gap-2 text-body-sm">
                  <span className="text-on-surface-variant">Cant.</span>
                  <input
                    type="number"
                    min={p.cantidadMinima}
                    className={`${INPUT_CLASS} max-w-24`}
                    value={qty}
                    onChange={(e) => onCantidad(p.id, Math.max(p.cantidadMinima, Number(e.target.value) || 0))}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
