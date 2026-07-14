import { useMemo, useState } from 'react';
import { Seo } from '../components/Seo';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { homeJsonLd } from '../constants/seo';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { QuoteForm } from '../components/cotizador/QuoteForm';
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
  type QuoteBuilderSelection,
} from '../types/quote-builder';
import { paquetesConfigDesdeItems } from '../lib/paquetes-config';
import { minimoCateringDesdeConfig, minimoUnidadesCatering } from '../lib/catering-minimo';
import { getSelectionMode, SELECTION_MODE_KEYS } from '../lib/selection-mode';
import { toggleCatalogSelection } from '../lib/toggle-catalog-selection';

export function HomePage() {
  const [selection, setSelection] = useState<QuoteBuilderSelection>(INITIAL_QUOTE_SELECTION);
  const [fechaPreview, setFechaPreview] = useState('');
  const { data } = useConfiguracion();
  const minimoCatering = useMemo(
    () => minimoCateringDesdeConfig(data?.items),
    [data?.items],
  );
  const paquetesConfig = useMemo(() => paquetesConfigDesdeItems(data?.items), [data?.items]);
  const selectionModes = useMemo(
    () => ({
      shows: getSelectionMode(data?.items, SELECTION_MODE_KEYS.shows, 'single'),
      catering: getSelectionMode(data?.items, SELECTION_MODE_KEYS.catering, 'multiple'),
      extras: getSelectionMode(data?.items, SELECTION_MODE_KEYS.extras, 'multiple'),
    }),
    [data?.items],
  );

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
            setSelection((prev) => ({
              ...prev,
              paquete,
              cajitasCantidad: paquetesConfig.cajitasIncluidas,
              cajitasClasica: paquetesConfig.cajitasIncluidas,
              cajitasSaludable: 0,
              piqueoIds: [],
              piqueosCantidades: {},
              snackId: '',
              snackCantidad: paquetesConfig.snackPremiumUnidadesIncluidas,
            }))
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
              snackCantidad: snackId
                ? Math.max(prev.snackCantidad, paquetesConfig.snackPremiumUnidadesIncluidas)
                : paquetesConfig.snackPremiumUnidadesIncluidas,
            }))
          }
          onSnackCantidad={(snackCantidad) =>
            setSelection((prev) => ({
              ...prev,
              snackCantidad: Math.max(
                snackCantidad,
                paquetesConfig.snackPremiumUnidadesIncluidas,
              ),
            }))
          }
        />
        <PiqueosSelector
          selection={selection}
          fechaReferencia={fechaPreview}
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
          onToggleExtra={(extraId, checked) =>
            setSelection((prev) =>
              toggleCatalogSelection(prev, 'extraIds', 'extraCantidades', extraId, checked, selectionModes.extras, 1),
            )
          }
        />
        <QuoteForm
          selection={selection}
          onSelectionChange={setSelection}
          onFechaChange={setFechaPreview}
        />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
