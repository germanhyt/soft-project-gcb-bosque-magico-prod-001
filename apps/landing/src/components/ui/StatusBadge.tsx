import { BADGE_AVAILABLE, BADGE_SELECTED } from '../../constants/design';

type Props = {
  selected: boolean;
  selectedLabel?: string;
  availableLabel?: string;
};

export function StatusBadge({
  selected,
  selectedLabel = 'En carrito',
  availableLabel = 'Disponible',
}: Props) {
  return (
    <span className={selected ? BADGE_SELECTED : BADGE_AVAILABLE}>
      {selected ? selectedLabel : availableLabel}
    </span>
  );
}
