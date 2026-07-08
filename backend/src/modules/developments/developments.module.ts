import { Module } from '@nestjs/common';
import { DevelopmentsService } from './developments.service';

@Module({
  providers: [DevelopmentsService],
  exports: [DevelopmentsService],
})
export class DevelopmentsModule {}
