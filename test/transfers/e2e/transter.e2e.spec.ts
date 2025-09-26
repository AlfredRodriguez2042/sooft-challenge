// eslint-disable-next-line
// @ts-ignore
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import {
  ITransferService,
  TRANSFER_SERVICE,
} from '../../../src/transfers/domain/ports/transfer';

// Mock completo del servicio
const mockTransferService: ITransferService = {
  create: jest.fn(),
  findAll: jest.fn(),
};

describe('TransferController (E2E)', () => {
  let app: INestApplication;
  let transferService: ITransferService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule, // Importamos el módulo principal
        ThrottlerModule.forRoot([
          {
            // Configuración de throttler para testing
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
    })
      .overrideProvider(TRANSFER_SERVICE)
      .useValue(mockTransferService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Configuración global igual que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    transferService = app.get(TRANSFER_SERVICE);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /transfers - Crear transferencia', () => {
    const validPayload = {
      amount: 1500.25,
      currency: 'ARS',
      debitAccountId: '123e4567-e89b-12d3-a456-426614174000',
      creditAccountId: '123e4567-e89b-12d3-a456-426614174001',
      //   debitCompanyId: '123e4567-e89b-12d3-a456-426614174002',
      //   creditCompanyId: '123e4567-e89b-12d3-a456-426614174003',
      idempotencyKey: '123e4567-e89b-12d3-a456-426614174004',
      metadata: { reference: 'test-123' },
    };

    const successResponse = {
      id: 'transfer-123',
      debitAccountId: validPayload.debitAccountId,
      creditAccountId: validPayload.creditAccountId,
      creditCompanyId: '123e4567-e89b-12d3-a456-426614174002',
      debitCompanyId: '123e4567-e89b-12d3-a456-426614174003',
      currency: 'ARS',
      amount_minor: 150025,
      status: 'COMPLETED' as const,
      //   createdAt: '2025-09-10T12:00:00.000Z',
      idempotencyKey: 'aaa',
      metadata: undefined,
    };

    it('debería crear una transferencia exitosamente (201)', async () => {
      // Arrange
      jest.spyOn(transferService, 'create').mockResolvedValue(successResponse);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/transfers')
        .send(validPayload)
        .expect(201);

      //   .expect({ data: successResponse, errors: null, statusCode: 201 });

      // Verify
      expect(transferService.create).toHaveBeenCalledWith(validPayload);
      expect(transferService.create).toHaveBeenCalledTimes(1);
    });

    it('debería retornar error 400 por datos inválidos', async () => {
      const invalidPayload = {
        amount: 'not-a-number',
        currency: 'INVALID_CURRENCY',
        // debitAccountId: 'invalid-uuid',
        // missing required fields
      };

      await request(app.getHttpServer())
        .post('/transfers')
        .send(invalidPayload)
        .expect(400);
      // .expect((res) => {
      //   expect(res.body.message).toBeInstanceOf(Array);
      //   expect(res.body.message).toContain(
      //     'amount must be a string representing a decimal number',
      //   );
      //   expect(res.body.message).toContain(
      //     'currency must be one of the following values: ARS, USD',
      //   );
      //   expect(res.body.message).toContain('debitAccountId must be a UUID');
      // });
    });

    it('debería retornar error 400 por campos no permitidos', async () => {
      const payloadWithExtraFields = {
        ...validPayload,
        amount: '100000',
      };

      await request(app.getHttpServer())
        .post('/transfers')
        .send(payloadWithExtraFields)
        .expect(400);
      // .expect((res) => {
      //   expect(res.body.message).toContain(
      //     'property invalidField should not exist',
      //   );
      // });
    });

    it('debería manejar errores del servicio correctamente (500)', async () => {
      // Arrange
      jest
        .spyOn(transferService, 'create')
        .mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await request(app.getHttpServer())
        .post('/transfers')
        .send(validPayload)
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toBe('Internal server error');
        });
    });

    // it('debería aplicar rate limiting (429)', async () => {
    //   jest.spyOn(transferService, 'create').mockResolvedValue(successResponse);

    //   // Realizar 6 requests rápidamente (límite: 5 por segundo según tu configuración)
    //   const requests: any[] = [];
    //   for (let i = 0; i < 6; i++) {
    //     requests.push(
    //       request(app.getHttpServer()).post('/transfers').send(validPayload),
    //     );
    //   }

    //   const responses = await Promise.all(requests);

    //   const successResponses = responses.filter((r) => r.status === 201);
    //   const rateLimitedResponses = responses.filter((r) => r.status === 429);

    //   expect(successResponses).toHaveLength(5);
    //   expect(rateLimitedResponses).toHaveLength(1);
    // });
  });

  describe('GET /transfers - Listar transferencias', () => {
    const validQuery = {
      from: '2025-09-01T00:00:00Z',
      to: '2025-09-30T23:59:59Z',
      orderField: 'createdAt',
      sortBy: 'DESC',
      limit: '20',
      cursor: 'eyJ2IjoiMjAyNS0wOS0xMFQxMDoxNTowMFoiLCJpZCI6MX0=',
    };

    const successResponse: any = {
      items: [
        {
          id: 1,
          companyId: 'uuid-123',
          amount: 5000,
          createdAt: '2025-09-10T10:15:00.000Z',
        },
        {
          id: 2,
          companyId: 'uuid-456',
          amount: 3000,
          createdAt: '2025-09-10T11:20:00.000Z',
        },
      ],
      cursor: 'eyJ2IjoiMjAyNS0wOS0xMFQxMToyMDowMFoiLCJpZCI6Mn0=',
      hasNextPage: true,
    };

    it('debería retornar lista de transferencias exitosamente (200)', async () => {
      // Arrange
      jest.spyOn(transferService, 'findAll').mockResolvedValue(successResponse);

      // Act & Assert
      await request(app.getHttpServer())
        .get('/transfers')
        .query(validQuery)
        .expect(200);
      // .expect(successResponse);

      // Verify que se llamó con parámetros transformados
      expect(transferService.findAll).toHaveBeenCalledWith({
        ...validQuery,
        from: new Date(validQuery.from),
        to: new Date(validQuery.to),
        limit: 20,
      });
    });

    it('debería manejar parámetros de query opcionales', async () => {
      const minimalQuery = {
        from: '2025-09-01T00:00:00Z',
        to: '2025-09-30T23:59:59Z',
        orderField: 'createdAt',
        sortBy: 'DESC',
      };

      jest.spyOn(transferService, 'findAll').mockResolvedValue({
        items: [],
        cursor: undefined,
        hasNextPage: false,
      });

      await request(app.getHttpServer())
        .get('/transfers')
        .query(minimalQuery)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            data: { items: [], hasNextPage: false },
            errors: null,
            statusCode: 200,
          });
        });

      expect(transferService.findAll).toHaveBeenCalledWith({
        ...minimalQuery,
        from: new Date(minimalQuery.from),
        to: new Date(minimalQuery.to),
        limit: 10,
        cursor: undefined, // No se envió cursor
      });
    });

    it('debería retornar error 400 por parámetros de query inválidos', async () => {
      const invalidQuery = {
        from: 'invalid-date',
        to: 'invalid-date',
        orderField: 'invalidField',
        sortBy: 'INVALID_DIRECTION',
        limit: 'not-a-number',
      };

      await request(app.getHttpServer())
        .get('/transfers')
        .query(invalidQuery)
        .expect(400);
      // .expect((res) => {
      //   expect(res.body.message).toBeInstanceOf(Array);
      //   expect(res.body.message).toContain(
      //     'from must be a valid ISO 8601 date string',
      //   );
      //   expect(res.body.message).toContain(
      //     'orderField must be one of the following values: createdAt, amount, id',
      //   );
      // });
    });

    it('debería manejar respuestas vacías correctamente', async () => {
      const emptyResponse = {
        items: [],
        // cursor: undefined,
        hasNextPage: false,
      };
      jest
        .spyOn(transferService, 'findAll')
        .mockResolvedValue(emptyResponse as any);

      await request(app.getHttpServer())
        .get('/transfers')
        .query(validQuery)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            data: emptyResponse,
            errors: null,
            statusCode: 200,
          });
        });
    });
  });

  describe('Validaciones específicas de dominio', () => {
    it('debería validar formato UUID en account IDs', async () => {
      const invalidUuidPayload = {
        amount: '100.50',
        currency: 'USD',
        debitAccountId: 'not-a-uuid',
        creditAccountId: '123e4567-e89b-12d3-a456-426614174001', // válido
        idempotencyKey: '123e4567-e89b-12d3-a456-426614174002',
      };

      await request(app.getHttpServer())
        .post('/transfers')
        .send(invalidUuidPayload)
        .expect(400);
      // .expect((res) => {
      //   expect(res.body.message).toContain('debitAccountId must be a UUID');
      // });
    });

    it('debería validar el enum de currency', async () => {
      const invalidCurrencyPayload = {
        amount: '100.50',
        currency: 'EUR', // No permitido
        debitAccountId: '123e4567-e89b-12d3-a456-426614174000',
        creditAccountId: '123e4567-e89b-12d3-a456-426614174001',
        idempotencyKey: '123e4567-e89b-12d3-a456-426614174002',
      };

      await request(app.getHttpServer())
        .post('/transfers')
        .send(invalidCurrencyPayload)
        .expect(400);
      // .expect((res) => {
      //   expect(res.body.message).toContain(
      //     'currency must be one of the following values: ARS, USD',
      //   );
      // });
    });

    it('debería validar formato decimal en amount', async () => {
      const invalidAmountPayload = {
        amount: '100.555', // Más de 2 decimales
        currency: 'USD',
        debitAccountId: '123e4567-e89b-12d3-a456-426614174000',
        creditAccountId: '123e4567-e89b-12d3-a456-426614174001',
        idempotencyKey: '123e4567-e89b-12d3-a456-426614174002',
      };

      await request(app.getHttpServer())
        .post('/transfers')
        .send(invalidAmountPayload)
        .expect(400);
      // .expect((res) => {
      //   expect(res.body.message).toContain(
      //     'amount must be a string representing a decimal number with up to 2 decimal places',
      //   );
      // });
    });
  });

  describe('Headers y CORS', () => {
    // it('debería incluir CORS headers', async () => {
    //   await request(app.getHttpServer())
    //     .options('/transfers')
    //     .expect(200)
    //     .expect((res) => {
    //       expect(res.headers['access-control-allow-origin']).toBeDefined();
    //       expect(res.headers['access-control-allow-methods']).toBeDefined();
    //     });
    // });

    it('debería incluir content-type json en respuestas', async () => {
      jest.spyOn(transferService, 'findAll').mockResolvedValue({
        items: [],
        cursor: undefined,
        hasNextPage: false,
      });

      await request(app.getHttpServer())
        .get('/transfers')
        .query({
          from: '2025-09-01T00:00:00Z',
          to: '2025-09-30T23:59:59Z',
          orderField: 'createdAt',
          sortBy: 'DESC',
        })
        .expect(200)
        .expect('Content-Type', /json/);
    });
  });
});
