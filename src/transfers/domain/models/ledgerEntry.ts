export type LedgerKind = 'DEBIT' | 'CREDIT';
export type LedgerEntry = Readonly<{
  transferId: string;
  accountId: string;
  kind: LedgerKind;
  amount_minor: number;
  currency: string;
}>;
