import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { PERMISOS_PANEL_COMPLETO } from '../constants/permisos';
import { mapUsuarioPanel } from '../mappers/usuario-panel.mapper';
import { UsuariosRepository } from '../infrastructure/usuarios.repository';

@Injectable()
export class ActualizarUsuarioPanelUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async ejecutar(id: string, dto: ActualizarUsuarioDto, actorId?: string) {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (actorId === id && dto.activo === false) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }

    const data: Parameters<UsuariosRepository['actualizar']>[1] = {};

    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.permisos !== undefined) {
      data.permisos = this.normalizarPermisos(dto.permisos);
    }
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Sin cambios para aplicar');
    }

    const actualizado = await this.usuarios.actualizar(id, data);
    return mapUsuarioPanel(actualizado);
  }

  private normalizarPermisos(permisos: string[]) {
    const validos = new Set<string>(PERMISOS_PANEL_COMPLETO);
    const filtrados = permisos.filter((p) => validos.has(p));
    if (filtrados.length === 0) {
      throw new BadRequestException('Debe asignar al menos un permiso válido');
    }
    return filtrados;
  }
}
