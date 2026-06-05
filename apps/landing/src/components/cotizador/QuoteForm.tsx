import { useQuery } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useCallback, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import * as Yup from 'yup';
import { TURNOS } from '../../constants/content';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import {
  crearSolicitudPublica,
  previewCotizacionPublica,
  type ConfiguracionItem,
  type CrearSolicitudPayload,
  type PreviewCotizacionItemPayload,
  type ProductoCatalogo,
} from '../../lib/api';
import {
  calcularEstimado,
  formatSoles,
  isWeekend,
  TARIFAS_DEFAULT,
  type TarifasConfig,
} from '../../lib/pricing';
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CART_PANEL,
  CHIP,
  CHIP_OK,
  CONTAINER,
  FIELDSET_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  SECTION_QUOTE,
  SWAL_CONFIRM_COLOR,
} from '../../constants/design';
import { CatalogConnectionAlert } from '../ui/CatalogConnectionAlert';
import { MotionReveal } from '../ui/MotionReveal';
import { SectionTitle } from '../ui/SectionTitle';
import type { QuoteBuilderSelection } from '../../types/quote-builder';
import { consultarIdentidad } from '../../lib/identidad';

type FormValues = {
  nombre: string;
  celular: string;
  correo: string;
  cumpleaneroNombre: string;
  cumpleaneroEdad: string;
  fechaTentativa: string;
  turno: '' | 'turno_1' | 'turno_2' | 'turno_3';
  cantidadNinos: number;
  tematica: string;
  observaciones: string;
};

const initialValues: FormValues = {
  nombre: '',
  celular: '',
  correo: '',
  cumpleaneroNombre: '',
  cumpleaneroEdad: '',
  fechaTentativa: '',
  turno: '',
  cantidadNinos: 25,
  tematica: '',
  observaciones: '',
};

function buildSchema(tarifas: TarifasConfig) {
  return Yup.object({
    nombre: Yup.string().trim().min(2, 'Mínimo 2 caracteres').max(150).required('Requerido'),
    celular: Yup.string().trim().min(9, 'Celular inválido').max(40).required('Requerido'),
    correo: Yup.string()
      .trim()
      .max(150)
      .test('correo', 'Correo inválido', (v) => !v || Yup.string().email().isValidSync(v)),
    cumpleaneroEdad: Yup.string().test('edad', 'Edad entre 1 y 15', (v) => {
      if (!v) return true;
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 15;
    }),
    fechaTentativa: Yup.string().optional(),
    turno: Yup.string().oneOf(['', 'turno_1', 'turno_2', 'turno_3']).optional(),
    cantidadNinos: Yup.number()
      .min(tarifas.minimoNinos, `Mínimo ${tarifas.minimoNinos} niños`)
      .max(50, 'Máximo 50 — confirma con el equipo')
      .required('Requerido'),
  });
}

function buildProductoById(productos?: {
  paquetes: ProductoCatalogo[];
  shows: ProductoCatalogo[];
  catering: ProductoCatalogo[];
  extras: ProductoCatalogo[];
  espacios: ProductoCatalogo[];
}) {
  const all = [
    ...(productos?.paquetes ?? []),
    ...(productos?.shows ?? []),
    ...(productos?.catering ?? []),
    ...(productos?.extras ?? []),
    ...(productos?.espacios ?? []),
  ];
  return new Map(all.map((p) => [p.id, p]));
}

function getTurnos(items: ConfiguracionItem[] | undefined) {
  if (!items?.length) return TURNOS;
  const turnos = items
    .filter((item) => item.clave.startsWith('turnos.'))
    .sort((a, b) => a.clave.localeCompare(b.clave))
    .map((item) => {
      const valor = item.valor as { etiqueta?: string; horario?: string } | null;
      const value = item.clave.split('.').pop();
      if (!value || (value !== 'turno_1' && value !== 'turno_2' && value !== 'turno_3')) return null;
      const etiqueta = valor?.etiqueta ? String(valor.etiqueta) : value.replace('_', ' ');
      const horario = valor?.horario ? String(valor.horario) : '';
      return {
        value,
        label: horario ? `${etiqueta} - ${horario}` : etiqueta,
      };
    })
    .filter(Boolean) as Array<{ value: 'turno_1' | 'turno_2' | 'turno_3'; label: string }>;
  return turnos.length ? turnos : TURNOS;
}

function getMinimoCatering(items: ConfiguracionItem[] | undefined) {
  const minimo = items?.find((item) => item.clave === 'catering.minimo_unidades')?.valor;
  return typeof minimo === 'number' && minimo > 0 ? minimo : 18;
}

