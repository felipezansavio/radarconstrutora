import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { InteractionsRepository } from './repositories/interactions.repository';

@Module({
  imports: [LeadsModule, NotificationsModule],
  controllers: [CrmController],
  providers: [CrmService, InteractionsRepository],
  exports: [CrmService],
})
export class CrmModule {}
