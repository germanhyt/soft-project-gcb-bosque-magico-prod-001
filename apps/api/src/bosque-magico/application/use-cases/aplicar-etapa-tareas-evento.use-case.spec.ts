import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaTareaEvento } from '@prisma/client';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { TareasEventoRepository } from '../../infrastructure/repositories/tareas-evento.repository';
import { AplicarEtapaTareasEventoUseCase } from './aplicar-etapa-tareas-evento.use-case';

describe('AplicarEtapaTareasEventoUseCase', () => {
  let useCase: AplicarEtapaTareasEventoUseCase;
  let tareas: jest.Mocked<
    Pick<
      TareasEventoRepository,
      'contarPorEvento' | 'actualizarEtapaPorEvento' | 'listarPorEvento'
    >
  >;
  let eventos: jest.Mocked<Pick<EventosRepository, 'obtenerPorId'>>;

  beforeEach(() => {
    tareas = {
      contarPorEvento: jest.fn().mockResolvedValue(3),
      actualizarEtapaPorEvento: jest.fn().mockResolvedValue({ count: 3 }),
      listarPorEvento: jest.fn().mockResolvedValue([
        { id: 't1', eventoId: 'e1', etapa: EtapaTareaEvento.completado, area: 'catering', nombre: 'Menú' },
      ]),
    };
    eventos = { obtenerPorId: jest.fn().mockResolvedValue({ id: 'e1' }) };
    useCase = new AplicarEtapaTareasEventoUseCase(
      tareas as unknown as TareasEventoRepository,
      eventos as unknown as EventosRepository,
    );
  });

  it('aplica la etapa a todas las tareas del evento', async () => {
    const res = await useCase.ejecutar('e1', EtapaTareaEvento.completado);

    expect(tareas.actualizarEtapaPorEvento).toHaveBeenCalledWith(
      'e1',
      EtapaTareaEvento.completado,
    );
    expect(res).toHaveLength(1);
    expect(res[0].etapa).toBe('completado');
  });

  it('rechaza si el evento no existe', async () => {
    eventos.obtenerPorId.mockResolvedValue(null);
    await expect(useCase.ejecutar('x', EtapaTareaEvento.pendiente)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rechaza si no hay tareas', async () => {
    tareas.contarPorEvento.mockResolvedValue(0);
    await expect(useCase.ejecutar('e1', EtapaTareaEvento.completado)).rejects.toThrow(
      BadRequestException,
    );
    expect(tareas.actualizarEtapaPorEvento).not.toHaveBeenCalled();
  });
});
