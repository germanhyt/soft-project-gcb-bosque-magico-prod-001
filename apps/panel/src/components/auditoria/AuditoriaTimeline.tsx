import { useQuery } from '@tanstack/react-query';
import { fetchAuditoria } from '../../lib/auditoria';
import { formatFechaHora } from '../../lib/format';

const ACCION_LABEL: Record<string, string> = {
  crear: 'Creada',
  crear_publica: 'Creada desde landing',
  cotizacion_borrador_auto: 'Borrador auto (landing)',
  cotizacion_borrador_manual: 'Borrador generado',
  crear_manual: 'Creada manual',
  tomar: 'Tomada',
  cerrar: 'Cerrada',
  actualizar: 'Actualizada',
  aceptar: 'Cotización aceptada',
  enviar: 'Cotización enviada',
  confirmar: 'Evento confirmado',
  realizar: 'Evento realizado',
  cancelar: 'Evento cancelado',
};

type Props = {
  tipoEntidad: string;
  entidadId: string;
};

export function AuditoriaTimeline({ tipoEntidad, entidadId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['auditoria', tipoEntidad, entidadId],
    queryFn: () => fetchAuditoria(tipoEntidad, entidadId),
    enabled: !!entidadId,
  });

  if (isLoading) {
    return <p className="text-body-sm text-outline">Cargando bitácora…</p>;
  }

  if (data.length === 0) {
    return (
      <p className="text-body-sm text-outline">
        Sin registros de auditoría aún. Las acciones del equipo quedarán aquí (gentle-ai).
      </p>
    );
  }

  return (
    <ul className="space-y-2 border-l-2 border-surface-variant pl-4">
      {data.map((r) => (
        <li key={r.id} className="relative text-body-sm">
          <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <p className="font-semibold text-on-surface">
            {ACCION_LABEL[r.accion] ?? r.accion}
            <span className="ml-2 font-normal text-outline">· {r.actorTipo}</span>
          </p>
          <p className="text-xs text-outline">{formatFechaHora(r.creadoEn)}</p>
        </li>
      ))}
    </ul>
  );
}
