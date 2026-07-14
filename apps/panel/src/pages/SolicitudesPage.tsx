import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CotizacionFormModal,
  type CotizacionFormTarget,
} from '../components/cotizaciones/CotizacionFormModal';
import { NuevaSolicitudModal } from '../components/solicitudes/NuevaSolicitudModal';
import { SolicitudFormModal } from '../components/solicitudes/SolicitudFormModal';
import { SolicitudDetalle } from '../components/solicitudes/SolicitudDetalle';
import { SolicitudRowActions } from '../components/solicitudes/SolicitudRowActions';
import { EtapaBadge } from '../components/ui/EtapaBadge';
import { AlertError } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { FilterSelect } from '../components/ui/FilterSelect';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { TableStatusMessage } from '../components/ui/TableStatusMessage';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { useListPagination } from '../hooks/useListPagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Icon } from '../components/ui/Icon';
import {
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  TABLE_ROW_SELECTED,
} from '../constants/design';
import { CANAL_LABEL, ETAPAS_FILTRO, TURNO_LABEL } from '../constants/solicitudes';
import Swal from 'sweetalert2';
import {
  actualizarSolicitud,
  fetchResumenSolicitudes,
  fetchSolicitud,
  fetchSolicitudes,
  type EtapaSolicitud,
  type Solicitud,
} from '../lib/api';
import { formatFecha, formatFechaHora } from '../lib/format';
import {
  claseAntiguedadBadge,
  etiquetaAntiguedad,
  nivelAntiguedadSolicitudNueva,
} from '../lib/solicitud-antiguedad';

const columnHelper = createColumnHelper<Solicitud>();

