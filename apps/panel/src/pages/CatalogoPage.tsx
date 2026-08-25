import { useSearchParams } from 'react-router-dom';
import { CatalogoTab } from '../components/catalogo/CatalogoTab';
import { ProveedoresTab } from '../components/proveedores/ProveedoresTab';
import { PageHeader } from '../components/ui/PageHeader';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { PERMISO_ADMIN, PERMISO_MANAGE } from '../constants/permisos';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'productos' | 'proveedores';

function tabClass(active: boolean) {
  return `border-b-2 px-4 py-2 text-body-sm font-semibold transition ${
    active
      ? 'border-primary text-primary'
      : 'border-transparent text-outline hover:text-on-surface'
  }`;
}

export function CatalogoPage() {
  const { user, authRequired } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const permisos = user?.permisos;
  const puedeGestionar =
    !authRequired ||
    (permisos?.includes(PERMISO_ADMIN) ?? false) ||
    (permisos?.includes(PERMISO_MANAGE) ?? false);

  const tab: Tab =
    searchParams.get('tab') === 'proveedores' && puedeGestionar
      ? 'proveedores'
      : 'productos';

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'proveedores') params.set('tab', 'proveedores');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="relative w-full">
      <PageHeader breadcrumbs={[CRUMB_INICIO, crumb('Catálogo y proveedores')]} />

      <div className="mt-6 flex gap-2 border-b border-surface-variant">
        <button type="button" onClick={() => setTab('productos')} className={tabClass(tab === 'productos')}>
          Catálogo
        </button>
        {puedeGestionar && (
          <button
            type="button"
            onClick={() => setTab('proveedores')}
            className={tabClass(tab === 'proveedores')}
          >
            Proveedores
          </button>
        )}
      </div>

      {tab === 'productos' && <CatalogoTab puedeGestionar={puedeGestionar} />}
      {tab === 'proveedores' && puedeGestionar && (
        <ProveedoresTab puedeGestionar={puedeGestionar} />
      )}
    </div>
  );
}
