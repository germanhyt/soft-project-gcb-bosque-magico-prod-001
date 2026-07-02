import { BadRequestException } from '@nestjs/common';
import { CategoriaProducto, SubtipoProducto } from '@prisma/client';
import { validarSeleccionPaquete } from './validar-seleccion-paquete';
import type { ProductoCotizacionRef } from './composicion-paquete.types';

const popcorn: ProductoCotizacionRef = {
  id: 'cat-pop',
  codigo: 'CAT-POPCORN-CAT',
  nombre: 'Popcorn (catering)',
  categoria: CategoriaProducto.catering,
  subtipo: SubtipoProducto.general,
  precioLunesViernes: 10,
  precioFinSemana: 10,
  cantidadMinima: 18,
};

describe('validarSeleccionPaquete', () => {
  const productos = new Map([[popcorn.id, popcorn]]);

  it('acepta cantidad igual al mínimo', () => {
    expect(() =>
      validarSeleccionPaquete(
        { adicionales: [{ productoId: popcorn.id, cantidad: 18 }] },
        productos,
      ),
    ).not.toThrow();
  });

  it('rechaza cantidad menor al mínimo de catering general', () => {
    expect(() =>
      validarSeleccionPaquete(
        { adicionales: [{ productoId: popcorn.id, cantidad: 10 }] },
        productos,
      ),
    ).toThrow(BadRequestException);
  });

  it('rechaza producto adicional inexistente', () => {
    expect(() =>
      validarSeleccionPaquete(
        { adicionales: [{ productoId: 'no-existe', cantidad: 18 }] },
        productos,
      ),
    ).toThrow('Producto adicional no encontrado');
  });

  it('no valida mínimo en catering no general (piqueo)', () => {
    const piqueo: ProductoCotizacionRef = {
      ...popcorn,
      id: 'piq-1',
      codigo: 'PIQ-001',
      subtipo: SubtipoProducto.piqueo,
      cantidadMinima: 1,
    };
    const map = new Map([[piqueo.id, piqueo]]);

    expect(() =>
      validarSeleccionPaquete(
        { adicionales: [{ productoId: piqueo.id, cantidad: 1 }] },
        map,
      ),
    ).not.toThrow();
  });
});
