import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import { WhatsAppIcon } from './WhatsAppIcon';

export const ROW_ICON_BTN_BASE =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40';

const VARIANT_CLASS = {
  default: 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
  whatsapp: 'text-[#25D366] hover:bg-emerald-50',
  danger: 'text-error hover:bg-error-container/25',
} as const;

type Variant = keyof typeof VARIANT_CLASS;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: string;
  whatsapp?: boolean;
  iconFilled?: boolean;
  children?: ReactNode;
};

export function RowIconButton({
  variant = 'default',
  icon,
  whatsapp,
  iconFilled = false,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={`${ROW_ICON_BTN_BASE} ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
      {whatsapp && <WhatsAppIcon size={22} />}
      {!whatsapp && icon && <Icon name={icon} size={22} filled={iconFilled} />}
    </button>
  );
}
