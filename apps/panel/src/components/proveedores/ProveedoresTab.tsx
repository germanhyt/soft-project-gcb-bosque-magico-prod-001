import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  actualizarProveedor,
  crearProveedor,
  fetchProveedores,
} from '../../lib/proveedores-api';
import { etiquetaCategoriaProveedor, type Proveedor } from '../../lib/proveedores';
import { DEFAULT_PAGE_SIZE, type PageSize } from '../../lib/pagination';
import { Button } from '../ui/Button';
import { DataTableCard } from '../ui/DataTableCard';
import { DataTablePagination } from '../ui/DataTablePagination';
import { FilterSearchInput } from '../ui/FilterSearchInput';
import { FilterSelect } from '../ui/FilterSelect';
import { TableFiltersPanel } from '../ui/TableFiltersPanel';
import { ProveedorRowActions } from './ProveedorRowActions';
import { TABLE_HEAD_CLASS, TABLE_ROW_CLASS, CARD_CLASS } from '../../constants/design';
import { formatFechaHora } from '../../lib/format';
import { ProveedorFormModal } from './ProveedorFormModal';

type Props = {
  puedeGestionar: boolean;
};

type EstadoFiltro = '' | 'activo' | 'inactivo';

function coincideBusqueda(q: string, p: Proveedor) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const campos = [
    p.nombre,
    p.celular,
    p.correo,
    p.contacto,
    ...p.categorias,
  ];
  return campos.some((v) => v?.toLowerCase().includes(needle));
}

export function ProveedoresTab({ puedeGestionar }: Props) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => fetchProveedores(),
  });

  const proveedoresFiltrados = useMemo(
    () =>
      proveedores.filter((p) => {
        if (!coincideBusqueda(busqueda, p)) return false;
        if (estadoFiltro === 'activo' && p.etapa !== 'activo') return false;
        if (estadoFiltro === 'inactivo' && p.etapa !== 'inactivo') return false;
        return true;
      }),
    [proveedores, busqueda, estadoFiltro],
  );

  useEffect(() => {
    setPage(1);
  }, [busqueda, estadoFiltro, pageSize]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setEstadoFiltro('');
  };

  const hayFiltros = busqueda.trim().length > 0 || estadoFiltro !== '';

  const totalPages = Math.max(1, Math.ceil(proveedoresFiltrados.length / pageSize));
  const proveedoresPaginados = useMemo(() => {
    const start = (page - 1) * pageSize;
    return proveedoresFiltrados.slice(start, start + pageSize);
  }, [proveedoresFiltrados, page, pageSize]);

  const crearMut = useMutation({
    mutationFn: crearProveedor,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['proveedores'] });
      await Swal.fire({ icon: 'success', title: 'Proveedor creado', timer: 1500, showConfirmButton: false });
    },
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof actualizarProveedor>[1] }) =>
      actualizarProveedor(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['proveedores'] });
      await Swal.fire({ icon: 'success', title: 'Proveedor actualizado', timer: 1500, showConfirmButton: false });
    },
  });

  const toggleEstado = (p: Proveedor) => {
    actualizarMut.mutate({
      id: p.id,
      payload: { etapa: p.etapa === 'activo' ? 'inactivo' : 'activo' },
    });
  };

  return (
    <div className="mt-6 w-full">
      <div className={`p-6 ${CARD_CLASS}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-title-md text-primary">Proveedores</h3>
            <p className="mt-1 text-body-sm text-outline">
              Contactos de shows, catering y servicios externos para pedidos operativos.
            </p>
          </div>
          {puedeGestionar && (
            <Button
              onClick={() => {
                setEditando(null);
                setModalOpen(true);
              }}
            >
              + Nuevo proveedor
            </Button>
          )}
        </div>

        <TableFiltersPanel className="mb-4" onRefresh={() => void qc.invalidateQueries({ queryKey: ['proveedores'] })}>
          <FilterSearchInput
            inline
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Nombre, contacto o categoría…"
          />
          <FilterSelect<EstadoFiltro>
            inline
            label="Estado"
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Inactivos' },
            ]}
          />
          {hayFiltros && (
            <Button variant="ghost" className="!h-[42px]" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          )}
        </TableFiltersPanel>

        <DataTableCard
          footer={
            !isLoading && proveedoresFiltrados.length > 0 ? (
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                total={proveedoresFiltrados.length}
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
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Categorías</th>
                <th className="px-4 py-3">Estado</th>
                {puedeGestionar && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-outline">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading &&
                proveedoresPaginados.map((p) => (
                  <tr key={p.id} className={TABLE_ROW_CLASS}>
                    <td className="px-4 py-3 text-xs text-outline">
                      {p.creadoEn ? formatFechaHora(p.creadoEn) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      <div className="space-y-0.5">
                        {p.contacto && <p className="text-xs">{p.contacto}</p>}
                        {p.celular && <p className="text-xs">{p.celular}</p>}
                        {p.correo && <p className="text-xs text-outline">{p.correo}</p>}
                        {!p.contacto && !p.celular && !p.correo && '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-outline">
                      {p.categorias.length
                        ? p.categorias.map(etiquetaCategoriaProveedor).join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.etapa === 'activo'
                            ? 'bg-primary-fixed/30 text-primary'
                            : 'bg-surface-container-high text-outline'
                        }`}
                      >
                        {p.etapa === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {puedeGestionar && (
                      <td className="px-4 py-3">
                        <ProveedorRowActions
                          proveedor={p}
                          puedeGestionar={puedeGestionar}
                          onEditar={(prov) => {
                            setEditando(prov);
                            setModalOpen(true);
                          }}
                          onToggleEstado={toggleEstado}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              {!isLoading && proveedoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-on-surface-variant">
                    {proveedores.length === 0
                      ? 'No hay proveedores registrados.'
                      : 'Ningún proveedor coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DataTableCard>
      </div>

      <ProveedorFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditando(null);
        }}
        proveedor={editando}
        onSubmit={async (payload) => {
          if (editando) {
            await actualizarMut.mutateAsync({ id: editando.id, payload });
          } else {
            await crearMut.mutateAsync(payload);
          }
        }}
      />
    </div>
  );
}
