import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiscoverQueryDto } from './dto/discover-query.dto';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@ApiBearerAuth()
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
  @ApiOperation({
    summary:
      'Consulta as fontes externas configuradas por candidatos próximos a um ponto',
  })
  discover(@Query() query: DiscoverQueryDto) {
    return this.ingestionService.discoverAll(query);
  }
}
