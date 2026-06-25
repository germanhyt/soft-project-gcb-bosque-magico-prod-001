import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { apiErrorMessage } from '../lib/api-error';
import {
  actualizarProducto,
  crearProducto,
  fetchConfiguracionPanel,
  fetchProductosCatalogo,
  guardarConfiguracion,
  eliminarImagenProducto,
  eliminarMediaProducto,
  eliminarVideoProducto,
  guardarVideoUrlProducto,
  subirImagenProducto,
  subirVideoProducto,
  type ConfigItem,
  type SelectionMode,
  type TurnoConfigValor,
} from '../lib/configuracion';
import { horarioDesdeRango, parseTurnoConfig, turnoParaGuardar } from '../lib/turno-config';
import { parseFeriadosConfig } from '../lib/tarifa-calendario';
import { DEFAULT_PAGE_SIZE, type PageSize } from '../lib/pagination';
import { smtpValoresDesdeItems, SMTP_ORDEN } from '../lib/smtp-config';
import type { Producto } from '../lib/cotizaciones';
import { FeriadosConfigEditor } from '../components/configuracion/FeriadosConfigEditor';
import { CatalogoProductoRowActions } from '../components/catalogo/CatalogoProductoRowActions';
import { ProveedoresTab } from '../components/proveedores/ProveedoresTab';
import { ProductoFormModal } from '../components/catalogo/ProductoFormModal';
import { ProductImageDropzone } from '../components/catalogo/ProductImageDropzone';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { Button } from '../components/ui/Button';
import { formatFechaHora } from '../lib/format';
import { DataTableCard } from '../components/ui/DataTableCard';
import { DataTablePagination } from '../components/ui/DataTablePagination';
import { FilterSearchInput } from '../components/ui/FilterSearchInput';
import { FloatingSaveBar } from '../components/ui/FloatingSaveBar';
import { PasswordInput } from '../components/ui/PasswordInput';
import {
  CARD_CLASS,
  INPUT_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
} from '../constants/design';

type Tab = 'tarifas' | 'catalogo' | 'proveedores';
type CategoriaFiltro = 'todas' | 'paquete' | 'show' | 'catering' | 'extra' | 'espacio';

const LABELS: Record<string, string> = {
  'tarifas.base_lunes_viernes': 'Base lunes–viernes (S/)',
  'tarifas.base_fin_semana': 'Base fin de semana (S/)',
  'tarifas.precio_nino_extra': 'Precio niño extra 26–35 (S/)',
  'ninos.minimo': 'Mínimo de niños',
  'ninos.maximo_base': 'Capacidad base (sin extra)',
  'ninos.maximo_permitido': 'Máximo permitido',
  'contrato.adelanto_referencial': 'Adelanto referencial (S/)',
  'contrato.garantia_referencial': 'Garantía referencial (S/)',
  'catering.minimo_unidades': 'Mínimo catering (unidades)',
  'solicitud.min_dias_anticipacion': 'Anticipación mínima (días)',
  'paquetes.cajitas_incluidas': 'Cajitas incluidas por paquete',
  'paquetes.cajitas_precio_excedente': 'Precio cajita adicional (S/)',
  'paquetes.piqueos_credito_premium': 'Crédito piqueos Premium (S/)',
};

const TURNO_KEY_LABEL: Record<string, string> = {
  'turnos.turno_1': 'Turno 1',
  'turnos.turno_2': 'Turno 2',
  'turnos.turno_3': 'Turno 3',
};

const COTIZADOR_MODE_LABEL: Record<string, string> = {
  'cotizador.shows.selection_mode': 'Shows (landing)',
  'cotizador.catering.selection_mode': 'Catering (landing)',
  'cotizador.extras.selection_mode': 'Extras (landing)',
};

const SMTP_LABELS: Record<string, string> = {
  'smtp.habilitado': 'Habilitar envío automático (SMTP)',
  'smtp.host': 'Servidor SMTP (host)',
  'smtp.port': 'Puerto SMTP',
  'smtp.user': 'Usuario SMTP',
  'smtp.password': 'Contraseña SMTP',
  'smtp.from_email': 'Correo remitente',
  'smtp.from_name': 'Nombre remitente',
  'smtp.secure': 'Conexión segura (SSL directo)',
};

