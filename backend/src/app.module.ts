import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DevelopmentsModule } from './modules/developments/developments.module';
import { GeoModule } from './modules/geo/geo.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { AiScoringModule } from './modules/ai-scoring/ai-scoring.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BillingModule } from './modules/billing/billing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
        },
      ],
    }),
    PrismaModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    CompaniesModule,
    DevelopmentsModule,
    GeoModule,
    IngestionModule,
    AiScoringModule,
    LeadsModule,
    ActivitiesModule,
    NotificationsModule,
    BillingModule,
    ReportsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
