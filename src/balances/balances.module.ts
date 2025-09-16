import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceService } from './application/services/balance';
import { BALANCE_REPOSITORY, BALANCE_SERVICE } from './domain/ports/balance';

import { BalanceEntity } from './domain/entities/balance';
import { BalancesController } from './infrastructure/controllers/balance';
import { BalanceRepository } from './infrastructure/repositories/balance';

@Module({
  imports: [TypeOrmModule.forFeature([BalanceEntity])],
  controllers: [BalancesController],
  providers: [
    { provide: BALANCE_SERVICE, useClass: BalanceService },
    { provide: BALANCE_REPOSITORY, useClass: BalanceRepository },
  ],
})
export class BalancesModule {}
