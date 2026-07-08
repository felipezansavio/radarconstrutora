import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { RadiusSearchDto } from './dto/radius-search.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('radius')
  @ApiOperation({
    summary:
      'Busca construtoras e/ou empreendimentos dentro de um raio a partir de um ponto',
  })
  searchByRadius(
    @Query() query: RadiusSearchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.searchService.searchByRadius(query, user);
  }
}
