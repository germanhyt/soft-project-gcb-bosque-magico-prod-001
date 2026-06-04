import { SECTION_HINT } from '../../constants/design';

type Props = {
  children: string;
};

export function SelectionHint({ children }: Props) {
  return <p className={SECTION_HINT}>{children}</p>;
}
