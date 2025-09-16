import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { BalanceEntity } from '../../src/balances/domain/entities/balance';
import { BalanceRepository } from '../../src/balances/infrastructure/repositories/balance';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<ReturnType<any>, Parameters<any>>;
};

const repositoryMockFactory: () => MockType<
  Repository<BalanceEntity>
> = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('BalanceRepository', () => {
  let repo: BalanceRepository;
  let ormRepoMock: MockType<Repository<BalanceEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceRepository,
        {
          provide: getRepositoryToken(BalanceEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    repo = module.get(BalanceRepository);
    ormRepoMock = module.get(getRepositoryToken(BalanceEntity));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear y guardar un balance', async () => {
      const payload = {
        companyId: 'comp-123',
        currency: 'ARS',
        balance_minor: 5000,
        active: true,
      };

      const createdEntity = { ...payload };
      const savedEntity = { id: 'bal-1', ...payload };

      ormRepoMock.create!.mockReturnValue(createdEntity);
      ormRepoMock.save!.mockResolvedValue(savedEntity);

      const result = await repo.create(payload);

      expect(ormRepoMock.create).toHaveBeenCalledWith(payload);
      expect(ormRepoMock.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(savedEntity);
    });
  });

  describe('findOne', () => {
    it('debe retornar un balance si existe', async () => {
      const options: FindOneOptions<BalanceEntity> = {
        where: { id: 'bal-1' },
      };

      const found = {
        id: 'bal-1',
        companyId: 'comp-123',
        currency: 'ARS',
        balance_minor: 5000,
        active: true,
      };

      ormRepoMock.findOne!.mockResolvedValue(found);

      const result = await repo.findOne(options);

      expect(ormRepoMock.findOne).toHaveBeenCalledWith(options);
      expect(result).toEqual(found);
    });

    it('debe retornar null si no existe', async () => {
      const options: FindOneOptions<BalanceEntity> = {
        where: { id: 'missing' },
      };

      ormRepoMock.findOne!.mockResolvedValue(null);

      const result = await repo.findOne(options);

      expect(result).toBeNull();
    });
  });
});
