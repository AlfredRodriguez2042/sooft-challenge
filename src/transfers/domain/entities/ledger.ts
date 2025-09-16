import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ledger_entries')
@Index(['transferId'])
@Index(['accountId'])
export class LedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column('uuid') transferId!: string;
  @Column('uuid') accountId!: string;
  @Column({ type: 'varchar', length: 6 }) kind!: 'DEBIT' | 'CREDIT';
  @Column({ type: 'integer' }) amount_minor!: number;
  @Column({ type: 'varchar', length: 3 }) currency!: string;
}
