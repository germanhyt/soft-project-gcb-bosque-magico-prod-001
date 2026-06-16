import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { Icon } from '../ui/Icon';
import { BosqueSocketBridge } from './BosqueSocketBridge';
import { LiveStatusBadge } from './LiveStatusBadge';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserAccountMenu } from './UserAccountMenu';

const NAV_TOP = [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }] as const;

const NAV_MAIN = [
  { to: '/solicitudes', label: 'Solicitudes', icon: 'inbox' },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: 'receipt_long' },
  { to: '/clientes', label: 'Clientes', icon: 'contacts' },
  { to: '/agenda', label: 'Agenda', icon: 'calendar_month' },
  { to: '/operaciones', label: 'Operaciones', icon: 'inventory_2' },
  { to: '/contratos', label: 'Contratos', icon: 'description' },
] as const;

const NAV_CONFIG = { to: '/configuracion', label: 'Configuración', icon: 'settings' } as const;
const NAV_USUARIOS = { to: '/usuarios', label: 'Usuarios', icon: 'group' } as const;

function NavItem({
  to,
  label,
  icon,
  end,
  rail,
}: {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  rail?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={rail ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-xl text-body-sm transition-colors duration-200 active:scale-[0.98] ${rail ? 'justify-center p-2.5' : 'gap-3 px-4 py-3'
        } ${isActive
          ? rail
            ? 'bg-surface-container-lowest text-primary shadow-ambient'
            : 'bg-white/10 font-bold text-secondary-fixed'
          : rail
            ? 'text-secondary-fixed-dim/90 hover:bg-white/10 hover:text-secondary-fixed'
            : 'text-secondary-fixed-dim/80 hover:bg-white/5 hover:text-secondary-fixed'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} size={22} filled={isActive} />
          {!rail && <span>{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function PanelLayout() {
  const { user, authRequired, logout } = useAuth();
  const { expanded, toggle, mobileOpen, setMobileOpen, toggleMobile } = useSidebar();
  const esAdmin = !authRequired || (user?.permisos.includes('bosque_magico:admin') ?? false);
  const navigate = useNavigate();
  const fullSidebar = expanded || mobileOpen;
  const rail = !fullSidebar;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidthClass = fullSidebar
    ? 'w-(--width-sidebar) translate-x-0 px-4'
    : 'max-md:w-0 max-md:-translate-x-full max-md:px-0 w-(--width-sidebar-collapsed) translate-x-0 px-2';

  return (
    <div className="min-h-screen bg-background text-on-background antialiased">
      <BosqueSocketBridge />
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-surface-variant bg-secondary px-4 py-8 md:hidden">
        <button
          type="button"
          onClick={toggleMobile}
          className="text-secondary-fixed"
          aria-label={mobileOpen ? 'Ocultar menú' : 'Mostrar menú'}
        >
          <Icon name="menu" size={24} filled={false} />
        </button>
        <img src="/logo-bm.png" alt="" className="h-9 w-9 rounded-lg" />
        <span className="font-bold text-secondary-fixed">Bosque Mágico</span>
      </header>

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full flex-col overflow-visible bg-secondary py-6 shadow-[20px_0_20px_-15px_rgba(23,53,14,0.15)] transition-[width,padding,transform] duration-300 md:z-40 ${sidebarWidthClass}`}
      >
        <div
          className={`shrink-0 border-b border-white/10 pb-4 ${rail ? 'mb-3 flex justify-center' : 'mb-4 flex items-center gap-2 px-1 text-center'}`}
        >
          <img
            src="/logo-bm.png"
            alt="Bosque Mágico"
            className="h-10 w-10 rounded-lg"
          />
          {!rail && (
            <div className="">
              <h1 className="text-base font-bold leading-snug tracking-tight text-secondary-fixed">
                Bosque Mágico
              </h1>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-secondary-fixed-dim/75">
                CRM Panel
              </p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-1">

          {NAV_MAIN.map((item) => (
            <NavItem key={item.to} {...item} rail={rail} />
          ))}

          {NAV_TOP.map((item) => (
            <NavItem key={item.to} {...item} rail={rail} />
          ))}

          {esAdmin && <NavItem {...NAV_USUARIOS} rail={rail} />}

          <div
            className={`mt-auto space-y-1 border-t border-white/10 pt-3 ${rail ? 'px-0' : 'px-2'}`}
          >
            <NavItem {...NAV_CONFIG} rail={rail} />
            {authRequired && (
              <button
                type="button"
                onClick={handleLogout}
                title={rail ? 'Cerrar sesión' : undefined}
                className={`flex w-full items-center rounded-xl text-secondary-fixed-dim/90 transition hover:bg-white/10 hover:text-secondary-fixed ${rail ? 'justify-center p-2.5' : 'gap-3 px-4 py-3 text-body-sm'
                  }`}
              >
                <Icon name="logout" size={22} filled={false} />
                {!rail && <span>Cerrar sesión</span>}
              </button>
            )}
          </div>
        </nav>

      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-primary/30 md:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      <header className="fixed top-0 right-0 left-0 z-30 hidden items-center justify-between border-b border-surface-variant/60 bg-surface px-6 py-5 transition-[left] duration-300 md:flex md:left-[var(--width-sidebar-current)]">
        <button
          type="button"
          onClick={() => {
            toggle();
            setMobileOpen(false);
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low"
          aria-label={expanded ? 'Contraer menú lateral' : 'Expandir menú lateral'}
        >
          <Icon name={expanded ? 'chevron_left' : 'chevron_right'} size={22} filled={false} />
        </button>
        <div className="flex items-center gap-4 text-primary">
          <LiveStatusBadge />
          <NotificationsDropdown />
          <UserAccountMenu />
        </div>
      </header>

      <main
        className="min-h-screen px-4 py-6 transition-[margin] duration-300 max-md:pt-0 md:px-8 md:pt-[7.5rem] md:pb-8"
        style={{ marginLeft: 'var(--width-sidebar-current)' }}
      >
        <div className="mx-auto max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
