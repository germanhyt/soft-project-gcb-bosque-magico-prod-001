import { useMemo, useState } from 'react';
import { Seo } from '../components/Seo';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { homeJsonLd } from '../constants/seo';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { QuoteForm } from '../components/cotizador/QuoteForm';
import { Beneficios } from '../components/sections/Beneficios';
import { Catering } from '../components/sections/Catering';
import { Extras } from '../components/sections/Extras';
import { Faq } from '../components/sections/Faq';
import { Hero } from '../components/sections/Hero';
import { Paquetes } from '../components/sections/Paquetes';
import { Shows } from '../components/sections/Shows';
import { INITIAL_QUOTE_SELECTION, type QuoteBuilderSelection } from '../types/quote-builder';
import { getSelectionMode, SELECTION_MODE_KEYS } from '../lib/selection-mode';
import { toggleCatalogSelection } from '../lib/toggle-catalog-selection';

function getMinimoCatering(items: { clave: string; valor: unknown }[] | undefined) {
  const minimo = items?.find((item) => item.clave === 'catering.minimo_unidades')?.valor;
  return typeof minimo === 'number' && minimo > 0 ? minimo : 18;
}

export function HomePage() {
  const [selection, setSelection] = useState<QuoteBuilderSelection>(INITIAL_QUOTE_SELECTION);
  const { data } = useConfiguracion();
  const minimoCatering = useMemo(() => getMinimoCatering(data?.items), [data?.items]);
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
        <Paquetes
          selectedPaquete={selection.paquete}
          onSelectPaquete={(paquete) => setSelection((prev) => ({ ...prev, paquete }))}
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
              const minQty = Math.max(producto?.cantidadMinima ?? 1, minimoCatering);
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
        <QuoteForm selection={selection} onSelectionChange={setSelection} />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
