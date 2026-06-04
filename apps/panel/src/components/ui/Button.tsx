import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary shadow-ambient hover:bg-primary-container active:scale-[0.98]',
  secondary:
    'border-2 border-secondary bg-transparent text-secondary hover:bg-secondary-fixed/20',
  ghost:
    'border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-low',
  accent:
    'bg-tertiary-fixed text-tertiary font-bold shadow-ambient hover:bg-tertiary-container',
};

const BASE =
  'inline-flex items-center justify-center rounded-lg px-5 py-2 text-body-sm font-semibold transition disabled:opacity-60';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANT[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...props
}: LinkProps & { variant?: Variant; children: ReactNode }) {
  return (
    <Link className={`${BASE} ${VARIANT[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
