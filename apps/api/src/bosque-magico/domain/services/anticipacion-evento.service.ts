import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import {
  CLAVE_MIN_DIAS_ANTICIPACION,
  minDiasAnticipacionDesdeConfig,
  validarAnticipacionEvento,
} from '../utils/anticipacion-evento';

@Injectable()
export class AnticipacionEventoService {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  async obtenerMinDias(): Promise<number> {
    const item = await this.configuracion.obtenerPorClave(
      CLAVE_MIN_DIAS_ANTICIPACION,
    );
    return minDiasAnticipacionDesdeConfig(item?.valor);
  }

  async validar(fechaInput: string | Date): Promise<void> {
    const minDias = await this.obtenerMinDias();
    validarAnticipacionEvento(fechaInput, minDias);
  }
}
