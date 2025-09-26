import { TransferRecord } from '../ports/transfer';

export class TransferCreatedEvent {
  constructor(private readonly event: TransferRecord) {}
}
