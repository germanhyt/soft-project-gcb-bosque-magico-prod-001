import { INPUT_CLASS } from '../../constants/design';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
  inline?: boolean;
};

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
  inline = false,
}: Props<T>) {
  return (
    <label
      className={`flex flex-col gap-1 text-body-sm ${
        inline ? 'min-w-[180px] flex-1 sm:max-w-[220px]' : 'min-w-[160px] flex-1 sm:max-w-xs'
      } ${className}`}
    >
      {!inline && label && <span className="text-label-caps text-outline">{label}</span>}
      <select
        className={inline ? 'h-[42px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15' : INPUT_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={inline ? label : undefined}
      >
        {options.map((o) => (
          <option key={o.value || '__all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}