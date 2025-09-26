import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import {
  DomainError,
  InsufficientFundsError,
} from '../../../../shared/domain/entities/errors';
import { Money } from '../../../../shared/domain/entities/money';
import { Transfer } from '../../../domain/aggregates/transfer';
import { TransferDraft } from '../../../domain/aggregates/transferDraft';
import { IUnitOfWork } from '../../../domain/ports/transfer';
import { CreateTransferCommand } from '../createTransferCommand';

@CommandHandler(CreateTransferCommand)
export class CreateTransferHandler
  implements ICommandHandler<CreateTransferCommand>
{
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(cmd: CreateTransferCommand) {
    const money = Money.fromDecimal(cmd.amount, cmd.currency);

    return this.uow.withTransaction(
      'SERIALIZABLE',
      async ({ balanceRepo, transfersRepo, ledgerRepo }) => {
        if (cmd.idempotencyKey) {
          const prev = await transfersRepo.findOneBy({
            idempotencyKey: cmd.idempotencyKey,
          });
          if (prev) return { id: prev.id, status: prev.status };
        }
        const [debit, credit] = await Promise.all([
          balanceRepo.findOneBy({ id: cmd.debitAccountId }),
          balanceRepo.findOneBy({ id: cmd.creditAccountId }),
        ]);
        if (!debit || !credit)
          throw new DomainError(
            'InvalidAccount',
            'Cuenta inexistente o inactiva',
          );
        const draft = TransferDraft.create({
          debit,
          credit,
          money,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          metadata: cmd.metadata,
        });
        const debitOk = await balanceRepo.debitIfSufficient(
          cmd.debitAccountId,
          money.amountMinor,
          cmd.currency,
        );
        if (!debitOk) throw new InsufficientFundsError();

        const creditOk = await balanceRepo.creditIfActive(
          cmd.creditAccountId,
          money.amountMinor,
          cmd.currency,
        );
        if (!creditOk) {
          throw new DomainError(
            'InvalidAccount',
            'Credit account is inactive or invalid',
          );
        }
        const transfer = await transfersRepo.create({
          ...draft.toTransfer(),
          idempotencyKey: cmd.idempotencyKey,
        });
        const agg = this.publisher.mergeObjectContext(
          Transfer.create(transfer),
        );

        await ledgerRepo.save(
          ledgerRepo.create(
            draft.ledger.map((el) => ({ ...el, transferId: transfer.id })),
          ),
        );
        agg.complete();

        await transfersRepo.update(transfer.id, { status: agg.status });

        // Publica eventos pendientes
        agg.commit();

        return { id: transfer.id, status: agg.status };
      },
    );
  }
}
