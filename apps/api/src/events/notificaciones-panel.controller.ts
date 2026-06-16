import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { PanelNotificacionesRepository } from './panel-notificaciones.repository';

@ApiTags('Panel - Notificaciones')
@Controller('bosque-magico/notificaciones')
export class NotificacionesPanelController {
  constructor(private readonly notificaciones: PanelNotificacionesRepository) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario (persistidas)' })
  listar(@CurrentUser() user?: JwtPayload) {
    const usuarioId = user?.sub;
    if (!usuarioId) return [];
    return this.notificaciones.listarParaUsuario(usuarioId);
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  async marcarLeida(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    if (!user?.sub) return { ok: true };
    await this.notificaciones.marcarLeida(id, user.sub);
    return { ok: true };
  }

  @Post('marcar-leidas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones visibles como leídas' })
  async marcarTodasLeidas(@CurrentUser() user?: JwtPayload) {
    if (!user?.sub) return { ok: true };
    await this.notificaciones.marcarTodasLeidas(user.sub);
    return { ok: true };
  }

  @Post('ocultar-todas')
  @ApiOperation({ summary: 'Ocultar todas las notificaciones del usuario (limpiar bandeja)' })
  async ocultarTodas(@CurrentUser() user?: JwtPayload) {
    if (!user?.sub) return { ok: true };
    await this.notificaciones.ocultarTodas(user.sub);
    return { ok: true };
  }
}
