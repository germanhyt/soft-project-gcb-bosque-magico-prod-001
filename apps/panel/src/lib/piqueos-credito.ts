/** Réplica de la lógica atómica de composicion-paquete.resolver (credito_piqueos). */

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
  let creditoRestante = creditoIncluido;
  let valorSeleccionado = 0;
  let excedente = 0;
  let creditoUsado = 0;

  for (const entrada of entradas) {
    for (let u = 0; u < entrada.cantidadPacks; u++) {
      valorSeleccionado += entrada.precioPack;
      if (creditoRestante >= entrada.precioPack) {
        creditoRestante -= entrada.precioPack;
        creditoUsado += entrada.precioPack;
      } else {
        excedente += entrada.precioPack;
      }
    }
  }

  return { valorSeleccionado, creditoUsado, excedente };
}
