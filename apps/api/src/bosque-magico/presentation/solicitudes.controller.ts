import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload';

import { EtapaSolicitud } from '@prisma/client';

import { ActualizarSolicitudDto } from '../application/dto/actualizar-solicitud.dto';

import { CerrarSolicitudDto } from '../application/dto/cerrar-solicitud.dto';

import { CrearSolicitudManualDto } from '../application/dto/crear-solicitud-manual.dto';

import { ActualizarSolicitudUseCase } from '../application/use-cases/actualizar-solicitud.use-case';

import { CerrarSolicitudUseCase } from '../application/use-cases/cerrar-solicitud.use-case';

import { CrearSolicitudManualUseCase } from '../application/use-cases/crear-solicitud-manual.use-case';

import { ListarSolicitudesUseCase } from '../application/use-cases/listar-solicitudes.use-case';

import { TomarSolicitudUseCase } from '../application/use-cases/tomar-solicitud.use-case';

import { GenerarCotizacionBorradorSolicitudUseCase } from '../application/use-cases/generar-cotizacion-borrador-solicitud.use-case';

import { SolicitudesRepository } from '../infrastructure/repositories/solicitudes.repository';

@ApiTags('Panel - Solicitudes')
@Controller('bosque-magico/solicitudes')
export class SolicitudesController {
  constructor(
    private readonly listar: ListarSolicitudesUseCase,

    private readonly crearManual: CrearSolicitudManualUseCase,

    private readonly tomar: TomarSolicitudUseCase,

    private readonly cerrar: CerrarSolicitudUseCase,

    private readonly actualizar: ActualizarSolicitudUseCase,

    private readonly generarCotizacionBorrador: GenerarCotizacionBorradorSolicitudUseCase,

    private readonly solicitudesRepo: SolicitudesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes (panel)' })
  @ApiQuery({ name: 'etapa', required: false, enum: EtapaSolicitud })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Buscar por nombre, celular o correo',
  })
  listarSolicitudes(
    @Query('etapa') etapa?: EtapaSolicitud,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.listar.ejecutar(etapa, page, pageSize, q);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen por etapa para dashboard' })
  resumen() {
    return this.solicitudesRepo.contarPorEtapa();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de solicitud' })
  async obtener(@Param('id') id: string) {
    const solicitud = await this.solicitudesRepo.obtenerPorId(id);

    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    return solicitud;
  }

  @Post()
  @ApiOperation({ summary: 'Crear solicitud manual (panel)' })
  crear(@Body() dto: CrearSolicitudManualDto) {
    return this.crearManual.ejecutar(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar solicitud (datos de contacto, evento tentativo o seguimiento)',
  })
  actualizarSolicitud(
    @Param('id') id: string,
    @Body() dto: ActualizarSolicitudDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.actualizar.ejecutar(id, dto, user?.sub);
  }

  @Post(':id/tomar')
  @ApiOperation({ summary: 'Tomar solicitud (Nueva → En atención)' })
  tomarSolicitud(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.tomar.ejecutar(id, user?.sub);
  }

  @Post(':id/generar-cotizacion-borrador')
  @ApiOperation({
    summary:
      'Generar cotización borrador desde payload guardado (landing antigua)',
  })
  generarCotizacionBorradorSolicitud(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.generarCotizacionBorrador.ejecutar(id, user?.sub);
  }

  @Post(':id/cerrar')
  @ApiOperation({ summary: 'Cerrar solicitud con motivo' })
  cerrarSolicitud(@Param('id') id: string, @Body() dto: CerrarSolicitudDto) {
    return this.cerrar.ejecutar(id, dto);
  }
}
