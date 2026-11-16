import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaCotizacion } from '@prisma/client';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { RegistrarPrecontratoUseCase } from './registrar-precontrato.use-case';

describe('RegistrarPrecontratoUseCase', () => {
  const cotizaciones = {
    obtenerPorId: jest.fn(),
    guardarPrecontrato: jest.fn(),
  };

  const useCase = new RegistrarPrecontratoUseCase(
    cotizaciones as unknown as CotizacionesRepository,
  );

  const cotAbierta = {
    id: 'cot-1',
    etapa: EtapaCotizacion.enviada,
    montoTotal: 800,
    tokenPublico: 'tok',
    montoBase: 800,
    montoNinosExtra: 0,
    montoItems: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cotizaciones.guardarPrecontrato.mockImplementation(async (_id, data) => ({
      ...cotAbierta,
      precontrato: data,
    }));
  });

  it('guarda el adelanto topado sin cambiar la etapa', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(cotAbierta);

    const res = await useCase.ejecutar('cot-1', {
      adelanto1Monto: 500,
      adelanto1Fecha: '2026-11-20',
    });

    expect(cotizaciones.guardarPrecontrato).toHaveBeenCalledWith(
      'cot-1',
      expect.objectContaining({
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
        terminosVersion: '2026-06',
      }),
    );
    expect(res.precontrato?.adelanto1Monto).toBe(500);
    expect(res.precontrato?.adelanto2Monto).toBe(0);
    expect(res.etapa).toBe(EtapaCotizacion.enviada);
  });

  it('guarda el segundo adelanto sin cambiar la etapa', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(cotAbierta);

    const res = await useCase.ejecutar('cot-1', {
      adelanto1Monto: 500,
      adelanto1Fecha: '2026-11-20',
      adelanto2Monto: 200,
      adelanto2Fecha: '2026-12-01',
    });

    expect(cotizaciones.guardarPrecontrato).toHaveBeenCalledWith(
      'cot-1',
      expect.objectContaining({
        adelanto1Monto: 500,
        adelanto2Monto: 200,
        adelanto2Fecha: '2026-12-01',
      }),
    );
    expect(res.etapa).toBe(EtapaCotizacion.enviada);
  });

  it('rechaza si los adelantos superan el total', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(cotAbierta);

    await expect(
      useCase.ejecutar('cot-1', {
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
        adelanto2Monto: 400,
        adelanto2Fecha: '2026-12-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cotizaciones.guardarPrecontrato).not.toHaveBeenCalled();
  });

  it('rechaza una cotización aceptada', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotAbierta,
      etapa: EtapaCotizacion.aceptada,
    });

    await expect(
      useCase.ejecutar('cot-1', {
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cotizaciones.guardarPrecontrato).not.toHaveBeenCalled();
  });

  it('rechaza si no existe', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(null);
    await expect(
      useCase.ejecutar('cot-1', {
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
