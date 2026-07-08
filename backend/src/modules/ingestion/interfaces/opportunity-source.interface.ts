export interface SourceStatus {
  key: string;
  name: string;
  configured: boolean;
  description: string;
}

export interface DiscoveryParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

/** Candidato bruto encontrado por uma fonte externa, ainda não catalogado. */
export interface DiscoveredCandidate {
  source: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  url: string | null;
  raw?: Record<string, unknown>;
}

/**
 * Contrato comum para qualquer fonte externa de oportunidades (Google
 * Places, portais imobiliários, notícias, sites de construtoras, etc.).
 * Cada provider decide sozinho se está configurado; quando não está,
 * `discover` deve resolver para um array vazio em vez de lançar erro —
 * o motor de busca sempre funciona com os dados já cadastrados,
 * as fontes externas apenas o enriquecem quando disponíveis.
 */
export interface OpportunitySourceProvider {
  getStatus(): SourceStatus;
  discover(params: DiscoveryParams): Promise<DiscoveredCandidate[]>;
}
