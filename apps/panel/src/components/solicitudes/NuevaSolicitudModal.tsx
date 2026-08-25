import { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import * as Yup from 'yup';
import { LABEL_CLASS } from '../../constants/design';
import { TURNOS } from '../../constants/solicitudes';
import { apiErrorMessage } from '../../lib/api-error';
import { crearSolicitudManual } from '../../lib/api';
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

type Props = { open: boolean; onClose: () => void };

const FIELD_LABELS: Record<string, string> = {
  nombreContacto: 'Nombre contacto',
  celular: 'Celular',
  correo: 'Correo',
  fechaTentativa: 'Fecha tentativa',
  turnoInteres: 'Turno de interés',
  cantidadNinosEstimada: 'Niños estimados',
  notas: 'Notas',
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
    etapaInicial: Yup.mixed<'nueva' | 'en_atencion'>().oneOf(['nueva', 'en_atencion']).required(),
  });
}

const INITIAL = {
  nombreContacto: '',
  celular: '',
  correo: '',
  fechaTentativa: '',
  turnoInteres: '',
  cantidadNinosEstimada: '' as string | number,
  notas: '',
  etapaInicial: 'nueva' as 'nueva' | 'en_atencion',
};

export function NuevaSolicitudModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const capacidad = useCapacidadEvento();
  const schema = useMemo(() => schemaSolicitud(capacidad), [capacidad]);
  const mutation = useMutation({
    mutationFn: crearSolicitudManual,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['solicitudes'] });
      await qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] });
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud creada',
        timer: 2000,
        showConfirmButton: false,
      });
      onClose();
    },
    onError: async (err) => {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo crear la solicitud',
        text: apiErrorMessage(err, 'Revisa los datos e inténtalo de nuevo.'),
      });
    },
  });

  const formik = useFormik({
    initialValues: INITIAL,
    validationSchema: schema,
    onSubmit: (values) => {
      mutation.mutate({
        nombreContacto: values.nombreContacto.trim(),
        celular: values.celular.trim(),
        correo: values.correo.trim() || undefined,
        canal: 'manual',
        fechaTentativa: values.fechaTentativa || undefined,
        turnoInteres: values.turnoInteres
          ? (values.turnoInteres as 'turno_1' | 'turno_2' | 'turno_3')
          : undefined,
        cantidadNinosEstimada: values.cantidadNinosEstimada
          ? Number(values.cantidadNinosEstimada)
          : undefined,
        notas: values.notas.trim() || undefined,
        etapaInicial: values.etapaInicial,
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    formik.resetForm({ values: INITIAL });
    mutation.reset();
    // Solo al abrir el modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const formikLite = formik as unknown as FormikLite;
  const validacionItems = erroresVisibles(formikLite, FIELD_LABELS);
  const apiError = mutation.isError
    ? apiErrorMessage(mutation.error, 'No se pudo crear la solicitud')
    : undefined;

  return (
    <Modal open={open} onClose={onClose} title="Nueva solicitud manual">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <ValidationBanner
          items={validacionItems}
          apiError={apiError}
          title="No se puede crear la solicitud"
        />
        <label className="block">
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
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
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
          <span className={LABEL_CLASS}>Estado inicial</span>
          <select
            name="etapaInicial"
            className={inputConError(formikLite, 'etapaInicial')}
            value={formik.values.etapaInicial}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="nueva">Nueva</option>
            <option value="en_atencion">En atención</option>
          </select>
          <FieldHint formik={formikLite} name="etapaInicial" />
        </label>
        <label className="block">
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
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {mutation.isPending ? 'Guardando…' : 'Crear solicitud'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
