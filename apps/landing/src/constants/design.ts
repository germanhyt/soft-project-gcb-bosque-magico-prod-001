export const SWAL_CONFIRM_COLOR = '#17350e';

export const INPUT_CLASS =
  'w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

export const INPUT_ERROR_CLASS = 'border-error focus:ring-error/20';

export const CARD_CLASS =
  'rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-ambient';

export const FIELDSET_CLASS = `${CARD_CLASS} p-6 md:p-7`;

export const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-tertiary-fixed-dim px-6 py-3.5 font-display text-sm font-bold text-on-tertiary-fixed shadow-ambient transition hover:bg-tertiary-fixed hover:shadow-[0_12px_28px_-8px_rgba(62,44,0,0.35)] active:scale-[0.98] disabled:opacity-60';

export const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border-2 border-primary-container bg-transparent px-6 py-3.5 font-display text-sm font-semibold text-primary transition hover:bg-primary-fixed/35';

export const CONTAINER = 'mx-auto max-w-(--width-container) px-4 sm:px-6';

/** Ritmo vertical entre secciones */
export const SECTION_SCROLL = 'scroll-mt-28';
export const SECTION_PY = 'py-14 md:py-20';
export const SECTION_PY_COMPACT = 'py-12 md:py-16';
export const SECTION_HERO = 'py-16 md:py-24 lg:py-28';

export const SECTION_SHELL = `${SECTION_SCROLL} px-4 sm:px-6 ${SECTION_PY}`;
export const SECTION_ALT = `${SECTION_SHELL} bg-surface-container-low`;
export const SECTION_TINTED = `${SECTION_SHELL} bg-surface-container`;
export const SECTION_QUOTE = `${SECTION_SCROLL} bg-linear-to-b from-primary-fixed/12 via-surface-container-low to-background px-4 py-16 sm:px-6 md:py-24`;

/** Grids de catálogo */
export const GRID_CATALOG = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
export const GRID_CATALOG_3 = 'grid gap-6 md:grid-cols-3';
export const GRID_BENEFICIOS = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3';

/** Tarjetas seleccionables */
export const CARD_CATALOG =
  'tactile-card flex h-full min-h-[12rem] flex-col rounded-2xl border bg-surface-container-lowest p-6 transition-colors';
export const cardCatalogState = (selected: boolean, highlighted = false) =>
  selected
    ? 'border-primary ring-2 ring-primary/15'
    : highlighted
      ? 'border-tertiary-fixed-dim ring-2 ring-tertiary-fixed/35'
      : 'border-surface-variant';

export const SECTION_HINT =
  'mb-6 rounded-xl border border-outline-variant/70 bg-surface-container-lowest/90 px-4 py-3 text-sm leading-relaxed text-on-surface-variant';

export const CHIP =
  'inline-flex items-center rounded-full border border-surface-variant bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface-variant';
export const CHIP_OK =
  'inline-flex items-center rounded-full border border-primary/25 bg-primary-fixed/45 px-3 py-1.5 text-xs font-semibold text-primary';

export const BADGE_AVAILABLE =
  'rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant';
export const BADGE_SELECTED = 'rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-primary';

export const CART_PANEL =
  'sticky top-[5.25rem] rounded-2xl border border-surface-variant/90 bg-surface-container-lowest p-6 shadow-ambient md:p-7 lg:top-28';

export const HEADER_CLASS =
  'sticky top-0 z-30 border-b border-surface-variant/80 bg-surface-container-lowest/95 shadow-[0_1px_0_rgba(23,53,14,0.06)] backdrop-blur-xl';
