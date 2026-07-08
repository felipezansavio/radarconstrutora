import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CrmService } from './crm.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@ApiTags('crm')
@ApiBearerAuth()
@Controller('leads/:leadId/interactions')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  @ApiOperation({ summary: 'Lista o histórico de interações de um lead' })
  findAll(
    @Param('leadId') leadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.crmService.findAllForLead(leadId, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Registra uma nova interação (ligação, e-mail, nota etc.) no lead',
  })
  create(
    @Param('leadId') leadId: string,
    @Body() dto: CreateInteractionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.crmService.create(leadId, dto, user);
  }
}
