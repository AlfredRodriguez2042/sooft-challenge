import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Raw, Repository } from 'typeorm';
import { CompanyEntity } from '../../domain/entities/company';
import {
  ICompanyRepository,
  QueryPagination,
} from '../../domain/ports/company';
type Cursor = { v: string | number; id: string | number };
export const encodeCursor = (c: Cursor) =>
  Buffer.from(JSON.stringify(c)).toString('base64');
export const decodeCursor = (s: string): Cursor =>
  JSON.parse(Buffer.from(s, 'base64').toString('utf8')) as Cursor;

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repository: Repository<CompanyEntity>,
  ) {}
  async findAll(query: FindManyOptions) {
    return await this.repository.find(query);
  }
  async create(company: Partial<CompanyEntity>) {
    return await this.repository.save(this.repository.create(company));
  }
  async findAllJoined(query: QueryPagination) {
    const limit = +query.limit;
    const params: Record<string, any> = {
      from: new Date(query.from),
      to: new Date(query.to),
    };
    let expr = `${query.orderField} between :from and :to`;
    if (query.cursor) {
      const { v } = decodeCursor(query.cursor);
      params.v = new Date(v);
      const op = query.sortBy === 'DESC' ? '<' : '>';
      expr += ` and ${query.orderField} ${op} :v`;
    }
    // console.lo
    const where = {
      [query.orderField]: Raw(
        (alias) => expr.replaceAll(query.orderField, alias),
        params,
      ),
    };

    const rows = await this.findAll({
      where,
      take: limit + 1,
      order: { [query.orderField]: query.sortBy, id: query.sortBy },
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const last = items.at(-1);
    const nextCursor = hasNextPage
      ? encodeCursor({
          v: (last as CompanyEntity)[query.orderField] as string,
          id: (last as CompanyEntity).id,
        })
      : undefined;

    return { items, cursor: nextCursor, hasNextPage };
  }
}
