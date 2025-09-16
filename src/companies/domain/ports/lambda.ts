import { CompanyEntity } from '../entities/company';

export type InvocationType = 'RequestResponse' | 'Event' | 'DryRun';

export interface InvokeOptions<TIn = unknown> {
  functionName: string;
  payload?: TIn;
  invocationType?: InvocationType;
  qualifier?: string;
  logType?: 'Tail' | 'None';
  clientContext?: Record<string, any>;
}

export interface InvokeResult<TOut = unknown> {
  statusCode?: number;
  requestId?: string;
  logs: string;
  payload?: TOut;
}

export interface IAwsLambda {
  invoke<TIn = unknown, TOut = unknown>(
    options: InvokeOptions<TIn>,
  ): Promise<InvokeResult<TOut>>;
}
export interface ILambdaClientService {
  execute: (input: Partial<CompanyEntity>) => Promise<void | InvokeResult>;
}

export const AWS_LAMBDA_SERVICE = Symbol('AWS_LAMBDA_SERVICE');
export const AWS_LAMBDA_ADAPTER = Symbol('AWS_LAMBDA_ADAPTER');
