import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { INPUT_CLASS } from '../../constants/design';
import { Icon } from './Icon';

export type MultiSelectOption = { value: string; label: string };

type Props = {
  value: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  inputId?: string;
};

function optionFromValue(value: string, options: MultiSelectOption[]): MultiSelectOption {
  return options.find((o) => o.value === value) ?? { value, label: value };
}

export function MultiSelect({
  value,
  options,
  onChange,
  placeholder = 'Selecciona…',
  inputId,
}: Props) {
  const generatedId = useId();
  const fieldId = inputId ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuBox, setMenuBox] = useState({ top: 0, left: 0, width: 0 });

  const selected = useMemo(
    () => value.map((v) => optionFromValue(v, options)),
    [value, options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const canCreate =
    query.trim().length > 0 &&
    !options.some(
      (o) =>
        o.value.toLowerCase() === query.trim().toLowerCase() ||
        o.label.toLowerCase() === query.trim().toLowerCase(),
    ) &&
    !value.some((v) => v.toLowerCase() === query.trim().toLowerCase());

  const syncMenu = () => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    syncMenu();
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = () => syncMenu();
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = (next: string) => {
    if (value.includes(next)) onChange(value.filter((v) => v !== next));
    else onChange([...value, next]);
  };

  const addCustom = () => {
    const next = query.trim();
    if (!next) return;
    if (!value.includes(next)) onChange([...value, next]);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`${INPUT_CLASS} flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 py-1.5`}
        onClick={() => {
          setOpen(true);
          document.getElementById(fieldId)?.focus();
        }}
      >
        {selected.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 rounded-md bg-primary-fixed px-2 py-0.5 text-xs font-semibold text-primary"
          >
            {opt.label}
            <button
              type="button"
              className="text-primary/80 hover:text-primary"
              aria-label={`Quitar ${opt.label}`}
              onClick={(e) => {
                e.stopPropagation();
                toggle(opt.value);
              }}
            >
              <Icon name="close" size={14} filled={false} />
            </button>
          </span>
        ))}
        <input
          id={fieldId}
          className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-body-sm text-on-surface outline-none placeholder:text-outline"
          value={query}
          placeholder={selected.length ? 'Añadir…' : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !query && value.length) {
              onChange(value.slice(0, -1));
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (canCreate) addCustom();
              else if (filtered[0] && !value.includes(filtered[0].value)) {
                toggle(filtered[0].value);
              }
            }
            if (e.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[90] max-h-56 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-ambient"
            style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
          >
            {filtered.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm hover:bg-surface-container-low ${
                    checked ? 'bg-primary-fixed/20 font-semibold text-primary' : 'text-on-surface'
                  }`}
                  onClick={() => toggle(opt.value)}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      checked
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant'
                    }`}
                  >
                    {checked && <Icon name="check" size={12} />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
            {canCreate && (
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-body-sm text-primary hover:bg-surface-container-low"
                onClick={addCustom}
              >
                Agregar “{query.trim()}”
              </button>
            )}
            {!filtered.length && !canCreate && (
              <p className="px-3 py-2 text-body-sm text-outline">Sin coincidencias</p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
