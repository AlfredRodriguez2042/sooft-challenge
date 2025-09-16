import { BadRequestException, Inject, Logger } from '@nestjs/common';
import {
  BALANCE_REPOSITORY,
  BalanceProps,
  IBalanceRepsoitory,
  IBalanceService,
} from '../../domain/ports/balance';

export class BalanceService implements IBalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    @Inject(BALANCE_REPOSITORY) private readonly repository: IBalanceRepsoitory,
  ) {}

  async create(payload: {
    companyId: string;
    currency: string;
    balance_minor: number;
  }): Promise<BalanceProps> {
    this.logger.debug(
      `Creating balance for company=${payload.companyId}, currency=${payload.currency}`,
    );

    const existing = await this.repository.findOne({
      where: {
        companyId: payload.companyId,
        currency: payload.currency,
        active: true,
      },
    });

    if (existing) {
      this.logger.warn(
        `Balance already exists for company=${payload.companyId}, currency=${payload.currency}`,
      );
      throw new BadRequestException(
        'Balance already exists for this company and currency',
      );
    }

    const balance = await this.repository.create({ ...payload, active: true });

    this.logger.log(
      `Balance created successfully with id=${balance.id}, company=${payload.companyId}, currency=${payload.currency}`,
    );

    return balance;
  }
}
