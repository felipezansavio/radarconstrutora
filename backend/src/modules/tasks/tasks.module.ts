import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { UsersModule } from '../users/users.module';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [LeadsModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
