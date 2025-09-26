import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { BalanceAccount } from '../../domain/models/Balance';
import { BalanceProps, IBalanceRepsoitory } from '../../domain/ports/balance';
import { BalanceEntity } from '../persistence/entities/balance';

@Injectable()
export class BalanceRepository implements IBalanceRepsoitory {
  constructor(
    @InjectRepository(BalanceEntity)
    private readonly repository: Repository<BalanceEntity>,
  ) {}
  async create(payload: Omit<BalanceProps, 'id'>): Promise<BalanceProps> {
    return this.repository.save(this.repository.create(payload));
  }
  async findOne(
    query: FindOneOptions<BalanceEntity>,
  ): Promise<BalanceProps | null> {
    return await this.repository.findOne(query);
  }
  async findOneBy(
    query: FindOptionsWhere<BalanceEntity>,
  ): Promise<BalanceAccount | null> {
    const balance = await this.repository.findOneBy(query);
    if (!balance) return null;
    return BalanceAccount.create(balance);
  }
  async debitIfSufficient(
    id: string,
    amount_minor: number,
    currency: string,
  ): Promise<boolean> {
    const res: any[] = await this.repository.query(
      `UPDATE balance
         SET balance_minor = balance_minor - ?
       WHERE id = ?
         AND active = 1
         AND currency = ?
         AND balance_minor >= ?
       RETURNING id`,
      [amount_minor, id, currency, amount_minor],
    );
    return res.length === 1;
  }
  async creditIfActive(
    id: string,
    amount_minor: number,
    currency: string,
  ): Promise<boolean> {
    const res: any[] = await this.repository.query(
      `UPDATE balance
         SET balance_minor = balance_minor + ?
       WHERE id = ?
         AND active = 1
         AND currency = ?
       RETURNING id`,
      [amount_minor, id, currency],
    );
    return res.length === 1;
  }
}
