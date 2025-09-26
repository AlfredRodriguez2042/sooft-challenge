import { BalanceAccount } from '../../../domain/models/Balance';
import { BalanceProps } from '../../../domain/ports/balance';
import { BalanceEntity } from '../entities/balance';

export const toDomain = (e: BalanceEntity): BalanceAccount =>
  BalanceAccount.create({
    id: e.id,
    currency: e.currency,
    balance_minor: e.balance_minor, // ← adapta snake → camel
    active: e.active,
    companyId: e.companyId,
  });

export const toEntityProps = (p: Omit<BalanceProps, 'id'>) => ({
  currency: p.currency,
  balance_minor: p.balance_minor,
  active: p.active,
  companyId: p.companyId,
});
