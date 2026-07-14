import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { ProcesarRecordatoriosEventoUseCase } from '../application/use-cases/procesar-recordatorios-evento.use-case';

@ApiTags('Panel - Jobs')
@Controller('bosque-magico/jobs')
export class JobsController {
  constructor(
    private readonly recordatorios: ProcesarRecordatoriosEventoUseCase,
  ) {}

  @AdminOnly()
  @Post('recordatorios-eventos')
  @ApiOperation({
    summary:
      'Ejecutar ahora el job de recordatorios de eventos (admin; útil para prueba)',
  })
  ejecutarRecordatorios() {
    return this.recordatorios.ejecutar();
  }
}
