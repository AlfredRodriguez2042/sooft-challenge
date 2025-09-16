import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

import { BalanceEntity } from 'src/balances/domain/entities/balance';
import { CompanyEntity } from 'src/companies/domain/entities/company';
import { LedgerEntryEntity } from 'src/transfers/domain/entities/ledger';
import { TransferEntity } from 'src/transfers/domain/entities/transfers';

interface Repositories {
  balanceRepo: Repository<BalanceEntity>;
  companiesRepo: Repository<CompanyEntity>;
  transfersRepo: Repository<TransferEntity>;
  ledgerRepo: Repository<LedgerEntryEntity>;
}
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
    const balanceRepo = manager.getRepository(BalanceEntity);
    const companiesRepo = manager.getRepository(CompanyEntity);
    const transfersRepo = manager.getRepository(TransferEntity);
    const ledgerRepo = manager.getRepository(LedgerEntryEntity);

    return { balanceRepo, companiesRepo, transfersRepo, ledgerRepo };
  }
}
