import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { ActualizarConfiguracionDto } from '../application/dto/actualizar-configuracion.dto';
import { ProbarSmtpDto } from '../application/dto/probar-smtp.dto';
import { ActualizarConfiguracionUseCase } from '../application/use-cases/actualizar-configuracion.use-case';
import { ListarConfiguracionPanelUseCase } from '../application/use-cases/listar-configuracion-panel.use-case';
import { ProbarSmtpUseCase } from '../application/use-cases/probar-smtp.use-case';

@ApiTags('Panel - Configuración')
@Controller('bosque-magico/configuracion')
export class ConfiguracionController {
  constructor(
    private readonly listar: ListarConfiguracionPanelUseCase,
    private readonly actualizar: ActualizarConfiguracionUseCase,
    private readonly probarSmtp: ProbarSmtpUseCase,
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

  @AdminOnly()
  @Post('smtp/probar')
  @ApiOperation({
    summary: 'Enviar correo de prueba con la configuración SMTP guardada',
  })
  enviarPruebaSmtp(@Body() dto: ProbarSmtpDto) {
    return this.probarSmtp.ejecutar(dto);
  }
}
