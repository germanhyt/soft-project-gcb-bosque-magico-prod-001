import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { UsuarioFormModal } from '../components/usuarios/UsuarioFormModal';
import { AlertError } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { TableStatusMessage } from '../components/ui/TableStatusMessage';
import { DEFAULT_PAGE_SIZE } from '../lib/pagination';
import {
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
} from '../constants/design';
import {
  actualizarUsuario,
  crearUsuario,
  fetchUsuarios,
  PERMISOS_DISPONIBLES,
  type UsuarioPanel,
} from '../lib/usuarios';
import { useAuth } from '../contexts/AuthContext';

const PERMISO_LABEL = Object.fromEntries(
  PERMISOS_DISPONIBLES.map((p) => [p.id, p.label.split('(')[0].trim()]),
);

export function UsuariosPage() {
  const { user: yo } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UsuarioPanel | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['usuarios-panel'],
    queryFn: fetchUsuarios,
  });

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

  return (
    <div>
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Usuarios')]}
        count={!isLoading && !isError ? `${data.length} usuario${data.length === 1 ? '' : 's'}` : undefined}
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

      <DataTableCard
        footer={
          <DataTablePagination
            page={1}
            totalPages={1}
            total={data.length}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={() => {}}
          />
        }
      >
        <table className="w-full text-left text-body-sm">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Permisos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-outline">
                  Cargando…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6" />
              </tr>
            ) : (
              data.map((u) => (
                <tr key={u.id} className={TABLE_ROW_CLASS}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-outline">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.permisos.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-surface-variant px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant"
                        >
                          {PERMISO_LABEL[p] ?? p}
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
