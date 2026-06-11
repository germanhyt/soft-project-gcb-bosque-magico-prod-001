import type { ReactNode } from 'react';

type GroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** Agrupa acciones del footer de un detalle con etiqueta y borde sutil. */
export function DetalleActionGroup({ label, children, className = '' }: GroupProps) {
  return (
    <div
      className={`rounded-xl border border-surface-variant/70 bg-surface-container-low/50 p-3 ${className}`}
    >
      <p className="mb-2 text-label-caps text-outline">{label}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

type FooterProps = {
  children: ReactNode;
  className?: string;
};

/** Contenedor vertical con separación entre grupos de acciones. */
export function DetalleActionsFooter({ children, className = '' }: FooterProps) {
  return <div className={`flex flex-col gap-3 ${className}`}>{children}</div>;
}
