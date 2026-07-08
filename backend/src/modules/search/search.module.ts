import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { SearchRepository } from './repositories/search.repository';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [GeoModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
})
export class SearchModule {}
