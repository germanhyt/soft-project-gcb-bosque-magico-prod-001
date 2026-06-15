import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AREA_PEDIDO_LABEL,
  ETAPA_PEDIDO_BADGE,
  ETAPA_PEDIDO_LABEL,
} from '../constants/pedidos';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { TURNO_LABEL } from '../constants/solicitudes';
import { CARD_CLASS, INPUT_CLASS, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants/design';
import { isoFechaLocal } from '../lib/fecha-calendario';
import { fetchPedidosOperaciones } from '../lib/tareas-api';
import { formatFecha } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableCard } from '../components/ui/DataTableCard';
import { Button } from '../components/ui/Button';

function rangoSemana() {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - hoy.getDay());
  const hasta = new Date(desde);
  hasta.setDate(desde.getDate() + 13);
  return { desde: isoFechaLocal(desde), hasta: isoFechaLocal(hasta) };
}

export function OperacionesPage() {
  const navigate = useNavigate();
  const def = rangoSemana();
  const [desde, setDesde] = useState(def.desde);
  const [hasta, setHasta] = useState(def.hasta);

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['pedidos-operaciones', desde, hasta],
    queryFn: () => fetchPedidosOperaciones(desde, hasta),
  });

  const totalCosto = useMemo(() => pedidos.reduce((n, p) => n + p.costo, 0), [pedidos]);

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Operaciones')]}
        count={!isLoading ? `${pedidos.length} pedido${pedidos.length === 1 ? '' : 's'}` : undefined}
      />

      <div className={`mb-4 flex flex-wrap items-end gap-3 p-4 ${CARD_CLASS}`}>
        <label className="flex flex-col gap-1 text-body-sm">
          Desde
          <input
            type="date"
            className={`${INPUT_CLASS} h-[42px]`}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-body-sm">
          Hasta
          <input
            type="date"
            className={`${INPUT_CLASS} h-[42px]`}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        {pedidos.length > 0 && (
          <p className="text-body-sm text-outline">Costo estimado: S/ {totalCosto.toFixed(2)}</p>
        )}
      </div>

      {isError && <p className="text-error">No se pudieron cargar los pedidos.</p>}

      <DataTableCard>
        <table className="w-full text-left text-body-sm">
          <thead>
            <tr className={TABLE_HEAD_CLASS}>
              <th className="px-4 py-3">Fecha evento</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-outline">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading &&
              pedidos.map((p) => (
                <tr key={p.id} className={TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatFecha(p.evento.fechaEvento)}
                    <span className="block text-xs text-outline">
                      {TURNO_LABEL[p.evento.turno] ?? p.evento.turno}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.evento.cliente.nombreCompleto}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.nombre}</span>
                    {p.proveedor && (
                      <span className="block text-xs text-outline">{p.proveedor.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-outline">
                    {AREA_PEDIDO_LABEL[p.area]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ETAPA_PEDIDO_BADGE[p.etapa]}`}
                    >
                      {ETAPA_PEDIDO_LABEL[p.etapa]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">S/ {p.costo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => navigate(`/agenda?detalle=${p.evento.id}`)}
                    >
                      Ver evento
                    </Button>
                  </td>
                </tr>
              ))}
            {!isLoading && pedidos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-outline">
                  No hay pedidos pendientes en el rango seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
