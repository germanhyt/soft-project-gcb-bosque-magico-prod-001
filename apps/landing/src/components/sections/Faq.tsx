import { FAQ } from '../../constants/content';
import { motion, useReducedMotion } from 'framer-motion';
import { CARD_CLASS } from '../../constants/design';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';

export function Faq() {
  const reduceMotion = useReducedMotion();
  return (
    <SectionShell id="faq" narrow>
      <SectionTitle pill="FAQ" title="Preguntas frecuentes" />
      <div className="space-y-4">
        {FAQ.map((item, index) => (
          <motion.details
            key={item.pregunta}
            className={`${CARD_CLASS} group p-5 md:p-6`}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
          >
            <summary className="cursor-pointer list-none font-display text-base font-semibold text-primary marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {item.pregunta}
                <span className="text-tertiary-fixed-dim transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-body-md">{item.respuesta}</p>
          </motion.details>
        ))}
      </div>
    </SectionShell>
  );
}
