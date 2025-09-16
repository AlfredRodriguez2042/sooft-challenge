import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './app.controller';
import { AppService } from './app.service';
import { BalancesModule } from './balances/balances.module';
import { CompanyModule } from './companies/company.module';
import { TypeormShutdownService } from './shared/infrastructure/persistence/shutdown';
import { sqliteDataSource } from './shared/infrastructure/persistence/sqlite';
import { TransferModule } from './transfers/transfer.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(sqliteDataSource),
    CompanyModule,
    TransferModule,
    BalancesModule,
    TerminusModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [HealthController],
  providers: [AppService, TypeormShutdownService],
})
export class AppModule {}
