import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

@Injectable()
export class ListarConfiguracionPanelUseCase {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  async ejecutar() {
    const items = await this.configuracion.listarTodas();
    const numericas = items.filter((i) => typeof i.valor === 'number');
    const turnos = items.filter((i) => i.clave.startsWith('turnos.'));
    const cotizador = items.filter((i) => i.clave.startsWith('cotizador.'));
    const smtp = items.filter((i) => i.clave.startsWith('smtp.'));
    const otras = items.filter(
      (i) =>
        typeof i.valor !== 'number' &&
        !i.clave.startsWith('turnos.') &&
        !i.clave.startsWith('cotizador.') &&
        !i.clave.startsWith('smtp.'),
    );
    return { numericas, turnos, cotizador, smtp, otras, todas: items };
  }
}
