import { Injectable } from '@nestjs/common';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import {
  identidadCoincide,
  normalizarCelular,
  normalizarCorreo,
} from '../utils/identidad-contacto';

export type ResumenIdentidad = {
  celularNormalizado: string;
  correoNormalizado: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  totalSolicitudes: number;
  solicitudesRecientes24h: boolean;
  primeraSolicitudEn: Date | null;
  ultimaSolicitudEn: Date | null;
};

@Injectable()
export class IdentidadContactoService {
  constructor(
    private readonly clientes: ClientesRepository,
    private readonly solicitudes: SolicitudesRepository,
  ) {}

  async resolver(
    celular: string,
    correo?: string | null,
  ): Promise<ResumenIdentidad> {
    const celularNormalizado = normalizarCelular(celular);
    const correoNormalizado = normalizarCorreo(correo);

    const cliente =
      (await this.clientes.buscarPorCelular(celular)) ??
      (correoNormalizado
        ? await this.clientes.buscarPorCorreo(correoNormalizado)
        : null);

    const stats = await this.solicitudes.estadisticasPorIdentidad(
      celular,
      correo ?? undefined,
    );
    const duplicadoReciente = await this.solicitudes.existeDuplicadoReciente(
      celular,
      correo ?? undefined,
    );

    return {
      celularNormalizado,
      correoNormalizado,
      clienteId: cliente?.id ?? null,
      clienteNombre: cliente?.nombreCompleto ?? null,
      totalSolicitudes: stats.total,
      solicitudesRecientes24h: !!duplicadoReciente,
      primeraSolicitudEn: stats.primeraEn,
      ultimaSolicitudEn: stats.ultimaEn,
    };
  }

  async vincularClienteConSolicitud(solicitud: {
    nombreContacto: string;
    celular: string;
    correo?: string | null;
  }) {
    let cliente = await this.clientes.buscarPorCelular(solicitud.celular);
    if (!cliente && solicitud.correo) {
      cliente = await this.clientes.buscarPorCorreo(solicitud.correo);
    }
    if (cliente) {
      return this.clientes.actualizar(cliente.id, {
        nombreCompleto: solicitud.nombreContacto,
        correo: solicitud.correo ?? cliente.correo,
      });
    }
    return this.clientes.crear({
      nombreCompleto: solicitud.nombreContacto,
      celular: solicitud.celular,
      correo: solicitud.correo ?? undefined,
    });
  }

  mismaIdentidad(
    a: { celular: string; correo?: string | null },
    b: { celular: string; correo?: string | null },
  ) {
    return identidadCoincide(a, b);
  }
}
