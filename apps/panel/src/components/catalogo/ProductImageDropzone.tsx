import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2';
import { apiErrorMessage } from '../../lib/api-error';
import { resolveAssetUrl } from '../../lib/media';

type Props = {
  imagenUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
};

export function ProductImageDropzone({ imagenUrl, onUpload, onRemove, disabled }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    if (!onRemove) return;
    const confirm = await Swal.fire({
      icon: 'question',
      title: '¿Quitar imagen?',
      text: 'El producto quedará sin foto en el catálogo y en la landing.',
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
      setError(apiErrorMessage(err, 'No se pudo quitar la imagen.'));
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
        setError(apiErrorMessage(err, 'No se pudo subir la imagen.'));
      } finally {
        setPending(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => void onDrop(accepted),
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    disabled: disabled || pending,
  });

  const src = resolveAssetUrl(imagenUrl);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {src ? (
          <img
            src={src}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg border border-surface-variant object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-outline bg-surface-container-low text-xs text-outline">
            Sin foto
          </div>
        )}
        <div
          {...getRootProps()}
          className={`min-w-[140px] cursor-pointer rounded-lg border border-dashed px-3 py-2 text-xs transition ${
            isDragActive
              ? 'border-primary bg-primary-fixed/20 text-primary'
              : 'border-surface-variant text-outline hover:border-primary'
          } ${disabled || pending ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          {pending ? 'Procesando…' : isDragActive ? 'Suelta aquí' : 'Arrastra o clic (2 MB)'}
        </div>
        {src && onRemove && !disabled && (
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleRemove()}
            className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
          >
            Quitar imagen
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
