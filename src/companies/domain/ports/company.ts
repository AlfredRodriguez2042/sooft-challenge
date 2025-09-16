import { FindManyOptions } from 'typeorm';
import { CompanyEntity } from '../entities/company';
export interface QueryPagination {
  from: string;
  to: string;
  orderField: string;
  cursor: string | undefined;
  sortBy: 'DESC' | 'ASC';
  limit: number;
}
export interface PaginationResponse {
  items: CompanyEntity[];
  cursor: string | undefined;
  hasNextPage: boolean;
}
export interface ICompanyRepository {
  findAll: (query: FindManyOptions<CompanyEntity>) => Promise<CompanyEntity[]>;
  findAllJoined: (query: QueryPagination) => Promise<PaginationResponse>;
  create: (input: Partial<CompanyEntity>) => Promise<void | CompanyEntity>;
}
export interface ICompanyService {
  findAll: (query) => Promise<PaginationResponse>;
  create: (input: Partial<CompanyEntity>) => Promise<void | CompanyEntity>;
}
export const COMPANY_REPOSITORY = Symbol('COMPANY_REPOSITORY');
export const COMPANY_SERVICE = Symbol('COMPANY_SERVICE');
