import { useEffect, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import {
  PERMISOS_DISPONIBLES,
  type UsuarioPanel,
} from '../../lib/usuarios';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PasswordInput } from '../ui/PasswordInput';

type Props = {
  open: boolean;
  onClose: () => void;
  usuario?: UsuarioPanel | null;
  onSubmit: (payload: {
    email: string;
    nombre: string;
    password: string;
    permisos: string[];
  }) => Promise<void>;
  onUpdate?: (
    id: string,
    payload: { nombre: string; password?: string; permisos: string[] },
  ) => Promise<void>;
};

export function UsuarioFormModal({ open, onClose, usuario, onSubmit, onUpdate }: Props) {
  const editando = !!usuario;
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permisos, setPermisos] = useState<string[]>(['bosque_magico:view']);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setPassword('');
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setPermisos([...usuario.permisos]);
    } else {
      setNombre('');
      setEmail('');
      setPermisos(['bosque_magico:view', 'bosque_magico:manage']);
    }
  }, [open, usuario]);

  const togglePermiso = (id: string) => {
    setPermisos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (permisos.length === 0) {
      setError('Selecciona al menos un permiso.');
      return;
    }
    setPending(true);
    try {
      if (editando && usuario && onUpdate) {
        await onUpdate(usuario.id, {
          nombre: nombre.trim(),
          permisos,
          ...(password ? { password } : {}),
        });
      } else {
        if (!password || password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setPending(false);
          return;
        }
        await onSubmit({
          email: email.trim(),
          nombre: nombre.trim(),
          password,
          permisos,
        });
      }
      onClose();
    } catch {
      setError('No se pudo guardar el usuario.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar usuario' : 'Nuevo usuario'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={LABEL_CLASS}>Nombre</span>
          <input
            className={INPUT_CLASS}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Correo</span>
          <input
            type="email"
            className={INPUT_CLASS}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={editando}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>
            {editando ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
          </span>
          <PasswordInput
            value={password}
            onChange={setPassword}
            generatable
            minLength={6}
            autoComplete={editando ? 'new-password' : 'new-password'}
            placeholder={editando ? 'Dejar vacío para no cambiar' : undefined}
          />
          <p className="mt-1 text-xs text-outline">
            Mínimo 6 caracteres. Usa «Generar» para una clave segura y cópiala antes de guardar.
          </p>
        </label>

        <fieldset className="rounded-lg border border-surface-variant p-4">
          <legend className="px-1 text-label-caps text-outline">Permisos</legend>
          <div className="mt-2 space-y-2">
            {PERMISOS_DISPONIBLES.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-start gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={permisos.includes(p.id)}
                  onChange={() => togglePermiso(p.id)}
                />
                <span>
                  <span className="font-medium text-on-surface">{p.label}</span>
                  <span className="block font-mono text-xs text-outline">{p.id}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {pending ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
