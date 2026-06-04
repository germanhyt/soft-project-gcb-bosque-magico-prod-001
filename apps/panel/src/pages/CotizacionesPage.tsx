import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CotizacionFormModal,
  type CotizacionFormTarget,
} from '../components/cotizaciones/CotizacionFormModal';
import { CotizacionDetalle } from '../components/cotizaciones/CotizacionDetalle';
import { CotizacionBadge } from '../components/cotizaciones/CotizacionBadge';
import { CotizacionRowActions } from '../components/cotizaciones/CotizacionRowActions';
import { AlertError } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { FilterSelect } from '../components/ui/FilterSelect';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { TableStatusMessage } from '../components/ui/TableStatusMessage';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { DEFAULT_PAGE_SIZE } from '../lib/pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Icon } from '../components/ui/Icon';
import {
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  TABLE_ROW_SELECTED,
} from '../constants/design';
import { ETAPAS_COT_FILTRO } from '../constants/cotizaciones';
import { fetchCotizaciones, type EtapaCotizacion } from '../lib/cotizaciones';
import {
  clearCotizacionFormParams,
  cotizacionFormFromSearchParams,
} from '../lib/cotizacion-form-url';
import { formatFecha } from '../lib/format';

export function CotizacionesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const etapa = (searchParams.get('etapa') ?? '') as '' | EtapaCotizacion;
  const qParam = searchParams.get('q') ?? '';
  const detalleParam = searchParams.get('detalle');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [busqueda, setBusqueda] = useState(qParam);
  const [selectedId, setSelectedId] = useState<string | null>(detalleParam);

  const formTarget = useMemo(
    () => cotizacionFormFromSearchParams(searchParams),
    [searchParams],
  );
  const formOpen = !!formTarget;

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
    queryKey: ['cotizaciones', etapa || 'todas', qParam, page],
    queryFn: () =>
      fetchCotizaciones(etapa || undefined, {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
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

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setSearchParams(next);
  };

  const cerrarForm = () => {
    setSearchParams(clearCotizacionFormParams(searchParams), { replace: true });
  };

  const abrirForm = (target: CotizacionFormTarget) => {
    const next = clearCotizacionFormParams(searchParams);
    if (target.mode === 'edit') next.set('editar', target.cotizacionId);
    else {
      next.set('form', 'nueva');
      if (target.solicitudId) next.set('solicitudId', target.solicitudId);
    }
    setSearchParams(next, { replace: true });
  };

  const handleCotizacionSaved = (id: string, wasEdit: boolean) => {
    const next = clearCotizacionFormParams(searchParams);
    if (wasEdit) next.set('detalle', id);
    else next.set('editar', id);
    setSearchParams(next, { replace: true });
    if (wasEdit) setSelectedId(id);
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
      ? `${meta.total} cotización${meta.total === 1 ? '' : 'es'}`
      : undefined;

  return (
    <div>
      <PageHeader breadcrumbs={[CRUMB_INICIO, crumb('Cotizaciones')]} count={countLabel}>
        <Button type="button" onClick={() => abrirForm({ mode: 'create' })}>
          <span className="flex items-center gap-1">
            <Icon name="add" size={18} />
            Cotización manual
          </span>
        </Button>
      </PageHeader>

      <TableFiltersPanel
        className="mb-4"
        onRefresh={() => void qc.invalidateQueries({ queryKey: ['cotizaciones'] })}
      >
        <FilterSearchInput
          inline
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Código, cliente o celular…"
        />
        <FilterSelect
          inline
          label="Estado"
          value={etapa}
          options={ETAPAS_COT_FILTRO}
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
          No se pudieron cargar cotizaciones. Ejecuta la migración de base de datos si es la primera vez.
        </AlertError>
      )}

      <DataTableCard
        footer={
          <DataTablePagination
            page={meta?.page ?? page}
            totalPages={meta?.totalPages ?? 1}
            total={meta?.total ?? 0}
            pageSize={meta?.pageSize ?? DEFAULT_PAGE_SIZE}
            onPageChange={setPage}
          />
        }
      >
        <table className="w-full text-left text-body-sm">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
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
              data.map((c) => (
                <tr
                  key={c.id}
                  className={`${TABLE_ROW_CLASS} ${
                    selectedId === c.id ? TABLE_ROW_SELECTED : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <button
                      type="button"
                      className="font-semibold text-on-surface-variant hover:text-primary hover:underline"
                      onClick={() => abrirDetalle(c.id)}
                    >
                      {c.codigo}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left font-semibold hover:text-primary hover:underline"
                      onClick={() => abrirDetalle(c.id)}
                    >
                      {c.cliente.nombreCompleto}
                    </button>
                    <p className="text-on-surface-variant">{c.cliente.celular}</p>
                  </td>
                  <td className="px-4 py-3">
                    {formatFecha(c.fechaEvento)} · {c.cantidadNinos} niños
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">S/ {c.montoTotal.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <CotizacionBadge etapa={c.etapa} />
                  </td>
                  <td className="min-w-[200px] px-4 py-3">
                    <CotizacionRowActions
                      cotizacion={c}
                      onVer={abrirDetalle}
                      onEditar={(id) => abrirForm({ mode: 'edit', cotizacionId: id })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && !isError && data.length === 0 && (
          <TableStatusMessage message="No hay cotizaciones para los filtros seleccionados." />
        )}
      </DataTableCard>

      <CotizacionDetalle
        cotizacionId={selectedId}
        listItem={selectedRow}
        open={!!selectedId}
        onClose={cerrarDetalle}
        onEditarBorrador={(id) => abrirForm({ mode: 'edit', cotizacionId: id })}
      />

      <CotizacionFormModal
        open={formOpen}
        onClose={cerrarForm}
        target={formTarget}
        onSaved={(id) =>
          handleCotizacionSaved(id, formTarget?.mode === 'edit')
        }
      />
    </div>
  );
}
