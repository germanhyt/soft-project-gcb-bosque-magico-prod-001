import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CrearProductoDto } from '../dto/crear-producto.dto';
import {
  PADDING_CODIGO_PRODUCTO,
  prefijoCodigoProducto,
} from '../../domain/constants/codigos-secuencia';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';
import { SecuenciasRepository } from '../../infrastructure/repositories/secuencias.repository';

@Injectable()
export class CrearProductoUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly secuencias: SecuenciasRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  private async resolverCodigo(dto: CrearProductoDto): Promise<string> {
    const manual = dto.codigo?.trim();
    if (manual) {
      const codigo = manual.toUpperCase();
      const existe = await this.productos.obtenerPorCodigo(codigo);
      if (existe) {
        throw new BadRequestException('Ya existe un producto con ese código');
      }
      return codigo;
    }

    const prefijo = prefijoCodigoProducto(dto.categoria, dto.subtipo);
    return this.secuencias.siguiente(prefijo, PADDING_CODIGO_PRODUCTO);
  }

  async ejecutar(dto: CrearProductoDto) {
    const codigo = await this.resolverCodigo(dto);

    const producto = await this.productos.crear({
      codigo,
      nombre: dto.nombre.trim(),
      categoria: dto.categoria,
      precioLunesViernes: dto.precioLunesViernes,
      precioFinSemana: dto.precioFinSemana,
      cantidadMinima: dto.cantidadMinima,
      subtipo: dto.subtipo,
      unidadesPack: dto.unidadesPack,
      unidad:
        dto.unidad?.trim() ||
        (dto.categoria === 'extra' ? 'hora' : undefined),
      descripcion: dto.descripcion?.trim(),
      origen: dto.origen,
      costoInterno: dto.costoInterno,
      proveedorId: dto.proveedorId,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: producto.id,
      accion: 'crear',
      actorTipo: 'admin',
      despues: JSON.parse(JSON.stringify(producto)) as Prisma.InputJsonValue,
    });

    return mapProductoResponse(producto);
  }
}
