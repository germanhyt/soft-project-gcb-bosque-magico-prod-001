import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { INPUT_CLASS, LABEL_CLASS } from '../constants/design';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { authRequired, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('admin@bosquemagico.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!authRequired) {
    return <Navigate to="/" replace />;
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      <div
        className="relative hidden flex-1 overflow-hidden bg-primary p-10 text-white lg:flex"
        aria-hidden
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_52%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_48%)]" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full border border-white/20" />
        <div className="pointer-events-none absolute -left-14 bottom-20 h-44 w-44 rounded-full border border-primary-fixed/35" />
        <div className="relative flex w-full items-center justify-center">
          <img src="/logo-bm.png" alt="" className="h-100 w-100 opacity-95 drop-shadow-[0_12px_28px_rgba(0,0,0,0.25)]" />
        </div>
        <p className="absolute bottom-8 left-10 text-[1.5rem] font-medium tracking-wide text-white/85">
          Sistema Bosque Mágico
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <img src="/logo-bm.png" alt="" className="mb-4 h-16 w-16 rounded-2xl shadow-ambient" />
          <p className="text-label-caps text-secondary">Bosque Mágico</p>
          <h1 className="text-headline-lg text-primary">Panel comercial</h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full max-w-[420px] rounded-2xl border border-surface-variant bg-surface-container-lowest p-8 shadow-ambient"
        >
          <div className="mb-8 hidden lg:block">
            <h1 className="text-headline-lg tracking-tight text-primary">Iniciar sesión</h1>
            <p className="mt-1 text-body-sm text-outline">Accede con tu cuenta de operador</p>
          </div>
          <p className="mb-6 text-body-sm text-outline lg:hidden">
            Ingresa tus credenciales para continuar
          </p>

          <label className="mb-4 block">
            <span className={LABEL_CLASS}>Correo</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="mail" size={20} filled={false} />
              </span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${INPUT_CLASS} pl-10`}
                placeholder="tu@correo.com"
              />
            </div>
          </label>

          <label className="mb-6 block">
            <span className={LABEL_CLASS}>Contraseña</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="lock" size={20} filled={false} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${INPUT_CLASS} pr-10 pl-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-outline transition hover:text-primary"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} filled={false} />
              </button>
            </div>
          </label>

          {error && (
            <p
              className="mb-4 flex items-center gap-2 rounded-lg border border-error-container bg-error-container/40 px-3 py-2 text-body-sm text-error"
              role="alert"
            >
              <Icon name="error" size={18} filled />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full rounded-full py-3" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar al panel'}
          </Button>

        </form>
      </div>
    </div>
  );
}
