import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import { fetchCotizacion } from '../../lib/cotizaciones';
import {
  configNumero,
  contratoToPrintPayload,
  type ContratoFormDatos,
  type CotizacionClienteExtendido,
  type TipoComprobante,
} from '../../lib/contrato';
import { imprimirContratoPdf } from '../../lib/contrato-print';
import {
  fetchContratoEvento,
  generarContratoEvento,
  type Contrato,
} from '../../lib/contratos';
import type { Evento } from '../../lib/eventos';
import { horarioDesdeRango, parseTurnoConfig } from '../../lib/turno-config';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  eventoId: string;
  cotizacionId: string;
  evento?: Evento | null;
  onGenerado?: (contrato: Contrato) => void;
};

type FormState = {
  numeroDocumento: string;
  tipoComprobante: TipoComprobante;
  documentoTributario: string;
  horarioInicio: string;
  horarioFin: string;
  adelanto1Monto: string;
  adelanto1Fecha: string;
  adelanto2Monto: string;
  adelanto2Fecha: string;
};

const EMPTY: FormState = {
  numeroDocumento: '',
  tipoComprobante: 'boleta',
  documentoTributario: '',
  horarioInicio: '',
  horarioFin: '',
  adelanto1Monto: '',
  adelanto1Fecha: '',
  adelanto2Monto: '',
  adelanto2Fecha: '',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formFromContrato(contrato: Contrato): FormState {
  return {
    numeroDocumento: contrato.numeroDocumento,
    tipoComprobante: contrato.tipoComprobante,
    documentoTributario: contrato.documentoTributario,
    horarioInicio: contrato.horarioInicio,
    horarioFin: contrato.horarioFin,
    adelanto1Monto: String(contrato.adelanto1Monto),
    adelanto1Fecha: contrato.adelanto1Fecha ?? todayIso(),
    adelanto2Monto: contrato.adelanto2Monto ? String(contrato.adelanto2Monto) : '',
    adelanto2Fecha: contrato.adelanto2Fecha ?? '',
  };
}

export function ContratoFormModal({
  open,
  onClose,
  eventoId,
  cotizacionId,
  evento,
  onGenerado,
}: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: cot, isLoading: loadingCot } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => fetchCotizacion(cotizacionId),
    enabled: open && !!cotizacionId,
  });

  const { data: contratoExistente, isLoading: loadingContrato } = useQuery({
    queryKey: ['contrato-evento', eventoId],
    queryFn: () => fetchContratoEvento(eventoId),
    enabled: open && !!eventoId,
  });

  const { data: config } = useQuery({
    queryKey: ['configuracion-panel'],
    queryFn: fetchConfiguracionPanel,
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      setForm(EMPTY);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || !cot || !config || initialized) return;
    if (loadingContrato) return;

    if (contratoExistente) {
      setForm(formFromContrato(contratoExistente));
      setInitialized(true);
      return;
    }

    const turno = evento?.turno ?? cot.turno;
    const turnoCfg = parseTurnoConfig(
      `turnos.${turno}`,
      config.todas.find((c) => c.clave === `turnos.${turno}`)?.valor,
    );
    const adelantoRef = configNumero(config.todas, 'contrato.adelanto_referencial', 500);
    const total = evento?.montoTotal ?? cot.montoTotal;
    const cliente = cot.cliente as CotizacionClienteExtendido;
    const rango = horarioDesdeRango(turnoCfg.horaInicio, turnoCfg.horaFin);
    const [horaInicio, horaFin] = rango.split(' - ');

    setForm({
      numeroDocumento: cliente.numeroDocumento ?? '',
      tipoComprobante: cliente.tipoDocumento === 'ruc' ? 'factura' : 'boleta',
      documentoTributario: cliente.numeroDocumento ?? '',
      horarioInicio: horaInicio ?? rango,
      horarioFin: horaFin ?? '',
      adelanto1Monto: String(Math.min(adelantoRef, total)),
      adelanto1Fecha: todayIso(),
      adelanto2Monto: '',
      adelanto2Fecha: '',
    });
    setInitialized(true);
  }, [open, cot, config, evento, contratoExistente, loadingContrato, initialized]);

  const generarMut = useMutation({
    mutationFn: (datos: ContratoFormDatos & { montoGarantia: number }) =>
      generarContratoEvento(eventoId, {
        numeroDocumento: datos.numeroDocumento,
        tipoComprobante: datos.tipoComprobante,
        documentoTributario: datos.documentoTributario,
        horarioInicio: datos.horarioInicio,
        horarioFin: datos.horarioFin,
        adelanto1Monto: datos.adelanto1Monto,
        adelanto1Fecha: datos.adelanto1Fecha || undefined,
        adelanto2Monto: datos.adelanto2Monto > 0 ? datos.adelanto2Monto : undefined,
        adelanto2Fecha: datos.adelanto2Fecha || undefined,
        montoGarantia: datos.montoGarantia,
      }),
    onSuccess: async (contrato) => {
      await qc.invalidateQueries({ queryKey: ['contrato-evento', eventoId] });
      await qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] });
      onGenerado?.(contrato);

      const ok = imprimirContratoPdf(contratoToPrintPayload(contrato, evento));
      if (!ok) {
        await Swal.fire({
          icon: 'warning',
          title: 'Contrato guardado',
          text: 'No se pudo abrir la vista de impresión. Permite ventanas emergentes e imprime desde el detalle.',
        });
      } else if (contrato.reimpresion) {
        await Swal.fire({
          icon: 'info',
          title: 'Reimpresión',
          text: 'El contrato ya estaba enviado o firmado; se imprimió la versión registrada.',
          timer: 2500,
          showConfirmButton: false,
        });
      }
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cot || !config) return;

    if (!form.numeroDocumento.trim()) {
      setError('El DNI del cliente es obligatorio para el contrato.');
      return;
    }

    const adelanto1 = Number(form.adelanto1Monto);
    if (!Number.isFinite(adelanto1) || adelanto1 < 0) {
      setError('Ingresa un monto válido para el adelanto 1.');
      return;
    }

    const adelanto2 = form.adelanto2Monto.trim() ? Number(form.adelanto2Monto) : 0;
    if (form.adelanto2Monto.trim() && (!Number.isFinite(adelanto2) || adelanto2 < 0)) {
      setError('Ingresa un monto válido para el adelanto 2.');
      return;
    }

    const total = evento?.montoTotal ?? cot.montoTotal;
    if (adelanto1 + adelanto2 > total) {
      setError('La suma de adelantos no puede superar el total del evento.');
      return;
    }

    const datos: ContratoFormDatos = {
      numeroDocumento: form.numeroDocumento.trim(),
      tipoComprobante: form.tipoComprobante,
      documentoTributario: (form.documentoTributario || form.numeroDocumento).trim(),
      horarioInicio: form.horarioInicio.trim(),
      horarioFin: form.horarioFin.trim(),
      adelanto1Monto: adelanto1,
      adelanto1Fecha: form.adelanto1Fecha,
      adelanto2Monto: adelanto2,
      adelanto2Fecha: form.adelanto2Fecha,
      montoGarantia: configNumero(config.todas, 'contrato.garantia_referencial', 500),
    };

    setError('');
    generarMut.mutate(datos);
  };

  const loading = loadingCot || loadingContrato || !initialized;
  const bloqueado =
    contratoExistente?.etapa === 'enviado' || contratoExistente?.etapa === 'firmado';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar contrato"
      description={
        bloqueado
          ? 'Contrato registrado. Puedes reimprimir; los datos no se modifican.'
          : 'Completa los datos legales. Se guardará en el sistema y se abrirá la vista imprimible.'
      }
      size="lg"
    >
      {loading ? (
        <p className="text-on-surface-variant">Cargando datos…</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {contratoExistente && (
            <p className="rounded-lg border border-primary/30 bg-primary-fixed/20 px-4 py-2 text-body-sm text-primary">
              {contratoExistente.numero} · Estado: {contratoExistente.etapa}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={LABEL_CLASS}>DNI del cliente *</span>
              <input
                className={INPUT_CLASS}
                value={form.numeroDocumento}
                onChange={(ev) => setForm((f) => ({ ...f, numeroDocumento: ev.target.value }))}
                placeholder="Ej. 12345678"
                required
                disabled={bloqueado}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Comprobante</span>
              <select
                className={INPUT_CLASS}
                value={form.tipoComprobante}
                disabled={bloqueado}
                onChange={(ev) =>
                  setForm((f) => ({
                    ...f,
                    tipoComprobante: ev.target.value as TipoComprobante,
                  }))
                }
              >
                <option value="boleta">Boleta</option>
                <option value="factura">Factura</option>
              </select>
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>DNI / RUC facturación</span>
              <input
                className={INPUT_CLASS}
                value={form.documentoTributario}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, documentoTributario: ev.target.value }))}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Horario inicio</span>
              <input
                className={INPUT_CLASS}
                value={form.horarioInicio}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, horarioInicio: ev.target.value }))}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Horario fin</span>
              <input
                className={INPUT_CLASS}
                value={form.horarioFin}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, horarioFin: ev.target.value }))}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Adelanto 1 (S/)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={INPUT_CLASS}
                value={form.adelanto1Monto}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, adelanto1Monto: ev.target.value }))}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Fecha adelanto 1</span>
              <input
                type="date"
                className={INPUT_CLASS}
                value={form.adelanto1Fecha}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, adelanto1Fecha: ev.target.value }))}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Adelanto 2 (S/) — opcional</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={INPUT_CLASS}
                value={form.adelanto2Monto}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, adelanto2Monto: ev.target.value }))}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>Fecha adelanto 2</span>
              <input
                type="date"
                className={INPUT_CLASS}
                value={form.adelanto2Fecha}
                disabled={bloqueado}
                onChange={(ev) => setForm((f) => ({ ...f, adelanto2Fecha: ev.target.value }))}
              />
            </label>
          </div>

          {cot && (
            <p className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
              Total cotizado: <strong>S/ {cot.montoTotal.toFixed(2)}</strong>
            </p>
          )}

          {error && <p className="text-body-sm text-error">{error}</p>}
          {generarMut.isError && (
            <p className="text-body-sm text-error">No se pudo guardar el contrato. Revisa los datos.</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={generarMut.isPending}>
              {generarMut.isPending
                ? 'Guardando…'
                : bloqueado
                  ? 'Reimprimir PDF'
                  : 'Guardar y generar PDF'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
