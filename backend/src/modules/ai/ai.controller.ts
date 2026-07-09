import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { GenerateApproachDto } from './dto/generate-approach.dto';
import { QueryAiHistoryDto } from './dto/query-ai-history.dto';

@ApiTags('ai')
@ApiBearerAuth()
/** Chamadas de IA custam créditos da OpenAI — limite mais estrito que o padrão. */
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('developments/:id/score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Analisa um empreendimento com IA e atualiza seu score de potencial comercial',
  })
  scoreDevelopment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.scoreDevelopment(id, user);
  }

  @Post('companies/:id/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Analisa uma construtora com IA: resumo comercial, potencial de compra, perfil e estratégia de abordagem',
  })
  analyzeCompany(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.analyzeCompany(id, user);
  }

  @Post('leads/:id/classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Classifica automaticamente a temperatura de um lead (quente/médio/frio) com IA',
  })
  classifyLead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.classifyLead(id, user);
  }

  @Post('leads/:id/approach')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Gera uma abordagem comercial (WhatsApp, e-mail ou script de ligação) para um lead',
  })
  generateApproach(
    @Param('id') id: string,
    @Body() dto: GenerateApproachDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.generateApproach(id, dto, user);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conversa com o assistente comercial interno' })
  chat(@Body() dto: ChatDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.chat(dto, user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lista o histórico de análises de IA da empresa' })
  getHistory(
    @Query() query: QueryAiHistoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.getHistory(query, user);
  }
}
