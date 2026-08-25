import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { apiErrorMessage } from '../../lib/api-error';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import {
  abrirClienteCorreo,
  enviarCorreoContactoApi,
} from '../../lib/enviar-contacto-correo';
import { asuntoCorreoCliente, mensajeCorreoCliente } from '../../lib/mensajes-contacto';
import { parseSmtpEstado } from '../../lib/smtp-config';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

type Props = {
  open: boolean;
  onClose: () => void;
  nombre: string;
  correo: string;
};

function totalBytes(files: File[]) {
  return files.reduce((n, f) => n + f.size, 0);
}

export function ContactarCorreoModal({ open, onClose, nombre, correo }: Props) {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: smtpActivo = false } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    select: (data) => (data.meta?.smtp ?? parseSmtpEstado(data.smtp)).activo,
    staleTime: 60_000,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setAsunto(asuntoCorreoCliente());
      setMensaje(mensajeCorreoCliente(nombre));
      setArchivos([]);
    }
  }, [open, nombre]);

  const handleClose = () => {
    setArchivos([]);
    onClose();
  };

  const agregarArchivos = (lista: FileList | null) => {
    if (!lista?.length) return;
    const nuevos = [...archivos];
    for (const file of Array.from(lista)) {
      if (nuevos.length >= MAX_FILES) break;
      if (file.size > MAX_FILE_BYTES) {
        void Swal.fire({
          icon: 'warning',
          title: 'Archivo muy grande',
          text: `${file.name} supera 5 MB.`,
        });
        continue;
      }
      if (totalBytes(nuevos) + file.size > MAX_TOTAL_BYTES) {
        void Swal.fire({
          icon: 'warning',
          title: 'Límite total',
          text: 'El total de adjuntos no puede superar 15 MB.',
        });
        break;
      }
      nuevos.push(file);
    }
    setArchivos(nuevos.slice(0, MAX_FILES));
  };

  const enviarMut = useMutation({
    mutationFn: () =>
      enviarCorreoContactoApi({
        correoDestino: correo,
        asunto: asunto.trim(),
        cuerpo: mensaje.trim(),
        archivos: smtpActivo ? archivos : undefined,
      }),
    onSuccess: async (res) => {
      if (res.enviadoPorSmtp) {
        await Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'El mensaje se envió desde el servidor SMTP.',
          timer: 2200,
          showConfirmButton: false,
        });
        handleClose();
        return;
      }
      if (archivos.length > 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Adjuntos',
          text: 'SMTP está inactivo: se abrirá tu cliente de correo y los adjuntos debes agregarlos manualmente allí.',
          timer: 3500,
          showConfirmButton: false,
        });
      }
      abrirClienteCorreo(correo, asunto.trim(), mensaje.trim());
      await Swal.fire({
        icon: 'info',
        title: 'Cliente de correo',
        html: '<p class="text-sm">Se abrió tu aplicación de correo con el mensaje editado. Revisa y envía manualmente.</p>',
        timer: 3200,
        showConfirmButton: false,
      });
      handleClose();
    },
    onError: async (err: unknown) => {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: apiErrorMessage(err, 'No se pudo enviar el correo'),
      });
    },
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Contactar por correo"
      description={
        smtpActivo
          ? 'Revisa el asunto y el mensaje. Se enviará automáticamente vía SMTP.'
          : 'Revisa el asunto y el mensaje. Luego se abrirá tu cliente de correo para enviar manualmente.'
      }
      size="lg"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 px-3 py-2 text-body-sm">
          <span className="text-outline">Para: </span>
          <span className="font-medium text-on-surface">{correo}</span>
        </div>
        <label className="block">
          <span className={LABEL_CLASS}>Asunto</span>
          <input
            className={INPUT_CLASS}
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Mensaje</span>
          <textarea
            className={`${INPUT_CLASS} min-h-[160px] resize-y`}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={8}
          />
        </label>
        <div>
          <span className={LABEL_CLASS}>
            Archivos adjuntos (opcional{smtpActivo ? '' : ', solo si abres el cliente de correo'})
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              agregarArchivos(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low/50 px-4 py-8 text-center text-body-sm text-on-surface-variant transition hover:border-primary/40 hover:bg-surface-container-low"
          >
            <Icon name="upload_file" size={28} filled={false} className="mb-2 text-outline" />
            Arrastra archivos aquí o haz clic para seleccionar
            <span className="mt-2 text-xs">
              Hasta {MAX_FILES} archivos · 5 MB c/u · 15 MB en total
              {smtpActivo ? ' · se envían con el correo SMTP' : ''}
            </span>
          </button>
          {archivos.length > 0 && (
            <ul className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              {archivos.map((f) => (
                <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-error hover:underline"
                    onClick={() => setArchivos((prev) => prev.filter((x) => x !== f))}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClose} disabled={enviarMut.isPending}>
          Cerrar
        </Button>
        <Button
          type="button"
          className="inline-flex gap-2"
          onClick={() => enviarMut.mutate()}
          disabled={!asunto.trim() || !mensaje.trim() || enviarMut.isPending}
        >
          <Icon name="mail" size={20} />
          {enviarMut.isPending
            ? 'Enviando…'
            : smtpActivo
              ? `Enviar por SMTP${archivos.length > 0 ? ` (${archivos.length})` : ''}`
              : 'Abrir correo y enviar'}
        </Button>
      </div>
    </Modal>
  );
}
