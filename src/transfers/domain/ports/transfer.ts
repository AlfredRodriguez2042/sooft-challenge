import { Repository } from 'typeorm';
import { IBalanceRepsoitory } from '../../../balances/domain/ports/balance';
import { TransferEntity } from '../entities/transfers';
import { LedgerEntry } from '../models/ledgerEntry';
export interface QueryPagination {
  from: string;
  to: string;
  orderField: string;
  cursor: string | undefined;
  sortBy: 'DESC' | 'ASC';
  limit: number;
}
export type FindCondition<T> = {
  [P in keyof T]?: T[P];
};
export interface ITransferRepository {
  findAllTransfers: (query: QueryPagination) => Promise<{
    items: TransferEntity[];
    cursor: string | undefined;
    hasNextPage: boolean;
  }>;
  create: (input: Partial<TransferRecord>) => Promise<TransferRecord>;
  update: (id: string, input: Partial<TransferRecord>) => Promise<void>;
  findOneBy: (
    input: FindCondition<TransferRecord>,
  ) => Promise<TransferRecord | null>;
}
export interface ITransferService {
  findAll: (query) => Promise<{
    items: TransferEntity[];
    cursor: string | undefined;
    hasNextPage: boolean;
  }>;
  create: (input: Partial<TransferEntity>) => Promise<TransferRecord>;
}
export interface TransferRecord {
  id: string;
  debitAccountId: string;
  creditAccountId: string;
  debitCompanyId: string;
  creditCompanyId: string;
  currency: string;
  amount_minor: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  idempotencyKey: string | null;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  metadata: any | null;
  createdAt?: Date;
}

export interface Repositories {
  balanceRepo: IBalanceRepsoitory;
  companiesRepo: Repository<{ id: string }>;
  transfersRepo: ITransferRepository;
  ledgerRepo: Repository<LedgerEntry>;
}

export interface IUnitOfWork {
  withTransaction<T>(
    level: 'SERIALIZABLE' | 'READ COMMITTED' | 'REPEATABLE READ',
    fn: (repos: Repositories) => Promise<T>,
  ): Promise<T>;
}
export const TRANSFER_REPOSITORY = Symbol('TRANSFER_REPOSITORY');
export const TRANSFER_SERVICE = Symbol('TRANSFER_SERVICE');
export const TRANSFER_REPOSITORY_UOW = Symbol('TRANSFER_REPOSITORY_UOW');
