export class CreateTransferCommand {
  constructor(
    public readonly debitAccountId: string,
    public readonly creditAccountId: string,
    public readonly amount: string | number,
    public readonly currency: string,
    public readonly metadata?: any,
    public readonly idempotencyKey?: string,
  ) {}
}
