import { LambdaClient } from '@aws-sdk/client-lambda';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './application/services/company';
import { LambdaClientService } from './application/services/lambda';
import { CompanyEntity } from './domain/entities/company';
import { CompanySubscriber } from './domain/entities/suscriber';
import { COMPANY_REPOSITORY, COMPANY_SERVICE } from './domain/ports/company';
import { AWS_LAMBDA_ADAPTER, AWS_LAMBDA_SERVICE } from './domain/ports/lambda';
import { AWSLambdaAdapter } from './infrastructure/adapters/lambda';
import { CompanyController } from './infrastructure/controllers/company';
import { CompanyRepository } from './infrastructure/repositories/company';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [
    { provide: COMPANY_REPOSITORY, useClass: CompanyRepository },
    { provide: COMPANY_SERVICE, useClass: CompanyService },
    CompanySubscriber,
    {
      provide: LambdaClient,
      useFactory: (config: ConfigService) => {
        return new LambdaClient({
          region: config.get('NEST_AWS_REGION'),
          endpoint: config.get('NEST_AWS_ENDPOINT_URL'),
          maxAttempts: config.get('NEST_AWS_MAX_ATTEMPTS'),
          credentials: {
            accessKeyId: config.get('NEST_AWS_ACCESS_KEY_ID')!,
            secretAccessKey: config.get('NEST_AWS_SECRET_ACCESS_KEY')!,
          },
        });
      },
      inject: [ConfigService],
    },
    { provide: AWS_LAMBDA_ADAPTER, useClass: AWSLambdaAdapter },
    { provide: AWS_LAMBDA_SERVICE, useClass: LambdaClientService },
  ],
})
export class CompanyModule {}
