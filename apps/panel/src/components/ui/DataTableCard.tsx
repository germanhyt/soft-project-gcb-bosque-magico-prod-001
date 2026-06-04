import type { ReactNode } from 'react';
import { CARD_CLASS } from '../../constants/design';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Contenedor de tabla sin espacio vacío bajo filas; paginado pegado al cuerpo. */
export function DataTableCard({ children, footer, className = '' }: Props) {
  return (
    <div className={`mt-3 flex flex-col overflow-hidden ${CARD_CLASS} ${className}`}>
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}
