import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiInteractionType, Development } from '@prisma/client';
import OpenAI from 'openai';
import { buildPaginatedResult } from '../../common/dto/paginated-result.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { BuildersRepository } from '../builders/repositories/builders.repository';
import { LeadsRepository } from '../leads/repositories/leads.repository';
import { ProjectsRepository } from '../projects/repositories/projects.repository';
import { ApproachResult } from './dto/approach-result.dto';
import { ChatDto } from './dto/chat.dto';
import { CompanyAnalysisResult } from './dto/company-analysis-result.dto';
import {
  ApproachChannel,
  GenerateApproachDto,
} from './dto/generate-approach.dto';
import { LeadClassificationResult } from './dto/lead-classification-result.dto';
import { QueryAiHistoryDto } from './dto/query-ai-history.dto';
import { ScoreResult } from './dto/score-result.dto';

const APPROACH_CHANNEL_TYPE: Record<ApproachChannel, AiInteractionType> = {
  WHATSAPP: 'APPROACH_WHATSAPP',
  EMAIL: 'APPROACH_EMAIL',
  CALL: 'APPROACH_CALL',
};

const APPROACH_INSTRUCTIONS: Record<ApproachChannel, string> = {
  WHATSAPP:
    'Gere uma mensagem de WhatsApp curta (no máximo 4 linhas), tom direto e ' +
    'personalizado, sem saudação formal excessiva, com o objetivo de agendar ' +
    'uma conversa sobre fornecimento de esquadrias (janelas, portas e ' +
    'fachadas). Responda em JSON {"subject": null, "content": string}.',
  EMAIL:
    'Gere um e-mail comercial profissional apresentando a empresa fornecedora ' +
    'de esquadrias e propondo uma reunião, com tom cordial e objetivo. ' +
    'Responda em JSON {"subject": string com o assunto do e-mail, "content": ' +
    'string com o corpo do e-mail}.',
  CALL:
    'Gere um roteiro (script) de ligação telefônica de apresentação: abertura, ' +
    'apresentação da empresa, uma pergunta de qualificação e proposta de ' +
    'próximo passo. Responda em JSON {"subject": null, "content": string}.',
};

@Injectable()
export class AiService {
  private client: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly projectsRepository: ProjectsRepository,
    private readonly buildersRepository: BuildersRepository,
    private readonly leadsRepository: LeadsRepository,
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

  private async askJson<T>(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<T> {
    const client = this.getClient();
    const model = this.configService.get<string>('openai.model')!;

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new ServiceUnavailableException(
        'Não foi possível obter uma resposta da IA',
      );
    }

    return JSON.parse(content) as T;
  }

  private saveHistory(data: {
    tenantId: string;
    userId?: string;
    type: AiInteractionType;
    companyId?: string;
    developmentId?: string;
    leadId?: string;
    prompt?: string;
    response: unknown;
  }) {
    return this.prisma.aiInteraction.create({
      data: {
        tenant: { connect: { id: data.tenantId } },
        user: data.userId ? { connect: { id: data.userId } } : undefined,
        type: data.type,
        company: data.companyId
          ? { connect: { id: data.companyId } }
          : undefined,
        development: data.developmentId
          ? { connect: { id: data.developmentId } }
          : undefined,
        lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
        prompt: data.prompt,
        response: data.response as never,
      },
    });
  }

