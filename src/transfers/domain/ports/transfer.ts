import { TransferEntity } from '../entities/transfers';
export interface QueryPagination {
  from: string;
  to: string;
  orderField: string;
  cursor: string | undefined;
  sortBy: 'DESC' | 'ASC';
  limit: number;
}
export interface ITransferRepository {
  findAllTransfers: (query: QueryPagination) => Promise<TransferEntity[]>;
  create: (input: Partial<TransferEntity>) => Promise<any>;
}
export interface ITransferService {
  findAll: (query) => Promise<any[]>;
  create: (input: Partial<TransferEntity>) => Promise<any>;
}
export const TRANSFER_REPOSITORY = Symbol('TRANSFER_REPOSITORY');
export const TRANSFER_SERVICE = Symbol('TRANSFER_SERVICE');
