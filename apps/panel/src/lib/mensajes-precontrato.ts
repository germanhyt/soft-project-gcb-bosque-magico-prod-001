export type AdelantosPrecontrato = {
  adelanto1Monto: number;
  adelanto1Fecha: string;
  adelanto2Monto?: number;
  adelanto2Fecha?: string;
};

function fechaCorta(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

function soles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export function asuntoCorreoPrecontrato(codigo: string) {
  return `Precontrato de reserva ${codigo} - Bosque Mágico`;
}

export function mensajePrecontrato(input: AdelantosPrecontrato & {
  nombreCompleto: string;
  codigo: string;
  montoTotal: number;
  link: string;
}) {
  const segundo =
    (input.adelanto2Monto ?? 0) > 0
      ? `\nAdelanto 2: ${soles(input.adelanto2Monto ?? 0)} · ${fechaCorta(input.adelanto2Fecha ?? '')}`
      : '';
  return (
    `Hola ${input.nombreCompleto},\n\n` +
    `Te compartimos el precontrato de reserva de Bosque Mágico (${input.codigo}).\n\n` +
    `Total cotizado: ${soles(input.montoTotal)}\n` +
    `Adelanto 1: ${soles(input.adelanto1Monto)} · ${fechaCorta(input.adelanto1Fecha)}` +
    segundo +
    `\n\nLa reserva queda sujeta al pago del adelanto. No confirma el evento.\n\n` +
    `Ver documento:\n${input.link}\n\n` +
    `Saludos cordiales,\nEquipo Bosque Mágico`
  );
}

export function textoAdelantosGuardados(input: AdelantosPrecontrato) {
  const primero = `Adelanto de reserva guardado: ${soles(input.adelanto1Monto)} · ${fechaCorta(input.adelanto1Fecha)}.`;
  const segundo =
    (input.adelanto2Monto ?? 0) > 0
      ? ` Segundo adelanto: ${soles(input.adelanto2Monto ?? 0)} · ${fechaCorta(input.adelanto2Fecha ?? '')}.`
      : '';
  return `${primero}${segundo} Al aceptar, el contrato lo toma.`;
}
