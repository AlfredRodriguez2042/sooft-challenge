import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { BalanceEntity } from '../../src/balances/infrastructure/persistence/entities/balance';
import { CompanyEntity } from '../../src/companies/domain/entities/company';
import { LedgerEntryEntity } from '../../src/transfers/domain/entities/ledger';
import { TransferEntity } from '../../src/transfers/domain/entities/transfers';

export async function createTestDataSource() {
  const ds = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [BalanceEntity, CompanyEntity, TransferEntity, LedgerEntryEntity],
    synchronize: true, // para tests: crea tablas desde las entidades
    logging: false,
  });
  await ds.initialize();
  return ds;
}

export async function closeTestDataSource(ds: DataSource) {
  if (ds && ds.isInitialized) await ds.destroy();
}
