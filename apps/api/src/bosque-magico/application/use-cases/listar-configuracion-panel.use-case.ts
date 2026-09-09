import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { CLAVES_NUMERICAS_EDITABLES } from '../../domain/constants/configuracion-claves';
import { CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA } from '../../domain/constants/flujo-config';
import {
  CLAVE_PEDIDOS_NEGOCIACION_ASUNTO,
  CLAVE_PEDIDOS_NEGOCIACION_CUERPO,
  CLAVE_PEDIDOS_NOTIFICAR_NEGOCIACION,
  DEFAULT_NEGOCIACION_ASUNTO,
  DEFAULT_NEGOCIACION_CUERPO,
} from '../../domain/constants/pedidos-proveedor-config';

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
    await Promise.all([
      this.configuracion.crearSiNoExiste({
        clave: CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA,
        valor: true,
        descripcion:
          'Permitir volver a borrador una cotización aceptada (deshace el evento en agenda si aún está por confirmar).',
      }),
      this.configuracion.crearSiNoExiste({
        clave: 'pedidos_proveedor.cancelacion_asunto',
        valor: 'Evento cancelado — {{servicio}} ({{fecha}})',
        descripcion:
          'Asunto del correo de cancelación. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{servicio}}, {{motivo}}',
      }),
      this.configuracion.crearSiNoExiste({
        clave: 'pedidos_proveedor.cancelacion_cuerpo',
        valor:
          'Hola {{proveedor}},\n\nEl evento de Bosque Mágico para {{cliente}} el {{fecha}} ({{turno}}) fue cancelado.\n\nServicio: {{servicio}}\n{{motivo}}\n\nNo es necesario que asistas. Gracias.\nEquipo Bosque Mágico',
        descripcion:
          'Cuerpo del correo de cancelación. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{servicio}}, {{motivo}}',
      }),
      this.configuracion.crearSiNoExiste({
        clave: CLAVE_PEDIDOS_NOTIFICAR_NEGOCIACION,
        valor: true,
        descripcion:
          'Enviar correo de negociación al crear pedidos en Pendiente (al aceptar la cotización). El pedido no pasa a Solicitado.',
      }),
      this.configuracion.crearSiNoExiste({
        clave: CLAVE_PEDIDOS_NEGOCIACION_ASUNTO,
        valor: DEFAULT_NEGOCIACION_ASUNTO,
        descripcion:
          'Asunto del correo de negociación. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{edad}}, {{cantidadNinos}}, {{tematica}}, {{servicio}}, {{cantidad}}, {{costo}}, {{notas}}, {{link}}',
      }),
      this.configuracion.crearSiNoExiste({
        clave: CLAVE_PEDIDOS_NEGOCIACION_CUERPO,
        valor: DEFAULT_NEGOCIACION_CUERPO,
        descripcion:
          'Cuerpo del correo de negociación. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{edad}}, {{cantidadNinos}}, {{tematica}}, {{servicio}}, {{cantidad}}, {{costo}}, {{notas}}, {{link}}',
      }),
    ]);

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
    const flujo = items.filter((i) => i.clave.startsWith('flujo.'));
    const otras = items.filter(
      (i) =>
        typeof i.valor !== 'number' &&
        !i.clave.startsWith('turnos.') &&
        !i.clave.startsWith('cotizador.') &&
        !i.clave.startsWith('calendario.') &&
        !i.clave.startsWith('smtp.') &&
        !i.clave.startsWith('postventa.') &&
        !i.clave.startsWith('pedidos_proveedor.') &&
        !i.clave.startsWith('recordatorios.') &&
        !i.clave.startsWith('flujo.'),
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
      flujo,
      otras,
      todas: items,
      meta: {
        smtp: parseSmtpEstadoDesdeItems(smtp),
      },
    };
  }
}
