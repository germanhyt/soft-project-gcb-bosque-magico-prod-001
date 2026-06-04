import { INPUT_CLASS } from '../../constants/design';
import { Icon } from './Icon';

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean;
};

export function FilterSearchInput({
  label = 'Buscar',
  value,
  onChange,
  placeholder,
  className = '',
  inline = false,
}: Props) {
  return (
    <label
      className={`flex flex-col gap-1 text-body-sm ${
        inline ? 'min-w-[220px] flex-[2] sm:max-w-xl' : 'min-w-[200px] flex-1 sm:max-w-md'
      } ${className}`}
    >
      {!inline && <span className="text-label-caps text-outline">{label}</span>}
      <div className="relative">
        <Icon
          name="search"
          size={20}
          filled={false}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
        />
        <input
          type="search"
          className={`${INPUT_CLASS} h-[42px] pl-10`}
          value={value}
          placeholder={placeholder ?? 'Buscar…'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={inline ? label : undefined}
        />
      </div>
    </label>
  );
}