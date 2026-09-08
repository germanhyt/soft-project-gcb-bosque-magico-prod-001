import { payloadExtrasPermitidos } from './extras-permitidos-payload';

describe('payloadExtrasPermitidos', () => {
  const catalogo = [
    { nombre: 'Piñata', codigo: 'EXT-PINATA', extraPermitido: true, etapa: 'activo' },
    { nombre: 'Torta temática', codigo: 'EXT-TORTA', extraPermitido: true, etapa: 'activo' },
    { nombre: 'Pintacaritas', codigo: 'EXT-PINTA', extraPermitido: false, etapa: 'activo' },
  ];

  it('persiste la lista enviada por el vendedor, aunque esté vacía', () => {
    expect(
      payloadExtrasPermitidos({
        lista: [],
        catalogo,
        usarDefaultSiOmite: true,
      }),
    ).toEqual({ extrasPermitidos: [] });
  });

  it('si omite la lista, sugiere las del catálogo', () => {
    expect(
      payloadExtrasPermitidos({
        catalogo,
        usarDefaultSiOmite: true,
      }),
    ).toEqual({ extrasPermitidos: ['Piñata', 'Torta temática'] });
  });

  it('no rellena extras si no se pide default', () => {
    expect(payloadExtrasPermitidos({ catalogo })).toEqual({});
  });

  it('normaliza comentario: vacío queda null', () => {
    expect(
      payloadExtrasPermitidos({
        lista: ['Piñata'],
        comentario: '  La torta llega 30 min antes  ',
      }),
    ).toEqual({
      extrasPermitidos: ['Piñata'],
      extrasPermitidosComentario: 'La torta llega 30 min antes',
    });

    expect(
      payloadExtrasPermitidos({
        lista: ['Piñata'],
        comentario: '   ',
      }),
    ).toEqual({
      extrasPermitidos: ['Piñata'],
      extrasPermitidosComentario: null,
    });
  });
});
