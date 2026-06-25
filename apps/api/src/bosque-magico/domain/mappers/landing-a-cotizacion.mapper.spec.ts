import {
  mapearSolicitudLandingACotizacion,
  puedeCrearCotizacionBorradorDesdeLanding,
} from './landing-a-cotizacion.mapper';

describe('landing-a-cotizacion.mapper', () => {
  const dtoBase = {
    cliente: { nombre: 'María', celular: '999888777' },
    evento: {
      fechaTentativa: '2026-07-10',
      turno: 'turno_2' as const,
      cantidadNinos: 25,
      paquete: 'Premium',
    },
    preferencias: {
      origen: 'landing_cotizador',
      seleccion: {
        paquete: 'Premium',
        cajitasCantidad: 12,
        piqueos: [
          { productoId: 'piq-1', cantidad: 1 },
          { productoId: 'piq-2', cantidad: 2 },
        ],
        showIds: ['show-1'],
        extraIds: ['extra-1'],
        snackId: 'snack-1',
      },
    },
  };

  it('puedeCrearCotizacionBorradorDesdeLanding exige paquete, niños y fecha', () => {
    expect(puedeCrearCotizacionBorradorDesdeLanding(dtoBase)).toBe(true);
    expect(
      puedeCrearCotizacionBorradorDesdeLanding({
        ...dtoBase,
        evento: { ...dtoBase.evento, fechaTentativa: undefined },
      }),
    ).toBe(false);
    expect(
      puedeCrearCotizacionBorradorDesdeLanding({
        ...dtoBase,
        evento: { ...dtoBase.evento, paquete: '' },
      }),
    ).toBe(false);
  });

  it('mapearSolicitudLandingACotizacion incluye seleccion de paquete y solicitudId', () => {
    const mapped = mapearSolicitudLandingACotizacion('sol-99', dtoBase);
    expect(mapped.solicitudId).toBe('sol-99');
    expect(mapped.paquete).toBe('Premium');
    expect(mapped.seleccion?.cajitasCantidad).toBe(12);
    expect(mapped.seleccion?.piqueos).toEqual([
      { productoId: 'piq-1', cantidad: 1 },
      { productoId: 'piq-2', cantidad: 2 },
    ]);
    expect(mapped.seleccion?.showIds).toEqual(['show-1']);
    expect(mapped.cumpleanero.nombre).toBe('Por confirmar');
  });
});
