import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { SearchEngineController } from './search-engine.controller';
import { SearchEngineService } from './search-engine.service';

@Module({
  imports: [GeoModule],
  controllers: [SearchEngineController],
  providers: [SearchEngineService],
})
export class SearchEngineModule {}
