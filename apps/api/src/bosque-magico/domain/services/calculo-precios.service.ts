import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import {
  esTarifaFinSemana,
  feriadosComoSet,
} from '../utils/tarifa-calendario';

export type TarifasNegocio = {
  baseLunesViernes: number;
  baseFinSemana: number;
  precioNinoExtra: number;
  maximoBase: number;
  maximoPermitido: number;
};

export type ItemCalculoInput = {
  cantidad: number;
  precioUnitario: number;
};

export type ResultadoCalculo = {
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  esFinSemana: boolean;
  advertencia?: string;
};

@Injectable()
export class CalculoPreciosService {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  async obtenerTarifas(): Promise<TarifasNegocio> {
    const items = await this.configuracion.listarPublicas();
    const map = new Map(items.map((i) => [i.clave, i.valor]));
    const num = (k: string, d: number) => {
      const v = map.get(k);
      return typeof v === 'number' && !Number.isNaN(v) ? v : d;
    };
    return {
      baseLunesViernes: num('tarifas.base_lunes_viernes', 380),
      baseFinSemana: num('tarifas.base_fin_semana', 580),
      precioNinoExtra: num('tarifas.precio_nino_extra', 25),
      maximoBase: num('ninos.maximo_base', 25),
      maximoPermitido: num('ninos.maximo_permitido', 35),
    };
  }

  isWeekend(fecha: Date): boolean {
    const day = fecha.getDay();
    return day === 0 || day === 6;
  }

  async obtenerFeriados(): Promise<Set<string>> {
    const item = await this.configuracion.obtenerPorClave('calendario.feriados');
    return feriadosComoSet(item?.valor);
  }

  esTarifaFinSemana(fecha: Date, feriados: ReadonlySet<string>): boolean {
    return esTarifaFinSemana(fecha, feriados);
  }

  async obtenerReglasPaquete(): Promise<{
    cajitasIncluidas: number;
    cajitasPrecioExcedente: number;
  }> {
    const items = await this.configuracion.listarPublicas();
    const map = new Map(items.map((i) => [i.clave, i.valor]));
    const num = (k: string, d: number) => {
      const v = map.get(k);
      return typeof v === 'number' && !Number.isNaN(v) ? v : d;
    };
    return {
      cajitasIncluidas: num('paquetes.cajitas_incluidas', 10),
      cajitasPrecioExcedente: num('paquetes.cajitas_precio_excedente', 20.9),
    };
  }

  calcular(
    tarifas: TarifasNegocio,
    fechaEvento: Date,
    cantidadNinos: number,
    items: ItemCalculoInput[],
    feriados: ReadonlySet<string> = new Set(),
    options?: { montoBasePaquete?: number },
  ): ResultadoCalculo {
    let advertencia: string | undefined;
    if (cantidadNinos > tarifas.maximoPermitido) {
      advertencia = `Más de ${tarifas.maximoPermitido} niños requiere aprobación manual.`;
    }
    const esFinSemana = esTarifaFinSemana(fechaEvento, feriados);
    const montoBase =
      options?.montoBasePaquete ??
      (esFinSemana ? tarifas.baseFinSemana : tarifas.baseLunesViernes);
    const ninosParaExtra = Math.min(cantidadNinos, tarifas.maximoPermitido);
    const extraCount = Math.max(ninosParaExtra - tarifas.maximoBase, 0);
    const montoNinosExtra = extraCount * tarifas.precioNinoExtra;
    const montoItems = items.reduce(
      (s, i) => s + i.cantidad * i.precioUnitario,
      0,
    );
    const montoTotal = montoBase + montoNinosExtra + montoItems;
    return {
      montoBase,
      montoNinosExtra,
      montoItems,
      montoTotal,
      esFinSemana,
      advertencia,
    };
  }
}
