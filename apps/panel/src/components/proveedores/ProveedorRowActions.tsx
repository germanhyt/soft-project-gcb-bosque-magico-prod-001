import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import type { Proveedor } from '../../lib/proveedores';

type Props = {
  proveedor: Proveedor;
  puedeGestionar: boolean;
  onEditar: (proveedor: Proveedor) => void;
  onToggleEstado: (proveedor: Proveedor) => void;
};

export function ProveedorRowActions({
  proveedor,
  puedeGestionar,
  onEditar,
  onToggleEstado,
}: Props) {
  if (!puedeGestionar) {
    return <span className="text-xs text-outline">Solo lectura</span>;
  }

  const activo = proveedor.etapa === 'activo';

  return (
    <RowActionsToolbar>
      <RowIconButton
        icon="edit"
        title="Editar proveedor"
        aria-label="Editar proveedor"
        onClick={() => onEditar(proveedor)}
      />
      <RowIconButton
        icon={activo ? 'visibility_off' : 'check_circle'}
        title={activo ? 'Desactivar' : 'Activar'}
        aria-label={activo ? 'Desactivar proveedor' : 'Activar proveedor'}
        onClick={() => onToggleEstado(proveedor)}
      />
    </RowActionsToolbar>
  );
}
