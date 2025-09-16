import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Raw, Repository } from 'typeorm';
import { isValidBase64 } from 'zod/v4/core';
import { TransfersQuery } from '../../application/dtos/transfer';
import { TransferEntity } from '../../domain/entities/transfers';
import { ITransferRepository } from '../../domain/ports/transfer';
type Cursor = { v: string | number; id: string | number };
export const encodeCursor = (c: Cursor) =>
  Buffer.from(JSON.stringify(c)).toString('base64');
export const decodeCursor = (s: string): Cursor =>
  JSON.parse(Buffer.from(s, 'base64').toString('utf8')) as Cursor;
const cursorParsers: Record<
  string,
  (v: string | number) => string | number | Date
> = {
  createdAt: (v) => new Date(v),
  amount_minor: (v) => Number(v),
};

export const parseCursorValue = (field: string, v: string | number) => {
  const parser = cursorParsers[field];
  return parser ? parser(v) : v;
};
@Injectable()
export class TransferRepository implements ITransferRepository {
  constructor(
    @InjectRepository(TransferEntity)
    private readonly repository: Repository<TransferEntity>,
  ) {}
  async findAll(query: FindManyOptions) {
    return await this.repository.find(query);
  }
  async create(company: Partial<TransferEntity>) {
    return await this.repository.save(this.repository.create(company));
  }
  async findAllTransfers(query: TransfersQuery) {
    const limit = +query.limit;
    const params: Record<string, any> = {
      from: new Date(query.from),
      to: new Date(query.to),
    };
    let expr = `createdAt between :from and :to`;
    if (query.cursor && isValidBase64(query.cursor)) {
      const { v, id } = decodeCursor(query.cursor);
      params.v = parseCursorValue(query.orderField, v);
      params.id = id ?? '00000000-0000-0000-0000-000000000000';
      const op = query.sortBy === 'DESC' ? '<' : '>';
      expr += ` and (${query.orderField} ${op} :v or (${query.orderField} = :v and id ${op} :id))`;
    }
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
          v: (last as TransferEntity)[query.orderField] as string,
          id: (last as TransferEntity).id,
        })
      : undefined;

    return { items, cursor: nextCursor, hasNextPage };
  }
}
