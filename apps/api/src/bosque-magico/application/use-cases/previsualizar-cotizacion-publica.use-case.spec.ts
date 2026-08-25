import { BadRequestException } from '@nestjs/common';
import { PrevisualizarCotizacionPublicaUseCase } from './previsualizar-cotizacion-publica.use-case';
import { ComposicionPaqueteService } from '../../domain/services/composicion-paquete.service';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { CapacidadEventoService } from '../../domain/services/capacidad-evento.service';

describe('PrevisualizarCotizacionPublicaUseCase', () => {
  let useCase: PrevisualizarCotizacionPublicaUseCase;
  let composicion: jest.Mocked<
    Pick<ComposicionPaqueteService, 'armarCotizacionConPaquete'>
  >;
  let anticipacion: jest.Mocked<Pick<AnticipacionEventoService, 'validar'>>;
  let capacidad: jest.Mocked<Pick<CapacidadEventoService, 'validar'>>;

  beforeEach(() => {
    composicion = { armarCotizacionConPaquete: jest.fn() };
    anticipacion = { validar: jest.fn().mockResolvedValue(undefined) };
    capacidad = { validar: jest.fn().mockResolvedValue(undefined) };
    composicion.armarCotizacionConPaquete.mockResolvedValue({
      composicion: {
        paqueteNombre: 'Estándar',
        items: [],
        resumen: {},
      },
      montos: {
        montoBase: 1310,
        montoNinosExtra: 75,
        montoItems: 0,
        montoTotal: 1385,
      },
      esFinSemana: false,
    } as never);
    useCase = new PrevisualizarCotizacionPublicaUseCase(
      composicion as unknown as ComposicionPaqueteService,
      anticipacion as unknown as AnticipacionEventoService,
      capacidad as unknown as CapacidadEventoService,
    );
  });

  it('rechaza preview sin paquete', async () => {
    await expect(
      useCase.ejecutar({
        fechaEvento: '2026-07-08',
        cantidadNinos: 25,
        paquete: '',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      useCase.ejecutar({
        fechaEvento: '2026-07-08',
        cantidadNinos: 25,
        paquete: '   ',
      }),
    ).rejects.toThrow('Debe elegir un paquete');
  });

  it('delega composición con paquete y cantidad de niños', async () => {
    const res = await useCase.ejecutar({
      fechaEvento: '2026-07-08',
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: ['show-1'] },
    });

    expect(anticipacion.validar).toHaveBeenCalledWith('2026-07-08');
    expect(capacidad.validar).toHaveBeenCalledWith(25);
    expect(composicion.armarCotizacionConPaquete).toHaveBeenCalledWith(
      expect.objectContaining({
        paquete: 'Estándar',
        cantidadNinos: 25,
      }),
    );
    expect(res.montos.ninosExtra).toBe(75);
    expect(res.montos.total).toBe(1385);
  });
});
