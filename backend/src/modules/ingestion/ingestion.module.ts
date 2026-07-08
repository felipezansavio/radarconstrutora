import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { BuilderWebsiteProvider } from './providers/builder-website.provider';
import { GoogleMapsProvider } from './providers/google-maps.provider';
import { GooglePlacesProvider } from './providers/google-places.provider';
import { NewsProvider } from './providers/news.provider';
import { RealEstatePortalProvider } from './providers/real-estate-portal.provider';

@Module({
  controllers: [IngestionController],
  providers: [
    IngestionService,
    GooglePlacesProvider,
    GoogleMapsProvider,
    RealEstatePortalProvider,
    NewsProvider,
    BuilderWebsiteProvider,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
