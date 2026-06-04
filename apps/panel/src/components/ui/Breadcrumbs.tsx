import { Link } from 'react-router-dom';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className = '' }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`text-body-sm text-outline ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-outline-variant">/</span>}
              {item.to && !isLast ? (
                <Link to={item.to} className="font-medium hover:text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-on-surface' : 'font-medium'}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
