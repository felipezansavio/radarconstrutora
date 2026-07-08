import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DiscoveredCandidate,
  DiscoveryParams,
  OpportunitySourceProvider,
  SourceStatus,
} from '../interfaces/opportunity-source.interface';

interface GooglePlacesResult {
  name: string;
  vicinity?: string;
  place_id: string;
  geometry?: { location?: { lat: number; lng: number } };
}

interface GooglePlacesResponse {
  status: string;
  results: GooglePlacesResult[];
}

/**
 * Google Places API — Nearby Search por "construtora" / "incorporadora"
 * ao redor do ponto buscado. Descobre empresas que ainda não estão
 * catalogadas na plataforma.
 */
@Injectable()
export class GooglePlacesProvider implements OpportunitySourceProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string | undefined {
    return this.configService.get<string>('ingestion.googlePlacesApiKey');
  }

  getStatus(): SourceStatus {
    return {
      key: 'google_places',
      name: 'Google Places API',
      configured: Boolean(this.getApiKey()),
      description:
        'Descobre construtoras e incorporadoras próximas ainda não cadastradas na plataforma.',
    };
  }

  async discover(params: DiscoveryParams): Promise<DiscoveredCandidate[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    );
    url.searchParams.set('location', `${params.latitude},${params.longitude}`);
    url.searchParams.set(
      'radius',
      String(Math.min(params.radiusKm, 50) * 1000),
    );
    url.searchParams.set('keyword', 'construtora incorporadora');
    url.searchParams.set('key', apiKey);

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = (await response.json()) as GooglePlacesResponse;

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.warn(`Google Places retornou status ${data.status}`);
        return [];
      }

      return (data.results ?? []).map((result) => ({
        source: 'google_places',
        name: result.name,
        addressLine: result.vicinity ?? null,
        city: null,
        state: null,
        latitude: result.geometry?.location?.lat ?? null,
        longitude: result.geometry?.location?.lng ?? null,
        url: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
        raw: { placeId: result.place_id },
      }));
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar Google Places: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
