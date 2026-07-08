import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('developments/:id/score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Analisa um empreendimento com IA e atualiza seu score de potencial comercial',
  })
  scoreDevelopment(@Param('id') id: string) {
    return this.aiService.scoreDevelopment(id);
  }
}
