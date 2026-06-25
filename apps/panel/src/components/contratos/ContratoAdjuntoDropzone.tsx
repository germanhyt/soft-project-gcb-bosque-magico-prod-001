import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2';
import { apiErrorMessage } from '../../lib/api-error';
import { resolveAssetUrl } from '../../lib/media';
import type { ContratoAdjunto, TipoAdjuntoContrato } from '../../lib/contratos';

const LABEL: Record<TipoAdjuntoContrato, string> = {
  comprobante_pago: 'Comprobante de pago',
  documento_contabilidad: 'Documento de contabilidad',
};

type Props = {
  tipo: TipoAdjuntoContrato;
  adjunto?: ContratoAdjunto | null;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
};

export function ContratoAdjuntoDropzone({
  tipo,
  adjunto,
  disabled,
  onUpload,
  onRemove,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    if (!onRemove) return;
    const confirm = await Swal.fire({
      icon: 'question',
      title: '¿Quitar archivo?',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    setError('');
    setPending(true);
    try {
      await onRemove();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo quitar el archivo.'));
    } finally {
      setPending(false);
    }
  };

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError('');
      setPending(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(apiErrorMessage(err, 'No se pudo subir el archivo.'));
      } finally {
        setPending(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => void onDrop(accepted),
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: disabled || pending,
  });

  const src = adjunto?.url ? resolveAssetUrl(adjunto.url) : null;

  return (
    <div className="rounded-xl border border-surface-variant bg-surface-container-low/40 p-3">
      <p className="mb-2 text-body-sm font-semibold text-on-surface">{LABEL[tipo]}</p>
      {adjunto && (
        <p className="mb-2 truncate text-xs text-outline" title={adjunto.nombreOriginal}>
          {adjunto.nombreOriginal}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver archivo
          </a>
        )}
        <div
          {...getRootProps()}
          className={`min-w-[120px] cursor-pointer rounded-lg border border-dashed px-3 py-2 text-xs transition ${
            isDragActive
              ? 'border-primary bg-primary-fixed/20 text-primary'
              : 'border-surface-variant text-outline hover:border-primary'
          } ${disabled || pending ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          {pending ? 'Procesando…' : isDragActive ? 'Suelta aquí' : 'Arrastra o clic (5 MB)'}
        </div>
        {adjunto && onRemove && !disabled && (
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleRemove()}
            className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
          >
            Quitar
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
