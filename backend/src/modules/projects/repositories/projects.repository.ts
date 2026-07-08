import { Injectable } from '@nestjs/common';
import {
  ConstructionStatus,
  Development,
  DevelopmentStandard,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface FindManyProjectsOptions {
  companyId?: string;
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  city?: string;
  state?: string;
  skip: number;
  take: number;
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(
    options: Omit<FindManyProjectsOptions, 'skip' | 'take'>,
  ): Prisma.DevelopmentWhereInput {
    return {
      companyId: options.companyId,
      status: options.status,
      standard: options.standard,
      city: options.city
        ? { equals: options.city, mode: 'insensitive' }
        : undefined,
      state: options.state
        ? { equals: options.state, mode: 'insensitive' }
        : undefined,
    };
  }

  async findMany(
    options: FindManyProjectsOptions,
  ): Promise<{ data: Development[]; total: number }> {
    const where = this.buildWhere(options);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.development.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.development.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<Development | null> {
    return this.prisma.development.findUnique({ where: { id } });
  }

  create(data: Prisma.DevelopmentCreateInput): Promise<Development> {
    return this.prisma.development.create({ data });
  }

  update(
    id: string,
    data: Prisma.DevelopmentUpdateInput,
  ): Promise<Development> {
    return this.prisma.development.update({ where: { id }, data });
  }

  delete(id: string): Promise<Development> {
    return this.prisma.development.delete({ where: { id } });
  }
}
