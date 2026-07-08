import { Module } from '@nestjs/common';
import { BuildersController } from './builders.controller';
import { BuildersService } from './builders.service';
import { BuildersRepository } from './repositories/builders.repository';

@Module({
  controllers: [BuildersController],
  providers: [BuildersService, BuildersRepository],
  exports: [BuildersService, BuildersRepository],
})
export class BuildersModule {}
