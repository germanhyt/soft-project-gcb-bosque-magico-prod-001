import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AREA_PEDIDO_LABEL,
  ETAPA_PEDIDO_BADGE,
  ETAPA_PEDIDO_LABEL,
} from '../constants/pedidos';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { TURNO_LABEL } from '../constants/solicitudes';
import { CARD_CLASS, INPUT_CLASS, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants/design';
import { fechaCalendarioHoy } from '../lib/fecha-calendario';
import { DEFAULT_PAGE_SIZE } from '../lib/pagination';
import { fetchPedidosOperaciones } from '../lib/tareas-api';
import { formatFecha } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { Button } from '../components/ui/Button';

function rangoMesHastaHoy() {
  const hoy = fechaCalendarioHoy();
  const [y, m] = hoy.split('-');
  return { desde: `${y}-${m}-01`, hasta: hoy };
}

function coincideBusqueda(
  q: string,
  pedido: Awaited<ReturnType<typeof fetchPedidosOperaciones>>[number],
) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const campos = [
    pedido.nombre,
    pedido.proveedor?.nombre,
    pedido.evento.cliente.nombreCompleto,
    AREA_PEDIDO_LABEL[pedido.area],
    ETAPA_PEDIDO_LABEL[pedido.etapa],
  ];
  return campos.some((v) => v?.toLowerCase().includes(needle));
}

export function OperacionesPage() {
  const navigate = useNavigate();
  const def = rangoMesHastaHoy();
  const [desde, setDesde] = useState(def.desde);
  const [hasta, setHasta] = useState(def.hasta);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['pedidos-operaciones', desde, hasta],
    queryFn: () => fetchPedidosOperaciones(desde, hasta),
  });

  const pedidosFiltrados = useMemo(
    () => pedidos.filter((p) => coincideBusqueda(busqueda, p)),
    [pedidos, busqueda],
  );

  useEffect(() => {
    setPage(1);
  }, [desde, hasta, busqueda]);

  const totalPages = Math.max(1, Math.ceil(pedidosFiltrados.length / DEFAULT_PAGE_SIZE));
  const pedidosPaginados = useMemo(() => {
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    return pedidosFiltrados.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [pedidosFiltrados, page]);

  const totalCosto = useMemo(
    () => pedidosFiltrados.reduce((n, p) => n + p.costo, 0),
    [pedidosFiltrados],
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Operaciones')]}
        count={
          !isLoading
            ? `${pedidosFiltrados.length} pedido${pedidosFiltrados.length === 1 ? '' : 's'}`
            : undefined
        }
      />

      <TableFiltersPanel className="mb-4">
        <label className="flex min-w-[160px] flex-col gap-1 text-body-sm">
          Desde
          <input
            type="date"
            className={`${INPUT_CLASS} h-[42px]`}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-body-sm">
          Hasta
          <input
            type="date"
            className={`${INPUT_CLASS} h-[42px]`}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        <FilterSearchInput
          inline
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Cliente, pedido, área o estado…"
        />
      </TableFiltersPanel>

      {pedidosFiltrados.length > 0 && (
        <p className={`mb-4 px-4 py-3 text-body-sm text-outline ${CARD_CLASS}`}>
          Costo estimado (filtro actual): S/ {totalCosto.toFixed(2)}
        </p>
      )}

      {isError && <p className="text-error">No se pudieron cargar los pedidos.</p>}

      <DataTableCard
        footer={
          !isLoading && pedidosFiltrados.length > 0 ? (
            <DataTablePagination
              page={page}
              totalPages={totalPages}
              total={pedidosFiltrados.length}
              pageSize={DEFAULT_PAGE_SIZE}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
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
              pedidosPaginados.map((p) => (
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
            {!isLoading && pedidosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-outline">
                  {pedidos.length === 0
                    ? 'No hay pedidos pendientes en el rango seleccionado.'
                    : 'Ningún pedido coincide con la búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
