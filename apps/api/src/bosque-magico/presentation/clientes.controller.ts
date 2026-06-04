import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActualizarClienteDto } from '../application/dto/actualizar-cliente.dto';
import { ActualizarClienteUseCase } from '../application/use-cases/actualizar-cliente.use-case';
import { ListarClientesUseCase } from '../application/use-cases/listar-clientes.use-case';
import { ObtenerClienteUseCase } from '../application/use-cases/obtener-cliente.use-case';
import { ResolverIdentidadContactoUseCase } from '../application/use-cases/resolver-identidad-contacto.use-case';

@ApiTags('Panel - Clientes')
@Controller('bosque-magico/clientes')
export class ClientesController {
  constructor(
    private readonly listar: ListarClientesUseCase,
    private readonly obtener: ObtenerClienteUseCase,
    private readonly actualizar: ActualizarClienteUseCase,
    private readonly resolverIdentidad: ResolverIdentidadContactoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes con frecuencia de solicitudes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Buscar por nombre, celular o correo',
  })
  listarClientes(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.listar.ejecutar(page, pageSize, q);
  }

  @Get('identidad')
  @ApiOperation({
    summary: 'Resolver identidad (misma lógica que landing: celular/correo)',
  })
  @ApiQuery({ name: 'celular', required: true })
  @ApiQuery({ name: 'correo', required: false })
  resolver(
    @Query('celular') celular: string,
    @Query('correo') correo?: string,
  ) {
    return this.resolverIdentidad.ejecutar(celular, correo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cliente' })
  obtenerCliente(@Param('id') id: string) {
    return this.obtener.ejecutar(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos del cliente' })
  patchCliente(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.actualizar.ejecutar(id, dto);
  }
}
