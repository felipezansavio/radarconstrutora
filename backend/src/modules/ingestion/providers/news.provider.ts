import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DiscoveredCandidate,
  OpportunitySourceProvider,
  SourceStatus,
} from '../interfaces/opportunity-source.interface';

interface NewsArticle {
  title: string;
  url: string;
  source?: { name?: string };
}

interface NewsResponse {
  status: string;
  articles: NewsArticle[];
}

/**
 * Notícias (padrão NewsAPI.org) sobre lançamentos de empreendimentos e
 * construtoras. APIs de notícias não suportam busca por raio geográfico,
 * então a fonte pesquisa por palavras-chave do setor em português — o
 * resultado serve como sinal complementar (ex.: anúncio de novo
 * lançamento), não como geolocalização precisa.
 */
@Injectable()
export class NewsProvider implements OpportunitySourceProvider {
  private readonly logger = new Logger(NewsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string | undefined {
    return this.configService.get<string>('ingestion.newsApiKey');
  }

  getStatus(): SourceStatus {
    return {
      key: 'news',
      name: 'Notícias do setor',
      configured: Boolean(this.getApiKey()),
      description:
        'Notícias sobre lançamentos de empreendimentos e movimentações de construtoras.',
    };
  }

  /** Busca por palavras-chave não depende de coordenadas — ver nota acima. */
  async discover(): Promise<DiscoveredCandidate[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set(
      'q',
      '"lançamento imobiliário" OR "nova construtora" OR "novo empreendimento"',
    );
    url.searchParams.set('language', 'pt');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('apiKey', apiKey);

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = (await response.json()) as NewsResponse;

      if (data.status !== 'ok') return [];

      return (data.articles ?? []).map((article) => ({
        source: 'news',
        name: article.title,
        addressLine: null,
        city: null,
        state: null,
        latitude: null,
        longitude: null,
        url: article.url,
        raw: { publisher: article.source?.name },
      }));
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar notícias: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
