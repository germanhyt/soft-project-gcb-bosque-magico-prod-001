import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActualizarProveedorDto } from '../application/dto/actualizar-proveedor.dto';
import { CrearProveedorDto } from '../application/dto/crear-proveedor.dto';
import { ActualizarProveedorUseCase } from '../application/use-cases/actualizar-proveedor.use-case';
import { CrearProveedorUseCase } from '../application/use-cases/crear-proveedor.use-case';
import { ListarProveedoresUseCase } from '../application/use-cases/listar-proveedores.use-case';

@ApiTags('Panel - Proveedores')
@Controller('bosque-magico/proveedores')
export class ProveedoresController {
  constructor(
    private readonly listar: ListarProveedoresUseCase,
    private readonly crear: CrearProveedorUseCase,
    private readonly actualizar: ActualizarProveedorUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  listarProveedores(@Query('soloActivos') soloActivos?: string) {
    return this.listar.ejecutar(soloActivos === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Crear proveedor' })
  crearProveedor(@Body() dto: CrearProveedorDto) {
    return this.crear.ejecutar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  patch(@Param('id') id: string, @Body() dto: ActualizarProveedorDto) {
    return this.actualizar.ejecutar(id, dto);
  }
}
