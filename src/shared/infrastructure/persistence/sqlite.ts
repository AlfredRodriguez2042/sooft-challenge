import { DataSourceOptions } from 'typeorm';
import { BalanceEntity } from '../../../balances/infrastructure/persistence/entities/balance';
import { CompanyEntity } from '../../../companies/domain/entities/company';
import { LedgerEntryEntity } from '../../../transfers/domain/entities/ledger';
import { TransferEntity } from '../../../transfers/domain/entities/transfers';

export const sqliteDataSource: DataSourceOptions = {
  type: 'better-sqlite3',
  database: 'test.db',
  entities: [CompanyEntity, BalanceEntity, TransferEntity, LedgerEntryEntity],
  synchronize: true,
  dropSchema: false,
};
