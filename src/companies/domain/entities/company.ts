import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  cuit: number;

  @Column()
  socialNumber: number;

  @Column({ type: 'varchar', length: 20, default: 'CREATED' })
  status!: 'CREATED' | 'JOINED' | 'DISABLED';

  @Column({ type: 'datetime', nullable: true })
  joinedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  disabledAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  statusChangedAt!: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
