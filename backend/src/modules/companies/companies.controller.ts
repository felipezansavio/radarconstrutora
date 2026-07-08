import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados da empresa do usuário logado' })
  findOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.findOwn(user.tenantId);
  }

  @Patch('me')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza os dados da empresa (somente admin)' })
  updateOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateOwn(user.tenantId, dto);
  }
}
