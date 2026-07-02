import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import type { UsuarioPanel } from '../../lib/usuarios';

type Props = {
  usuario: UsuarioPanel;
  esUsuarioActual: boolean;
  onEditar: (usuario: UsuarioPanel) => void;
  onToggleActivo: (usuario: UsuarioPanel) => void;
};

export function UsuarioRowActions({
  usuario,
  esUsuarioActual,
  onEditar,
  onToggleActivo,
}: Props) {
  const activo = usuario.activo;

  return (
    <RowActionsToolbar>
      <RowIconButton
        icon="edit"
        title="Editar usuario"
        aria-label="Editar usuario"
        onClick={() => onEditar(usuario)}
      />
      {!esUsuarioActual && (
        <RowIconButton
          icon={activo ? 'visibility_off' : 'check_circle'}
          variant={activo ? 'danger' : 'default'}
          title={activo ? 'Desactivar' : 'Activar'}
          aria-label={activo ? 'Desactivar usuario' : 'Activar usuario'}
          onClick={() => onToggleActivo(usuario)}
        />
      )}
    </RowActionsToolbar>
  );
}
