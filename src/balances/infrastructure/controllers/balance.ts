import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import {
  CreateBalanceDto,
  createBalanceSchema,
  CreateBalanceSwaggerDto,
} from 'src/balances/application/dtos/balance';
import {
  BALANCE_SERVICE,
  IBalanceService,
} from 'src/balances/domain/ports/balance';
import { ZodValidationPipe } from 'src/shared/pipes/zodValidation';

@Controller('balances')
export class BalancesController {
  constructor(
    @Inject(BALANCE_SERVICE) private readonly service: IBalanceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create initial balance for a company account' })
  @ApiCreatedResponse({ description: 'Balance created' })
  @ApiBody({ type: CreateBalanceSwaggerDto })
  async create(
    @Body(new ZodValidationPipe(createBalanceSchema)) payload: CreateBalanceDto,
  ) {
    return await this.service.create(payload);
  }
}
