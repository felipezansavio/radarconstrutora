import { Injectable } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface FindManyBuildersOptions {
  city?: string;
  state?: string;
  name?: string;
  skip: number;
  take: number;
}

@Injectable()
export class BuildersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(
    options: Pick<FindManyBuildersOptions, 'city' | 'state' | 'name'>,
  ): Prisma.CompanyWhereInput {
    return {
      city: options.city
        ? { equals: options.city, mode: 'insensitive' }
        : undefined,
      state: options.state
        ? { equals: options.state, mode: 'insensitive' }
        : undefined,
      name: options.name
        ? { contains: options.name, mode: 'insensitive' }
        : undefined,
    };
  }

  async findMany(
    options: FindManyBuildersOptions,
  ): Promise<{ data: Company[]; total: number }> {
    const where = this.buildWhere(options);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { id } });
  }

  findByCnpj(cnpj: string): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { cnpj } });
  }

  create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({ data });
  }

  update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data });
  }

  delete(id: string): Promise<Company> {
    return this.prisma.company.delete({ where: { id } });
  }
}
