import { useEffect, useMemo, useState } from 'react';
import { Seo } from '../components/Seo';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { homeJsonLd } from '../constants/seo';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { QuoteForm } from '../components/cotizador/QuoteForm';
import { ResumenFlotante } from '../components/cotizador/ResumenFlotante';
import { Beneficios } from '../components/sections/Beneficios';
import { CajitasSelector } from '../components/sections/CajitasSelector';
import { Catering } from '../components/sections/Catering';
import { Extras } from '../components/sections/Extras';
import { Experiencia } from '../components/sections/Experiencia';
import { Faq } from '../components/sections/Faq';
import { Hero } from '../components/sections/Hero';
import { Paquetes } from '../components/sections/Paquetes';
import { PiqueosSelector } from '../components/sections/PiqueosSelector';
import { Shows } from '../components/sections/Shows';
import { SnackPremiumSelector } from '../components/sections/SnackPremiumSelector';
import {
  INITIAL_QUOTE_SELECTION,
  esPaquetePersonalizado,
  esShowPersonalizado,
  type QuoteBuilderSelection,
} from '../types/quote-builder';
import type { ResumenEstimado } from '../types/resumen';
import { minimoCateringDesdeConfig, minimoUnidadesCatering } from '../lib/catering-minimo';
import { getSelectionMode, SELECTION_MODE_KEYS } from '../lib/selection-mode';
import { toggleCatalogSelection } from '../lib/toggle-catalog-selection';

export function HomePage() {
  const [selection, setSelection] = useState<QuoteBuilderSelection>(INITIAL_QUOTE_SELECTION);
  const [, setFechaPreview] = useState('');
  const [estimado, setEstimado] = useState<ResumenEstimado | null>(null);
  const { data } = useConfiguracion();
  const minimoCatering = useMemo(
    () => minimoCateringDesdeConfig(data?.items),
    [data?.items],
  );
  const selectionModes = useMemo(
    () => ({
      shows: getSelectionMode(data?.items, SELECTION_MODE_KEYS.shows, 'single'),
      catering: getSelectionMode(data?.items, SELECTION_MODE_KEYS.catering, 'multiple'),
      extras: getSelectionMode(data?.items, SELECTION_MODE_KEYS.extras, 'multiple'),
    }),
    [data?.items],
  );

  useEffect(() => {
    if (!esPaquetePersonalizado(selection.paquete)) return;
    const showPers = data?.productos.shows?.find(esShowPersonalizado);
    if (!showPers) return;
    if (selection.showIds.length === 1 && selection.showIds[0] === showPers.id) return;
    setSelection((prev) => ({
      ...prev,
      showIds: [showPers.id],
      showCantidades: { [showPers.id]: 1 },
    }));
  }, [selection.paquete, selection.showIds, data?.productos.shows]);

  return (
    <>
      <Seo jsonLd={homeJsonLd()} />
      <Header />
      <main>
        <Hero />
        <Beneficios />
        <Experiencia />
        <Paquetes
          selectedPaquete={selection.paquete}
          onSelectPaquete={(paquete) =>
            setSelection((prev) => {
              const showPers = data?.productos.shows?.find(esShowPersonalizado);
              const personalizado = esPaquetePersonalizado(paquete);
              return {
                ...prev,
                paquete,
                cajitasCantidad: 0,
                cajitasClasica: 0,
                cajitasSaludable: 0,
                piqueoIds: [],
                piqueosCantidades: {},
                snackId: '',
                snackCantidad: 0,
                showIds: personalizado && showPers ? [showPers.id] : prev.showIds,
                showCantidades:
                  personalizado && showPers ? { [showPers.id]: 1 } : prev.showCantidades,
              };
            })
          }
        />
        <CajitasSelector
          selection={selection}
          onChange={({ clasica, saludable, total }) =>
            setSelection((prev) => ({
              ...prev,
              cajitasClasica: clasica,
              cajitasSaludable: saludable,
              cajitasCantidad: total,
            }))
          }
        />
        <SnackPremiumSelector
          selection={selection}
          onSelectSnack={(snackId) =>
            setSelection((prev) => ({
              ...prev,
              snackId,
              snackCantidad: snackId ? prev.snackCantidad : 0,
            }))
          }
          onSnackCantidad={(snackCantidad) =>
            setSelection((prev) => ({
              ...prev,
              snackCantidad,
            }))
          }
        />
        <PiqueosSelector
          selection={selection}
          onTogglePiqueo={(productoId, checked) =>
            setSelection((prev) => {
              if (!checked) {
                const nextQty = { ...prev.piqueosCantidades };
                delete nextQty[productoId];
                return {
                  ...prev,
                  piqueoIds: prev.piqueoIds.filter((id) => id !== productoId),
                  piqueosCantidades: nextQty,
                };
              }
              return {
                ...prev,
                piqueoIds: [...prev.piqueoIds, productoId],
                piqueosCantidades: { ...prev.piqueosCantidades, [productoId]: 1 },
              };
            })
          }
          onCantidadPiqueo={(productoId, cantidad) =>
            setSelection((prev) => ({
              ...prev,
              piqueosCantidades: {
                ...prev.piqueosCantidades,
                [productoId]: Math.max(1, cantidad),
              },
            }))
          }
        />
        <Shows
          selectionMode={selectionModes.shows}
          selectedShowIds={selection.showIds}
          paquete={selection.paquete}
          onToggleShow={(showId, checked) =>
            setSelection((prev) =>
              toggleCatalogSelection(prev, 'showIds', 'showCantidades', showId, checked, selectionModes.shows, 1),
            )
          }
        />
        <Catering
          selectionMode={selectionModes.catering}
          selectedCateringIds={selection.cateringIds}
          onToggleCatering={(cateringId, checked) =>
            setSelection((prev) => {
              const producto = data?.productos.catering?.find((p) => p.id === cateringId);
              const minQty = minimoUnidadesCatering(producto, minimoCatering);
              return toggleCatalogSelection(
                prev,
                'cateringIds',
                'cateringCantidades',
                cateringId,
                checked,
                selectionModes.catering,
                minQty,
              );
            })
          }
        />
        <Extras
          selectionMode={selectionModes.extras}
          selectedExtraIds={selection.extraIds}
          extraCantidades={selection.extraCantidades}
          onToggleExtra={(extraId, checked) =>
            setSelection((prev) =>
              toggleCatalogSelection(prev, 'extraIds', 'extraCantidades', extraId, checked, selectionModes.extras, 1),
            )
          }
          onCantidadExtra={(extraId, cantidad) =>
            setSelection((prev) => ({
              ...prev,
              extraCantidades: {
                ...prev.extraCantidades,
                [extraId]: Math.max(1, cantidad),
              },
            }))
          }
        />
        <QuoteForm
          selection={selection}
          onSelectionChange={setSelection}
          onFechaChange={setFechaPreview}
          onEstimadoChange={setEstimado}
        />
        <Faq />
      </main>
      <Footer />
      <ResumenFlotante estimado={estimado} />
    </>
  );
}
