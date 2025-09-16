import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createBalanceSchema = z.object({
  companyId: z.string().uuid(),
  currency: z.string().length(3),
  balance_minor: z.number().int().min(0),
});
export class CreateBalanceSwaggerDto {
  @ApiProperty({
    example: '7c7dbe45-9db1-4e32-99d6-7e31e7a86b5c',
    description: 'ID of the company (UUID)',
  })
  companyId!: string;

  @ApiProperty({
    example: 'ARS',
    description: 'Currency code (ISO 4217)',
    minLength: 3,
    maxLength: 3,
  })
  currency!: string;

  @ApiProperty({
    example: 100000,
    description: 'Initial balance in minor units (e.g. cents)',
    minimum: 0,
  })
  balance_minor!: number;
}
export type CreateBalanceDto = z.infer<typeof createBalanceSchema>;
