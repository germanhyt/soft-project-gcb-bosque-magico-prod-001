import { useEffect } from 'react';

export const MOBILE_NAV_PANEL_ID = 'mobile-nav-panel';
import { BTN_PRIMARY } from '../../constants/design';
import { LANDING_NAV } from '../../constants/navigation';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-40 bg-primary/50 lg:hidden"
        onClick={onClose}
      />
      <nav
        id={MOBILE_NAV_PANEL_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="fixed inset-x-4 top-[4.75rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-surface-variant bg-surface-container-lowest p-4 shadow-[0_24px_48px_-12px_rgba(23,53,14,0.2)] lg:hidden"
      >
        <ul className="flex flex-col gap-1">
          {LANDING_NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onClose}
                className="block rounded-xl px-4 py-3 font-display text-base font-semibold text-on-surface transition hover:bg-surface-container-low hover:text-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#cotizar" onClick={onClose} className={`${BTN_PRIMARY} mt-4 w-full justify-center`}>
          Cotizar mi fiesta
        </a>
      </nav>
    </>
  );
}
