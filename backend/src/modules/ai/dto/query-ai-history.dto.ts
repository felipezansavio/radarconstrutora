import { ApiPropertyOptional } from '@nestjs/swagger';
import { AiInteractionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsUuidLike } from '../../../common/validators/is-uuid-like.decorator';

export class QueryAiHistoryDto {
  @ApiPropertyOptional({ enum: AiInteractionType })
  @IsOptional()
  @IsEnum(AiInteractionType)
  type?: AiInteractionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  leadId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
