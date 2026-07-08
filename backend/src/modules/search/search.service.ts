import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { GeoService } from '../geo/geo.service';
import { RadiusSearchDto } from './dto/radius-search.dto';
import { SearchRepository } from './repositories/search.repository';

@Injectable()
export class SearchService {
  constructor(
    private readonly geoService: GeoService,
    private readonly searchRepository: SearchRepository,
  ) {}

  async searchByRadius(dto: RadiusSearchDto, currentUser: AuthenticatedUser) {
    const { latitude, longitude, radiusKm, type, status, standard } = dto;

    const [builders, projects] = await Promise.all([
      type === 'projects'
        ? Promise.resolve(undefined)
        : this.geoService.findCompaniesNearby(latitude, longitude, radiusKm),
      type === 'builders'
        ? Promise.resolve(undefined)
        : this.geoService.findDevelopmentsNearby(
            latitude,
            longitude,
            radiusKm,
            { status, standard },
          ),
    ]);

    const resultsCount = (builders?.length ?? 0) + (projects?.length ?? 0);

    await this.searchRepository.logSearch({
      tenant: { connect: { id: currentUser.tenantId } },
      user: { connect: { id: currentUser.userId } },
      latitude,
      longitude,
      radiusKm,
      filters: { type, status, standard },
      resultsCount,
    });

    return { builders, projects, resultsCount };
  }
}
