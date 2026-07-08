import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DiscoveredCandidate,
  DiscoveryParams,
  OpportunitySourceProvider,
  SourceStatus,
} from '../interfaces/opportunity-source.interface';

interface PortalListing {
  title: string;
  address?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  url?: string;
}

interface PortalResponse {
  listings: PortalListing[];
}

/**
 * Adaptador genérico para bases imobiliárias. Como cada portal (VivaReal,
 * Zap Imóveis, Loft, etc.) expõe um formato próprio, esta fonte é
 * configurável por variável de ambiente: aponte REAL_ESTATE_PORTAL_BASE_URL
 * para o endpoint do seu provedor e o adaptador assume um contrato
 * { listings: [...] } — troque o parsing por um mapper específico quando
 * integrar um portal real.
 */
@Injectable()
export class RealEstatePortalProvider implements OpportunitySourceProvider {
  private readonly logger = new Logger(RealEstatePortalProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private getConfig() {
    return {
      apiKey: this.configService.get<string>(
        'ingestion.realEstatePortalApiKey',
      ),
      baseUrl: this.configService.get<string>(
        'ingestion.realEstatePortalBaseUrl',
      ),
    };
  }

  getStatus(): SourceStatus {
    const { apiKey, baseUrl } = this.getConfig();
    return {
      key: 'real_estate_portal',
      name: 'Base imobiliária',
      configured: Boolean(apiKey && baseUrl),
      description:
        'Novos lançamentos e anúncios de empreendimentos publicados em portais imobiliários.',
    };
  }

  async discover(params: DiscoveryParams): Promise<DiscoveredCandidate[]> {
    const { apiKey, baseUrl } = this.getConfig();
    if (!apiKey || !baseUrl) return [];

    const url = new URL(
      'listings',
      baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    );
    url.searchParams.set('lat', String(params.latitude));
    url.searchParams.set('lng', String(params.longitude));
    url.searchParams.set('radius_km', String(params.radiusKm));
    url.searchParams.set('api_key', apiKey);

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = (await response.json()) as PortalResponse;

      return (data.listings ?? []).map((listing) => ({
        source: 'real_estate_portal',
        name: listing.title,
        addressLine: listing.address ?? null,
        city: listing.city ?? null,
        state: listing.state ?? null,
        latitude: listing.lat ?? null,
        longitude: listing.lng ?? null,
        url: listing.url ?? null,
      }));
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar base imobiliária: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
