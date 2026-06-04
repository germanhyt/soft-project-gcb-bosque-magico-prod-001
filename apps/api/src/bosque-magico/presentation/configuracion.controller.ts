import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { ActualizarConfiguracionDto } from '../application/dto/actualizar-configuracion.dto';
import { ActualizarConfiguracionUseCase } from '../application/use-cases/actualizar-configuracion.use-case';
import { ListarConfiguracionPanelUseCase } from '../application/use-cases/listar-configuracion-panel.use-case';

@ApiTags('Panel - Configuración')
@Controller('bosque-magico/configuracion')
export class ConfiguracionController {
  constructor(
    private readonly listar: ListarConfiguracionPanelUseCase,
    private readonly actualizar: ActualizarConfiguracionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar configuración (panel)' })
  listarConfiguracion() {
    return this.listar.ejecutar();
  }

  @AdminOnly()
  @Patch()
  @ApiOperation({ summary: 'Actualizar valores editables de configuración' })
  patch(@Body() dto: ActualizarConfiguracionDto) {
    return this.actualizar.ejecutar(dto);
  }
}
