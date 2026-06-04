import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';
import { Icon } from './Icon';

type PageHeaderProps = {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  count?: string;
  showBack?: boolean;
  children?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  count,
  showBack,
  children,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const compact = breadcrumbs && breadcrumbs.length > 0;

  if (compact) {
    return (
      <header className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-variant text-outline transition hover:bg-surface-container-low hover:text-primary"
                aria-label="Volver"
              >
                <Icon name="arrow_back" size={20} filled={false} />
              </button>
            )}
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {count ? <span className="text-body-sm font-medium text-outline">{count}</span> : null}
            {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
          </div>
        </div>
        {title && !breadcrumbs.some((b, i) => i === breadcrumbs.length - 1 && b.label === title) && (
          <div className="mt-3">
            <h1 className="text-headline-lg tracking-tight text-primary">{title}</h1>
            {subtitle ? <p className="mt-1 text-body-sm text-on-surface-variant">{subtitle}</p> : null}
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="mb-4">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-3" />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {title ? <h1 className="text-headline-lg tracking-tight text-primary">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-body-sm text-on-surface-variant">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {count ? <span className="text-body-sm font-medium text-outline">{count}</span> : null}
          {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
        </div>
      </div>
    </header>
  );
}
