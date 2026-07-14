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
import { EtapaCotizacion } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload';
import { ActualizarCotizacionDto } from '../application/dto/actualizar-cotizacion.dto';
import { CrearCotizacionDto } from '../application/dto/crear-cotizacion.dto';
import { EnviarCotizacionDto } from '../application/dto/enviar-cotizacion.dto';
import { AceptarCotizacionUseCase } from '../application/use-cases/aceptar-cotizacion.use-case';
import { ActualizarCotizacionUseCase } from '../application/use-cases/actualizar-cotizacion.use-case';
import { CrearCotizacionUseCase } from '../application/use-cases/crear-cotizacion.use-case';
import { EnviarCotizacionUseCase } from '../application/use-cases/enviar-cotizacion.use-case';
import { ListarCotizacionesUseCase } from '../application/use-cases/listar-cotizaciones.use-case';
import { ObtenerCotizacionUseCase } from '../application/use-cases/obtener-cotizacion.use-case';

@ApiTags('Panel - Cotizaciones')
@Controller('bosque-magico')
export class CotizacionesController {
  constructor(
    private readonly listar: ListarCotizacionesUseCase,
    private readonly obtener: ObtenerCotizacionUseCase,
    private readonly crear: CrearCotizacionUseCase,
    private readonly actualizar: ActualizarCotizacionUseCase,
    private readonly enviar: EnviarCotizacionUseCase,
    private readonly aceptar: AceptarCotizacionUseCase,
  ) {}

  @Get('cotizaciones')
  @ApiOperation({ summary: 'Listar cotizaciones' })
  @ApiQuery({ name: 'etapa', required: false, enum: EtapaCotizacion })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Buscar por código, cliente o celular',
  })
  listarCotizaciones(
    @Query('etapa') etapa?: EtapaCotizacion,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.listar.ejecutar(etapa, page, pageSize, q);
  }

  @Get('cotizaciones/:id')
  @ApiOperation({ summary: 'Detalle de cotización' })
  detalle(@Param('id') id: string) {
    return this.obtener.ejecutar(id);
  }

  @Post('cotizaciones')
  @ApiOperation({ summary: 'Crear cotización (borrador)' })
  crearCotizacion(
    @Body() dto: CrearCotizacionDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.crear.ejecutar(dto, user?.sub);
  }

  @Patch('cotizaciones/:id')
  @ApiOperation({ summary: 'Actualizar cotización en borrador' })
  patch(@Param('id') id: string, @Body() dto: ActualizarCotizacionDto) {
    return this.actualizar.ejecutar(id, dto);
  }

  @Post('cotizaciones/:id/enviar')
  @ApiOperation({ summary: 'Marcar enviada y registrar log' })
  enviarCotizacion(
    @Param('id') id: string,
    @Body() dto: EnviarCotizacionDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.enviar.ejecutar(id, dto, user?.sub);
  }

  @Post('cotizaciones/:id/aceptar')
  @ApiOperation({ summary: 'Aceptación manual (panel)' })
  aceptarManual(@Param('id') id: string) {
    return this.aceptar.ejecutarPorId(id);
  }
}
