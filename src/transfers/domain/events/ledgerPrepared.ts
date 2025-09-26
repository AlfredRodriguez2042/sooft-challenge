import { LedgerEntry } from '../models/ledgerEntry';
export class LedgerPreparedEvent {
  constructor(
    public readonly transferId: string | null,
    public readonly entries: ReadonlyArray<LedgerEntry>,
  ) {}
}
