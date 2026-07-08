import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { IsUuidLike } from '../../../common/validators/is-uuid-like.decorator';

export class QueryTasksDto {
  @ApiPropertyOptional({ description: 'Início do período (calendário)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Fim do período (calendário)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskType })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}
