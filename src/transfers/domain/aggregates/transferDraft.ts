import { BalanceAccount } from '../../../balances/domain/models/Balance';
import { CurrencyMismatchError } from '../../../shared/domain/entities/errors';
import { Money } from '../../../shared/domain/entities/money';
import { LedgerEntry } from '../models/ledgerEntry';

export class TransferDraft {
  private _ledger: LedgerEntry[] = [];
  private constructor(
    readonly debitAccountId: string,
    readonly creditAccountId: string,
    readonly debitCompanyId: string,
    readonly creditCompanyId: string,
    readonly currency: string,
    readonly amount_minor: number,
    readonly metadata?: any,
  ) {}

  static create(args: {
    debit: BalanceAccount;
    credit: BalanceAccount;
    money: Money;
    metadata?: any;
  }): TransferDraft {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { debit, credit, money, metadata } = args;

    if (
      debit.currency !== credit.currency ||
      debit.currency !== money.currency
    ) {
      throw new CurrencyMismatchError();
    }

    // Reglas y efectos en memoria
    const ld = debit.debit(money);
    const lc = credit.credit(money);
    const agg = new TransferDraft(
      debit.id,
      credit.id,
      debit.companyId,
      credit.companyId,
      money.currency,
      money.amountMinor,
      metadata,
    );
    agg._ledger.push(ld as LedgerEntry, lc as LedgerEntry);
    return agg;
  }

  // Materializa el aggregate con id y publica eventos
  //   create(id: string): Transfer {
  //     return Transfer.createFromDraft(id, this);
  //   }

  // acceso para persistencia PENDING
  toTransfer() {
    return {
      debitAccountId: this.debitAccountId,
      creditAccountId: this.creditAccountId,
      debitCompanyId: this.debitCompanyId,
      creditCompanyId: this.creditCompanyId,
      currency: this.currency,
      amount_minor: this.amount_minor,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      metadata: this.metadata,
    };
  }
  get ledger(): LedgerEntry[] {
    return this._ledger;
  }
}
