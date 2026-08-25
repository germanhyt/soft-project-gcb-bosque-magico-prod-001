export type TipoItemContrato = 'show' | 'catering' | 'extra' | 'manual';

export type ContratoPrintItem = {
  id: string;
  tipo: TipoItemContrato | string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type PaqueteTipo = 'basico' | 'estandar' | 'premium' | 'personalizado' | null;

const TIPO_LABEL: Record<TipoItemContrato, string> = {
  show: 'Show',
  catering: 'Catering',
  extra: 'Servicios adicionales',
  manual: 'Otros servicios',
};

export function normTexto(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function paqueteTipo(paquete: string | null): PaqueteTipo {
  if (!paquete) return null;
  const n = normTexto(paquete);
  if (n.includes('personal')) return 'personalizado';
  if (n.includes('basic')) return 'basico';
  if (n.includes('standar') || n.includes('estandar')) return 'estandar';
  if (n.includes('premiu')) return 'premium';
  return null;
}

/** Etiqueta legible en contrato (alineada al PDF físico donde aplica). */
export function nombreEnContrato(nombre: string): string {
  const n = normTexto(nombre);
  if (n.includes('anfitrion')) return 'Asistente de eventos';
  return nombre;
}

export function esCarritoOSnack(nombre: string) {
  const n = normTexto(nombre);
  return (
    n.includes('carrito') ||
    n.includes('snack') ||
    n.includes('popcorn') ||
    n.includes('algodon') ||
    n.includes('algodón')
  );
}

export function esCajita(nombre: string) {
  return normTexto(nombre).includes('cajita');
}

export function agruparItemsPorTipo(items: ContratoPrintItem[]) {
  const orden: TipoItemContrato[] = ['show', 'catering', 'extra', 'manual'];
  const map = new Map<TipoItemContrato, ContratoPrintItem[]>();
  for (const item of items) {
    const tipo = (item.tipo as TipoItemContrato) || 'manual';
    const lista = map.get(tipo) ?? [];
    lista.push(item);
    map.set(tipo, lista);
  }
  return orden
    .filter((t) => (map.get(t)?.length ?? 0) > 0)
    .map((tipo) => ({
      tipo,
      label: TIPO_LABEL[tipo],
      items: map.get(tipo)!,
    }));
}

export function itemsExtras(items: ContratoPrintItem[]) {
  return items.filter((i) => i.tipo === 'extra');
}

export function itemsSnacks(items: ContratoPrintItem[]) {
  return items.filter((i) => i.tipo === 'catering' && esCarritoOSnack(i.nombre));
}

export function itemsCajitas(items: ContratoPrintItem[]) {
  return items.filter((i) => i.tipo === 'catering' && esCajita(i.nombre));
}

export function itemsCateringTematico(items: ContratoPrintItem[]) {
  return items.filter(
    (i) => i.tipo === 'catering' && !esCarritoOSnack(i.nombre) && !esCajita(i.nombre),
  );
}
