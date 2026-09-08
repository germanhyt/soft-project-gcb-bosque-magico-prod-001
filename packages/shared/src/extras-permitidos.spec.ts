/// <reference types="vitest/globals" />
import {
  CONTRATO_EXTRAS_PERMITIDOS,
  CONTRATO_EXTRAS_PERMITIDOS_INTRO,
  esProductoExtraPermitido,
  extrasPermitidosParaImpresion,
  nombresExtrasPermitidosDesdeCatalogo,
  nombresIgualesExtraPermitido,
  normalizarExtrasPermitidos,
  parseExtrasPermitidosJson,
} from './index';

describe('extras permitidos (shared)', () => {
  describe('esProductoExtraPermitido', () => {
    it('reconoce el flag aunque el código no sea semilla', () => {
      expect(
        esProductoExtraPermitido({ extraPermitido: true, codigo: 'EXT-OTRO' }),
      ).toBe(true);
    });

    it('reconoce Piñata y Torta por código si la API omite el flag', () => {
      expect(esProductoExtraPermitido({ codigo: 'EXT-PINATA' })).toBe(true);
      expect(esProductoExtraPermitido({ codigo: 'ext-torta' })).toBe(true);
    });

    it('no trata un extra cobrable como permitido', () => {
      expect(
        esProductoExtraPermitido({
          extraPermitido: false,
          codigo: 'EXT-PINTA',
        }),
      ).toBe(false);
    });
  });

  describe('nombresIgualesExtraPermitido', () => {
    it('compara sin importar mayúsculas ni espacios', () => {
      expect(nombresIgualesExtraPermitido('  Piñata ', 'piñata')).toBe(true);
      expect(nombresIgualesExtraPermitido('Torta temática', 'Globo')).toBe(false);
    });
  });

  describe('normalizarExtrasPermitidos', () => {
    it('recorta, colapsa espacios y elimina duplicados', () => {
      expect(
        normalizarExtrasPermitidos(['  Piñata  ', 'piñata', 'Torta   temática']),
      ).toEqual(['Piñata', 'Torta temática']);
    });

    it('omite vacíos y limita a 20 ítems', () => {
      const lista = Array.from({ length: 25 }, (_, i) => `Extra ${i + 1}`);
      expect(normalizarExtrasPermitidos(['', '  ', ...lista])).toHaveLength(20);
    });
  });

  describe('nombresExtrasPermitidosDesdeCatalogo', () => {
    it('usa productos permitidos activos del catálogo', () => {
      expect(
        nombresExtrasPermitidosDesdeCatalogo([
          { nombre: 'Piñata', extraPermitido: true, etapa: 'activo' },
          { nombre: 'Globo', extraPermitido: true, etapa: 'inactivo' },
          { nombre: 'Pintacaritas', extraPermitido: false, etapa: 'activo' },
        ]),
      ).toEqual(['Piñata']);
    });

    it('cae a Piñata y Torta si el catálogo no trae permitidos', () => {
      expect(
        nombresExtrasPermitidosDesdeCatalogo([
          { nombre: 'Pintacaritas', codigo: 'EXT-PINTA', etapa: 'activo' },
        ]),
      ).toEqual([...CONTRATO_EXTRAS_PERMITIDOS]);
    });

    it('reconoce semilla por código aunque extraPermitido venga undefined', () => {
      expect(
        nombresExtrasPermitidosDesdeCatalogo([
          { nombre: 'Piñata', codigo: 'EXT-PINATA', etapa: 'activo' },
          { nombre: 'Torta temática', codigo: 'EXT-TORTA', etapa: 'activo' },
        ]),
      ).toEqual(['Piñata', 'Torta temática']);
    });
  });

  describe('extrasPermitidosParaImpresion', () => {
    it('usa defaults en contratos antiguos (null o undefined)', () => {
      expect(extrasPermitidosParaImpresion(null)).toEqual([
        ...CONTRATO_EXTRAS_PERMITIDOS,
      ]);
      expect(extrasPermitidosParaImpresion(undefined)).toEqual([
        ...CONTRATO_EXTRAS_PERMITIDOS,
      ]);
    });

    it('respeta lista vacía: ninguno acordado', () => {
      expect(extrasPermitidosParaImpresion([])).toEqual([]);
    });

    it('imprime exactamente lo acordado en la cotización', () => {
      expect(extrasPermitidosParaImpresion(['Globo gigante'])).toEqual([
        'Globo gigante',
      ]);
    });
  });

  describe('parseExtrasPermitidosJson', () => {
    it('devuelve null si no hay snapshot persistido', () => {
      expect(parseExtrasPermitidosJson(null)).toBeNull();
      expect(parseExtrasPermitidosJson(undefined)).toBeNull();
      expect(parseExtrasPermitidosJson({ foo: 1 })).toBeNull();
    });

    it('normaliza un array JSON válido', () => {
      expect(parseExtrasPermitidosJson(['  Piñata ', 1, 'Piñata'])).toEqual([
        'Piñata',
      ]);
    });
  });

  describe('texto formal del contrato', () => {
    it('no usa el copy informal de cobro automático', () => {
      expect(CONTRATO_EXTRAS_PERMITIDOS_INTRO).not.toMatch(/cobro automático/i);
      expect(CONTRATO_EXTRAS_PERMITIDOS_INTRO).not.toMatch(/el cliente puede traerlos/i);
      expect(CONTRATO_EXTRAS_PERMITIDOS_INTRO).toMatch(/autoriza/i);
      expect(CONTRATO_EXTRAS_PERMITIDOS_INTRO).toMatch(
        /sin que ello genere un cargo adicional/i,
      );
    });
  });
});
