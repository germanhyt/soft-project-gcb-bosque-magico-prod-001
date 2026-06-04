import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';
import { CrearSolicitudPublicaDto } from '../application/dto/crear-solicitud-publica.dto';
import { PrevisualizarCotizacionPublicaDto } from '../application/dto/previsualizar-cotizacion-publica.dto';
import { AceptarCotizacionUseCase } from '../application/use-cases/aceptar-cotizacion.use-case';
import { CrearSolicitudPublicaUseCase } from '../application/use-cases/crear-solicitud-publica.use-case';
import { ResolverIdentidadContactoUseCase } from '../application/use-cases/resolver-identidad-contacto.use-case';
import { ObtenerCatalogoPublicoUseCase } from '../application/use-cases/obtener-catalogo-publico.use-case';
import { ObtenerConfiguracionPublicaUseCase } from '../application/use-cases/obtener-configuracion-publica.use-case';
import { ObtenerCotizacionUseCase } from '../application/use-cases/obtener-cotizacion.use-case';
import { PrevisualizarCotizacionPublicaUseCase } from '../application/use-cases/previsualizar-cotizacion-publica.use-case';

@ApiTags('Público - Bosque Mágico')
@Public()
@Controller('public/bosque-magico')
export class PublicBosqueMagicoController {
  constructor(
    private readonly crearSolicitud: CrearSolicitudPublicaUseCase,
    private readonly resolverIdentidad: ResolverIdentidadContactoUseCase,
    private readonly obtenerConfig: ObtenerConfiguracionPublicaUseCase,
    private readonly obtenerCatalogo: ObtenerCatalogoPublicoUseCase,
    private readonly obtenerCotizacion: ObtenerCotizacionUseCase,
    private readonly aceptarCotizacion: AceptarCotizacionUseCase,
    private readonly previsualizarCotizacion: PrevisualizarCotizacionPublicaUseCase,
  ) {}

  @Get('configuracion')
  @ApiOperation({ summary: 'Configuración pública (tarifas, turnos, límites)' })
  configuracion() {
    return this.obtenerConfig.ejecutar();
  }

  @Get('catalogo')
  @ApiOperation({ summary: 'Catálogo público de productos para cotizador' })
  catalogo() {
    return this.obtenerCatalogo.ejecutar();
  }

  @Get('identidad')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Reconocer identidad por celular/correo (landing)' })
  identidad(
    @Query('celular') celular: string,
    @Query('correo') correo?: string,
  ) {
    return this.resolverIdentidad.ejecutar(celular, correo);
  }

  @Post('solicitudes')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Crear solicitud desde landing' })
  async solicitudes(@Body() dto: CrearSolicitudPublicaDto) {
    const resultado = await this.crearSolicitud.ejecutar(dto);
    return {
      mensaje: resultado.cotizacion
        ? 'Solicitud registrada. El equipo revisará tu cotización.'
        : 'Solicitud registrada correctamente',
      id: resultado.solicitud.id,
      etapa: resultado.solicitud.etapa,
      posibleDuplicado: resultado.posibleDuplicado,
      identidad: resultado.identidad,
      cotizacion: resultado.cotizacion,
    };
  }

  @Get('cotizaciones/:token')
  @ApiOperation({ summary: 'Ver cotización pública por token' })
  cotizacionPublica(@Param('token') token: string) {
    return this.obtenerCotizacion.ejecutarPublica(token);
  }

  @Post('cotizaciones/preview')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Previsualizar montos de cotización pública' })
  previewCotizacion(@Body() dto: PrevisualizarCotizacionPublicaDto) {
    return this.previsualizarCotizacion.ejecutar(dto);
  }

  @Post('cotizaciones/:token/aceptar')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Aceptar cotización desde link público' })
  aceptarPublica(@Param('token') token: string) {
    return this.aceptarCotizacion.ejecutarPorToken(token);
  }
}
