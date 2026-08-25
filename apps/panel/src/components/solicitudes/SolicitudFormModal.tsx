import { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiErrorMessage } from '../../lib/api-error';
import type { ActualizarSolicitudPayload, Solicitud, TurnoInteres } from '../../lib/api';
import { TURNOS } from '../../constants/solicitudes';
import { LABEL_CLASS } from '../../constants/design';
import { useCapacidadEvento } from '../../hooks/useCapacidadEvento';
import {
  hintCapacidadEvento,
  mensajeCapacidadMaximo,
  mensajeCapacidadMinimo,
  type CapacidadEvento,
} from '../../lib/capacidad-evento';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  FieldHint,
  ValidationBanner,
  erroresVisibles,
  inputConError,
  type FormikLite,
} from '../ui/FormValidation';

type Props = {
  open: boolean;
  solicitud?: Solicitud | null;
  onClose: () => void;
  onSubmit: (payload: ActualizarSolicitudPayload) => Promise<void>;
};

type FormValues = {
  nombreContacto: string;
  celular: string;
  correo: string;
  fechaTentativa: string;
  turnoInteres: '' | TurnoInteres;
  cantidadNinosEstimada: string | number;
  notas: string;
  proximoSeguimiento: string;
};

const FIELD_LABELS: Record<string, string> = {
  nombreContacto: 'Nombre contacto',
  celular: 'Celular',
  correo: 'Correo',
  fechaTentativa: 'Fecha tentativa',
  turnoInteres: 'Turno de interés',
  cantidadNinosEstimada: 'Niños estimados',
  notas: 'Notas',
  proximoSeguimiento: 'Próximo seguimiento',
};

function schemaSolicitud(capacidad: CapacidadEvento) {
  return Yup.object({
    nombreContacto: Yup.string()
      .trim()
      .min(2, 'Mínimo 2 caracteres')
      .max(150, 'Máximo 150 caracteres')
      .required('Indica el nombre de contacto'),
    celular: Yup.string()
      .trim()
      .min(9, 'Mínimo 9 dígitos')
      .max(40, 'Máximo 40 caracteres')
      .required('Indica el celular'),
    correo: Yup.string()
      .trim()
      .transform((v) => (v === '' ? undefined : v))
      .email('Indica un correo válido')
      .max(150, 'Máximo 150 caracteres')
      .optional(),
    fechaTentativa: Yup.string().optional(),
    turnoInteres: Yup.string().optional(),
    cantidadNinosEstimada: Yup.number()
      .transform((value, original) => (original === '' || original == null ? undefined : value))
      .typeError('Indica un número válido')
      .min(capacidad.minimo, mensajeCapacidadMinimo(capacidad.minimo))
      .max(capacidad.maximoPermitido, mensajeCapacidadMaximo(capacidad.maximoPermitido))
      .optional(),
    notas: Yup.string().trim().max(2000, 'Máximo 2 000 caracteres').optional(),
    proximoSeguimiento: Yup.string().optional(),
  });
}

const EMPTY: FormValues = {
  nombreContacto: '',
  celular: '',
  correo: '',
  fechaTentativa: '',
  turnoInteres: '',
  cantidadNinosEstimada: '',
  notas: '',
  proximoSeguimiento: '',
};

