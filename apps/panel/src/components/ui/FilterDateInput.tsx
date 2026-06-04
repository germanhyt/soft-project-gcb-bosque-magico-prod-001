import { INPUT_CLASS } from '../../constants/design';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FilterDateInput({ label, value, onChange, className = '' }: Props) {
  return (
    <label className={`flex min-w-[140px] flex-col gap-1 text-body-sm sm:max-w-[180px] ${className}`}>
      <span className="text-label-caps text-outline">{label}</span>
      <input
        type="date"
        className={INPUT_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
