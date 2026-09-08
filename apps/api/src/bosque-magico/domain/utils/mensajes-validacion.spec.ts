import { mensajesValidacion } from './mensajes-validacion';

describe('mensajesValidacion', () => {
  it('nombra extras permitidos cuando el campo no está en el DTO cargado', () => {
    expect(
      mensajesValidacion([
        {
          property: 'extrasPermitidos',
          constraints: {
            whitelistValidation: 'property extrasPermitidos should not exist',
          },
          children: [],
        },
      ]),
    ).toEqual([
      'No se pudo aplicar el listado de extras permitidos. Recarga la página e inténtalo de nuevo.',
    ]);
  });
});
