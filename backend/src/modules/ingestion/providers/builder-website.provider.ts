import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type {
  DiscoveredCandidate,
  DiscoveryParams,
  OpportunitySourceProvider,
  SourceStatus,
} from '../interfaces/opportunity-source.interface';

interface NearbyCompanyWithWebsite {
  id: string;
  name: string;
  website: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Verifica se os sites das construtoras já cadastradas próximas ao ponto
 * de busca estão no ar — um primeiro passo para, futuramente, extrair
 * anúncios de novos lançamentos diretamente do site de cada construtora.
 * Não depende de chave de API (usa os sites já cadastrados na
 * plataforma), então está sempre "configurada".
 */
@Injectable()
export class BuilderWebsiteProvider implements OpportunitySourceProvider {
  private readonly logger = new Logger(BuilderWebsiteProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  getStatus(): SourceStatus {
    return {
      key: 'builder_website',
      name: 'Sites das construtoras',
      configured: true,
      description:
        'Monitora os sites das construtoras já cadastradas para identificar novos lançamentos.',
    };
  }

  async discover(params: DiscoveryParams): Promise<DiscoveredCandidate[]> {
    const companies = await this.prisma.$queryRaw<NearbyCompanyWithWebsite[]>`
      SELECT id, name, website, city, state, latitude, longitude
      FROM companies
      WHERE location IS NOT NULL
        AND website IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)::geography,
          ${params.radiusKm} * 1000
        )
      LIMIT 20;
    `;

    const checks = await Promise.allSettled(
      companies.map((company) => this.checkWebsite(company)),
    );

    return checks
      .filter(
        (result): result is PromiseFulfilledResult<DiscoveredCandidate> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => result.value);
  }

  private async checkWebsite(
    company: NearbyCompanyWithWebsite,
  ): Promise<DiscoveredCandidate | null> {
    try {
      const response = await fetch(company.website, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) return null;

      return {
        source: 'builder_website',
        name: company.name,
        addressLine: null,
        city: company.city,
        state: company.state,
        latitude: company.latitude,
        longitude: company.longitude,
        url: company.website,
        raw: { companyId: company.id, status: response.status },
      };
    } catch (error) {
      this.logger.debug(
        `Site indisponível para ${company.name}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
