import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('transfers')
@Index(['idempotencyKey'], {
  unique: true,
  where: `"idempotencyKey" IS NOT NULL`,
})
@Index(['debitCompanyId', 'createdAt'])
@Index(['creditCompanyId', 'createdAt'])
export class TransferEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column('uuid') debitAccountId!: string;
  @Column('uuid') creditAccountId!: string;

  @Column('uuid') debitCompanyId!: string;
  @Column('uuid') creditCompanyId!: string;

  @Column({ type: 'varchar', length: 3 }) currency!: string;
  @Column({ type: 'integer' }) amount_minor!: number;
  @Column({ type: 'varchar', length: 12 }) status!:
    | 'PENDING'
    | 'COMPLETED'
    | 'FAILED';
  @Column({ type: 'varchar', nullable: true }) idempotencyKey!: string | null;
  @Column({ type: 'json', nullable: true }) metadata;
  @CreateDateColumn() createdAt!: Date;
}
