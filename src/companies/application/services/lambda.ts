import { Inject, Injectable } from '@nestjs/common';
import {
  AWS_LAMBDA_ADAPTER,
  IAwsLambda,
  ILambdaClientService,
} from 'src/companies/domain/ports/lambda';
import { CreateCompanyDto } from '../dtos/company';

@Injectable()
export class LambdaClientService implements ILambdaClientService {
  constructor(
    @Inject(AWS_LAMBDA_ADAPTER) private readonly lambda: IAwsLambda,
  ) {}
  async execute(input: CreateCompanyDto) {
    return this.lambda.invoke({
      functionName: 'create-company',
      payload: input,
    });
  }
}
