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
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  status: string;
  standard: string;
  propertyType: string;
  floorsCount: number | null;
  unitsCount: number | null;
  aiScore: number | null;
  aiSummary: string | null;
  addressLine: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: Date | null;
  deliveryForecast: Date | null;
  photos: string[];
  distanceKm: number;
}

export interface NearbyDevelopmentsFilters {
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  minFloors?: number;
  minScore?: number;
  maxScore?: number;
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
      WHERE deleted_at IS NULL
        AND location IS NOT NULL
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
        Prisma.sql`AND d.status = ${filters.status}::"construction_status"`,
      );
    }

    if (filters.standard) {
      conditions.push(
        Prisma.sql`AND d.standard = ${filters.standard}::"development_standard"`,
      );
    }

    if (filters.propertyType) {
      conditions.push(
        Prisma.sql`AND d.property_type = ${filters.propertyType}::"property_type"`,
      );
    }

    if (filters.minFloors) {
      conditions.push(Prisma.sql`AND d.floors_count >= ${filters.minFloors}`);
    }

    if (filters.minScore !== undefined) {
      conditions.push(Prisma.sql`AND d.ai_score >= ${filters.minScore}`);
    }

    if (filters.maxScore !== undefined) {
      conditions.push(Prisma.sql`AND d.ai_score <= ${filters.maxScore}`);
    }

    const extraConditions =
      conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty;

    return this.prisma.$queryRaw<NearbyDevelopment[]>`
      SELECT
        d.id,
        d.name,
        d.company_id AS "companyId",
        c.name AS "companyName",
        c.phone AS "companyPhone",
        c.email AS "companyEmail",
        c.website AS "companyWebsite",
        d.status,
        d.standard,
        d.property_type AS "propertyType",
        d.floors_count AS "floorsCount",
        d.units_count AS "unitsCount",
        d.ai_score AS "aiScore",
        d.ai_summary AS "aiSummary",
        d.address_line AS "addressLine",
        d.neighborhood,
        d.city,
        d.state,
        d.zip_code AS "zipCode",
        d.latitude,
        d.longitude,
        d.start_date AS "startDate",
        d.delivery_forecast AS "deliveryForecast",
        d.photos,
        ST_Distance(
          d.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 AS "distanceKm"
      FROM developments d
      JOIN companies c ON c.id = d.company_id
      WHERE d.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND d.location IS NOT NULL
        AND ST_DWithin(
          d.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusKm} * 1000
        )
        ${extraConditions}
      ORDER BY "distanceKm" ASC;
    `;
  }
}
