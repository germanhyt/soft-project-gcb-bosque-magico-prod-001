import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActualizarProductoDto } from '../dto/actualizar-producto.dto';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { toDecimal } from '../../domain/utils/decimal';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class ActualizarProductoUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(id: string, dto: ActualizarProductoDto) {
    const antes = await this.productos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Producto no encontrado');

    const despues = await this.productos.actualizar(id, {
      ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
      ...(dto.categoria !== undefined ? { categoria: dto.categoria } : {}),
      ...(dto.precioLunesViernes !== undefined
        ? { precioLunesViernes: toDecimal(dto.precioLunesViernes) }
        : {}),
      ...(dto.precioFinSemana !== undefined
        ? { precioFinSemana: toDecimal(dto.precioFinSemana) }
        : {}),
      ...(dto.cantidadMinima !== undefined
        ? { cantidadMinima: dto.cantidadMinima }
        : {}),
      ...(dto.subtipo !== undefined ? { subtipo: dto.subtipo } : {}),
      ...(dto.unidadesPack !== undefined
        ? { unidadesPack: dto.unidadesPack }
        : {}),
      ...(dto.unidad !== undefined ? { unidad: dto.unidad.trim() || 'servicio' } : {}),
      ...(dto.descripcion !== undefined
        ? { descripcion: dto.descripcion }
        : {}),
      ...(dto.etapa !== undefined ? { etapa: dto.etapa } : {}),
      ...(dto.origen !== undefined ? { origen: dto.origen } : {}),
      ...(dto.costoInterno !== undefined
        ? { costoInterno: toDecimal(dto.costoInterno) }
        : {}),
      ...(dto.proveedorId !== undefined
        ? { proveedorId: dto.proveedorId }
        : {}),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: id,
      accion: dto.etapa !== undefined ? 'cambiar_etapa' : 'actualizar',
      actorTipo: 'admin',
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    return mapProductoResponse(despues);
  }
}
