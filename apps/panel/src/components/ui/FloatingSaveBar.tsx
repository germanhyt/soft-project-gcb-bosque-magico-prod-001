type Props = {
  hint?: string;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function FloatingSaveBar({
  hint = 'Los cambios se aplican al pulsar guardar.',
  onSave,
  saving,
  disabled,
  label = 'Guardar cambios',
  className = '',
}: Props) {
  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-4 right-4 z-30 flex justify-center md:left-[var(--width-sidebar-current)] ${className}`}
    >
      <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-variant bg-surface-container-lowest px-6 py-4 shadow-ambient">
        <p className="text-body-sm text-on-surface-variant">{hint}</p>
        <button
          type="button"
          disabled={disabled || saving}
          onClick={onSave}
          className="shrink-0 rounded-full bg-primary px-8 py-2.5 text-body-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Guardando…' : label}
        </button>
      </div>
    </div>
  );
}
