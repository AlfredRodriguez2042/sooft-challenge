import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './app.controller';

type JestFn = jest.Mock<any>;

describe('HealthController', () => {
  let controller: HealthController;

  // Mocks fuertemente tipados
  let healthCheckService: { check: JestFn };
  let db: { pingCheck: JestFn };
  let disk: { checkStorage: JestFn };
  let memory: { checkHeap: JestFn; checkRSS: JestFn };

  beforeEach(async () => {
    healthCheckService = {
      // El mock de check ejecuta las lambdas para verificar llamadas a los indicadores
      check: jest.fn(async (indicators: Array<() => Promise<any>>) => {
        // Ejecutamos todas las lambdas para que se llamen los indicadores
        for (const fn of indicators) {
          await fn();
        }
        // Devolvemos un shape típico de terminus (puede variar según el caso)
        return {
          status: 'ok',
          info: {},
          error: {},
          details: {},
        };
      }),
    };

    db = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };

    disk = {
      checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
    };

    memory = {
      checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
      checkRSS: jest.fn().mockResolvedValue({ memory_rss: { status: 'up' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: db },
        { provide: DiskHealthIndicator, useValue: disk },
        { provide: MemoryHealthIndicator, useValue: memory },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  describe('liveness', () => {
    it('debe ejecutar memory.checkHeap con el umbral esperado y devolver el resultado de health.check', async () => {
      const result = await controller.liveness();

      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [[indicators]] = healthCheckService.check.mock.calls;
      expect(Array.isArray(indicators)).toBe(true);
      expect(indicators).toHaveLength(1);

      expect(memory.checkHeap).toHaveBeenCalledTimes(1);
      expect(memory.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        300 * 1024 * 1024,
      );

      // Devuelve el objeto que retorna health.check (mockeado)
      expect(result).toEqual({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });
    });
  });

  describe('readiness', () => {
    it('debe ejecutar db.pingCheck, memory.checkRSS y disk.checkStorage con los parámetros correctos', async () => {
      const result = await controller.readiness();

      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [[indicators]] = healthCheckService.check.mock.calls;
      expect(Array.isArray(indicators)).toBe(true);
      expect(indicators).toHaveLength(3);

      expect(db.pingCheck).toHaveBeenCalledTimes(1);
      expect(db.pingCheck).toHaveBeenCalledWith('database', { timeout: 1500 });

      expect(memory.checkRSS).toHaveBeenCalledTimes(1);
      expect(memory.checkRSS).toHaveBeenCalledWith(
        'memory_rss',
        500 * 1024 * 1024,
      );

      expect(disk.checkStorage).toHaveBeenCalledTimes(1);
      expect(disk.checkStorage).toHaveBeenCalledWith('disk', {
        path: '/',
        thresholdPercent: 0.9,
      });

      // Devuelve el objeto que retorna health.check (mockeado)
      expect(result).toEqual({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });
    });
  });
});
