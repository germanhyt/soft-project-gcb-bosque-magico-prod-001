import { LANDING_IMAGES } from '../../constants/assets';

/** Dosel verde — solo en hero para anclar la identidad bosque */
export type PlantPlacement = 'hero-top-right';

type Props = {
  placement: PlantPlacement;
  className?: string;
};

const PLACEMENT: Record<
  PlantPlacement,
  { variant: 'top'; object: string; position: string; size: string; opacity: string }
> = {
  'hero-top-right': {
    variant: 'top',
    object: 'object-right-top',
    position: '-right-2 top-0 sm:right-0',
    size: 'h-32 w-48 sm:h-40 sm:w-60 md:h-48 md:w-72 lg:h-52 lg:w-80',
    opacity: 'opacity-70',
  },
};

export function PlantDecor({ placement, className = '' }: Props) {
  const config = PLACEMENT[placement];
  return (
    <img
      src={LANDING_IMAGES.plantaTop}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute z-0 select-none object-contain ${config.object} ${config.position} ${config.size} ${config.opacity} ${className}`}
    />
  );
}
