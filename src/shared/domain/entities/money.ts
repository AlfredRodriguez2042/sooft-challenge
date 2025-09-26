import { z } from 'zod';
import { DomainError } from './errors';

const MoneySchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export class Money {
  private constructor(
    readonly amountMinor: number,
    readonly currency: string,
  ) {}
  static ofMinor(amountMinor: number, currency: string): Money {
    const p = MoneySchema.safeParse({ amountMinor, currency });
    if (!p.success) throw new DomainError('InvalidMoney', p.error.message);
    const { amountMinor: a, currency: c } = p.data;
    return new Money(a, c);
  }
  static fromDecimal(
    amount: string | number,
    currency: string,
    decimals = 2,
  ): Money {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0)
      throw new DomainError('InvalidMoney', 'amount inválido');
    return Money.ofMinor(Math.round(n * 10 ** decimals), currency);
  }
}
