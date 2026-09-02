import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaContrato, EtapaEvento } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { VolverABorradorContratoUseCase } from './volver-a-borrador-contrato.use-case';

const base = {
  id: 'con-1',
  numero: 'CTR-001',
  eventoId: 'evt-1',
  etapa: EtapaContrato.enviado,
  evento: { etapa: EtapaEvento.por_confirmar },
};

describe('VolverABorradorContratoUseCase', () => {
  const contratos = {
    obtenerPorId: jest.fn(),
    marcarBorrador: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const events = { eventoActualizado: jest.fn() };
  const useCase = new VolverABorradorContratoUseCase(
    contratos as unknown as ContratosRepository,
    auditoria as unknown as AuditoriaRepository,
    events as unknown as EventsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza si no está enviado', async () => {
    contratos.obtenerPorId.mockResolvedValue({
      ...base,
      etapa: EtapaContrato.borrador,
    });

    await expect(useCase.ejecutar('con-1')).rejects.toThrow(BadRequestException);
    expect(contratos.marcarBorrador).not.toHaveBeenCalled();
  });

  it('rechaza contrato firmado', async () => {
    contratos.obtenerPorId.mockResolvedValue({
      ...base,
      etapa: EtapaContrato.firmado,
    });

    await expect(useCase.ejecutar('con-1')).rejects.toThrow(/firmado/);
    expect(contratos.marcarBorrador).not.toHaveBeenCalled();
  });

  it('rechaza si el evento ya está confirmado', async () => {
    contratos.obtenerPorId.mockResolvedValue({
      ...base,
      evento: { etapa: EtapaEvento.confirmado },
    });

    await expect(useCase.ejecutar('con-1')).rejects.toThrow(/evento ya está/);
    expect(contratos.marcarBorrador).not.toHaveBeenCalled();
  });

  it('pasa de enviado a borrador', async () => {
    contratos.obtenerPorId.mockResolvedValue(base);
    contratos.marcarBorrador.mockResolvedValue({
      ...base,
      etapa: EtapaContrato.borrador,
      tokenPublico: 'tok',
      montoTotal: 0,
      montoAdelanto: 0,
      montoPendiente: 0,
      montoGarantia: 0,
      adelanto1Monto: 0,
      adelanto2Monto: null,
    });
    auditoria.registrar.mockResolvedValue(undefined);

    const res = await useCase.ejecutar('con-1');

    expect(contratos.marcarBorrador).toHaveBeenCalledWith('con-1');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'volver_borrador' }),
    );
    expect(res.etapa).toBe(EtapaContrato.borrador);
  });

  it('lanza NotFoundException si no existe', async () => {
    contratos.obtenerPorId.mockResolvedValue(null);
    await expect(useCase.ejecutar('x')).rejects.toThrow(NotFoundException);
  });
});
