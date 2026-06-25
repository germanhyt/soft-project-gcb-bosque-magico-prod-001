import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2';
import { apiErrorMessage } from '../../lib/api-error';
import type { Producto, ProductoMedia } from '../../lib/cotizaciones';
import { resolveAssetUrl } from '../../lib/media';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';

type Props = {
  producto: Producto;
  disabled?: boolean;
  onUploadImagen: (file: File) => Promise<void>;
  onEliminarMedia: (mediaId: string) => Promise<void>;
  onGuardarVideoUrl: (url: string) => Promise<void>;
  onSubirVideo: (file: File) => Promise<void>;
  onEliminarVideo: () => Promise<void>;
};

function imagenesDe(producto: Producto): ProductoMedia[] {
  if (producto.medios?.length) {
    return producto.medios.filter((m) => m.tipo === 'imagen');
  }
  if (producto.imagenUrl) {
    return [
      {
        id: 'legacy',
        tipo: 'imagen',
        url: producto.imagenUrl,
        nombreOriginal: null,
        orden: 0,
      },
    ];
  }
  return [];
}

export function ProductoMediaSection({
  producto,
  disabled,
  onUploadImagen,
  onEliminarMedia,
  onGuardarVideoUrl,
  onSubirVideo,
  onEliminarVideo,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [videoUrlDraft, setVideoUrlDraft] = useState(producto.videoUrl ?? '');

  useEffect(() => {
    setVideoUrlDraft(producto.videoUrl ?? '');
  }, [producto.id, producto.videoUrl]);

  const imagenes = imagenesDe(producto);
  const videoActual = producto.videoUrl ?? producto.medios?.find((m) => m.tipo === 'video')?.url;

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setPending(true);
    try {
      await fn();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setPending(false);
    }
  };

  const onDropImagen = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      void run(() => onUploadImagen(file));
    },
    [onUploadImagen],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropImagen,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    disabled: disabled || pending,
  });

  const onDropVideo = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      void run(() => onSubirVideo(file));
    },
    [onSubirVideo],
  );

  const videoDrop = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': ['.mp4', '.webm'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled: disabled || pending,
    noClick: true,
  });

  return (
    <div className="flex flex-col gap-4 sm:col-span-2">
      <div>
        <span className={LABEL_CLASS}>Galería de imágenes</span>
        <p className="mb-2 text-body-sm text-outline">
          Carousel en la landing. Puedes agregar varias fotos (máx. 2 MB c/u).
        </p>
        {imagenes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {imagenes.map((img) => {
              const src = resolveAssetUrl(img.url);
              return (
                <div key={img.id} className="relative">
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-surface-variant object-cover"
                    />
                  ) : null}
                  {img.id !== 'legacy' && !disabled && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void run(async () => {
                          const ok = await Swal.fire({
                            icon: 'question',
                            title: '¿Eliminar imagen?',
                            showCancelButton: true,
                            confirmButtonText: 'Eliminar',
                            cancelButtonText: 'Cancelar',
                          });
                          if (ok.isConfirmed) await onEliminarMedia(img.id);
                        })
                      }
                      className="absolute -right-1 -top-1 rounded-full bg-error px-1.5 text-[10px] font-bold text-on-error"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border border-dashed px-3 py-3 text-xs transition ${
            isDragActive
              ? 'border-primary bg-primary-fixed/20 text-primary'
              : 'border-surface-variant text-outline hover:border-primary'
          } ${disabled || pending ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          {pending ? 'Procesando…' : isDragActive ? 'Suelta aquí' : '+ Agregar imagen (arrastra o clic)'}
        </div>
      </div>

      <div>
        <span className={LABEL_CLASS}>Video (opcional)</span>
        <p className="mb-2 text-body-sm text-outline">
          YouTube, Vimeo, enlace directo o archivo MP4/WebM (máx. 50 MB).
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            className={`min-w-[200px] flex-1 ${INPUT_CLASS}`}
            placeholder="https://youtube.com/..."
            value={videoUrlDraft}
            disabled={disabled || pending}
            onChange={(e) => setVideoUrlDraft(e.target.value)}
          />
          <button
            type="button"
            disabled={disabled || pending || !videoUrlDraft.trim()}
            onClick={() => void run(() => onGuardarVideoUrl(videoUrlDraft.trim()))}
            className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50"
          >
            Guardar URL
          </button>
        </div>
        <div
          {...videoDrop.getRootProps()}
          className={`mt-2 cursor-pointer rounded-lg border border-dashed px-3 py-2 text-xs ${
            disabled || pending ? 'pointer-events-none opacity-60' : 'border-surface-variant text-outline'
          }`}
        >
          <input {...videoDrop.getInputProps()} />
          <button
            type="button"
            disabled={disabled || pending}
            onClick={() => videoDrop.open()}
            className="font-semibold text-primary hover:underline disabled:opacity-50"
          >
            Subir archivo de video
          </button>
        </div>
        {videoActual && (
          <div className="mt-2 flex items-center gap-2 text-xs text-outline">
            <span className="truncate">Actual: {videoActual}</span>
            {!disabled && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void run(async () => {
                    const ok = await Swal.fire({
                      icon: 'question',
                      title: '¿Quitar video?',
                      showCancelButton: true,
                      confirmButtonText: 'Quitar',
                      cancelButtonText: 'Cancelar',
                    });
                    if (ok.isConfirmed) {
                      await onEliminarVideo();
                      setVideoUrlDraft('');
                    }
                  })
                }
                className="shrink-0 font-semibold text-error hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
