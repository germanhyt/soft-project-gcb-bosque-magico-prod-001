import { useEffect, useState } from 'react';
import { BTN_PRIMARY, CONTAINER, HEADER_CLASS } from '../../constants/design';
import { LANDING_NAV } from '../../constants/navigation';
import { MobileNav } from './MobileNav';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={HEADER_CLASS}>
        <div className={`${CONTAINER} flex items-center justify-between gap-2 py-3.5 sm:gap-3 md:gap-4`}>
          <a href="#inicio" className="flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={closeMenu}>
            <img
              src="/logo-bm.png"
              alt="Bosque Mágico"
              className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight text-primary sm:text-lg md:text-xl">
                Bosque Mágico
              </p>
              <p className="hidden truncate text-[0.65rem] tracking-wide text-on-surface-variant uppercase sm:block sm:text-xs">
                Fiestas infantiles en Refugio
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a href="#cotizar" className={`${BTN_PRIMARY} hidden px-4 py-2.5 text-sm sm:inline-flex md:px-5`}>
              Cotizar
            </a>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-variant bg-surface-container-low text-primary transition hover:bg-surface-container lg:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? 'mobile-nav-panel' : undefined}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="sr-only">{menuOpen ? 'Cerrar' : 'Menú'}</span>
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      <MobileNav open={menuOpen} onClose={closeMenu} />
    </>
  );
}
