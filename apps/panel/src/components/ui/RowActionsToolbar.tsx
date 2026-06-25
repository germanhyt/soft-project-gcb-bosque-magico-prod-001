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

/** Separador visual entre grupos de acciones en filas (compartir | registro | envío | confirmar). */
export function RowActionDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-outline-variant/60" aria-hidden />;
}
