import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { AREA_PEDIDO_LABEL } from '../../constants/pedidos';
import {
  ETAPA_TAREA_BADGE,
  ETAPA_TAREA_LABEL,
  ETAPAS_TAREA_OPCIONES,
} from '../../constants/tareas';
import type { EtapaTareaEvento } from '../../lib/tareas';
import {
  actualizarTareaEvento,
  fetchTareasEvento,
  generarTareasEvento,
} from '../../lib/tareas-api';
import { Button } from '../ui/Button';

type Props = {
  eventoId: string;
  etapaEvento: string;
};

export function EventoTareasSection({ eventoId, etapaEvento }: Props) {
  const qc = useQueryClient();
  const puedeOperar = etapaEvento === 'confirmado' || etapaEvento === 'realizado';

  const { data: tareas = [], isLoading } = useQuery({
    queryKey: ['tareas-evento', eventoId],
    queryFn: () => fetchTareasEvento(eventoId),
    enabled: !!eventoId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tareas-evento', eventoId] });

  const generarMut = useMutation({
    mutationFn: () => generarTareasEvento(eventoId),
    onSuccess: async (rows) => {
      await invalidate();
      await Swal.fire({
        icon: rows.length ? 'success' : 'info',
        title: rows.length ? `${rows.length} tarea(s) generadas` : 'Ya existen tareas',
        timer: 1500,
        showConfirmButton: false,
      });
    },
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: EtapaTareaEvento }) =>
      actualizarTareaEvento(id, { etapa }),
    onSuccess: () => invalidate(),
  });

  const completadas = tareas.filter((t) => t.etapa === 'completado').length;

  return (
    <section className="rounded-xl border border-surface-variant bg-surface-container-low/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-body-sm font-bold uppercase tracking-wide text-primary">Checklist</h4>
          {tareas.length > 0 && (
            <p className="text-xs text-outline">
              {completadas}/{tareas.length} completadas
            </p>
          )}
        </div>
        {puedeOperar && tareas.length === 0 && (
          <Button
            variant="ghost"
            className="!px-3 !py-1.5 text-xs"
            disabled={generarMut.isPending}
            onClick={() => generarMut.mutate()}
          >
            Generar checklist
          </Button>
        )}
      </div>

      {etapaEvento === 'por_confirmar' && (
        <p className="text-body-sm text-on-surface-variant">
          El checklist se activa al confirmar el evento.
        </p>
      )}

      {isLoading && <p className="text-body-sm text-outline">Cargando tareas…</p>}

      {!isLoading && tareas.length === 0 && etapaEvento !== 'por_confirmar' && (
        <p className="text-body-sm text-on-surface-variant">Sin tareas registradas.</p>
      )}

      {tareas.length > 0 && (
        <ul className="space-y-2">
          {tareas.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-on-surface">{t.nombre}</p>
                <p className="text-xs text-outline">{AREA_PEDIDO_LABEL[t.area as keyof typeof AREA_PEDIDO_LABEL] ?? t.area}</p>
              </div>
              <select
                className="rounded-lg border border-surface-variant bg-surface-container-low px-2 py-1 text-xs"
                value={t.etapa}
                disabled={!puedeOperar || actualizarMut.isPending}
                onChange={(e) =>
                  actualizarMut.mutate({ id: t.id, etapa: e.target.value as EtapaTareaEvento })
                }
              >
                {ETAPAS_TAREA_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span
                className={`w-full rounded px-1.5 py-0.5 text-[10px] font-semibold sm:w-auto ${ETAPA_TAREA_BADGE[t.etapa]}`}
              >
                {ETAPA_TAREA_LABEL[t.etapa]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
