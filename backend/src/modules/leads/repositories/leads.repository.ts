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

export interface LeadLastInteraction {
  id: string;
  type: string;
  message: string | null;
  createdAt: Date;
}

export interface LeadNextTask {
  id: string;
  type: string;
  title: string;
  dueAt: Date;
}

export type LeadWithRelations = Lead & {
  company: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  development: {
    id: string;
    name: string;
    aiScore: number | null;
    unitsCount: number | null;
  } | null;
  owner: { id: string; name: string; email: string } | null;
  lastInteraction: LeadLastInteraction | null;
  nextTask: LeadNextTask | null;
};

const leadInclude = {
  company: { select: { id: true, name: true, phone: true, email: true } },
  development: {
    select: { id: true, name: true, aiScore: true, unitsCount: true },
  },
  owner: { select: { id: true, name: true, email: true } },
  interactions: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { id: true, type: true, message: true, createdAt: true },
  },
  tasks: {
    where: { completedAt: null },
    orderBy: { dueAt: 'asc' as const },
    take: 1,
    select: { id: true, type: true, title: true, dueAt: true },
  },
} satisfies Prisma.LeadInclude;

type RawLead = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

function toLeadWithRelations(lead: RawLead): LeadWithRelations {
  const { interactions, tasks, ...rest } = lead;
  return {
    ...rest,
    lastInteraction: interactions[0] ?? null,
    nextTask: tasks[0] ?? null,
  };
}

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    options: FindManyLeadsOptions,
  ): Promise<{ data: LeadWithRelations[]; total: number }> {
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
        include: leadInclude,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data: data.map(toLeadWithRelations), total };
  }

  async findById(id: string): Promise<LeadWithRelations | null> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
    return lead ? toLeadWithRelations(lead) : null;
  }

  async create(data: Prisma.LeadCreateInput): Promise<LeadWithRelations> {
    const lead = await this.prisma.lead.create({ data, include: leadInclude });
    return toLeadWithRelations(lead);
  }

  async update(
    id: string,
    data: Prisma.LeadUpdateInput,
  ): Promise<LeadWithRelations> {
    const lead = await this.prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });
    return toLeadWithRelations(lead);
  }
}
