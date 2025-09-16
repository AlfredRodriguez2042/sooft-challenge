import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { parseAmountToMinor } from 'src/shared/utils/parseAmountToMinor';
import { ITransferService } from 'src/transfers/domain/ports/transfer';
import { UnitOfWork } from 'src/transfers/infrastructure/repositories/unitOfWork';
import { QueryPagination } from '../../domain/ports/transfer';
import { CreateTransferDto } from '../dtos/transfer';
import {
  ITransferRepository,
  TRANSFER_REPOSITORY,
} from './../../domain/ports/transfer';

@Injectable()
export class TransferService implements ITransferService {
  private readonly logger = new Logger(TransferService.name);
  constructor(
    @Inject(TRANSFER_REPOSITORY)
    private readonly repository: ITransferRepository,
    private readonly transactionalRepository: UnitOfWork,
  ) {}
  async findAll(query: QueryPagination) {
    this.logger.debug(
      `Finding companies transfers with query=${JSON.stringify(query)}`,
    );
    const res = await this.repository.findAllTransfers(query);
    this.logger.log(
      `Found ${res?.length ?? 0} transfers ( limit=${query.limit})`,
    );
    return res;
  }
  async create(input: CreateTransferDto) {
    this.logger.debug(`Init create transfer payload: ${JSON.stringify(input)}`);
    const amountMinor = parseAmountToMinor(String(input.amount), 2);
    this.logger.debug(`parsed amountMinor: ${amountMinor}`);
    return this.transactionalRepository.withTransaction(
      'SERIALIZABLE',
      async (repo) => {
        if (input.idempotencyKey) {
          this.logger.debug(`Checking idempotencyKey: ${input.idempotencyKey}`);
          const prev = await repo.transfersRepo.findOneBy({
            idempotencyKey: input.idempotencyKey,
          });
          if (prev) {
            this.logger.warn(
              `Idempotency hit, returning existing transfer: ${prev.id}`,
            );
            return prev;
          }
        }
        this.logger.debug(
          `Fetching accounts: debit=${input.debitAccountId}, credit=${input.creditAccountId}`,
        );
        const [debitAccount, creditAccount] = await Promise.all([
          repo.balanceRepo.findOneBy({ id: input.debitAccountId }),
          repo.balanceRepo.findOneBy({ id: input.creditAccountId }),
        ]);

        if (
          !debitAccount ||
          !creditAccount ||
          !debitAccount.active ||
          !creditAccount.active
        ) {
          this.logger.warn(
            `Invalid or inactive accounts: debit=${JSON.stringify(debitAccount)}, credit=${JSON.stringify(creditAccount)}`,
          );
          throw new BadRequestException('Cuenta inexistente o inactiva');
        }
        if (
          debitAccount.currency !== creditAccount.currency ||
          debitAccount.currency !== input.currency
        ) {
          this.logger.warn(
            `Currency mismatch: debit=${debitAccount.currency}, credit=${creditAccount.currency}, input=${input.currency}`,
          );
          throw new BadRequestException('Moneda incompatible');
        }
        this.logger.debug(`Debiting account ${input.debitAccountId}`);
        const debitRes: any[] = await repo.balanceRepo.query(
          `UPDATE balance
           SET balance_minor = balance_minor - ?
         WHERE id = ?
           AND active = 1
           AND currency = ?
           AND balance_minor >= ?
         RETURNING id`,
          [amountMinor, input.debitAccountId, input.currency, amountMinor],
        );
        if (debitRes.length !== 1) {
          this.logger.warn(`Debit failed for account ${input.debitAccountId}`);
          throw new BadRequestException(
            'Saldo insuficiente o cuenta débito inválida',
          );
        }
        this.logger.debug(`Crediting account ${input.creditAccountId}`);
        const creditRes: any[] = await repo.balanceRepo.query(
          `UPDATE balance
           SET balance_minor = balance_minor + ?
         WHERE id = ?
           AND active = 1
           AND currency = ?
         RETURNING id`,
          [amountMinor, input.creditAccountId, input.currency],
        );
        if (creditRes.length !== 1) {
          this.logger.warn(
            `Credit failed for account ${input.creditAccountId}`,
          );
          throw new BadRequestException('Cuenta crédito inválida');
        }
        this.logger.debug(`Saving transfer entity`);
        const transfer = await repo.transfersRepo.save(
          repo.transfersRepo.create({
            debitAccountId: input.debitAccountId,
            creditAccountId: input.creditAccountId,
            debitCompanyId: debitAccount.companyId,
            creditCompanyId: creditAccount.companyId,
            currency: input.currency,
            amount_minor: amountMinor,
            status: 'PENDING',
            idempotencyKey: input.idempotencyKey ?? null,
            metadata: input.metadata ?? null,
          }),
        );
        this.logger.debug(`Writing ledger entries for transfer ${transfer.id}`);
        await repo.ledgerRepo.save(
          repo.ledgerRepo.create([
            {
              transferId: transfer.id,
              accountId: transfer.debitAccountId,
              kind: 'DEBIT',
              amount_minor: amountMinor,
              currency: input.currency,
            },
            {
              transferId: transfer.id,
              accountId: transfer.creditAccountId,
              kind: 'CREDIT',
              amount_minor: amountMinor,
              currency: input.currency,
            },
          ]),
        );
        this.logger.debug(`Updating transfer ${transfer.id} to COMPLETED`);
        await repo.transfersRepo.update(
          { id: transfer.id },
          { status: 'COMPLETED' },
        );
        this.logger.log(
          `End create transfer success: ${JSON.stringify({ transferId: transfer.id, debit: transfer.debitAccountId, credit: transfer.creditAccountId, currency: transfer.currency, amount_minor: amountMinor })}`,
        );
        return { ...transfer, status: 'COMPLETED' as const };
      },
    );
  }
}
