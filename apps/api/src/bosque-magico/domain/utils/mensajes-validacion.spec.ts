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

  it('acepta turno personalizado en el mensaje de enum', () => {
    expect(
      mensajesValidacion([
        {
          property: 'turnoInteres',
          constraints: {
            isEnum: 'turnoInteres must be one of the following values: turno_1, turno_2, turno_3',
          },
          children: [],
        },
      ]),
    ).toEqual(['Elige un turno válido (1, 2, 3 o personalizado).']);
  });
});
