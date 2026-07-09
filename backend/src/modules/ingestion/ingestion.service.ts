import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { BuildersRepository } from '../builders/repositories/builders.repository';
import type {
  DiscoveredCandidate,
  DiscoveryParams,
  OpportunitySourceProvider,
  SourceStatus,
} from './interfaces/opportunity-source.interface';
import { BuilderWebsiteProvider } from './providers/builder-website.provider';
import { GoogleMapsProvider } from './providers/google-maps.provider';
import { GooglePlacesProvider } from './providers/google-places.provider';
import { NewsProvider } from './providers/news.provider';
import { RealEstatePortalProvider } from './providers/real-estate-portal.provider';

export interface ImportDiscoveredResult {
  discovered: number;
  imported: number;
  skipped: number;
}

/**
 * Fontes cujos candidatos representam de fato uma construtora/incorporadora
 * nova (segura para virar um cadastro de Company). As demais fontes trazem
 * sinais complementares (endereço, notícias, portais) que não devem virar
 * um registro de construtora automaticamente.
 */
const IMPORTABLE_SOURCES = ['google_places'];

/**
 * Orquestra as fontes externas de descoberta de oportunidades. Cada fonte
 * é independente e opcional — uma fonte não configurada ou indisponível
 * nunca derruba as demais nem o motor de busca interno.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly providers: OpportunitySourceProvider[];

  constructor(
    googlePlaces: GooglePlacesProvider,
    googleMaps: GoogleMapsProvider,
    realEstatePortal: RealEstatePortalProvider,
    news: NewsProvider,
    builderWebsite: BuilderWebsiteProvider,
    private readonly buildersRepository: BuildersRepository,
    private readonly auditService: AuditService,
  ) {
    this.providers = [
      googlePlaces,
      googleMaps,
      realEstatePortal,
      news,
      builderWebsite,
    ];
  }

  getSourcesStatus(): SourceStatus[] {
    return this.providers.map((provider) => provider.getStatus());
  }

  async discoverAll(params: DiscoveryParams): Promise<DiscoveredCandidate[]> {
    const configured = this.providers.filter(
      (provider) => provider.getStatus().configured,
    );

    const results = await Promise.allSettled(
      configured.map((provider) => provider.discover(params)),
    );

    return results.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
  }

  /**
   * Busca candidatos nas fontes externas e cataloga como Company as
   * construtoras genuinamente novas (fontes em IMPORTABLE_SOURCES),
   * evitando duplicar quem já está cadastrado (por nome).
   */
  async importDiscovered(
    params: DiscoveryParams,
    currentUser: { tenantId: string; userId: string },
  ): Promise<ImportDiscoveredResult> {
    const candidates = await this.discoverAll(params);

    const importable = candidates.filter(
      (candidate) =>
        IMPORTABLE_SOURCES.includes(candidate.source) &&
        candidate.latitude !== null &&
        candidate.longitude !== null,
    );

    let imported = 0;

    for (const candidate of importable) {
      const alreadyExists = await this.buildersRepository.existsByName(
        candidate.name,
      );
      if (alreadyExists) continue;

      try {
        await this.buildersRepository.create({
          name: candidate.name,
          addressLine: candidate.addressLine ?? undefined,
          city: candidate.city ?? undefined,
          state: candidate.state ?? undefined,
          latitude: candidate.latitude ?? undefined,
          longitude: candidate.longitude ?? undefined,
          socialLinks: candidate.url
            ? { googleMaps: candidate.url }
            : undefined,
        });
        imported += 1;
      } catch (error) {
        this.logger.warn(
          `Falha ao importar construtora descoberta "${candidate.name}": ${(error as Error).message}`,
        );
      }
    }

    await this.auditService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      action: 'BUILDERS_IMPORTED',
      entity: 'Company',
      newValue: {
        discovered: candidates.length,
        imported,
        source: 'google_places',
        latitude: params.latitude,
        longitude: params.longitude,
        radiusKm: params.radiusKm,
      },
    });

    return {
      discovered: candidates.length,
      imported,
      skipped: importable.length - imported,
    };
  }
}
