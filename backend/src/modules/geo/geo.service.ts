import { Injectable } from '@nestjs/common';
import {
  ConstructionStatus,
  DevelopmentStandard,
  Prisma,
  PropertyType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface NearbyCompany {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
}

export interface NearbyDevelopment {
  id: string;
  name: string;
  companyId: string;
  status: string;
  standard: string;
  propertyType: string;
  floorsCount: number | null;
  unitsCount: number | null;
  aiScore: number | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
}

export interface NearbyDevelopmentsFilters {
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  minFloors?: number;
}

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca construtoras dentro de um raio (em km) a partir de um ponto,
   * ordenadas da mais próxima para a mais distante.
   */
  async findCompaniesNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<NearbyCompany[]> {
    return this.prisma.$queryRaw<NearbyCompany[]>`
      SELECT
        id,
        name,
        city,
        state,
        latitude,
        longitude,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 AS "distanceKm"
      FROM companies
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusKm} * 1000
        )
      ORDER BY "distanceKm" ASC;
    `;
  }

  /**
   * Busca empreendimentos dentro de um raio (em km) a partir de um ponto,
   * ordenados do mais próximo para o mais distante. Aceita filtros opcionais
   * de status da obra, padrão, tipo de imóvel e número mínimo de pavimentos.
   */
  async findDevelopmentsNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters: NearbyDevelopmentsFilters = {},
  ): Promise<NearbyDevelopment[]> {
    const conditions: Prisma.Sql[] = [];

    if (filters.status) {
      conditions.push(
        Prisma.sql`AND status = ${filters.status}::"construction_status"`,
      );
    }

    if (filters.standard) {
      conditions.push(
        Prisma.sql`AND standard = ${filters.standard}::"development_standard"`,
      );
    }

    if (filters.propertyType) {
      conditions.push(
        Prisma.sql`AND property_type = ${filters.propertyType}::"property_type"`,
      );
    }

    if (filters.minFloors) {
      conditions.push(Prisma.sql`AND floors_count >= ${filters.minFloors}`);
    }

    const extraConditions =
      conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty;

    return this.prisma.$queryRaw<NearbyDevelopment[]>`
      SELECT
        id,
        name,
        company_id AS "companyId",
        status,
        standard,
        property_type AS "propertyType",
        floors_count AS "floorsCount",
        units_count AS "unitsCount",
        ai_score AS "aiScore",
        city,
        state,
        latitude,
        longitude,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 AS "distanceKm"
      FROM developments
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusKm} * 1000
        )
        ${extraConditions}
      ORDER BY "distanceKm" ASC;
    `;
  }
}
