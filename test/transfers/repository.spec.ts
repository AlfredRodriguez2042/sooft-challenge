import { DataSource, Repository } from 'typeorm';
import { TransferEntity } from '../../src/transfers/domain/entities/transfers';
import { TransferRepository } from '../../src/transfers/infrastructure/repositories/transfer';
import { closeTestDataSource, createTestDataSource } from '../utils/db';
import { drainAllPages } from '../utils/drainPages';
import {
  createAccount,
  createCompany,
  createTransfer,
} from '../utils/factories';

describe('TransferRepository.findAllTransfers', () => {
  let ds: DataSource;
  let repo: TransferRepository;
  let ormRepo: Repository<TransferEntity>;
  let compAId: string, compBId: string, accAId: string, accBId: string;

  beforeAll(async () => {
    ds = await createTestDataSource();
    ormRepo = ds.getRepository(TransferEntity);
    repo = new TransferRepository(ormRepo as any);

    const compA = await createCompany(ds, {
      status: 'JOINED',
      cuit: 999999,
      socialNumber: 888888,
    });
    const compB = await createCompany(ds, {
      status: 'JOINED',
      cuit: 999991,
      socialNumber: 888881,
    });
    compAId = compA.id;
    compBId = compB.id;

    const accA = await createAccount(ds, compAId, 'ARS', 0);
    const accB = await createAccount(ds, compBId, 'ARS', 0);
    accAId = accA.id;
    accBId = accB.id;

    // seed de 6 transfers con distintos createdAt y amount_minor
    const base = new Date('2025-09-10T10:00:00.000Z').getTime();
    const add = (min: number) => new Date(base + min * 60_000);
    await Promise.all([
      createTransfer(ds, {
        debitAccountId: accAId,
        creditAccountId: accBId,
        debitCompanyId: compAId,
        creditCompanyId: compBId,
        createdAt: add(0),
        amount_minor: 100,
      }),
      createTransfer(ds, {
        debitAccountId: accAId,
        creditAccountId: accBId,
        debitCompanyId: compAId,
        creditCompanyId: compBId,
        createdAt: add(1),
        amount_minor: 200,
      }),
      createTransfer(ds, {
        debitAccountId: accAId,
        creditAccountId: accBId,
        debitCompanyId: compAId,
        creditCompanyId: compBId,
        createdAt: add(2),
        amount_minor: 300,
      }),
      createTransfer(ds, {
        debitAccountId: accAId,
        creditAccountId: accBId,
        debitCompanyId: compAId,
        creditCompanyId: compBId,
        createdAt: add(3),
        amount_minor: 400,
      }),
      createTransfer(ds, {
        debitAccountId: accAId,
        creditAccountId: accBId,
        debitCompanyId: compAId,
        creditCompanyId: compBId,
        createdAt: add(4),
        amount_minor: 500,
      }),
      createTransfer(ds, {
        debitAccountId: accAId,
        creditAccountId: accBId,
        debitCompanyId: compAId,
        creditCompanyId: compBId,
        createdAt: add(5),
        amount_minor: 600,
      }),
    ]);
  });

  afterAll(async () => {
    await closeTestDataSource(ds);
  });

  it('devuelve primera página DESC por createdAt, limit=2 y nextCursor', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');
    const res = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'DESC',
    });

    expect(res.items).toHaveLength(2);
    // deben ser las dos más nuevas: minutos 5 y 4
    expect(new Date(res.items[0].createdAt).toISOString()).toBe(
      '2025-09-10T10:05:00.000Z',
    );
    expect(new Date(res.items[1].createdAt).toISOString()).toBe(
      '2025-09-10T10:04:00.000Z',
    );
    expect(res.cursor).toBeDefined();
    expect(res.hasNextPage).toBe(true);
  });

  it('segunda página con cursor no duplica y trae las siguientes', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');

    // 1ra página
    const p1 = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'DESC',
    });

    // 2da página con cursor de p1
    const p2 = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'DESC',
      cursor: p1.cursor,
    });

    expect(p2.items).toHaveLength(2);
    // ahora deberían ser minutos 3 y 2
    expect(new Date(p2.items[0].createdAt).toISOString()).toBe(
      '2025-09-10T10:03:00.000Z',
    );
    expect(new Date(p2.items[1].createdAt).toISOString()).toBe(
      '2025-09-10T10:02:00.000Z',
    );

    // 3ra página
    const p3 = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'DESC',
      cursor: p2.cursor,
    });
    expect(p3.items).toHaveLength(2);
    // minutos 1 y 0
    expect(new Date(p3.items[0].createdAt).toISOString()).toBe(
      '2025-09-10T10:01:00.000Z',
    );
    expect(new Date(p3.items[1].createdAt).toISOString()).toBe(
      '2025-09-10T10:00:00.000Z',
    );

    // no debe haber next
    expect(p3.hasNextPage).toBe(false);
    expect(p3.cursor).toBeUndefined();
  });

  it('funciona con orderField=amount_minor ASC', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');

    const p1 = await repo.findAllTransfers({
      from,
      to,
      limit: 3,
      orderField: 'amount_minor',
      sortBy: 'ASC',
      cursor: undefined,
    });

    expect(p1.items.map((i) => i.amount_minor)).toEqual([100, 200, 300]);

    const p2 = await repo.findAllTransfers({
      from,
      to,
      limit: 3,
      orderField: 'amount_minor',
      sortBy: 'ASC',
      cursor: p1.cursor,
    });
    expect(p2.items.map((i) => i.amount_minor)).toEqual([400, 500, 600]);
    expect(p2.hasNextPage).toBe(false);
  });

  it('respeta el rango from/to', async () => {
    // rango que solo incluye minutos 2..4
    const res = await repo.findAllTransfers({
      from: new Date('2025-09-10T10:02:00.000Z'),
      to: new Date('2025-09-10T10:04:00.000Z'),
      limit: 10,
      orderField: 'createdAt',
      sortBy: 'ASC',
    });

    expect(res.items.map((i) => new Date(i.createdAt).toISOString())).toEqual([
      '2025-09-10T10:02:00.000Z',
      '2025-09-10T10:03:00.000Z',
      '2025-09-10T10:04:00.000Z',
    ]);
    expect(res.hasNextPage).toBe(false);
  });
  it('paginación estable con empates en amount_minor usando tie-break por id', async () => {
    // sembrar 4 con amount_minor=999 pero distinto createdAt para mezcla
    // (si querés: dos mismo createdAt para forzar empate total en campo de orden)
    const base = new Date('2025-09-10T10:06:00.000Z').getTime();
    const add = (s: number) => new Date(base + s * 1000);
    await Promise.all(
      [0, 1, 2, 3].map((i) =>
        createTransfer(ds, {
          debitAccountId: accAId,
          creditAccountId: accBId,
          debitCompanyId: compAId,
          creditCompanyId: compBId,
          createdAt: add(i),
          amount_minor: 999,
        }),
      ),
    );

    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');

    // ordenamos por amount_minor ASC, limit=2, drenamos todo
    const all = await drainAllPages(async (cursor?: string) =>
      repo.findAllTransfers({
        from,
        to,
        limit: 2,
        orderField: 'amount_minor',
        sortBy: 'ASC',
        cursor,
      }),
    );
    const seeded999 = await ormRepo.findBy({ amount_minor: 999 });
    expect(seeded999).toHaveLength(4);

    const block = all.filter((x) => x.amount_minor === 999);
    expect(block).toHaveLength(4);

    const ids = block.map((b) => b.id);
    const idsSorted = [...ids].sort();
    expect(ids).toEqual(idsSorted);
  });
  it('limit=1 pagina uno por uno sin perder elementos', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');

    const all = await drainAllPages((cursor) =>
      repo.findAllTransfers({
        from,
        to,
        limit: 1,
        orderField: 'createdAt',
        sortBy: 'ASC',
        cursor,
      }),
    );

    // conocemos el total sembrado base + extras del test previo
    // si corrés este test aislado, ajustá el total esperado (6 del seed base)
    expect(all.length).toBeGreaterThanOrEqual(6);
    // unicidad garantizada por drainAllPages
  });

  it('limit mayor al total devuelve todo en una sola página', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');

    const res = await repo.findAllTransfers({
      from,
      to,
      limit: 1000,
      orderField: 'createdAt',
      sortBy: 'ASC',
    });
    expect(res.hasNextPage).toBe(false);
    expect(res.cursor).toBeUndefined();
  });
  it('cursor malformado se trata como primera página (no rompe)', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T10:05:00.000Z');

    // cursor inválido
    const bad = 'not-base64-or-json';

    const res = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'DESC',
      cursor: bad,
    });

    // debería comportarse como primera página DESC => 10:05 y 10:04
    expect(new Date(res.items[0].createdAt).toISOString()).toBe(
      '2025-09-10T10:05:00.000Z',
    );
    expect(new Date(res.items[1].createdAt).toISOString()).toBe(
      '2025-09-10T10:04:00.000Z',
    );
  });
  it('cursor apunta al último ítem y la siguiente página no lo repite', async () => {
    const from = new Date('2025-09-10T10:00:00.000Z');
    const to = new Date('2025-09-10T11:00:00.000Z');

    const p1 = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'ASC',
    });
    const lastP1 = p1.items[p1.items.length - 1];

    const p2 = await repo.findAllTransfers({
      from,
      to,
      limit: 2,
      orderField: 'createdAt',
      sortBy: 'ASC',
      cursor: p1.cursor,
    });

    // No debe repetirse el último de p1
    expect(p2.items.find((x) => x.id === lastP1.id)).toBeUndefined();
  });
});
