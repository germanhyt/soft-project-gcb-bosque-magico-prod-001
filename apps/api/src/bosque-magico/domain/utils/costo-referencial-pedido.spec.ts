import { costoReferencialPedido } from './costo-referencial-pedido';

describe('costoReferencialPedido', () => {
  it('usa el costo guardado si es mayor a 0', () => {
    expect(
      costoReferencialPedido({
        costoGuardado: 50,
        cantidad: 2,
        costoInterno: 10,
      }),
    ).toBe(50);
  });

  it('ignora 0 guardado y usa costo interno', () => {
    expect(
      costoReferencialPedido({
        costoGuardado: 0,
        cantidad: 2,
        costoInterno: 10,
      }),
    ).toBe(20);
  });

  it('si no hay interno ni precio de ítem, usa 60% del catálogo', () => {
    expect(
      costoReferencialPedido({
        costoGuardado: 0,
        cantidad: 1,
        precioItem: 0,
        precioCatalogo: 46,
      }),
    ).toBe(27.6);
  });
});
