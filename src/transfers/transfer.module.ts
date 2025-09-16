import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyModule } from 'src/companies/company.module';
import { TransferService } from './application/services/transfer';
import { LedgerEntryEntity } from './domain/entities/ledger';
import { TransferEntity } from './domain/entities/transfers';
import { TRANSFER_REPOSITORY, TRANSFER_SERVICE } from './domain/ports/transfer';
import { TransferController } from './infrastructure/controllers/transfer';
import { TransferRepository } from './infrastructure/repositories/transfer';
import { UnitOfWork } from './infrastructure/repositories/unitOfWork';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransferEntity, LedgerEntryEntity]),
    CompanyModule,
  ],
  controllers: [TransferController],
  providers: [
    { provide: TRANSFER_REPOSITORY, useClass: TransferRepository },
    { provide: TRANSFER_SERVICE, useClass: TransferService },
    UnitOfWork,
  ],
})
export class TransferModule {}
