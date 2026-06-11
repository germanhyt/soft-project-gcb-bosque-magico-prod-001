import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EtapaContrato } from '@prisma/client';
import { GenerarContratoDto } from '../application/dto/generar-contrato.dto';
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

@ApiTags('Panel - Contratos')
@Controller('bosque-magico')
export class ContratosController {
  constructor(
    private readonly listar: ListarContratosUseCase,
    private readonly obtener: ObtenerContratoUseCase,
    private readonly obtenerPorEvento: ObtenerContratoPorEventoUseCase,
    private readonly generar: GenerarContratoEventoUseCase,
    private readonly marcarEnviado: MarcarContratoEnviadoUseCase,
    private readonly marcarFirmado: MarcarContratoFirmadoUseCase,
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

  @Post('contratos/:id/firmar')
  @ApiOperation({ summary: 'Marcar contrato como firmado' })
  firmar(@Param('id') id: string) {
    return this.marcarFirmado.ejecutar(id);
  }
}
