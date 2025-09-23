import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { Observable, map } from 'rxjs';

function getClientIp(req: Request): string | null {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  return (
    xff.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || null
  );
}

@Injectable()
export class HttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpInterceptor.name);
  constructor(private readonly cls: ClsService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { userId: string | null }>();
    const res = http.getResponse<Response>();
    const correlationId =
      req.headers['x-correlation-id'] ?? crypto.randomUUID();
    const ip = getClientIp(req);
    const userId = req.userId;
    this.cls.set('userId', userId);
    this.cls.set('ip', ip);
    res.setHeader('x-request-id', this.cls.getId());
    res.setHeader('x-correlation-id', correlationId);
    const payload = JSON.stringify({
      requestId: this.cls.getId(),
      correlationId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      ip,
      userId,
      ua: req.headers['user-agent'] ?? null,
      data: next.handle(),
    });
    this.logger.log(`succes request by ${payload}`);

    return next.handle().pipe(
      map((data: unknown) => ({
        data: data,
        statusCode: res.statusCode,
        errors: null,
      })),
    );
  }
}