const POSTVENTA_LABELS: Record<string, string> = {
  'postventa.habilitado': 'Enviar formulario al marcar evento realizado',
  'postventa.url_formulario': 'URL del formulario',
  'postventa.asunto': 'Asunto del correo',
  'postventa.cuerpo': 'Cuerpo del correo',
};

const POSTVENTA_ORDEN = [
  'postventa.habilitado',
  'postventa.url_formulario',
  'postventa.asunto',
  'postventa.cuerpo',
] as const;

const PEDIDOS_PROVEEDOR_LABELS: Record<string, string> = {
  'pedidos_proveedor.notificar_correo': 'Notificar por correo al crear pedido a proveedor',
  'pedidos_proveedor.asunto': 'Asunto del correo',
  'pedidos_proveedor.cuerpo': 'Cuerpo del correo',
};

const PEDIDOS_PROVEEDOR_ORDEN = [
  'pedidos_proveedor.notificar_correo',
  'pedidos_proveedor.asunto',
  'pedidos_proveedor.cuerpo',
] as const;

function postventaValoresDesdeItems(items?: ConfigItem[]) {
  const map: Record<string, string> = {};
  for (const clave of POSTVENTA_ORDEN) {
    const item = items?.find((i) => i.clave === clave);
    if (clave === 'postventa.habilitado') {
      map[clave] = item?.valor === true ? 'true' : 'false';
    } else {
      map[clave] = typeof item?.valor === 'string' ? item.valor : '';
    }
  }
  return map;
}

function pedidosProveedorValoresDesdeItems(items?: ConfigItem[]) {
  const map: Record<string, string> = {};
  for (const clave of PEDIDOS_PROVEEDOR_ORDEN) {
    const item = items?.find((i) => i.clave === clave);
    if (clave === 'pedidos_proveedor.notificar_correo') {
      map[clave] = item?.valor === true ? 'true' : 'false';
    } else {
      map[clave] = typeof item?.valor === 'string' ? item.valor : '';
    }
  }
  return map;
}

const CATEGORIA_LABEL: Record<CategoriaFiltro, string> = {
  todas: 'Todas',
  paquete: 'Paquetes',
  show: 'Shows',
  catering: 'Catering',
  extra: 'Extras',
  espacio: 'Espacios',
};

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

function configLabel(item: ConfigItem) {
  const titulo = LABELS[item.clave] ?? item.clave;
  const ayuda = item.descripcion?.trim();
  const redundante =
    ayuda &&
    (ayuda.toLowerCase() === titulo.toLowerCase() ||
      titulo.toLowerCase().includes(ayuda.toLowerCase().slice(0, 12)));
  return { titulo, ayuda: redundante ? undefined : ayuda };
}

function smtpFieldLabel(item: ConfigItem) {
  const titulo = SMTP_LABELS[item.clave] ?? item.clave;
  const ayuda = item.descripcion?.trim();
  const redundante =
    ayuda &&
    (ayuda.toLowerCase() === titulo.toLowerCase() ||
      titulo.toLowerCase().includes(ayuda.toLowerCase().slice(0, 10)) ||
      ayuda.toLowerCase().includes(titulo.toLowerCase().slice(0, 10)));
  return { titulo, ayuda: redundante ? undefined : ayuda };
}

function tienePermiso(permisos: string[] | undefined, clave: string) {
  return permisos?.includes(clave) ?? false;
}

