import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import type {
  ConstructionStatus,
  DevelopmentStandard,
  Tenant,
} from '@prisma/client';
import { CronJob } from 'cron';
import { PrismaService } from '../../database/prisma.service';
import { GeoService, type NearbyDevelopment } from '../geo/geo.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  OPPORTUNITY_TIER_LABELS,
  scoreOpportunity,
  type OpportunityTier,
  type ScoreReason,
} from '../search-engine/opportunity-scoring.util';
import { UsersRepository } from '../users/repositories/users.repository';
import { MailService } from '../mail/mail.service';
import { WhatsappNotifierService } from './whatsapp-notifier.service';

export interface TenantScanResult {
  scanned: number;
  newOpportunities: number;
  notified: number;
}

const CRON_JOB_NAME = 'opportunity-monitor-daily-scan';
const NEARBY_THRESHOLD_KM = 10;

/**
 * Monitoramento automático de oportunidades (Parte 11). Todos os dias,
 * para cada empresa com localização de monitoramento configurada, busca
 * empreendimentos próximos e compara com o que já foi alertado antes —
 * só notifica o que for genuinamente novo.
 */
@Injectable()
export class OpportunityMonitorService implements OnModuleInit {
  private readonly logger = new Logger(OpportunityMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly notificationsService: NotificationsService,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
    private readonly whatsappNotifier: WhatsappNotifierService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'alerts.cronExpression',
    )!;
    const job = new CronJob(cronExpression, () => {
      void this.runDailyScan();
    });
    this.schedulerRegistry.addCronJob(CRON_JOB_NAME, job);
    job.start();
  }

  async runDailyScan(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        alertsEnabled: true,
        monitoringLatitude: { not: null },
        monitoringLongitude: { not: null },
      },
    });

    this.logger.log(
      `Monitoramento diário de oportunidades: ${tenants.length} empresa(s) com alertas ativos`,
    );

    for (const tenant of tenants) {
      try {
        const result = await this.scanTenant(tenant);
        this.logger.log(
          `Empresa ${tenant.id}: ${result.scanned} empreendimento(s) na área, ${result.newOpportunities} novo(s), ${result.notified} notificação(ões) enviada(s)`,
        );
      } catch (error) {
        this.logger.error(
          `Falha ao monitorar oportunidades da empresa ${tenant.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  async scanTenant(tenant: Tenant): Promise<TenantScanResult> {
    if (!tenant.monitoringLatitude || !tenant.monitoringLongitude) {
      return { scanned: 0, newOpportunities: 0, notified: 0 };
    }

    const radiusKm = tenant.monitoringRadiusKm;
    const developments = await this.geoService.findDevelopmentsNearby(
      tenant.monitoringLatitude,
      tenant.monitoringLongitude,
      radiusKm,
      {},
    );

    const alreadyAlerted = await this.getAlertedDevelopmentIds(tenant.id);
    const candidates = developments.filter((d) => !alreadyAlerted.has(d.id));

    if (candidates.length === 0) {
      return { scanned: developments.length, newOpportunities: 0, notified: 0 };
    }

    const companyDevelopmentCounts = await this.getCompanyDevelopmentCounts(
      candidates.map((d) => d.companyId),
    );
    const recipients = await this.getAlertRecipients(tenant.id);

    let notified = 0;

    for (const development of candidates) {
      const { score, tier, reasons } = scoreOpportunity({
        status: development.status as ConstructionStatus,
        standard: development.standard as DevelopmentStandard,
        floorsCount: development.floorsCount,
        startDate: development.startDate,
        companyDevelopmentsCount:
          companyDevelopmentCounts.get(development.companyId) ?? 0,
        distanceKm: development.distanceKm,
        radiusKm,
      });

      if (tier === 'LOW') continue;

      const { title, message } = this.buildAlertCopy(
        development,
        reasons,
        tier,
      );
      const metadata = {
        developmentId: development.id,
        developmentName: development.name,
        companyId: development.companyId,
        companyName: development.companyName,
        distanceKm: development.distanceKm,
        score,
        tier,
        city: development.city,
        state: development.state,
      };

      for (const recipient of recipients) {
        await this.notificationsService.notify({
          tenantId: tenant.id,
          userId: recipient.id,
          type: 'OPPORTUNITY_NEARBY',
          title,
          message,
          metadata,
        });
      }

      if (tenant.email) {
        await this.mailService.send({
          to: tenant.email,
          subject: title,
          text: `${message}\n\nAcesse o Radar Construtora IA para ver os detalhes desta oportunidade.`,
        });
      }

      if (tenant.whatsappNumber) {
        await this.whatsappNotifier.send(
          tenant.whatsappNumber,
          `${title} — ${message}`,
        );
      }

      notified += 1;
    }

    return {
      scanned: developments.length,
      newOpportunities: candidates.length,
      notified,
    };
  }

  private buildAlertCopy(
    development: NearbyDevelopment,
    reasons: ScoreReason[],
    tier: OpportunityTier,
  ): { title: string; message: string } {
    const isPremium = reasons.some(
      (reason) => reason.label === 'Empreendimento de alto padrão',
    );
    const cityLabel = development.city ? ` (${development.city})` : '';

    if (isPremium) {
      return {
        title: 'Construtora iniciou novo empreendimento de alto padrão',
        message: `${development.companyName} — ${development.name}${cityLabel}`,
      };
    }

    if (development.distanceKm <= NEARBY_THRESHOLD_KM) {
      return {
        title: `Nova obra encontrada a ${development.distanceKm.toFixed(1)} km da sua empresa`,
        message: `${development.name} — ${development.companyName}${cityLabel}`,
      };
    }

    return {
      title: `Nova oportunidade identificada: ${OPPORTUNITY_TIER_LABELS[tier]}`,
      message: `${development.name} — ${development.companyName} (${development.distanceKm.toFixed(1)} km)`,
    };
  }

  private async getAlertedDevelopmentIds(
    tenantId: string,
  ): Promise<Set<string>> {
    const notifications = await this.prisma.notification.findMany({
      where: { tenantId, type: 'OPPORTUNITY_NEARBY' },
      select: { metadata: true },
    });

    const ids = new Set<string>();
    for (const notification of notifications) {
      const developmentId = (
        notification.metadata as Record<string, unknown> | null
      )?.developmentId;
      if (typeof developmentId === 'string') ids.add(developmentId);
    }
    return ids;
  }

  private async getCompanyDevelopmentCounts(
    companyIds: string[],
  ): Promise<Map<string, number>> {
    const uniqueIds = [...new Set(companyIds)];
    if (uniqueIds.length === 0) return new Map();

    const companies = await this.prisma.company.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, _count: { select: { developments: true } } },
    });

    return new Map(
      companies.map((company) => [company.id, company._count.developments]),
    );
  }

  private async getAlertRecipients(tenantId: string) {
    const users = await this.usersRepository.findManyByTenant(tenantId);
    const decisionMakers = users.filter(
      (user) => user.role === 'ADMIN' || user.role === 'GESTOR',
    );
    return decisionMakers.length > 0 ? decisionMakers : users;
  }
}
