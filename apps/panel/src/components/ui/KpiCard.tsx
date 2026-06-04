import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

type BorderAccent = 'primary' | 'secondary' | 'tertiary' | 'primary-container';

const BORDER: Record<BorderAccent, string> = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  tertiary: 'border-tertiary',
  'primary-container': 'border-primary-container',
};

const ICON_BG: Record<BorderAccent, string> = {
  primary: 'bg-primary-fixed/30 text-primary',
  secondary: 'bg-secondary-fixed/30 text-secondary',
  tertiary: 'bg-tertiary-fixed/30 text-tertiary',
  'primary-container': 'bg-primary-fixed-dim/30 text-primary-container',
};

const WATERMARK: Record<BorderAccent, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  'primary-container': 'text-primary-container',
};

type KpiCardProps = {
  to: string;
  title: string;
  value: ReactNode;
  hint?: string;
  icon: string;
  watermarkIcon: string;
  accent: BorderAccent;
};

export function KpiCard({
  to,
  title,
  value,
  hint,
  icon,
  watermarkIcon,
  accent,
}: KpiCardProps) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-xl border-t-4 bg-surface-container-lowest p-card-padding tactile-card ${BORDER[accent]}`}
    >
      <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]">
        <Icon name={watermarkIcon} className={`text-[120px] ${WATERMARK[accent]}`} />
      </div>
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <h3 className="text-body-lg font-semibold text-on-surface-variant">{title}</h3>
        <div className={`rounded-lg p-2 ${ICON_BG[accent]}`}>
          <Icon name={icon} size={22} />
        </div>
      </div>
      <div className="relative z-10 flex items-baseline gap-2">
        <span className="text-display-lg text-primary">{value}</span>
        {hint ? (
          <span className="text-body-sm font-medium text-outline">{hint}</span>
        ) : null}
      </div>
    </Link>
  );
}
