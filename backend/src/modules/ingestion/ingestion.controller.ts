import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
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

  @Post('import')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Busca construtoras via fontes externas (Google Places) e cadastra as que ainda não estão no catálogo',
  })
  import(
    @Body() dto: DiscoverQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ingestionService.importDiscovered(dto, user);
  }
}
