export class DomainError extends Error {
  readonly kind: string;
  constructor(kind: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.kind = kind;
  }
}
export class InactiveAccountError extends DomainError {
  constructor() {
    super('InactiveAccount', 'Cuenta inactiva');
  }
}
export class CurrencyMismatchError extends DomainError {
  constructor() {
    super('CurrencyMismatch', 'Moneda incompatible');
  }
}
export class InsufficientFundsError extends DomainError {
  constructor() {
    super('InsufficientFunds', 'Saldo insuficiente');
  }
}
export class InvalidAccountPropsError extends DomainError {
  constructor(msg: string) {
    super('InvalidAccountProps', msg);
  }
}
export class InvalidPropsError extends DomainError {
  constructor(msg: string) {
    super('InvalidProps', msg);
  }
}
