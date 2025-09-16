import z from 'zod';

export const TransfersQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    from: z.coerce.date(),
    to: z.coerce.date(),
    sortBy: z.enum(['ASC', 'DESC']).default('DESC'),
    orderField: z
      .enum(['createdAt', 'debitCompanyId', 'creditCompanyId', 'amount_minor'])
      .default('createdAt'),
    cursor: z.string().optional(),
  })
  .refine((d) => d.from <= d.to, {
    message: 'from must be <= to',
    path: ['from'],
  });

export type TransfersQuery = z.infer<typeof TransfersQuerySchema>;

export const CreateTransferSchema = z
  .object({
    amount: z.number(),
    currency: z.enum(['ARS', 'USD']),
    debitAccountId: z.uuid(),
    creditAccountId: z.uuid(),
    idempotencyKey: z.uuid().optional(),
    metadata: z.record(z.any(), z.string()).optional(),
  })
  .refine((d) => d.debitAccountId !== d.creditAccountId, {
    message: 'debitAccountId y creditAccountId no pueden ser iguales',
    path: ['creditAccountId'],
  });

export type CreateTransferDto = z.infer<typeof CreateTransferSchema>;
