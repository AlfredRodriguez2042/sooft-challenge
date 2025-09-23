import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { HealthController } from './app.controller';
import { AppService } from './app.service';
import { BalancesModule } from './balances/balances.module';
import { CompanyModule } from './companies/company.module';
import { GlobalExceptionFilter } from './shared/filters/httpExceptionFilter';
import { CustomThrottlerGuard } from './shared/guards/customThrottleGuard';
import { TypeormShutdownService } from './shared/infrastructure/persistence/shutdown';
import { sqliteDataSource } from './shared/infrastructure/persistence/sqlite';
import { HttpInterceptor } from './shared/interceptors/httpInterceptor';
import { TransferModule } from './transfers/transfer.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(sqliteDataSource),
    CompanyModule,
    TransferModule,
    BalancesModule,
    TerminusModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default', // If name is not provided, the name is given as default
        ttl: minutes(1),
        limit: 100,
      },
    ]),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
          (req.headers['x-request-id'] as string) ?? crypto.randomUUID(),
      },
    }),
  ],
  controllers: [HealthController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: HttpInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    GlobalExceptionFilter,
    TypeormShutdownService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
