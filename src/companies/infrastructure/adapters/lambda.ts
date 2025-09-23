import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Injectable } from '@nestjs/common';
import { IAwsLambda, InvokeOptions } from 'src/companies/domain/ports/lambda';

@Injectable()
export class AWSLambdaAdapter implements IAwsLambda {
  constructor(private readonly client: LambdaClient) {}
  async invoke(options: InvokeOptions) {
    const command = new InvokeCommand({
      FunctionName: options.functionName,
      InvocationType: options.invocationType ?? 'RequestResponse',
      LogType: options.logType ?? 'None',
      Payload: JSON.stringify(options.payload),
    });
    try {
      const { LogResult, Payload, StatusCode } =
        await this.client.send(command);
      const result = Buffer.from(Payload!).toString();
      const logs = Buffer.from(LogResult!, 'base64').toString();
      return {
        LambdaName: options.functionName,
        statusCode: StatusCode,
        result,
        logs,
      };
    } catch {
      return {
        statusCode: 500,
        result: '',
        logs: '',
      };
    }
  }
}
