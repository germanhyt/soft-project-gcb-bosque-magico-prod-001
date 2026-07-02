import { BENEFICIOS } from '../../constants/content';
import { CARD_CLASS, GRID_BENEFICIOS } from '../../constants/design';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { PartyDecor } from '../ui/PartyDecor';

const BENEFICIO_ICONS = [
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v18M8 7h8M6 11h12M8 15h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21c-4-3-7-6-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4-3 7-7 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18V5l12-2v13M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
] as const;

export function Beneficios() {
  const reduceMotion = useReducedMotion();
  return (
    <SectionShell
      id="beneficios"
      tone="party"
      className="relative overflow-hidden"
      decor={<PartyDecor placement="beneficios-regalos" />}
    >
      <div className="relative z-[1]">
        <SectionTitle
          pill="Por qué Bosque Mágico"
          title="Una experiencia completa, sin estrés"
          subtitle="Todo lo que necesitas para una fiesta memorable en un solo lugar."
        />
        <ul className={GRID_BENEFICIOS}>
          {BENEFICIOS.map((texto, index) => (
            <motion.li
              key={texto}
              className={`${CARD_CLASS} tactile-card flex gap-4 p-6`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary"
                aria-hidden
              >
                {BENEFICIO_ICONS[index]}
              </span>
              <span className="text-body-md leading-relaxed text-on-surface">{texto}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
