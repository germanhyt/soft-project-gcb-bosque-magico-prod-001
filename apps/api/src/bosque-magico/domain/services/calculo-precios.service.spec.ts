import {
  CalculoPreciosService,
  TarifasNegocio,
} from './calculo-precios.service';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

/** Fechas en hora local para evitar desfases con ISO UTC en CI. */
const fechaLocal = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const TARIFAS: TarifasNegocio = {
  baseLunesViernes: 380,
  baseFinSemana: 580,
  precioNinoExtra: 25,
  maximoBase: 25,
  maximoPermitido: 35,
};

describe('CalculoPreciosService', () => {
  let service: CalculoPreciosService;
  const configuracion = {
    listarPublicas: jest.fn(),
  } as unknown as ConfiguracionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CalculoPreciosService(configuracion);
  });

  describe('isWeekend', () => {
    it('marca sábado y domingo como fin de semana', () => {
      expect(service.isWeekend(fechaLocal(2026, 6, 6))).toBe(true);
      expect(service.isWeekend(fechaLocal(2026, 6, 7))).toBe(true);
    });

    it('marca lunes a viernes como día hábil', () => {
      expect(service.isWeekend(fechaLocal(2026, 6, 4))).toBe(false);
    });
  });

  describe('calcular', () => {
    it('aplica tarifa base lunes a viernes', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 20, []);
      expect(r.esFinSemana).toBe(false);
      expect(r.montoBase).toBe(380);
      expect(r.montoNinosExtra).toBe(0);
      expect(r.montoTotal).toBe(380);
    });

    it('aplica tarifa base fin de semana', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 6), 20, []);
      expect(r.esFinSemana).toBe(true);
      expect(r.montoBase).toBe(580);
      expect(r.montoTotal).toBe(580);
    });

    it('cobra niños extra por encima del máximo base', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 30, []);
      expect(r.montoNinosExtra).toBe(125);
      expect(r.montoTotal).toBe(505);
    });

    it('advierte y limita el cálculo de extras cuando hay más de 35 niños', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 40, []);
      expect(r.advertencia).toContain('35');
      expect(r.montoNinosExtra).toBe(250);
      expect(r.montoTotal).toBe(630);
    });

    it('suma ítems adicionales al total', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 20, [
        { cantidad: 2, precioUnitario: 50 },
        { cantidad: 1, precioUnitario: 80 },
      ]);
      expect(r.montoItems).toBe(180);
      expect(r.montoTotal).toBe(560);
    });
  });

  describe('obtenerTarifas', () => {
    it('lee valores numéricos de configuración con respaldo por defecto', async () => {
      configuracion.listarPublicas = jest.fn().mockResolvedValue([
        { clave: 'tarifas.base_lunes_viernes', valor: 400 },
        { clave: 'tarifas.base_fin_semana', valor: 600 },
        { clave: 'tarifas.precio_nino_extra', valor: 30 },
        { clave: 'ninos.maximo_base', valor: 25 },
        { clave: 'ninos.maximo_permitido', valor: 35 },
      ]);

      const tarifas = await service.obtenerTarifas();
      expect(tarifas).toEqual({
        baseLunesViernes: 400,
        baseFinSemana: 600,
        precioNinoExtra: 30,
        maximoBase: 25,
        maximoPermitido: 35,
      });
    });
  });
});
