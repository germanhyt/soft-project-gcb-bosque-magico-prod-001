import { Decimal } from '@prisma/client/runtime/library';

export function toDecimal(n: number): Decimal {
  return new Decimal(n.toFixed(2));
}

export function fromDecimal(d: Decimal | number | string): number {
  return Number(d);
}
