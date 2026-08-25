import { CategoriaProducto, SubtipoProducto } from '@prisma/client';
import { prefijoCodigoProducto } from './codigos-secuencia';

describe('prefijoCodigoProducto', () => {
  it('resuelve prefijo por categoría', () => {
    expect(prefijoCodigoProducto(CategoriaProducto.paquete)).toBe('PK-');
    expect(prefijoCodigoProducto(CategoriaProducto.show)).toBe('SHOW-');
    expect(prefijoCodigoProducto(CategoriaProducto.extra)).toBe('EXT-');
    expect(prefijoCodigoProducto(CategoriaProducto.espacio)).toBe('ESP-');
  });

  it('resuelve prefijo de catering según subtipo', () => {
    expect(
      prefijoCodigoProducto(CategoriaProducto.catering, SubtipoProducto.piqueo),
    ).toBe('PIQ-');
    expect(
      prefijoCodigoProducto(CategoriaProducto.catering, SubtipoProducto.cajita),
    ).toBe('CAJ-');
    expect(
      prefijoCodigoProducto(CategoriaProducto.catering, SubtipoProducto.snack),
    ).toBe('CAT-');
    expect(
      prefijoCodigoProducto(
        CategoriaProducto.catering,
        SubtipoProducto.general,
      ),
    ).toBe('CAT-');
  });
});
