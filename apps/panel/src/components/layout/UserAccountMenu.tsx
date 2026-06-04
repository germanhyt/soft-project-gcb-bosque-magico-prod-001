import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui/Icon';

const PERMISO_LABEL: Record<string, string> = {
  'bosque_magico:view': 'Ver',
  'bosque_magico:manage': 'Gestionar',
  'bosque_magico:admin': 'Administrar',
};

export function UserAccountMenu() {
  const { user, authRequired, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!authRequired || !user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-surface-variant/40"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name="account_circle" size={28} filled={false} />
        <span className="hidden max-w-[120px] truncate text-body-sm font-semibold text-primary lg:inline">
          {user.nombre}
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={20} filled={false} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-surface-variant bg-surface-container-lowest p-4 shadow-ambient">
          <p className="font-semibold text-on-surface">{user.nombre}</p>
          <p className="mt-0.5 truncate text-xs text-outline">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {user.permisos.map((p) => (
              <span
                key={p}
                className="rounded-full bg-primary-fixed/40 px-2 py-0.5 text-[10px] font-semibold text-primary"
              >
                {PERMISO_LABEL[p] ?? p}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              window.location.href = '/login';
            }}
            className="mt-4 w-full rounded-lg border border-surface-variant py-2 text-body-sm font-semibold text-secondary hover:bg-surface-variant/30"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
