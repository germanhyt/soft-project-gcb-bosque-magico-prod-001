import {
  CLAVES_CONFIG_DEPRECADAS,
  CLAVES_NUMERICAS_EDITABLES,
} from './configuracion-claves';

describe('configuracion-claves', () => {
  it('incluye claves de capacidad y show extra editables', () => {
    expect(CLAVES_NUMERICAS_EDITABLES.has('shows.ninos_incluidos')).toBe(true);
    expect(CLAVES_NUMERICAS_EDITABLES.has('shows.precio_nino_extra')).toBe(true);
    expect(CLAVES_NUMERICAS_EDITABLES.has('extras.precio_nino_extra')).toBe(true);
    expect(CLAVES_NUMERICAS_EDITABLES.has('ninos.maximo_permitido')).toBe(true);
  });

  it('no incluye clave obsoleta tarifas.precio_nino_extra como editable', () => {
    expect(CLAVES_NUMERICAS_EDITABLES.has('tarifas.precio_nino_extra')).toBe(false);
    expect(CLAVES_CONFIG_DEPRECADAS).toContain('tarifas.precio_nino_extra');
  });
});
