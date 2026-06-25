import { useCallback, useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';
import { resolveAssetUrl } from '../../lib/media';

type Props = {
  imagenes?: string[];
  imagenUrl?: string | null;
  videoUrl?: string | null;
  nombre: string;
};

function urlsImagenes(imagenes?: string[], imagenUrl?: string | null): string[] {
  if (imagenes?.length) return imagenes;
  if (imagenUrl?.trim()) return [imagenUrl];
  return [];
}

function embedVideoUrl(url: string): string | null {
  const trimmed = url.trim();
  const ytMatch =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i) ??
    trimmed.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return null;
}

function Overlay({
  children,
  onClose,
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 rounded-lg bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
        >
          Cerrar
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function CatalogProductMedia({ imagenes, imagenUrl, videoUrl, nombre }: Props) {
  const slides = urlsImagenes(imagenes, imagenUrl).map((u) => resolveAssetUrl(u)).filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setIndex(0);
  }, [slides.join('|')]);

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion || paused || lightbox || videoOpen) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [slides.length, slides.join('|'), reduceMotion, paused, lightbox, videoOpen]);

  const stopCard = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
  };

  const prev = useCallback(
    (e: MouseEvent) => {
      stopCard(e);
      if (slides.length <= 1) return;
      setIndex((i) => (i - 1 + slides.length) % slides.length);
    },
    [slides.length],
  );

  const next = useCallback(
    (e: MouseEvent) => {
      stopCard(e);
      if (slides.length <= 1) return;
      setIndex((i) => (i + 1) % slides.length);
    },
    [slides.length],
  );

  const resolvedVideo = videoUrl?.trim() ? resolveAssetUrl(videoUrl) ?? videoUrl.trim() : null;
  const embed = resolvedVideo ? embedVideoUrl(resolvedVideo) : null;

  if (slides.length === 0 && !resolvedVideo) return null;

  const current = slides[index] ?? slides[0];

  return (
    <>
      <div
        className="relative mb-4"
        onClick={stopCard}
        onKeyDown={stopCard}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {current ? (
          <img
            src={current}
            alt={nombre}
            loading="lazy"
            className="h-36 w-full rounded-xl border border-surface-variant/60 object-cover"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center rounded-xl border border-surface-variant/60 bg-surface-container-low text-sm text-on-surface-variant">
            Video disponible
          </div>
        )}

        <div className="absolute right-2 top-2 flex gap-1">
          {slides.length > 0 && (
            <button
              type="button"
              aria-label="Ampliar imagen"
              onClick={(e) => {
                stopCard(e);
                setLightbox(true);
              }}
              className="rounded-lg bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/65"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          {resolvedVideo && (
            <button
              type="button"
              aria-label="Ver video"
              onClick={(e) => {
                stopCard(e);
                setVideoOpen(true);
              }}
              className="rounded-lg bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/65"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1 text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1 text-white hover:bg-black/60"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Imagen ${i + 1}`}
                  onClick={(e) => {
                    stopCard(e);
                    setIndex(i);
                  }}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && current && (
        <Overlay onClose={() => setLightbox(false)} label={`Galería de ${nombre}`}>
          <div className="relative">
            <img src={current} alt={nombre} className="max-h-[85vh] w-full rounded-xl object-contain" />
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Imagen anterior"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => (i - 1 + slides.length) % slides.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/65"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Imagen siguiente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => (i + 1) % slides.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/65"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </Overlay>
      )}

      {videoOpen && resolvedVideo && (
        <Overlay onClose={() => setVideoOpen(false)} label={`Video de ${nombre}`}>
          {embed ? (
            <iframe
              src={embed}
              title={`Video ${nombre}`}
              className="aspect-video w-full rounded-xl bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={resolvedVideo}
              controls
              autoPlay
              className="max-h-[85vh] w-full rounded-xl bg-black"
            />
          )}
        </Overlay>
      )}
    </>
  );
}
