import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListarAuditoriaUseCase } from '../application/use-cases/listar-auditoria.use-case';

@ApiTags('Panel - Auditoría (gentle-ai)')
@Controller('bosque-magico/auditoria')
export class AuditoriaController {
  constructor(private readonly listarAuditoria: ListarAuditoriaUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Bitácora por entidad (trazabilidad)' })
  @ApiQuery({ name: 'tipoEntidad', required: true, example: 'solicitud' })
  @ApiQuery({ name: 'entidadId', required: true })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  listarPorEntidad(
    @Query('tipoEntidad') tipoEntidad: string,
    @Query('entidadId') entidadId: string,
    @Query('limite') limite?: string,
  ) {
    const n = limite ? Number(limite) : undefined;
    return this.listarAuditoria.ejecutar(
      tipoEntidad,
      entidadId,
      Number.isFinite(n) ? n : undefined,
    );
  }
}
