import { Module } from '@nestjs/common';
import { BuildersModule } from '../builders/builders.module';
import { LeadsModule } from '../leads/leads.module';
import { ProjectsModule } from '../projects/projects.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ProjectsModule, BuildersModule, LeadsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
