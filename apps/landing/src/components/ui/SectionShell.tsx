import type { ReactNode } from 'react';
import { CONTAINER, SECTION_ALT, SECTION_SHELL, SECTION_TINTED } from '../../constants/design';

type Tone = 'default' | 'alt' | 'tinted' | 'party';

const TONE_CLASS: Record<Tone, string> = {
  default: SECTION_SHELL,
  alt: SECTION_ALT,
  tinted: SECTION_TINTED,
  party: `${SECTION_SHELL} bg-party-dots`,
};

type Props = {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  narrow?: boolean;
  /** Decoración anclada a la sección completa (fuera del contenedor) */
  decor?: ReactNode;
};

export function SectionShell({ id, tone = 'default', className = '', children, narrow, decor }: Props) {
  return (
    <section id={id} className={`${TONE_CLASS[tone]} ${className}`}>
      {decor}
      <div className={`${CONTAINER}${narrow ? ' max-w-3xl' : ''}`}>{children}</div>
    </section>
  );
}
