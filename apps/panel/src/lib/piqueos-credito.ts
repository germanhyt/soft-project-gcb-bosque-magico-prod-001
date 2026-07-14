/** Réplica de la lógica acumulada de composicion-paquete.resolver (credito_piqueos). */

export type EntradaPiqueoCredito = {
  precioPack: number;
  cantidadPacks: number;
};

export type ResumenPiqueosCredito = {
  valorSeleccionado: number;
  creditoUsado: number;
  excedente: number;
};

export function calcularResumenPiqueosCredito(
  entradas: EntradaPiqueoCredito[],
  creditoIncluido: number,
): ResumenPiqueosCredito {
  let valorSeleccionado = 0;

  for (const entrada of entradas) {
    for (let u = 0; u < entrada.cantidadPacks; u++) {
      valorSeleccionado += entrada.precioPack;
    }
  }

  const creditoUsado = Math.min(valorSeleccionado, creditoIncluido);
  const excedente = Math.max(0, valorSeleccionado - creditoIncluido);

  return { valorSeleccionado, creditoUsado, excedente };
}
