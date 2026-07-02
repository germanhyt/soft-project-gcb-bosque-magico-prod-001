import { useEffect, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import {
  PERMISOS_PANEL,
  PERMISO_MANAGE,
  PERMISO_VIEW,
  togglePermisoPanel,
  type UsuarioPanel,
} from '../../lib/usuarios';
import { Button } from '../ui/Button';
import { FormCheckbox } from '../ui/FormCheckbox';
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
  const [permisos, setPermisos] = useState<string[]>([PERMISO_VIEW]);
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
      setPermisos([PERMISO_VIEW, PERMISO_MANAGE]);
    }
  }, [open, usuario]);

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
            placeholder="Ej. María García"
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
            placeholder="usuario@bosquemagico.test"
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
            placeholder={editando ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
          />
          <p className="mt-1 text-xs text-outline">
            Mínimo 6 caracteres. Usa «Generar» para una clave segura y cópiala antes de guardar.
          </p>
        </label>

        <fieldset className="rounded-lg border border-surface-variant p-4">
          <legend className="px-1 text-label-caps text-outline">Permisos del panel</legend>
          <p className="mb-3 text-xs text-on-surface-variant">
            Los permisos son jerárquicos: Administración incluye Operación y Consulta; Operación
            incluye Consulta.
          </p>
          <div className="space-y-3">
            {PERMISOS_PANEL.map((p) => (
              <FormCheckbox
                key={p.id}
                id={`permiso-${p.id}`}
                checked={permisos.includes(p.id)}
                onChange={() => setPermisos((prev) => togglePermisoPanel(prev, p.id))}
                label={p.label}
                description={
                  <>
                    {p.descripcion}
                    <span className="mt-1 block text-xs text-outline">{p.modulos.join(' · ')}</span>
                  </>
                }
              />
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
};
