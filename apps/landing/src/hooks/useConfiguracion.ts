import { useQuery } from '@tanstack/react-query';
import { fetchCatalogoPublico } from '../lib/api';
import { feriadosDesdeConfig, mapConfigToTarifas } from '../lib/pricing';
import { minDiasAnticipacionDesdeConfig } from '../lib/anticipacion';

export function useConfiguracion() {
  return useQuery({
    queryKey: ['catalogo-publico'],
    queryFn: fetchCatalogoPublico,
    staleTime: 1000 * 60 * 10,
    select: (data) => ({
      items: data.configuracion,
      tarifas: mapConfigToTarifas(data.configuracion),
      feriados: feriadosDesdeConfig(data.configuracion),
      minDiasAnticipacion: minDiasAnticipacionDesdeConfig(data.configuracion),
      productos: data.productos,
    }),
  });
}
