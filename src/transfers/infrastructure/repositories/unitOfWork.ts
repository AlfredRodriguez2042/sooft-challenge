import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

import { BalanceEntity } from '../../../balances/infrastructure/persistence/entities/balance';
import { BalanceRepository } from '../../../balances/infrastructure/repositories/balance';
import { CompanyEntity } from '../../../companies/domain/entities/company';
import { LedgerEntryEntity } from '../../../transfers/domain/entities/ledger';
import { TransferEntity } from '../../../transfers/domain/entities/transfers';
import { Repositories } from '../../domain/ports/transfer';
import { TransferRepository } from './transfer';

@Injectable()
export class UnitOfWork {
  constructor(private readonly ds: DataSource) {}

  async withTransaction<T>(
    isolation: IsolationLevel = 'READ COMMITTED',
    fn: (repos: Repositories) => Promise<T>,
  ): Promise<T> {
    return this.ds.transaction(isolation, async (manager) => {
      const repos = this.repoFactory(manager);
      return fn(repos);
    });
  }

  private repoFactory(manager: import('typeorm').EntityManager) {
    const balanceRepo = new BalanceRepository(
      manager.getRepository(BalanceEntity),
    );
    const companiesRepo = manager.getRepository(CompanyEntity);
    const transfersRepo = new TransferRepository(
      manager.getRepository(TransferEntity),
    );
    const ledgerRepo = manager.getRepository(LedgerEntryEntity);
    return { balanceRepo, companiesRepo, transfersRepo, ledgerRepo };
  }
}
