import { useNavigate } from 'react-router-dom';
import { ContactoInlineActions } from '../contacto/ContactoInlineActions';
import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';

export type ClienteAccionesTarget = {
  id: string;
  nombreCompleto: string;
  celular: string;
  correo: string | null;
};

type Props = {
  cliente: ClienteAccionesTarget;
  onVer?: (id: string) => void;
  onEditar?: (id: string) => void;
  mostrarVer?: boolean;
};

export function ClienteRowActions({ cliente, onVer, onEditar, mostrarVer = true }: Props) {
  const navigate = useNavigate();
  const enlace = `${window.location.origin}/clientes/${cliente.id}`;

  return (
    <RowActionsToolbar>
      <ContactoInlineActions
        nombre={cliente.nombreCompleto}
        celular={cliente.celular}
        correo={cliente.correo}
        enlaceCopiar={enlace}
        enlaceTitulo="Copiar enlace del cliente"
      />
      {mostrarVer && (
        <RowIconButton
          icon="visibility"
          title="Ver cliente"
          aria-label="Ver cliente"
          onClick={() => (onVer ? onVer(cliente.id) : navigate(`/clientes/${cliente.id}`))}
        />
      )}
      {onEditar && (
        <RowIconButton
          icon="edit_square"
          title="Editar cliente"
          aria-label="Editar cliente"
          onClick={() => onEditar(cliente.id)}
        />
      )}
    </RowActionsToolbar>
  );
}
