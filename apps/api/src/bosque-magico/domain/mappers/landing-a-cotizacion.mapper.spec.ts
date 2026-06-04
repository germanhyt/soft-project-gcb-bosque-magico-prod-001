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
      items: [{ productoId: 'prod-1', cantidad: 18 }],
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

  it('mapearSolicitudLandingACotizacion incluye items y solicitudId', () => {
    const mapped = mapearSolicitudLandingACotizacion('sol-99', dtoBase);
    expect(mapped.solicitudId).toBe('sol-99');
    expect(mapped.items).toHaveLength(1);
    expect(mapped.items?.[0].productoId).toBe('prod-1');
    expect(mapped.cumpleanero.nombre).toBe('Por confirmar');
  });
});
