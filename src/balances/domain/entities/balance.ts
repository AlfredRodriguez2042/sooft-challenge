import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('balance')
@Index(['companyId', 'currency'])
export class BalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companyId!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({ type: 'integer', default: 0 })
  balance_minor!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
