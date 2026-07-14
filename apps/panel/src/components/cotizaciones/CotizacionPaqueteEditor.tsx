import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CatalogoSection } from './CatalogoSection';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { previewCotizacion } from '../../lib/cotizaciones';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import { cantidadItemProducto } from '../../lib/producto-cotizacion';
import { etiquetaOrigenItem } from '../../lib/origen-item';
import { paquetesConfigDesdeItems } from '../../lib/paquetes-config';
import { calcularResumenPiqueosCredito } from '../../lib/piqueos-credito';
import {
  esPaquetePremium,
  seleccionToPayload,
  toggleIdEnLista,
  type SeleccionPaqueteState,
} from '../../lib/seleccion-paquete';

type CatalogoSplit = ReturnType<
  typeof import('../../lib/producto-cotizacion').productosParaCotizacion
>;

type Props = {
  paquete: string;
  fechaEvento: string;
  cantidadNinos: number;
  horasAdicionales: number;
  seleccion: SeleccionPaqueteState;
  onChange: (next: SeleccionPaqueteState) => void;
  catalogo: CatalogoSplit;
};

function formatSoles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

export function CotizacionPaqueteEditor({
  paquete,
  fechaEvento,
  cantidadNinos,
  horasAdicionales,
  seleccion,
  onChange,
  catalogo,
}: Props) {
  const esPremium = esPaquetePremium(paquete);
  const payload = useMemo(
    () => seleccionToPayload(seleccion, catalogo.catering),
    [seleccion, catalogo.catering],
  );

  const { data: configPanel } = useQuery({
    queryKey: ['configuracion-panel'],
    queryFn: fetchConfiguracionPanel,
    staleTime: 1000 * 60 * 5,
  });

  const paquetesConfig = useMemo(
    () => paquetesConfigDesdeItems(configPanel?.todas),
    [configPanel?.todas],
  );

  const preview = useQuery({
    queryKey: [
      'preview-cotizacion-panel',
      fechaEvento,
      cantidadNinos,
      horasAdicionales,
      paquete,
      JSON.stringify(payload),
    ],
    queryFn: () =>
      previewCotizacion({
        fechaEvento,
        cantidadNinos,
        horasAdicionales,
        paquete,
        seleccion: payload,
      }),
    enabled: Boolean(paquete && fechaEvento),
    retry: 0,
  });

  const esFinSemana = preview.data?.esFinSemana ?? false;

  const resumenPiqueosLocal = useMemo(() => {
    if (!esPremium) return null;
    const entradas = seleccion.piqueoIds.map((id) => {
      const p = catalogo.piqueos.find((x) => x.id === id);
      if (!p) return null;
      const precio = esFinSemana ? p.precioFinSemana : p.precioLunesViernes;
      return {
        precioPack: precio,
        cantidadPacks: Math.max(seleccion.piqueosCantidades[id] ?? 1, 1),
      };
    }).filter(Boolean) as Array<{ precioPack: number; cantidadPacks: number }>;
    return calcularResumenPiqueosCredito(entradas, paquetesConfig.piqueosCreditoPremium);
  }, [
    esPremium,
    seleccion.piqueoIds,
    seleccion.piqueosCantidades,
    catalogo.piqueos,
    esFinSemana,
    paquetesConfig.piqueosCreditoPremium,
  ]);

  const creditoUsadoPiqueos =
    preview.data?.resumenPaquete != null
      ? preview.data.resumenPaquete.piqueosValorSeleccionado -
        preview.data.resumenPaquete.piqueosExcedente
      : (resumenPiqueosLocal?.creditoUsado ?? 0);

  const excedentePiqueos =
    preview.data?.resumenPaquete?.piqueosExcedente ?? resumenPiqueosLocal?.excedente ?? 0;

  const cajitasTotal = Math.max(
    seleccion.cajitasCantidad,
    (seleccion.cajitasClasica ?? 0) + (seleccion.cajitasSaludable ?? 0),
  );
  const cajitasExcedente = Math.max(0, cajitasTotal - paquetesConfig.cajitasIncluidas);
  const costoCajitasExcedente = cajitasExcedente * paquetesConfig.cajitasPrecioExcedente;

  const patch = (partial: Partial<SeleccionPaqueteState>) =>
    onChange({ ...seleccion, ...partial });

  const toggleShow = (id: string) => {
    const activo = seleccion.showIds.includes(id);
    patch({ showIds: toggleIdEnLista(seleccion.showIds, id, !activo) });
  };

  const toggleExtra = (id: string) => {
    const activo = seleccion.extraIds.includes(id);
    patch({ extraIds: toggleIdEnLista(seleccion.extraIds, id, !activo) });
  };

  const togglePiqueo = (id: string) => {
    const activo = seleccion.piqueoIds.includes(id);
    const piqueoIds = toggleIdEnLista(seleccion.piqueoIds, id, !activo);
    const piqueosCantidades = { ...seleccion.piqueosCantidades };
    if (!activo) {
      const p = catalogo.piqueos.find((x) => x.id === id);
      piqueosCantidades[id] = cantidadItemProducto(p!, piqueosCantidades);
    } else {
      delete piqueosCantidades[id];
    }
    patch({ piqueoIds, piqueosCantidades });
  };

  const toggleAdicional = (id: string) => {
    const activo = seleccion.adicionalIds.includes(id);
    const adicionalIds = toggleIdEnLista(seleccion.adicionalIds, id, !activo);
    const adicionalCantidades = { ...seleccion.adicionalCantidades };
    if (!activo) {
      const p = catalogo.catering.find((x) => x.id === id);
      adicionalCantidades[id] = cantidadItemProducto(p!, adicionalCantidades);
    } else {
      delete adicionalCantidades[id];
    }
    patch({ adicionalIds, adicionalCantidades });
  };

  if (!paquete) {
    return (
      <p className="text-body-sm text-on-surface-variant">
        Selecciona un paquete para configurar inclusiones y complementos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary-fixed/15 p-4">
        <p className="text-body-sm font-semibold text-primary">Configura tu cotización manual</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          1) Define cajitas y snack, 2) ajusta piqueos, 3) agrega shows/extras/catering adicional.
          El servidor recalcula crédito y excedentes al guardar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL_CLASS}>Cajitas clásicas</span>
          <input
            type="number"
            min={0}
            className={INPUT_CLASS}
            value={seleccion.cajitasClasica}
            onChange={(e) => {
              const clasica = Math.max(0, Number(e.target.value) || 0);
              const saludable = seleccion.cajitasSaludable;
              patch({
                cajitasClasica: clasica,
                cajitasCantidad: Math.max(paquetesConfig.cajitasIncluidas, clasica + saludable),
              });
            }}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Cajitas saludables</span>
          <input
            type="number"
            min={0}
            className={INPUT_CLASS}
            value={seleccion.cajitasSaludable}
            onChange={(e) => {
              const saludable = Math.max(0, Number(e.target.value) || 0);
              const clasica = seleccion.cajitasClasica;
              patch({
                cajitasSaludable: saludable,
                cajitasCantidad: Math.max(paquetesConfig.cajitasIncluidas, clasica + saludable),
              });
            }}
          />
        </label>
        <div className="sm:col-span-2">
          <span className="text-xs text-on-surface-variant">
            Total cajitas: <strong>{cajitasTotal}</strong> · {paquetesConfig.cajitasIncluidas} incluidas
            {cajitasExcedente > 0
              ? ` · ${cajitasExcedente} adicional(es) × ${formatSoles(paquetesConfig.cajitasPrecioExcedente)} = ${formatSoles(costoCajitasExcedente)}`
              : ''}
          </span>
        </div>
      </div>

      {esPremium && catalogo.snacks.length > 0 && (
        <div>
          <p className={LABEL_CLASS}>Snack incluido (Premium)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {catalogo.snacks.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  patch({
                    snackId: seleccion.snackId === s.id ? '' : s.id,
                    snackCantidad:
                      seleccion.snackId === s.id
                        ? paquetesConfig.snackPremiumUnidadesIncluidas
                        : Math.max(
                            seleccion.snackCantidad,
                            paquetesConfig.snackPremiumUnidadesIncluidas,
                          ),
                  })
                }
                className={`rounded-lg border px-3 py-2 text-sm ${
                  seleccion.snackId === s.id
                    ? 'border-primary bg-primary-fixed/30 font-semibold text-primary'
                    : 'border-outline-variant'
                }`}
              >
                {s.nombre}
              </button>
            ))}
          </div>
          {seleccion.snackId && (
            <label className="mt-3 block max-w-xs">
              <span className={LABEL_CLASS}>Unidades snack (carrito Premium)</span>
              <input
                type="number"
                min={paquetesConfig.snackPremiumUnidadesIncluidas}
                className={INPUT_CLASS}
                value={Math.max(seleccion.snackCantidad, paquetesConfig.snackPremiumUnidadesIncluidas)}
                onChange={(e) =>
                  patch({
                    snackCantidad: Math.max(
                      Number(e.target.value) || paquetesConfig.snackPremiumUnidadesIncluidas,
                      paquetesConfig.snackPremiumUnidadesIncluidas,
                    ),
                  })
                }
              />
              <span className="mt-1 block text-xs text-on-surface-variant">
                Incluye {paquetesConfig.snackPremiumUnidadesIncluidas} unidades; excedente S/ {paquetesConfig.snackPremiumPrecioExcedente} por unidad adicional.
              </span>
            </label>
          )}
        </div>
      )}

      {esPremium && catalogo.piqueos.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className={LABEL_CLASS}>
              Piqueos Premium (crédito {formatSoles(paquetesConfig.piqueosCreditoPremium)})
            </p>
            {resumenPiqueosLocal != null && (
              <span className="text-xs text-on-surface-variant">
                Crédito usado: {formatSoles(creditoUsadoPiqueos)} /{' '}
                {formatSoles(paquetesConfig.piqueosCreditoPremium)}
                {excedentePiqueos > 0 && <> · excedente {formatSoles(excedentePiqueos)}</>}
              </span>
            )}
          </div>
          <CatalogoSection
            titulo=""
            productos={catalogo.piqueos.slice(0, 24)}
            selectedIds={seleccion.piqueoIds}
            cantidades={seleccion.piqueosCantidades}
            onToggle={togglePiqueo}
            onCantidad={(id, qty) =>
              patch({
                piqueosCantidades: { ...seleccion.piqueosCantidades, [id]: qty },
              })
            }
          />
          {catalogo.piqueos.length > 24 && (
            <p className="mt-1 text-xs text-outline">
              Mostrando 24 de {catalogo.piqueos.length} piqueos. Usa catálogo para el resto.
            </p>
          )}
        </div>
      )}

      <CatalogoSection
        titulo="Shows (1.º incluido en Estándar/Premium; adicionales a precio completo)"
        productos={catalogo.shows}
        selectedIds={seleccion.showIds}
        cantidades={{}}
        onToggle={toggleShow}
        onCantidad={() => {}}
      />

      <CatalogoSection
        titulo="Servicios extra (1.º incluido en todos los paquetes)"
        productos={catalogo.extras}
        selectedIds={seleccion.extraIds}
        cantidades={{}}
        onToggle={toggleExtra}
        onCantidad={() => {}}
      />

      <div className="rounded-xl border border-outline-variant/50 p-4">
        <p className={LABEL_CLASS}>Extras institucionales cobrables</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Lounge y derechos de ingreso externos. Tarifas desde Configuración.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-on-surface-variant">
              Salita lounge (8 pax)
              {configPanel?.todas
                ? ` · S/ ${Number(
                    configPanel.todas.find((c) => c.clave === 'extras.salita_lounge')?.valor ?? 50,
                  ).toFixed(0)} / uni.`
                : ''}
            </span>
            <input
              type="number"
              min={0}
              className={INPUT_CLASS}
              value={seleccion.salitaLoungeCantidad}
              onChange={(e) =>
                patch({ salitaLoungeCantidad: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </label>
          <div className="space-y-2 sm:col-span-2">
            {(
              [
                {
                  key: 'derechoIngresoShowExterno' as const,
                  label: 'Derecho ingreso show externo',
                  clave: 'extras.ingreso_show_externo',
                  def: 300,
                },
                {
                  key: 'derechoIngresoDecoracionExterno' as const,
                  label: 'Derecho ingreso decoración externo',
                  clave: 'extras.ingreso_decoracion_externo',
                  def: 100,
                },
                {
                  key: 'derechoIngresoCarritoSnackExterno' as const,
                  label: 'Derecho ingreso carrito snack externo',
                  clave: 'extras.ingreso_carrito_snack_externo',
                  def: 300,
                },
              ] as const
            ).map((opt) => {
              const precio = Number(
                configPanel?.todas.find((c) => c.clave === opt.clave)?.valor ?? opt.def,
              );
              return (
                <label key={opt.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={seleccion[opt.key]}
                    onChange={(e) => patch({ [opt.key]: e.target.checked })}
                  />
                  <span>
                    {opt.label}
                    <span className="text-on-surface-variant"> · S/ {precio.toFixed(0)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <CatalogoSection
        titulo="Catering adicional (fuera del paquete)"
        productos={catalogo.catering}
        selectedIds={seleccion.adicionalIds}
        cantidades={seleccion.adicionalCantidades}
        onToggle={toggleAdicional}
        onCantidad={(id, qty) =>
          patch({ adicionalCantidades: { ...seleccion.adicionalCantidades, [id]: qty } })
        }
      />

      {fechaEvento && (
        <div className="rounded-xl border border-surface-variant bg-surface-container-low/80 p-4">
          <p className="font-semibold text-primary">Vista previa de montos</p>
          {preview.isLoading && (
            <p className="mt-2 text-sm text-outline">Calculando…</p>
          )}
          {preview.isError && (
            <p className="mt-2 text-sm text-error">No se pudo calcular la vista previa.</p>
          )}
          {preview.data && (
            <>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Base paquete</dt>
                  <dd className="font-semibold">{formatSoles(preview.data.montos.base)}</dd>
                </div>
                {preview.data.montos.ninosExtra > 0 && (
                  <div className="flex justify-between">
                    <dt>Cargos por capacidad</dt>
                    <dd className="font-semibold">{formatSoles(preview.data.montos.ninosExtra)}</dd>
                  </div>
                )}
                {preview.data.montos.items > 0 && (
                  <div className="flex justify-between">
                    <dt>Excedentes y adicionales</dt>
                    <dd className="font-semibold">{formatSoles(preview.data.montos.items)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-outline-variant/40 pt-2 text-base">
                  <dt className="font-bold text-primary">Total estimado</dt>
                  <dd className="font-bold text-primary">{formatSoles(preview.data.montos.total)}</dd>
                </div>
              </dl>
              {preview.data.items.length > 0 && (
                <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
                  {preview.data.items.map((item, i) => {
                    const producto = item.productoId
                      ? catalogo.piqueos.find((p) => p.id === item.productoId) ??
                        catalogo.catering.find((p) => p.id === item.productoId) ??
                        catalogo.shows.find((p) => p.id === item.productoId) ??
                        catalogo.extras.find((p) => p.id === item.productoId) ??
                        catalogo.cajitas.find((p) => p.id === item.productoId) ??
                        catalogo.snacks.find((p) => p.id === item.productoId)
                      : undefined;
                    const origen = etiquetaOrigenItem(item.origenItem);
                    const esPiqueo = producto?.subtipo === 'piqueo';
                    const uds = producto?.unidadesPack ?? 1;
                    const cantidadLabel = esPiqueo
                      ? item.cantidad === 1
                        ? `1 pack (${uds} uds)`
                        : `${item.cantidad} packs`
                      : `×${item.cantidad}`;

                    return (
                      <li
                        key={`${item.nombre}-${item.origenItem}-${i}`}
                        className="flex justify-between gap-2 text-on-surface-variant"
                      >
                        <span>
                          {item.nombre} {cantidadLabel}
                          {origen && (
                            <span
                              className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                item.origenItem === 'incluido_paquete'
                                  ? 'bg-primary-fixed/40 text-primary'
                                  : item.origenItem === 'excedente_paquete'
                                    ? 'bg-tertiary-fixed/50 text-tertiary'
                                    : 'bg-surface-container-high text-outline'
                              }`}
                            >
                              {origen}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0">
                          {item.precioUnitario <= 0 ? '—' : formatSoles(item.subtotal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
