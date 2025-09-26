import { AggregateRoot } from '@nestjs/cqrs';
import { TransferCompletedEvent } from '../events/transferCompleted';
import { TransferCreatedEvent } from '../events/transferCreated';
import { TransferRecord } from '../ports/transfer';

type TransferStatus = 'PENDING' | 'COMPLETED';

export class Transfer extends AggregateRoot {
  constructor() {
    super();
  }
  private _id: string | null = null;
  private _status: TransferStatus = 'PENDING';

  static create(transfer: TransferRecord): Transfer {
    const agg = new Transfer();
    agg.apply(new TransferCreatedEvent(transfer));
    agg._id = transfer.id;
    return agg;
  }

  public complete() {
    if (!this._id) throw new Error('Transfer ID no asignado aún.');
    if (this._status === 'COMPLETED') {
      return;
    }
    this._status = 'COMPLETED';
    this.apply(new TransferCompletedEvent(this._id, 'COMPLETED'));
  }
  get status() {
    return this._status;
  }
}
