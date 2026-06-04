import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Barra de acciones inline al final de filas de tabla (patrón CRM). */
export function RowActionsToolbar({ children, className = '' }: Props) {
  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-0.5 ${className}`}
      role="group"
    >
      {children}
    </div>
  );
}
