import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

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

  calcular(
    tarifas: TarifasNegocio,
    fechaEvento: Date,
    cantidadNinos: number,
    items: ItemCalculoInput[],
  ): ResultadoCalculo {
    let advertencia: string | undefined;
    if (cantidadNinos > tarifas.maximoPermitido) {
      advertencia = `Más de ${tarifas.maximoPermitido} niños requiere aprobación manual.`;
    }
    const esFinSemana = this.isWeekend(fechaEvento);
    const montoBase = esFinSemana
      ? tarifas.baseFinSemana
      : tarifas.baseLunesViernes;
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
