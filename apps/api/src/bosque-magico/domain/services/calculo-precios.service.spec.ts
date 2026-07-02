import {
  CalculoPreciosService,
  TarifasNegocio,
} from './calculo-precios.service';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

/** Fechas en hora local para evitar desfases con ISO UTC en CI. */
const fechaLocal = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const TARIFAS: TarifasNegocio = {
  baseLunesViernes: 799,
  baseFinSemana: 950,
  maximoBase: 20,
  maximoPermitido: 30,
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
      expect(r.montoBase).toBe(799);
      expect(r.montoNinosExtra).toBe(0);
      expect(r.montoTotal).toBe(799);
    });

    it('aplica tarifa base fin de semana', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 6), 20, []);
      expect(r.esFinSemana).toBe(true);
      expect(r.montoBase).toBe(950);
      expect(r.montoTotal).toBe(950);
    });

    it('interpreta fecha ISO YYYY-MM-DD como día calendario (no UTC)', () => {
      const r = service.calcular(TARIFAS, new Date('2026-07-11'), 20, []);
      expect(r.esFinSemana).toBe(true);
      expect(r.montoBase).toBe(950);
    });

    it('aplica tarifa fin de semana en feriado configurado', () => {
      const feriados = new Set(['2026-07-28']);
      const r = service.calcular(TARIFAS, fechaLocal(2026, 7, 28), 20, [], feriados);
      expect(r.esFinSemana).toBe(true);
      expect(r.montoBase).toBe(950);
    });

    it('no cobra niños extra globales (reglas por show/servicio)', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 30, []);
      expect(r.montoNinosExtra).toBe(0);
      expect(r.montoTotal).toBe(799);
    });

    it('advierte cuando hay más de 30 niños', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 40, []);
      expect(r.advertencia).toContain('30');
      expect(r.montoNinosExtra).toBe(0);
    });

    it('acepta montoNinosExtra externo (cargos de capacidad)', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 25, [], new Set(), {
        montoNinosExtra: 75,
      });
      expect(r.montoNinosExtra).toBe(75);
      expect(r.montoTotal).toBe(874);
    });

    it('suma ítems adicionales al total', () => {
      const r = service.calcular(TARIFAS, fechaLocal(2026, 6, 4), 20, [
        { cantidad: 2, precioUnitario: 50 },
        { cantidad: 1, precioUnitario: 80 },
      ]);
      expect(r.montoItems).toBe(180);
      expect(r.montoTotal).toBe(979);
    });
  });

  describe('obtenerTarifas', () => {
    it('lee valores numéricos de configuración con respaldo por defecto', async () => {
      configuracion.listarPublicas = jest.fn().mockResolvedValue([
        { clave: 'tarifas.base_lunes_viernes', valor: 400 },
        { clave: 'tarifas.base_fin_semana', valor: 600 },
        { clave: 'ninos.maximo_base', valor: 20 },
        { clave: 'ninos.maximo_permitido', valor: 30 },
      ]);

      const tarifas = await service.obtenerTarifas();
      expect(tarifas).toEqual({
        baseLunesViernes: 400,
        baseFinSemana: 600,
        maximoBase: 20,
        maximoPermitido: 30,
      });
    });
  });

  describe('obtenerReglasCapacidad', () => {
    it('lee reglas de show y extras desde configuración pública', async () => {
      configuracion.listarPublicas = jest.fn().mockResolvedValue([
        { clave: 'shows.ninos_incluidos', valor: 20 },
        { clave: 'shows.precio_nino_extra', valor: 15 },
        { clave: 'extras.precio_nino_extra', valor: 10 },
      ]);

      const reglas = await service.obtenerReglasCapacidad();
      expect(reglas).toEqual({
        ninosIncluidosShow: 20,
        precioNinoExtraShow: 15,
        precioNinoExtraServicio: 10,
      });
    });
  });

  describe('obtenerReglasPaquete', () => {
    it('lee reglas de paquete desde configuración pública', async () => {
      configuracion.listarPublicas = jest.fn().mockResolvedValue([
        { clave: 'paquetes.cajitas_incluidas', valor: 12 },
        { clave: 'paquetes.cajitas_precio_excedente', valor: 25.5 },
        { clave: 'paquetes.snack_premium_unidades_incluidas', valor: 30 },
        { clave: 'paquetes.snack_premium_precio_excedente', valor: 12 },
      ]);

      const reglas = await service.obtenerReglasPaquete();
      expect(reglas).toEqual({
        cajitasIncluidas: 12,
        cajitasPrecioExcedente: 25.5,
        snackPremiumUnidadesIncluidas: 30,
        snackPremiumPrecioExcedente: 12,
      });
    });
  });
});
