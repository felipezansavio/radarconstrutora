import { Injectable } from '@nestjs/common';
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
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
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
   * ordenados do mais próximo para o mais distante.
   */
  async findDevelopmentsNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<NearbyDevelopment[]> {
    return this.prisma.$queryRaw<NearbyDevelopment[]>`
      SELECT
        id,
        name,
        company_id AS "companyId",
        status,
        standard,
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
      ORDER BY "distanceKm" ASC;
    `;
  }
}
