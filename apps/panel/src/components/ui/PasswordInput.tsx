import { useState } from 'react';
import { INPUT_CLASS } from '../../constants/design';
import { Icon } from './Icon';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
};

export function PasswordInput({
  value,
  onChange,
  className = '',
  placeholder,
  autoComplete = 'off',
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={`${INPUT_CLASS} pr-10 ${className}`}
        value={value}
        placeholder={placeholder}
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
  );
}
