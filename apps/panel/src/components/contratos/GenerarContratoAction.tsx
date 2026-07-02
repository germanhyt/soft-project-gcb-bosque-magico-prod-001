import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContratoFormModal } from './ContratoFormModal';
import { Button } from '../ui/Button';
import type { Evento } from '../../lib/eventos';
import type { Contrato } from '../../lib/contratos';

type Props = {
  eventoId: string;
  cotizacionId: string;
  evento?: Evento | null;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  label?: string;
  onGenerado?: (contrato: Contrato) => void;
  redirectToContratos?: boolean;
};

export function GenerarContratoAction({
  eventoId,
  cotizacionId,
  evento,
  disabled,
  className = '',
  fullWidth,
  label = 'Generar contrato',
  onGenerado,
  redirectToContratos = true,
}: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (disabled) return null;

  return (
    <>
      <Button
        variant="secondary"
        className={`${fullWidth ? 'w-full' : ''} ${className}`.trim()}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <ContratoFormModal
        open={open}
        onClose={() => setOpen(false)}
        eventoId={eventoId}
        cotizacionId={cotizacionId}
        evento={evento}
        onGenerado={(contrato) => {
          onGenerado?.(contrato);
          if (redirectToContratos) {
            navigate(`/contratos?detalle=${contrato.id}`);
          }
        }}
      />
    </>
  );
}
