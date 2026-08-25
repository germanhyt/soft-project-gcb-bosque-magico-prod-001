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
} from '../../lib/api';
import {
  calcularEstimado,
  formatSoles,
  resolverMontoBasePaquete,
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
import { PartyDecor } from '../ui/PartyDecor';
import { SectionTitle } from '../ui/SectionTitle';
import type { QuoteBuilderSelection } from '../../types/quote-builder';
import { esPaquetePersonalizado, esShowPersonalizado } from '../../types/quote-builder';
import { buildSeleccionPaquete, type BuildSeleccionPaqueteOptions } from '../../lib/build-seleccion-paquete';
import { minimoCateringDesdeConfig, minimoUnidadesCatering } from '../../lib/catering-minimo';
import type { ProductoCatalogo } from '../../lib/api';
import { consultarIdentidad } from '../../lib/identidad';
import { fechaMinimaEvento, formatFechaDdMmYyyy, mensajeAnticipacion } from '../../lib/anticipacion';
import { paquetesConfigDesdeItems } from '../../lib/paquetes-config';
import { expandIdsFromQty } from '../../lib/expand-catalog-qty';

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

function buildSchema(tarifas: TarifasConfig, minDiasAnticipacion: number) {
  const fechaMin = fechaMinimaEvento(minDiasAnticipacion);
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
    fechaTentativa: Yup.string()
      .optional()
      .test('anticipacion', `Fecha mínima: ${formatFechaDdMmYyyy(fechaMin)}`, (v) => {
        if (!v) return true;
        return v >= fechaMin;
      }),
    turno: Yup.string().oneOf(['', 'turno_1', 'turno_2', 'turno_3']).optional(),
    cantidadNinos: Yup.number()
      .min(tarifas.minimoNinos, `Mínimo ${tarifas.minimoNinos} niños`)
      .max(
        tarifas.maximoPermitido,
        `Máximo ${tarifas.maximoPermitido} niños en reserva regular — confirma con el equipo si necesitas más`,
      )
      .required('Requerido'),
  });
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

function toPayload(
  values: FormValues,
  selection: QuoteBuilderSelection,
  buildOpts?: BuildSeleccionPaqueteOptions,
): CrearSolicitudPayload {
  const seleccion = buildSeleccionPaquete(selection, buildOpts);
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
      extraIds: selection.extraIds,
      extraCantidades: selection.extraCantidades,
      snackId: selection.snackId || undefined,
      snackCantidad: selection.snackId ? Math.max(selection.snackCantidad, 25) : undefined,
      cajitasCantidad: selection.cajitasCantidad,
      cajitasClasica: selection.cajitasClasica,
      cajitasSaludable: selection.cajitasSaludable,
      piqueos: seleccion.piqueos,
      cateringIds: selection.cateringIds,
      cateringCantidades: Object.fromEntries(
        (seleccion.adicionales ?? []).map((a) => [a.productoId, a.cantidad]),
      ),
    },
  };
  payload.preferencias = preferencias;
  return payload;
}

function fieldClass(error?: string) {
  return `${INPUT_CLASS} ${error ? INPUT_ERROR_CLASS : ''}`;
}

type CartItemView = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipo?: string;
  origenItem?: string;
  notas?: string;
};

type CartQtyEdit =
  | { kind: 'cajitas'; value: number; min: number; max: number }
  | { kind: 'piqueo'; productoId: string; value: number; min: number; max: number }
  | { kind: 'snack'; value: number; min: number; max: number }
  | { kind: 'catering'; productoId: string; value: number; min: number; max: number }
  | { kind: 'show'; productoId: string; value: number; min: number; max: number }
  | { kind: 'extra'; productoId: string; value: number; min: number; max: number };

