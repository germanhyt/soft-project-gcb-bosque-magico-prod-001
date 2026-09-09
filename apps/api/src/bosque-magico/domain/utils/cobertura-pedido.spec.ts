import {
  hayCoberturaActiva,
  pedidosRechazadosSinCobertura,
} from './cobertura-pedido';

describe('cobertura-pedido', () => {
  it('un cancelado sin reemplazo no está cubierto', () => {
    const pedidos = [
      {
        tipo: 'proveedor',
        etapa: 'cancelado',
        productoId: 'prod-1',
        nombre: 'Bocaditos',
      },
    ];
    expect(hayCoberturaActiva(pedidos[0], pedidos)).toBe(false);
    expect(pedidosRechazadosSinCobertura(pedidos)).toHaveLength(1);
  });

  it('un reemplazo pendiente cubre el rechazado', () => {
    const pedidos = [
      {
        tipo: 'proveedor',
        etapa: 'cancelado',
        productoId: 'prod-1',
        nombre: 'Bocaditos',
      },
      {
        tipo: 'proveedor',
        etapa: 'pendiente',
        productoId: 'prod-1',
        nombre: 'Bocaditos de café',
      },
    ];
    expect(hayCoberturaActiva(pedidos[0], pedidos)).toBe(true);
    expect(pedidosRechazadosSinCobertura(pedidos)).toHaveLength(0);
  });

  it('cubre por nombre si no hay productoId', () => {
    const pedidos = [
      {
        tipo: 'proveedor',
        etapa: 'cancelado',
        productoId: null,
        nombre: 'Show Mimo',
      },
      {
        tipo: 'proveedor',
        etapa: 'confirmado',
        productoId: null,
        nombre: 'show mimo',
      },
    ];
    expect(pedidosRechazadosSinCobertura(pedidos)).toHaveLength(0);
  });
});
