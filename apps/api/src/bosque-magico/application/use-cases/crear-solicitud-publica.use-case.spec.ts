import { CanalSolicitud } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { CrearSolicitudPublicaUseCase } from './crear-solicitud-publica.use-case';
import { CrearCotizacionUseCase } from './crear-cotizacion.use-case';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import { IdentidadContactoService } from '../../domain/services/identidad-contacto.service';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { CapacidadEventoService } from '../../domain/services/capacidad-evento.service';

describe('CrearSolicitudPublicaUseCase', () => {
  let useCase: CrearSolicitudPublicaUseCase;
  let solicitudes: jest.Mocked<
    Pick<SolicitudesRepository, 'crear' | 'obtenerPorId'>
  >;
  let auditoria: jest.Mocked<Pick<AuditoriaRepository, 'registrar'>>;
  let events: jest.Mocked<
    Pick<EventsService, 'solicitudNueva' | 'cotizacionBorradorLista'>
  >;
  let crearCotizacion: jest.Mocked<Pick<CrearCotizacionUseCase, 'ejecutar'>>;
  let identidad: jest.Mocked<
    Pick<IdentidadContactoService, 'resolver' | 'vincularClienteConSolicitud'>
  >;
  let anticipacion: jest.Mocked<Pick<AnticipacionEventoService, 'validar'>>;
  let capacidad: jest.Mocked<Pick<CapacidadEventoService, 'validar'>>;

  const resumenSinDuplicado = {
    celularNormalizado: '999888777',
    correoNormalizado: 'm@test.com',
    clienteId: null,
    clienteNombre: null,
    totalSolicitudes: 0,
    solicitudesRecientes24h: false,
    primeraSolicitudEn: null,
    ultimaSolicitudEn: null,
  };

  beforeEach(() => {
    solicitudes = {
      crear: jest.fn(),
      obtenerPorId: jest.fn(),
    };
    auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    events = { solicitudNueva: jest.fn(), cotizacionBorradorLista: jest.fn() };
    crearCotizacion = { ejecutar: jest.fn() };
    identidad = {
      resolver: jest.fn(),
      vincularClienteConSolicitud: jest.fn().mockResolvedValue({ id: 'cli-1' }),
    };
    anticipacion = { validar: jest.fn().mockResolvedValue(undefined) };
    capacidad = { validar: jest.fn().mockResolvedValue(undefined) };
    identidad.resolver.mockResolvedValue(resumenSinDuplicado);
    useCase = new CrearSolicitudPublicaUseCase(
      solicitudes as unknown as SolicitudesRepository,
      auditoria as unknown as AuditoriaRepository,
      events as unknown as EventsService,
      crearCotizacion as unknown as CrearCotizacionUseCase,
      identidad as unknown as IdentidadContactoService,
      anticipacion as unknown as AnticipacionEventoService,
      capacidad as unknown as CapacidadEventoService,
    );
  });

  it('crea solicitud desde landing con canal landing', async () => {
    solicitudes.crear.mockResolvedValue({
      id: 'sol-1',
      nombreContacto: 'María',
      celular: '999888777',
      canal: CanalSolicitud.landing,
    } as never);
    solicitudes.obtenerPorId.mockResolvedValue({
      id: 'sol-1',
      cotizaciones: [],
    } as never);

    const res = await useCase.ejecutar({
      cliente: { nombre: 'María', celular: '999888777', correo: 'm@test.com' },
      evento: {
        fechaTentativa: '2026-07-10',
        turno: 'turno_2',
        cantidadNinos: 20,
      },
      cumpleanero: { nombre: 'Lucas', edad: 5 },
      observaciones: 'Llegamos temprano',
    });

    expect(res.solicitud.id).toBe('sol-1');
    expect(res.posibleDuplicado).toBe(false);
    expect(identidad.resolver).toHaveBeenCalledWith('999888777', 'm@test.com');
    expect(solicitudes.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        canal: CanalSolicitud.landing,
        detalleOrigen: 'landing',
        nombreContacto: 'María',
      }),
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'crear_publica',
        tipoEntidad: 'solicitud',
        metadata: expect.objectContaining({ canal: 'landing' }),
      }),
    );
  });

  it('marca posibleDuplicado cuando identidad detecta solicitud reciente', async () => {
    identidad.resolver.mockResolvedValue({
      ...resumenSinDuplicado,
      solicitudesRecientes24h: true,
      totalSolicitudes: 1,
    });
    solicitudes.crear.mockResolvedValue({ id: 'sol-2' } as never);
    solicitudes.obtenerPorId.mockResolvedValue({
      id: 'sol-2',
      cotizaciones: [],
    } as never);

    const res = await useCase.ejecutar({
      cliente: { nombre: 'Ana', celular: '111222333' },
    });

    expect(res.posibleDuplicado).toBe(true);
    expect(crearCotizacion.ejecutar).not.toHaveBeenCalled();
    expect(solicitudes.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        payloadOrigen: expect.objectContaining({
          posibleDuplicado: true,
        }),
      }),
    );
  });

  it('crea cotización borrador cuando el payload del cotizador es completo', async () => {
    solicitudes.crear.mockResolvedValue({
      id: 'sol-3',
      nombreContacto: 'Luis',
    } as never);
    solicitudes.obtenerPorId.mockResolvedValue({
      id: 'sol-3',
      cotizaciones: [{ id: 'cot-1', codigo: 'COT-L00001', etapa: 'borrador' }],
    } as never);
    crearCotizacion.ejecutar.mockResolvedValue({
      id: 'cot-1',
      codigo: 'COT-L00001',
      etapa: 'borrador',
    } as never);

    const res = await useCase.ejecutar({
      cliente: { nombre: 'Luis', celular: '900111222' },
      evento: {
        fechaTentativa: '2026-08-01',
        turno: 'turno_1',
        cantidadNinos: 20,
        paquete: 'Premium',
      },
      preferencias: {
        items: [{ productoId: 'p1', cantidad: 2 }],
      },
    });

    expect(crearCotizacion.ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({ solicitudId: 'sol-3', paquete: 'Premium' }),
    );
    expect(res.cotizacion).toEqual({
      id: 'cot-1',
      codigo: 'COT-L00001',
      etapa: 'borrador',
    });
    expect(events.cotizacionBorradorLista).toHaveBeenCalledWith(
      'sol-3',
      'cot-1',
      'COT-L00001',
      'Luis',
    );
  });

  it('permite origen personalizado y evita cotización auto fuera de landing', async () => {
    solicitudes.crear.mockResolvedValue({
      id: 'sol-4',
      nombreContacto: 'Brenda',
      canal: CanalSolicitud.meta,
    } as never);
    solicitudes.obtenerPorId.mockResolvedValue({
      id: 'sol-4',
      cotizaciones: [],
    } as never);

    const res = await useCase.ejecutar({
      cliente: { nombre: 'Brenda', celular: '955444333' },
      evento: {
        fechaTentativa: '2026-08-09',
        turno: 'turno_1',
        cantidadNinos: 18,
        paquete: 'Premium',
      },
      origen: {
        canal: CanalSolicitud.meta,
        detalle: 'instagram',
        payload: { detectedFromText: true },
      },
      preferencias: {
        items: [{ productoId: 'p1', cantidad: 1 }],
      },
    });

    expect(res.solicitud.id).toBe('sol-4');
    expect(solicitudes.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        canal: CanalSolicitud.meta,
        detalleOrigen: 'instagram',
        payloadOrigen: expect.objectContaining({
          origen: expect.objectContaining({
            canal: CanalSolicitud.meta,
            detalle: 'instagram',
          }),
        }),
      }),
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ canal: CanalSolicitud.meta }),
      }),
    );
    expect(crearCotizacion.ejecutar).not.toHaveBeenCalled();
  });

  it('infiere canal meta cuando detalle de origen es instagram', async () => {
    solicitudes.crear.mockResolvedValue({
      id: 'sol-5',
      nombreContacto: 'Carla',
      canal: CanalSolicitud.meta,
    } as never);
    solicitudes.obtenerPorId.mockResolvedValue({
      id: 'sol-5',
      cotizaciones: [],
    } as never);

    await useCase.ejecutar({
      cliente: { nombre: 'Carla', celular: '944333222' },
      origen: { detalle: 'Insta' },
    });

    expect(solicitudes.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        canal: CanalSolicitud.meta,
        detalleOrigen: 'instagram',
      }),
    );
  });

  it('infiere canal otro cuando detalle de origen es tiktok', async () => {
    solicitudes.crear.mockResolvedValue({
      id: 'sol-6',
      nombreContacto: 'Mauro',
      canal: CanalSolicitud.otro,
    } as never);
    solicitudes.obtenerPorId.mockResolvedValue({
      id: 'sol-6',
      cotizaciones: [],
    } as never);

    await useCase.ejecutar({
      cliente: { nombre: 'Mauro', celular: '933222111' },
      origen: { detalle: 'Tik Tok' },
    });

    expect(solicitudes.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        canal: CanalSolicitud.otro,
        detalleOrigen: 'tiktok',
      }),
    );
  });
});
