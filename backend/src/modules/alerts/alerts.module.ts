import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AlertsController } from './alerts.controller';
import { OpportunityMonitorService } from './opportunity-monitor.service';
import { WhatsappNotifierService } from './whatsapp-notifier.service';

@Module({
  imports: [GeoModule, NotificationsModule, UsersModule, MailModule],
  controllers: [AlertsController],
  providers: [OpportunityMonitorService, WhatsappNotifierService],
  exports: [OpportunityMonitorService],
})
export class AlertsModule {}
