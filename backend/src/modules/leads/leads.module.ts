import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { BuildersModule } from '../builders/builders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadsRepository } from './repositories/leads.repository';

@Module({
  imports: [
    BuildersModule,
    ProjectsModule,
    UsersModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsRepository],
  exports: [LeadsService, LeadsRepository],
})
export class LeadsModule {}
