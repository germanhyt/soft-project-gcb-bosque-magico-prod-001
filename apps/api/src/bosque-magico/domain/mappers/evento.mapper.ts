import { fromDecimal } from '../utils/decimal';

export function mapEventoResponse(evento: Record<string, unknown>) {
  return {
    ...evento,
    montoTotal: fromDecimal(evento.montoTotal as never),
  };
}
