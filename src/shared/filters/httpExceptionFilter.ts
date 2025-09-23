import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

interface IResponse {
  data: any;
  errors: Record<string, string>;
  statusCode: number;
  meta?: Record<string, string>;
}
@Catch(HttpException)
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  constructor(
    private readonly config: ConfigService,
    // @Inject(ClsService)
    private readonly cls: ClsService,
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    // console.log(host);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const requestId =
      (request.headers['x-request-id'] as string) ?? this.cls.getId();
    const correlationId =
      (request.headers['x-correlation-id'] as string) ??
      this.cls.get('x-correlation-id');
    const exceptionData = exception.getResponse() as Record<string, any>;
    const { statusCode, ...rest } = exceptionData;
    const isProd = this.config.get<string>('NEST_ENV')!.includes('prod');

    const errors = isProd
      ? { ...rest }
      : {
          ...rest,
          timestamp: new Date().toISOString(),
          path: request.url,
          stack: exception.stack!,
        };
    const data: IResponse = {
      data: null,
      errors,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      statusCode,
      meta: requestId ? { requestId, correlationId } : undefined,
    };
    this.logger.error(exception);
    response.status(status).json(data);
  }
}