function getMinCantidadCatering(producto: ProductoCatalogo | undefined, minimoGlobal: number) {
  return Math.max(producto?.cantidadMinima ?? 1, minimoGlobal);
}

function buildPreviewItems(
  selection: QuoteBuilderSelection,
  minimoCatering: number,
  productoById: Map<string, ProductoCatalogo>,
): PreviewCotizacionItemPayload[] {
  const items: PreviewCotizacionItemPayload[] = [];
  for (const showId of selection.showIds) {
    items.push({ productoId: showId, cantidad: 1 });
  }
  for (const cateringId of selection.cateringIds) {
    const producto = productoById.get(cateringId);
    const minQty = getMinCantidadCatering(producto, minimoCatering);
    items.push({
      productoId: cateringId,
      cantidad: Math.max(selection.cateringCantidades[cateringId] ?? minQty, minQty),
    });
  }
  for (const extraId of selection.extraIds) {
    const cantidad = Math.max(selection.extraCantidades[extraId] ?? 1, 1);
    items.push({ productoId: extraId, cantidad });
  }
  return items;
}

function toPayload(
  values: FormValues,
  selection: QuoteBuilderSelection,
  previewItems: PreviewCotizacionItemPayload[],
  productoById: Map<string, ProductoCatalogo>,
): CrearSolicitudPayload {
  const payload: CrearSolicitudPayload = {
    cliente: {
      nombre: values.nombre.trim(),
      celular: values.celular.trim(),
    },
  };
  if (values.correo.trim()) payload.cliente.correo = values.correo.trim();
  if (values.cumpleaneroNombre.trim() || values.cumpleaneroEdad) {
    payload.cumpleanero = {};
    if (values.cumpleaneroNombre.trim()) payload.cumpleanero.nombre = values.cumpleaneroNombre.trim();
    if (values.cumpleaneroEdad) payload.cumpleanero.edad = Number(values.cumpleaneroEdad);
  }
  payload.evento = {
    cantidadNinos: values.cantidadNinos,
    paquete: selection.paquete,
  };
  if (values.fechaTentativa) payload.evento.fechaTentativa = values.fechaTentativa;
  if (values.turno) payload.evento.turno = values.turno;
  if (values.tematica.trim()) payload.evento.tematica = values.tematica.trim();
  if (values.observaciones.trim()) payload.observaciones = values.observaciones.trim();
  const preferencias: Record<string, unknown> = {
    origen: 'landing_cotizador',
    seleccion: {
      paquete: selection.paquete || undefined,
      showIds: selection.showIds,
      showCantidades: selection.showCantidades,
      cateringIds: selection.cateringIds,
      cateringCantidades: selection.cateringCantidades,
      extraIds: selection.extraIds,
      extraCantidades: selection.extraCantidades,
    },
    items: previewItems.map((item) => ({
      productoId: item.productoId,
      nombre: productoById.get(item.productoId)?.nombre ?? item.productoId,
      cantidad: item.cantidad,
    })),
  };
  payload.preferencias = preferencias;
  return payload;
}

function fieldClass(error?: string) {
  return `${INPUT_CLASS} ${error ? INPUT_ERROR_CLASS : ''}`;
}

type Props = {
  selection: QuoteBuilderSelection;
  onSelectionChange: (next: QuoteBuilderSelection | ((prev: QuoteBuilderSelection) => QuoteBuilderSelection)) => void;
};

