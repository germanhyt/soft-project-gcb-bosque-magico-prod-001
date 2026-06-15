import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActualizarTareaEventoDto } from '../application/dto/actualizar-tarea-evento.dto';
import { CrearTareaEventoDto } from '../application/dto/crear-tarea-evento.dto';
import { ActualizarTareaEventoUseCase } from '../application/use-cases/actualizar-tarea-evento.use-case';
import { CrearTareaEventoUseCase } from '../application/use-cases/crear-tarea-evento.use-case';
import { GenerarTareasEventoUseCase } from '../application/use-cases/generar-tareas-evento.use-case';
import { ListarTareasEventoUseCase } from '../application/use-cases/listar-tareas-evento.use-case';

@ApiTags('Panel - Checklist operativo')
@Controller('bosque-magico')
export class TareasEventoController {
  constructor(
    private readonly listar: ListarTareasEventoUseCase,
    private readonly crear: CrearTareaEventoUseCase,
    private readonly actualizar: ActualizarTareaEventoUseCase,
    private readonly generar: GenerarTareasEventoUseCase,
  ) {}

  @Get('eventos/:eventoId/tareas')
  @ApiOperation({ summary: 'Listar tareas de un evento' })
  listarPorEvento(@Param('eventoId') eventoId: string) {
    return this.listar.ejecutar(eventoId);
  }

  @Post('eventos/:eventoId/tareas')
  @ApiOperation({ summary: 'Crear tarea manual' })
  crearTarea(@Param('eventoId') eventoId: string, @Body() dto: CrearTareaEventoDto) {
    return this.crear.ejecutar(eventoId, dto);
  }

  @Post('eventos/:eventoId/tareas/generar')
  @ApiOperation({ summary: 'Generar checklist por defecto' })
  generarTareas(@Param('eventoId') eventoId: string) {
    return this.generar.ejecutar(eventoId);
  }

  @Patch('tareas/:id')
  @ApiOperation({ summary: 'Actualizar tarea' })
  patch(@Param('id') id: string, @Body() dto: ActualizarTareaEventoDto) {
    return this.actualizar.ejecutar(id, dto);
  }
}
