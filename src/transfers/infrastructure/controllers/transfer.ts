import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CreateTransferDto,
  TransfersQuery,
} from 'src/transfers/application/dtos/transfer';

import {
  ITransferService,
  TRANSFER_SERVICE,
} from 'src/transfers/domain/ports/transfer';

@Controller('transfers')
export class TransferController {
  constructor(
    @Inject(TRANSFER_SERVICE)
    private readonly transferService: ITransferService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List transfers',
    description:
      'Devuelve una lista de empresas que realizaron transferencias, con filtros de fecha, ' +
      'paginación con cursor y orden configurable.',
  })
  @ApiOkResponse({
    description: 'Lista de transferencias obtenida correctamente',
    schema: {
      example: {
        items: [
          {
            id: 1,
            companyId: 'uuid-123',
            amount: 5000,
            createdAt: '2025-09-10T10:15:00.000Z',
          },
        ],
        cursor: 'eyJ2Ijoi2025LTA5LTEwVDEwOjE1OjAwWiIsImlkIjoxfQ==',
      },
    },
  })
  @ApiQuery({
    name: 'from',
    type: String,
    format: 'date-time',
    required: true,
    example: '2025-09-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'to',
    type: String,
    format: 'date-time',
    required: true,
    example: '2025-09-30T23:59:59Z',
  })
  @ApiQuery({
    name: 'orderField',
    enum: ['createdAt', 'amount', 'id'],
    required: true,
  })
  @ApiQuery({
    name: 'sortBy',
    enum: ['ASC', 'DESC'],
    required: true,
    example: 'DESC',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'cursor',
    type: String,
    required: false,
    description: 'Cursor opaco para paginación',
    example: 'eyJ2Ijoi2025LTA5LTEwVDEwOjE1OjAwWiIsImlkIjoxfQ==',
  })
  async transfers(@Query() query: TransfersQuery) {
    const result = this.transferService.findAll(query);
    return result;
  }

  @Throttle({ default: { limit: 5, ttl: 1000 } })
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear transferencia entre cuentas de empresas' })
  @ApiCreatedResponse({
    description: 'Transferencia creada',
    schema: {
      example: {
        id: 'uuid-transfer',
        debitAccountId: 'uuid-debit',
        creditAccountId: 'uuid-credit',
        creditCompanyId: 'uuid-debit',
        debitCompanyId: 'uuid-credit',
        currency: 'ARS',
        amount_minor: 150025,
        status: 'COMPLETED',
        createdAt: '2025-09-10T12:00:00.000Z',
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount', 'currency', 'debitAccountId', 'creditAccountId'],
      properties: {
        amount: { type: 'string', example: '1500.25' },
        currency: { type: 'string', enum: ['ARS', 'USD'] },
        debitAccountId: { type: 'string', format: 'uuid' },
        creditAccountId: { type: 'string', format: 'uuid' },
        debitCompanyId: { type: 'string', format: 'uuid' },
        creditCompanyId: { type: 'string', format: 'uuid' },
        idempotencyKey: { type: 'string', format: 'uuid' },
        metadata: { type: 'object' },
      },
    },
  })
  async create(@Body() dto: CreateTransferDto) {
    return await this.transferService.create(dto);
  }
}
