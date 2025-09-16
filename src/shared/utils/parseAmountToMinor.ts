import { BadRequestException } from '@nestjs/common';

export function parseAmountToMinor(amount: string, decimals = 2): number {
  if (!/^\d+(\.\d{1,4})?$/.test(amount)) {
    throw new BadRequestException('amount inválido (máx 4 decimales)');
  }
  const [int, frac = ''] = amount.split('.');
  const fracFixed = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const minor = BigInt(int) * BigInt(10 ** decimals) + BigInt(fracFixed);
  if (minor <= 0n) throw new BadRequestException('amount debe ser > 0');
  const n = Number(minor);
  if (!Number.isSafeInteger(n))
    throw new BadRequestException('amount fuera de rango');
  return n;
}
