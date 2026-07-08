import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesRepository } from './repositories/companies.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async findOwn(tenantId: string) {
    const tenant = await this.companiesRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return tenant;
  }

  async updateOwn(tenantId: string, dto: UpdateCompanyDto) {
    await this.findOwn(tenantId);
    return this.companiesRepository.update(tenantId, dto);
  }
}
