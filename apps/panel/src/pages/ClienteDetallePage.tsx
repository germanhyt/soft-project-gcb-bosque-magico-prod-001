import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/** Redirige al listado con el modal de detalle abierto. */
export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate(`/clientes?detalle=${id}`, { replace: true });
    else navigate('/clientes', { replace: true });
  }, [id, navigate]);

  return null;
}
