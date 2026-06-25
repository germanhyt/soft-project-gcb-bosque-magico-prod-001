import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContratoBadge } from '../components/contratos/ContratoBadge';
import { ContratoDetalle } from '../components/contratos/ContratoDetalle';
import { AlertError } from '../components/ui/Alert';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { FilterSelect } from '../components/ui/FilterSelect';
import { PageHeader } from '../components/ui/PageHeader';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { TableStatusMessage } from '../components/ui/TableStatusMessage';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { ETAPAS_CONTRATO_FILTRO } from '../constants/contratos';
import {
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  TABLE_ROW_SELECTED,
} from '../constants/design';
import { TURNO_LABEL } from '../constants/solicitudes';
import { fetchContratos, type EtapaContrato } from '../lib/contratos';
import { useListPagination } from '../hooks/useListPagination';
import { formatFecha, formatFechaHora } from '../lib/format';

export function ContratosPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const etapa = (searchParams.get('etapa') ?? '') as '' | EtapaContrato;
  const qParam = searchParams.get('q') ?? '';
  const detalleParam = searchParams.get('detalle');
  const { page, pageSize, setPage, setPageSize } = useListPagination();
  const [busqueda, setBusqueda] = useState(qParam);
  const [selectedId, setSelectedId] = useState<string | null>(detalleParam);

  useEffect(() => {
    if (detalleParam) setSelectedId(detalleParam);
  }, [detalleParam]);

  useEffect(() => setBusqueda(qParam), [qParam]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      const trimmed = busqueda.trim();
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      next.delete('page');
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [busqueda, searchParams, setSearchParams]);

  const { data: paginated, isLoading, isError } = useQuery({
    queryKey: ['contratos', etapa || 'todos', qParam, page, pageSize],
    queryFn: () =>
      fetchContratos(etapa || undefined, {
        page,
        pageSize,
        q: qParam || undefined,
      }),
  });

  const data = paginated?.items ?? [];
  const meta = paginated?.meta;
  const selectedRow = data.find((r) => r.id === selectedId);

  const abrirDetalle = (id: string) => {
    setSelectedId(id);
    const next = new URLSearchParams(searchParams);
    next.set('detalle', id);
    setSearchParams(next, { replace: true });
  };

  const cerrarDetalle = () => {
    setSelectedId(null);
    const next = new URLSearchParams(searchParams);
    next.delete('detalle');
    setSearchParams(next, { replace: true });
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    const next = new URLSearchParams(searchParams);
    next.delete('etapa');
    next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  const countLabel =
    meta && !isLoading && !isError
      ? `${meta.total} contrato${meta.total === 1 ? '' : 's'}`
      : undefined;

  return (
    <div>
      <PageHeader breadcrumbs={[CRUMB_INICIO, crumb('Contratos')]} count={countLabel} />

      <p className="mb-4 text-body-sm text-on-surface-variant">
        Los contratos se generan desde un evento en Agenda o desde una cotización aceptada.
      </p>

      <TableFiltersPanel
        className="mb-4"
        onRefresh={() => void qc.invalidateQueries({ queryKey: ['contratos'] })}
      >
        <FilterSearchInput
          inline
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Número, cliente, celular o cotización…"
        />
        <FilterSelect
          inline
          label="Estado"
          value={etapa}
          options={ETAPAS_CONTRATO_FILTRO}
          onChange={(value) => {
            const next = new URLSearchParams(searchParams);
            if (value) next.set('etapa', value);
            else next.delete('etapa');
            next.delete('page');
            setSearchParams(next);
          }}
        />
        {(etapa || qParam) && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="h-[42px] shrink-0 px-3 text-body-sm font-semibold text-secondary hover:text-primary hover:underline"
          >
            Limpiar
          </button>
        )}
      </TableFiltersPanel>

      {isError && (
        <AlertError>
          No se pudieron cargar los contratos. Verifica que la migración de contratos esté aplicada.
        </AlertError>
      )}

      <DataTableCard
        footer={
          <DataTablePagination
            page={meta?.page ?? page}
            totalPages={meta?.totalPages ?? 1}
            total={meta?.total ?? 0}
            pageSize={meta?.pageSize ?? pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      >
        <table className="w-full text-left text-body-sm">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="text-on-surface">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-outline">
                  Cargando…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6" />
              </tr>
            ) : (
              data.map((c) => {
                const snap = c.snapshotJson;
                const fecha = snap?.evento.fechaEvento ?? c.evento?.fechaEvento;
                const turno = snap?.evento.turno ?? c.evento?.turno;
                const cliente =
                  snap?.cliente.nombreCompleto ?? c.evento?.cliente.nombreCompleto ?? '—';
                const celular = snap?.cliente.celular ?? c.evento?.cliente.celular ?? '';

                return (
                  <tr
                    key={c.id}
                    className={`${TABLE_ROW_CLASS} cursor-pointer ${
                      selectedId === c.id ? TABLE_ROW_SELECTED : ''
                    }`}
                    onClick={() => abrirDetalle(c.id)}
                  >
                    <td className="px-4 py-3 text-xs text-outline">
                      {formatFechaHora(c.creadoEn)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{c.numero}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{cliente}</span>
                      {celular && (
                        <p className="text-on-surface-variant">{celular}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {fecha ? formatFecha(fecha) : '—'}
                      {turno && (
                        <span className="text-on-surface-variant">
                          {' '}
                          · {TURNO_LABEL[turno] ?? turno}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      S/ {c.montoTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <ContratoBadge etapa={c.etapa} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!isLoading && !isError && data.length === 0 && (
          <TableStatusMessage message="No hay contratos para los filtros seleccionados. Genera uno desde Agenda." />
        )}
      </DataTableCard>

      <ContratoDetalle
        contratoId={selectedId}
        listItem={selectedRow}
        open={!!selectedId}
        onClose={cerrarDetalle}
      />
    </div>
  );
}
