import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import type { Producto } from '../../lib/cotizaciones';

type Props = {
  producto: Producto;
  puedeGestionar: boolean;
  onEditar: (producto: Producto) => void;
  onToggleEstado: (producto: Producto) => void;
};

export function CatalogoProductoRowActions({
  producto,
  puedeGestionar,
  onEditar,
  onToggleEstado,
}: Props) {
  if (!puedeGestionar) {
    return <span className="text-xs text-outline">Solo lectura</span>;
  }

  const activo = producto.etapa === 'activo';

  return (
    <RowActionsToolbar>
      <RowIconButton
        icon="edit"
        title="Editar producto"
        aria-label="Editar producto"
        onClick={() => onEditar(producto)}
      />
      <RowIconButton
        icon={activo ? 'delete' : 'check_circle'}
        variant={activo ? 'danger' : 'default'}
        title={activo ? 'Desactivar' : 'Activar'}
        aria-label={activo ? 'Desactivar producto' : 'Activar producto'}
        onClick={() => onToggleEstado(producto)}
      />
    </RowActionsToolbar>
  );
}
