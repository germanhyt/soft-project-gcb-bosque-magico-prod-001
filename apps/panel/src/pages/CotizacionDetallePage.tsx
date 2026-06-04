import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/** Redirige al listado con el modal de detalle abierto. */
export function CotizacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate(`/cotizaciones?detalle=${id}`, { replace: true });
    else navigate('/cotizaciones', { replace: true });
  }, [id, navigate]);

  return null;
}
