// src/companies/infrastructure/repositories/company.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from '../../src/companies/domain/entities/company';
import {
  CompanyRepository,
  decodeCursor,
  encodeCursor,
} from '../../src/companies/infrastructure/repositories/company';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<ReturnType<any>, Parameters<any>>;
};

const repositoryMockFactory: () => MockType<
  Repository<CompanyEntity>
> = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('CompanyRepository', () => {
  let repo: CompanyRepository;
  let ormRepoMock: MockType<Repository<CompanyEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyRepository,
        {
          provide: getRepositoryToken(CompanyEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    repo = module.get(CompanyRepository);
    ormRepoMock = module.get(getRepositoryToken(CompanyEntity));
    jest.clearAllMocks();
  });

  describe('helpers de cursor', () => {
    it('encodeCursor y decodeCursor son inversos', () => {
      const c = { v: '2025-09-10T11:00:00.000Z', id: 'c2' };
      const enc = encodeCursor(c);
      const dec = decodeCursor(enc);
      expect(dec).toEqual(c);
    });
  });

  describe('create', () => {
    it('debe crear y guardar una company', async () => {
      const payload = {
        name: 'ACME',
        createdAt: '2025-09-10T10:00:00.000Z',
      };
      const createdEntity = { ...payload };
      const savedEntity = { id: 'cmp-1', ...payload };

      ormRepoMock.create!.mockReturnValue(createdEntity);
      ormRepoMock.save!.mockResolvedValue(savedEntity);

      const result = await repo.create(payload as any);

      expect(ormRepoMock.create).toHaveBeenCalledWith(payload);
      expect(ormRepoMock.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(savedEntity);
    });
  });

  describe('findAllJoined', () => {
    it('sin cursor: pagina con take=limit+1, recorta items y genera nextCursor (ASC)', async () => {
      const rows = [
        { id: 'c1', createdAt: '2025-09-10T10:00:00.000Z' },
        { id: 'c2', createdAt: '2025-09-10T11:00:00.000Z' },
        { id: 'c3', createdAt: '2025-09-10T12:00:00.000Z' },
      ] as any[];

      ormRepoMock.find!.mockResolvedValue(rows as any);

      const res = await repo.findAllJoined({
        from: '2025-09-01T00:00:00.000Z',
        to: '2025-09-30T23:59:59.999Z',
        orderField: 'createdAt',
        sortBy: 'ASC',
        limit: 2,
        cursor: undefined,
      });

      expect(res.items.map((i) => i.id)).toEqual(['c1', 'c2']);
      expect(res.hasNextPage).toBe(true);
      expect(typeof res.cursor).toBe('string');

      const dec = decodeCursor(res.cursor!);
      expect(dec).toEqual({ v: '2025-09-10T11:00:00.000Z', id: 'c2' });

      expect(ormRepoMock.find).toHaveBeenCalledTimes(1);
      const args = ormRepoMock.find!.mock.calls[0][0] as {
        take: any;
        order: any;
      };
      expect(args.take).toBe(3);
      expect(args.order).toEqual({ createdAt: 'ASC', id: 'ASC' });
    });

    it('con cursor ASC: continúa después de v y arma cursor del último visible', async () => {
      const rows = [
        { id: 'c3', createdAt: '2025-09-10T12:00:00.000Z' },
        { id: 'c4', createdAt: '2025-09-10T13:00:00.000Z' },
        { id: 'c5', createdAt: '2025-09-10T14:00:00.000Z' },
      ] as any[];

      ormRepoMock.find!.mockResolvedValue(rows as any);

      const res = await repo.findAllJoined({
        from: '2025-09-01T00:00:00.000Z',
        to: '2025-09-30T23:59:59.999Z',
        orderField: 'createdAt',
        sortBy: 'ASC',
        limit: 2,
        cursor: encodeCursor({ v: '2025-09-10T11:00:00.000Z', id: 'c2' }),
      });

      expect(res.items.map((i) => i.id)).toEqual(['c3', 'c4']);
      expect(res.hasNextPage).toBe(true);
      expect(decodeCursor(res.cursor!)).toEqual({
        v: '2025-09-10T13:00:00.000Z',
        id: 'c4',
      });

      expect(ormRepoMock.find).toHaveBeenCalledTimes(1);
      const args = ormRepoMock.find!.mock.calls[0][0] as {
        take: any;
        order: any;
      };
      expect(args.take).toBe(3);
      expect(args.order).toEqual({ createdAt: 'ASC', id: 'ASC' });
    });

    it('sin nextPage (rows <= limit): cursor undefined', async () => {
      const rows = [
        { id: 'c1', createdAt: '2025-09-10T10:00:00.000Z' },
        { id: 'c2', createdAt: '2025-09-10T11:00:00.000Z' },
      ] as any[];

      ormRepoMock.find!.mockResolvedValue(rows as any);

      const res = await repo.findAllJoined({
        from: '2025-09-01T00:00:00.000Z',
        to: '2025-09-30T23:59:59.999Z',
        orderField: 'createdAt',
        sortBy: 'ASC',
        limit: 3,
        cursor: undefined,
      });

      expect(res.items.map((i) => i.id)).toEqual(['c1', 'c2']);
      expect(res.hasNextPage).toBe(false);
      expect(res.cursor).toBeUndefined();

      expect(ormRepoMock.find).toHaveBeenCalledTimes(1);
      const args = ormRepoMock.find!.mock.calls[0][0] as {
        take: any;
        order: any;
      };
      expect(args.take).toBe(4);
      expect(args.order).toEqual({ createdAt: 'ASC', id: 'ASC' });
    });
  });
});
