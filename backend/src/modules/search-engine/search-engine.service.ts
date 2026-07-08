import { Injectable } from '@nestjs/common';
import type { ConstructionStatus, DevelopmentStandard } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { GeoService } from '../geo/geo.service';
import { OpportunitiesQueryDto } from './dto/opportunities-query.dto';
import {
  OPPORTUNITY_TIER_LABELS,
  scoreOpportunity,
  type OpportunityTier,
  type ScoreReason,
} from './opportunity-scoring.util';

export interface Opportunity {
  developmentId: string;
  name: string;
  companyId: string;
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  status: string;
  standard: string;
  propertyType: string;
  floorsCount: number | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  score: number;
  tier: OpportunityTier;
  tierLabel: string;
  reasons: ScoreReason[];
}

@Injectable()
export class SearchEngineService {
  constructor(
    private readonly geoService: GeoService,
    private readonly prisma: PrismaService,
  ) {}

  async findOpportunities(
    dto: OpportunitiesQueryDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ opportunities: Opportunity[]; resultsCount: number }> {
    const {
      latitude,
      longitude,
      radiusKm,
      status,
      standard,
      propertyType,
      minFloors,
    } = dto;

    const developments = await this.geoService.findDevelopmentsNearby(
      latitude,
      longitude,
      radiusKm,
      { status, standard, propertyType, minFloors },
    );

    const companyIds = [...new Set(developments.map((d) => d.companyId))];
    const companyDevelopmentCounts =
      await this.getCompanyDevelopmentCounts(companyIds);

    const opportunities: Opportunity[] = developments
      .map((development) => {
        const { score, tier, reasons } = scoreOpportunity({
          status: development.status as ConstructionStatus,
          standard: development.standard as DevelopmentStandard,
          floorsCount: development.floorsCount,
          startDate: development.startDate,
          companyDevelopmentsCount:
            companyDevelopmentCounts.get(development.companyId) ?? 0,
          distanceKm: development.distanceKm,
          radiusKm,
        });

        return {
          developmentId: development.id,
          name: development.name,
          companyId: development.companyId,
          companyName: development.companyName,
          companyPhone: development.companyPhone,
          companyEmail: development.companyEmail,
          companyWebsite: development.companyWebsite,
          status: development.status,
          standard: development.standard,
          propertyType: development.propertyType,
          floorsCount: development.floorsCount,
          city: development.city,
          state: development.state,
          latitude: development.latitude,
          longitude: development.longitude,
          distanceKm: development.distanceKm,
          score,
          tier,
          tierLabel: OPPORTUNITY_TIER_LABELS[tier],
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    await this.prisma.search.create({
      data: {
        tenant: { connect: { id: currentUser.tenantId } },
        user: { connect: { id: currentUser.userId } },
        latitude,
        longitude,
        radiusKm,
        filters: {
          engine: 'opportunities',
          status,
          standard,
          propertyType,
          minFloors,
        },
        resultsCount: opportunities.length,
      },
    });

    return { opportunities, resultsCount: opportunities.length };
  }

  private async getCompanyDevelopmentCounts(
    companyIds: string[],
  ): Promise<Map<string, number>> {
    if (companyIds.length === 0) return new Map();

    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, _count: { select: { developments: true } } },
    });

    return new Map(
      companies.map((company) => [company.id, company._count.developments]),
    );
  }
}
