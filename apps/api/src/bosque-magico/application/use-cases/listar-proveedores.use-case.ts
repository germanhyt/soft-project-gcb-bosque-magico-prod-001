import { Injectable } from '@nestjs/common';
import { mapProveedorResponse } from '../../domain/mappers/proveedor.mapper';
import { ProveedoresRepository } from '../../infrastructure/repositories/proveedores.repository';

@Injectable()
export class ListarProveedoresUseCase {
  constructor(private readonly proveedores: ProveedoresRepository) {}

  async ejecutar(soloActivos?: boolean) {
    const rows = await this.proveedores.listar(
      soloActivos === true ? { soloActivos: true } : undefined,
    );
    return rows.map(mapProveedorResponse);
  }
}
