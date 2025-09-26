import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalancesModule } from '../balances/balances.module';
import { CompanyModule } from '../companies/company.module';
import { TransferService } from './application/services/transfer';
import { LedgerEntryEntity } from './domain/entities/ledger';
import { TransferEntity } from './domain/entities/transfers';
import {
  TRANSFER_REPOSITORY,
  TRANSFER_REPOSITORY_UOW,
  TRANSFER_SERVICE,
} from './domain/ports/transfer';
import { TransferController } from './infrastructure/controllers/transfer';
import { TransferRepository } from './infrastructure/repositories/transfer';
import { UnitOfWork } from './infrastructure/repositories/unitOfWork';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransferEntity, LedgerEntryEntity]),
    CompanyModule,
    BalancesModule,
  ],
  controllers: [TransferController],
  providers: [
    { provide: TRANSFER_REPOSITORY, useClass: TransferRepository },
    { provide: TRANSFER_SERVICE, useClass: TransferService },
    { provide: TRANSFER_REPOSITORY_UOW, useClass: UnitOfWork },
  ],
})
export class TransferModule {}
