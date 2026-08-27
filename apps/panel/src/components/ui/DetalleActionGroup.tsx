import type { ReactNode } from 'react';

type GroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/**
 * Acciones del footer de un detalle: dos columnas para no empujar
 * la vista informativa del modal.
 */
export function DetalleActionGroup({ label, children, className = '' }: GroupProps) {
  return (
    <div
      className={`rounded-lg border border-surface-variant/50 bg-surface-container-low/40 px-2.5 py-2 ${className}`}
    >
      <p className="mb-1.5 text-label-caps text-outline">{label}</p>
      <div className="grid grid-cols-2 gap-2 [&_button]:w-full [&_button]:px-3 [&_button]:py-1.5 [&_button]:leading-tight">
        {children}
      </div>
    </div>
  );
}

export function DetalleActionHint({ children }: { children: ReactNode }) {
  return <p className="col-span-2 text-xs leading-snug text-outline">{children}</p>;
}

type FooterProps = {
  children: ReactNode;
  className?: string;
};

/** Contenedor compacto entre grupos de acciones. */
export function DetalleActionsFooter({ children, className = '' }: FooterProps) {
  return <div className={`flex flex-col gap-2 ${className}`}>{children}</div>;
}
