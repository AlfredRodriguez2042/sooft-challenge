export class TransferCompletedEvent {
  constructor(
    public readonly transferId: string,
    public readonly status: 'COMPLETED',
  ) {}
}
