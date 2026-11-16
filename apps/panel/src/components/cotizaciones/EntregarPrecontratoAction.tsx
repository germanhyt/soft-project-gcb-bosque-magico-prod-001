import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import { registrarPrecontrato, type Cotizacion } from '../../lib/cotizaciones';
import { configNumero, type CotizacionClienteExtendido } from '../../lib/contrato';
import { imprimirContratoPdf } from '../../lib/contrato-print';
import type { ContratoPrintPayload } from '@bosque/shared';
import { mostrarErrorApi } from '../../lib/swal-feedback';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Props = {
  cot: Cotizacion;
};

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function tope(total: number, monto: number) {
  if (!Number.isFinite(total) || !Number.isFinite(monto)) return 0;
  return Math.round(Math.min(Math.max(monto, 0), Math.max(total, 0)) * 100) / 100;
}

export function EntregarPrecontratoAction({ cot }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoy());

  const { data: config } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open || !config) return;
    const referencial = configNumero(config.todas, 'contrato.adelanto_referencial', 500);
    const base = cot.precontrato?.adelanto1Monto ?? referencial;
    setMonto(String(tope(cot.montoTotal, base)));
    setFecha(cot.precontrato?.adelanto1Fecha || hoy());
  }, [open, config, cot.precontrato, cot.montoTotal]);

  const guardar = useMutation({
    mutationFn: () =>
      registrarPrecontrato(cot.id, {
        adelanto1Monto: Number(monto),
        adelanto1Fecha: fecha,
      }),
    onSuccess: async (actualizada) => {
      await qc.invalidateQueries({ queryKey: ['cotizacion', cot.id] });
      const guardado = actualizada.precontrato;
      const garantia = config
        ? configNumero(config.todas, 'contrato.garantia_referencial', 500)
        : 500;
      const ok = guardado
        ? await imprimirContratoPdf(
            payloadImpreso(actualizada, guardado.adelanto1Monto, guardado.adelanto1Fecha, garantia),
            { esPrecontrato: true },
          )
        : false;
      setOpen(false);
      if (!ok) {
        await Swal.fire({
          icon: 'warning',
          title: 'Adelanto guardado',
          text: 'No se abrió el PDF. Permite ventanas emergentes y vuelve a entregar el precontrato.',
        });
        return;
      }
      await Swal.fire({
        icon: 'success',
        title: 'Precontrato listo',
        text: 'El adelanto quedó guardado. Al aceptar la cotización, el contrato lo toma.',
      });
    },
    onError: (err) => mostrarErrorApi(err, 'No se pudo guardar el precontrato'),
  });

  return (
    <>
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Entregar precontrato
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Precontrato de reserva"
        description="El total sale de la cotización. Este documento no confirma el evento."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const valor = tope(cot.montoTotal, Number(monto));
            if (valor <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
              void Swal.fire({
                icon: 'warning',
                title: 'Revisa el adelanto',
                text: 'Indica un monto mayor a cero, dentro del total, y la fecha del pago.',
              });
              return;
            }
            setMonto(String(valor));
            guardar.mutate();
          }}
        >
          <label className="block">
            <span className={LABEL_CLASS}>Adelanto</span>
            <input
              className={INPUT_CLASS}
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Fecha del adelanto</span>
            <input
              type="date"
              className={INPUT_CLASS}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </label>
          <p className="text-body-sm text-outline">
            Total cotizado S/ {cot.montoTotal.toFixed(2)}. El PDF incluye los términos del contrato.
          </p>
          <Button type="submit" className="w-full" disabled={guardar.isPending}>
            {guardar.isPending ? 'Generando…' : 'Guardar y descargar'}
          </Button>
        </form>
      </Modal>
    </>
  );
}

function payloadImpreso(
  cot: Cotizacion,
  adelanto: number,
  fechaAdelanto: string,
  montoGarantia: number,
): ContratoPrintPayload {
  const cliente = cot.cliente as CotizacionClienteExtendido;
  const documento = cliente.numeroDocumento?.trim() ?? '';
  return {
    cotizacion: {
      codigo: cot.codigo,
      fechaEvento: cot.fechaEvento,
      turno: cot.turno,
      cantidadNinos: cot.cantidadNinos,
      tematica: cot.tematica,
      paquete: cot.paquete ?? null,
      montoBase: cot.montoBase,
      montoNinosExtra: cot.montoNinosExtra,
      montoItems: cot.montoItems,
      montoTotal: cot.montoTotal,
      cliente: {
        nombreCompleto: cliente.nombreCompleto,
        celular: cliente.celular,
        correo: cliente.correo,
        numeroDocumento: documento,
      },
      cumpleanero: {
        nombre: cot.cumpleanero.nombre,
        edad: cot.cumpleanero.edad,
      },
      items: cot.items ?? [],
      extrasPermitidos: cot.extrasPermitidos,
      extrasPermitidosComentario: cot.extrasPermitidosComentario,
    },
    form: {
      numeroDocumento: documento,
      tipoComprobante: cliente.tipoDocumento === 'ruc' ? 'factura' : 'boleta',
      documentoTributario: documento,
      horarioInicio: cot.horarioInicio?.trim() || 'Por confirmar',
      horarioFin: cot.horarioFin?.trim() || 'Por confirmar',
      adelanto1Monto: adelanto,
      adelanto1Fecha: fechaAdelanto,
      adelanto2Monto: 0,
      adelanto2Fecha: '',
      montoGarantia,
    },
    fechaEmision: hoy(),
  };
}
