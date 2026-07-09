import { Controller, NotFoundException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { OpportunityMonitorService } from './opportunity-monitor.service';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly opportunityMonitorService: OpportunityMonitorService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('scan')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({
    summary:
      'Dispara manualmente o monitoramento de oportunidades para a empresa do usuário logado',
  })
  async runScan(@CurrentUser() user: AuthenticatedUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.opportunityMonitorService.scanTenant(tenant);
  }
}
