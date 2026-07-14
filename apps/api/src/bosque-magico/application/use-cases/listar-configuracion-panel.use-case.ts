import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { CLAVES_NUMERICAS_EDITABLES } from '../../domain/constants/configuracion-claves';

export type SmtpEstadoMeta = {
  habilitado: boolean;
  activo: boolean;
};

function parseSmtpEstadoDesdeItems(
  smtp: Array<{ clave: string; valor: unknown }>,
): SmtpEstadoMeta {
  const map = new Map(smtp.map((i) => [i.clave, i.valor]));
  const habilitado = map.get('smtp.habilitado') === true;
  const hostRaw = map.get('smtp.host');
  const host = typeof hostRaw === 'string' ? hostRaw.trim() : '';
  return { habilitado, activo: habilitado && host.length > 0 };
}

@Injectable()
export class ListarConfiguracionPanelUseCase {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  async ejecutar() {
    const items = await this.configuracion.listarTodas();
    const numericas = items.filter(
      (i) =>
        typeof i.valor === 'number' &&
        !i.clave.startsWith('smtp.') &&
        !i.clave.startsWith('recordatorios.') &&
        CLAVES_NUMERICAS_EDITABLES.has(i.clave),
    );
    const turnos = items.filter((i) => i.clave.startsWith('turnos.'));
    const cotizador = items.filter((i) => i.clave.startsWith('cotizador.'));
    const calendario = items.filter((i) => i.clave.startsWith('calendario.'));
    const smtp = items.filter((i) => i.clave.startsWith('smtp.'));
    const postventa = items.filter((i) => i.clave.startsWith('postventa.'));
    const pedidosProveedor = items.filter((i) =>
      i.clave.startsWith('pedidos_proveedor.'),
    );
    const recordatorios = items.filter((i) =>
      i.clave.startsWith('recordatorios.'),
    );
    const otras = items.filter(
      (i) =>
        typeof i.valor !== 'number' &&
        !i.clave.startsWith('turnos.') &&
        !i.clave.startsWith('cotizador.') &&
        !i.clave.startsWith('calendario.') &&
        !i.clave.startsWith('smtp.') &&
        !i.clave.startsWith('postventa.') &&
        !i.clave.startsWith('pedidos_proveedor.') &&
        !i.clave.startsWith('recordatorios.'),
    );
    return {
      numericas,
      turnos,
      cotizador,
      calendario,
      smtp,
      postventa,
      pedidosProveedor,
      recordatorios,
      otras,
      todas: items,
      meta: {
        smtp: parseSmtpEstadoDesdeItems(smtp),
      },
    };
  }
}
