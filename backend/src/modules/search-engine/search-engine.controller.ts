import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { OpportunitiesQueryDto } from './dto/opportunities-query.dto';
import { SearchEngineService } from './search-engine.service';

@ApiTags('opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class SearchEngineController {
  constructor(private readonly searchEngineService: SearchEngineService) {}

  @Get()
  @ApiOperation({
    summary:
      'Motor de busca: encontra e pontua (0-100) oportunidades de venda de esquadrias dentro de um raio',
  })
  findOpportunities(
    @Query() query: OpportunitiesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.searchEngineService.findOpportunities(query, user);
  }
}
