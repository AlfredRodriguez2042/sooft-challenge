import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);
  constructor(
    @Inject(ClsService)
    private readonly cls: ClsService,
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

  protected throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { req, res } = this.getRequestResponse(context) as {
      req: Request;
      res: Response;
    };
    const requestId =
      (req.headers['x-request-id'] as string) ??
      this.cls.getId() ??
      crypto.randomUUID();
    const correlationId =
      (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID();
    this.cls.set('x-correlation-id', correlationId);

    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', correlationId);

    res.setHeader('X-RateLimit-Limit', String(detail.limit));
    res.setHeader('X-RateLimit-Remaining', '0');

    if (detail.timeToExpire && detail.timeToExpire > 0) {
      res.setHeader('Retry-After', String(detail.timeToExpire));
      res.setHeader('X-RateLimit-Reset', String(detail.timeToExpire));
    }

    this.logger.log(
      JSON.stringify({
        requestId,
        correlationId,
        path: req.url,
        method: req.method,
        limit: detail.limit,
        ttl: detail.ttl,
        retryAfterSec: detail.timeToExpire ?? null,
      }),
    );

    throw new HttpException(
      {
        message: `Rate limit exceeded. Try again in ${detail.timeToExpire ?? 'N/A'}s.`,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
