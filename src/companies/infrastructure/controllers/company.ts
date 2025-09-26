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
import { ZodValidationPipe } from '../../../shared/pipes/zodValidation';
import {
  CreateCompanyDto,
  CreateCompanySchema,
} from '../../application/dtos/company';
import { COMPANY_SERVICE, ICompanyService } from '../../domain/ports/company';
import {
  AWS_LAMBDA_SERVICE,
  ILambdaClientService,
} from '../../domain/ports/lambda';

@Controller('companies')
export class CompanyController {
  constructor(
    @Inject(COMPANY_SERVICE) private readonly companyService: ICompanyService,
    @Inject(AWS_LAMBDA_SERVICE)
    private readonly awsLambdaService: ILambdaClientService,
  ) {}

  @Throttle({ default: { limit: 2, ttl: 30000 } })
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a company (PYME or CORPORATE)' })
  @ApiCreatedResponse({
    description: 'Company created correctamente',
    schema: {
      example: {
        id: 'uuid-123',
        kind: 'PYME',
        socialNumber: 'Mi Empresa SRL',
        cuit: '20304050607',
        createdAt: '2025-09-10T10:00:00.000Z',
      },
    },
  })
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          required: ['kind', 'socialNumber', 'cuit'],
          properties: {
            kind: { type: 'string', enum: ['PYME'] },
            socialNumber: { type: 'number', minLength: 1 },
            cuit: { type: 'number' },
          },
        },
        {
          type: 'object',
          required: ['kind', 'socialNumber', 'cuit'],
          properties: {
            kind: { type: 'string', enum: ['CORPORATE'] },
            socialNumber: { type: 'number', minLength: 1 },
            cuit: { type: 'number' },
          },
        },
      ],
      discriminator: { propertyName: 'kind' },
    },
  })
  async create(
    @Body(new ZodValidationPipe(CreateCompanySchema)) payload: CreateCompanyDto,
  ) {
    // this.awsLambdaService
    //   .execute(payload)
    //   .then((res) => console.log(res))
    //   .catch((err) => console.log(err));
    return await this.companyService.create(payload);
  }

  @Get('joined')
  @ApiOperation({
    summary: 'List joined',
    description:
      'Devuelve una lista de  de compañías adheridas, con filtros de fecha, ' +
      'paginación con cursor y orden configurable.',
  })
  @ApiOkResponse({
    description: 'Lista de empresas aderidas obtenida correctamente',
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
    example: '2025-09-10T23:59:59Z',
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
  async joined(@Query() query: any) {
    return this.companyService.findAll(query);
  }
}
