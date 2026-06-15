import { useState } from 'react';
import { INPUT_CLASS } from '../../constants/design';
import { generarPassword } from '../../lib/generar-password';
import { Icon } from './Icon';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  /** Muestra botón para generar contraseña aleatoria */
  generatable?: boolean;
  minLength?: number;
};

export function PasswordInput({
  value,
  onChange,
  className = '',
  placeholder,
  autoComplete = 'off',
  generatable = false,
  minLength,
}: Props) {
  const [visible, setVisible] = useState(false);

  const handleGenerate = () => {
    const len = minLength && minLength > 12 ? minLength : 12;
    onChange(generarPassword(len));
    setVisible(true);
  };

  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`${INPUT_CLASS} pr-10 ${className}`}
          value={value}
          placeholder={placeholder}
          minLength={minLength}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-outline transition hover:text-primary"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icon name={visible ? 'visibility_off' : 'visibility'} size={20} filled={false} />
        </button>
      </div>
      {generatable && (
        <button
          type="button"
          onClick={handleGenerate}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-surface-variant px-3 py-2 text-body-sm font-semibold text-secondary transition hover:bg-surface-container-low"
          title="Generar contraseña aleatoria"
        >
          <Icon name="autorenew" size={18} filled={false} />
          <span className="hidden sm:inline">Generar</span>
        </button>
      )}
    </div>
  );
}
