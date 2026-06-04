import type { ReactNode } from 'react';

type AlertProps = { children: ReactNode };

export function AlertError({ children }: AlertProps) {
  return (
    <p className="mb-4 rounded-xl border border-error-container bg-error-container/30 px-4 py-3 text-body-sm text-error">
      {children}
    </p>
  );
}
