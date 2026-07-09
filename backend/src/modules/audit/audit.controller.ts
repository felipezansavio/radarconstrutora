import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { buildPaginatedResult } from '../../common/dto/paginated-result.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Lista o histórico de auditoria da empresa (logins e alterações sensíveis) — somente admin',
  })
  async findAll(
    @Query() query: QueryAuditLogsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { page, pageSize, ...filters } = query;

    const { data, total } = await this.auditService.findAllForTenant({
      ...filters,
      tenantId: user.tenantId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return buildPaginatedResult(data, total, page, pageSize);
  }
}
