import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { linkMailto } from '../../lib/contacto-links';
import { asuntoCorreoCliente, mensajeCorreoCliente } from '../../lib/mensajes-contacto';
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

  const enviar = async () => {
    if (archivos.length > 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Adjuntos',
        text: 'El envío por correo del panel abrirá tu cliente de correo; los adjuntos debes agregarlos manualmente allí.',
        timer: 3500,
        showConfirmButton: false,
      });
    }
    window.location.href = linkMailto(correo, asunto, mensaje);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Contactar por correo"
      description="Revisá el asunto y el mensaje antes de enviar."
      size="lg"
    >
      <div className="space-y-4">
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
          <span className={LABEL_CLASS}>Archivos adjuntos (opcional, solo CRM)</span>
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
        <Button type="button" variant="ghost" onClick={handleClose}>
          Cerrar
        </Button>
        <Button
          type="button"
          className="inline-flex gap-2"
          onClick={() => void enviar()}
          disabled={!asunto.trim() || !mensaje.trim()}
        >
          <Icon name="mail" size={20} />
          Enviar{archivos.length > 0 ? ` (${archivos.length})` : ''}
        </Button>
      </div>
    </Modal>
  );
}
