import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AREA_PEDIDO_LABEL,
  AREAS_PEDIDO_FILTRO,
  ETAPA_PEDIDO_LABEL,
  ETAPAS_PEDIDO_FILTRO,
  ETAPAS_PEDIDO_OPCIONES,
} from '../constants/pedidos';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { TURNO_LABEL } from '../constants/solicitudes';
import { CARD_CLASS, INPUT_CLASS, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants/design';
import { parseMesParam, rangoMes } from '../lib/agenda-calendar';
import { DEFAULT_PAGE_SIZE, type PageSize } from '../lib/pagination';
import { actualizarPedido } from '../lib/pedidos-api';
import type { AreaPedido, EtapaPedido } from '../lib/pedidos';
import { fetchPedidosOperaciones } from '../lib/tareas-api';
import { formatFecha, formatFechaHora } from '../lib/format';
import { mostrarFeedbackNotificacionProveedor } from '../lib/notificacion-pedido-proveedor-feedback';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { FilterSelect } from '../components/ui/FilterSelect';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import {
  PedidoOperacionesRowActions,
  puedeOperarPedidosEvento,
  type PedidoOperaciones,
} from '../components/pedidos/PedidoOperacionesRowActions';

function rangoMesCompletoActual() {
  const { year, month } = parseMesParam(null);
  return rangoMes(year, month);
}

function coincideBusqueda(q: string, pedido: PedidoOperaciones) {
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
  const qc = useQueryClient();
  const def = rangoMesCompletoActual();
  const [desde, setDesde] = useState(def.desde);
  const [hasta, setHasta] = useState(def.hasta);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState<'' | EtapaPedido>('');
  const [filtroArea, setFiltroArea] = useState<'' | AreaPedido>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const { data: pedidos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['pedidos-operaciones', desde, hasta],
    queryFn: () => fetchPedidosOperaciones(desde, hasta),
  });

  const actualizarEtapaMut = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: EtapaPedido; eventoId: string }) =>
      actualizarPedido(id, { etapa }),
    onSuccess: async (res, { eventoId, etapa }) => {
      qc.invalidateQueries({ queryKey: ['pedidos-operaciones'] });
      qc.invalidateQueries({ queryKey: ['pedidos-evento', eventoId] });
      if (etapa === 'solicitado') {
        await mostrarFeedbackNotificacionProveedor(res.notificacionProveedor);
      }
    },
  });

  const pedidosFiltrados = useMemo(
    () =>
      pedidos.filter((p) => {
        if (filtroEtapa && p.etapa !== filtroEtapa) return false;
        if (filtroArea && p.area !== filtroArea) return false;
        return coincideBusqueda(busqueda, p);
      }),
    [pedidos, busqueda, filtroEtapa, filtroArea],
  );

  const hermanosPorPedido = useMemo(() => {
    const map = new Map<string, PedidoOperaciones[]>();
    for (const p of pedidos) {
      if (p.tipo !== 'proveedor') continue;
      const key = `${p.evento.id}:${p.proveedorId ?? p.proveedor?.nombre ?? p.id}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    const byId = new Map<string, PedidoOperaciones[]>();
    for (const list of map.values()) {
      for (const item of list) byId.set(item.id, list);
    }
    return byId;
  }, [pedidos]);

  useEffect(() => {
    setPage(1);
  }, [desde, hasta, busqueda, filtroEtapa, filtroArea, pageSize]);

  const totalPages = Math.max(1, Math.ceil(pedidosFiltrados.length / pageSize));
  const pedidosPaginados = useMemo(() => {
    const start = (page - 1) * pageSize;
    return pedidosFiltrados.slice(start, start + pageSize);
  }, [pedidosFiltrados, page, pageSize]);

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

      <TableFiltersPanel className="mb-4" onRefresh={() => refetch()}>
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
        <FilterSelect
          label="Estado"
          value={filtroEtapa}
          onChange={setFiltroEtapa}
          options={ETAPAS_PEDIDO_FILTRO}
        />
        <FilterSelect
          label="Área"
          value={filtroArea}
          onChange={setFiltroArea}
          options={AREAS_PEDIDO_FILTRO}
        />
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
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          ) : undefined
        }
      >
        <table className="w-full text-left text-body-sm">
          <thead>
            <tr className={TABLE_HEAD_CLASS}>
              <th className="px-4 py-3">Registro</th>
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
                <td colSpan={8} className="px-4 py-6 text-outline">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading &&
              pedidosPaginados.map((p) => {
                const puedeOperar = puedeOperarPedidosEvento(p.evento.etapa);
                return (
                  <tr key={p.id} className={TABLE_ROW_CLASS}>
                    <td className="px-4 py-3 text-xs text-outline whitespace-nowrap">
                      {p.creadoEn ? formatFechaHora(p.creadoEn) : '—'}
                    </td>
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
                      <select
                        className="min-w-[120px] rounded-lg border border-surface-variant bg-surface-container-low px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                        value={p.etapa}
                        disabled={!puedeOperar || actualizarEtapaMut.isPending}
                        title={
                          puedeOperar
                            ? 'Cambiar estado del pedido'
                            : 'El evento no permite editar pedidos'
                        }
                        onChange={(e) =>
                          actualizarEtapaMut.mutate({
                            id: p.id,
                            etapa: e.target.value as EtapaPedido,
                            eventoId: p.evento.id,
                          })
                        }
                      >
                        {ETAPAS_PEDIDO_OPCIONES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">S/ {p.costo.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <PedidoOperacionesRowActions
                        pedido={p}
                        pedidosMismoProveedor={hermanosPorPedido.get(p.id)}
                        onVerEvento={(eventoId) => navigate(`/agenda?detalle=${eventoId}`)}
                      />
                    </td>
                  </tr>
                );
              })}
            {!isLoading && pedidosFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-outline">
                  {pedidos.length === 0
                    ? 'No hay pedidos pendientes en el rango seleccionado.'
                    : 'Ningún pedido coincide con los filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
