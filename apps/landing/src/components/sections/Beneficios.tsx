import { BENEFICIOS } from '../../constants/content';
import { CARD_CLASS, GRID_BENEFICIOS } from '../../constants/design';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';

export function Beneficios() {
  const reduceMotion = useReducedMotion();
  return (
    <SectionShell id="beneficios">
      <SectionTitle
        pill="Por qué Bosque Mágico"
        title="Una experiencia completa, sin estrés"
        subtitle="Todo lo que necesitas para una fiesta memorable en un solo lugar."
      />
      <ul className={GRID_BENEFICIOS}>
        {BENEFICIOS.map((texto, index) => (
          <motion.li
            key={texto}
            className={`${CARD_CLASS} tactile-card flex gap-3 p-6`}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <span className="mt-0.5 shrink-0 text-lg text-tertiary-fixed-dim" aria-hidden>
              ✦
            </span>
            <span className="text-body-md leading-relaxed text-on-surface">{texto}</span>
          </motion.li>
        ))}
      </ul>
    </SectionShell>
  );
}
