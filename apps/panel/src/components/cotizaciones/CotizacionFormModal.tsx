import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import Swal from 'sweetalert2';
import * as Yup from 'yup';
import { CotizacionPaqueteEditor } from './CotizacionPaqueteEditor';
import { EnviarCotizacionActions } from './EnviarCotizacionActions';
import { SolicitudPreferenciasLanding } from '../solicitudes/SolicitudPreferenciasLanding';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { INPUT_CLASS, INPUT_ERROR_CLASS, LABEL_CLASS } from '../../constants/design';
import { TURNOS } from '../../constants/solicitudes';
import { apiErrorMessage } from '../../lib/api-error';
import { generarCotizacionBorradorSolicitud, fetchSolicitud } from '../../lib/api';
import {
  actualizarCotizacion,
  crearCotizacion,
  fetchCotizacion,
  fetchProductos,
} from '../../lib/cotizaciones';
import {
  productosParaCotizacion,
} from '../../lib/producto-cotizacion';
import { NOMBRE_ITEM_HORA_ADICIONAL_ESPACIO } from '@bosque/shared';
import {
  INITIAL_SELECCION_PAQUETE,
  seleccionDesdeItemsCotizacion,
  seleccionDesdePreferenciasLanding,
  seleccionToPayload,
  type SeleccionPaqueteState,
} from '../../lib/seleccion-paquete';
import {
  cotizacionActivaDeSolicitud,
  datosLandingDesdePayload,
  esSolicitudDesdeLanding,
  puedeGenerarBorradorDesdePayload,
  resumenPreferenciasLanding,
} from '../../lib/solicitud-cotizacion';

export type CotizacionFormTarget =
  | { mode: 'create'; solicitudId?: string }
  | { mode: 'edit'; cotizacionId: string };

type Props = {
  open: boolean;
  onClose: () => void;
  target: CotizacionFormTarget | null;
  onSaved?: (cotizacionId: string) => void;
};

const schemaCrear = Yup.object({
  nombreCompleto: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .required('Indica el nombre del apoderado'),
  celular: Yup.string()
    .trim()
    .min(9, 'Mínimo 9 dígitos')
    .required('Indica el celular'),
  cumpleaneroNombre: Yup.string()
    .trim()
    .min(1, 'Indica el nombre del cumpleañero')
    .required('Indica el nombre del cumpleañero'),
  fechaEvento: Yup.string().required('Indica la fecha del evento'),
  turno: Yup.string().required('Indica el turno'),
  cantidadNinos: Yup.number()
    .min(1, 'Debe haber al menos 1 niño')
    .required('Indica la cantidad de niños'),
  horasAdicionales: Yup.number().min(0, 'No puede ser negativo').max(8, 'Máximo 8 horas'),
  paquete: Yup.string().trim().required('Selecciona el paquete'),
});

const schemaEditar = Yup.object({
  fechaEvento: Yup.string().required('Indica la fecha del evento'),
  turno: Yup.string().required('Indica el turno'),
  cantidadNinos: Yup.number()
    .min(1, 'Debe haber al menos 1 niño')
    .required('Indica la cantidad de niños'),
  horasAdicionales: Yup.number().min(0, 'No puede ser negativo').max(8, 'Máximo 8 horas'),
  paquete: Yup.string().trim().required('Selecciona el paquete'),
});

const FIELD_LABELS: Record<string, string> = {
  nombreCompleto: 'Nombre apoderado',
  celular: 'Celular',
  cumpleaneroNombre: 'Nombre cumpleañero',
  fechaEvento: 'Fecha del evento',
  turno: 'Turno',
  cantidadNinos: 'Cantidad de niños',
  paquete: 'Paquete',
};

function extraerHorasAdicionales(items?: Array<{ nombre: string; cantidad: number }>) {
  return (items ?? [])
    .filter((item) =>
      item.nombre.trim().toLowerCase() === NOMBRE_ITEM_HORA_ADICIONAL_ESPACIO.toLowerCase(),
    )
    .reduce((sum, item) => sum + item.cantidad, 0);
}

type FormikLite = {
  submitCount: number;
  touched: Record<string, unknown>;
  errors: Record<string, unknown>;
};

