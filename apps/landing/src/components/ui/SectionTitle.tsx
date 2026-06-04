import { MotionReveal } from './MotionReveal';

type Props = {
  pill: string;
  title: string;
  subtitle?: string;
};

export function SectionTitle({ pill, title, subtitle }: Props) {
  return (
    <MotionReveal className="mb-10 max-w-2xl">
      <span className="inline-flex items-center rounded-full border border-secondary-container/80 bg-secondary-container/35 px-3.5 py-1 font-display text-sm font-bold tracking-wide text-secondary">
        {pill}
      </span>
      <h2 className="mt-4 text-headline-lg text-primary md:text-[2.35rem] md:leading-[1.15]">{title}</h2>
      {subtitle && (
        <p className="mt-4 max-w-[58ch] text-body-lg leading-relaxed text-on-surface-variant">{subtitle}</p>
      )}
    </MotionReveal>
  );
}
