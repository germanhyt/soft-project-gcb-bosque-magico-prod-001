import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CrearProductoDto } from '../dto/crear-producto.dto';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class CrearProductoUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(dto: CrearProductoDto) {
    const existe = await this.productos.obtenerPorCodigo(dto.codigo);
    if (existe)
      throw new BadRequestException('Ya existe un producto con ese código');

    const producto = await this.productos.crear({
      codigo: dto.codigo.trim().toUpperCase(),
      nombre: dto.nombre.trim(),
      categoria: dto.categoria,
      precioLunesViernes: dto.precioLunesViernes,
      precioFinSemana: dto.precioFinSemana,
      cantidadMinima: dto.cantidadMinima,
      subtipo: dto.subtipo,
      unidadesPack: dto.unidadesPack,
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
