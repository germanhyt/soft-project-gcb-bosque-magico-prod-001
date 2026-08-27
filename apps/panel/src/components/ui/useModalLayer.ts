import { useEffect } from 'react';

/** Bloquea scroll del body mientras un modal está abierto. */
export function useModalLayer(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

export const MODAL_OVERLAY_CLASS =
  'fixed inset-0 flex items-center justify-center bg-primary/35 p-4';

export const MODAL_PANEL_CLASS =
  'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient transform-gpu';

export const MODAL_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-body-sm [contain:layout_paint]';
