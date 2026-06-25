import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '../../lib/media';
import { Modal } from '../ui/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  nombre: string;
  imagenes: string[];
  initialIndex?: number;
};

export function ProductImageGalleryModal({
  open,
  onClose,
  nombre,
  imagenes,
  initialIndex = 0,
}: Props) {
  const slides = imagenes.map((u) => resolveAssetUrl(u)).filter(Boolean) as string[];
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(Math.min(initialIndex, Math.max(slides.length - 1, 0)));
  }, [open, initialIndex, slides.length]);

  if (!open || slides.length === 0) return null;

  const current = slides[index] ?? slides[0];

  return (
    <Modal open={open} onClose={onClose} title={`Imágenes — ${nombre}`} size="lg">
      <div className="flex flex-col gap-4">
        <div className="relative flex min-h-[240px] items-center justify-center rounded-xl bg-surface-container-low">
          <img
            src={current}
            alt={`${nombre} (${index + 1}/${slides.length})`}
            className="max-h-[60vh] w-full rounded-xl object-contain"
          />
          {slides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Imagen anterior"
                onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/65"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Imagen siguiente"
                onClick={() => setIndex((i) => (i + 1) % slides.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/65"
              >
                ›
              </button>
            </>
          )}
        </div>
        {slides.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {slides.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Ver imagen ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`overflow-hidden rounded-lg border-2 ${
                  i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={src} alt="" className="h-14 w-14 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
