import { BadRequestException } from '@nestjs/common';
import { EtapaContrato, EtapaPedido, TipoAdjuntoContrato, TipoPedido } from '@prisma/client';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { PrecondicionesEventoService } from './precondiciones-evento.service';

describe('PrecondicionesEventoService', () => {
  let service: PrecondicionesEventoService;
  let contratos: jest.Mocked<Pick<ContratosRepository, 'obtenerPorEventoId'>>;
  let pedidos: jest.Mocked<Pick<PedidosRepository, 'listarPorEvento'>>;

  const contratoEnviado = {
    id: 'c1',
    etapa: EtapaContrato.enviado,
    adjuntos: [
      { tipo: TipoAdjuntoContrato.firma_cliente },
      { tipo: TipoAdjuntoContrato.firma_empresa },
    ],
  };

  beforeEach(() => {
    contratos = { obtenerPorEventoId: jest.fn().mockResolvedValue(contratoEnviado) };
    pedidos = { listarPorEvento: jest.fn().mockResolvedValue([]) };
    service = new PrecondicionesEventoService(
      contratos as unknown as ContratosRepository,
      pedidos as unknown as PedidosRepository,
    );
  });

  it('acepta contrato enviado con ambas firmas', async () => {
    await expect(service.validarParaConfirmar('e1')).resolves.toBeUndefined();
  });

  it('rechaza si faltan firmas', async () => {
    contratos.obtenerPorEventoId.mockResolvedValue({
      ...contratoEnviado,
      adjuntos: [{ tipo: TipoAdjuntoContrato.firma_cliente }],
    });

    await expect(service.validarParaConfirmar('e1')).rejects.toThrow(BadRequestException);
    await expect(service.validarParaConfirmar('e1')).rejects.toThrow(/firma/);
  });

  it('rechaza contrato en borrador', async () => {
    contratos.obtenerPorEventoId.mockResolvedValue({
      ...contratoEnviado,
      etapa: EtapaContrato.borrador,
    });

    await expect(service.validarParaConfirmar('e1')).rejects.toThrow(
      'El contrato debe estar enviado o firmado antes de programar el evento.',
    );
  });

  it('rechaza pedidos de proveedor pendientes', async () => {
    pedidos.listarPorEvento.mockResolvedValue([
      { tipo: TipoPedido.proveedor, etapa: EtapaPedido.pendiente },
    ]);

    await expect(service.validarParaConfirmar('e1')).rejects.toThrow(
      /pedido\(s\) de proveedor sin confirmar/,
    );
  });
});