function toDateInput(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromSolicitud(s: Solicitud): FormValues {
  return {
    nombreContacto: s.nombreContacto,
    celular: s.celular,
    correo: s.correo ?? '',
    fechaTentativa: toDateInput(s.fechaTentativa),
    turnoInteres: s.turnoInteres ?? '',
    cantidadNinosEstimada:
      s.cantidadNinosEstimada != null ? String(s.cantidadNinosEstimada) : '',
    notas: s.notas ?? '',
    proximoSeguimiento: toDatetimeLocal(s.proximoSeguimientoEn),
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function SolicitudFormModal({ open, solicitud, onClose, onSubmit }: Props) {
  const capacidad = useCapacidadEvento();
  const schema = useMemo(() => schemaSolicitud(capacidad), [capacidad]);
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: solicitud ? fromSolicitud(solicitud) : EMPTY,
    validationSchema: schema,
    onSubmit: async (values, helpers) => {
      if (!solicitud) return;
      try {
        await onSubmit({
          nombreContacto: values.nombreContacto.trim(),
          celular: values.celular.trim(),
          correo: optionalText(values.correo),
          fechaTentativa: values.fechaTentativa.trim(),
          turnoInteres: values.turnoInteres ? values.turnoInteres : null,
          cantidadNinosEstimada: values.cantidadNinosEstimada
            ? Number(values.cantidadNinosEstimada)
            : undefined,
          notas: values.notas,
          proximoSeguimientoEn: values.proximoSeguimiento
            ? new Date(values.proximoSeguimiento).toISOString()
            : undefined,
        });
        onClose();
      } catch (err) {
        helpers.setStatus(apiErrorMessage(err, 'No se pudo guardar la solicitud'));
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    formik.setStatus(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, solicitud?.id]);

  const formikLite = formik as unknown as FormikLite;
  const validacionItems = erroresVisibles(formikLite, FIELD_LABELS);
  const apiError = typeof formik.status === 'string' ? formik.status : undefined;

  return (
    <Modal open={open} onClose={onClose} title="Editar solicitud" size="lg">
      {!solicitud ? (
        <p className="text-on-surface-variant">Cargando solicitud…</p>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={formik.handleSubmit}>
          <div className="sm:col-span-2">
            <ValidationBanner
              items={validacionItems}
              apiError={apiError}
              title="No se puede guardar la solicitud"
            />
          </div>
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Nombre contacto *</span>
            <input
              name="nombreContacto"
              className={inputConError(formikLite, 'nombreContacto')}
              value={formik.values.nombreContacto}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ej. Carlos Ruiz"
            />
            <FieldHint formik={formikLite} name="nombreContacto" />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Celular *</span>
            <input
              name="celular"
              className={inputConError(formikLite, 'celular')}
              value={formik.values.celular}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="988 777 666"
            />
            <FieldHint formik={formikLite} name="celular" />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Correo</span>
            <input
              name="correo"
              type="email"
              className={inputConError(formikLite, 'correo')}
              value={formik.values.correo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="contacto@correo.com"
            />
            <FieldHint formik={formikLite} name="correo" />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Fecha tentativa</span>
            <input
              name="fechaTentativa"
              type="date"
              className={inputConError(formikLite, 'fechaTentativa')}
              value={formik.values.fechaTentativa}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldHint formik={formikLite} name="fechaTentativa" />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Turno de interés</span>
            <select
              name="turnoInteres"
              className={inputConError(formikLite, 'turnoInteres')}
              value={formik.values.turnoInteres}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="">Sin turno</option>
              {TURNOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <FieldHint formik={formikLite} name="turnoInteres" />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Niños estimados</span>
            <input
              name="cantidadNinosEstimada"
              type="number"
              min={capacidad.minimo}
              max={capacidad.maximoPermitido}
              className={inputConError(formikLite, 'cantidadNinosEstimada')}
              value={formik.values.cantidadNinosEstimada}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="25"
            />
            <span className="mt-1 block text-xs text-on-surface-variant">
              {hintCapacidadEvento(capacidad)}
            </span>
            <FieldHint formik={formikLite} name="cantidadNinosEstimada" />
          </label>
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Próximo seguimiento</span>
            <input
              name="proximoSeguimiento"
              type="datetime-local"
              className={inputConError(formikLite, 'proximoSeguimiento')}
              value={formik.values.proximoSeguimiento}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldHint formik={formikLite} name="proximoSeguimiento" />
          </label>
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Notas</span>
            <textarea
              name="notas"
              rows={3}
              className={inputConError(formikLite, 'notas')}
              value={formik.values.notas}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Detalle del evento o pedido del cliente"
            />
            <FieldHint formik={formikLite} name="notas" />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {formik.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
