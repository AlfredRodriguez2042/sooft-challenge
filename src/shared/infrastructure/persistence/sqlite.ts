import { BalanceEntity } from 'src/balances/domain/entities/balance';
import { CompanyEntity } from 'src/companies/domain/entities/company';
import { LedgerEntryEntity } from 'src/transfers/domain/entities/ledger';
import { TransferEntity } from 'src/transfers/domain/entities/transfers';
import { DataSourceOptions } from 'typeorm';

export const sqliteDataSource: DataSourceOptions = {
  type: 'better-sqlite3',
  database: 'test.db',
  entities: [CompanyEntity, BalanceEntity, TransferEntity, LedgerEntryEntity],
  synchronize: true,
  dropSchema: false,
};