function resolveCartQtyEdit(
  item: CartItemView,
  selection: QuoteBuilderSelection,
  options: {
    cajitasIncluidas: number;
    snackMin: number;
    showCajitaControl: boolean;
    cateringCatalog?: readonly ProductoCatalogo[];
    minimoCateringGlobal?: number;
  },
): CartQtyEdit | null {
  const id = item.productoId;
  if (selection.piqueoIds.includes(id)) {
    return {
      kind: 'piqueo',
      productoId: id,
      value: selection.piqueosCantidades[id] ?? 1,
      min: 1,
      max: 20,
    };
  }
  if (selection.snackId && selection.snackId === id) {
    return {
      kind: 'snack',
      value: selection.snackCantidad,
      min: options.snackMin,
      max: 200,
    };
  }
  if (selection.cateringIds.includes(id)) {
    const producto = options.cateringCatalog?.find((p) => p.id === id);
    const min = minimoUnidadesCatering(producto, options.minimoCateringGlobal);
    return {
      kind: 'catering',
      productoId: id,
      value: Math.max(selection.cateringCantidades[id] ?? min, min),
      min,
      max: 99,
    };
  }
  if (selection.showIds.includes(id)) {
    return {
      kind: 'show',
      productoId: id,
      value:
        selection.showCantidades[id] ??
        selection.showIds.filter((showId) => showId === id).length,
      min: 1,
      max: 10,
    };
  }
  if (selection.extraIds.includes(id)) {
    return {
      kind: 'extra',
      productoId: id,
      value:
        selection.extraCantidades[id] ??
        selection.extraIds.filter((extraId) => extraId === id).length,
      min: 1,
      max: 10,
    };
  }
  if (
    options.showCajitaControl &&
    item.origenItem === 'incluido_paquete' &&
    /cajita/i.test(item.nombre)
  ) {
    return {
      kind: 'cajitas',
      value: selection.cajitasCantidad,
      min: options.cajitasIncluidas,
      max: 200,
    };
  }
  return null;
}

function CartQtyStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface text-sm font-bold text-primary hover:bg-surface-container-high disabled:opacity-40"
        disabled={value <= min}
        aria-label="Reducir cantidad"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface text-sm font-bold text-primary hover:bg-surface-container-high disabled:opacity-40"
        disabled={value >= max}
        aria-label="Aumentar cantidad"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

type Props = {
  selection: QuoteBuilderSelection;
  onSelectionChange: (next: QuoteBuilderSelection | ((prev: QuoteBuilderSelection) => QuoteBuilderSelection)) => void;
  onFechaChange?: (fecha: string) => void;
};

