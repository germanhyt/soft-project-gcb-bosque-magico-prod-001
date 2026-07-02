import { CONTAINER, SECTION_FOREST } from '../../constants/design';
import { ESPACIO_IMAGE } from '../../constants/navigation';
import { MotionReveal } from '../ui/MotionReveal';
import { PartyDecor } from '../ui/PartyDecor';

const PUNTOS = [
  {
    titulo: 'Espacio solo para tu grupo',
    detalle: 'Reservas por turno: tu fiesta es privada, sin compartir con otros cumpleañeros.',
  },
  {
    titulo: 'Ambiente de bosque real',
    detalle: 'Juegos de madera, césped y un mural que transporta a los niños a un refugio mágico.',
  },
  {
    titulo: 'Todo en un solo flujo',
    detalle: 'Paquete, shows, piqueos y extras se arman aquí mismo; el equipo confirma el detalle contigo.',
  },
] as const;

export function Experiencia() {
  return (
    <section id="experiencia" className={`${SECTION_FOREST} overflow-hidden`}>
      <PartyDecor placement="experiencia-helados" />
      <div className={`${CONTAINER} relative z-[1]`}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <MotionReveal>
            <span className="inline-block rounded-full bg-tertiary-fixed-dim px-3.5 py-1 font-display text-xs font-bold tracking-wide text-on-tertiary-fixed uppercase">
              El espacio
            </span>
            <h2 className="mt-4 text-headline-lg text-on-primary md:text-[2.35rem] md:leading-[1.15]">
              Un rincón de bosque en plena ciudad
            </h2>
            <p className="mt-4 max-w-lg text-body-lg leading-relaxed text-primary-fixed">
              Bosque Mágico vive dentro de Refugio: zona de juegos techada, áreas verdes y un equipo
              acostumbrado a organizar cumpleaños de principio a fin.
            </p>
            <ul className="mt-8 space-y-4">
              {PUNTOS.map((punto, index) => (
                <li
                  key={punto.titulo}
                  className="flex gap-4 rounded-xl border border-primary-fixed/20 bg-primary/40 p-4"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tertiary-fixed-dim font-display text-sm font-bold text-on-tertiary-fixed"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-on-primary">{punto.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-primary-fixed-dim">{punto.detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </MotionReveal>

          <MotionReveal delay={0.08}>
            <figure className="relative">
              <img
                src={ESPACIO_IMAGE}
                alt="Zona de juegos Bosque Mágico en Refugio, con estructuras de madera, césped y mural de bosque"
                className="aspect-video w-full rounded-2xl border-4 border-primary-fixed/30 object-cover shadow-ambient"
                width={640}
                height={360}
                loading="lazy"
              />
              <div className="absolute -top-4 -left-4 rounded-xl bg-secondary-container px-4 py-3 shadow-ambient">
                <p className="font-display text-2xl font-bold text-on-secondary-container">25</p>
                <p className="text-xs font-semibold text-on-secondary-container/80">niños base</p>
              </div>
              <div className="absolute -right-3 bottom-6 rounded-xl bg-surface-container-lowest px-4 py-3 shadow-ambient">
                <p className="font-display text-sm font-bold text-primary">Shows · Snacks · Cajitas</p>
                <p className="text-xs text-on-surface-variant">Arma tu paquete abajo</p>
              </div>
            </figure>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
