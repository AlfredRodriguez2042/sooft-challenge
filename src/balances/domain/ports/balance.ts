export interface BalanceProps {
  id: string;
  companyId: string;
  currency: string;
  balance_minor: number;
  active: boolean;
}

export interface IBalanceService {
  create(payload: {
    companyId: string;
    currency: string;
    balance_minor: number;
  }): Promise<BalanceProps>;
}
export interface IBalanceRepsoitory {
  create(payload: Omit<BalanceProps, 'id'>): Promise<BalanceProps>;
  findOne(query: any): Promise<BalanceProps | null>;
}

export const BALANCE_SERVICE = Symbol('BALANCE_SERVICE');
export const BALANCE_REPOSITORY = Symbol('BALANCE_REPOSITORY');
