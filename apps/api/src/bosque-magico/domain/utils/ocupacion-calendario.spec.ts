import { EtapaCotizacion } from '@prisma/client';
import {
  cotizacionVisibleEnCalendario,
  fusionarAgendaPorFecha,
} from './ocupacion-calendario';

describe('cotizacionVisibleEnCalendario', () => {
  it('muestra borrador y enviada para anticipar cruces antes de aceptar', () => {
    expect(cotizacionVisibleEnCalendario(EtapaCotizacion.borrador)).toBe(true);
    expect(cotizacionVisibleEnCalendario(EtapaCotizacion.enviada)).toBe(true);
  });

  it('omite aceptada, porque ya ocupa el calendario como evento', () => {
    expect(cotizacionVisibleEnCalendario(EtapaCotizacion.aceptada)).toBe(false);
  });

  it('omite cerrada', () => {
    expect(cotizacionVisibleEnCalendario(EtapaCotizacion.cerrada)).toBe(false);
  });
});

describe('fusionarAgendaPorFecha', () => {
  it('junta el evento y el borrador del mismo día', () => {
    const agenda = fusionarAgendaPorFecha(
      [{ fecha: '2026-11-16', item: { id: 'ev-1' } }],
      [{ fecha: '2026-11-16', item: { id: 'cot-1', etapa: 'borrador' } }],
    );

    expect(agenda).toEqual([
      {
        fecha: '2026-11-16',
        eventos: [{ id: 'ev-1' }],
        cotizaciones: [{ id: 'cot-1', etapa: 'borrador' }],
      },
    ]);
  });

  it('conserva un día que solo tiene cotización en curso', () => {
    const agenda = fusionarAgendaPorFecha(
      [],
      [{ fecha: '2026-11-20', item: { id: 'cot-2', etapa: 'enviada' } }],
    );

    expect(agenda).toEqual([
      {
        fecha: '2026-11-20',
        eventos: [],
        cotizaciones: [{ id: 'cot-2', etapa: 'enviada' }],
      },
    ]);
  });

  it('ordena los días', () => {
    const agenda = fusionarAgendaPorFecha(
      [{ fecha: '2026-11-18', item: { id: 'ev-2' } }],
      [{ fecha: '2026-11-02', item: { id: 'cot-3' } }],
    );

    expect(agenda.map((d) => d.fecha)).toEqual(['2026-11-02', '2026-11-18']);
  });
});
