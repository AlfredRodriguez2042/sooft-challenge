// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
// import { MigrationsIndicator } from './migrations.indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    // private migrations: MigrationsIndicator,
  ) {}

  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe (proceso vivo)' })
  @ApiOkResponse({
    description: 'Estado liveness',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object', additionalProperties: true },
        error: { type: 'object', additionalProperties: true },
        details: { type: 'object', additionalProperties: true },
      },
      example: {
        status: 'ok',
        info: { memory_heap: { status: 'up' } },
        error: {},
        details: { memory_heap: { status: 'up' } },
      },
    },
  })
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({
    summary:
      'Readiness probe (listo para tráfico: DB, disco, memoria, migraciones)',
  })
  @ApiOkResponse({
    description: 'Estado readiness',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object', additionalProperties: true },
        error: { type: 'object', additionalProperties: true },
        details: { type: 'object', additionalProperties: true },
      },
      examples: {
        ok: {
          value: {
            status: 'ok',
            info: {
              database: { status: 'up' },
              memory_rss: { status: 'up' },
              disk: { status: 'up' },
              migrations: { status: 'up', pending: false },
            },
            error: {},
            details: {
              database: { status: 'up' },
              memory_rss: { status: 'up' },
              disk: { status: 'up' },
              migrations: { status: 'up', pending: false },
            },
          },
        },
        degraded: {
          value: {
            status: 'error',
            info: {
              memory_rss: { status: 'up' },
              disk: { status: 'up' },
            },
            error: {
              database: { status: 'down' },
              migrations: { status: 'down', pending: true },
            },
            details: {
              memory_rss: { status: 'up' },
              disk: { status: 'up' },
              database: { status: 'down' },
              migrations: { status: 'down', pending: true },
            },
          },
        },
      },
    },
  })
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
      // () => this.migrations.isUpToDate(),
    ]);
  }
}
