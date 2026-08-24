import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { esTarifaFinSemana, feriadosComoSet } from '../utils/tarifa-calendario';

export type TarifasNegocio = {
  baseLunesViernes: number;
  baseFinSemana: number;
  maximoBase: number;
  maximoPermitido: number;
};

export type ReglasCapacidadNegocio = {
  /** Niños incluidos en el paquete sin cargo (capacidad del local, no del show). */
  ninosIncluidos: number;
  /** Costo por niño adicional fuera del rango incluido. */
  precioNinoExtra: number;
};

export type TarifasHoraExtraEspacio = {
  lunesViernes: number;
  finSemana: number;
};

export type TarifasExtrasInstitucionales = {
  salitaLounge: number;
  ingresoShowExterno: number;
  ingresoDecoracionExterno: number;
  ingresoCarritoSnackExterno: number;
  decoracionPersonalizada: number;
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
      baseLunesViernes: num('tarifas.base_lunes_viernes', 799),
      baseFinSemana: num('tarifas.base_fin_semana', 950),
      maximoBase: num('ninos.maximo_base', 20),
      maximoPermitido: num('ninos.maximo_permitido', 30),
    };
  }

  async obtenerReglasCapacidad(): Promise<ReglasCapacidadNegocio> {
    const items = await this.configuracion.listarPublicas();
    const map = new Map(items.map((i) => [i.clave, i.valor]));
    const num = (k: string, d: number) => {
      const v = map.get(k);
      return typeof v === 'number' && !Number.isNaN(v) ? v : d;
    };
    const ninosIncluidos = num('shows.ninos_incluidos', 25);
    return {
      ninosIncluidos,
      precioNinoExtra: num('shows.precio_nino_extra', 25),
    };
  }

  isWeekend(fecha: Date): boolean {
    const day = fecha.getDay();
    return day === 0 || day === 6;
  }

  async obtenerFeriados(): Promise<Set<string>> {
    const item = await this.configuracion.obtenerPorClave(
      'calendario.feriados',
    );
    return feriadosComoSet(item?.valor);
  }

  esTarifaFinSemana(fecha: Date, feriados: ReadonlySet<string>): boolean {
    return esTarifaFinSemana(fecha, feriados);
  }

  async obtenerReglasPaquete(): Promise<{
    cajitasIncluidas: number;
    cajitasPrecioExcedente: number;
    snackPremiumUnidadesIncluidas: number;
    snackPremiumPrecioExcedente: number;
    piqueosCreditoPremium: number;
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
      snackPremiumUnidadesIncluidas: num(
        'paquetes.snack_premium_unidades_incluidas',
        25,
      ),
      snackPremiumPrecioExcedente: num(
        'paquetes.snack_premium_precio_excedente',
        10,
      ),
      piqueosCreditoPremium: num('paquetes.piqueos_credito_premium', 200),
    };
  }

  async obtenerTarifasHoraExtraEspacio(): Promise<TarifasHoraExtraEspacio> {
    const items = await this.configuracion.listarPublicas();
    const map = new Map(items.map((i) => [i.clave, i.valor]));
    const num = (k: string, d: number) => {
      const v = map.get(k);
      return typeof v === 'number' && !Number.isNaN(v) ? v : d;
    };
    return {
      lunesViernes: num('espacio.hora_extra_lunes_viernes', 150),
      finSemana: num('espacio.hora_extra_fin_semana', 200),
    };
  }

  async obtenerTarifasExtrasInstitucionales(): Promise<TarifasExtrasInstitucionales> {
    const items = await this.configuracion.listarPublicas();
    const map = new Map(items.map((i) => [i.clave, i.valor]));
    const num = (k: string, d: number) => {
      const v = map.get(k);
      return typeof v === 'number' && !Number.isNaN(v) ? v : d;
    };
    return {
      salitaLounge: num('extras.salita_lounge', 50),
      ingresoShowExterno: num('extras.ingreso_show_externo', 300),
      ingresoDecoracionExterno: num('extras.ingreso_decoracion_externo', 100),
      ingresoCarritoSnackExterno: num(
        'extras.ingreso_carrito_snack_externo',
        300,
      ),
      decoracionPersonalizada: num('extras.decoracion_personalizada', 100),
    };
  }

  calcular(
    tarifas: TarifasNegocio,
    fechaEvento: Date,
    cantidadNinos: number,
    items: ItemCalculoInput[],
    feriados: ReadonlySet<string> = new Set(),
    options?: { montoBasePaquete?: number; montoNinosExtra?: number },
  ): ResultadoCalculo {
    let advertencia: string | undefined;
    if (cantidadNinos > tarifas.maximoPermitido) {
      advertencia = `Más de ${tarifas.maximoPermitido} niños requiere aprobación manual.`;
    }
    const esFinSemana = esTarifaFinSemana(fechaEvento, feriados);
    const montoBase =
      options?.montoBasePaquete ??
      (esFinSemana ? tarifas.baseFinSemana : tarifas.baseLunesViernes);
    const montoNinosExtra = options?.montoNinosExtra ?? 0;
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
