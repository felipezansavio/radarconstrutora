import { Injectable } from '@nestjs/common';
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

/**
 * Orquestra as fontes externas de descoberta de oportunidades. Cada fonte
 * é independente e opcional — uma fonte não configurada ou indisponível
 * nunca derruba as demais nem o motor de busca interno.
 */
@Injectable()
export class IngestionService {
  private readonly providers: OpportunitySourceProvider[];

  constructor(
    googlePlaces: GooglePlacesProvider,
    googleMaps: GoogleMapsProvider,
    realEstatePortal: RealEstatePortalProvider,
    news: NewsProvider,
    builderWebsite: BuilderWebsiteProvider,
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
}
