import z from 'zod';

export const CreateCompanySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('PYME'),
    socialNumber: z.number().min(2),
    cuit: z.number().min(2),
  }),
  z.object({
    kind: z.literal('CORPORATE'),
    socialNumber: z.number().min(2),
    cuit: z.number().min(2),
  }),
]);

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;
