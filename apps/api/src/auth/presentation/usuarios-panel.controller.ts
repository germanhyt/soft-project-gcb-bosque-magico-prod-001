import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PERMISO_ADMIN } from '../constants/permisos';
import type { JwtPayload } from '../types/jwt-payload';
import { ActualizarUsuarioPanelUseCase } from '../use-cases/actualizar-usuario-panel.use-case';
import { CrearUsuarioPanelUseCase } from '../use-cases/crear-usuario-panel.use-case';
import { ListarUsuariosPanelUseCase } from '../use-cases/listar-usuarios-panel.use-case';

@ApiTags('Panel - Usuarios')
@RequirePermissions(PERMISO_ADMIN)
@Controller('bosque-magico/usuarios')
export class UsuariosPanelController {
  constructor(
    private readonly listar: ListarUsuariosPanelUseCase,
    private readonly crear: CrearUsuarioPanelUseCase,
    private readonly actualizar: ActualizarUsuarioPanelUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del panel (solo admin)' })
  listarUsuarios() {
    return this.listar.ejecutar();
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario del panel' })
  crearUsuario(@Body() dto: CrearUsuarioDto) {
    return this.crear.ejecutar(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario (permisos, activo, contraseña)',
  })
  patch(
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.actualizar.ejecutar(id, dto, user.sub);
  }
}
