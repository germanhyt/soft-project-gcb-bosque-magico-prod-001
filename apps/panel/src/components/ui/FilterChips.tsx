type Option<T extends string> = { value: T; label: string };

type FilterChipsProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((f) => (
        <button
          key={f.value || 'all'}
          type="button"
          onClick={() => onChange(f.value)}
          className={`rounded-full px-4 py-1.5 text-body-sm font-medium transition ${
            value === f.value
              ? 'bg-primary text-on-primary shadow-ambient'
              : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
