import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActualizarPedidoDto } from '../application/dto/actualizar-pedido.dto';
import { CrearPedidoDto } from '../application/dto/crear-pedido.dto';
import { ActualizarPedidoUseCase } from '../application/use-cases/actualizar-pedido.use-case';
import { CrearPedidoUseCase } from '../application/use-cases/crear-pedido.use-case';
import { GenerarPedidosEventoUseCase } from '../application/use-cases/generar-pedidos-evento.use-case';
import { ListarPedidosEventoUseCase } from '../application/use-cases/listar-pedidos-evento.use-case';
import { ListarPedidosOperacionesUseCase } from '../application/use-cases/listar-pedidos-operaciones.use-case';

@ApiTags('Panel - Pedidos operativos')
@Controller('bosque-magico')
export class PedidosController {
  constructor(
    private readonly listar: ListarPedidosEventoUseCase,
    private readonly listarOps: ListarPedidosOperacionesUseCase,
    private readonly crear: CrearPedidoUseCase,
    private readonly actualizar: ActualizarPedidoUseCase,
    private readonly generar: GenerarPedidosEventoUseCase,
  ) {}

  @Get('pedidos')
  @ApiOperation({ summary: 'Pedidos operativos pendientes por rango de fechas' })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  listarOperaciones(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.listarOps.ejecutar(desde, hasta);
  }

  @Get('eventos/:eventoId/pedidos')
  @ApiOperation({ summary: 'Listar pedidos de un evento' })
  listarPorEvento(@Param('eventoId') eventoId: string) {
    return this.listar.ejecutar(eventoId);
  }

  @Post('eventos/:eventoId/pedidos')
  @ApiOperation({ summary: 'Crear pedido manual para un evento' })
  crearPedido(@Param('eventoId') eventoId: string, @Body() dto: CrearPedidoDto) {
    return this.crear.ejecutar(eventoId, dto);
  }

  @Post('eventos/:eventoId/pedidos/generar')
  @ApiOperation({
    summary: 'Generar pedidos desde ítems de cotización (proveedor)',
  })
  generarPedidos(@Param('eventoId') eventoId: string) {
    return this.generar.ejecutar(eventoId);
  }

  @Patch('pedidos/:id')
  @ApiOperation({ summary: 'Actualizar pedido (estado, costo, notas)' })
  patch(@Param('id') id: string, @Body() dto: ActualizarPedidoDto) {
    return this.actualizar.ejecutar(id, dto);
  }
}
