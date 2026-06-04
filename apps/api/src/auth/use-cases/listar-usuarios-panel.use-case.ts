import { Injectable } from '@nestjs/common';
import { mapUsuarioPanel } from '../mappers/usuario-panel.mapper';
import { UsuariosRepository } from '../infrastructure/usuarios.repository';

@Injectable()
export class ListarUsuariosPanelUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async ejecutar() {
    const lista = await this.usuarios.listarPanel();
    return lista.map(mapUsuarioPanel);
  }
}
