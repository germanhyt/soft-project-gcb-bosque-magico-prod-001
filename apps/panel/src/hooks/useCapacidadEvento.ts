import { useQuery } from '@tanstack/react-query';
import {
  capacidadEventoDesdeItems,
  CAPACIDAD_EVENTO_DEFAULT,
  type CapacidadEvento,
} from '../lib/capacidad-evento';
import { fetchConfiguracionPanel } from '../lib/configuracion';

export function useCapacidadEvento(): CapacidadEvento {
  const { data } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    staleTime: 1000 * 60 * 5,
  });
  return data?.todas
    ? capacidadEventoDesdeItems(data.todas)
    : { ...CAPACIDAD_EVENTO_DEFAULT };
}
