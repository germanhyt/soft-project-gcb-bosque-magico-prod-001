import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaCotizacion } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { VolverABorradorCotizacionUseCase } from './volver-a-borrador-cotizacion.use-case';

describe('VolverABorradorCotizacionUseCase', () => {
  const cotizaciones = {
    obtenerPorId: jest.fn(),
    actualizarEtapa: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const events = { cotizacionActualizada: jest.fn() };
  const useCase = new VolverABorradorCotizacionUseCase(
    cotizaciones as unknown as CotizacionesRepository,
    auditoria as unknown as AuditoriaRepository,
    events as unknown as EventsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza si no está enviada', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      id: 'cot-1',
      codigo: 'BM-001',
      etapa: EtapaCotizacion.borrador,
    });

    await expect(useCase.ejecutar('cot-1')).rejects.toThrow(BadRequestException);
    expect(cotizaciones.actualizarEtapa).not.toHaveBeenCalled();
  });

  it('pasa de enviada a borrador', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      id: 'cot-1',
      codigo: 'BM-001',
      etapa: EtapaCotizacion.enviada,
      tokenPublico: 'tok',
      montoBase: 0,
      montoNinosExtra: 0,
      montoItems: 0,
      montoTotal: 0,
    });
    cotizaciones.actualizarEtapa.mockResolvedValue({
      id: 'cot-1',
      codigo: 'BM-001',
      etapa: EtapaCotizacion.borrador,
      tokenPublico: 'tok',
      montoBase: 0,
      montoNinosExtra: 0,
      montoItems: 0,
      montoTotal: 0,
    });
    auditoria.registrar.mockResolvedValue(undefined);

    const res = await useCase.ejecutar('cot-1');

    expect(cotizaciones.actualizarEtapa).toHaveBeenCalledWith(
      'cot-1',
      expect.objectContaining({ etapa: EtapaCotizacion.borrador }),
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'volver_borrador' }),
    );
    expect(res.etapa).toBe(EtapaCotizacion.borrador);
  });

  it('lanza NotFoundException si no existe', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(null);
    await expect(useCase.ejecutar('x')).rejects.toThrow(NotFoundException);
  });
});
