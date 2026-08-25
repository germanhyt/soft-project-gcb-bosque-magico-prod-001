import { itemsIncluidosPaquete, PAQUETE_INCLUSIONES_DEFAULT } from '@bosque/shared';
import { motion, useReducedMotion } from 'framer-motion';
import { PAQUETES, TERMINOS } from '../../constants/content';
import { CARD_CATALOG, cardCatalogState } from '../../constants/design';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { preciosPaqueteFallback } from '../../lib/pricing';
import { CatalogProductMedia } from '../ui/CatalogProductMedia';
import { SectionShell } from '../ui/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { SelectionHint } from '../ui/SelectionHint';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  selectedPaquete: string;
  onSelectPaquete: (paquete: string) => void;
};

export function Paquetes({ selectedPaquete, onSelectPaquete }: Props) {
  const { data } = useConfiguracion();
  const reduceMotion = useReducedMotion();
  const paquetes =
    data?.productos.paquetes?.map((paquete) => ({
      nombre: paquete.nombre,
      imagenUrl: paquete.imagenUrl,
      imagenes: paquete.imagenes,
      videoUrl: paquete.videoUrl,
      precioLv: paquete.precioLunesViernes,
      precioFds: paquete.precioFinSemana,
      detalle:
        paquete.descripcion ||
        itemsIncluidosPaquete(paquete.nombre, PAQUETE_INCLUSIONES_DEFAULT).join('. ') + '.',
    })) ??
    PAQUETES.map((nombre) => {
      const fb = preciosPaqueteFallback(nombre);
      return {
        nombre,
        imagenUrl: null as string | null,
        imagenes: undefined as string[] | undefined,
        videoUrl: null as string | null,
        precioLv: fb.lv,
        precioFds: fb.fds,
        detalle: itemsIncluidosPaquete(nombre, PAQUETE_INCLUSIONES_DEFAULT).join('. ') + '.',
      };
    });

  return (
    <SectionShell id="paquetes" tone="alt">
      <SectionTitle
        pill="Paquetes"
        title="Elige el nivel de tu celebración"
        subtitle="Precios referenciales según día y cantidad de niños. El equipo confirma el detalle final."
      />
      <SelectionHint>Toca una tarjeta para seleccionar tu paquete base.</SelectionHint>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {paquetes.map((paquete, i) => {
          const selected = selectedPaquete === paquete.nombre;
          const highlighted = i === 1;
          return (
            <motion.article
              key={paquete.nombre}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPaquete(paquete.nombre)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelectPaquete(paquete.nombre);
              }}
              className={`${CARD_CATALOG} ${cardCatalogState(selected, highlighted)}`}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              {highlighted && (
                <span className="mb-3 inline-block w-fit rounded-full bg-tertiary-fixed px-3 py-1 font-display text-xs font-bold text-on-tertiary-fixed">
                  Más elegido
                </span>
              )}
              <CatalogProductMedia
                imagenes={paquete.imagenes}
                imagenUrl={paquete.imagenUrl}
                videoUrl={paquete.videoUrl}
                nombre={paquete.nombre}
              />
              <h3 className="text-headline-md text-primary">{paquete.nombre}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">{paquete.detalle}</p>
              <p className="mt-5 text-price-tag text-primary">
                L-V desde S/ {paquete.precioLv}
                <span className="mt-1 block text-sm font-normal text-on-surface-variant">
                  Fines de semana desde S/ {paquete.precioFds}
                </span>
              </p>
              <div className="mt-5 flex justify-end">
                <StatusBadge selected={selected} selectedLabel="Seleccionado" />
              </div>
            </motion.article>
          );
        })}
      </div>
      <ul className="mt-10 grid gap-3 text-sm leading-relaxed text-on-surface-variant sm:grid-cols-2">
        {TERMINOS.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-tertiary-fixed-dim" aria-hidden>
              •
            </span>
            {t}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