  async getHistory(query: QueryAiHistoryDto, currentUser: AuthenticatedUser) {
    const { page, pageSize, type, companyId, leadId } = query;

    const where = {
      tenantId: currentUser.tenantId,
      type,
      companyId,
      leadId,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.aiInteraction.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          development: { select: { id: true, name: true } },
          lead: { select: { id: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.aiInteraction.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, pageSize);
  }

  /**
   * Analisa um empreendimento com IA e retorna um score de potencial
   * comercial (0-100) e um resumo executivo, persistindo o resultado.
   */
  async scoreDevelopment(
    developmentId: string,
    currentUser: AuthenticatedUser,
  ) {
    const development = await this.projectsRepository.findById(developmentId);

    if (!development) {
      throw new NotFoundException('Empreendimento não encontrado');
    }

    const prompt = this.buildDevelopmentPrompt(development);

    const result = await this.askJson<ScoreResult>(
      'Você é um analista comercial especialista em identificar oportunidades ' +
        'de venda de esquadrias (janelas, portas e fachadas de alumínio/vidro) ' +
        'para construtoras. Responda sempre em JSON no formato {"score": number ' +
        'de 0 a 100, "summary": string com no máximo 3 frases em português}.',
      prompt,
    );

    const updated = await this.projectsRepository.update(developmentId, {
      aiScore: Math.round(result.score),
      aiSummary: result.summary,
    });

    await this.saveHistory({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      type: 'DEVELOPMENT_SCORE',
      developmentId,
      companyId: development.companyId,
      prompt,
      response: result,
    });

    return updated;
  }

  /**
   * Analisa uma construtora com base no nome, histórico de obras cadastradas
   * e localização, gerando resumo comercial, potencial de compra, perfil da
   * construtora e estratégia de abordagem.
   */
  async analyzeCompany(companyId: string, currentUser: AuthenticatedUser) {
    const company = await this.buildersRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Construtora não encontrada');
    }

    const { data: developments } = await this.projectsRepository.findMany({
      companyId,
      skip: 0,
      take: 20,
    });

    const prompt = this.buildCompanyAnalysisPrompt(company, developments);

    const result = await this.askJson<CompanyAnalysisResult>(
      'Você é um analista comercial especialista em identificar oportunidades ' +
        'de venda de esquadrias (janelas, portas e fachadas de alumínio/vidro) ' +
        'para construtoras. Com base nos dados de uma construtora e seu ' +
        'histórico de obras, responda em JSON no formato {"resumoComercial": ' +
        'string, "potencialCompra": "ALTO" | "MEDIO" | "BAIXO", ' +
        '"perfilConstrutora": string, "estrategiaAbordagem": string}, todos os ' +
        'textos em português.',
      prompt,
    );

    await this.saveHistory({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      type: 'COMPANY_ANALYSIS',
      companyId,
      prompt,
      response: result,
    });

    return result;
  }

  /**
   * Classifica automaticamente a temperatura de um lead (quente/médio/frio)
   * com base na fase e no porte da obra vinculada, atualizando o lead.
   */
  async classifyLead(leadId: string, currentUser: AuthenticatedUser) {
    const lead = await this.leadsRepository.findById(leadId);

    if (!lead || lead.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Lead não encontrado');
    }

    const development = lead.developmentId
      ? await this.projectsRepository.findById(lead.developmentId)
      : null;

    const prompt = this.buildClassificationPrompt(lead, development);

    const result = await this.askJson<LeadClassificationResult>(
      'Você é um especialista em qualificação de leads comerciais para uma ' +
        'empresa fornecedora de esquadrias. Classifique o lead segundo estas ' +
        'regras: lead QUENTE quando a obra é recente, é um grande ' +
        'empreendimento e está na fase ideal para venda de esquadrias ' +
        '(lançamento, fundação ou estrutura); lead MÉDIO quando a obra está em ' +
        'andamento mas fora da janela ideal; lead FRIO quando a oportunidade é ' +
        'baixa (obra pequena, já em acabamento, entregue ou paralisada). ' +
        'Responda em JSON {"temperature": "HOT" | "WARM" | "COLD", ' +
        '"reasoning": string com no máximo 3 frases em português}.',
      prompt,
    );

    const updated = await this.leadsRepository.update(leadId, {
      temperature: result.temperature,
    });

    await this.saveHistory({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      type: 'LEAD_CLASSIFICATION',
      leadId,
      companyId: lead.companyId ?? undefined,
      developmentId: lead.developmentId ?? undefined,
      prompt,
      response: result,
    });

    return { lead: updated, reasoning: result.reasoning };
  }

  /**
   * Gera uma abordagem comercial pronta (WhatsApp, e-mail ou script de
   * ligação) personalizada para um lead.
   */
  async generateApproach(
    leadId: string,
    dto: GenerateApproachDto,
    currentUser: AuthenticatedUser,
  ) {
    const lead = await this.leadsRepository.findById(leadId);

    if (!lead || lead.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Lead não encontrado');
    }

    const development = lead.developmentId
      ? await this.projectsRepository.findById(lead.developmentId)
      : null;
    const company = lead.companyId
      ? await this.buildersRepository.findById(lead.companyId)
      : development
        ? await this.buildersRepository.findById(development.companyId)
        : null;

    const prompt = this.buildApproachPrompt(lead, company, development);

    const result = await this.askJson<ApproachResult>(
      APPROACH_INSTRUCTIONS[dto.channel],
      prompt,
    );

    await this.saveHistory({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      type: APPROACH_CHANNEL_TYPE[dto.channel],
      leadId,
      companyId: lead.companyId ?? undefined,
      developmentId: lead.developmentId ?? undefined,
      prompt,
      response: result,
    });

    return result;
  }

  /**
   * Assistente comercial interno: responde perguntas livres com base num
   * resumo dos leads da equipe e das obras com melhor potencial cadastradas
   * na plataforma.
   */
  async chat(dto: ChatDto, currentUser: AuthenticatedUser) {
    const client = this.getClient();
    const model = this.configService.get<string>('openai.model')!;

    const context = await this.buildAssistantContext(
      currentUser,
      dto.companyId,
      dto.leadId,
    );

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Você é o assistente comercial interno da Radar Construtora IA, ' +
            'uma plataforma que ajuda fábricas de esquadrias a encontrar ' +
            'construtoras e obras com potencial de venda. Use os dados a ' +
            'seguir para responder de forma objetiva e prática, em português. ' +
            'Se não houver dados suficientes, diga isso claramente em vez de ' +
            `inventar informações.\n\n${context}`,
        },
        ...(dto.history ?? []).map((turn) => ({
          role: turn.role,
          content: turn.content,
        })),
        { role: 'user' as const, content: dto.message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ??
      'Não consegui gerar uma resposta agora. Tente novamente.';

    await this.saveHistory({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      type: 'CHAT',
      companyId: dto.companyId,
      leadId: dto.leadId,
      prompt: dto.message,
      response: { reply },
    });

    return { reply };
  }

  private async buildAssistantContext(
    currentUser: AuthenticatedUser,
    companyId?: string,
    leadId?: string,
  ): Promise<string> {
    const { data: leads } = await this.leadsRepository.findMany({
      tenantId: currentUser.tenantId,
      skip: 0,
      take: 25,
    });

    const leadsSummary = leads.length
      ? leads
          .map(
            (lead) =>
              `- ${lead.development?.name ?? lead.company?.name ?? 'Lead sem obra vinculada'}` +
              ` | construtora: ${lead.company?.name ?? '—'}` +
              ` | temperatura: ${lead.temperature}` +
              ` | status: ${lead.commercialStatus}` +
              (lead.notes ? ` | notas: ${lead.notes}` : ''),
          )
          .join('\n')
      : 'Nenhum lead cadastrado ainda.';

    const topDevelopments = await this.prisma.development.findMany({
      where: { aiScore: { not: null } },
      orderBy: { aiScore: 'desc' },
      take: 10,
      include: { company: { select: { name: true } } },
    });

    const developmentsSummary = topDevelopments.length
      ? topDevelopments
          .map(
            (development) =>
              `- ${development.name} (${development.company.name}) | ` +
              `cidade: ${development.city ?? '—'} | status: ${development.status} | ` +
              `nota IA: ${development.aiScore}/100`,
          )
          .join('\n')
      : 'Nenhum empreendimento com nota de IA calculada ainda.';

    const sections = [
      `Leads da equipe (mais recentes primeiro):\n${leadsSummary}`,
      `Empreendimentos com melhor nota de IA na plataforma:\n${developmentsSummary}`,
    ];

    if (companyId) {
      const company = await this.buildersRepository.findById(companyId);
      const { data: developments } = await this.projectsRepository.findMany({
        companyId,
        skip: 0,
        take: 10,
      });
      sections.push(
        `Construtora em foco: ${company?.name ?? companyId}\n` +
          `Obras: ${developments.map((d) => `${d.name} (${d.status})`).join(', ') || 'nenhuma cadastrada'}`,
      );
    }

    if (leadId) {
      const lead = await this.leadsRepository.findById(leadId);
      if (lead) {
        sections.push(
          `Lead em foco: ${lead.development?.name ?? lead.company?.name ?? lead.id}, ` +
            `temperatura ${lead.temperature}, status ${lead.commercialStatus}, ` +
            `notas: ${lead.notes ?? '—'}`,
        );
      }
    }

    return sections.join('\n\n');
  }

  private buildDevelopmentPrompt(development: {
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

  private buildCompanyAnalysisPrompt(
    company: {
      name: string;
      city: string | null;
      state: string | null;
    },
    developments: Development[],
  ): string {
    const historico = developments.length
      ? developments
          .map(
            (d) =>
              `- ${d.name}: status ${d.status}, padrão ${d.standard}, ` +
              `${d.floorsCount ?? '?'} pavimentos, ${d.unitsCount ?? '?'} unidades, ` +
              `início ${d.startDate?.toISOString().slice(0, 10) ?? 'não informado'}`,
          )
          .join('\n')
      : 'Nenhuma obra cadastrada até o momento.';

    return [
      `Nome da construtora: ${company.name}`,
      `Localização: ${company.city ?? '?'} - ${company.state ?? '?'}`,
      `Quantidade de obras cadastradas (histórico): ${developments.length}`,
      'Obras:',
      historico,
      '',
      'Analise esta construtora como alvo comercial para uma empresa fornecedora de esquadrias.',
    ].join('\n');
  }

  private buildClassificationPrompt(
    lead: {
      commercialStatus: string;
      notes: string | null;
      company: { name: string } | null;
      development: { name: string } | null;
    },
    development: Development | null,
  ): string {
    const lines = [
      `Construtora: ${lead.company?.name ?? 'não informada'}`,
      `Empreendimento: ${lead.development?.name ?? 'não informado'}`,
      `Status comercial atual do lead: ${lead.commercialStatus}`,
      `Notas do lead: ${lead.notes ?? 'nenhuma'}`,
    ];

    if (development) {
      lines.push(
        `Status da obra: ${development.status}`,
        `Padrão: ${development.standard}`,
        `Pavimentos: ${development.floorsCount ?? 'não informado'}`,
        `Unidades: ${development.unitsCount ?? 'não informado'}`,
        `Início da obra: ${development.startDate?.toISOString().slice(0, 10) ?? 'não informado'}`,
      );
    } else {
      lines.push(
        'Este lead não está vinculado a um empreendimento específico.',
      );
    }

    return lines.join('\n');
  }

  private buildApproachPrompt(
    lead: { notes: string | null },
    company: {
      name: string;
      city: string | null;
      state: string | null;
    } | null,
    development: Development | null,
  ): string {
    return [
      `Construtora: ${company?.name ?? 'não informada'}`,
      `Localização: ${company?.city ?? '?'} - ${company?.state ?? '?'}`,
      `Empreendimento: ${development?.name ?? 'não informado'}`,
      `Status da obra: ${development?.status ?? 'não informado'}`,
      `Padrão: ${development?.standard ?? 'não informado'}`,
      `Notas do lead: ${lead.notes ?? 'nenhuma'}`,
      '',
      'Gere a abordagem comercial para o vendedor entrar em contato com esta construtora, apresentando uma empresa fornecedora de esquadrias (janelas, portas e fachadas de alumínio/vidro).',
    ].join('\n');
  }
}
