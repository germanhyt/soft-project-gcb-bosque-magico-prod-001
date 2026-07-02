import { DECORADOR_IMAGES } from '../../constants/assets';

/**
 * Ilustraciones decorador-* (fondo negro): blend screen para integrarlas en fondos claros/verdes.
 * Una pieza por zona, sin repetir el mismo motivo en secciones contiguas.
 */
export type PartyDecorPlacement =
  | 'hero-globos'
  | 'beneficios-regalos'
  | 'experiencia-helados'
  | 'quote-pattern'
  | 'footer-globos';

type Props = {
  placement: PartyDecorPlacement;
  className?: string;
};

const PLACEMENT: Record<
  PartyDecorPlacement,
  { src: string; className: string; pattern?: boolean }
> = {
  'hero-globos': {
    src: DECORADOR_IMAGES.globos,
    className:
      'right-2 bottom-16 h-24 w-36 mix-blend-screen opacity-55 sm:right-6 sm:bottom-20 sm:h-28 sm:w-44 md:h-32 md:w-52 lg:bottom-24',
  },
  'beneficios-regalos': {
    src: DECORADOR_IMAGES.regalos,
    className:
      '-bottom-4 -left-4 h-32 w-44 mix-blend-screen opacity-45 sm:-bottom-6 sm:h-40 sm:w-52 md:-bottom-8 md:left-0 md:h-44 md:w-60',
  },
  'experiencia-helados': {
    src: DECORADOR_IMAGES.helados,
    className:
      'top-6 right-0 h-16 w-40 mix-blend-screen opacity-35 sm:top-10 sm:h-20 sm:w-52 md:top-12 md:h-24 md:w-64',
  },
  'quote-pattern': {
    src: DECORADOR_IMAGES.conoFiesta,
    pattern: true,
    className: 'inset-0 opacity-[0.07] mix-blend-multiply',
  },
  'footer-globos': {
    src: DECORADOR_IMAGES.globos,
    className:
      'bottom-2 right-4 h-20 w-32 mix-blend-screen opacity-25 sm:h-24 sm:w-40 md:bottom-4 md:right-8',
  },
};

export function PartyDecor({ placement, className = '' }: Props) {
  const config = PLACEMENT[placement];

  if (config.pattern) {
    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute z-0 ${config.className} ${className}`}
        style={{
          backgroundImage: `url(${config.src})`,
          backgroundSize: '140px 140px',
          backgroundRepeat: 'repeat',
        }}
      />
    );
  }

  return (
    <img
      src={config.src}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute z-0 select-none object-contain ${config.className} ${className}`}
    />
  );
}
