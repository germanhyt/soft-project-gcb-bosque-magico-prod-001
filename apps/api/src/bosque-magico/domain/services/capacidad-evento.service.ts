import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import {
  CLAVE_NINOS_MAXIMO_PERMITIDO,
  CLAVE_NINOS_MINIMO,
  ninosMaximoDesdeConfig,
  ninosMinimoDesdeConfig,
  validarCapacidadEvento,
} from '../utils/capacidad-evento';

@Injectable()
export class CapacidadEventoService {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  async obtenerLimites(): Promise<{ minimo: number; maximo: number }> {
    const [minItem, maxItem] = await Promise.all([
      this.configuracion.obtenerPorClave(CLAVE_NINOS_MINIMO),
      this.configuracion.obtenerPorClave(CLAVE_NINOS_MAXIMO_PERMITIDO),
    ]);
    const minimo = ninosMinimoDesdeConfig(minItem?.valor);
    const maximoRaw = ninosMaximoDesdeConfig(maxItem?.valor);
    return { minimo, maximo: Math.max(maximoRaw, minimo) };
  }

  async validar(cantidad?: number | null): Promise<void> {
    const { minimo, maximo } = await this.obtenerLimites();
    validarCapacidadEvento(cantidad, minimo, maximo);
  }
}
