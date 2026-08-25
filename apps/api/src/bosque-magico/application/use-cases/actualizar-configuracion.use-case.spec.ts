import { BadRequestException } from '@nestjs/common';
import { ActualizarConfiguracionUseCase } from './actualizar-configuracion.use-case';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

describe('ActualizarConfiguracionUseCase', () => {
  let useCase: ActualizarConfiguracionUseCase;
  let configuracion: jest.Mocked<
    Pick<ConfiguracionRepository, 'obtenerPorClave' | 'actualizarValor'>
  >;
  let auditoria: jest.Mocked<Pick<AuditoriaRepository, 'registrar'>>;

  beforeEach(() => {
    configuracion = {
      obtenerPorClave: jest.fn(),
      actualizarValor: jest.fn(),
    };
    auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    useCase = new ActualizarConfiguracionUseCase(
      configuracion as unknown as ConfiguracionRepository,
      auditoria as unknown as AuditoriaRepository,
    );
  });

  it('actualiza claves numéricas de capacidad y show extra', async () => {
    configuracion.obtenerPorClave.mockResolvedValue({
      id: 'cfg-1',
      clave: 'shows.precio_nino_extra',
      valor: 15,
    } as never);
    configuracion.actualizarValor.mockResolvedValue({
      id: 'cfg-1',
      clave: 'shows.precio_nino_extra',
      valor: 18,
    } as never);

    const res = await useCase.ejecutar({
      actualizaciones: [{ clave: 'shows.precio_nino_extra', valor: 18 }],
    });

    expect(res).toHaveLength(1);
    expect(configuracion.actualizarValor).toHaveBeenCalledWith(
      'shows.precio_nino_extra',
      18,
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'actualizar',
        tipoEntidad: 'configuracion',
      }),
    );
  });

  it('rechaza clave obsoleta tarifas.precio_nino_extra', async () => {
    configuracion.obtenerPorClave.mockResolvedValue({
      id: 'cfg-old',
      clave: 'tarifas.precio_nino_extra',
      valor: 25,
    } as never);

    await expect(
      useCase.ejecutar({
        actualizaciones: [{ clave: 'tarifas.precio_nino_extra', valor: 25 }],
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      useCase.ejecutar({
        actualizaciones: [{ clave: 'tarifas.precio_nino_extra', valor: 25 }],
      }),
    ).rejects.toThrow('Clave no editable: tarifas.precio_nino_extra');

    expect(configuracion.actualizarValor).not.toHaveBeenCalled();
  });

  it('rechaza valor no numérico en claves de tarifa', async () => {
    configuracion.obtenerPorClave.mockResolvedValue({
      id: 'cfg-2',
      clave: 'shows.ninos_incluidos',
      valor: 20,
    } as never);

    await expect(
      useCase.ejecutar({
        actualizaciones: [
          { clave: 'shows.ninos_incluidos', valor: 'veinte' as never },
        ],
      }),
    ).rejects.toThrow('Valor numérico inválido');
  });

  it('rechaza clave inexistente en base de datos', async () => {
    configuracion.obtenerPorClave.mockResolvedValue(null);

    await expect(
      useCase.ejecutar({
        actualizaciones: [{ clave: 'shows.precio_nino_extra', valor: 15 }],
      }),
    ).rejects.toThrow('Configuración no encontrada');
  });
});
