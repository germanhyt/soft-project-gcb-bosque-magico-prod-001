import type { CSSProperties } from 'react';

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

/** Línea de carga suave (cápsula). El radio se pasa por className. */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return <span className={`skeleton-bone ${className}`.trim()} style={style} aria-hidden />;
}

function cellWidth(row: number, col: number) {
  const wave = (row * 5 + col * 11) % 18;
  return 58 + wave;
}

type TableSkeletonRowsProps = {
  columns: number;
  rows?: number;
  /** Índice 0-based de una celda tipo miniatura (catálogo). */
  imageColumn?: number;
  /** Última columna: botones de fila o un chip de estado. */
  lastColumn?: 'actions' | 'chip';
};

/** Filas que imitan texto, chips y acciones — no bloques genéricos. */
export function TableSkeletonRows({
  columns,
  rows = 6,
  imageColumn,
  lastColumn = 'actions',
}: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => {
        const fade = 1 - (row / Math.max(rows - 1, 1)) * 0.42;
        return (
          <tr
            key={row}
            className="border-b border-surface-variant/40"
            style={{
              opacity: fade,
              ['--skeleton-delay' as string]: `${row * 110}ms`,
            }}
          >
            {Array.from({ length: columns }, (_, col) => {
              const isFirst = col === 0;
              const isName = col === 1 && imageColumn !== 1;
              const isLast = col === columns - 1;
              const isImage = imageColumn === col;

              return (
                <td key={col} className="px-4 py-3.5">
                  {row === 0 && col === 0 ? (
                    <span className="sr-only">Cargando…</span>
                  ) : null}
                  {isImage ? (
                    <Skeleton className="h-8 w-8 rounded-md" />
                  ) : isLast && lastColumn === 'actions' ? (
                    <span className="flex justify-end gap-1.5">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </span>
                  ) : isLast && lastColumn === 'chip' ? (
                    <Skeleton className="h-5 w-[4.25rem] rounded-full" />
                  ) : isFirst ? (
                    <Skeleton className="h-2 w-[4.25rem] rounded-full" />
                  ) : isName ? (
                    <span className="flex flex-col gap-1.5">
                      <Skeleton
                        className="h-2.5 rounded-full"
                        style={{ width: `${cellWidth(row, col)}%` }}
                      />
                      <Skeleton
                        className="h-2 rounded-full"
                        style={{ width: `${Math.max(cellWidth(row, col) - 22, 32)}%` }}
                      />
                    </span>
                  ) : (
                    <Skeleton
                      className="h-2.5 rounded-full"
                      style={{ width: `${cellWidth(row, col)}%` }}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}

function delayStyle(index: number, stepMs = 90): CSSProperties {
  return { ['--skeleton-delay' as string]: `${index * stepMs}ms` };
}

/** Campos de formulario (modales de alta/edición). */
export function FormSkeleton({
  fields = 6,
  columns = 2,
  withTextarea = false,
}: {
  fields?: number;
  columns?: 1 | 2;
  withTextarea?: boolean;
}) {
  return (
    <div
      className={`grid gap-4 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}
      aria-busy
    >
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: fields }, (_, i) => {
        const wide = columns === 2 && (i === 0 || (withTextarea && i === fields - 1));
        const isArea = withTextarea && i === fields - 1;
        return (
          <div
            key={i}
            className={wide ? 'sm:col-span-2' : undefined}
            style={{ opacity: 1 - i * 0.07, ...delayStyle(i) }}
          >
            <Skeleton className="mb-2 h-2 w-20 rounded-full" />
            <Skeleton className={isArea ? 'h-28 w-full rounded-xl' : 'h-10 w-full rounded-lg'} />
          </div>
        );
      })}
    </div>
  );
}

/** Cuerpo de DetalleModal: chips, datos y un bloque inferior. */
export function DetalleSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <span className="sr-only">Cargando…</span>
      <div className="flex gap-2" style={delayStyle(0)}>
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-[4.5rem] rounded-full" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-2" style={{ opacity: 1 - i * 0.06, ...delayStyle(i + 1) }}>
            <Skeleton className="h-2 w-16 rounded-full" />
            <Skeleton className="h-2.5 w-[72%] rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3 pt-1">
        <Skeleton className="h-2.5 w-24 rounded-full" />
        <StackSkeleton rows={3} />
      </div>
    </div>
  );
}

/** Lista compacta (tareas, pedidos, bitácora). */
export function StackSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg px-1 py-2"
          style={{ opacity: 1 - i * 0.14, ...delayStyle(i) }}
        >
          {i === 0 ? <span className="sr-only">Cargando…</span> : null}
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-[62%] rounded-full" />
            <Skeleton className="h-2 w-[38%] rounded-full" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Calendario mensual: grilla quieta, solo algunos chips animados. */
export function CalendarSkeleton() {
  const chips = new Set([3, 8, 12, 19, 24]);
  return (
    <div aria-busy>
      <span className="sr-only">Cargando agenda…</span>
      <div className="mb-4 flex items-center justify-between border-b border-surface-variant pb-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-7 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-surface-variant bg-surface-variant">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={`h-${i}`} className="bg-surface-container-high px-1 py-2">
            <Skeleton className="mx-auto h-2 w-6 rounded-full" />
          </div>
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="min-h-[4.5rem] bg-surface-container-lowest p-2">
            <Skeleton className="h-2 w-4 rounded-full opacity-50" />
            {chips.has(i) ? (
              <Skeleton
                className="mt-2 h-4 w-[70%] rounded-full"
                style={delayStyle(i % 6, 120)}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Filas de lista con miniatura (dashboard · próximos eventos). */
export function MediaRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5"
          style={{
            opacity: 1 - i * 0.18,
            ['--skeleton-delay' as string]: `${i * 120}ms`,
          }}
        >
          {i === 0 ? <span className="sr-only">Cargando…</span> : null}
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2.5 w-[68%] rounded-full" />
            <Skeleton className="h-2 w-[42%] rounded-full" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </>
  );
}
