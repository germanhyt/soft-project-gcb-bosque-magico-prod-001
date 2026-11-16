import { destinoTrasIngreso, RUTA_INICIO } from './ruta-ingreso';

describe('destinoTrasIngreso', () => {
  it('abre solicitudes al entrar sin destino previo', () => {
    expect(RUTA_INICIO).toBe('/solicitudes');
    expect(destinoTrasIngreso(null)).toBe('/solicitudes');
    expect(destinoTrasIngreso(undefined)).toBe('/solicitudes');
    expect(destinoTrasIngreso('')).toBe('/solicitudes');
  });

  it('abre solicitudes si el ingreso caía en la raíz o en el dashboard', () => {
    expect(destinoTrasIngreso('/')).toBe('/solicitudes');
    expect(destinoTrasIngreso('/dashboard')).toBe('/solicitudes');
    expect(destinoTrasIngreso('/login')).toBe('/solicitudes');
  });

  it('respeta un deep link distinto', () => {
    expect(destinoTrasIngreso('/cotizaciones/abc')).toBe('/cotizaciones/abc');
    expect(destinoTrasIngreso('/agenda')).toBe('/agenda');
  });
});
