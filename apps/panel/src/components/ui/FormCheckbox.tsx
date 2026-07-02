import type { ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  compact?: boolean;
};

/** Checkbox estilizado para formularios y permisos (panel). */
export function FormCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  compact = false,
}: Props) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border transition ${
        compact ? 'border-transparent p-1' : 'border-surface-variant/80 bg-surface-container-low/30 p-3'
      } ${
        checked && !compact
          ? 'border-primary/35 bg-primary-fixed/10'
          : 'hover:border-outline-variant'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
          checked
            ? 'border-primary bg-primary text-on-primary'
            : 'border-outline-variant bg-surface peer-focus-visible:ring-2 peer-focus-visible:ring-primary/25'
        }`}
      >
        {checked && <Icon name="check" size={14} filled className="text-on-primary" />}
      </span>
      <span className="min-w-0 text-body-sm">
        <span className="font-semibold text-on-surface">{label}</span>
        {description && (
          <span className="mt-0.5 block text-on-surface-variant">{description}</span>
        )}
      </span>
    </label>
  );
}