export function QuoteForm({ selection, onSelectionChange }: Props) {
  const [identidadHint, setIdentidadHint] = useState<string | null>(null);
  const { data, isLoading, isError } = useConfiguracion();
  const tarifas = data?.tarifas ?? TARIFAS_DEFAULT;
  const turnos = useMemo(() => getTurnos(data?.items), [data?.items]);
  const minimoCatering = useMemo(() => getMinimoCatering(data?.items), [data?.items]);
  const productoById = useMemo(() => buildProductoById(data?.productos), [data?.productos]);

  const revisarIdentidad = useCallback(async (celular: string, correo?: string) => {
    if (celular.replace(/\D/g, '').length < 9) {
      setIdentidadHint(null);
      return;
    }
    try {
      const r = await consultarIdentidad(celular.trim(), correo?.trim());
      if (r.solicitudesRecientes24h) {
        setIdentidadHint('Ya registramos una solicitud reciente con estos datos.');
      } else if (r.clienteId || r.totalSolicitudes > 0) {
        setIdentidadHint(
          r.totalSolicitudes === 1
            ? '¡Te reconocemos! Ya nos has contactado antes.'
            : `¡Hola de nuevo! Tienes ${r.totalSolicitudes} solicitudes previas.`,
        );
      } else {
        setIdentidadHint(null);
      }
    } catch {
      setIdentidadHint(null);
    }
  }, []);

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema: buildSchema(tarifas),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        if (!selection.paquete) {
          await Swal.fire({
            icon: 'warning',
            title: 'Elige un paquete',
            text: 'Selecciona uno de los paquetes en su sección antes de enviar la solicitud.',
            confirmButtonColor: SWAL_CONFIRM_COLOR,
          });
          return;
        }

        const previewItems = buildPreviewItems(selection, minimoCatering, productoById);
        const res = await crearSolicitudPublica(toPayload(values, selection, previewItems, productoById));
        const estimado = preview.data
          ? {
              total: preview.data.montos.total,
              base: preview.data.montos.base,
              extraNinos: preview.data.montos.ninosExtra,
              items: preview.data.montos.items,
            }
          : {
              ...calcularEstimado(tarifas, values.fechaTentativa, values.cantidadNinos),
              items: 0,
            };
        await Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          html: `
            <p>${res.mensaje}</p>
            <p class="mt-2 text-sm">Referencia: <strong>${res.id.slice(0, 8)}…</strong></p>
            <p class="mt-2 text-sm">Estimado referencial: <strong>${formatSoles(estimado.total)}</strong></p>
            ${estimado.items > 0 ? `<p class="mt-2 text-sm">Incluye complementos: <strong>${formatSoles(estimado.items)}</strong></p>` : ''}
            ${res.posibleDuplicado ? '<p class="mt-2 text-sm text-amber-700">Ya tenemos una solicitud reciente con estos datos; te contactaremos pronto.</p>' : ''}
            ${res.identidad?.clienteConocido && !res.posibleDuplicado ? '<p class="mt-2 text-sm text-primary">¡Gracias por volver a confiar en Bosque Mágico!</p>' : ''}
          `,
          confirmButtonColor: SWAL_CONFIRM_COLOR,
        });
        resetForm();
        setIdentidadHint(null);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string };
        const msg = axiosErr.response?.data?.message;
        const sinRespuesta = err && typeof err === 'object' && !axiosErr.response;
        const texto = sinRespuesta
          ? 'No pudimos conectar con el servidor. Verifica tu conexión o intenta más tarde.'
          : Array.isArray(msg)
            ? msg.join(', ')
            : msg ?? 'No pudimos registrar tu solicitud. Intenta de nuevo.';
        await Swal.fire({
          icon: 'error',
          title: 'Error al enviar',
          text: String(texto),
          confirmButtonColor: SWAL_CONFIRM_COLOR,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const previewItems = useMemo(
    () => buildPreviewItems(selection, minimoCatering, productoById),
    [selection, minimoCatering, productoById],
  );

  const canPreview = Boolean(formik.values.fechaTentativa);
  const preview = useQuery({
    queryKey: [
      'preview-cotizacion-publica',
      formik.values.fechaTentativa,
      formik.values.cantidadNinos,
      selection.paquete,
      ...previewItems.flatMap((item) => [item.productoId, item.cantidad]),
    ],
    queryFn: () =>
      previewCotizacionPublica({
        fechaEvento: formik.values.fechaTentativa,
        cantidadNinos: Number(formik.values.cantidadNinos) || tarifas.minimoNinos,
        paquete: selection.paquete || undefined,
        items: previewItems,
      }),
    enabled: canPreview,
    retry: 0,
  });

  const estimadoFallback = useMemo(
    () => calcularEstimado(tarifas, formik.values.fechaTentativa, formik.values.cantidadNinos),
    [tarifas, formik.values.fechaTentativa, formik.values.cantidadNinos],
  );

  const estimado: {
    base: number;
    extraNinos: number;
    items: number;
    total: number;
    esFinSemana: boolean;
    advertencia?: string;
  } = useMemo(() => {
    if (preview.data) {
      return {
        base: preview.data.montos.base,
        extraNinos: preview.data.montos.ninosExtra,
        items: preview.data.montos.items,
        total: preview.data.montos.total,
        esFinSemana: preview.data.esFinSemana,
        advertencia: preview.data.advertencia,
      };
    }
    return {
      base: estimadoFallback.base,
      extraNinos: estimadoFallback.extraNinos,
      items: 0,
      total: estimadoFallback.total,
      esFinSemana: estimadoFallback.esFinSemana,
      advertencia: estimadoFallback.advertencia,
    };
  }, [preview.data, estimadoFallback]);

  const cartItems = useMemo(() => {
    const esFds = isWeekend(formik.values.fechaTentativa);
    return previewItems
      .map((item) => {
        const producto = productoById.get(item.productoId);
        if (!producto) return null;
        const precioUnitario = esFds ? producto.precioFinSemana : producto.precioLunesViernes;
        return {
          productoId: item.productoId,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario,
          subtotal: precioUnitario * item.cantidad,
          tipo: producto.categoria,
        };
      })
      .filter(Boolean) as Array<{
      productoId: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      tipo: ProductoCatalogo['categoria'];
    }>;
  }, [previewItems, productoById, formik.values.fechaTentativa]);

  const wa = import.meta.env.VITE_WHATSAPP_NUMBER;
  const waLink = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent('Hola Bosque Mágico, quiero cotizar una fiesta infantil.')}`
    : null;

  const chip = (active: boolean) => (active ? CHIP_OK : CHIP);

  return (
    <section id="cotizar" className={SECTION_QUOTE}>
      <div className={CONTAINER}>
        <SectionTitle
          pill="Cotizador"
          title="Arma tu solicitud en minutos"
          subtitle="Estimación referencial en pantalla. El equipo confirma disponibilidad y detalle final."
        />

        <CatalogConnectionAlert className="mb-6" />
        {isError && (
          <p className="mb-6 text-sm text-on-surface-variant">
            Mientras el servidor no responda, el envío de solicitud permanece deshabilitado. Los
            paquetes y el formulario básico usan valores por defecto solo para referencia.
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
          <form onSubmit={formik.handleSubmit} className="space-y-6 lg:col-span-3">
            <MotionReveal>
            <fieldset className={FIELDSET_CLASS}>
              <legend className="px-1 font-display text-headline-md text-primary">Datos de contacto</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium">Nombre completo *</span>
                  <input
                    name="nombre"
                    className={fieldClass(formik.errors.nombre)}
                    value={formik.values.nombre}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.nombre && formik.errors.nombre && (
                    <span className="mt-1 block text-xs text-red-600">{formik.errors.nombre}</span>
                  )}
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Celular *</span>
                  <input
                    name="celular"
                    type="tel"
                    className={fieldClass(formik.errors.celular)}
                    value={formik.values.celular}
                    onChange={formik.handleChange}
                    onBlur={(e) => {
                      formik.handleBlur(e);
                      void revisarIdentidad(formik.values.celular, formik.values.correo);
                    }}
                    placeholder="999 888 777"
                  />
                  {formik.touched.celular && formik.errors.celular && (
                    <span className="mt-1 block text-xs text-red-600">{formik.errors.celular}</span>
                  )}
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Correo (opcional)</span>
                  <input
                    name="correo"
                    type="email"
                    className={fieldClass(formik.errors.correo)}
                    value={formik.values.correo}
                    onChange={formik.handleChange}
                    onBlur={(e) => {
                      formik.handleBlur(e);
                      void revisarIdentidad(formik.values.celular, formik.values.correo);
                    }}
                  />
                </label>
              </div>
              {identidadHint && (
                <p className="mt-2 rounded-lg border border-primary/20 bg-primary-fixed/15 px-3 py-2 text-sm text-primary">
                  {identidadHint}
                </p>
              )}
            </fieldset>
            </MotionReveal>

            <MotionReveal delay={0.06}>
            <fieldset className={FIELDSET_CLASS}>
              <legend className="px-1 font-display text-headline-md text-primary">Cumpleañero y evento</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Nombre del cumpleañero</span>
                  <input
                    name="cumpleaneroNombre"
                    className={fieldClass()}
                    value={formik.values.cumpleaneroNombre}
                    onChange={formik.handleChange}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Edad</span>
                  <input
                    name="cumpleaneroEdad"
                    type="number"
                    min={1}
                    max={15}
                    className={fieldClass(formik.errors.cumpleaneroEdad)}
                    value={formik.values.cumpleaneroEdad}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Fecha tentativa</span>
                  <input
                    name="fechaTentativa"
                    type="date"
                    className={fieldClass()}
                    value={formik.values.fechaTentativa}
                    onChange={formik.handleChange}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Turno</span>
                  <select
                    name="turno"
                    className={fieldClass()}
                    value={formik.values.turno}
                    onChange={formik.handleChange}
                  >
                    <option value="">Aún no definido</option>
                    {turnos.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Cantidad de niños *</span>
                  <input
                    name="cantidadNinos"
                    type="number"
                    min={tarifas?.minimoNinos ?? 10}
                    max={50}
                    className={fieldClass(formik.errors.cantidadNinos)}
                    value={formik.values.cantidadNinos}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.cantidadNinos && formik.errors.cantidadNinos && (
                    <span className="mt-1 block text-xs text-red-600">
                      {formik.errors.cantidadNinos}
                    </span>
                  )}
                </label>
                <div className="rounded-2xl border border-primary/15 bg-primary-fixed/12 p-5 sm:col-span-2">
                  <p className="font-display text-sm font-bold text-primary">Tu selección</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Configura paquete y complementos arriba; aquí confirmas contacto y envías.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={chip(Boolean(selection.paquete))}>
                      Paquete: {selection.paquete || 'Pendiente'}
                    </span>
                    <span className={chip(selection.showIds.length > 0)}>
                      Show:{' '}
                      {selection.showIds.length > 0
                        ? `${selection.showIds.length} show${selection.showIds.length > 1 ? 's' : ''}`
                        : 'Sin show'}
                    </span>
                    <span className={chip(selection.cateringIds.length > 0)}>
                      Catering:{' '}
                      {selection.cateringIds.length > 0
                        ? `${selection.cateringIds.length} snack${selection.cateringIds.length > 1 ? 's' : ''}`
                        : 'Sin catering'}
                    </span>
                    <span className={chip(selection.extraIds.length > 0)}>
                      Extras: {selection.extraIds.length > 0 ? selection.extraIds.length : 'Ninguno'}
                    </span>
                  </div>
                </div>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium">Temática</span>
                  <input
                    name="tematica"
                    className={fieldClass()}
                    value={formik.values.tematica}
                    onChange={formik.handleChange}
                    placeholder="Princesas, superhéroes, bosque encantado…"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium">Comentarios</span>
                  <textarea
                    name="observaciones"
                    rows={3}
                    className={fieldClass()}
                    value={formik.values.observaciones}
                    onChange={formik.handleChange}
                  />
                </label>
              </div>
            </fieldset>
            </MotionReveal>

            <button
              type="submit"
              disabled={formik.isSubmitting || isLoading || isError}
              className={`${BTN_PRIMARY} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {formik.isSubmitting ? 'Enviando…' : isError ? 'Servidor no disponible' : 'Enviar solicitud'}
            </button>
          </form>

          <MotionReveal delay={0.1} className="lg:col-span-2">
            <div className={CART_PANEL}>
              <h3 className="font-display text-headline-md text-primary">Carrito de cotización</h3>
              {cartItems.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/60 px-4 py-4 text-sm leading-relaxed text-on-surface-variant">
                  Aún no agregaste complementos. Elige show, catering o extras en las secciones anteriores.
                </p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {cartItems.map((item) => (
                    <li
                      key={item.productoId}
                      className="rounded-xl border border-surface-variant/80 bg-surface-container-low px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.nombre}</p>
                          <p className="text-xs capitalize text-outline">{item.tipo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.tipo === 'show') {
                              onSelectionChange((prev) => {
                                const nextCantidades = { ...prev.showCantidades };
                                delete nextCantidades[item.productoId];
                                return {
                                  ...prev,
                                  showIds: prev.showIds.filter((id) => id !== item.productoId),
                                  showCantidades: nextCantidades,
                                };
                              });
                            }
                            if (item.tipo === 'catering') {
                              onSelectionChange((prev) => {
                                const nextCantidades = { ...prev.cateringCantidades };
                                delete nextCantidades[item.productoId];
                                return {
                                  ...prev,
                                  cateringIds: prev.cateringIds.filter((id) => id !== item.productoId),
                                  cateringCantidades: nextCantidades,
                                };
                              });
                            }
                            if (item.tipo === 'extra') {
                              onSelectionChange((prev) => {
                                const nextCantidades = { ...prev.extraCantidades };
                                delete nextCantidades[item.productoId];
                                return {
                                  ...prev,
                                  extraIds: prev.extraIds.filter((id) => id !== item.productoId),
                                  extraCantidades: nextCantidades,
                                };
                              });
                            }
                          }}
                          className="text-xs font-semibold text-tertiary hover:text-tertiary-fixed-dim"
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-7 w-7 rounded-full border border-surface-variant text-sm"
                            onClick={() => {
                              if (item.tipo === 'catering') {
                                const producto = productoById.get(item.productoId);
                                const minQty = getMinCantidadCatering(producto, minimoCatering);
                                onSelectionChange((prev) => {
                                  const current = prev.cateringCantidades[item.productoId] ?? minQty;
                                  return {
                                    ...prev,
                                    cateringCantidades: {
                                      ...prev.cateringCantidades,
                                      [item.productoId]: Math.max(minQty, current - 1),
                                    },
                                  };
                                });
                              }
                              if (item.tipo === 'extra') {
                                onSelectionChange((prev) => {
                                  const current = prev.extraCantidades[item.productoId] ?? 1;
                                  return {
                                    ...prev,
                                    extraCantidades: {
                                      ...prev.extraCantidades,
                                      [item.productoId]: Math.max(1, current - 1),
                                    },
                                  };
                                });
                              }
                            }}
                            disabled={item.tipo === 'show'}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold">x{item.cantidad}</span>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-full border border-surface-variant text-sm"
                            onClick={() => {
                              if (item.tipo === 'catering') {
                                const producto = productoById.get(item.productoId);
                                const minQty = getMinCantidadCatering(producto, minimoCatering);
                                onSelectionChange((prev) => {
                                  const current = prev.cateringCantidades[item.productoId] ?? minQty;
                                  return {
                                    ...prev,
                                    cateringCantidades: {
                                      ...prev.cateringCantidades,
                                      [item.productoId]: Math.min(200, current + 1),
                                    },
                                  };
                                });
                              }
                              if (item.tipo === 'extra') {
                                onSelectionChange((prev) => {
                                  const current = prev.extraCantidades[item.productoId] ?? 1;
                                  return {
                                    ...prev,
                                    extraCantidades: {
                                      ...prev.extraCantidades,
                                      [item.productoId]: Math.min(50, current + 1),
                                    },
                                  };
                                });
                              }
                            }}
                            disabled={item.tipo === 'show'}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-primary">{formatSoles(item.subtotal)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-8 border-t border-surface-variant pt-6 font-display text-headline-md text-primary">
                Resumen referencial
              </h3>
              {isLoading && <p className="mt-4 text-sm text-on-surface-variant">Cargando tarifas…</p>}
              {!formik.values.fechaTentativa && (
                <p className="mt-4 text-sm text-on-surface-variant">
                  Elige una fecha para calcular una estimación más precisa.
                </p>
              )}
              {preview.isError && formik.values.fechaTentativa && (
                <p className="mt-4 rounded-lg bg-tertiary-fixed/40 px-3 py-2 text-xs text-tertiary">
                  No pudimos previsualizar complementos en este momento. Mostramos tarifa base referencial.
                </p>
              )}
              {estimado && tarifas && (
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt>Tarifa base ({estimado.esFinSemana ? 'fin de semana' : 'L-V'})</dt>
                    <dd className="font-semibold">{formatSoles(estimado.base)}</dd>
                  </div>
                  {estimado.extraNinos > 0 && (
                    <div className="flex justify-between">
                      <dt>Niños extra (26–35)</dt>
                      <dd className="font-semibold">{formatSoles(estimado.extraNinos)}</dd>
                    </div>
                  )}
                  {estimado.items > 0 && (
                    <div className="flex justify-between">
                      <dt>Complementos (show/catering/extras)</dt>
                      <dd className="font-semibold">{formatSoles(estimado.items)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between rounded-xl bg-primary-fixed/25 px-3 py-3 text-base">
                    <dt className="font-bold text-primary">Total estimado</dt>
                    <dd className="text-price-tag text-primary">{formatSoles(estimado.total)}</dd>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <dt>Adelanto referencial</dt>
                    <dd>{formatSoles(tarifas.adelanto)}</dd>
                  </div>
                  {estimado.advertencia && (
                    <p className="rounded-lg bg-tertiary-fixed/40 px-3 py-2 text-xs text-tertiary">
                      {estimado.advertencia}
                    </p>
                  )}
                  {preview.isFetching && (
                    <p className="text-xs text-on-surface-variant">Actualizando estimación con catálogo…</p>
                  )}
                </dl>
              )}
              <p className="mt-4 text-xs text-outline">
                La cotización definitiva la confirma el equipo según disponibilidad, shows y catering.
              </p>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`${BTN_SECONDARY} mt-4 w-full px-4 py-2 text-sm`}
                >
                  Escribir por WhatsApp
                </a>
              )}
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
