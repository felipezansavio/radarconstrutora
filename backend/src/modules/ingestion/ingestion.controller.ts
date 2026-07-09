import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { DiscoverQueryDto } from './dto/discover-query.dto';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@ApiBearerAuth()
@Roles('ADMIN', 'GESTOR')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get('sources')
  @ApiOperation({
    summary:
      'Lista as fontes externas de descoberta de oportunidades e se estão configuradas',
  })
  getSources() {
    return this.ingestionService.getSourcesStatus();
  }

  @Get('discover')
  /** Cada chamada aciona provedores externos pagos (Google Places, etc.). */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Consulta as fontes externas configuradas por candidatos próximos a um ponto',
  })
  discover(@Query() query: DiscoverQueryDto) {
    return this.ingestionService.discoverAll(query);
  }
}
