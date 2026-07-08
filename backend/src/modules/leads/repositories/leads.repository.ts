import { Injectable } from '@nestjs/common';
import { Lead, LeadStatus, LeadTemperature, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface FindManyLeadsOptions {
  tenantId: string;
  commercialStatus?: LeadStatus;
  temperature?: LeadTemperature;
  companyId?: string;
  developmentId?: string;
  ownerId?: string;
  skip: number;
  take: number;
}

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    options: FindManyLeadsOptions,
  ): Promise<{ data: Lead[]; total: number }> {
    const where: Prisma.LeadWhereInput = {
      tenantId: options.tenantId,
      commercialStatus: options.commercialStatus,
      temperature: options.temperature,
      companyId: options.companyId,
      developmentId: options.developmentId,
      ownerId: options.ownerId,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          development: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        development: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  create(data: Prisma.LeadCreateInput) {
    return this.prisma.lead.create({
      data,
      include: {
        company: { select: { id: true, name: true } },
        development: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  update(id: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true } },
        development: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
