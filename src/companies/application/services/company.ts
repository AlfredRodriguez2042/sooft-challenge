import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  ICompanyRepository,
  ICompanyService,
  QueryPagination,
} from '../../domain/ports/company';
import { CreateCompanyDto } from '../dtos/company';

@Injectable()
export class CompanyService implements ICompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly repository: ICompanyRepository,
  ) {}

  async findAll(query: QueryPagination) {
    this.logger.debug(`Finding companies with query=${JSON.stringify(query)}`);

    const result = await this.repository.findAllJoined(query);

    this.logger.log(
      `Found ${result.items?.length ?? 0} companies ( limit=${query.limit})`,
    );

    return result;
  }

  async create(input: CreateCompanyDto) {
    this.logger.debug(`Creating company with tipo=${input.kind}`);

    const company = await this.repository.create(input);

    this.logger.log(`Company created successfully with cuit=${input.cuit}`);

    return company;
  }
}
