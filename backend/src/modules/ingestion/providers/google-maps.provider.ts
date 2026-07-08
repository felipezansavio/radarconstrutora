import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DiscoveredCandidate,
  DiscoveryParams,
  OpportunitySourceProvider,
  SourceStatus,
} from '../interfaces/opportunity-source.interface';

interface GeocodeResponse {
  status: string;
  results: { formatted_address: string }[];
}

/**
 * Google Maps Geocoding API — resolve o endereço legível do ponto de
 * busca, usado para enriquecer o rótulo da localização quando o usuário
 * busca apenas por coordenadas. Reaproveita a mesma chave de
 * GOOGLE_MAPS_API_KEY já usada para o mapa (Parte 7).
 */
@Injectable()
export class GoogleMapsProvider implements OpportunitySourceProvider {
  private readonly logger = new Logger(GoogleMapsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string | undefined {
    return this.configService.get<string>('maps.googleMapsApiKey');
  }

  getStatus(): SourceStatus {
    return {
      key: 'google_maps',
      name: 'Google Maps API',
      configured: Boolean(this.getApiKey()),
      description:
        'Geocodificação reversa do ponto de busca para exibir o endereço legível.',
    };
  }

  async discover(params: DiscoveryParams): Promise<DiscoveredCandidate[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${params.latitude},${params.longitude}`);
    url.searchParams.set('key', apiKey);

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = (await response.json()) as GeocodeResponse;

      const formatted = data.results?.[0]?.formatted_address;
      if (data.status !== 'OK' || !formatted) return [];

      return [
        {
          source: 'google_maps',
          name: formatted,
          addressLine: formatted,
          city: null,
          state: null,
          latitude: params.latitude,
          longitude: params.longitude,
          url: null,
        },
      ];
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar Google Maps Geocoding: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
