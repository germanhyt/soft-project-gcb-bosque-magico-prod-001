import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  actualizarProducto,
  crearProducto,
  fetchProductosCatalogo,
  eliminarImagenProducto,
  eliminarMediaProducto,
  eliminarVideoProducto,
  guardarVideoUrlProducto,
  subirImagenProducto,
  subirVideoProducto,
} from '../../lib/configuracion';
import { DEFAULT_PAGE_SIZE, type PageSize } from '../../lib/pagination';
import type { Producto } from '../../lib/cotizaciones';
import { CatalogoProductoRowActions } from './CatalogoProductoRowActions';
import { ProductoFormModal } from './ProductoFormModal';
import { ProductImageDropzone } from './ProductImageDropzone';
import { Button } from '../ui/Button';
import { formatFechaHora } from '../../lib/format';
import { DataTableCard } from '../ui/DataTableCard';
import { DataTablePagination } from '../ui/DataTablePagination';
import { FilterSearchInput } from '../ui/FilterSearchInput';
import { FilterSelect } from '../ui/FilterSelect';
import { TableFiltersPanel } from '../ui/TableFiltersPanel';
import { TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../../constants/design';

type Props = {
  puedeGestionar: boolean;
};

type CategoriaFiltro =
  | 'todas'
  | 'paquete'
  | 'show'
  | 'catering'
  | 'piqueo'
  | 'cajita'
  | 'snack'
  | 'extra'
  | 'espacio';
type EstadoCatalogoFiltro = '' | 'activo' | 'inactivo';

const CATEGORIA_LABEL: Record<CategoriaFiltro, string> = {
  todas: 'Todas',
  paquete: 'Paquetes',
  show: 'Shows',
  catering: 'Catering',
  piqueo: 'Piqueos',
  cajita: 'Cajitas',
  snack: 'Snacks',
  extra: 'Extras',
  espacio: 'Espacios',
};

function coincideCategoriaFiltro(p: { categoria: string; subtipo?: string | null }, filtro: CategoriaFiltro) {
  if (filtro === 'todas') return true;
  if (filtro === 'piqueo') return p.categoria === 'catering' && p.subtipo === 'piqueo';
  if (filtro === 'cajita') return p.categoria === 'catering' && p.subtipo === 'cajita';
  if (filtro === 'snack') return p.categoria === 'catering' && p.subtipo === 'snack';
  if (filtro === 'catering') {
    return p.categoria === 'catering' && (p.subtipo === 'general' || !p.subtipo);
  }
  return p.categoria === filtro;
}

function defaultsProductoDesdeFiltro(filtro: CategoriaFiltro): { categoria: string; subtipo: string } {
  if (filtro === 'piqueo') return { categoria: 'catering', subtipo: 'piqueo' };
  if (filtro === 'cajita') return { categoria: 'catering', subtipo: 'cajita' };
  if (filtro === 'snack') return { categoria: 'catering', subtipo: 'snack' };
  if (filtro === 'todas') return { categoria: 'show', subtipo: 'general' };
  return { categoria: filtro, subtipo: 'general' };
}

const SUBTIPO_LABEL: Record<string, string> = {
  general: 'General',
  piqueo: 'Piqueo',
  cajita: 'Cajita',
  snack: 'Snack',
};

const ORIGEN_LABEL: Record<string, string> = {
  propio: 'Propio',
  proveedor: 'Proveedor',
};

export function CatalogoTab({ puedeGestionar }: Props) {
  const qc = useQueryClient();
  const [estadoCatalogoFiltro, setEstadoCatalogoFiltro] = useState<EstadoCatalogoFiltro>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFiltro>('todas');
  const [catalogoBusqueda, setCatalogoBusqueda] = useState('');
  const [catalogoPage, setCatalogoPage] = useState(1);
  const [catalogoPageSize, setCatalogoPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [productoModalOpen, setProductoModalOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const { data: productos = [], isLoading: loadingProd } = useQuery({
    queryKey: ['productos-catalogo', estadoCatalogoFiltro],
    queryFn: () =>
      fetchProductosCatalogo(estadoCatalogoFiltro === 'activo' ? false : undefined),
  });

  const productosFiltrados = useMemo(() => {
    let rows = productos;
    if (estadoCatalogoFiltro === 'inactivo') {
      rows = rows.filter((p) => p.etapa === 'inactivo');
    }
    if (categoriaFiltro !== 'todas') {
      rows = rows.filter((p) => coincideCategoriaFiltro(p, categoriaFiltro));
    }
    const q = catalogoBusqueda.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.descripcion?.toLowerCase().includes(q) ?? false),
    );
  }, [productos, categoriaFiltro, catalogoBusqueda, estadoCatalogoFiltro]);

  const hayFiltrosCatalogo =
    catalogoBusqueda.trim().length > 0 ||
    estadoCatalogoFiltro !== '' ||
    categoriaFiltro !== 'todas';

  const limpiarFiltrosCatalogo = () => {
    setCatalogoBusqueda('');
    setEstadoCatalogoFiltro('');
    setCategoriaFiltro('todas');
  };

  useEffect(() => {
    setCatalogoPage(1);
  }, [categoriaFiltro, estadoCatalogoFiltro, catalogoBusqueda, catalogoPageSize]);

  const catalogoTotalPages = Math.max(
    1,
    Math.ceil(productosFiltrados.length / catalogoPageSize),
  );

  const productosPaginados = useMemo(() => {
    const start = (catalogoPage - 1) * catalogoPageSize;
    return productosFiltrados.slice(start, start + catalogoPageSize);
  }, [productosFiltrados, catalogoPage, catalogoPageSize]);

  const toggleProductoMut = useMutation({
    mutationFn: (p: Producto) =>
      actualizarProducto(p.id, {
        etapa: p.etapa === 'activo' ? 'inactivo' : 'activo',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos-catalogo'] }),
  });

  const confirmarToggleEstado = async (prod: Producto) => {
    if (prod.etapa === 'activo') {
      const confirm = await Swal.fire({
        icon: 'warning',
        title: '¿Desactivar producto?',
        text: `"${prod.nombre}" dejará de aparecer en el catálogo y la landing. Puedes reactivarlo después.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b91c1c',
      });
      if (!confirm.isConfirmed) return;
    }
    toggleProductoMut.mutate(prod);
  };

  const invalidarCatalogo = async () => {
    await qc.invalidateQueries({ queryKey: ['productos-catalogo'] });
    await qc.invalidateQueries({ queryKey: ['productos'] });
    await qc.invalidateQueries({ queryKey: ['catalogo-publico'] });
  };

  const imagenMut = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => subirImagenProducto(id, file),
    onSuccess: invalidarCatalogo,
  });

  const quitarImagenMut = useMutation({
    mutationFn: (id: string) => eliminarImagenProducto(id),
    onSuccess: invalidarCatalogo,
  });

  const actualizarProductoMedia = async (producto: Producto) => {
    setProductoEditando(producto);
    await invalidarCatalogo();
  };

  const eliminarMediaMut = useMutation({
    mutationFn: ({ id, mediaId }: { id: string; mediaId: string }) =>
      eliminarMediaProducto(id, mediaId),
    onSuccess: actualizarProductoMedia,
  });

  const guardarVideoUrlMut = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => guardarVideoUrlProducto(id, url),
    onSuccess: actualizarProductoMedia,
  });

  const subirVideoMut = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => subirVideoProducto(id, file),
    onSuccess: actualizarProductoMedia,
  });

  const eliminarVideoMut = useMutation({
    mutationFn: (id: string) => eliminarVideoProducto(id),
    onSuccess: actualizarProductoMedia,
  });

  const crearProdMut = useMutation({
    mutationFn: crearProducto,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['productos-catalogo'] });
      await qc.invalidateQueries({ queryKey: ['productos'] });
      await qc.invalidateQueries({ queryKey: ['catalogo-publico'] });
      await Swal.fire({ icon: 'success', title: 'Producto creado', timer: 1500, showConfirmButton: false });
    },
  });

  const editarProdMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof actualizarProducto>[1] }) =>
      actualizarProducto(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['productos-catalogo'] });
      await qc.invalidateQueries({ queryKey: ['productos'] });
      await qc.invalidateQueries({ queryKey: ['catalogo-publico'] });
      await Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 1500, showConfirmButton: false });
    },
  });

  const abrirNuevoProducto = () => {
    setProductoEditando(null);
    setProductoModalOpen(true);
  };

  const abrirEditarProducto = (p: Producto) => {
    setProductoEditando(p);
    setProductoModalOpen(true);
  };

  return (
    <div className="mt-6 w-full">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {puedeGestionar && (
          <Button onClick={abrirNuevoProducto}>+ Nuevo producto</Button>
        )}
      </div>

      <TableFiltersPanel
        className="mb-4"
        onRefresh={() => void qc.invalidateQueries({ queryKey: ['productos-catalogo'] })}
      >
        <FilterSearchInput
          inline
          value={catalogoBusqueda}
          onChange={setCatalogoBusqueda}
          placeholder="Nombre, código o descripción…"
          className="min-w-[240px] flex-1"
        />
        <FilterSelect<EstadoCatalogoFiltro>
          inline
          label="Estado"
          value={estadoCatalogoFiltro}
          onChange={setEstadoCatalogoFiltro}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'activo', label: 'Activos' },
            { value: 'inactivo', label: 'Inactivos' },
          ]}
        />
        {hayFiltrosCatalogo && (
          <Button variant="ghost" className="!h-[42px]" onClick={limpiarFiltrosCatalogo}>
            Limpiar
          </Button>
        )}
      </TableFiltersPanel>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(CATEGORIA_LABEL) as CategoriaFiltro[]).map((categoria) => {
          const active = categoriaFiltro === categoria;
          const count =
            categoria === 'todas'
              ? productos.length
              : productos.filter((p) => coincideCategoriaFiltro(p, categoria)).length;
          return (
            <button
              key={categoria}
              type="button"
              onClick={() => setCategoriaFiltro(categoria)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${active
                ? 'border-primary bg-primary text-on-primary'
                : 'border-surface-variant bg-surface text-on-surface-variant hover:border-outline'
                }`}
            >
              {CATEGORIA_LABEL[categoria]} ({count})
            </button>
          );
        })}
      </div>

      {!puedeGestionar && (
        <p className="mb-4 text-body-sm text-outline">
          Solo usuarios con permiso <strong>Gestionar</strong> o <strong>Administrar</strong> pueden
          editar el catálogo.
        </p>
      )}

      <ProductoFormModal
        open={productoModalOpen}
        onClose={() => {
          setProductoModalOpen(false);
          setProductoEditando(null);
        }}
        producto={productoEditando}
        defaults={productoEditando ? undefined : defaultsProductoDesdeFiltro(categoriaFiltro)}
        puedeGestionarImagen={puedeGestionar}
        onUploadImagen={
          productoEditando
            ? async (file) => {
              const actualizado = await imagenMut.mutateAsync({
                id: productoEditando.id,
                file,
              });
              setProductoEditando(actualizado);
            }
            : undefined
        }
        onEliminarMedia={
          productoEditando
            ? async (mediaId) => {
              const actualizado = await eliminarMediaMut.mutateAsync({
                id: productoEditando.id,
                mediaId,
              });
              setProductoEditando(actualizado);
            }
            : undefined
        }
        onGuardarVideoUrl={
          productoEditando
            ? async (url) => {
              const actualizado = await guardarVideoUrlMut.mutateAsync({
                id: productoEditando.id,
                url,
              });
              setProductoEditando(actualizado);
            }
            : undefined
        }
        onSubirVideo={
          productoEditando
            ? async (file) => {
              const actualizado = await subirVideoMut.mutateAsync({
                id: productoEditando.id,
                file,
              });
              setProductoEditando(actualizado);
            }
            : undefined
        }
        onEliminarVideo={
          productoEditando
            ? async () => {
              const actualizado = await eliminarVideoMut.mutateAsync(productoEditando.id);
              setProductoEditando(actualizado);
            }
            : undefined
        }
        onSubmit={async (payload) => {
          if (productoEditando) {
            await editarProdMut.mutateAsync({
              id: productoEditando.id,
              payload: {
                nombre: payload.nombre,
                categoria: payload.categoria,
                precioLunesViernes: payload.precioLunesViernes,
                precioFinSemana: payload.precioFinSemana,
                cantidadMinima: payload.cantidadMinima,
                subtipo: payload.subtipo,
                unidadesPack: payload.unidadesPack ?? null,
                descripcion: payload.descripcion,
                origen: payload.origen,
                costoInterno: payload.costoInterno,
                proveedorId:
                  payload.origen === 'proveedor' ? (payload.proveedorId ?? null) : null,
              },
            });
          } else {
            await crearProdMut.mutateAsync(payload);
          }
        }}
      />

      <DataTableCard
        footer={
          !loadingProd && productosFiltrados.length > 0 ? (
            <DataTablePagination
              page={catalogoPage}
              totalPages={catalogoTotalPages}
              total={productosFiltrados.length}
              pageSize={catalogoPageSize}
              onPageChange={setCatalogoPage}
              onPageSizeChange={(size) => {
                setCatalogoPageSize(size);
                setCatalogoPage(1);
              }}
            />
          ) : undefined
        }
      >
        <table className="w-full text-left text-body-sm">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Imagen</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Subtipo / pack</th>
              <th className="px-4 py-3">L-V / FDS</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingProd ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center">
                  Cargando…
                </td>
              </tr>
            ) : (
              productosPaginados.map((p) => (
                <tr key={p.id} className={TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-xs text-outline">
                    {p.creadoEn ? formatFechaHora(p.creadoEn) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.nombre}</p>
                    <p className="font-mono text-xs text-outline">{p.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ProductImageDropzone
                      imagenUrl={p.imagenUrl}
                      imagenes={p.imagenes}
                      nombre={p.nombre}
                      disabled={
                        !puedeGestionar ||
                        imagenMut.isPending ||
                        quitarImagenMut.isPending
                      }
                      onUpload={async (file) => {
                        await imagenMut.mutateAsync({ id: p.id, file });
                      }}
                      onRemove={
                        p.imagenUrl && puedeGestionar
                          ? async () => {
                            await quitarImagenMut.mutateAsync(p.id);
                          }
                          : undefined
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    {ORIGEN_LABEL[p.origen ?? 'propio'] ?? p.origen ?? '—'}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {p.categoria === 'catering' && p.subtipo && p.subtipo !== 'general'
                      ? CATEGORIA_LABEL[p.subtipo as CategoriaFiltro] ?? p.subtipo
                      : CATEGORIA_LABEL[p.categoria as CategoriaFiltro] ?? p.categoria}
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    {p.categoria === 'catering' && p.subtipo ? (
                      <>
                        {SUBTIPO_LABEL[p.subtipo] ?? p.subtipo}
                        {p.subtipo === 'piqueo' && p.unidadesPack
                          ? ` · ${p.unidadesPack} uds/pack`
                          : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    S/ {p.precioLunesViernes} · S/ {p.precioFinSemana}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.etapa === 'activo'
                        ? 'bg-primary-fixed/50 text-primary'
                        : 'bg-surface-variant text-outline'
                        }`}
                    >
                      {p.etapa === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <CatalogoProductoRowActions
                        producto={p}
                        puedeGestionar={puedeGestionar}
                        onEditar={abrirEditarProducto}
                        onToggleEstado={confirmarToggleEstado}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loadingProd && productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-outline">
                  No hay productos para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
