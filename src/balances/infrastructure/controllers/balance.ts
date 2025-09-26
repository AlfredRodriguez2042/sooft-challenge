import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../shared/pipes/zodValidation';
import {
  CreateBalanceDto,
  createBalanceSchema,
  CreateBalanceSwaggerDto,
} from '../../application/dtos/balance';
import { BALANCE_SERVICE, IBalanceService } from '../../domain/ports/balance';

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
