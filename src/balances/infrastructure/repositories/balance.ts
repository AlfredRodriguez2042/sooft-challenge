import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { BalanceEntity } from '../../domain/entities/balance';
import { BalanceProps, IBalanceRepsoitory } from '../../domain/ports/balance';

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
}
