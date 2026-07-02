import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER } from '../../constants/design';
import { HERO_IMAGE } from '../../constants/navigation';
import { MotionReveal } from '../ui/MotionReveal';
import { PartyDecor } from '../ui/PartyDecor';
import { PlantDecor } from '../ui/PlantDecor';

const HIGHLIGHTS = [
  { value: '3 h', label: 'por turno' },
  { value: '10–35', label: 'niños' },
  { value: '3', label: 'turnos al día' },
] as const;

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-surface px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14 lg:pb-20 lg:pt-16"
    >
      <div aria-hidden className="absolute inset-y-0 left-0 z-10 w-2 bg-tertiary-fixed-dim sm:w-3" />
      <PlantDecor placement="hero-top-right" />
      <PartyDecor placement="hero-globos" />

      <div className={`${CONTAINER} relative z-[1] grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14`}>
        <MotionReveal className="order-1">
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 font-display text-xs font-bold tracking-wide text-on-secondary uppercase">
            Fiestas infantiles · Refugio
          </span>
          <h1 className="mt-5 text-display-lg text-primary md:text-[3.25rem] md:leading-[1.08]">
            El cumpleaños que tu pequeño va a recordar
          </h1>
          <p className="mt-5 max-w-xl text-body-lg leading-relaxed text-on-surface-variant">
            Bosque Mágico es un refugio pensado para celebrar: espacio privado, juegos al aire libre,
            shows y catering en un solo lugar. Cotiza en minutos y te acompañamos hasta confirmar fecha.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <a href="#cotizar" className={`${BTN_PRIMARY} w-full justify-center sm:w-auto`}>
              Cotizar mi fiesta
            </a>
            <a href="#paquetes" className={`${BTN_SECONDARY} w-full justify-center sm:w-auto`}>
              Ver paquetes
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-surface-variant bg-surface-container-lowest px-4 py-3 text-center shadow-ambient"
              >
                <p className="font-display text-xl font-bold text-primary">{item.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </MotionReveal>

        <MotionReveal delay={0.1} className="order-2">
          <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden
              className="absolute -bottom-2 -right-2 h-full w-full rounded-2xl bg-primary-container"
            />
            <img
              src={HERO_IMAGE}
              alt="Gorrito de fiesta y ambiente decorado para cumpleaños infantiles en Bosque Mágico"
              className="frame-party relative aspect-4/3 w-full rounded-2xl object-cover"
              width={640}
              height={480}
              fetchPriority="high"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-lg bg-primary px-3 py-2 font-display text-xs font-bold text-on-primary shadow-ambient">
              Celebración · Bosque Mágico
            </figcaption>
          </figure>
        </MotionReveal>
      </div>
    </section>
  );
}
