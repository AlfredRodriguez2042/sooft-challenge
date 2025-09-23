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
  findAllTransfers: (query: QueryPagination) => Promise<{
    items: TransferEntity[];
    cursor: string | undefined;
    hasNextPage: boolean;
  }>;
  create: (input: Partial<TransferEntity>) => Promise<any>;
}
export interface ITransferService {
  findAll: (query) => Promise<{
    items: TransferEntity[];
    cursor: string | undefined;
    hasNextPage: boolean;
  }>;
  create: (input: Partial<TransferEntity>) => Promise<TransferEntity>;
}
export const TRANSFER_REPOSITORY = Symbol('TRANSFER_REPOSITORY');
export const TRANSFER_SERVICE = Symbol('TRANSFER_SERVICE');