export function ConfiguracionPage() {
  const { user, authRequired } = useAuth();
  const permisos = user?.permisos;
  const puedeEditarTarifas =
    !authRequired || tienePermiso(permisos, 'bosque_magico:admin');
  const puedeGestionarCatalogo =
    !authRequired ||
    tienePermiso(permisos, 'bosque_magico:admin') ||
    tienePermiso(permisos, 'bosque_magico:manage');
  const [tab, setTab] = useState<Tab>(puedeEditarTarifas ? 'tarifas' : 'catalogo');
  const [valores, setValores] = useState<Record<string, string>>({});
  const [turnos, setTurnos] = useState<Record<string, TurnoConfigValor>>({});
  const [cotizadorModos, setCotizadorModos] = useState<Record<string, SelectionMode>>({});
  const [smtpValores, setSmtpValores] = useState<Record<string, string>>({});
  const [postventaValores, setPostventaValores] = useState<Record<string, string>>({});
  const [pedidosProveedorValores, setPedidosProveedorValores] = useState<
    Record<string, string>
  >({});
  const [feriadosDraft, setFeriadosDraft] = useState<string[] | null>(null);
  const [showInactivos, setShowInactivos] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFiltro>('todas');
  const [catalogoBusqueda, setCatalogoBusqueda] = useState('');
  const [catalogoPage, setCatalogoPage] = useState(1);
  const [catalogoPageSize, setCatalogoPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [productoModalOpen, setProductoModalOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const qc = useQueryClient();

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
  });

  const { data: productos = [], isLoading: loadingProd } = useQuery({
    queryKey: ['productos-catalogo', showInactivos],
    queryFn: () => fetchProductosCatalogo(showInactivos ? undefined : false),
  });

  const valoresIniciales = useMemo(() => {
    const map: Record<string, string> = {};
    config?.numericas.forEach((c) => {
      map[c.clave] = String(c.valor);
    });
    return map;
  }, [config]);

  const turnosIniciales = useMemo(() => {
    const map: Record<string, TurnoConfigValor> = {};
    config?.turnos?.forEach((t) => {
      map[t.clave] = parseTurnoConfig(t.clave, t.valor);
    });
    return map;
  }, [config]);

  const cotizadorModosIniciales = useMemo(() => {
    const map: Record<string, SelectionMode> = {};
    config?.cotizador?.forEach((item) => {
      const v = item.valor;
      map[item.clave] = v === 'multiple' ? 'multiple' : 'single';
    });
    return map;
  }, [config]);

  const smtpIniciales = useMemo(
    () => smtpValoresDesdeItems(config?.smtp),
    [config?.smtp],
  );

  const postventaIniciales = useMemo(
    () => postventaValoresDesdeItems(config?.postventa),
    [config?.postventa],
  );

  const pedidosProveedorIniciales = useMemo(
    () => pedidosProveedorValoresDesdeItems(config?.pedidosProveedor),
    [config?.pedidosProveedor],
  );

  const feriadosIniciales = useMemo(() => {
    const item = config?.calendario?.find((c) => c.clave === 'calendario.feriados');
    return parseFeriadosConfig(item?.valor);
  }, [config]);

  const valoresActuales = Object.keys(valores).length ? valores : valoresIniciales;
  const turnosActuales = Object.keys(turnos).length ? turnos : turnosIniciales;
  const cotizadorModosActuales = Object.keys(cotizadorModos).length
    ? cotizadorModos
    : cotizadorModosIniciales;
  const smtpActuales = Object.keys(smtpValores).length ? smtpValores : smtpIniciales;
  const postventaActuales = Object.keys(postventaValores).length
    ? postventaValores
    : postventaIniciales;
  const pedidosProveedorActuales = Object.keys(pedidosProveedorValores).length
    ? pedidosProveedorValores
    : pedidosProveedorIniciales;
  const feriadosActuales = feriadosDraft ?? feriadosIniciales;

  const hayCambios =
    JSON.stringify(valoresActuales) !== JSON.stringify(valoresIniciales) ||
    JSON.stringify(turnosActuales) !== JSON.stringify(turnosIniciales) ||
    JSON.stringify(cotizadorModosActuales) !== JSON.stringify(cotizadorModosIniciales) ||
    JSON.stringify(smtpActuales) !== JSON.stringify(smtpIniciales) ||
    JSON.stringify(postventaActuales) !== JSON.stringify(postventaIniciales) ||
    JSON.stringify(pedidosProveedorActuales) !==
      JSON.stringify(pedidosProveedorIniciales) ||
    JSON.stringify(feriadosActuales) !== JSON.stringify(feriadosIniciales);

  const smtpOrdenados = useMemo(() => {
    const items = config?.smtp ?? [];
    const byClave = new Map(items.map((i) => [i.clave, i]));
    const ordenados = SMTP_ORDEN.map((clave) => {
      const existente = byClave.get(clave);
      if (existente) return existente;
      return {
        id: clave,
        clave,
        valor: smtpIniciales[clave] ?? '',
        descripcion: null,
        esPublico: false,
      } satisfies ConfigItem;
    });
    const resto = items.filter((i) => !SMTP_ORDEN.includes(i.clave as (typeof SMTP_ORDEN)[number]));
    return [...ordenados, ...resto];
  }, [config?.smtp, smtpIniciales]);

  const smtpHabilitado = smtpActuales['smtp.habilitado'] === 'true';
  const postventaHabilitado = postventaActuales['postventa.habilitado'] === 'true';
  const pedidosProveedorHabilitado =
    pedidosProveedorActuales['pedidos_proveedor.notificar_correo'] === 'true';

  const postventaOrdenados = useMemo(() => {
    const items = config?.postventa ?? [];
    const byClave = new Map(items.map((i) => [i.clave, i]));
    return POSTVENTA_ORDEN.map((clave) => {
      const existente = byClave.get(clave);
      if (existente) return existente;
      return {
        id: clave,
        clave,
        valor: postventaIniciales[clave] ?? '',
        descripcion: null,
        esPublico: false,
      } satisfies ConfigItem;
    });
  }, [config?.postventa, postventaIniciales]);

  const pedidosProveedorOrdenados = useMemo(() => {
    const items = config?.pedidosProveedor ?? [];
    const byClave = new Map(items.map((i) => [i.clave, i]));
    return PEDIDOS_PROVEEDOR_ORDEN.map((clave) => {
      const existente = byClave.get(clave);
      if (existente) return existente;
      return {
        id: clave,
        clave,
        valor: pedidosProveedorIniciales[clave] ?? '',
        descripcion: null,
        esPublico: false,
      } satisfies ConfigItem;
    });
  }, [config?.pedidosProveedor, pedidosProveedorIniciales]);

  const productosFiltrados = useMemo(() => {
    let rows = productos;
    if (categoriaFiltro !== 'todas') {
      rows = rows.filter((p) => p.categoria === categoriaFiltro);
    }
    const q = catalogoBusqueda.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.descripcion?.toLowerCase().includes(q) ?? false),
    );
  }, [productos, categoriaFiltro, catalogoBusqueda]);

  useEffect(() => {
    setCatalogoPage(1);
  }, [categoriaFiltro, showInactivos, catalogoBusqueda, catalogoPageSize]);

  const catalogoTotalPages = Math.max(
    1,
    Math.ceil(productosFiltrados.length / catalogoPageSize),
  );

  const productosPaginados = useMemo(() => {
    const start = (catalogoPage - 1) * catalogoPageSize;
    return productosFiltrados.slice(start, start + catalogoPageSize);
  }, [productosFiltrados, catalogoPage, catalogoPageSize]);

  const guardarConfigMut = useMutation({
    mutationFn: () => {
      const actualizaciones = [
        ...Object.entries(valoresActuales).map(([clave, v]) => ({
          clave,
          valor: Number(v),
        })),
        ...Object.entries(turnosActuales).map(([clave, v]) => ({
          clave,
          valor: turnoParaGuardar(v),
        })),
        ...Object.entries(cotizadorModosActuales).map(([clave, v]) => ({
          clave,
          valor: v,
        })),
        ...Object.entries(smtpActuales).map(([clave, v]) => ({
          clave,
          valor:
            clave === 'smtp.secure' || clave === 'smtp.habilitado'
              ? v === 'true'
              : clave === 'smtp.port'
                ? Number(v)
                : v,
        })),
        ...Object.entries(postventaActuales).map(([clave, v]) => ({
          clave,
          valor: clave === 'postventa.habilitado' ? v === 'true' : v,
        })),
        ...Object.entries(pedidosProveedorActuales).map(([clave, v]) => ({
          clave,
          valor:
            clave === 'pedidos_proveedor.notificar_correo' ? v === 'true' : v,
        })),
        ...(JSON.stringify(feriadosActuales) !== JSON.stringify(feriadosIniciales)
          ? [{ clave: 'calendario.feriados', valor: feriadosActuales }]
          : []),
      ];
      return guardarConfiguracion(actualizaciones);
    },
    onSuccess: async () => {
      setValores({});
      setTurnos({});
      setCotizadorModos({});
      setSmtpValores({});
      setPostventaValores({});
      setPedidosProveedorValores({});
      setFeriadosDraft(null);
      await qc.invalidateQueries({ queryKey: ['config-panel'] });
      await qc.invalidateQueries({ queryKey: ['configuracion-publica'] });
      await qc.invalidateQueries({ queryKey: ['catalogo-publico'] });
      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (err) => {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: apiErrorMessage(err, 'Revisa los valores e intenta de nuevo.'),
      });
    },
  });

  const toggleProductoMut = useMutation({
    mutationFn: (p: Producto) =>
      actualizarProducto(p.id, {
        etapa: p.etapa === 'activo' ? 'inactivo' : 'activo',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos-catalogo'] }),
  });

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
    <div className="relative w-full pb-28">
      <PageHeader breadcrumbs={[CRUMB_INICIO, crumb('Configuración')]} />

      <div className="mt-6 flex gap-2 border-b border-surface-variant">
        {puedeEditarTarifas && (
          <button
            type="button"
            onClick={() => setTab('tarifas')}
            className={`border-b-2 px-4 py-2 text-body-sm font-semibold transition ${
              tab === 'tarifas'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            Tarifas y turnos
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('catalogo')}
          className={`border-b-2 px-4 py-2 text-body-sm font-semibold transition ${
            tab === 'catalogo'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Catálogo
        </button>
        {puedeGestionarCatalogo && (
          <button
            type="button"
            onClick={() => setTab('proveedores')}
            className={`border-b-2 px-4 py-2 text-body-sm font-semibold transition ${
              tab === 'proveedores'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            Proveedores
          </button>
        )}
      </div>

      {tab === 'tarifas' && puedeEditarTarifas && (
        <div className="mt-6 w-full">
          {loadingConfig && <p className="text-outline">Cargando…</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarConfigMut.mutate();
            }}
            className="w-full space-y-8"
          >
            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Tarifas y límites</h3>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {config?.numericas.map((item: ConfigItem) => {
                  const { titulo, ayuda } = configLabel(item);
                  return (
                    <label key={item.clave} className="block">
                      <span className="text-body-sm font-medium text-on-surface">{titulo}</span>
                      {ayuda && <span className="block text-body-sm text-outline">{ayuda}</span>}
                      <input
                        type="number"
                        step="0.01"
                        className={`mt-1 w-full ${INPUT_CLASS}`}
                        value={valoresActuales[item.clave] ?? ''}
                        onChange={(e) =>
                          setValores((prev) => ({
                            ...Object.keys(prev).length ? prev : valoresIniciales,
                            [item.clave]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </section>

            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Cotizador landing</h3>
              <p className="mt-1 text-body-sm text-outline">
                Modo de selección por sección (paquete siempre es uno solo). Single = una opción; multiple =
                varias.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(config?.cotizador ?? []).map((item) => (
                  <label key={item.clave} className="block">
                    <span className="text-body-sm font-medium text-on-surface">
                      {COTIZADOR_MODE_LABEL[item.clave] ?? item.clave}
                    </span>
                    {item.descripcion && (
                      <span className="block text-body-sm text-outline">{item.descripcion}</span>
                    )}
                    <select
                      className={`mt-1 w-full ${INPUT_CLASS}`}
                      value={cotizadorModosActuales[item.clave] ?? 'single'}
                      onChange={(e) =>
                        setCotizadorModos((prev) => ({
                          ...Object.keys(prev).length ? prev : cotizadorModosIniciales,
                          [item.clave]: e.target.value as SelectionMode,
                        }))
                      }
                    >
                      <option value="single">Una opción (single)</option>
                      <option value="multiple">Varias opciones (multiple)</option>
                    </select>
                  </label>
                ))}
              </div>
              {!config?.cotizador?.length && (
                <p className="mt-4 text-body-sm text-outline">
                  Ejecuta el seed de la API para crear las claves del cotizador (`cotizador.*.selection_mode`).
                </p>
              )}
            </section>

            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Turnos del día</h3>
              <p className="mt-1 text-body-sm text-outline">
                Nombre del turno y rango horario (inicio–fin). Se guarda también como texto para la landing.
              </p>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {(config?.turnos ?? []).map((item) => {
                  const t = turnosActuales[item.clave] ?? parseTurnoConfig(item.clave, item.valor);
                  return (
                    <div
                      key={item.clave}
                      className="rounded-xl border border-surface-variant/80 bg-surface-container-low/50 p-4"
                    >
                      <p className="font-semibold text-secondary">
                        {TURNO_KEY_LABEL[item.clave] ?? item.clave}
                      </p>
                      <label className="mt-3 block">
                        <span className="text-label-caps text-outline">Nombre</span>
                        <input
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={t.etiqueta}
                          onChange={(e) =>
                            setTurnos((prev) => ({
                              ...Object.keys(prev).length ? prev : turnosIniciales,
                              [item.clave]: { ...t, etiqueta: e.target.value },
                            }))
                          }
                        />
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-label-caps text-outline">Hora inicio</span>
                          <input
                            type="time"
                            className={`mt-1 w-full ${INPUT_CLASS}`}
                            value={t.horaInicio}
                            onChange={(e) =>
                              setTurnos((prev) => ({
                                ...Object.keys(prev).length ? prev : turnosIniciales,
                                [item.clave]: { ...t, horaInicio: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="text-label-caps text-outline">Hora fin</span>
                          <input
                            type="time"
                            className={`mt-1 w-full ${INPUT_CLASS}`}
                            value={t.horaFin}
                            onChange={(e) =>
                              setTurnos((prev) => ({
                                ...Object.keys(prev).length ? prev : turnosIniciales,
                                [item.clave]: { ...t, horaFin: e.target.value },
                              }))
                            }
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-outline">
                        Vista previa: {horarioDesdeRango(t.horaInicio, t.horaFin)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Feriados</h3>
              <p className="mt-1 text-body-sm text-outline">
                Fechas que aplican tarifa fin de semana aunque caigan entre semana (ej. feriados
                nacionales en Perú). Sábados y domingos se calculan automáticamente.
              </p>
              <div className="mt-6">
                <FeriadosConfigEditor
                  fechas={feriadosActuales}
                  onChange={(fechas) => setFeriadosDraft(fechas)}
                />
              </div>
            </section>

            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Correo SMTP</h3>
              <p className="mt-1 text-body-sm text-outline">
                {smtpHabilitado
                  ? 'Envío automático activo: las cotizaciones se envían desde el servidor.'
                  : 'Envío manual: al usar «Enviar por correo» se abrirá tu cliente de correo con el mensaje precargado.'}
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {smtpOrdenados.map((item) => {
                  const value = smtpActuales[item.clave] ?? '';
                  const { titulo, ayuda } = smtpFieldLabel(item);
                  const isPassword = item.clave === 'smtp.password';
                  const isBoolean =
                    item.clave === 'smtp.secure' || item.clave === 'smtp.habilitado';
                  const isPort = item.clave === 'smtp.port';
                  const setValor = (next: string) =>
                    setSmtpValores((prev) => ({
                      ...Object.keys(prev).length ? prev : smtpIniciales,
                      [item.clave]: next,
                    }));

                  return (
                    <label key={item.clave} className="block">
                      <span className="text-body-sm font-medium text-on-surface">{titulo}</span>
                      {ayuda && <span className="block text-body-sm text-outline">{ayuda}</span>}
                      {isBoolean ? (
                        <select
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value || 'false'}
                          onChange={(e) => setValor(e.target.value)}
                        >
                          <option value="false">No</option>
                          <option value="true">Sí</option>
                        </select>
                      ) : isPassword ? (
                        <div className="mt-1">
                          <PasswordInput value={value} onChange={setValor} autoComplete="new-password" />
                        </div>
                      ) : (
                        <input
                          type={isPort ? 'number' : 'text'}
                          step={isPort ? '1' : undefined}
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Postventa</h3>
              <p className="mt-1 text-body-sm text-outline">
                {postventaHabilitado
                  ? 'Al marcar un evento como realizado se enviará el formulario por correo (requiere SMTP activo y correo del cliente).'
                  : 'Desactivado: no se envía correo de satisfacción al cerrar eventos.'}
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {postventaOrdenados.map((item) => {
                  const value = postventaActuales[item.clave] ?? '';
                  const titulo = POSTVENTA_LABELS[item.clave] ?? item.clave;
                  const isBoolean = item.clave === 'postventa.habilitado';
                  const isTextarea = item.clave === 'postventa.cuerpo';
                  const setValor = (next: string) =>
                    setPostventaValores((prev) => ({
                      ...Object.keys(prev).length ? prev : postventaIniciales,
                      [item.clave]: next,
                    }));

                  return (
                    <label
                      key={item.clave}
                      className={`block ${isTextarea ? 'sm:col-span-2' : ''}`}
                    >
                      <span className="text-body-sm font-medium text-on-surface">{titulo}</span>
                      {item.descripcion && (
                        <span className="mt-0.5 block text-body-sm text-outline">
                          {item.descripcion}
                        </span>
                      )}
                      {isBoolean ? (
                        <select
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value || 'false'}
                          onChange={(e) => setValor(e.target.value)}
                        >
                          <option value="false">No</option>
                          <option value="true">Sí</option>
                        </select>
                      ) : isTextarea ? (
                        <textarea
                          rows={6}
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      ) : (
                        <input
                          type={item.clave === 'postventa.url_formulario' ? 'url' : 'text'}
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            <section className={`w-full p-6 ${CARD_CLASS}`}>
              <h3 className="text-title-md text-primary">Pedidos a proveedores</h3>
              <p className="mt-1 text-body-sm text-outline">
                {pedidosProveedorHabilitado
                  ? 'Al crear un pedido de proveedor (automático o manual) se enviará correo si el proveedor tiene email y SMTP está activo.'
                  : 'Desactivado: el operador contacta al proveedor manualmente (WhatsApp/correo desde el detalle del evento).'}
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {pedidosProveedorOrdenados.map((item) => {
                  const value = pedidosProveedorActuales[item.clave] ?? '';
                  const titulo = PEDIDOS_PROVEEDOR_LABELS[item.clave] ?? item.clave;
                  const isBoolean = item.clave === 'pedidos_proveedor.notificar_correo';
                  const isTextarea = item.clave === 'pedidos_proveedor.cuerpo';
                  const setValor = (next: string) =>
                    setPedidosProveedorValores((prev) => ({
                      ...Object.keys(prev).length ? prev : pedidosProveedorIniciales,
                      [item.clave]: next,
                    }));

                  return (
                    <label
                      key={item.clave}
                      className={`block ${isTextarea ? 'sm:col-span-2' : ''}`}
                    >
                      <span className="text-body-sm font-medium text-on-surface">{titulo}</span>
                      {item.descripcion && (
                        <span className="mt-0.5 block text-body-sm text-outline">
                          {item.descripcion}
                        </span>
                      )}
                      {isBoolean ? (
                        <select
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value || 'false'}
                          onChange={(e) => setValor(e.target.value)}
                        >
                          <option value="false">No</option>
                          <option value="true">Sí</option>
                        </select>
                      ) : isTextarea ? (
                        <textarea
                          rows={6}
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          className={`mt-1 w-full ${INPUT_CLASS}`}
                          value={value}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          </form>

          {puedeEditarTarifas && (
            <FloatingSaveBar
              disabled={!hayCambios}
              saving={guardarConfigMut.isPending}
              onSave={() => guardarConfigMut.mutate()}
            />
          )}
        </div>
      )}

      {tab === 'catalogo' && (
        <div className="mt-6 w-full">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-body-sm text-on-surface">
              <input
                type="checkbox"
                checked={showInactivos}
                onChange={(e) => setShowInactivos(e.target.checked)}
              />
              Mostrar inactivos
            </label>
            {puedeGestionarCatalogo && (
              <Button onClick={abrirNuevoProducto}>+ Nuevo producto</Button>
            )}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FilterSearchInput
              inline
              value={catalogoBusqueda}
              onChange={setCatalogoBusqueda}
              placeholder="Nombre, código o descripción…"
              className="min-w-[240px] flex-1"
            />
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(Object.keys(CATEGORIA_LABEL) as CategoriaFiltro[]).map((categoria) => {
              const active = categoriaFiltro === categoria;
              const count =
                categoria === 'todas'
                  ? productos.length
                  : productos.filter((p) => p.categoria === categoria).length;
              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => setCategoriaFiltro(categoria)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-surface-variant bg-surface text-on-surface-variant hover:border-outline'
                  }`}
                >
                  {CATEGORIA_LABEL[categoria]} ({count})
                </button>
              );
            })}
          </div>

          {!puedeGestionarCatalogo && (
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
            puedeGestionarImagen={puedeGestionarCatalogo}
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
                            !puedeGestionarCatalogo ||
                            imagenMut.isPending ||
                            quitarImagenMut.isPending
                          }
                          onUpload={async (file) => {
                            await imagenMut.mutateAsync({ id: p.id, file });
                          }}
                          onRemove={
                            p.imagenUrl && puedeGestionarCatalogo
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
                        {CATEGORIA_LABEL[p.categoria as CategoriaFiltro] ?? p.categoria}
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
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            p.etapa === 'activo'
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
                            puedeGestionar={puedeGestionarCatalogo}
                            onEditar={abrirEditarProducto}
                            onToggleEstado={(prod) => toggleProductoMut.mutate(prod)}
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
      )}

      {tab === 'proveedores' && puedeGestionarCatalogo && (
        <ProveedoresTab puedeGestionar={puedeGestionarCatalogo} />
      )}
    </div>
  );
}
