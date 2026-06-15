import { Injectable } from '@nestjs/common';
import { CrearProveedorDto } from '../dto/crear-proveedor.dto';
import { mapProveedorResponse } from '../../domain/mappers/proveedor.mapper';
import { ProveedoresRepository } from '../../infrastructure/repositories/proveedores.repository';

@Injectable()
export class CrearProveedorUseCase {
  constructor(private readonly proveedores: ProveedoresRepository) {}

  async ejecutar(dto: CrearProveedorDto) {
    const row = await this.proveedores.crear(dto);
    return mapProveedorResponse(row);
  }
}