export function QuoteForm({ selection, onSelectionChange, onFechaChange }: Props) {
  const [identidadHint, setIdentidadHint] = useState<string | null>(null);
  const { data, isLoading, isError } = useConfiguracion();
  const tarifas = data?.tarifas ?? TARIFAS_DEFAULT;
  const feriados = data?.feriados ?? [];
  const paquetesConfig = useMemo(
    () => paquetesConfigDesdeItems(data?.items),
    [data?.items],
  );
  const buildSeleccionOpts = useMemo(
    (): BuildSeleccionPaqueteOptions => ({
      cateringCatalog: data?.productos.catering,
      minimoCateringGlobal: minimoCateringDesdeConfig(data?.items),
    }),
    [data?.items, data?.productos.catering],
  );
  const minDiasAnticipacion = data?.minDiasAnticipacion ?? 7;
  const fechaMinEvento = useMemo(
    () => fechaMinimaEvento(minDiasAnticipacion),
    [minDiasAnticipacion],
  );
  const turnos = useMemo(() => getTurnos(data?.items), [data?.items]);

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
    validationSchema: buildSchema(tarifas, minDiasAnticipacion),
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

        const res = await crearSolicitudPublica(toPayload(values, selection, buildSeleccionOpts));
        const estimado = preview.data
          ? {
              total: preview.data.montos.total,
              base: preview.data.montos.base,
              extraNinos: preview.data.montos.ninosExtra,
              items: preview.data.montos.items,
            }
          : {
              ...calcularEstimado(tarifas, values.fechaTentativa, values.cantidadNinos, feriados, {
                montoBasePaquete: resolverMontoBasePaquete(
                  selection.paquete,
                  data?.productos.paquetes,
                  values.fechaTentativa,
                  feriados,
                  tarifas,
                ),
              }),
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

  const seleccionPreview = useMemo(() => {
    const base = buildSeleccionPaquete(selection, buildSeleccionOpts);
    if (!esPaquetePersonalizado(selection.paquete)) return base;
    const showPers = data?.productos.shows?.find(esShowPersonalizado);
    if (!showPers) return base;
    return { ...base, showIds: [showPers.id] };
  }, [selection, buildSeleccionOpts, data?.productos.shows]);

  const canPreview = Boolean(formik.values.fechaTentativa && selection.paquete);
  const preview = useQuery({
    queryKey: [
      'preview-cotizacion-publica',
      formik.values.fechaTentativa,
      formik.values.cantidadNinos,
      selection.paquete,
      JSON.stringify(seleccionPreview),
    ],
    queryFn: () =>
      previewCotizacionPublica({
        fechaEvento: formik.values.fechaTentativa,
        cantidadNinos: Number(formik.values.cantidadNinos) || tarifas.minimoNinos,
        paquete: selection.paquete,
        seleccion: seleccionPreview,
      }),
    enabled: canPreview,
    retry: 0,
  });

  const montoBasePaquete = useMemo(
    () =>
      resolverMontoBasePaquete(
        selection.paquete,
        data?.productos.paquetes,
        formik.values.fechaTentativa,
        feriados,
        tarifas,
      ),
    [selection.paquete, data?.productos.paquetes, formik.values.fechaTentativa, feriados, tarifas],
  );

  const estimadoFallback = useMemo(
    () =>
      calcularEstimado(tarifas, formik.values.fechaTentativa, formik.values.cantidadNinos, feriados, {
        montoBasePaquete: selection.paquete ? montoBasePaquete : undefined,
      }),
    [
      tarifas,
      formik.values.fechaTentativa,
      formik.values.cantidadNinos,
      feriados,
      selection.paquete,
      montoBasePaquete,
    ],
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

  const cartItems = useMemo((): CartItemView[] => {
    if (preview.data?.items?.length) {
      return preview.data.items.map((item) => ({
        productoId: item.productoId ?? item.nombre,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        tipo: item.categoria,
        origenItem: item.origenItem,
        notas: item.notas,
      }));
    }
    return [];
  }, [preview.data?.items]);

  const handleCartQtyChange = useCallback(
    (edit: CartQtyEdit, nextQty: number) => {
      onSelectionChange((prev) => {
        switch (edit.kind) {
          case 'cajitas':
            return {
              ...prev,
              cajitasCantidad: nextQty,
              cajitasClasica: Math.max(0, nextQty - prev.cajitasSaludable),
            };
          case 'piqueo':
            return {
              ...prev,
              piqueosCantidades: { ...prev.piqueosCantidades, [edit.productoId]: nextQty },
            };
          case 'snack':
            return { ...prev, snackCantidad: nextQty };
          case 'catering':
            return {
              ...prev,
              cateringCantidades: { ...prev.cateringCantidades, [edit.productoId]: nextQty },
            };
          case 'show': {
            const showCantidades = { ...prev.showCantidades, [edit.productoId]: nextQty };
            return {
              ...prev,
              showCantidades,
              showIds: expandIdsFromQty(prev.showIds, showCantidades),
            };
          }
          case 'extra': {
            const extraCantidades = { ...prev.extraCantidades, [edit.productoId]: nextQty };
            return {
              ...prev,
              extraCantidades,
              extraIds: expandIdsFromQty(prev.extraIds, extraCantidades),
            };
          }
          default:
            return prev;
        }
      });
    },
    [onSelectionChange],
  );

  const wa = import.meta.env.VITE_WHATSAPP_NUMBER;
  const waLink = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent('Hola Bosque Mágico, quiero cotizar una fiesta infantil.')}`
    : null;

  const chip = (active: boolean) => (active ? CHIP_OK : CHIP);

  return (
    <section id="cotizar" className={SECTION_QUOTE}>
      <PartyDecor placement="quote-pattern" />
      <div className={`${CONTAINER} relative z-[1]`}>
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
                    min={fechaMinEvento}
                    className={fieldClass(formik.errors.fechaTentativa)}
                    value={formik.values.fechaTentativa}
                    onChange={(e) => {
                      formik.handleChange(e);
                      onFechaChange?.(e.target.value);
                    }}
                    onBlur={formik.handleBlur}
                  />
                  <span className="mt-1 block text-xs text-outline">
                    {mensajeAnticipacion(minDiasAnticipacion)} Mínimo:{' '}
                    {formatFechaDdMmYyyy(fechaMinEvento)}.
                  </span>
                  {formik.touched.fechaTentativa && formik.errors.fechaTentativa && (
                    <span className="mt-1 block text-xs text-red-600">
                      {formik.errors.fechaTentativa}
                    </span>
                  )}
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
                    <span className={chip(selection.cajitasCantidad >= 10)}>
                      Cajitas: {selection.cajitasCantidad} ({selection.cajitasClasica} C / {selection.cajitasSaludable} S)
                    </span>
                    <span className={chip(selection.piqueoIds.length > 0)}>
                      Piqueos: {selection.piqueoIds.length || '—'}
                    </span>
                    <span className={chip(selection.extraIds.length > 0)}>
                      Extras: {selection.extraIds.length > 0 ? selection.extraIds.length : 'Ninguno'}
                    </span>
                    <span className={chip(Boolean(selection.snackId))}>
                      Snack Premium:{' '}
                      {selection.snackId ? `${Math.max(selection.snackCantidad, 25)} uds` : 'Sin elegir'}
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
                  {!selection.paquete
                    ? 'Elige un paquete y una fecha para ver el detalle incluido y cobrable.'
                    : 'Elige una fecha para calcular el desglose de tu paquete.'}
                </p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {(() => {
                    let cajitaControlShown = false;
                    const qtyControlShown = new Set<string>();
                    return cartItems.map((item) => {
                      const showCajitaControl = !cajitaControlShown;
                      const qtyEdit = resolveCartQtyEdit(item, selection, {
                        cajitasIncluidas: paquetesConfig.cajitasIncluidas,
                        snackMin: paquetesConfig.snackPremiumUnidadesIncluidas,
                        showCajitaControl,
                        cateringCatalog: data?.productos.catering,
                        minimoCateringGlobal: buildSeleccionOpts.minimoCateringGlobal,
                      });
                      if (
                        qtyEdit?.kind === 'cajitas' ||
                        (showCajitaControl &&
                          item.origenItem === 'incluido_paquete' &&
                          /cajita/i.test(item.nombre))
                      ) {
                        cajitaControlShown = true;
                      }
                      const controlKey =
                        qtyEdit &&
                        (qtyEdit.kind === 'piqueo' ||
                          qtyEdit.kind === 'catering' ||
                          qtyEdit.kind === 'show' ||
                          qtyEdit.kind === 'extra')
                          ? `${qtyEdit.kind}:${qtyEdit.productoId}`
                          : qtyEdit?.kind === 'snack'
                            ? 'snack'
                            : qtyEdit?.kind === 'cajitas'
                              ? 'cajitas'
                              : null;
                      const showQtyControl =
                        qtyEdit != null &&
                        controlKey != null &&
                        !qtyControlShown.has(controlKey);
                      if (showQtyControl) qtyControlShown.add(controlKey);
                      return (
                        <li
                          key={`${item.productoId}-${item.origenItem ?? item.nombre}`}
                          className="rounded-xl border border-surface-variant/80 bg-surface-container-low px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{item.nombre}</p>
                              <p className="text-xs capitalize text-outline">
                                {item.origenItem === 'incluido_paquete' ? 'Incluido' : item.tipo}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {showQtyControl && qtyEdit ? (
                              <CartQtyStepper
                                value={qtyEdit.value}
                                min={qtyEdit.min}
                                max={qtyEdit.max}
                                onChange={(next) => handleCartQtyChange(qtyEdit, next)}
                              />
                            ) : (
                              <span className="text-sm font-semibold">x{item.cantidad}</span>
                            )}
                            <p className="text-sm font-semibold text-primary">
                              {item.precioUnitario <= 0 ? 'Incluido' : formatSoles(item.subtotal)}
                            </p>
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ul>
              )}

              <h3 className="mt-8 border-t border-surface-variant pt-6 font-display text-headline-md text-primary">
                Resumen referencial
              </h3>
              {isLoading && <p className="mt-4 text-sm text-on-surface-variant">Cargando tarifas…</p>}
              {!formik.values.fechaTentativa && (
                <p className="mt-4 text-sm text-on-surface-variant">
                  Elige paquete y fecha para calcular una estimación con composición incluida.
                </p>
              )}
              {preview.isError && formik.values.fechaTentativa && (
                <p className="mt-4 rounded-lg bg-tertiary-fixed/40 px-3 py-2 text-xs text-tertiary">
                  No pudimos previsualizar complementos en este momento. Mostramos el paquete seleccionado sin complementos.
                </p>
              )}
              {estimado && tarifas && (
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt>
                      {selection.paquete ? `Paquete ${selection.paquete}` : 'Tarifa base'} (
                      {estimado.esFinSemana ? 'fin de semana' : 'L-V'})
                    </dt>
                    <dd className="font-semibold">{formatSoles(estimado.base)}</dd>
                  </div>
                  {estimado.extraNinos > 0 && (
                    <div className="flex justify-between">
                      <dt>Cargos por capacidad (show / extras)</dt>
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
