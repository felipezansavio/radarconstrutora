import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ProjectsRepository } from '../projects/repositories/projects.repository';
import { ScoreResult } from './dto/score-result.dto';

@Injectable()
export class AiService {
  private client: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  private getClient(): OpenAI {
    const apiKey = this.configService.get<string>('openai.apiKey');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Serviço de IA não configurado. Defina a variável de ambiente OPENAI_API_KEY.',
      );
    }

    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }

    return this.client;
  }

  /**
   * Analisa um empreendimento com IA e retorna um score de potencial
   * comercial (0-100) e um resumo executivo, persistindo o resultado.
   */
  async scoreDevelopment(developmentId: string) {
    const development = await this.projectsRepository.findById(developmentId);

    if (!development) {
      throw new NotFoundException('Empreendimento não encontrado');
    }

    const client = this.getClient();
    const model = this.configService.get<string>('openai.model')!;

    const prompt = this.buildPrompt(development);

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Você é um analista comercial especialista em identificar oportunidades de venda de esquadrias (janelas, portas e fachadas de alumínio/vidro) para construtoras. Responda sempre em JSON no formato {"score": number de 0 a 100, "summary": string com no máximo 3 frases em português}.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new ServiceUnavailableException(
        'Não foi possível obter uma resposta da IA',
      );
    }

    const result = JSON.parse(content) as ScoreResult;

    return this.projectsRepository.update(developmentId, {
      aiScore: Math.round(result.score),
      aiSummary: result.summary,
    });
  }

  private buildPrompt(development: {
    name: string;
    status: string;
    standard: string;
    unitsCount: number | null;
    city: string | null;
    state: string | null;
    deliveryForecast: Date | null;
  }): string {
    return [
      `Empreendimento: ${development.name}`,
      `Status da obra: ${development.status}`,
      `Padrão: ${development.standard}`,
      `Quantidade de unidades: ${development.unitsCount ?? 'não informado'}`,
      `Localização: ${development.city ?? '?'} - ${development.state ?? '?'}`,
      `Previsão de entrega: ${development.deliveryForecast?.toISOString().slice(0, 10) ?? 'não informada'}`,
      '',
      'Avalie o potencial comercial deste empreendimento para uma empresa fornecedora de esquadrias.',
    ].join('\n');
  }
}
