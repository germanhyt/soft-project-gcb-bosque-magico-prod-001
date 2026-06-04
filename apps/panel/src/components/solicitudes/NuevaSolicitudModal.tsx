import { useFormik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import * as Yup from 'yup';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { crearSolicitudManual } from '../../lib/api';

type Props = { open: boolean; onClose: () => void };

const schema = Yup.object({
  nombreContacto: Yup.string().trim().min(2).required('Requerido'),
  celular: Yup.string().trim().min(9).required('Requerido'),
  correo: Yup.string().trim().email('Correo inválido').optional(),
});

export function NuevaSolicitudModal({ open, onClose }: Props) {
  const qc = useQueryClient();
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
      formik.resetForm();
    },
    onError: async () => {
      await Swal.fire({ icon: 'error', title: 'No se pudo crear la solicitud' });
    },
  });

  const formik = useFormik({
    initialValues: {
      nombreContacto: '',
      celular: '',
      correo: '',
      fechaTentativa: '',
      cantidadNinosEstimada: '',
      notas: '',
      etapaInicial: 'nueva' as 'nueva' | 'en_atencion',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      mutation.mutate({
        nombreContacto: values.nombreContacto.trim(),
        celular: values.celular.trim(),
        correo: values.correo.trim() || undefined,
        canal: 'manual',
        fechaTentativa: values.fechaTentativa || undefined,
        cantidadNinosEstimada: values.cantidadNinosEstimada
          ? Number(values.cantidadNinosEstimada)
          : undefined,
        notas: values.notas.trim() || undefined,
        etapaInicial: values.etapaInicial,
      });
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Nueva solicitud manual">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <label className="block">
            <span className={LABEL_CLASS}>Nombre contacto *</span>
            <input name="nombreContacto" className={INPUT_CLASS} value={formik.values.nombreContacto} onChange={formik.handleChange} />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Celular *</span>
            <input name="celular" className={INPUT_CLASS} value={formik.values.celular} onChange={formik.handleChange} />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Correo</span>
            <input name="correo" type="email" className={INPUT_CLASS} value={formik.values.correo} onChange={formik.handleChange} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL_CLASS}>Fecha tentativa</span>
              <input name="fechaTentativa" type="date" className={INPUT_CLASS} value={formik.values.fechaTentativa} onChange={formik.handleChange} />
            </label>
            <label className="block">
              <span className={LABEL_CLASS}>Niños estimados</span>
              <input name="cantidadNinosEstimada" type="number" min={1} className={INPUT_CLASS} value={formik.values.cantidadNinosEstimada} onChange={formik.handleChange} />
            </label>
          </div>
          <label className="block">
            <span className={LABEL_CLASS}>Estado inicial</span>
            <select name="etapaInicial" className={INPUT_CLASS} value={formik.values.etapaInicial} onChange={formik.handleChange}>
              <option value="nueva">Nueva</option>
              <option value="en_atencion">En atención</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Notas</span>
            <textarea name="notas" rows={3} className={INPUT_CLASS} value={formik.values.notas} onChange={formik.handleChange} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
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
