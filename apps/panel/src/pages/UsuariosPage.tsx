import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { UsuarioFormModal } from '../components/usuarios/UsuarioFormModal';
import { AlertError } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { FilterSelect } from '../components/ui/FilterSelect';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { TableStatusMessage } from '../components/ui/TableStatusMessage';
import { DEFAULT_PAGE_SIZE, type PageSize } from '../lib/pagination';
import { formatFechaHora } from '../lib/format';
import {
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
} from '../constants/design';
import {
  actualizarUsuario,
  crearUsuario,
  etiquetasPermisoUsuario,
  fetchUsuarios,
  PERMISO_ADMIN,
  PERMISO_MANAGE,
  PERMISO_VIEW,
  usuarioCoincidePermisoFiltro,
  type PermisoPanelId,
  type UsuarioPanel,
} from '../lib/usuarios';
import { useAuth } from '../contexts/AuthContext';

type EstadoFiltro = '' | 'activo' | 'inactivo';
type PermisoFiltro = '' | PermisoPanelId;

function coincideBusqueda(q: string, u: UsuarioPanel) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [u.nombre, u.email].some((v) => v.toLowerCase().includes(needle));
}

export function UsuariosPage() {
  const { user: yo } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UsuarioPanel | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('');
  const [permisoFiltro, setPermisoFiltro] = useState<PermisoFiltro>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios-panel'],
    queryFn: fetchUsuarios,
  });

  const usuariosFiltrados = useMemo(() => {
    return data.filter((u) => {
      if (!coincideBusqueda(busqueda, u)) return false;
      if (estadoFiltro === 'activo' && !u.activo) return false;
      if (estadoFiltro === 'inactivo' && u.activo) return false;
      if (permisoFiltro && !usuarioCoincidePermisoFiltro(u.permisos, permisoFiltro)) return false;
      return true;
    });
  }, [data, busqueda, estadoFiltro, permisoFiltro]);

  useEffect(() => {
    setPage(1);
  }, [busqueda, estadoFiltro, permisoFiltro, pageSize]);

  const totalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / pageSize));
  const usuariosPaginados = useMemo(() => {
    const start = (page - 1) * pageSize;
    return usuariosFiltrados.slice(start, start + pageSize);
  }, [usuariosFiltrados, page, pageSize]);

  const crearMut = useMutation({
    mutationFn: crearUsuario,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['usuarios-panel'] });
      await Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false });
    },
  });

  const actualizarMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof actualizarUsuario>[1];
    }) => actualizarUsuario(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['usuarios-panel'] });
      await Swal.fire({ icon: 'success', title: 'Usuario actualizado', timer: 1500, showConfirmButton: false });
    },
  });

  const toggleActivo = async (u: UsuarioPanel) => {
    try {
      await actualizarMut.mutateAsync({ id: u.id, payload: { activo: !u.activo } });
    } catch {
      await Swal.fire({ icon: 'error', title: 'No se pudo actualizar' });
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setEstadoFiltro('');
    setPermisoFiltro('');
  };

  const hayFiltros = busqueda.trim() || estadoFiltro || permisoFiltro;

  return (
    <div>
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Usuarios')]}
        count={
          !isLoading && !isError
            ? `${usuariosFiltrados.length} de ${data.length} usuario${data.length === 1 ? '' : 's'}`
            : undefined
        }
      >
        <Button
          onClick={() => {
            setEditUser(null);
            setModalOpen(true);
          }}
        >
          + Nuevo usuario
        </Button>
      </PageHeader>

      {isError && (
        <AlertError>
          No se pudo cargar usuarios. Requiere permiso Administrar y API en ejecución.
        </AlertError>
      )}

      <TableFiltersPanel className="mb-4" onRefresh={() => void refetch()}>
        <FilterSearchInput
          inline
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Nombre o correo…"
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
        <FilterSelect<PermisoFiltro>
          inline
          label="Permiso"
          value={permisoFiltro}
          onChange={setPermisoFiltro}
          options={[
            { value: '', label: 'Todos los permisos' },
            { value: PERMISO_VIEW, label: 'Consulta' },
            { value: PERMISO_MANAGE, label: 'Operación comercial' },
            { value: PERMISO_ADMIN, label: 'Administración' },
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
          !isLoading && usuariosFiltrados.length > 0 ? (
            <DataTablePagination
              page={page}
              totalPages={totalPages}
              total={usuariosFiltrados.length}
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
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Permisos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-outline">
                  Cargando…
                </td>
              </tr>
            ) : usuariosPaginados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6" />
              </tr>
            ) : (
              usuariosPaginados.map((u) => (
                <tr key={u.id} className={TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-xs text-outline">
                    {formatFechaHora(u.creadoEn)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-outline">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {etiquetasPermisoUsuario(u.permisos).map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-surface-variant px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.activo ? 'bg-primary-fixed/50 text-primary' : 'bg-surface-variant text-outline'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 text-body-sm font-semibold text-secondary hover:text-primary"
                      onClick={() => {
                        setEditUser(u);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    {yo?.id !== u.id && (
                      <button
                        type="button"
                        className="text-body-sm font-semibold text-outline hover:text-error"
                        onClick={() => toggleActivo(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && !isError && data.length === 0 && (
          <TableStatusMessage message="No hay usuarios además del administrador. Crea cuentas para vendedores." />
        )}
        {!isLoading && !isError && data.length > 0 && usuariosFiltrados.length === 0 && (
          <TableStatusMessage message="Ningún usuario coincide con los filtros aplicados." />
        )}
      </DataTableCard>

      <UsuarioFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditUser(null);
        }}
        usuario={editUser}
        onSubmit={async (payload) => {
          await crearMut.mutateAsync(payload);
        }}
        onUpdate={async (id, payload) => {
          await actualizarMut.mutateAsync({ id, payload });
        }}
      />
    </div>
  );
}