export function SolicitudesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const etapaFiltro = (searchParams.get('etapa') ?? '') as '' | EtapaSolicitud;
  const qParam = searchParams.get('q') ?? '';
  const { page, pageSize, setPage, setPageSize } = useListPagination();
  const detalleParam = searchParams.get('detalle');
  const [busqueda, setBusqueda] = useState(qParam);
  const [modalOpen, setModalOpen] = useState(false);
  const [cotForm, setCotForm] = useState<CotizacionFormTarget | null>(null);
  const [editSolicitudId, setEditSolicitudId] = useState<string | null>(null);

  const abrirCotizacionForm = useCallback((target: CotizacionFormTarget) => {
    setCotForm(target);
  }, []);
  const abrirEditarSolicitud = useCallback((id: string) => {
    setEditSolicitudId(id);
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(detalleParam);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'creadoEn', desc: true }]);

  useEffect(() => setBusqueda(qParam), [qParam]);

  useEffect(() => {
    if (detalleParam) setSelectedId(detalleParam);
  }, [detalleParam]);

  const abrirDetalle = useCallback(
    (id: string) => {
      setSelectedId(id);
      const next = new URLSearchParams(searchParams);
      next.set('detalle', id);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const cerrarDetalle = useCallback(() => {
    setSelectedId(null);
    const next = new URLSearchParams(searchParams);
    next.delete('detalle');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

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
    queryKey: ['solicitudes', etapaFiltro || 'todas', qParam, page, pageSize],
    queryFn: () =>
      fetchSolicitudes(etapaFiltro || undefined, {
        page,
        pageSize,
        q: qParam || undefined,
      }),
  });

  const { data: resumen } = useQuery({
    queryKey: ['solicitudes-resumen'],
    queryFn: fetchResumenSolicitudes,
  });

  const sinTomarCount =
    resumen?.find((r) => r.etapa === 'nueva')?._count._all ?? 0;

  const data = paginated?.items ?? [];
  const meta = paginated?.meta;
  const selectedRow = data.find((r) => r.id === selectedId);

  const { data: solicitudEditando } = useQuery({
    queryKey: ['solicitud', editSolicitudId],
    queryFn: () => fetchSolicitud(editSolicitudId!),
    enabled: !!editSolicitudId,
  });

  const guardarSolicitudMut = useMutation({
    mutationFn: (payload: Parameters<typeof actualizarSolicitud>[1]) =>
      actualizarSolicitud(editSolicitudId!, payload),
    onSuccess: async () => {
      if (editSolicitudId) {
        await qc.invalidateQueries({ queryKey: ['solicitud', editSolicitudId] });
      }
      await qc.invalidateQueries({ queryKey: ['solicitudes'] });
      await qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] });
      await qc.invalidateQueries({ queryKey: ['clientes'] });
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud actualizada',
        timer: 1400,
        showConfirmButton: false,
      });
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('creadoEn', {
        header: 'Registro',
        cell: (info) => (
          <span className="whitespace-nowrap text-on-surface-variant">
            {formatFechaHora(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('nombreContacto', {
        header: 'Cliente',
        cell: (info) => (
          <button
            type="button"
            className="text-left font-semibold text-on-surface hover:text-primary hover:underline"
            onClick={() => abrirDetalle(info.row.original.id)}
          >
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.display({
        id: 'contacto',
        header: 'Contacto',
        cell: (info) => {
          const { celular, correo } = info.row.original;
          return (
            <>
              <p>{celular}</p>
              {correo && (
                <p className="text-xs text-on-surface-variant">{correo}</p>
              )}
            </>
          );
        },
      }),
      columnHelper.accessor('canal', {
        header: 'Canal',
        cell: (info) => CANAL_LABEL[info.getValue()] ?? info.getValue(),
      }),
      columnHelper.accessor('etapa', {
        header: 'Estado',
        cell: (info) => {
          const s = info.row.original;
          const etapa = info.getValue();
          if (etapa !== 'nueva') return <EtapaBadge etapa={etapa} />;
          const nivel = nivelAntiguedadSolicitudNueva(s.creadoEn);
          return (
            <div className="flex flex-col gap-1">
              <EtapaBadge etapa={etapa} />
              <span
                className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${claseAntiguedadBadge(nivel)}`}
              >
                {etiquetaAntiguedad(nivel)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('fechaTentativa', {
        header: 'Fecha tent.',
        cell: (info) => formatFecha(info.getValue()),
      }),
      columnHelper.accessor('turnoInteres', {
        header: 'Turno',
        cell: (info) => {
          const v = info.getValue();
          return v ? (TURNO_LABEL[v] ?? v) : '—';
        },
      }),
      columnHelper.accessor('cantidadNinosEstimada', {
        header: 'Niños',
        cell: (info) => info.getValue() ?? '—',
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <span className="block min-w-[220px] text-right">Acciones</span>,
        cell: (info) => (
          <SolicitudRowActions
            solicitud={info.row.original}
            onVer={abrirDetalle}
            onAbrirCotizacionForm={abrirCotizacionForm}
            onEditarSolicitud={abrirEditarSolicitud}
          />
        ),
      }),
    ],
    [abrirDetalle, abrirCotizacionForm, abrirEditarSolicitud],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
      ? `${meta.total} solicitud${meta.total === 1 ? '' : 'es'}`
      : undefined;

  const paginationFooter = (
    <DataTablePagination
      page={meta?.page ?? page}
      totalPages={meta?.totalPages ?? 1}
      total={meta?.total ?? 0}
      pageSize={meta?.pageSize ?? pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Solicitudes (leads)')]}
        count={countLabel}
      >
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-1">
            <Icon name="add" size={18} />
            Nueva solicitud
          </span>
        </Button>
      </PageHeader>

      {sinTomarCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set('etapa', 'nueva');
              next.delete('page');
              setSearchParams(next);
            }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-body-sm shadow-ambient ${
              etapaFiltro === 'nueva'
                ? 'border-primary bg-primary-fixed/30'
                : 'border-surface-variant bg-surface-container-lowest'
            }`}
          >
            <span className="font-semibold text-primary">Sin tomar</span>
            <span className="font-bold text-primary">{sinTomarCount}</span>
            <span className="text-xs text-on-surface-variant">
              · revisar antigüedad en la tabla
            </span>
          </button>
        </div>
      )}

      <TableFiltersPanel
        className="mb-4"
        onRefresh={() =>
          void Promise.all([
            qc.invalidateQueries({ queryKey: ['solicitudes'] }),
            qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
          ])
        }
      >
        <FilterSearchInput
          inline
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Nombre, celular o correo…"
        />
        <FilterSelect
          inline
          label="Estado"
          value={etapaFiltro}
          options={ETAPAS_FILTRO}
          onChange={(value) => {
            const next = new URLSearchParams(searchParams);
            if (value) next.set('etapa', value);
            else next.delete('etapa');
            next.delete('page');
            setSearchParams(next);
          }}
        />
        {(etapaFiltro || qParam) && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="h-[42px] shrink-0 px-3 text-body-sm font-semibold text-secondary hover:text-primary hover:underline"
          >
            Limpiar
          </button>
        )}
      </TableFiltersPanel>

      {isError && <AlertError>Error al cargar solicitudes. ¿Está corriendo la API?</AlertError>}

      <DataTableCard footer={paginationFooter}>
          <table className="w-full text-left text-body-sm">
            <thead className={TABLE_HEAD_CLASS}>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="cursor-pointer px-4 py-3 font-semibold"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-outline">
                    Cargando…
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-outline">
                    No hay solicitudes en este filtro.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${TABLE_ROW_CLASS} ${
                      selectedId === row.original.id ? TABLE_ROW_SELECTED : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && !isError && table.getRowModel().rows.length === 0 && (
            <TableStatusMessage message="No hay solicitudes para los filtros seleccionados." />
          )}
      </DataTableCard>

      <SolicitudDetalle
        solicitudId={selectedId}
        listItem={selectedRow}
        open={!!selectedId}
        onClose={cerrarDetalle}
        onAbrirCotizacionForm={abrirCotizacionForm}
        onEditarSolicitud={abrirEditarSolicitud}
        onVerCotizacion={(id) => navigate(`/cotizaciones?detalle=${id}`)}
      />

      <CotizacionFormModal
        open={!!cotForm}
        onClose={() => setCotForm(null)}
        target={cotForm}
        onSaved={(id) => {
          if (cotForm?.mode === 'edit') setCotForm(null);
          else setCotForm({ mode: 'edit', cotizacionId: id });
        }}
      />

      <SolicitudFormModal
        open={!!editSolicitudId}
        solicitud={solicitudEditando}
        onClose={() => setEditSolicitudId(null)}
        onSubmit={async (payload) => {
          await guardarSolicitudMut.mutateAsync(payload);
        }}
      />

      <NuevaSolicitudModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
