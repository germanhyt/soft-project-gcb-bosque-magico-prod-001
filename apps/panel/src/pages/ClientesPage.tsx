import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useSearchParams } from 'react-router-dom';
import { ClienteDetalle } from '../components/clientes/ClienteDetalle';
import { ClienteFormModal } from '../components/clientes/ClienteFormModal';
import { ClienteRowActions } from '../components/clientes/ClienteRowActions';
import { AlertError } from '../components/ui/Alert';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { TableStatusMessage } from '../components/ui/TableStatusMessage';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { TABLE_HEAD_CLASS, TABLE_ROW_CLASS, TABLE_ROW_SELECTED } from '../constants/design';
import { useAuth } from '../contexts/AuthContext';
import { actualizarCliente, fetchCliente, fetchClientes } from '../lib/clientes';
import { formatFecha, formatFechaHora } from '../lib/format';
import { useListPagination } from '../hooks/useListPagination';
import { PageHeader } from '../components/ui/PageHeader';

export function ClientesPage() {
  const qc = useQueryClient();
  const { user, authRequired } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const detalleParam = searchParams.get('detalle');
  const { page, pageSize, setPage, setPageSize } = useListPagination();
  const [busqueda, setBusqueda] = useState(qParam);
  const [selectedId, setSelectedId] = useState<string | null>(detalleParam);
  const [editId, setEditId] = useState<string | null>(null);
  const puedeEditar =
    !authRequired ||
    !!user?.permisos.includes('bosque_magico:manage') ||
    !!user?.permisos.includes('bosque_magico:admin');

  useEffect(() => setBusqueda(qParam), [qParam]);

  useEffect(() => {
    if (detalleParam) setSelectedId(detalleParam);
  }, [detalleParam]);

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
    queryKey: ['clientes', qParam, page, pageSize],
    queryFn: () =>
      fetchClientes({
        page,
        pageSize,
        q: qParam || undefined,
      }),
  });

  const { data: clienteEditando } = useQuery({
    queryKey: ['cliente', editId],
    queryFn: () => fetchCliente(editId!),
    enabled: !!editId,
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

  const guardarMut = useMutation({
    mutationFn: (payload: Parameters<typeof actualizarCliente>[1]) => actualizarCliente(editId!, payload),
    onSuccess: async () => {
      if (editId) await qc.invalidateQueries({ queryKey: ['cliente', editId] });
      await qc.invalidateQueries({ queryKey: ['clientes'] });
      await Swal.fire({
        icon: 'success',
        title: 'Cliente actualizado',
        timer: 1400,
        showConfirmButton: false,
      });
    },
  });

  const countLabel =
    meta && !isLoading && !isError
      ? `${meta.total} cliente${meta.total === 1 ? '' : 's'}`
      : undefined;

  return (
    <div>
      <PageHeader breadcrumbs={[CRUMB_INICIO, crumb('Clientes')]} count={countLabel} />

      <TableFiltersPanel
        className="mb-4"
        onRefresh={() => void qc.invalidateQueries({ queryKey: ['clientes'] })}
      >
        <FilterSearchInput
          inline
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Nombre, celular o correo…"
        />
      </TableFiltersPanel>

      {isError && (
        <AlertError>No se pudo cargar el listado de clientes.</AlertError>
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
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Solicitudes</th>
              <th className="px-4 py-3">Cotizaciones</th>
              <th className="px-4 py-3">Actualizado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-on-surface">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-outline">
                  Cargando…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6" />
              </tr>
            ) : (
              data.map((c) => (
                <tr
                  key={c.id}
                  className={`${TABLE_ROW_CLASS} ${
                    selectedId === c.id ? TABLE_ROW_SELECTED : ''
                  }`}
                >
                  <td className="px-4 py-3 text-xs text-outline">
                    {formatFechaHora(c.creadoEn)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left font-semibold hover:text-primary hover:underline"
                      onClick={() => abrirDetalle(c.id)}
                    >
                      {c.nombreCompleto}
                    </button>
                    {c.distrito && (
                      <p className="text-xs text-on-surface-variant">{c.distrito}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p>{c.celular}</p>
                    {c.correo && (
                      <p className="text-xs text-on-surface-variant">{c.correo}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{c.totalSolicitudes}</span>
                    {c.solicitudesRecientes24h && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Activo 24h
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.totalCotizaciones}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatFecha(c.actualizadoEn)}
                  </td>
                  <td className="min-w-[200px] px-4 py-3">
                    <ClienteRowActions
                      cliente={c}
                      onVer={abrirDetalle}
                      onEditar={puedeEditar ? (id) => setEditId(id) : undefined}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && !isError && data.length === 0 && (
          <TableStatusMessage message="No hay clientes para la búsqueda." />
        )}
      </DataTableCard>

      <ClienteDetalle
        clienteId={selectedId}
        listItem={selectedRow}
        open={!!selectedId}
        onClose={cerrarDetalle}
        onEditar={puedeEditar ? (id) => setEditId(id) : undefined}
      />

      <ClienteFormModal
        open={!!editId}
        cliente={clienteEditando}
        onClose={() => setEditId(null)}
        onSubmit={async (payload) => {
          await guardarMut.mutateAsync(payload);
        }}
      />
    </div>
  );
}
