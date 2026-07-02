import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ContratoAdjuntoDropzone } from './ContratoAdjuntoDropzone';
import {
  eliminarAdjuntoContrato,
  subirAdjuntoContrato,
  type Contrato,
  type TipoAdjuntoContrato,
} from '../../lib/contratos';

type Props = {
  contrato: Contrato;
};

const TIPOS_DOCUMENTO: TipoAdjuntoContrato[] = ['comprobante_pago', 'documento_contabilidad'];
const TIPOS_FIRMA: TipoAdjuntoContrato[] = ['firma_cliente', 'firma_empresa'];

export function ContratoAdjuntosSection({ contrato }: Props) {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['contrato', contrato.id] });
    void qc.invalidateQueries({ queryKey: ['contrato-evento', contrato.eventoId] });
    void qc.invalidateQueries({ queryKey: ['contratos'] });
  };

  const uploadMut = useMutation({
    mutationFn: ({ tipo, file }: { tipo: TipoAdjuntoContrato; file: File }) =>
      subirAdjuntoContrato(contrato.id, tipo, file),
    onSuccess: invalidate,
  });

  const removeMut = useMutation({
    mutationFn: (tipo: TipoAdjuntoContrato) => eliminarAdjuntoContrato(contrato.id, tipo),
    onSuccess: invalidate,
  });

  const renderDropzone = (tipo: TipoAdjuntoContrato) => (
    <ContratoAdjuntoDropzone
      key={tipo}
      tipo={tipo}
      adjunto={contrato.adjuntos?.find((a) => a.tipo === tipo)}
      disabled={uploadMut.isPending || removeMut.isPending}
      onUpload={async (file) => {
        await uploadMut.mutateAsync({ tipo, file });
      }}
      onRemove={
        contrato.adjuntos?.some((a) => a.tipo === tipo)
          ? async () => {
              await removeMut.mutateAsync(tipo);
            }
          : undefined
      }
    />
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-bold text-primary">Documentos del contrato</h3>
        <p className="text-body-sm text-outline">
          Comprobante de pago y documento de contabilidad (PDF o imagen).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{TIPOS_DOCUMENTO.map(renderDropzone)}</div>
      </div>

      <div>
        <h3 className="font-bold text-primary">Firmas (imagen)</h3>
        <p className="text-body-sm text-outline">
          Sube la firma del cliente y de Bosque Mágico. Aparecerán en el PDF al imprimir.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{TIPOS_FIRMA.map(renderDropzone)}</div>
      </div>
    </section>
  );
}
