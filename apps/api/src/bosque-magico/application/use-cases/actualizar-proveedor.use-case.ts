import { Injectable, NotFoundException } from '@nestjs/common';
import { ActualizarProveedorDto } from '../dto/actualizar-proveedor.dto';
import { mapProveedorResponse } from '../../domain/mappers/proveedor.mapper';
import { ProveedoresRepository } from '../../infrastructure/repositories/proveedores.repository';

@Injectable()
export class ActualizarProveedorUseCase {
  constructor(private readonly proveedores: ProveedoresRepository) {}

  async ejecutar(id: string, dto: ActualizarProveedorDto) {
    const existe = await this.proveedores.obtenerPorId(id);
    if (!existe) throw new NotFoundException('Proveedor no encontrado');
    const row = await this.proveedores.actualizar(id, dto);
    return mapProveedorResponse(row);
  }
}
