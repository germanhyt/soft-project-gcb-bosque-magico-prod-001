import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { apiErrorMessage } from '../../lib/api-error';
import { probarSmtp } from '../../lib/configuracion';
import { INPUT_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  smtpGuardadoActivo: boolean;
  hayCambiosSmtp: boolean;
};

export function SmtpPruebaEnvio({ smtpGuardadoActivo, hayCambiosSmtp }: Props) {
  const [correoDestino, setCorreoDestino] = useState('');
  const correoValido = CORREO_RE.test(correoDestino.trim());

  const mut = useMutation({
    mutationFn: () => probarSmtp(correoDestino.trim()),
    onSuccess: (res) => {
      void Swal.fire({
        icon: 'success',
        title: 'Correo de prueba enviado',
        text: `Se envió a ${res.destino}. Revisa la bandeja de entrada (y spam).`,
        timer: 2800,
        showConfirmButton: false,
      });
    },
    onError: (err) => {
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar la prueba',
        text: apiErrorMessage(err, 'Revisa la configuración SMTP e intenta de nuevo.'),
      });
    },
  });

  return (
    <div className="mt-8 border-t border-outline-variant/50 pt-6">
      <h4 className="font-semibold text-secondary">Prueba de envío</h4>
      <p className="mt-1 text-body-sm text-outline">
        Envía un correo de prueba con la configuración SMTP guardada para confirmar que el servidor
        responde.
      </p>
      {!smtpGuardadoActivo && (
        <p className="mt-2 text-body-sm text-error">
          Guarda SMTP habilitado y con servidor (host) para poder enviar una prueba.
        </p>
      )}
      {smtpGuardadoActivo && hayCambiosSmtp && (
        <p className="mt-2 text-body-sm text-outline">
          Hay cambios sin guardar. La prueba usará la configuración ya guardada, no el formulario.
        </p>
      )}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1">
          <span className="text-body-sm font-medium text-on-surface">Correo destino</span>
          <input
            type="email"
            className={`mt-1 w-full ${INPUT_CLASS}`}
            placeholder="ej. tu-correo@empresa.com"
            value={correoDestino}
            onChange={(e) => setCorreoDestino(e.target.value)}
            autoComplete="email"
          />
        </label>
        <Button
          className="shrink-0"
          disabled={!smtpGuardadoActivo || !correoValido || mut.isPending}
          onClick={() => mut.mutate()}
        >
          {mut.isPending ? 'Enviando…' : 'Enviar prueba'}
        </Button>
      </div>
    </div>
  );
}
