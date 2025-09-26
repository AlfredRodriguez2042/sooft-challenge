// tests/unit/application/transfer.service.unit.test.ts
import { BadRequestException } from '@nestjs/common';
import { TransferService } from '../../../src/transfers/application/services/transfer';
import { ITransferRepository } from '../../../src/transfers/domain/ports/transfer';
type Repos = {
  transfersRepo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  balanceRepo: {
    findOneBy: jest.Mock;
    query: jest.Mock; // para los UPDATE ... RETURNING
    debitIfSufficient: jest.Mock; // para los UPDATE ... RETURNING
    creditIfActive: jest.Mock;
  };
  ledgerRepo: {
    save: jest.Mock;
    create: jest.Mock;
  };
};

function makeRepos(): Repos {
  return {
    transfersRepo: {
      findOneBy: jest.fn(),
      // eslint-disable-next-line
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 't_1', ...x })),
      update: jest.fn(),
    },
    balanceRepo: {
      findOneBy: jest.fn(),
      query: jest.fn(),
      debitIfSufficient: jest.fn(),
      creditIfActive: jest.fn(),
    },
    ledgerRepo: {
      save: jest.fn(),
      // eslint-disable-next-line
      create: jest.fn((x) => x),
    },
  };
}

describe('TransferService (unit)', () => {
  let service: TransferService;
  let repoPort: ITransferRepository; // ITransferRepository mock (findAllTransfers)
  let uow: any;
  let repos: Repos;

  beforeEach(() => {
    repoPort = {
      findAllTransfers: jest.fn(),
      create: jest.fn(),
    } as unknown as ITransferRepository;
    uow = { withTransaction: jest.fn() };
    service = new TransferService(repoPort, uow);
    repos = makeRepos(); // de la sección anterior
  });

  test('findAll delega a repository.findAllTransfers', async () => {
    const query = {
      from: '2025-09-10T10:00:00Z',
      to: '2025-09-10T11:00:00Z',
      limit: 10,
      orderField: 'createdAt',
      sortBy: 'ASC',
      cursor: undefined,
    };
    const payload = {
      items: [{ id: 't1' } as any],
      hasNextPage: false,
      cursor: undefined,
    };
    jest.spyOn(repoPort, 'findAllTransfers').mockResolvedValue(payload);

    const res = await service.findAll(query as any);
    expect(repoPort.findAllTransfers).toHaveBeenCalledWith(query);
    expect(res).toBe(payload);
  });

  test('create: idempotency hit retorna existente y no ejecuta más acciones', async () => {
    const input = {
      debitAccountId: 'a_d',
      creditAccountId: 'a_c',
      currency: 'ARS',
      amount: '12.34',
      idempotencyKey: 'idem-1',
    };
    jest
      .spyOn(uow, 'withTransaction')
      .mockImplementation(async (_iso, fn: (rep: Repos) => Promise<Repos>) => {
        jest.spyOn(repos.transfersRepo, 'findOneBy').mockResolvedValue({
          id: 't_prev',
          status: 'COMPLETED',
        });
        return fn(repos);
      });

    const res = await service.create(input as any);
    expect(res).toEqual({ id: 't_prev', status: 'COMPLETED' });
    expect(repos.balanceRepo.findOneBy).not.toHaveBeenCalled();
    expect(repos.balanceRepo.query).not.toHaveBeenCalled();
    expect(repos.transfersRepo.save).not.toHaveBeenCalled();
    expect(repos.ledgerRepo.save).not.toHaveBeenCalled();
  });

  test('create: cuentas inexistentes o inactivas => BadRequestException', async () => {
    const input = {
      debitAccountId: 'a_d',
      creditAccountId: 'a_c',
      currency: 'ARS',
      amount: '10',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    uow.withTransaction.mockImplementation(
      async (_iso, fn: (rep: Repos) => Promise<Repos>) => {
        repos.transfersRepo.findOneBy.mockResolvedValue(null);
        // caso 1: falta debit
        repos.balanceRepo.findOneBy
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'a_c', active: true, currency: 'ARS' });
        return fn(repos);
      },
    );

    await expect(service.create(input as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test('create: moneda incompatible => BadRequestException', async () => {
    const input = {
      debitAccountId: 'a_d',
      creditAccountId: 'a_c',
      currency: 'ARS',
      amount: '10',
    };
    // eslint-disable-next-line
    uow.withTransaction.mockImplementation(
      async (_iso: string, fn: (rep: Repos) => Promise<Repos>) => {
        repos.transfersRepo.findOneBy.mockResolvedValue(null);
        repos.balanceRepo.findOneBy
          .mockResolvedValueOnce({
            id: 'a_d',
            active: true,
            currency: 'USD',
            companyId: 'c1',
          })
          .mockResolvedValueOnce({
            id: 'a_c',
            active: true,
            currency: 'ARS',
            companyId: 'c2',
          });
        return fn(repos);
      },
    );

    await expect(service.create(input as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test('create: débito falla (saldo insuficiente) => BadRequestException', async () => {
    const input = {
      debitAccountId: 'a_d',
      creditAccountId: 'a_c',
      currency: 'ARS',
      amount: '10',
    };
    // eslint-disable-next-line
    uow.withTransaction.mockImplementation(
      async (_iso, fn: (rep: Repos) => Promise<Repos>) => {
        repos.transfersRepo.findOneBy.mockResolvedValue(null);
        repos.balanceRepo.findOneBy
          .mockResolvedValueOnce({
            id: 'a_d',
            active: true,
            currency: 'ARS',
            companyId: 'c1',
          })
          .mockResolvedValueOnce({
            id: 'a_c',
            active: true,
            currency: 'ARS',
            companyId: 'c2',
          });
        repos.balanceRepo.debitIfSufficient.mockResolvedValueOnce(false); // UPDATE debit ... RETURNING => []
        return fn(repos);
      },
    );

    await expect(service.create(input as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repos.balanceRepo.debitIfSufficient).toHaveBeenCalledTimes(1); // solo intento de débito
  });

  test('create: crédito falla => BadRequestException', async () => {
    const input = {
      debitAccountId: 'a_d',
      creditAccountId: 'a_c',
      currency: 'ARS',
      amount: '10',
    };
    // eslint-disable-next-line
    uow.withTransaction.mockImplementation(
      async (_iso, fn: (rep: Repos) => Promise<Repos>) => {
        repos.transfersRepo.findOneBy.mockResolvedValue(null);
        repos.balanceRepo.findOneBy
          .mockResolvedValueOnce({
            id: 'a_d',
            active: true,
            currency: 'ARS',
            companyId: 'c1',
          })
          .mockResolvedValueOnce({
            id: 'a_c',
            active: true,
            currency: 'ARS',
            companyId: 'c2',
          });
        // débito OK (retorna 1 fila)
        repos.balanceRepo.query
          .mockResolvedValueOnce([{ id: 'a_d' }])
          .mockResolvedValueOnce([]); // crédito falla
        return fn(repos);
      },
    );

    await expect(service.create(input as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // No debe guardar transfer si el crédito falla? (tu código guarda antes del ledger)
    // En tu implementación guarda transfer ANTES del ledger, pero falla antes de guardar si crédito falla.
    expect(repos.transfersRepo.save).not.toHaveBeenCalled();
  });

  test('create: flujo feliz completa transferencia y ledger', async () => {
    const input = {
      debitAccountId: 'a_d',
      creditAccountId: 'a_c',
      currency: 'ARS',
      amount: '12.34',
      idempotencyKey: 'idem-ok',
    };
    // eslint-disable-next-line
    uow.withTransaction.mockImplementation(
      async (_iso, fn: (rep: Repos) => Promise<Repos>) => {
        repos.transfersRepo.findOneBy.mockResolvedValue(null);
        repos.balanceRepo.findOneBy
          .mockResolvedValueOnce({
            id: 'a_d',
            active: true,
            currency: 'ARS',
            companyId: 'c1',
          })
          .mockResolvedValueOnce({
            id: 'a_c',
            active: true,
            currency: 'ARS',
            companyId: 'c2',
          });
        // parseAmountToMinor('12.34', 2) => 1234
        repos.balanceRepo.debitIfSufficient.mockResolvedValueOnce([
          { id: 'a_d' },
        ]); // débito OK

        repos.balanceRepo.creditIfActive.mockResolvedValueOnce([{ id: 'a_c' }]); // crédito OK
        repos.transfersRepo.create.mockImplementation(() => ({
          id: 't_new',
          ...input,
          amount_minor: 1234,
          status: 'PENDING',
        }));
        // repos.transfersRepo.save.mockResolvedValue({
        //   id: 't_new',
        //   ...input,
        //   amount_minor: 1234,
        //   status: 'PENDING',
        // });
        repos.ledgerRepo.save.mockResolvedValue(undefined);
        repos.transfersRepo.update.mockResolvedValue(undefined);

        const out = await fn(repos); // ejecutamos el callback a través de withTransaction
        return out;
      },
    );

    const out = await service.create(input as any);
    expect(out).toMatchObject({
      id: 't_new',
      status: 'COMPLETED',
      amount_minor: 1234,
    });

    // asserts clave
    expect(repos.balanceRepo.debitIfSufficient).toHaveBeenNthCalledWith(
      1,
      'a_d',
      1234,
      'ARS',
    );
    expect(repos.balanceRepo.creditIfActive).toHaveBeenNthCalledWith(
      1,
      'a_c',
      1234,
      'ARS',
    );
    expect(repos.transfersRepo.create).toHaveBeenCalled();
    expect(repos.ledgerRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'DEBIT', amount_minor: 1234 }),
        expect.objectContaining({ kind: 'CREDIT', amount_minor: 1234 }),
      ]),
    );
    expect(repos.transfersRepo.update).toHaveBeenCalledWith('t_new', {
      status: 'COMPLETED',
    });
  });
});
