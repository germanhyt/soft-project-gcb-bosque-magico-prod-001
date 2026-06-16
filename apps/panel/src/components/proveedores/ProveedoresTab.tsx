import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  actualizarProveedor,
  crearProveedor,
  fetchProveedores,
} from '../../lib/proveedores-api';
import type { Proveedor } from '../../lib/proveedores';
import { DEFAULT_PAGE_SIZE } from '../../lib/pagination';
import { Button } from '../ui/Button';
import { DataTableCard } from '../ui/DataTableCard';
import { DataTablePagination } from '../ui/DataTablePagination';
import { FilterSearchInput } from '../ui/FilterSearchInput';
import { TABLE_HEAD_CLASS, TABLE_ROW_CLASS, CARD_CLASS } from '../../constants/design';
import { ProveedorFormModal } from './ProveedorFormModal';

type Props = {
  puedeGestionar: boolean;
};

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
  const [page, setPage] = useState(1);

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => fetchProveedores(),
  });

  const proveedoresFiltrados = useMemo(
    () => proveedores.filter((p) => coincideBusqueda(busqueda, p)),
    [proveedores, busqueda],
  );

  useEffect(() => {
    setPage(1);
  }, [busqueda]);

  const totalPages = Math.max(1, Math.ceil(proveedoresFiltrados.length / DEFAULT_PAGE_SIZE));
  const proveedoresPaginados = useMemo(() => {
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    return proveedoresFiltrados.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [proveedoresFiltrados, page]);

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

        <div className="mb-4">
          <FilterSearchInput
            inline
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Nombre, contacto o categoría…"
          />
        </div>

        <DataTableCard
          footer={
            !isLoading && proveedoresFiltrados.length > 0 ? (
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                total={proveedoresFiltrados.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : undefined
          }
        >
          <table className="w-full text-left text-body-sm">
            <thead>
              <tr className={TABLE_HEAD_CLASS}>
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
                  <td colSpan={5} className="px-4 py-6 text-outline">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading &&
                proveedoresPaginados.map((p) => (
                  <tr key={p.id} className={TABLE_ROW_CLASS}>
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
                      {p.categorias.length ? p.categorias.join(', ') : '—'}
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setEditando(p);
                              setModalOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => toggleEstado(p)}
                          >
                            {p.etapa === 'activo' ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              {!isLoading && proveedoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-on-surface-variant">
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
