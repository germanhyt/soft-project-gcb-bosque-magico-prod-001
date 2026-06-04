import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

/** Redirige rutas legacy a query params en /cotizaciones */
export function CotizacionNuevaRedirectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const next = new URLSearchParams();
    next.set('form', 'nueva');
    const sid = params.get('solicitudId');
    if (sid) next.set('solicitudId', sid);
    navigate(`/cotizaciones?${next.toString()}`, { replace: true });
  }, [navigate, params]);

  return null;
}

export function CotizacionEditarRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate(`/cotizaciones?editar=${id}`, { replace: true });
    else navigate('/cotizaciones', { replace: true });
  }, [id, navigate]);

  return null;
}
