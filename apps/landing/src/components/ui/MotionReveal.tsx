import type { PropsWithChildren } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type MotionRevealProps = PropsWithChildren<{
  delay?: number;
  y?: number;
  className?: string;
}>;

export function MotionReveal({ children, delay = 0, y = 18, className }: MotionRevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