function erroresVisibles(formik: FormikLite) {
  if (formik.submitCount === 0) return [];
  return Object.entries(formik.errors)
    .filter(([, msg]) => typeof msg === 'string')
    .map(([key, msg]) => ({
      key,
      label: FIELD_LABELS[key] ?? key,
      msg: String(msg),
    }));
}

function inputConError(formik: FormikLite, name: string) {
  const show = Boolean((formik.touched[name] || formik.submitCount > 0) && formik.errors[name]);
  return `${INPUT_CLASS} ${show ? INPUT_ERROR_CLASS : ''}`;
}

function FieldHint({ formik, name }: { formik: FormikLite; name: string }) {
  const show =
    Boolean(formik.touched[name] || formik.submitCount > 0) &&
    typeof formik.errors[name] === 'string';
  if (!show) return null;
  return <p className="mt-1 text-xs font-medium text-error">{String(formik.errors[name])}</p>;
}

function ValidationBanner({
  items,
  apiError,
}: {
  items: Array<{ key: string; label: string; msg: string }>;
  apiError?: string;
}) {
  if (!items.length && !apiError) return null;
  return (
    <div className="rounded-lg border border-error-container bg-error-container/30 px-3 py-2 text-body-sm text-error">
      <p className="font-semibold">No se puede generar la cotización</p>
      {apiError ? <p className="mt-1">{apiError}</p> : null}
      {items.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {items.map((e) => (
            <li key={e.key}>
              {e.label}: {e.msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CotizacionFormModal({ open, onClose, target, onSaved }: Props) {
  const qc = useQueryClient();
  const solicitudIdInicial = target?.mode === 'create' ? target.solicitudId : undefined;

  const { data: solicitud, isLoading: loadingSolicitud } = useQuery({
    queryKey: ['solicitud', solicitudIdInicial],
    queryFn: () => fetchSolicitud(solicitudIdInicial!),
    enabled: open && !!solicitudIdInicial,
  });

  const [resolvedTarget, setResolvedTarget] = useState<CotizacionFormTarget | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) setFormError('');
  }, [open]);

  useEffect(() => {
    if (!open || !target) {
      setResolvedTarget(null);
      return;
    }
    if (target.mode === 'create' && solicitudIdInicial && solicitud) {
      const existente = cotizacionActivaDeSolicitud(solicitud);
      if (existente?.etapa === 'borrador') {
        setResolvedTarget({ mode: 'edit', cotizacionId: existente.id });
        return;
      }
      if (existente) {
        setResolvedTarget(null);
        onClose();
        void Swal.fire({
          icon: 'info',
          title: 'Ya existe cotización',
          text: `Estado: ${existente.etapa}. Ábrela desde el detalle.`,
        });
        return;
      }
    }
    setResolvedTarget(target);
  }, [open, target, solicitudIdInicial, solicitud, onClose]);

  const activeTarget = resolvedTarget ?? (open ? target : null);
  const activeEsEdicion = activeTarget?.mode === 'edit';
  const activeCotizacionId = activeEsEdicion ? activeTarget.cotizacionId : undefined;
  const activeSolicitudId = activeTarget?.mode === 'create' ? activeTarget.solicitudId : undefined;

  const { data: cot, isLoading: loadingCot, isError: errorCot } = useQuery({
    queryKey: ['cotizacion', activeCotizacionId],
    queryFn: () => fetchCotizacion(activeCotizacionId!),
    enabled: open && activeEsEdicion && !!activeCotizacionId,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos,
    enabled: open,
  });

  const catalogo = useMemo(() => productosParaCotizacion(productos), [productos]);
  const [seleccion, setSeleccion] = useState<SeleccionPaqueteState>(INITIAL_SELECCION_PAQUETE);
  const [mostrarFormularioManual, setMostrarFormularioManual] = useState(false);

  const solicitudActiva =
    activeSolicitudId && solicitud?.id === activeSolicitudId ? solicitud : undefined;
  const desdeLanding = solicitudActiva ? esSolicitudDesdeLanding(solicitudActiva) : false;
  const puedeAutoBorrador = solicitudActiva ? puedeGenerarBorradorDesdePayload(solicitudActiva) : false;
  const resumenLanding = solicitudActiva ? resumenPreferenciasLanding(solicitudActiva) : null;
  const landing = solicitudActiva ? datosLandingDesdePayload(solicitudActiva) : null;

  useEffect(() => {
    if (!open) return;
    setMostrarFormularioManual(false);
    if (activeEsEdicion && cot?.items?.length) {
      setSeleccion(seleccionDesdeItemsCotizacion(cot.items, productos));
    } else if (!activeEsEdicion && solicitudActiva) {
      const data = datosLandingDesdePayload(solicitudActiva);
      setSeleccion(seleccionDesdePreferenciasLanding(data.seleccion));
    } else {
      setSeleccion({ ...INITIAL_SELECCION_PAQUETE });
    }
  }, [open, activeEsEdicion, cot?.id, cot?.items, solicitudActiva?.id, productos]);

  const paqueteDefault = useMemo(() => {
    if (activeEsEdicion) return cot?.paquete ?? '';
    if (landing?.paquete) return landing.paquete;
    if (catalogo.paquetes.length === 1) return catalogo.paquetes[0].nombre;
    return '';
  }, [activeEsEdicion, cot?.paquete, landing?.paquete, catalogo.paquetes]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: activeEsEdicion
      ? {
          fechaEvento: cot?.fechaEvento?.slice(0, 10) ?? '',
          turno: cot?.turno ?? 'turno_1',
          cantidadNinos: cot?.cantidadNinos ?? 25,
          horasAdicionales: extraerHorasAdicionales(cot?.items),
          tematica: cot?.tematica ?? '',
          paquete: cot?.paquete ?? '',
          notas: cot?.notas ?? '',
        }
      : {
          nombreCompleto: solicitudActiva?.nombreContacto ?? '',
          celular: solicitudActiva?.celular ?? '',
          correo: solicitudActiva?.correo ?? '',
          cumpleaneroNombre: landing?.cumpleaneroNombre ?? '',
          cumpleaneroEdad: landing?.cumpleaneroEdad ?? '',
          fechaEvento: solicitudActiva?.fechaTentativa?.slice(0, 10) ?? '',
          turno: solicitudActiva?.turnoInteres ?? 'turno_1',
          cantidadNinos: solicitudActiva?.cantidadNinosEstimada ?? 25,
          horasAdicionales: 0,
          tematica: landing?.tematica ?? '',
          paquete: paqueteDefault,
          notas: solicitudActiva?.notas ?? '',
        },
    validationSchema: activeEsEdicion ? schemaEditar : schemaCrear,
    onSubmit: (values) => {
      const seleccionPayload = seleccionToPayload(seleccion, catalogo.catering);

      if (activeEsEdicion) {
        actualizarMut.mutate({
          fechaEvento: values.fechaEvento,
          turno: values.turno,
          cantidadNinos: Number(values.cantidadNinos),
          horasAdicionales: Number((values as { horasAdicionales?: number }).horasAdicionales) || 0,
          tematica: (values as { tematica?: string }).tematica?.trim() || undefined,
          paquete: values.paquete.trim(),
          notas: (values as { notas?: string }).notas?.trim() || undefined,
          seleccion: seleccionPayload,
        });
      } else {
        const v = values as {
          nombreCompleto: string;
          celular: string;
          correo: string;
          cumpleaneroNombre: string;
          cumpleaneroEdad: string;
          horasAdicionales?: number;
          tematica: string;
          notas: string;
        };
        crearMut.mutate({
          solicitudId: activeSolicitudId,
          cliente: {
            nombreCompleto: v.nombreCompleto.trim(),
            celular: v.celular.trim(),
            correo: v.correo.trim() || undefined,
          },
          cumpleanero: {
            nombre: v.cumpleaneroNombre.trim() || 'Por confirmar',
            edad: v.cumpleaneroEdad ? Number(v.cumpleaneroEdad) : undefined,
            tematicaFavorita: v.tematica.trim() || undefined,
          },
          fechaEvento: values.fechaEvento,
          turno: values.turno,
          cantidadNinos: Number(values.cantidadNinos),
          horasAdicionales: Number(v.horasAdicionales) || 0,
          tematica: v.tematica.trim() || undefined,
          paquete: values.paquete.trim(),
          notas: v.notas.trim() || undefined,
          seleccion: seleccionPayload,
        });
      }
    },
  });

  const formikLite = formik as unknown as FormikLite;
  const validacionItems = erroresVisibles(formikLite);

  const invalidar = async () => {
    await qc.invalidateQueries({ queryKey: ['cotizaciones'] });
    await qc.invalidateQueries({ queryKey: ['solicitudes'] });
    if (activeCotizacionId) await qc.invalidateQueries({ queryKey: ['cotizacion', activeCotizacionId] });
    if (activeSolicitudId) await qc.invalidateQueries({ queryKey: ['solicitud', activeSolicitudId] });
  };

  const actualizarMut = useMutation({
    mutationFn: (payload: Parameters<typeof actualizarCotizacion>[1]) =>
      actualizarCotizacion(activeCotizacionId!, payload),
    onSuccess: async (updated) => {
      await invalidar();
      if (updated.advertencia) {
        await Swal.fire({ icon: 'warning', title: updated.advertencia });
      }
      onSaved?.(updated.id);
      onClose();
    },
    onError: async (err: unknown) => {
      const msg = apiErrorMessage(err, 'No se pudo actualizar la cotización');
      setFormError(msg);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: msg,
      });
    },
  });

  const crearMut = useMutation({
    mutationFn: crearCotizacion,
    onSuccess: async (created) => {
      await invalidar();
      if (created.advertencia) {
        await Swal.fire({ icon: 'warning', title: created.advertencia });
      }
      onSaved?.(created.id);
      onClose();
    },
    onError: async (err: unknown) => {
      const msg = apiErrorMessage(err, 'No se pudo crear la cotización');
      setFormError(msg);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo generar',
        text: msg,
      });
    },
  });

  const generarBorradorMut = useMutation({
    mutationFn: () => generarCotizacionBorradorSolicitud(activeSolicitudId!),
    onSuccess: async (res) => {
      await invalidar();
      await Swal.fire({
        icon: 'success',
        title: 'Borrador generado',
        text: res.cotizacion.codigo,
        timer: 2000,
        showConfirmButton: false,
      });
      onSaved?.(res.cotizacion.id);
      onClose();
    },
    onError: async (err: unknown) => {
      const msg = apiErrorMessage(err, 'No se pudo generar el borrador');
      setFormError(msg);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo generar',
        text: msg,
      });
    },
  });

  if (!open || !activeTarget) return null;

  if (activeEsEdicion && loadingCot) {
    return (
      <Modal open onClose={onClose} title="Editar borrador" size="xl">
        <p className="text-outline">Cargando cotización…</p>
      </Modal>
    );
  }

  if (activeEsEdicion && (errorCot || !cot)) {
    return (
      <Modal open onClose={onClose} title="Editar borrador" size="xl">
        <p className="text-error">No se pudo cargar la cotización.</p>
      </Modal>
    );
  }

  if (activeEsEdicion && cot!.etapa !== 'borrador') {
    return (
      <Modal open onClose={onClose} title="Editar cotización" size="md">
        <p className="text-on-surface">
          Solo se pueden editar cotizaciones en <strong>borrador</strong>. Esta está en{' '}
          <strong>{cot!.etapa}</strong>.
        </p>
        <Button className="mt-4" onClick={onClose}>
          Cerrar
        </Button>
      </Modal>
    );
  }

  if (!activeEsEdicion && activeSolicitudId && loadingSolicitud && !resolvedTarget) {
    return (
      <Modal open onClose={onClose} title="Nueva cotización" size="xl">
        <p className="text-outline">Cargando solicitud…</p>
      </Modal>
    );
  }

  const titulo = activeEsEdicion
    ? `Editar borrador · ${cot!.codigo}`
    : activeSolicitudId
      ? desdeLanding
        ? 'Cotización desde solicitud (landing)'
        : 'Cotización desde solicitud'
      : 'Nueva cotización manual';

  const descripcion = activeEsEdicion
    ? `${cot!.cliente.nombreCompleto} · ${cot!.cliente.celular}. Total actual: S/ ${cot!.montoTotal}. El servidor recalcula precios al guardar.`
    : activeSolicitudId
      ? puedeAutoBorrador
        ? 'El cliente ya eligió paquete y servicios. Genera el borrador con un clic o ajusta el formulario.'
        : 'Completa los datos. El backend recalcula precios al guardar.'
      : 'Contacto sin cotizador web (WhatsApp, Meta, manual).';

  const mostrarFormulario =
    activeEsEdicion || mostrarFormularioManual || !puedeAutoBorrador;

  return (
    <Modal open onClose={onClose} title={titulo} description={descripcion} size="xl">
      {solicitudActiva && resumenLanding && (
        <SolicitudPreferenciasLanding solicitud={solicitudActiva} />
      )}

      {!activeEsEdicion && puedeAutoBorrador && activeSolicitudId && (
        <div className="mb-4 rounded-xl border border-primary/40 bg-primary-fixed/25 p-4">
          <p className="font-semibold text-primary">Borrador recomendado</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Usa la misma lógica que el cotizador de la landing.
          </p>
          <Button
            className="mt-3"
            disabled={generarBorradorMut.isPending}
            onClick={() => generarBorradorMut.mutate()}
          >
            {generarBorradorMut.isPending ? 'Generando…' : 'Generar borrador automático'}
          </Button>
          {formError && (
            <p className="mt-3 text-body-sm font-medium text-error">{formError}</p>
          )}
        </div>
      )}

      {!activeEsEdicion && puedeAutoBorrador && !mostrarFormularioManual && (
        <button
          type="button"
          className="mb-4 text-body-sm font-semibold text-secondary hover:text-primary"
          onClick={() => setMostrarFormularioManual(true)}
        >
          Mostrar formulario manual (ajustes finos)
        </button>
      )}

      {mostrarFormulario && (
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <ValidationBanner items={validacionItems} apiError={formError} />
          {!activeEsEdicion && (
            <fieldset className="rounded-xl border border-surface-variant bg-surface-container-low/50 p-4">
              <legend className="text-body-md font-semibold text-primary">Cliente y cumpleañero</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={LABEL_CLASS}>Nombre apoderado *</span>
                  <input
                    name="nombreCompleto"
                    className={inputConError(formikLite, 'nombreCompleto')}
                    placeholder="Ej. María López"
                    value={(formik.values as { nombreCompleto: string }).nombreCompleto}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldHint formik={formikLite} name="nombreCompleto" />
                </label>
                <label className="block">
                  <span className={LABEL_CLASS}>Celular *</span>
                  <input
                    name="celular"
                    className={inputConError(formikLite, 'celular')}
                    placeholder="Ej. 999888777"
                    value={(formik.values as { celular: string }).celular}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldHint formik={formikLite} name="celular" />
                </label>
                <label className="block">
                  <span className={LABEL_CLASS}>Correo</span>
                  <input
                    name="correo"
                    type="email"
                    className={INPUT_CLASS}
                    placeholder="Ej. familia@email.com"
                    value={(formik.values as { correo: string }).correo}
                    onChange={formik.handleChange}
                  />
                </label>
                <label className="block">
                  <span className={LABEL_CLASS}>Nombre cumpleañero *</span>
                  <input
                    name="cumpleaneroNombre"
                    className={inputConError(formikLite, 'cumpleaneroNombre')}
                    placeholder="Ej. Valentina"
                    value={(formik.values as { cumpleaneroNombre: string }).cumpleaneroNombre}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldHint formik={formikLite} name="cumpleaneroNombre" />
                </label>
                <label className="block">
                  <span className={LABEL_CLASS}>Edad</span>
                  <input
                    name="cumpleaneroEdad"
                    type="number"
                    min={1}
                    max={15}
                    className={INPUT_CLASS}
                    placeholder="Ej. 5"
                    value={(formik.values as { cumpleaneroEdad: string }).cumpleaneroEdad}
                    onChange={formik.handleChange}
                  />
                </label>
              </div>
            </fieldset>
          )}

          <fieldset className="rounded-xl border border-surface-variant bg-surface-container-low/50 p-4">
            <legend className="text-body-md font-semibold text-primary">Evento</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL_CLASS}>Fecha del evento *</span>
                <input
                  name="fechaEvento"
                  type="date"
                  className={inputConError(formikLite, 'fechaEvento')}
                  value={formik.values.fechaEvento}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <FieldHint formik={formikLite} name="fechaEvento" />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>Turno *</span>
                <select
                  name="turno"
                  className={inputConError(formikLite, 'turno')}
                  value={formik.values.turno}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {TURNOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <FieldHint formik={formikLite} name="turno" />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>Cantidad de niños *</span>
                <input
                  name="cantidadNinos"
                  type="number"
                  min={1}
                  className={inputConError(formikLite, 'cantidadNinos')}
                  placeholder="Ej. 25"
                  value={formik.values.cantidadNinos}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <FieldHint formik={formikLite} name="cantidadNinos" />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>Horas adicionales de espacio</span>
                <input
                  name="horasAdicionales"
                  type="number"
                  min={0}
                  max={8}
                  className={inputConError(formikLite, 'horasAdicionales')}
                  placeholder="Ej. 1"
                  value={(formik.values as { horasAdicionales?: number }).horasAdicionales ?? 0}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <FieldHint formik={formikLite} name="horasAdicionales" />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>Paquete *</span>
                {catalogo.paquetes.length > 0 ? (
                  <select
                    name="paquete"
                    className={inputConError(formikLite, 'paquete')}
                    value={formik.values.paquete}
                    onChange={(e) => {
                      formik.handleChange(e);
                      setSeleccion({
                        ...INITIAL_SELECCION_PAQUETE,
                        showIds: seleccion.showIds,
                        extraIds: seleccion.extraIds,
                      });
                    }}
                    onBlur={formik.handleBlur}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogo.paquetes.map((p) => (
                      <option key={p.id} value={p.nombre}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="paquete"
                    className={inputConError(formikLite, 'paquete')}
                    placeholder="Ej. Estándar"
                    value={formik.values.paquete}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                )}
                <FieldHint formik={formikLite} name="paquete" />
              </label>
              <label className="block sm:col-span-2">
                <span className={LABEL_CLASS}>Temática</span>
                <input
                  name="tematica"
                  className={INPUT_CLASS}
                  placeholder="Ej. Superhéroes"
                  value={formik.values.tematica}
                  onChange={formik.handleChange}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={LABEL_CLASS}>Notas</span>
                <textarea
                  name="notas"
                  rows={2}
                  className={INPUT_CLASS}
                  placeholder="Ej. Alergias, observaciones o pedido especial"
                  value={formik.values.notas}
                  onChange={formik.handleChange}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-surface-variant bg-surface-container-low/50 p-4">
            <legend className="text-body-md font-semibold text-primary">
              Composición del paquete
            </legend>
            <div className="mt-3">
              <CotizacionPaqueteEditor
                paquete={formik.values.paquete}
                fechaEvento={formik.values.fechaEvento}
                cantidadNinos={Number(formik.values.cantidadNinos) || 25}
                horasAdicionales={Number((formik.values as { horasAdicionales?: number }).horasAdicionales) || 0}
                seleccion={seleccion}
                onChange={setSeleccion}
                catalogo={catalogo}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
            {activeEsEdicion && cot && (
              <>
                <EnviarCotizacionActions
                  cotizacionId={cot.id}
                  etapa={cot.etapa}
                  cliente={cot.cliente}
                  onSuccess={onClose}
                />
                <p className="text-center text-xs text-outline">
                  Guarda los cambios antes de enviar si modificaste ítems o montos.
                </p>
              </>
            )}
            <ValidationBanner items={validacionItems} apiError={formError} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={actualizarMut.isPending || crearMut.isPending}
              >
                {actualizarMut.isPending || crearMut.isPending
                  ? 'Guardando…'
                  : activeEsEdicion
                    ? 'Guardar borrador'
                    : 'Guardar borrador manual'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
