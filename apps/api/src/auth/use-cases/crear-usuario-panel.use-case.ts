import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { PERMISOS_PANEL_COMPLETO } from '../constants/permisos';
import { mapUsuarioPanel } from '../mappers/usuario-panel.mapper';
import { UsuariosRepository } from '../infrastructure/usuarios.repository';

@Injectable()
export class CrearUsuarioPanelUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async ejecutar(dto: CrearUsuarioDto) {
    const email = dto.email.toLowerCase().trim();
    const existe = await this.usuarios.findByEmail(email);
    if (existe) {
      throw new BadRequestException('Ya existe un usuario con ese correo');
    }

    const permisos = this.normalizarPermisos(dto.permisos);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.usuarios.crear({
      email,
      nombre: dto.nombre.trim(),
      passwordHash,
      permisos,
    });
    return mapUsuarioPanel(usuario);
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
