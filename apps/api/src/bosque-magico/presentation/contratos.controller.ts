import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { EtapaContrato, TipoAdjuntoContrato } from '@prisma/client';
import { EnviarContratoCorreoDto } from '../application/dto/enviar-contrato-correo.dto';
import { GenerarContratoDto } from '../application/dto/generar-contrato.dto';
import { EnviarContratoCorreoUseCase } from '../application/use-cases/enviar-contrato-correo.use-case';
import { GenerarContratoEventoUseCase } from '../application/use-cases/generar-contrato-evento.use-case';
import { ListarContratosUseCase } from '../application/use-cases/listar-contratos.use-case';
import {
  MarcarContratoEnviadoUseCase,
  MarcarContratoFirmadoUseCase,
} from '../application/use-cases/marcar-contrato-estado.use-case';
import {
  ObtenerContratoPorEventoUseCase,
  ObtenerContratoUseCase,
} from '../application/use-cases/obtener-contrato.use-case';
import {
  EliminarAdjuntoContratoUseCase,
  SubirAdjuntoContratoUseCase,
} from '../application/use-cases/gestionar-adjunto-contrato.use-case';
import { VolverABorradorContratoUseCase } from '../application/use-cases/volver-a-borrador-contrato.use-case';

@ApiTags('Panel - Contratos')
@Controller('bosque-magico')
export class ContratosController {
  constructor(
    private readonly listar: ListarContratosUseCase,
    private readonly obtener: ObtenerContratoUseCase,
    private readonly obtenerPorEvento: ObtenerContratoPorEventoUseCase,
    private readonly generar: GenerarContratoEventoUseCase,
    private readonly marcarEnviado: MarcarContratoEnviadoUseCase,
    private readonly enviarCorreo: EnviarContratoCorreoUseCase,
    private readonly marcarFirmado: MarcarContratoFirmadoUseCase,
    private readonly volverABorrador: VolverABorradorContratoUseCase,
    private readonly subirAdjunto: SubirAdjuntoContratoUseCase,
    private readonly eliminarAdjunto: EliminarAdjuntoContratoUseCase,
  ) {}

  @Get('contratos')
  @ApiOperation({ summary: 'Listar contratos' })
  @ApiQuery({ name: 'etapa', required: false, enum: EtapaContrato })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Buscar por número, cliente, celular o cotización',
  })
  listarContratos(
    @Query('etapa') etapa?: EtapaContrato,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.listar.ejecutar(etapa, page, pageSize, q);
  }

  @Get('contratos/:id')
  @ApiOperation({ summary: 'Detalle de contrato' })
  detalle(@Param('id') id: string) {
    return this.obtener.ejecutar(id);
  }

  @Get('eventos/:eventoId/contrato')
  @ApiOperation({ summary: 'Contrato del evento (null si no existe)' })
  contratoDeEvento(@Param('eventoId') eventoId: string) {
    return this.obtenerPorEvento.ejecutar(eventoId);
  }

  @Post('eventos/:eventoId/contrato')
  @ApiOperation({ summary: 'Generar o actualizar contrato del evento' })
  generarContrato(
    @Param('eventoId') eventoId: string,
    @Body() dto: GenerarContratoDto,
  ) {
    return this.generar.ejecutar(eventoId, dto);
  }

  @Post('contratos/:id/enviar')
  @ApiOperation({ summary: 'Marcar contrato como enviado' })
  enviar(@Param('id') id: string) {
    return this.marcarEnviado.ejecutar(id);
  }

  @Post('contratos/:id/enviar-correo')
  @ApiOperation({
    summary: 'Enviar contrato por correo (SMTP si está activo; si no, deja listo mailto)',
  })
  enviarPorCorreo(
    @Param('id') id: string,
    @Body() dto: EnviarContratoCorreoDto,
  ) {
    return this.enviarCorreo.ejecutar(id, dto);
  }

  @Post('contratos/:id/volver-borrador')
  @ApiOperation({ summary: 'Volver contrato enviado a borrador para editar' })
  volverBorrador(@Param('id') id: string) {
    return this.volverABorrador.ejecutar(id);
  }

  @Post('contratos/:id/firmar')
  @ApiOperation({ summary: 'Marcar contrato como firmado' })
  firmar(@Param('id') id: string) {
    return this.marcarFirmado.ejecutar(id);
  }

  @Post('contratos/:id/adjuntos/:tipo')
  @ApiOperation({
    summary: 'Subir comprobante o documento contable (PDF/imagen, máx. 5 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { archivo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  subirAdjuntoContrato(
    @Param('id') id: string,
    @Param('tipo') tipo: TipoAdjuntoContrato,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.subirAdjunto.ejecutar(id, tipo, file);
  }

  @Delete('contratos/:id/adjuntos/:tipo')
  @ApiOperation({ summary: 'Quitar adjunto del contrato' })
  quitarAdjuntoContrato(
    @Param('id') id: string,
    @Param('tipo') tipo: TipoAdjuntoContrato,
  ) {
    return this.eliminarAdjunto.ejecutar(id, tipo);
  }
}
