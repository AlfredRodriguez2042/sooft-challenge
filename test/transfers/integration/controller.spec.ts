import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateTransferDto,
  TransfersQuery,
} from '../../../src/transfers/application/dtos/transfer';
import {
  ITransferService,
  TRANSFER_SERVICE,
} from '../../../src/transfers/domain/ports/transfer';
import { TransferController } from '../../../src/transfers/infrastructure/controllers/transfer';

// Mock del servicio
const mockTransferService: ITransferService = {
  create: jest.fn(),
  findAll: jest.fn(),
};

describe('TransferController (Integration)', () => {
  let controller: TransferController;
  let service: ITransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TRANSFER_SERVICE,
          useValue: mockTransferService,
        },
      ],
    }).compile();

    controller = module.get<TransferController>(TransferController);
    service = module.get<ITransferService>(TRANSFER_SERVICE);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validCreateDto: CreateTransferDto = {
      amount: '1500.25' as unknown as number,
      currency: 'ARS',
      debitAccountId: '123e4567-e89b-12d3-a456-426614174000',
      creditAccountId: '123e4567-e89b-12d3-a456-426614174001',
      //   debitCompanyId: '123e4567-e89b-12d3-a456-426614174002',
      //   creditCompanyId: '123e4567-e89b-12d3-a456-426614174003',
      idempotencyKey: '123e4567-e89b-12d3-a456-426614174004',
      metadata: { reference: 'test-123' },
    };

    it('should call service.create with the correct parameters', async () => {
      const expectedResult: any = {
        id: 'uuid-transfer',
        ...validCreateDto,
        amount_minor: '150025',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      const result = await controller.create(validCreateDto);

      expect(service.create).toHaveBeenCalledWith(validCreateDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error when service.create fails', async () => {
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(new Error('Service error'));

      await expect(controller.create(validCreateDto)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('transfers', () => {
    const validQuery: TransfersQuery = {
      from: '2025-09-01T00:00:00Z' as unknown as Date,
      to: '2025-09-30T23:59:59Z' as unknown as Date,
      orderField: 'createdAt',
      sortBy: 'DESC',
      limit: 20,
      cursor: 'eyJ2Ijoi2025LTA5LTEwVDEwOjE1OjAwWiIsImlkIjoxfQ==',
    };

    it('should call service.findAll with the correct parameters', async () => {
      const expectedResult: any = {
        items: [
          {
            id: 1,
            companyId: 'uuid-123',
            amount: 5000,
            createdAt: '2025-09-10T10:15:00.000Z',
          },
        ],
        cursor: 'eyJ2Ijoi2025LTA5LTEwVDEwOjE1OjAwWiIsImlkIjoxfQ==',
        hasNextPage: true,
      };
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

      const result = await controller.transfers(validQuery);

      expect(service.findAll).toHaveBeenCalledWith(validQuery);
      expect(result).toEqual(expectedResult);
    });
  });
});
