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
import { EtapaEvento, TurnoInteres } from '@prisma/client';
import { ActualizarEventoDto } from '../application/dto/actualizar-evento.dto';
import { CancelarEventoDto } from '../application/dto/cancelar-evento.dto';
import { ActualizarEventoUseCase } from '../application/use-cases/actualizar-evento.use-case';
import { CancelarEventoUseCase } from '../application/use-cases/cancelar-evento.use-case';
import { ConfirmarEventoUseCase } from '../application/use-cases/confirmar-evento.use-case';
import { ListarEventosUseCase } from '../application/use-cases/listar-eventos.use-case';
import { ObtenerAgendaUseCase } from '../application/use-cases/obtener-agenda.use-case';
import { RealizarEventoUseCase } from '../application/use-cases/realizar-evento.use-case';
import { EventosRepository } from '../infrastructure/repositories/eventos.repository';
import { mapEventoResponse } from '../domain/mappers/evento.mapper';

@ApiTags('Panel - Agenda / Eventos')
@Controller('bosque-magico/eventos')
export class EventosController {
  constructor(
    private readonly listar: ListarEventosUseCase,
    private readonly agenda: ObtenerAgendaUseCase,
    private readonly actualizar: ActualizarEventoUseCase,
    private readonly confirmar: ConfirmarEventoUseCase,
    private readonly realizar: RealizarEventoUseCase,
    private readonly cancelar: CancelarEventoUseCase,
    private readonly eventosRepo: EventosRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiQuery({ name: 'etapa', required: false, enum: EtapaEvento })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'turno', required: false, enum: TurnoInteres })
  listarEventos(
    @Query('etapa') etapa?: EtapaEvento,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('turno') turno?: TurnoInteres,
  ) {
    return this.listar.ejecutar({ etapa, desde, hasta, turno });
  }

  @Get('agenda')
  @ApiOperation({ summary: 'Vista agenda agrupada por fecha' })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  vistaAgenda(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.agenda.ejecutar(desde, hasta);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen por etapa y próximos eventos' })
  async resumen() {
    const [resumen, proximos] = await Promise.all([
      this.eventosRepo.contarPorEtapa(),
      this.eventosRepo.proximos(5),
    ]);
    return {
      porEtapa: Object.fromEntries(
        resumen.map((r) => [r.etapa, r._count._all]),
      ),
      proximos: proximos.map(mapEventoResponse),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de evento' })
  async detalle(@Param('id') id: string) {
    const ev = await this.eventosRepo.obtenerPorId(id);
    if (!ev) throw new NotFoundException('Evento no encontrado');
    return mapEventoResponse(ev);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar notas/temática' })
  patch(@Param('id') id: string, @Body() dto: ActualizarEventoDto) {
    return this.actualizar.ejecutar(id, dto);
  }

  @Post(':id/confirmar')
  @ApiOperation({ summary: 'Confirmar evento' })
  confirmarEvento(@Param('id') id: string) {
    return this.confirmar.ejecutar(id);
  }

  @Post(':id/realizar')
  @ApiOperation({ summary: 'Marcar evento como realizado' })
  realizarEvento(@Param('id') id: string) {
    return this.realizar.ejecutar(id);
  }

  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar evento' })
  cancelarEvento(@Param('id') id: string, @Body() dto: CancelarEventoDto) {
    return this.cancelar.ejecutar(id, dto);
  }
}
