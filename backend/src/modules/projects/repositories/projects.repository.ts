import { Injectable } from '@nestjs/common';
import {
  ConstructionStatus,
  Development,
  DevelopmentStandard,
  Prisma,
  PropertyType,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface FindManyProjectsOptions {
  companyId?: string;
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  city?: string;
  state?: string;
  skip: number;
  take: number;
}

const projectInclude = {
  company: { select: { id: true, name: true } },
} satisfies Prisma.DevelopmentInclude;

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
      propertyType: options.propertyType,
      city: options.city
        ? { equals: options.city, mode: 'insensitive' }
        : undefined,
      state: options.state
        ? { equals: options.state, mode: 'insensitive' }
        : undefined,
    };
  }

  async findMany(options: FindManyProjectsOptions) {
    const where = this.buildWhere(options);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.development.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
        include: projectInclude,
      }),
      this.prisma.development.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<Development | null> {
    return this.prisma.development.findUnique({
      where: { id },
      include: projectInclude,
    });
  }

  create(data: Prisma.DevelopmentCreateInput) {
    return this.prisma.development.create({
      data,
      include: projectInclude,
    });
  }

  update(id: string, data: Prisma.DevelopmentUpdateInput) {
    return this.prisma.development.update({
      where: { id },
      data,
      include: projectInclude,
    });
  }

  delete(id: string): Promise<Development> {
    return this.prisma.development.delete({ where: { id } });
  }
}
