import { DataSource } from 'typeorm';
import { BalanceEntity } from '../../src/balances/domain/entities/balance';
import { CompanyEntity } from '../../src/companies/domain/entities/company';
import { TransferEntity } from '../../src/transfers/domain/entities/transfers';
interface Company {
  status: 'CREATED' | 'JOINED' | 'DISABLED';
  cuit: number;
  socialNumber: number;
}
export async function createCompany(ds: DataSource, company: Company) {
  const {
    cuit = 89_999_999,
    socialNumber = 9_000_000,
    status = 'JOINED',
  } = company;
  const repo = ds.getRepository(CompanyEntity);
  const c = repo.create({ cuit, socialNumber, status });
  return repo.save(c);
}

export async function createAccount(
  ds: DataSource,
  companyId: string,
  currency = 'ARS',
  balance_minor = 0,
  active = true,
) {
  const repo = ds.getRepository(BalanceEntity);
  const a = repo.create({ companyId, currency, balance_minor, active });
  return repo.save(a);
}
export async function createTransfer(
  ds: DataSource,
  data: Partial<TransferEntity>,
) {
  const repo = ds.getRepository(TransferEntity);
  return repo.save(
    repo.create({
      debitAccountId: data.debitAccountId!,
      creditAccountId: data.creditAccountId!,
      debitCompanyId: data.debitCompanyId!,
      creditCompanyId: data.creditCompanyId!,
      currency: data.currency ?? 'ARS',
      amount_minor: data.amount_minor ?? 100,
      status: data.status ?? 'COMPLETED',
      createdAt: data.createdAt ?? new Date(),
      idempotencyKey: data.idempotencyKey ?? null,
    }),
  );
}
