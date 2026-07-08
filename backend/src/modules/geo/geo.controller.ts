import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NearbySearchDto } from './dto/nearby-search.dto';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('companies/nearby')
  findCompaniesNearby(@Query() query: NearbySearchDto) {
    return this.geoService.findCompaniesNearby(
      query.latitude,
      query.longitude,
      query.radiusKm,
    );
  }

  @Get('developments/nearby')
  findDevelopmentsNearby(@Query() query: NearbySearchDto) {
    return this.geoService.findDevelopmentsNearby(
      query.latitude,
      query.longitude,
      query.radiusKm,
    );
  }
}
