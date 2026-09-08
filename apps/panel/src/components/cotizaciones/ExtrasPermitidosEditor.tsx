import { useState } from 'react';
import {
  nombresExtrasPermitidosDesdeCatalogo,
  nombresIgualesExtraPermitido,
} from '@bosque/shared';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import type { Producto } from '../../lib/cotizaciones';
import { Icon } from '../ui/Icon';

type Props = {
  value: string[];
  comentario: string;
  catalogo: Producto[];
  onChange: (next: string[]) => void;
  onComentarioChange: (next: string) => void;
};

function estaSeleccionado(lista: string[], nombre: string) {
  return lista.some((item) => nombresIgualesExtraPermitido(item, nombre));
}

export function ExtrasPermitidosEditor({
  value,
  comentario,
  catalogo,
  onChange,
  onComentarioChange,
}: Props) {
  const [nuevo, setNuevo] = useState('');
  const opcionesCatalogo = nombresExtrasPermitidosDesdeCatalogo(catalogo);
  const personalizados = value.filter(
    (nombre) => !opcionesCatalogo.some((opcion) => nombresIgualesExtraPermitido(opcion, nombre)),
  );

  const toggleCatalogo = (nombre: string) => {
    if (estaSeleccionado(value, nombre)) {
      onChange(value.filter((item) => !nombresIgualesExtraPermitido(item, nombre)));
      return;
    }
    onChange([...value, nombre]);
  };

  const actualizarPersonalizado = (index: number, nombre: string) => {
    const next = [...personalizados];
    next[index] = nombre;
    onChange([
      ...value.filter((item) =>
        opcionesCatalogo.some((opcion) => nombresIgualesExtraPermitido(opcion, item)),
      ),
      ...next,
    ]);
  };

  const quitarPersonalizado = (nombre: string) => {
    onChange(value.filter((item) => !nombresIgualesExtraPermitido(item, nombre)));
  };

  const agregar = (nombre: string) => {
    const trimmed = nombre.trim().replace(/\s+/g, ' ');
    if (!trimmed || estaSeleccionado(value, trimmed)) return;
    onChange([...value, trimmed]);
    setNuevo('');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-on-surface-variant">
        Solo se imprimen en el <strong>contrato</strong>. Marca lo que el cliente puede traer, o
        agrega otro artículo acordado.
      </p>

      <div>
        <p className={LABEL_CLASS}>
          Opciones del catálogo
          {value.length > 0 ? (
            <span className="ml-1 font-normal text-on-surface-variant">
              ({value.length} en el contrato)
            </span>
          ) : (
            <span className="ml-1 font-normal text-on-surface-variant">(ninguno)</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {opcionesCatalogo.map((nombre) => {
            const activo = estaSeleccionado(value, nombre);
            return (
              <button
                key={nombre}
                type="button"
                aria-pressed={activo}
                onClick={() => toggleCatalogo(nombre)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  activo
                    ? 'bg-primary text-on-primary shadow-ambient'
                    : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
                }`}
              >
                <Icon name={activo ? 'check' : 'add'} size={16} />
                {nombre}
              </button>
            );
          })}
        </div>
      </div>

      {personalizados.length > 0 && (
        <div>
          <p className={LABEL_CLASS}>Otros acordados</p>
          <ul className="flex flex-wrap gap-2">
            {personalizados.map((nombre, index) => (
              <li
                key={`${nombre}-${index}`}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-fixed/20 py-1 pl-3 pr-1"
              >
                <input
                  className="w-36 border-0 bg-transparent p-0 text-sm text-on-surface outline-none"
                  value={nombre}
                  maxLength={80}
                  aria-label={`Otro extra permitido ${index + 1}`}
                  onChange={(e) => actualizarPersonalizado(index, e.target.value)}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (!trimmed) {
                      quitarPersonalizado(nombre);
                      return;
                    }
                    actualizarPersonalizado(index, trimmed);
                  }}
                />
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-outline hover:bg-surface hover:text-error"
                  aria-label={`Quitar ${nombre}`}
                  onClick={() => quitarPersonalizado(nombre)}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${INPUT_CLASS} max-w-xs`}
          placeholder="Otro artículo (opcional)"
          maxLength={80}
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              agregar(nuevo);
            }
          }}
        />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-sm font-medium text-on-surface hover:border-primary/40"
          onClick={() => agregar(nuevo)}
        >
          <Icon name="add" size={16} />
          Agregar
        </button>
      </div>

      <label className="block">
        <span className={LABEL_CLASS}>Observación para el contrato (opcional)</span>
        <textarea
          rows={2}
          maxLength={500}
          className={INPUT_CLASS}
          placeholder="Ej. La torta la entrega el cliente 30 minutos antes"
          value={comentario}
          onChange={(e) => onComentarioChange(e.target.value)}
        />
      </label>
    </div>
  );
}
