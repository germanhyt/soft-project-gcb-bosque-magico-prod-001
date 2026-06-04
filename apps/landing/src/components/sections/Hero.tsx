import { useState } from 'react';
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER, SECTION_HERO } from '../../constants/design';
import { HERO_IMAGE_CANDIDATES } from '../../constants/navigation';
import { MotionReveal } from '../ui/MotionReveal';

export function Hero() {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroSrc = HERO_IMAGE_CANDIDATES[heroIndex] ?? '/logo-bm.png';
  const isFallbackLogo = heroIndex >= HERO_IMAGE_CANDIDATES.length - 1;

  return (
    <section
      id="inicio"
      className={`relative overflow-hidden bg-linear-to-br from-primary-fixed/30 via-background to-surface-container-low ${SECTION_HERO} px-4 sm:px-6`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-secondary-container/25 blur-3xl md:h-96 md:w-96"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-primary-fixed/20 blur-3xl"
      />
      <div className={`${CONTAINER} relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
        <MotionReveal className="order-2 lg:order-1">
          <p className="font-display text-sm font-bold tracking-[0.14em] text-secondary uppercase">
            Fiestas infantiles · Refugio
          </p>
          <h1 className="mt-4 text-display-lg text-primary md:text-[3.35rem] md:leading-[1.08]">
            Celebra en un bosque mágico pensado para niños
          </h1>
          <p className="mt-5 max-w-xl text-body-lg leading-relaxed text-on-surface-variant">
            Espacio privado por turno, shows, catering y acompañamiento comercial. Cotiza en minutos y recibe
            seguimiento del equipo Bosque Mágico.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <a href="#cotizar" className={`${BTN_PRIMARY} w-full justify-center sm:w-auto`}>
              Cotizar mi fiesta
            </a>
            <a href="#paquetes" className={`${BTN_SECONDARY} w-full justify-center sm:w-auto`}>
              Ver paquetes
            </a>
          </div>
        </MotionReveal>
        <MotionReveal delay={0.1} className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="relative w-full max-w-sm sm:max-w-md">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-3xl bg-linear-to-tr from-tertiary-fixed/40 to-primary-fixed/30"
            />
            <img
              src={heroSrc}
              alt={isFallbackLogo ? 'Bosque Mágico' : 'Niños jugando en Bosque Mágico'}
              className={`relative w-full rounded-2xl border border-surface-variant/90 shadow-ambient ${
                isFallbackLogo
                  ? 'aspect-square max-h-72 object-contain bg-surface-container-low p-8 sm:max-h-80'
                  : 'aspect-[4/5] object-cover sm:aspect-[5/6]'
              }`}
              onError={() =>
                setHeroIndex((prev) => Math.min(prev + 1, HERO_IMAGE_CANDIDATES.length - 1))
              }
            />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
