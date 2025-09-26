import { z } from 'zod';
import {
  CurrencyMismatchError,
  InactiveAccountError,
  InsufficientFundsError,
  InvalidPropsError,
} from '../../../shared/domain/entities/errors';
import { Money } from '../../../shared/domain/entities/money';

const AccountSchema = z.object({
  id: z.uuid(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  balance_minor: z.number().int().nonnegative(),
  active: z.boolean(),
  companyId: z.uuid(),
});
export type AccountProps = Readonly<z.infer<typeof AccountSchema>>;

export class BalanceAccount {
  private constructor(
    readonly id: string,
    readonly currency: string,
    private _balance_minor: number,
    private _active: boolean,
    readonly companyId: string,
  ) {}
  static create(props: AccountProps): BalanceAccount {
    const p = AccountSchema.safeParse(props);
    if (!p.success)
      throw new InvalidPropsError(
        p.error.issues.map((i) => i.message).join('; '),
      );
    const { id, currency, balance_minor, active, companyId } = p.data;
    return new BalanceAccount(id, currency, balance_minor, active, companyId);
  }
  get balanceMinor() {
    return this._balance_minor;
  }
  get active() {
    return this._active;
  }

  private assert(m: Money) {
    if (!this._active) throw new InactiveAccountError();
    if (this.currency !== m.currency) throw new CurrencyMismatchError();
  }
  debit(m: Money) {
    this.assert(m);
    if (this._balance_minor < m.amountMinor) throw new InsufficientFundsError();
    this._balance_minor -= m.amountMinor;
    return Object.freeze({
      accountId: this.id,
      kind: 'DEBIT',
      amount_minor: m.amountMinor,
      currency: m.currency,
    });
  }
  credit(m: Money) {
    this.assert(m);
    this._balance_minor += m.amountMinor;
    return Object.freeze({
      accountId: this.id,
      kind: 'CREDIT',
      amount_minor: m.amountMinor,
      currency: m.currency,
    });
  }
}
