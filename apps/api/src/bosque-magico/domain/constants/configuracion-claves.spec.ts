import {
  CLAVES_CONFIG_DEPRECADAS,
  CLAVES_NUMERICAS_EDITABLES,
} from './configuracion-claves';

describe('configuracion-claves', () => {
  it('incluye claves de capacidad y show extra editables', () => {
    expect(CLAVES_NUMERICAS_EDITABLES.has('shows.ninos_incluidos')).toBe(true);
    expect(CLAVES_NUMERICAS_EDITABLES.has('shows.precio_nino_extra')).toBe(
      true,
    );
    expect(CLAVES_NUMERICAS_EDITABLES.has('extras.precio_nino_extra')).toBe(
      false,
    );
    expect(CLAVES_NUMERICAS_EDITABLES.has('ninos.maximo_permitido')).toBe(true);
    expect(
      CLAVES_NUMERICAS_EDITABLES.has('espacio.hora_extra_lunes_viernes'),
    ).toBe(true);
    expect(
      CLAVES_NUMERICAS_EDITABLES.has('espacio.hora_extra_fin_semana'),
    ).toBe(true);
    expect(CLAVES_NUMERICAS_EDITABLES.has('extras.salita_lounge')).toBe(true);
    expect(CLAVES_NUMERICAS_EDITABLES.has('extras.ingreso_show_externo')).toBe(
      true,
    );
    expect(
      CLAVES_NUMERICAS_EDITABLES.has('extras.ingreso_decoracion_externo'),
    ).toBe(true);
    expect(
      CLAVES_NUMERICAS_EDITABLES.has('extras.ingreso_carrito_snack_externo'),
    ).toBe(true);
  });

  it('no incluye claves obsoletas de niño extra como editables', () => {
    expect(CLAVES_NUMERICAS_EDITABLES.has('tarifas.precio_nino_extra')).toBe(
      false,
    );
    expect(CLAVES_NUMERICAS_EDITABLES.has('extras.precio_nino_extra')).toBe(
      false,
    );
    expect(CLAVES_CONFIG_DEPRECADAS).toContain('tarifas.precio_nino_extra');
    expect(CLAVES_CONFIG_DEPRECADAS).toContain('extras.precio_nino_extra');
  });
});
